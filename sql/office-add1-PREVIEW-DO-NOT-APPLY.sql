-- office-add1 PREVIEW. DO NOT APPLY.
-- Do not run this file against Supabase. Do not paste it into the SQL editor.
-- It is the change list for a later, reviewed apply. The Admin preview works without it
-- and shows an empty state when a column or RPC is missing.
--
-- Before any future apply, replace public.office_add1_role() with the live office
-- role helper (the same check admin RPCs already use). Left as written, the helper
-- returns '' and every policy and RPC stays closed.

-- ---------------------------------------------------------------------------
-- Role gate. Closed until it is pointed at the live helper.
-- ---------------------------------------------------------------------------
create or replace function public.office_add1_role()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select ''::text;
$$;

revoke all on function public.office_add1_role() from public;
revoke all on function public.office_add1_role() from anon;
grant execute on function public.office_add1_role() to authenticated;

-- ---------------------------------------------------------------------------
-- 1. Weekly repeat on the existing slot-pattern table, if that table is present.
--    Confirm the live table name before applying. The UI calls
--    admin_set_shift_repeat and also reads repeat_weekly / repeat_until
--    from list_schedule_week slots.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.schedule_slot_patterns') is not null then
    alter table public.schedule_slot_patterns
      add column if not exists repeat_weekly boolean not null default false,
      add column if not exists repeat_until date,
      add column if not exists series_id uuid;
  end if;
end $$;

create or replace function public.admin_set_shift_repeat(
  p_client_id uuid,
  p_slot_key text,
  p_weekdays int[],
  p_until date,
  p_start_local text,
  p_end_local text,
  p_usual_aide_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.office_add1_role() not in ('admin', 'scheduler', 'Admin', 'Scheduler') then
    raise exception 'office_add1 repeat is not enabled' using errcode = '42501';
  end if;
  if to_regclass('public.schedule_slot_patterns') is null then
    raise exception 'schedule_slot_patterns is not present' using errcode = '42P01';
  end if;
  update public.schedule_slot_patterns
     set repeat_weekly = true,
         repeat_until = p_until,
         series_id = coalesce(series_id, gen_random_uuid())
   where client_id = p_client_id
     and slot_key = p_slot_key
     and weekday = any (p_weekdays);
  return jsonb_build_object('ok', true, 'repeat_weekly', true, 'repeat_until', p_until);
end;
$$;

revoke all on function public.admin_set_shift_repeat(uuid, text, int[], date, text, text, uuid) from public;
revoke all on function public.admin_set_shift_repeat(uuid, text, int[], date, text, text, uuid) from anon;
grant execute on function public.admin_set_shift_repeat(uuid, text, int[], date, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. On-call aides. Optional column. The UI also reads on_call / is_on_call
--    from the aide roster it already has.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.aides') is not null then
    alter table public.aides
      add column if not exists on_call boolean not null default false;
  elsif to_regclass('public.profiles') is not null then
    alter table public.profiles
      add column if not exists on_call boolean not null default false;
  end if;
end $$;

create or replace function public.admin_list_on_call_aides()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.office_add1_role() not in ('admin', 'scheduler', 'Admin', 'Scheduler') then
    raise exception 'office_add1 on-call list is not enabled' using errcode = '42501';
  end if;
  return jsonb_build_object('ok', true, 'aides', '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_on_call_aides() from public;
revoke all on function public.admin_list_on_call_aides() from anon;
grant execute on function public.admin_list_on_call_aides() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Visit clock-in distance and "mark as checked".
--    Timesheet day JSON already carries distanceFt / distanceMi when GPS
--    was stored. This table is only for visits that are not on a timesheet
--    day, and for a durable checked flag. The caregiver timesheet is not
--    altered by this table.
-- ---------------------------------------------------------------------------
create table if not exists public.visit_clock_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  visit_key text not null,
  client_id uuid,
  aide_id uuid,
  on_date date,
  clock_in text,
  clock_lat double precision,
  clock_lng double precision,
  client_lat double precision,
  client_lng double precision,
  distance_ft numeric,
  checked_at timestamptz,
  checked_by uuid,
  created_at timestamptz not null default now(),
  unique (org_id, visit_key)
);

alter table public.visit_clock_reviews enable row level security;
revoke all on table public.visit_clock_reviews from public;
revoke all on table public.visit_clock_reviews from anon;
revoke all on table public.visit_clock_reviews from authenticated;

-- No SELECT/INSERT/UPDATE policies on purpose. Access is only through the
-- RPCs below, and those RPCs refuse everyone until office_add1_role() is
-- replaced with the live Admin/Scheduler check.

create or replace function public.admin_list_office_visits(p_on_date date)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.office_add1_role() not in ('admin', 'scheduler', 'Admin', 'Scheduler') then
    raise exception 'office_add1 visits are not enabled' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'ok', true,
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.visit_key,
        'client_id', r.client_id,
        'aide_id', r.aide_id,
        'on_date', r.on_date,
        'clock_in', r.clock_in,
        'distance_ft', r.distance_ft,
        'clock_lat', r.clock_lat,
        'clock_lng', r.clock_lng,
        'client_lat', r.client_lat,
        'client_lng', r.client_lng,
        'checked_at', r.checked_at
      ))
      from public.visit_clock_reviews r
      where p_on_date is null or r.on_date = p_on_date
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_mark_visit_checked(p_visit_id text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  n int;
begin
  if public.office_add1_role() not in ('admin', 'scheduler', 'Admin', 'Scheduler') then
    raise exception 'office_add1 mark-checked is not enabled' using errcode = '42501';
  end if;
  update public.visit_clock_reviews
     set checked_at = now(),
         checked_by = auth.uid()
   where visit_key = p_visit_id
     and checked_at is null;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'updated', n);
