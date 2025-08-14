-- Referrals schema: clients submit referrals; admins track and update status
-- Tables: rd_referrals, rd_referrals_view (with referrer info)

create table if not exists rd_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_client_id uuid not null references clients(id) on delete cascade,
  business_id uuid null references rd_businesses(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  practice_name text,
  notes text,
  status text not null default 'referred' check (status in ('referred','engaged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rd_referrals_referrer on rd_referrals(referrer_client_id);

-- Update trigger
create or replace function trigger_set_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp_rd_referrals on rd_referrals;
create trigger set_timestamp_rd_referrals before update on rd_referrals for each row execute function trigger_set_timestamp();

-- View with referrer info (email/name)
create or replace view rd_referrals_view as
select r.*, p.email as referrer_email, coalesce(p.full_name, p.first_name || ' ' || p.last_name) as referrer_name
from rd_referrals r
left join profiles p on p.client_id = r.referrer_client_id;

-- Simple RPC to insert referrals (for row-level policies compatibility if needed)
create or replace function rd_create_referral(
  p_referrer_client_id uuid,
  p_business_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_practice text,
  p_notes text
) returns uuid language sql as $$
  insert into rd_referrals(referrer_client_id, business_id, name, email, phone, practice_name, notes)
  values (p_referrer_client_id, p_business_id, p_name, p_email, nullif(p_phone,''), nullif(p_practice,''), nullif(p_notes,''))
  returning id;
$$;

-- Optional: RPC to update status
create or replace function rd_update_referral_status(p_id uuid, p_status text)
returns void language sql as $$
  update rd_referrals set status = p_status, updated_at = now() where id = p_id;
$$;


