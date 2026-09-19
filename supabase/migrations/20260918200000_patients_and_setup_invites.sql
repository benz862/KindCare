-- Multi-patient care circles, setup invites, and patient-scoped RLS.

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  member_profile_id uuid unique references public.profiles (id) on delete set null,
  phone text check (phone is null or char_length(btrim(phone)) between 7 and 30),
  timezone text not null default 'America/New_York',
  help_confirm_required boolean not null default true,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_household_idx on public.patients (household_id);
create index patients_member_profile_idx on public.patients (member_profile_id);

create table public.patient_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('patient', 'primary', 'backup_primary', 'caregiver', 'helper')),
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, profile_id)
);

create unique index patient_assignments_one_primary
  on public.patient_assignments (patient_id)
  where role = 'primary' and status = 'active';

create unique index patient_assignments_one_backup
  on public.patient_assignments (patient_id)
  where role = 'backup_primary' and status = 'active';

create unique index patient_assignments_one_patient
  on public.patient_assignments (patient_id)
  where role = 'patient' and status = 'active';

create unique index patient_assignments_one_patient_profile
  on public.patient_assignments (profile_id)
  where role = 'patient' and status = 'active';

create index patient_assignments_profile_idx
  on public.patient_assignments (profile_id, status);

create table public.patient_setup_invites (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  phone text check (phone is null or char_length(btrim(phone)) between 7 and 30),
  token_hash text not null unique,
  invited_by uuid not null references public.profiles (id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index patient_setup_invites_patient_idx
  on public.patient_setup_invites (patient_id, created_at desc);

alter table public.invitations
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;

alter table public.audit_events
  add column if not exists patient_id uuid references public.patients (id) on delete set null;

alter table public.calendar_events
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.appointment_preparations
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.routines
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.routine_occurrences
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.medication_plans
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.medication_doses
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.member_requests
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.request_presets
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.wellbeing_checkins
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.voice_notes
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.scheduled_deliveries
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.contacts
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.help_alerts
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.moments
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.handoffs
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.handoff_assignments
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.handoff_acks
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;
alter table public.consent_records
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'companion_messages'
  ) then
    alter table public.companion_messages
      add column if not exists patient_id uuid references public.patients (id) on delete cascade;
  end if;
end $$;

-- One patient per existing household; organizers become primary caregivers.
insert into public.patients (
  household_id, display_name, timezone, help_confirm_required, created_by
)
select
  h.id,
  coalesce(nullif(btrim(h.supported_person_name), ''), h.name),
  h.timezone,
  coalesce(h.help_confirm_required, true),
  h.created_by
from public.households as h
where not exists (
  select 1 from public.patients as p where p.household_id = h.id
);

update public.patients as p
set member_profile_id = member.profile_id
from (
  select distinct on (household_id) household_id, profile_id
  from public.household_members
  where status = 'active' and role = 'member'
  order by household_id, created_at
) as member
where member.household_id = p.household_id
  and p.member_profile_id is null;

insert into public.patient_assignments (patient_id, profile_id, role, status)
select p.id, hm.profile_id,
  case
    when hm.role = 'organizer' then 'primary'
    when hm.role = 'member' then 'patient'
    when hm.role = 'caregiver' then 'caregiver'
    else 'helper'
  end,
  'active'
from public.patients as p
join public.household_members as hm
  on hm.household_id = p.household_id
 and hm.status = 'active'
on conflict (patient_id, profile_id) do nothing;

create or replace function private.backfill_patient_id(p_table regclass)
returns void
language plpgsql
as $$
begin
  execute format(
    'update %s as t set patient_id = p.id from public.patients as p where p.household_id = t.household_id and t.patient_id is null',
    p_table
  );
end;
$$;

select private.backfill_patient_id('public.calendar_events');
select private.backfill_patient_id('public.appointment_preparations');
select private.backfill_patient_id('public.routines');
select private.backfill_patient_id('public.routine_occurrences');
select private.backfill_patient_id('public.medication_plans');
select private.backfill_patient_id('public.medication_doses');
select private.backfill_patient_id('public.member_requests');
select private.backfill_patient_id('public.request_presets');
select private.backfill_patient_id('public.wellbeing_checkins');
select private.backfill_patient_id('public.voice_notes');
select private.backfill_patient_id('public.scheduled_deliveries');
select private.backfill_patient_id('public.contacts');
select private.backfill_patient_id('public.help_alerts');
select private.backfill_patient_id('public.moments');
select private.backfill_patient_id('public.handoffs');
select private.backfill_patient_id('public.handoff_assignments');
select private.backfill_patient_id('public.handoff_acks');
select private.backfill_patient_id('public.consent_records');
select private.backfill_patient_id('public.audit_events');

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'companion_messages'
  ) then
    perform private.backfill_patient_id('public.companion_messages');
  end if;
end $$;

