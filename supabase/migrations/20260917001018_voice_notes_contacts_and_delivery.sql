create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  phone text
    check (phone is null or char_length(btrim(phone)) between 7 and 30),
  relationship text
    check (relationship is null or char_length(btrim(relationship)) between 1 and 80),
  include_in_talk boolean not null default true,
  is_emergency boolean not null default false,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_household_idx on public.contacts (household_id);

create table public.voice_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  recipient_id uuid not null references public.profiles (id),
  title text
    check (title is null or char_length(btrim(title)) between 1 and 80),
  body_text text
    check (body_text is null or char_length(body_text) <= 2000),
  storage_path text,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 1 and 180),
  created_at timestamptz not null default now(),
  check (storage_path is not null or body_text is not null)
);

create index voice_notes_household_idx on public.voice_notes (household_id, created_at desc);
create index voice_notes_recipient_idx on public.voice_notes (recipient_id);

create table public.scheduled_deliveries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  voice_note_id uuid not null references public.voice_notes (id) on delete cascade,
  deliver_at timestamptz not null,
  recurrence text not null default 'none'
    check (recurrence in ('none', 'daily', 'weekdays', 'weekly')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'delivered', 'canceled', 'failed')),
  listened_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index scheduled_deliveries_due_idx
  on public.scheduled_deliveries (status, deliver_at);
create index scheduled_deliveries_note_idx
  on public.scheduled_deliveries (voice_note_id, deliver_at desc);
create index scheduled_deliveries_household_idx
  on public.scheduled_deliveries (household_id, deliver_at);

create table public.help_alerts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  member_profile_id uuid not null references public.profiles (id),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'closed')),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles (id)
);

create index help_alerts_household_idx
  on public.help_alerts (household_id, created_at desc);

create or replace function private.member_can_hear(p_note_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.voice_notes as vn
    join public.scheduled_deliveries as sd on sd.voice_note_id = vn.id
    where vn.id = p_note_id
      and vn.recipient_id = (select auth.uid())
      and sd.status <> 'canceled'
      and sd.deliver_at <= now()
  );
$$;

create or replace function private.next_delivery_at(
  p_from timestamptz,
  p_recurrence text,
  p_timezone text
)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
declare
  next_at timestamptz;
  tz text;
  dow integer;
begin
  tz := coalesce(nullif(p_timezone, ''), 'America/New_York');
  if p_recurrence = 'daily' then
    return p_from + interval '1 day';
  elsif p_recurrence = 'weekly' then
    return p_from + interval '7 days';
  elsif p_recurrence = 'weekdays' then
    next_at := p_from + interval '1 day';
    dow := extract(dow from (next_at at time zone tz));
    if dow = 6 then
      next_at := next_at + interval '2 days';
    elsif dow = 0 then
      next_at := next_at + interval '1 day';
    end if;
    return next_at;
  end if;
  return null;
end;
$$;

create or replace function private.deliver_due_voice_notes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  due record;
  delivered_count integer := 0;
  next_at timestamptz;
  household_tz text;
begin
  for due in
    select sd.*, h.timezone
    from public.scheduled_deliveries as sd
    join public.households as h on h.id = sd.household_id
    where sd.status = 'scheduled'
      and sd.deliver_at <= now()
    order by sd.deliver_at
    for update of sd skip locked
  loop
    update public.scheduled_deliveries
    set status = 'delivered', delivered_at = now()
    where id = due.id;

    insert into public.audit_events (
      household_id, actor_profile_id, event_type, outcome, metadata
    )
    values (
      due.household_id,
      null,
      'voice_note.delivered',
      'success',
      jsonb_build_object('delivery_id', due.id, 'voice_note_id', due.voice_note_id)
    );

    delivered_count := delivered_count + 1;

    if due.recurrence <> 'none' then
      next_at := private.next_delivery_at(due.deliver_at, due.recurrence, due.timezone);
      if next_at is not null then
        insert into public.scheduled_deliveries (
          household_id, voice_note_id, deliver_at, recurrence, status
        )
        values (due.household_id, due.voice_note_id, next_at, due.recurrence, 'scheduled');
      end if;
    end if;
  end loop;

  return delivered_count;
end;
$$;

