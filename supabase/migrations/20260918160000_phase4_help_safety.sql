alter table public.households
  add column help_confirm_required boolean not null default true;

alter table public.help_alerts
  add column summary text check (summary is null or char_length(summary) <= 500);

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
      '/today'
    );
    insert into public.audit_events (
      household_id, actor_profile_id, event_type, outcome, metadata
    )
    values (
      new.household_id,
      new.member_profile_id,
      'help_alert.created',
      'success',
      jsonb_build_object('help_alert_id', new.id, 'status', new.status)
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.audit_events (
      household_id, actor_profile_id, event_type, outcome, metadata
    )
    values (
      new.household_id,
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

create trigger help_alerts_notify
  after insert or update on public.help_alerts
  for each row execute function private.notify_on_help_alert();

revoke execute on function private.notify_on_help_alert() from public, anon, authenticated;
grant execute on function private.notify_on_help_alert() to postgres;

create or replace function public.update_help_action(
  p_household_id uuid,
  p_confirm_required boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role(p_household_id, array['organizer', 'caregiver']::text[]) then
    raise exception 'You cannot change the help action for this household.';
  end if;

  update public.households
  set help_confirm_required = p_confirm_required,
      updated_at = now()
  where id = p_household_id;

  insert into public.audit_events (
    household_id, actor_profile_id, event_type, outcome, metadata
  )
  values (
    p_household_id,
    (select auth.uid()),
    'help_action.updated',
    'success',
    jsonb_build_object('help_confirm_required', p_confirm_required)
  );
end;
$$;

revoke execute on function public.update_help_action(uuid, boolean) from public, anon;
grant execute on function public.update_help_action(uuid, boolean) to authenticated;