drop function private.backfill_patient_id(regclass);

alter table public.calendar_events alter column patient_id set not null;
alter table public.appointment_preparations alter column patient_id set not null;
alter table public.routines alter column patient_id set not null;
alter table public.routine_occurrences alter column patient_id set not null;
alter table public.medication_plans alter column patient_id set not null;
alter table public.medication_doses alter column patient_id set not null;
alter table public.member_requests alter column patient_id set not null;
alter table public.request_presets alter column patient_id set not null;
alter table public.wellbeing_checkins alter column patient_id set not null;
alter table public.voice_notes alter column patient_id set not null;
alter table public.scheduled_deliveries alter column patient_id set not null;
alter table public.contacts alter column patient_id set not null;
alter table public.help_alerts alter column patient_id set not null;
alter table public.moments alter column patient_id set not null;
alter table public.handoffs alter column patient_id set not null;
alter table public.handoff_assignments alter column patient_id set not null;
alter table public.handoff_acks alter column patient_id set not null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'companion_messages' and column_name = 'patient_id'
  ) then
    update public.companion_messages as t
    set patient_id = p.id
    from public.patients as p
    where p.household_id = t.household_id and t.patient_id is null;
    alter table public.companion_messages alter column patient_id set not null;
  end if;
end $$;

create index calendar_events_patient_idx on public.calendar_events (patient_id, starts_at);
create index routines_patient_idx on public.routines (patient_id);
create index medication_plans_patient_idx on public.medication_plans (patient_id);
create index voice_notes_patient_idx on public.voice_notes (patient_id);
create index contacts_patient_idx on public.contacts (patient_id);
create index help_alerts_patient_idx on public.help_alerts (patient_id, status);
create index moments_patient_idx on public.moments (patient_id, created_at desc);

create or replace function private.can_access_patient(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.patient_assignments as pa
    where pa.patient_id = p_patient_id
      and pa.profile_id = (select auth.uid())
      and pa.status = 'active'
  );
$$;

create or replace function private.has_patient_role(p_patient_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.patient_assignments as pa
    where pa.patient_id = p_patient_id
      and pa.profile_id = (select auth.uid())
      and pa.status = 'active'
      and pa.role = any (p_roles)
  );
$$;