end;
$$;

revoke all on function public.admin_list_office_visits(date) from public;
revoke all on function public.admin_list_office_visits(date) from anon;
grant execute on function public.admin_list_office_visits(date) to authenticated;

revoke all on function public.admin_mark_visit_checked(text) from public;
revoke all on function public.admin_mark_visit_checked(text) from anon;
grant execute on function public.admin_mark_visit_checked(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Supervisory visit due date. The UI already reads get_supervisory_compliance
--    and list_supervisory_contacts. These columns are optional extras so a
--    client can store the last in-home visit without scanning contacts.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.clients') is not null then
    alter table public.clients
      add column if not exists last_supervisory_visit date,
      add column if not exists next_supervisory_due date;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Pay rates. Admin only. Scheduler is refused. Do not grant table access.
-- ---------------------------------------------------------------------------
create table if not exists public.aide_pay_rates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  aide_id uuid not null,
  hourly_rate numeric(10,2) not null check (hourly_rate >= 0),
  holiday_multiplier numeric(4,2) not null default 1.50,
  effective_on date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.aide_pay_rates enable row level security;
revoke all on table public.aide_pay_rates from public;
revoke all on table public.aide_pay_rates from anon;
revoke all on table public.aide_pay_rates from authenticated;

create or replace function public.admin_list_aide_pay_rates()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.office_add1_role() not in ('admin', 'Admin') then
    raise exception 'pay rates are Admin only' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'ok', true,
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'aide_id', r.aide_id,
        'hourly_rate', r.hourly_rate,
        'holiday_multiplier', r.holiday_multiplier,
        'effective_on', r.effective_on
      ))
      from public.aide_pay_rates r
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_list_aide_pay_rates() from public;
revoke all on function public.admin_list_aide_pay_rates() from anon;
grant execute on function public.admin_list_aide_pay_rates() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Missed visits. Optional. The UI already reads schedule slot mark = missed
--    from list_schedule_week. This RPC is only needed for a range outside
--    the week that is already loaded.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_missed_visits(p_start date, p_end date)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.office_add1_role() not in ('admin', 'scheduler', 'Admin', 'Scheduler') then
    raise exception 'office_add1 missed visits are not enabled' using errcode = '42501';
  end if;
  return jsonb_build_object('ok', true, 'rows', '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_missed_visits(date, date) from public;
revoke all on function public.admin_list_missed_visits(date, date) from anon;
grant execute on function public.admin_list_missed_visits(date, date) to authenticated;

-- Holiday names and the 1.5x label are computed in the portal. No holiday table.
-- list_schedule_week should pass through repeat_weekly, repeat_until, clock_in,
-- and open_shift_id on each slot when those columns exist. No change to the
-- caregiver timesheet or the timesheet PDF.