create or replace function public.deliver_due_voice_notes()
returns integer
language sql
security definer
set search_path = ''
as $$
  select private.deliver_due_voice_notes();
$$;

alter table public.contacts enable row level security;
alter table public.contacts force row level security;
alter table public.voice_notes enable row level security;
alter table public.voice_notes force row level security;
alter table public.scheduled_deliveries enable row level security;
alter table public.scheduled_deliveries force row level security;
alter table public.help_alerts enable row level security;
alter table public.help_alerts force row level security;

create policy contacts_select on public.contacts
  for select to authenticated
  using ((select private.is_active_member(household_id)));

create policy contacts_insert on public.contacts
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_role(household_id, array['organizer', 'caregiver']::text[]))
  );

create policy contacts_update on public.contacts
  for update to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])))
  with check ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])));

create policy contacts_delete on public.contacts
  for delete to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])));

create policy voice_notes_select on public.voice_notes
  for select to authenticated
  using (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or (select private.member_can_hear(id))
  );

create policy voice_notes_insert on public.voice_notes
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
  );

create policy scheduled_deliveries_select on public.scheduled_deliveries
  for select to authenticated
  using (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or (
      status <> 'canceled'
      and deliver_at <= now()
      and exists (
        select 1 from public.voice_notes as vn
        where vn.id = scheduled_deliveries.voice_note_id
          and vn.recipient_id = (select auth.uid())
      )
    )
  );

create policy scheduled_deliveries_insert on public.scheduled_deliveries
  for insert to authenticated
  with check (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
  );

create policy scheduled_deliveries_update on public.scheduled_deliveries
  for update to authenticated
  using (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or exists (
      select 1 from public.voice_notes as vn
      where vn.id = scheduled_deliveries.voice_note_id
        and vn.recipient_id = (select auth.uid())
        and scheduled_deliveries.deliver_at <= now()
        and scheduled_deliveries.status <> 'canceled'
    )
  )
  with check (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or exists (
      select 1 from public.voice_notes as vn
      where vn.id = scheduled_deliveries.voice_note_id
        and vn.recipient_id = (select auth.uid())
    )
  );

create policy help_alerts_select on public.help_alerts
  for select to authenticated
  using (
    member_profile_id = (select auth.uid())
    or (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
  );

create policy help_alerts_insert on public.help_alerts
  for insert to authenticated
  with check (
    member_profile_id = (select auth.uid())
    and (select private.is_active_member(household_id))
  );

create policy help_alerts_update on public.help_alerts
  for update to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])))
  with check ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-notes',
  'voice-notes',
  false,
  10485760,
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
on conflict (id) do nothing;

create policy voice_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'voice-notes'
    and private.is_active_member(((storage.foldername(name))[1])::uuid)
    and (
      private.has_role(
        ((storage.foldername(name))[1])::uuid,
        array['organizer', 'caregiver', 'helper']::text[]
      )
      or exists (
        select 1
        from public.voice_notes as vn
        where vn.storage_path = name
          and (select private.member_can_hear(vn.id))
      )
    )
  );

create policy voice_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'voice-notes'
    and private.has_role(
      ((storage.foldername(name))[1])::uuid,
      array['organizer', 'caregiver', 'helper']::text[]
    )
  );

create policy voice_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'voice-notes'
    and private.has_role(
      ((storage.foldername(name))[1])::uuid,
      array['organizer', 'caregiver']::text[]
    )
  );

grant select, insert, update, delete on table public.contacts to authenticated;
grant select, insert on table public.voice_notes to authenticated;
grant select, insert, update on table public.scheduled_deliveries to authenticated;
grant select, insert, update on table public.help_alerts to authenticated;

grant execute on function public.deliver_due_voice_notes() to authenticated;

revoke execute on function private.deliver_due_voice_notes() from public, anon, authenticated;
grant execute on function private.deliver_due_voice_notes() to postgres;
grant execute on function private.member_can_hear(uuid) to authenticated;

do $$
begin
  create extension if not exists pg_cron with schema pg_catalog;
  perform cron.schedule(
    'kindcare-deliver-voice-notes',
    '* * * * *',
    'select private.deliver_due_voice_notes()'
  );
exception
  when others then
    null;
end;
$$;