create or replace function private.is_patient_member(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_patient_role(p_patient_id, array['patient']::text[]);
$$;

create or replace function private.shares_patient_with(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.patient_assignments as mine
    join public.patient_assignments as theirs
      on theirs.patient_id = mine.patient_id
    where mine.profile_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.profile_id = p_profile_id
      and theirs.status = 'active'
  );
$$;

revoke all on function private.can_access_patient(uuid) from public, anon;
revoke all on function private.has_patient_role(uuid, text[]) from public, anon;
revoke all on function private.is_patient_member(uuid) from public, anon;
revoke all on function private.shares_patient_with(uuid) from public, anon;
grant execute on function private.can_access_patient(uuid) to authenticated;
grant execute on function private.has_patient_role(uuid, text[]) to authenticated;
grant execute on function private.is_patient_member(uuid) to authenticated;
grant execute on function private.shares_patient_with(uuid) to authenticated;

create or replace function private.handle_new_household()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_patient uuid;
begin
  insert into public.household_members (household_id, profile_id, role, status)
  values (new.id, new.created_by, 'organizer', 'active');

  insert into public.patients (
    household_id, display_name, timezone, help_confirm_required, created_by
  )
  values (
    new.id,
    coalesce(nullif(btrim(new.supported_person_name), ''), new.name),
    new.timezone,
    coalesce(new.help_confirm_required, true),
    new.created_by
  )
  returning id into new_patient;

  insert into public.patient_assignments (patient_id, profile_id, role, status)
  values (new_patient, new.created_by, 'primary', 'active');

  insert into public.audit_events (
    household_id, patient_id, actor_profile_id, event_type, outcome, metadata
  )
  values (
    new.id,
    new_patient,
    new.created_by,
    'household.created',
    'success',
    jsonb_build_object('name', new.name, 'patient_id', new_patient)
  );

  return new;
end;
$$;

drop function if exists private.notify_care_team(uuid, text, text, text, text);

create or replace function private.notify_care_team(
  p_household_id uuid,
  p_title text,
  p_body text,
  p_kind text,
  p_href text,
  p_patient_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_patient_id is not null then
    insert into public.in_app_notifications (
      household_id, profile_id, title, body, kind, href
    )
    select
      p_household_id,
      pa.profile_id,
      p_title,
      p_body,
      p_kind,
      p_href
    from public.patient_assignments as pa
    join public.profiles as p on p.id = pa.profile_id
    where pa.patient_id = p_patient_id
      and pa.status = 'active'
      and pa.role in ('primary', 'backup_primary', 'caregiver', 'helper')
      and p.notify_in_app = true;
    return;
  end if;

  insert into public.in_app_notifications (
    household_id, profile_id, title, body, kind, href
  )
  select
    p_household_id,
    hm.profile_id,
    p_title,
    p_body,
    p_kind,
    p_href
  from public.household_members as hm
  join public.profiles as p on p.id = hm.profile_id
  where hm.household_id = p_household_id
    and hm.status = 'active'
    and hm.role in ('organizer', 'caregiver', 'helper')
    and p.notify_in_app = true;
end;
$$;

create or replace function private.materialize_plan_items()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted integer := 0;
  household record;
  plan_date date;
  day_offset integer;
  routine_row record;
  plan_row record;
  dose_time time;
  due timestamptz;
begin
  for household in
    select id, timezone from public.households
  loop
    for day_offset in 0..13 loop
      plan_date := ((now() at time zone household.timezone)::date + day_offset);

      for routine_row in
        select *
        from public.routines
        where household_id = household.id
          and active = true
      loop
        if private.date_matches_plan(
          plan_date,
          routine_row.start_on,
          routine_row.end_on,
          routine_row.recurrence,
          routine_row.days_of_week
        ) then
          due := private.local_due_at(plan_date, routine_row.local_time, household.timezone);
          insert into public.routine_occurrences (
            household_id, patient_id, routine_id, assigned_to, due_at, status
          )
          values (
            household.id, routine_row.patient_id, routine_row.id, routine_row.assigned_to, due, 'scheduled'
          )
          on conflict (routine_id, due_at) do nothing;
          if found then
            inserted := inserted + 1;
          end if;
        end if;
      end loop;

      for plan_row in
        select *
        from public.medication_plans
        where household_id = household.id
          and active = true
      loop
        if private.date_matches_plan(
          plan_date,
          plan_row.start_on,
          plan_row.end_on,
          'daily',
          plan_row.days_of_week
        ) then
          foreach dose_time in array plan_row.times loop
            due := private.local_due_at(plan_date, dose_time, household.timezone);
            insert into public.medication_doses (
              household_id, patient_id, plan_id, member_profile_id, due_at, status
            )
            values (
              household.id, plan_row.patient_id, plan_row.id, plan_row.member_profile_id, due, 'scheduled'
            )
            on conflict (plan_id, due_at) do nothing;
            if found then
              inserted := inserted + 1;
            end if;
          end loop;
        end if;
      end loop;
    end loop;
  end loop;

  return inserted;
end;
$$;

create or replace function private.notify_on_help_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.notify_care_team(
      new.household_id,
      'Someone asked for help',
      'A KindCare member asked the household for help. KindCare did not call 911 or dispatch emergency services.',
      'help_alert',
      '/today',
      new.patient_id
    );
    insert into public.audit_events (
      household_id, patient_id, actor_profile_id, event_type, outcome, metadata
    )
    values (
      new.household_id,
      new.patient_id,
      new.member_profile_id,
      'help_alert.created',
      'success',
      jsonb_build_object('help_alert_id', new.id, 'status', new.status)
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.audit_events (
      household_id, patient_id, actor_profile_id, event_type, outcome, metadata
    )
    values (
      new.household_id,
      new.patient_id,
      coalesce(new.acknowledged_by, (select auth.uid())),
      'help_alert.updated',
      'success',
      jsonb_build_object(
        'help_alert_id', new.id,
        'from_status', old.status,
        'to_status', new.status
      )
    );
  end if;
  return new;
end;
$$;

create or replace function private.notify_on_checkin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_care_team(
    new.household_id,
    case
      when new.feeling = 'would_like_to_talk' then 'Someone would like to talk'
      else 'A KindCare check-in arrived'
    end,
    'This is a communication prompt, not a health assessment or medical monitoring.',
    'wellbeing_checkin',
    '/today',
    new.patient_id
  );
  return new;
end;
$$;

create or replace function private.notify_on_moment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_care_team(
    new.household_id,
    'A new KindCare moment',
    'Someone posted a household update. This is a private family board, not a public feed.',
    'moment',
    '/moments',
    new.patient_id
  );
  return new;
end;
$$;

create or replace function private.notify_on_handoff()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_care_team(
    new.household_id,
    'A caregiver handoff is waiting',
    'Someone wrote what changed today. This is household coordination, not a clinical record.',
    'handoff',
    '/today',
    new.patient_id
  );
  return new;
end;
$$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.shares_patient_with(id))
  );

drop policy if exists household_members_select on public.household_members;
create policy household_members_select on public.household_members
  for select to authenticated
  using (
    profile_id = (select auth.uid())
    or (select private.has_role(household_id, array['organizer']::text[]))
    or (select private.shares_patient_with(profile_id))
  );

drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations
  for select to authenticated
  using (
    (patient_id is not null and (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])))
    or (patient_id is null and (select private.has_role(household_id, array['organizer', 'caregiver']::text[])))
  );

