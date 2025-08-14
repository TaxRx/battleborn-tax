-- Global settings and credits for referral bonuses

create table if not exists rd_referral_settings (
  id int primary key default 1,
  default_bonus_amount numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

insert into rd_referral_settings(id, default_bonus_amount)
values (1, 0)
on conflict (id) do nothing;

create table if not exists rd_referral_client_overrides (
  client_id uuid primary key references clients(id) on delete cascade,
  bonus_amount numeric(12,2) not null check (bonus_amount >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists rd_referral_credits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  referral_id uuid not null references rd_referrals(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  applied_to_business_year_id uuid references rd_business_years(id) on delete set null,
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function rd_effective_referral_bonus(p_client_id uuid)
returns numeric language sql as $$
  select coalesce(
    (select bonus_amount from rd_referral_client_overrides where client_id = p_client_id),
    (select default_bonus_amount from rd_referral_settings where id = 1),
    0
  );
$$;

-- Update referral status; on engage, award credit once
create or replace function rd_update_referral_status_and_award(p_referral_id uuid, p_status text)
returns void language plpgsql as $$
declare v_referrer uuid; v_existing int; v_amount numeric;
begin
  update rd_referrals set status = p_status, updated_at = now() where id = p_referral_id;
  if p_status = 'engaged' then
    select referrer_client_id into v_referrer from rd_referrals where id = p_referral_id;
    select count(*) into v_existing from rd_referral_credits where referral_id = p_referral_id;
    if v_existing = 0 then
      select rd_effective_referral_bonus(v_referrer) into v_amount;
      insert into rd_referral_credits(client_id, referral_id, amount) values (v_referrer, p_referral_id, v_amount);
    end if;
  end if;
end;
$$;

create or replace function rd_apply_referral_credit(p_credit_id uuid, p_business_year_id uuid)
returns void language sql as $$
  update rd_referral_credits
  set applied_to_business_year_id = p_business_year_id, applied_at = now()
  where id = p_credit_id;
$$;

create or replace view rd_client_referral_credits_summary as
select c.id as client_id,
       sum(case when rc.applied_at is null then rc.amount else 0 end) as unapplied_total,
       sum(case when rc.applied_at is not null then rc.amount else 0 end) as applied_total
from clients c
left join rd_referral_credits rc on rc.client_id = c.id
group by c.id;


