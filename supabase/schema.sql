-- HRFlow MVP schema. Run once in Supabase Dashboard > SQL Editor.
create table if not exists public.hrflow_meta (
  id integer primary key check (id = 1),
  revision bigint not null default 0
);
insert into public.hrflow_meta (id, revision) values (1, 0) on conflict (id) do nothing;

create table if not exists public.employees (
  id text primary key, username text not null, "firstName" text not null, "lastName" text not null,
  email text not null, phone text not null default '', department text not null, position text not null,
  role text not null, status text not null, "hireDate" date not null,
  "annualBalance" numeric not null default 0, "sickBalance" numeric not null default 0,
  "personalBalance" numeric not null default 0, salt text not null, "passwordHash" text not null,
  "createdAt" timestamptz not null default now()
);
create table if not exists public.users (
  id text primary key, "employeeId" text not null references public.employees(id) on delete cascade,
  username text not null unique, email text not null unique, role text not null, status text not null,
  salt text not null, "passwordHash" text not null, "sessionVersion" integer not null default 0
);
create table if not exists public.departments (id text primary key, name text not null, status text not null);
create table if not exists public.positions (id text primary key, name text not null, status text not null);
create table if not exists public."leaveTypes" (
  id text primary key, name text not null, "balanceField" text not null, status text not null
);
create table if not exists public.shifts (
  id text primary key, name text not null, "startTime" time not null, "endTime" time not null, status text not null
);
create table if not exists public."leaveRequests" (
  id text primary key, "employeeId" text not null references public.employees(id),
  "leaveTypeId" text not null references public."leaveTypes"(id), "startDate" date not null,
  "endDate" date not null, days integer not null, reason text not null, status text not null,
  "submittedAt" timestamptz not null, "reviewedAt" timestamptz,
  "reviewedBy" text references public.users(id), "rejectionReason" text
);
create table if not exists public.schedules (
  id text primary key, "employeeId" text not null references public.employees(id),
  "shiftId" text not null references public.shifts(id), "workDate" date not null,
  status text not null, "createdAt" timestamptz not null, "updatedAt" timestamptz
);
create table if not exists public.notifications (
  id text primary key, "userId" text not null references public.users(id) on delete cascade,
  type text not null, title text not null, message text not null,
  "createdAt" timestamptz not null, "isRead" boolean not null default false
);

create or replace function public.hrflow_read_state()
returns jsonb language sql security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'revision', m.revision,
    'data', jsonb_build_object(
      'users', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.users t), '[]'::jsonb),
      'employees', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.employees t), '[]'::jsonb),
      'departments', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.departments t), '[]'::jsonb),
      'positions', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.positions t), '[]'::jsonb),
      'leaveTypes', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public."leaveTypes" t), '[]'::jsonb),
      'shifts', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.shifts t), '[]'::jsonb),
      'leaveRequests', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public."leaveRequests" t), '[]'::jsonb),
      'schedules', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.schedules t), '[]'::jsonb),
      'notifications', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.notifications t), '[]'::jsonb)
    )
  ) from public.hrflow_meta m where m.id = 1;
$$;

create or replace function public.hrflow_write_state(p_state jsonb, p_expected_revision bigint)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare current_revision bigint;
begin
  select revision into current_revision from public.hrflow_meta where id = 1 for update;
  if current_revision is distinct from p_expected_revision then
    raise exception 'HRFlow state changed' using errcode = '40001';
  end if;

  delete from public.notifications where id is not null;
  delete from public.schedules where id is not null;
  delete from public."leaveRequests" where id is not null;
  delete from public.users where id is not null;
  delete from public.employees where id is not null;
  delete from public.departments where id is not null;
  delete from public.positions where id is not null;
  delete from public."leaveTypes" where id is not null;
  delete from public.shifts where id is not null;

  insert into public.employees select * from jsonb_populate_recordset(null::public.employees, coalesce(p_state->'employees', '[]'::jsonb));
  insert into public.users select * from jsonb_populate_recordset(null::public.users, coalesce(p_state->'users', '[]'::jsonb));
  insert into public.departments select * from jsonb_populate_recordset(null::public.departments, coalesce(p_state->'departments', '[]'::jsonb));
  insert into public.positions select * from jsonb_populate_recordset(null::public.positions, coalesce(p_state->'positions', '[]'::jsonb));
  insert into public."leaveTypes" select * from jsonb_populate_recordset(null::public."leaveTypes", coalesce(p_state->'leaveTypes', '[]'::jsonb));
  insert into public.shifts select * from jsonb_populate_recordset(null::public.shifts, coalesce(p_state->'shifts', '[]'::jsonb));
  insert into public."leaveRequests" select * from jsonb_populate_recordset(null::public."leaveRequests", coalesce(p_state->'leaveRequests', '[]'::jsonb));
  insert into public.schedules select * from jsonb_populate_recordset(null::public.schedules, coalesce(p_state->'schedules', '[]'::jsonb));
  insert into public.notifications select * from jsonb_populate_recordset(null::public.notifications, coalesce(p_state->'notifications', '[]'::jsonb));

  update public.hrflow_meta set revision = current_revision + 1 where id = 1;
  return current_revision + 1;
end;
$$;

-- The browser receives no direct table access. The Node API uses the server-only secret key.
alter table public.hrflow_meta enable row level security;
alter table public.users enable row level security;
alter table public.employees enable row level security;
alter table public.departments enable row level security;
alter table public.positions enable row level security;
alter table public."leaveTypes" enable row level security;
alter table public.shifts enable row level security;
alter table public."leaveRequests" enable row level security;
alter table public.schedules enable row level security;
alter table public.notifications enable row level security;
revoke all on all tables in schema public from anon, authenticated;
revoke all on function public.hrflow_read_state() from public, anon, authenticated;
revoke all on function public.hrflow_write_state(jsonb, bigint) from public, anon, authenticated;
grant execute on function public.hrflow_read_state() to service_role;
grant execute on function public.hrflow_write_state(jsonb, bigint) to service_role;