drop policy if exists audit_events_select on public.audit_events;
create policy audit_events_select on public.audit_events
  for select to authenticated
  using (
    (patient_id is not null and (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])))
    or (patient_id is null and household_id is not null and (select private.has_role(household_id, array['organizer', 'caregiver']::text[])))
  );

drop policy if exists calendar_events_select on public.calendar_events;
drop policy if exists calendar_events_insert on public.calendar_events;
drop policy if exists calendar_events_update on public.calendar_events;
drop policy if exists calendar_events_delete on public.calendar_events;
create policy calendar_events_select on public.calendar_events
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy calendar_events_insert on public.calendar_events
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
  );
create policy calendar_events_update on public.calendar_events
  for update to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])))
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])));
create policy calendar_events_delete on public.calendar_events
  for delete to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])));

drop policy if exists appointment_preparations_select on public.appointment_preparations;
drop policy if exists appointment_preparations_insert on public.appointment_preparations;
drop policy if exists appointment_preparations_update on public.appointment_preparations;
create policy appointment_preparations_select on public.appointment_preparations
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy appointment_preparations_insert on public.appointment_preparations
  for insert to authenticated
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])));
create policy appointment_preparations_update on public.appointment_preparations
  for update to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])))
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])));

drop policy if exists routines_select on public.routines;
drop policy if exists routines_insert on public.routines;
drop policy if exists routines_update on public.routines;
create policy routines_select on public.routines
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy routines_insert on public.routines
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[]))
  );
create policy routines_update on public.routines
  for update to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])))
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])));

drop policy if exists routine_occurrences_select on public.routine_occurrences;
drop policy if exists routine_occurrences_update on public.routine_occurrences;
create policy routine_occurrences_select on public.routine_occurrences
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy routine_occurrences_update on public.routine_occurrences
  for update to authenticated
  using (
    (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
    or assigned_to = (select auth.uid())
  )
  with check (
    (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
    or assigned_to = (select auth.uid())
  );

drop policy if exists medication_plans_select on public.medication_plans;
drop policy if exists medication_plans_insert on public.medication_plans;
drop policy if exists medication_plans_update on public.medication_plans;
create policy medication_plans_select on public.medication_plans
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy medication_plans_insert on public.medication_plans
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[]))
  );
create policy medication_plans_update on public.medication_plans
  for update to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])))
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])));

drop policy if exists medication_doses_select on public.medication_doses;
drop policy if exists medication_doses_update on public.medication_doses;
create policy medication_doses_select on public.medication_doses
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy medication_doses_update on public.medication_doses
  for update to authenticated
  using (
    (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
    or member_profile_id = (select auth.uid())
  )
  with check (
    (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
    or member_profile_id = (select auth.uid())
  );

drop policy if exists member_requests_select on public.member_requests;
drop policy if exists member_requests_insert on public.member_requests;
drop policy if exists member_requests_update on public.member_requests;
create policy member_requests_select on public.member_requests
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy member_requests_insert on public.member_requests
  for insert to authenticated
  with check (
    member_profile_id = (select auth.uid())
    and (select private.is_patient_member(patient_id))
  );
create policy member_requests_update on public.member_requests
  for update to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])))
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])));

drop policy if exists contacts_select on public.contacts;
drop policy if exists contacts_insert on public.contacts;
drop policy if exists contacts_update on public.contacts;
drop policy if exists contacts_delete on public.contacts;
create policy contacts_select on public.contacts
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy contacts_insert on public.contacts
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[]))
  );
create policy contacts_update on public.contacts
  for update to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])))
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])));
create policy contacts_delete on public.contacts
  for delete to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])));

drop policy if exists voice_notes_select on public.voice_notes;
drop policy if exists voice_notes_insert on public.voice_notes;
create policy voice_notes_select on public.voice_notes
  for select to authenticated
  using (
    (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
    or (select private.member_can_hear(id))
  );
create policy voice_notes_insert on public.voice_notes
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
      or (select private.is_patient_member(patient_id))
    )
  );

