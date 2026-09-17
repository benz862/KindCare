create or replace function private.local_due_at(
  p_date date,
  p_time time,
  p_timezone text
)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select timezone(
    coalesce(nullif(p_timezone, ''), 'America/New_York'),
    p_date + p_time
  );
$$;

create or replace function private.date_matches_plan(
  p_date date,
  p_start date,
  p_end date,
  p_recurrence text,
  p_days smallint[]
)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  dow integer;
begin
  if p_date < p_start then
    return false;
  end if;
  if p_end is not null and p_date > p_end then
    return false;
  end if;
  dow := extract(dow from p_date);
  if p_days is not null and cardinality(p_days) > 0 then
    return dow = any (p_days);
  end if;
  if p_recurrence = 'none' then
    return p_date = p_start;
  elsif p_recurrence = 'daily' then
    return true;
  elsif p_recurrence = 'weekdays' then
    return dow between 1 and 5;
  elsif p_recurrence = 'weekly' then
    return dow = extract(dow from p_start);
  end if;
  return true;
end;
$$;

create or replace function private.notify_care_team(
  p_household_id uuid,
  p_title text,
  p_body text,
  p_kind text,
  p_href text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
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
            household_id, routine_id, assigned_to, due_at, status
          )
          values (
            household.id, routine_row.id, routine_row.assigned_to, due, 'scheduled'
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
              household_id, plan_id, member_profile_id, due_at, status
            )
            values (
              household.id, plan_row.id, plan_row.member_profile_id, due, 'scheduled'
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

create or replace function public.materialize_plan_items()
returns integer
language sql
security definer
set search_path = ''
as $$
  select private.materialize_plan_items();
$$;

create or replace function private.audit_medication_plan_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events (
      household_id, actor_profile_id, event_type, outcome, metadata
    )
    values (
      new.household_id,
      new.created_by,
      'medication_plan.created',
      'success',
      jsonb_build_object('plan_id', new.id, 'name', new.name)
    );
    if new.notify_organizer then
      perform private.notify_care_team(
        new.household_id,
        'Medication plan added',
        'A caregiver-entered medication plan was added. Check the prescription label.',
        'medication_plan',
        '/plan'
      );
    end if;
    return new;
  end if;

  if (old.amount_text, old.strength_label, old.times, old.start_on, old.end_on, old.active)
    is distinct from
     (new.amount_text, new.strength_label, new.times, new.start_on, new.end_on, new.active)
  then
    insert into public.audit_events (
      household_id, actor_profile_id, event_type, outcome, metadata
    )
    values (
      new.household_id,
      (select auth.uid()),
      'medication_plan.updated',
      'success',
      jsonb_build_object('plan_id', new.id, 'name', new.name)
    );
    if new.notify_organizer then
      perform private.notify_care_team(
        new.household_id,
        'Medication plan changed',
        'A caregiver-entered medication plan was updated. Check the prescription label.',
        'medication_plan',
        '/plan'
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger medication_plans_audit
  after insert or update on public.medication_plans
  for each row execute function private.audit_medication_plan_change();

create or replace function private.audit_medication_dose_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_events (
      household_id, actor_profile_id, event_type, outcome, metadata
    )
    values (
      new.household_id,
      new.marked_by,
      'medication_dose.status',
      'success',
      jsonb_build_object(
        'dose_id', new.id,
        'plan_id', new.plan_id,
        'status', new.status
      )
    );
    if new.status = 'needs_help' then
      perform private.notify_care_team(
        new.household_id,
        'A medication reminder needs follow-up',
        'Someone marked a reminder as needing help. KindCare did not verify a dose.',
        'medication_dose',
        '/today'
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger medication_doses_audit
  after update on public.medication_doses
  for each row execute function private.audit_medication_dose_change();

create or replace function private.notify_on_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_care_team(
    new.household_id,
    'A KindCare request is waiting',
    'Someone in the household asked for a little help today.',
    'member_request',
    '/today'
  );
  return new;
end;
$$;

create trigger member_requests_notify
  after insert on public.member_requests
  for each row execute function private.notify_on_request();

create or replace function private.notify_on_occurrence_help()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'needs_help' and old.status is distinct from new.status then
    perform private.notify_care_team(
      new.household_id,
      'A reminder needs follow-up',
      'Someone asked for help with a reminder. KindCare is not watching them.',
      'routine',
      '/today'
    );
  end if;
  return new;
end;
$$;

create trigger routine_occurrences_help
  after update on public.routine_occurrences
  for each row execute function private.notify_on_occurrence_help();

alter table public.calendar_events enable row level security;
alter table public.calendar_events force row level security;
alter table public.routines enable row level security;
alter table public.routines force row level security;
alter table public.routine_occurrences enable row level security;
alter table public.routine_occurrences force row level security;
alter table public.medication_plans enable row level security;
alter table public.medication_plans force row level security;
alter table public.medication_doses enable row level security;
alter table public.medication_doses force row level security;
alter table public.member_requests enable row level security;
alter table public.member_requests force row level security;
alter table public.in_app_notifications enable row level security;
alter table public.in_app_notifications force row level security;

create policy calendar_events_select on public.calendar_events
  for select to authenticated
  using ((select private.is_active_member(household_id)));

create policy calendar_events_insert on public.calendar_events
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
  );

create policy calendar_events_update on public.calendar_events
  for update to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])))
  with check ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])));

