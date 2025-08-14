-- rd_client_* overrides, effective views, and RPCs

-- 1) Activity-level overrides
create table if not exists rd_client_activity_overrides (
  id uuid primary key default gen_random_uuid(),
  business_year_id uuid not null references rd_business_years(id) on delete cascade,
  activity_id uuid not null references rd_research_activities(id) on delete cascade,
  practice_percent_override numeric(5,2) not null check (practice_percent_override >= 0 and practice_percent_override <= 100),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_year_id, activity_id)
);

-- 2) Step-level overrides
create table if not exists rd_client_step_overrides (
  id uuid primary key default gen_random_uuid(),
  business_year_id uuid not null references rd_business_years(id) on delete cascade,
  step_id uuid not null references rd_research_steps(id) on delete cascade,
  time_percentage_override numeric(5,2) not null check (time_percentage_override >= 0 and time_percentage_override <= 100),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_year_id, step_id)
);

-- 3) Subcomponent-level overrides
create table if not exists rd_client_subcomponent_overrides (
  id uuid primary key default gen_random_uuid(),
  business_year_id uuid not null references rd_business_years(id) on delete cascade,
  subcomponent_id uuid not null references rd_research_subcomponents(id) on delete cascade,
  frequency_percentage_override numeric(5,2) not null check (frequency_percentage_override >= 0 and frequency_percentage_override <= 100),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_year_id, subcomponent_id)
);

-- updated_at trigger helper
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_rd_client_activity_overrides_u before update on rd_client_activity_overrides
for each row execute function set_updated_at();
create trigger trg_rd_client_step_overrides_u before update on rd_client_step_overrides
for each row execute function set_updated_at();
create trigger trg_rd_client_subcomponent_overrides_u before update on rd_client_subcomponent_overrides
for each row execute function set_updated_at();

-- Effective views
create or replace view rd_client_effective_activities as
select sa.business_year_id, sa.activity_id,
       coalesce(o.practice_percent_override, sa.practice_percent) as practice_percent
from rd_selected_activities sa
left join rd_client_activity_overrides o
  on o.business_year_id = sa.business_year_id and o.activity_id = sa.activity_id;

create or replace view rd_client_effective_steps as
select ss.business_year_id, ss.step_id,
       coalesce(o.time_percentage_override, ss.time_percentage) as time_percentage
from rd_selected_steps ss
left join rd_client_step_overrides o
  on o.business_year_id = ss.business_year_id and o.step_id = ss.step_id;

create or replace view rd_client_effective_subcomponents as
select ssc.business_year_id, ssc.subcomponent_id,
       coalesce(o.frequency_percentage_override, ssc.frequency_percentage) as frequency_percentage
from rd_selected_subcomponents ssc
left join rd_client_subcomponent_overrides o
  on o.business_year_id = ssc.business_year_id and o.subcomponent_id = ssc.subcomponent_id;

-- Upsert RPCs
create or replace function rd_client_upsert_activity_override(p_business_year_id uuid, p_activity_id uuid, p_value numeric, p_user uuid)
returns void language sql as $$
insert into rd_client_activity_overrides(business_year_id, activity_id, practice_percent_override, created_by)
values (p_business_year_id, p_activity_id, p_value, p_user)
on conflict (business_year_id, activity_id) do update
set practice_percent_override = excluded.practice_percent_override, updated_at = now(), created_by = coalesce(rd_client_activity_overrides.created_by, excluded.created_by);
$$;

create or replace function rd_client_upsert_step_override(p_business_year_id uuid, p_step_id uuid, p_value numeric, p_user uuid)
returns void language sql as $$
insert into rd_client_step_overrides(business_year_id, step_id, time_percentage_override, created_by)
values (p_business_year_id, p_step_id, p_value, p_user)
on conflict (business_year_id, step_id) do update
set time_percentage_override = excluded.time_percentage_override, updated_at = now(), created_by = coalesce(rd_client_step_overrides.created_by, excluded.created_by);
$$;

create or replace function rd_client_upsert_subcomponent_override(p_business_year_id uuid, p_sub_id uuid, p_value numeric, p_user uuid)
returns void language sql as $$
insert into rd_client_subcomponent_overrides(business_year_id, subcomponent_id, frequency_percentage_override, created_by)
values (p_business_year_id, p_sub_id, p_value, p_user)
on conflict (business_year_id, subcomponent_id) do update
set frequency_percentage_override = excluded.frequency_percentage_override, updated_at = now(), created_by = coalesce(rd_client_subcomponent_overrides.created_by, excluded.created_by);
$$;

-- Diff summary and merge RPCs
create or replace function rd_client_diff_summary(p_business_year_id uuid)
returns json language plpgsql as $$
declare result json;
begin
  with
  a as (
    select sa.activity_id,
           ra.title as activity_name,
           sa.practice_percent as admin_value,
           o.practice_percent_override as client_value
    from rd_selected_activities sa
    left join rd_client_activity_overrides o
      on o.business_year_id = sa.business_year_id and o.activity_id = sa.activity_id
    left join rd_research_activities ra on ra.id = sa.activity_id
    where sa.business_year_id = p_business_year_id and o.practice_percent_override is distinct from sa.practice_percent
  ),
  s as (
    select ss.step_id,
           rs.name as step_name,
           ss.time_percentage as admin_value,
           o.time_percentage_override as client_value
    from rd_selected_steps ss
    left join rd_client_step_overrides o
      on o.business_year_id = ss.business_year_id and o.step_id = ss.step_id
    left join rd_research_steps rs on rs.id = ss.step_id
    where ss.business_year_id = p_business_year_id and o.time_percentage_override is distinct from ss.time_percentage
  ),
  sc as (
    select ssc.subcomponent_id,
           rsc.name as subcomponent_name,
           ssc.frequency_percentage as admin_value,
           o.frequency_percentage_override as client_value
    from rd_selected_subcomponents ssc
    left join rd_client_subcomponent_overrides o
      on o.business_year_id = ssc.business_year_id and o.subcomponent_id = ssc.subcomponent_id
    left join rd_research_subcomponents rsc on rsc.id = ssc.subcomponent_id
    where ssc.business_year_id = p_business_year_id and o.frequency_percentage_override is distinct from ssc.frequency_percentage
  )
  select json_build_object(
    'activities', coalesce(json_agg(a.*) filter (where a.activity_id is not null), '[]'::json),
    'steps',      coalesce((select json_agg(s.*) from s), '[]'::json),
    'subs',       coalesce((select json_agg(sc.*) from sc), '[]'::json)
  ) into result
  from a;
  return coalesce(result, json_build_object('activities','[]','steps','[]','subs','[]'));
end $$;

create or replace function rd_client_merge_overrides(p_business_year_id uuid, p_actor uuid)
returns void language plpgsql as $$
begin
  update rd_selected_activities sa
  set practice_percent = o.practice_percent_override, updated_at = now()
  from rd_client_activity_overrides o
  where sa.business_year_id = p_business_year_id and o.business_year_id = sa.business_year_id and o.activity_id = sa.activity_id;

  update rd_selected_steps ss
  set time_percentage = o.time_percentage_override, updated_at = now()
  from rd_client_step_overrides o
  where ss.business_year_id = p_business_year_id and o.business_year_id = ss.business_year_id and o.step_id = ss.step_id;

  update rd_selected_subcomponents ssc
  set frequency_percentage = o.frequency_percentage_override, updated_at = now()
  from rd_client_subcomponent_overrides o
  where ssc.business_year_id = p_business_year_id and o.business_year_id = ssc.business_year_id and o.subcomponent_id = ssc.subcomponent_id;
end $$;