drop policy if exists scheduled_deliveries_select on public.scheduled_deliveries;
drop policy if exists scheduled_deliveries_insert on public.scheduled_deliveries;
drop policy if exists scheduled_deliveries_update on public.scheduled_deliveries;
create policy scheduled_deliveries_select on public.scheduled_deliveries
  for select to authenticated
  using (
    (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
    or (
      status <> 'canceled'
      and deliver_at <= now()
      and exists (
        select 1 from public.voice_notes as vn
        where vn.id = scheduled_deliveries.voice_note_id
          and vn.recipient_id = (select auth.uid())
          and (select private.can_access_patient(vn.patient_id))
      )
    )
  );
create policy scheduled_deliveries_insert on public.scheduled_deliveries
  for insert to authenticated
  with check ((select private.can_access_patient(patient_id)));
create policy scheduled_deliveries_update on public.scheduled_deliveries
  for update to authenticated
  using (
    (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
    or exists (
      select 1 from public.voice_notes as vn
      where vn.id = scheduled_deliveries.voice_note_id
        and vn.recipient_id = (select auth.uid())
        and scheduled_deliveries.deliver_at <= now()
        and scheduled_deliveries.status <> 'canceled'
    )
  )
  with check (
    (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
    or exists (
      select 1 from public.voice_notes as vn
      where vn.id = scheduled_deliveries.voice_note_id
        and vn.recipient_id = (select auth.uid())
    )
  );

drop policy if exists help_alerts_select on public.help_alerts;
drop policy if exists help_alerts_insert on public.help_alerts;
drop policy if exists help_alerts_update on public.help_alerts;
create policy help_alerts_select on public.help_alerts
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy help_alerts_insert on public.help_alerts
  for insert to authenticated
  with check (
    member_profile_id = (select auth.uid())
    and (select private.is_patient_member(patient_id))
  );
create policy help_alerts_update on public.help_alerts
  for update to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])))
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])));

drop policy if exists wellbeing_checkins_select on public.wellbeing_checkins;
drop policy if exists wellbeing_checkins_insert on public.wellbeing_checkins;
create policy wellbeing_checkins_select on public.wellbeing_checkins
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy wellbeing_checkins_insert on public.wellbeing_checkins
  for insert to authenticated
  with check (
    member_profile_id = (select auth.uid())
    and (select private.is_patient_member(patient_id))
  );

drop policy if exists request_presets_select on public.request_presets;
drop policy if exists request_presets_insert on public.request_presets;
drop policy if exists request_presets_update on public.request_presets;
create policy request_presets_select on public.request_presets
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy request_presets_insert on public.request_presets
  for insert to authenticated
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])));
create policy request_presets_update on public.request_presets
  for update to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])))
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])));

drop policy if exists moments_select on public.moments;
drop policy if exists moments_insert on public.moments;
drop policy if exists moments_delete on public.moments;
create policy moments_select on public.moments
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy moments_insert on public.moments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.can_access_patient(patient_id))
  );
create policy moments_delete on public.moments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    or (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[]))
  );

drop policy if exists handoffs_select on public.handoffs;
drop policy if exists handoffs_insert on public.handoffs;
create policy handoffs_select on public.handoffs
  for select to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])));
create policy handoffs_insert on public.handoffs
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
  );

drop policy if exists handoff_acks_select on public.handoff_acks;
drop policy if exists handoff_acks_insert on public.handoff_acks;
create policy handoff_acks_select on public.handoff_acks
  for select to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])));
create policy handoff_acks_insert on public.handoff_acks
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and (select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[]))
  );

drop policy if exists handoff_assignments_select on public.handoff_assignments;
drop policy if exists handoff_assignments_insert on public.handoff_assignments;
drop policy if exists handoff_assignments_update on public.handoff_assignments;
create policy handoff_assignments_select on public.handoff_assignments
  for select to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])));
create policy handoff_assignments_insert on public.handoff_assignments
  for insert to authenticated
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])));
create policy handoff_assignments_update on public.handoff_assignments
  for update to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])))
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver', 'helper']::text[])));

drop policy if exists consent_records_select on public.consent_records;
drop policy if exists consent_records_insert on public.consent_records;
create policy consent_records_select on public.consent_records
  for select to authenticated
  using (
    (patient_id is not null and (select private.can_access_patient(patient_id)))
    or (patient_id is null and (select private.is_active_member(household_id)))
  );
create policy consent_records_insert on public.consent_records
  for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and (
      (patient_id is not null and (select private.can_access_patient(patient_id)))
      or (patient_id is null and (select private.is_active_member(household_id)))
    )
  );

drop policy if exists companion_messages_select on public.companion_messages;
drop policy if exists companion_messages_insert on public.companion_messages;
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'companion_messages'
  ) then
    execute $p$
      create policy companion_messages_select on public.companion_messages
        for select to authenticated
        using ((select private.can_access_patient(patient_id)))
    $p$;
    execute $p$
      create policy companion_messages_insert on public.companion_messages
        for insert to authenticated
        with check (
          member_profile_id = (select auth.uid())
          and (select private.is_patient_member(patient_id))
        )
    $p$;
  end if;
end $$;

drop policy if exists voice_objects_select on storage.objects;
drop policy if exists voice_objects_insert on storage.objects;
drop policy if exists voice_objects_delete on storage.objects;
create policy voice_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'voice-notes'
    and exists (
      select 1
      from public.voice_notes as vn
      where vn.storage_path = name
        and (
          (select private.can_access_patient(vn.patient_id))
          or (select private.member_can_hear(vn.id))
        )
    )
  );