create policy calendar_events_delete on public.calendar_events
  for delete to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])));

create policy routines_select on public.routines
  for select to authenticated
  using (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or assigned_to = (select auth.uid())
  );

create policy routines_insert on public.routines
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_role(household_id, array['organizer', 'caregiver']::text[]))
  );

create policy routines_update on public.routines
  for update to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])))
  with check ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])));

create policy routine_occurrences_select on public.routine_occurrences
  for select to authenticated
  using (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or assigned_to = (select auth.uid())
  );

create policy routine_occurrences_update on public.routine_occurrences
  for update to authenticated
  using (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or assigned_to = (select auth.uid())
  )
  with check (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or assigned_to = (select auth.uid())
  );

create policy medication_plans_select on public.medication_plans
  for select to authenticated
  using (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or member_profile_id = (select auth.uid())
  );

create policy medication_plans_insert on public.medication_plans
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_role(household_id, array['organizer', 'caregiver']::text[]))
  );

create policy medication_plans_update on public.medication_plans
  for update to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])))
  with check ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])));

create policy medication_doses_select on public.medication_doses
  for select to authenticated
  using (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or member_profile_id = (select auth.uid())
  );

create policy medication_doses_update on public.medication_doses
  for update to authenticated
  using (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or member_profile_id = (select auth.uid())
  )
  with check (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or member_profile_id = (select auth.uid())
  );

create policy member_requests_select on public.member_requests
  for select to authenticated
  using (
    member_profile_id = (select auth.uid())
    or (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
  );

create policy member_requests_insert on public.member_requests
  for insert to authenticated
  with check (
    member_profile_id = (select auth.uid())
    and (select private.is_active_member(household_id))
  );

create policy member_requests_update on public.member_requests
  for update to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])))
  with check ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])));

create policy in_app_notifications_select on public.in_app_notifications
  for select to authenticated
  using (profile_id = (select auth.uid()));

create policy in_app_notifications_update on public.in_app_notifications
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

grant select, insert, update, delete on table public.calendar_events to authenticated;
grant select, insert, update on table public.routines to authenticated;
grant select, update on table public.routine_occurrences to authenticated;
grant select, insert, update on table public.medication_plans to authenticated;
grant select, update on table public.medication_doses to authenticated;
grant select, insert, update on table public.member_requests to authenticated;
grant select, update on table public.in_app_notifications to authenticated;

grant execute on function public.materialize_plan_items() to authenticated;

revoke execute on function private.materialize_plan_items() from public, anon, authenticated;
revoke execute on function private.notify_care_team(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function private.local_due_at(date, time, text) from public, anon, authenticated;
revoke execute on function private.date_matches_plan(date, date, date, text, smallint[]) from public, anon, authenticated;
grant execute on function private.materialize_plan_items() to postgres;

do $$
begin
  perform cron.schedule(
    'kindcare-materialize-plan',
    '7 * * * *',
    'select private.materialize_plan_items()'
  );
exception
  when others then
    null;
end;
$$;
