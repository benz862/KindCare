create table public.service_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  body text not null check (char_length(btrim(body)) between 1 and 1200),
  audience text not null default 'all_members'
    check (audience in ('all_members', 'caregivers', 'patients')),
  priority text not null default 'routine'
    check (priority in ('routine', 'important', 'maintenance')),
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published', 'expired', 'archived')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  constraint service_notices_window check (ends_at is null or ends_at > starts_at)
);

create table public.service_notice_receipts (
  notice_id uuid not null references public.service_notices (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  displayed_at timestamptz,
  dismissed_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (notice_id, profile_id)
);

create index service_notices_live_idx
  on public.service_notices (status, starts_at, ends_at);

create index service_notice_receipts_profile_idx
  on public.service_notice_receipts (profile_id, displayed_at desc);

create or replace function private.can_read_service_notice(p_audience text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_audience
    when 'all_members' then exists (
      select 1
      from public.household_members as hm
      where hm.profile_id = (select auth.uid())
        and hm.status = 'active'
    )
    when 'caregivers' then exists (
      select 1
      from public.household_members as hm
      where hm.profile_id = (select auth.uid())
        and hm.status = 'active'
        and hm.role in ('organizer', 'caregiver', 'helper')
    ) or exists (
      select 1
      from public.patient_assignments as pa
      where pa.profile_id = (select auth.uid())
        and pa.status = 'active'
        and pa.role in ('primary', 'backup_primary', 'caregiver', 'helper')
    )
    when 'patients' then exists (
      select 1
      from public.household_members as hm
      where hm.profile_id = (select auth.uid())
        and hm.status = 'active'
        and hm.role = 'member'
    ) or exists (
      select 1
      from public.patient_assignments as pa
      where pa.profile_id = (select auth.uid())
        and pa.status = 'active'
        and pa.role = 'patient'
    )
    else false
  end;
$$;

revoke all on function private.can_read_service_notice(text) from public, anon;
grant execute on function private.can_read_service_notice(text) to authenticated;

alter table public.service_notices enable row level security;
alter table public.service_notices force row level security;
alter table public.service_notice_receipts enable row level security;
alter table public.service_notice_receipts force row level security;

create policy service_notices_select on public.service_notices
  for select to authenticated
  using (
    archived_at is null
    and status in ('published', 'scheduled')
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
    and (select private.can_read_service_notice(audience))
  );

create policy service_notice_receipts_select on public.service_notice_receipts
  for select to authenticated
  using (profile_id = (select auth.uid()));

create policy service_notice_receipts_insert on public.service_notice_receipts
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and exists (
      select 1
      from public.service_notices as n
      where n.id = notice_id
    )
  );

create policy service_notice_receipts_update on public.service_notice_receipts
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

grant select on table public.service_notices to authenticated;
grant select, insert, update on table public.service_notice_receipts to authenticated;
revoke insert, update, delete on table public.service_notices from public, anon, authenticated;