create policy voice_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'voice-notes'
    and (select private.can_access_patient(((storage.foldername(name))[1])::uuid))
  );
create policy voice_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'voice-notes'
    and (select private.has_patient_role(((storage.foldername(name))[1])::uuid, array['primary', 'backup_primary', 'caregiver']::text[]))
  );

drop policy if exists moment_objects_select on storage.objects;
drop policy if exists moment_objects_insert on storage.objects;
drop policy if exists moment_objects_delete on storage.objects;
create policy moment_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'moments'
    and exists (
      select 1
      from public.moments as m
      where m.photo_path = name
        and (select private.can_access_patient(m.patient_id))
    )
  );
create policy moment_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'moments'
    and (select private.can_access_patient(((storage.foldername(name))[1])::uuid))
  );
create policy moment_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'moments'
    and (select private.can_access_patient(((storage.foldername(name))[1])::uuid))
  );

alter table public.patients enable row level security;
alter table public.patients force row level security;
alter table public.patient_assignments enable row level security;
alter table public.patient_assignments force row level security;
alter table public.patient_setup_invites enable row level security;
alter table public.patient_setup_invites force row level security;

create policy patients_select on public.patients
  for select to authenticated
  using ((select private.can_access_patient(id)));
create policy patients_insert on public.patients
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_role(household_id, array['organizer', 'caregiver']::text[]))
  );
create policy patients_update on public.patients
  for update to authenticated
  using ((select private.has_patient_role(id, array['primary', 'backup_primary']::text[])))
  with check ((select private.has_patient_role(id, array['primary', 'backup_primary']::text[])));

create policy patient_assignments_select on public.patient_assignments
  for select to authenticated
  using ((select private.can_access_patient(patient_id)));
create policy patient_assignments_insert on public.patient_assignments
  for insert to authenticated
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary']::text[])));
create policy patient_assignments_update on public.patient_assignments
  for update to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary']::text[])))
  with check ((select private.has_patient_role(patient_id, array['primary', 'backup_primary']::text[])));

create policy patient_setup_invites_select on public.patient_setup_invites
  for select to authenticated
  using ((select private.has_patient_role(patient_id, array['primary', 'backup_primary', 'caregiver']::text[])));

grant select, insert, update on table public.patients to authenticated;
grant select, insert, update on table public.patient_assignments to authenticated;
grant select on table public.patient_setup_invites to authenticated;

create or replace function public.create_patient(
  p_household_id uuid,
  p_display_name text,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  cleaned_phone text;
begin
  if not private.has_role(p_household_id, array['organizer', 'caregiver']::text[]) then
    raise exception 'You cannot add a care recipient to this household.';
  end if;

  cleaned_phone := nullif(btrim(coalesce(p_phone, '')), '');
  insert into public.patients (
    household_id, display_name, phone, timezone, help_confirm_required, created_by
  )
  select
    p_household_id,
    btrim(p_display_name),
    cleaned_phone,
    h.timezone,
    h.help_confirm_required,
    (select auth.uid())
  from public.households as h
  where h.id = p_household_id
  returning id into new_id;

  insert into public.patient_assignments (patient_id, profile_id, role, status)
  values (new_id, (select auth.uid()), 'primary', 'active');

  insert into public.audit_events (
    household_id, patient_id, actor_profile_id, event_type, outcome, metadata
  )
  values (
    p_household_id,
    new_id,
    (select auth.uid()),
    'patient.created',
    'success',
    jsonb_build_object('display_name', btrim(p_display_name))
  );

  return new_id;
end;
$$;

create or replace function public.set_patient_backup_primary(
  p_patient_id uuid,
  p_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  household uuid;
begin
  if not private.has_patient_role(p_patient_id, array['primary']::text[]) then
    raise exception 'Only the primary caregiver can name a backup.';
  end if;

  select household_id into household from public.patients where id = p_patient_id;

  update public.patient_assignments
  set status = 'removed', updated_at = now()
  where patient_id = p_patient_id
    and role = 'backup_primary'
    and status = 'active'
    and profile_id is distinct from p_profile_id;

  insert into public.patient_assignments (patient_id, profile_id, role, status)
  values (p_patient_id, p_profile_id, 'backup_primary', 'active')
  on conflict (patient_id, profile_id) do update
    set role = 'backup_primary', status = 'active', updated_at = now();

  insert into public.audit_events (
    household_id, patient_id, actor_profile_id, event_type, outcome, metadata
  )
  values (
    household,
    p_patient_id,
    (select auth.uid()),
    'patient.backup_primary.set',
    'success',
    jsonb_build_object('profile_id', p_profile_id)
  );
end;
$$;

create or replace function public.create_patient_setup_invite(
  p_patient_id uuid,
  p_phone text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
  household uuid;
  cleaned_phone text;
begin
  if not private.has_patient_role(p_patient_id, array['primary', 'backup_primary', 'caregiver']::text[]) then
    raise exception 'You cannot send a setup link for this person.';
  end if;

  select household_id into household from public.patients where id = p_patient_id;
  cleaned_phone := nullif(btrim(coalesce(p_phone, '')), '');

  update public.patient_setup_invites
  set revoked_at = now()
  where patient_id = p_patient_id
    and accepted_at is null
    and revoked_at is null;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.patient_setup_invites (
    patient_id, phone, token_hash, invited_by, expires_at
  )
  values (
    p_patient_id,
    cleaned_phone,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    (select auth.uid()),
    now() + interval '7 days'
  );

  if cleaned_phone is not null then
    update public.patients
    set phone = cleaned_phone, updated_at = now()
    where id = p_patient_id;
  end if;

  insert into public.audit_events (
    household_id, patient_id, actor_profile_id, event_type, outcome, metadata
  )
  values (
    household,
    p_patient_id,
    (select auth.uid()),
    'patient.setup_invite.created',
    'success',
    jsonb_build_object('expires_in_days', 7)
  );

  return raw_token;
end;
$$;

create or replace function public.revoke_patient_setup_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite public.patient_setup_invites%rowtype;
  household uuid;
begin
  select * into invite from public.patient_setup_invites where id = p_invite_id;
  if invite.id is null then
    raise exception 'Setup link not found.';
  end if;
  if not private.has_patient_role(invite.patient_id, array['primary', 'backup_primary', 'caregiver']::text[]) then
    raise exception 'You cannot change this setup link.';
  end if;

  update public.patient_setup_invites
  set revoked_at = now()
  where id = p_invite_id
    and accepted_at is null
    and revoked_at is null;

  select household_id into household from public.patients where id = invite.patient_id;

  insert into public.audit_events (
    household_id, patient_id, actor_profile_id, event_type, outcome
  )
  values (
    household,
    invite.patient_id,
    (select auth.uid()),
    'patient.setup_invite.revoked',
    'success'
  );
end;
$$;

create or replace function public.preview_patient_setup(p_token text)
returns table (
  patient_id uuid,
  patient_display_name text,
  caregiver_display_name text,
  expires_at timestamptz,
  already_linked boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  hashed text;
begin
  hashed := encode(extensions.digest(p_token, 'sha256'), 'hex');
  return query
    select
      p.id,
      p.display_name,
      coalesce(pr.display_name, 'your caregiver'),
      i.expires_at,
      p.member_profile_id is not null
    from public.patient_setup_invites as i
    join public.patients as p on p.id = i.patient_id
    left join public.profiles as pr on pr.id = i.invited_by
    where i.token_hash = hashed
      and i.accepted_at is null
      and i.revoked_at is null
      and i.expires_at > now();
end;
$$;

create or replace function public.accept_patient_setup(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  hashed text;
  invite public.patient_setup_invites%rowtype;
  actor uuid;
  household uuid;
  patient_row public.patients%rowtype;
begin
  actor := (select auth.uid());
  if actor is null then
    raise exception 'Sign in to continue setup.';
  end if;

  hashed := encode(extensions.digest(p_token, 'sha256'), 'hex');

  select * into invite
  from public.patient_setup_invites
  where token_hash = hashed
  for update;

  if invite.id is null then
    raise exception 'This setup link is not valid.';
  end if;
  if invite.accepted_at is not null or invite.revoked_at is not null or invite.expires_at <= now() then
    raise exception 'This setup link is no longer available.';
  end if;

  select * into patient_row from public.patients where id = invite.patient_id;
  household := patient_row.household_id;

  if exists (
    select 1 from public.patient_assignments
    where patient_id = invite.patient_id
      and profile_id = actor
      and status = 'active'
      and role in ('primary', 'backup_primary', 'caregiver', 'helper')
  ) then
    raise exception 'Open this setup link on the patient''s phone.';
  end if;

  if patient_row.member_profile_id is not null and patient_row.member_profile_id is distinct from actor then
    raise exception 'This setup link is for a different KindCare account.';
  end if;

  update public.patients
  set member_profile_id = actor, updated_at = now()
  where id = invite.patient_id
    and member_profile_id is null;

  insert into public.patient_assignments (patient_id, profile_id, role, status)
  values (invite.patient_id, actor, 'patient', 'active')
  on conflict (patient_id, profile_id) do update
    set role = 'patient', status = 'active', updated_at = now();

  insert into public.household_members (household_id, profile_id, role, status)
  values (household, actor, 'member', 'active')
  on conflict (household_id, profile_id) do update
    set role = 'member', status = 'active', updated_at = now();

  update public.patient_setup_invites
  set accepted_at = now()
  where id = invite.id;

  insert into public.audit_events (
    household_id, patient_id, actor_profile_id, event_type, outcome
  )
  values (
    household,
    invite.patient_id,
    actor,
    'patient.setup_invite.accepted',
    'success'
  );

  return invite.patient_id;
end;
$$;

drop function if exists public.create_invitation(uuid, text, text);

create or replace function public.create_invitation(
  p_household_id uuid,
  p_email text,
  p_role text,
  p_patient_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
  normalized_email text;
begin
  if p_role not in ('caregiver', 'helper', 'member') then
    raise exception 'That role cannot be invited.';
  end if;

  if p_patient_id is not null then
    if not exists (
      select 1 from public.patients
      where id = p_patient_id and household_id = p_household_id
    ) then
      raise exception 'Choose a care recipient in this household.';
    end if;
    if p_role = 'caregiver' then
      if not private.has_patient_role(p_patient_id, array['primary', 'backup_primary']::text[]) then
        raise exception 'Only a primary caregiver can invite another caregiver.';
      end if;
    elsif not private.has_patient_role(p_patient_id, array['primary', 'backup_primary', 'caregiver']::text[]) then
      raise exception 'You cannot invite someone to this care circle.';
    end if;
  else
    if p_role = 'caregiver' then
      if not private.has_role(p_household_id, array['organizer']::text[]) then
        raise exception 'Only the household organizer can invite a caregiver.';
      end if;
    elsif not private.has_role(p_household_id, array['organizer', 'caregiver']::text[]) then
      raise exception 'You cannot invite someone to this household.';
    end if;
  end if;

  normalized_email := lower(btrim(p_email));
  if normalized_email is null or position('@' in normalized_email) = 0 then
    raise exception 'Enter a valid email.';
  end if;

  raw_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.invitations (
    household_id, patient_id, email, role, token_hash, invited_by, expires_at
  )
  values (
    p_household_id,
    p_patient_id,
    normalized_email,
    p_role,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    (select auth.uid()),
    now() + interval '14 days'
  );

  insert into public.audit_events (
    household_id, patient_id, actor_profile_id, event_type, outcome, metadata
  )
  values (
    p_household_id,
    p_patient_id,
    (select auth.uid()),
    'invitation.created',
    'success',
    jsonb_build_object('role', p_role)
  );

  return raw_token;
end;
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  hashed text;
  invite public.invitations%rowtype;
  actor uuid;
  actor_email text;
  assignment_role text;
begin
  actor := (select auth.uid());
  if actor is null then
    raise exception 'Sign in to accept this invitation.';
  end if;

  hashed := encode(extensions.digest(p_token, 'sha256'), 'hex');

  select * into invite
  from public.invitations
  where token_hash = hashed
  for update;

  if invite.id is null then
    raise exception 'This invitation is not valid.';
  end if;
  if invite.accepted_at is not null or invite.revoked_at is not null or invite.expires_at <= now() then
    raise exception 'This invitation is no longer available.';
  end if;

  select email into actor_email from auth.users where id = actor;
  if lower(coalesce(actor_email, '')) is distinct from invite.email then
    raise exception 'This invitation is for a different email address.';
  end if;

  insert into public.household_members (household_id, profile_id, role, status)
  values (invite.household_id, actor, invite.role, 'active')
  on conflict (household_id, profile_id) do update
    set role = excluded.role, status = 'active', updated_at = now();

  if invite.patient_id is not null then
    assignment_role := case
      when invite.role = 'member' then 'patient'
      else invite.role
    end;

    insert into public.patient_assignments (patient_id, profile_id, role, status)
    values (invite.patient_id, actor, assignment_role, 'active')
    on conflict (patient_id, profile_id) do update
      set role = excluded.role, status = 'active', updated_at = now();

    if assignment_role = 'patient' then
      update public.patients
      set member_profile_id = actor, updated_at = now()
      where id = invite.patient_id
        and member_profile_id is null;
    end if;
  end if;

  update public.invitations
  set accepted_at = now()
  where id = invite.id;

  insert into public.audit_events (
    household_id, patient_id, actor_profile_id, event_type, outcome, metadata
  )
  values (
    invite.household_id,
    invite.patient_id,
    actor,
    'invitation.accepted',
    'success',
    jsonb_build_object('role', invite.role)
  );

  return invite.household_id;
end;
$$;

grant execute on function public.create_patient(uuid, text, text) to authenticated;
grant execute on function public.set_patient_backup_primary(uuid, uuid) to authenticated;
grant execute on function public.create_patient_setup_invite(uuid, text) to authenticated;
grant execute on function public.revoke_patient_setup_invite(uuid) to authenticated;
grant execute on function public.preview_patient_setup(text) to anon, authenticated;
grant execute on function public.accept_patient_setup(text) to authenticated;
grant execute on function public.create_invitation(uuid, text, text, uuid) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;

revoke execute on function private.notify_care_team(uuid, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function private.notify_care_team(uuid, text, text, text, text, uuid) to postgres;
