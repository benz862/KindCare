create table public.wellbeing_checkins (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  member_profile_id uuid not null references public.profiles (id),
  feeling text not null check (feeling in ('doing_well', 'okay', 'would_like_to_talk')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index wellbeing_checkins_household_idx
  on public.wellbeing_checkins (household_id, created_at desc);
create index wellbeing_checkins_member_idx
  on public.wellbeing_checkins (member_profile_id, created_at desc);

create table public.request_presets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  label text not null check (char_length(btrim(label)) between 1 and 80),
  kind text not null check (kind in ('call_me', 'groceries', 'ride', 'something_else')),
  sort_order smallint not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index request_presets_household_idx
  on public.request_presets (household_id, sort_order, created_at);

alter table public.member_requests
  add column label text check (label is null or char_length(btrim(label)) between 1 and 80);

create table public.moments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text check (body is null or char_length(btrim(body)) <= 500),
  photo_path text,
  created_at timestamptz not null default now(),
  check (
    photo_path is not null
    or char_length(btrim(coalesce(body, ''))) between 1 and 500
  )
);

create index moments_household_idx
  on public.moments (household_id, created_at desc);

create table public.handoffs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index handoffs_household_idx
  on public.handoffs (household_id, created_at desc);

create table public.handoff_assignments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  handoff_id uuid not null references public.handoffs (id) on delete cascade,
  assigned_to uuid references public.profiles (id),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  done boolean not null default false,
  done_at timestamptz,
  done_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index handoff_assignments_household_idx
  on public.handoff_assignments (household_id, done, created_at desc);

create table public.handoff_acks (
  handoff_id uuid not null references public.handoffs (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (handoff_id, profile_id)
);

create table public.appointment_preparations (
  event_id uuid primary key references public.calendar_events (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  questions text check (questions is null or char_length(questions) <= 2000),
  documents_to_bring text check (documents_to_bring is null or char_length(documents_to_bring) <= 2000),
  transport_plan text check (transport_plan is null or char_length(transport_plan) <= 2000),
  follow_up_tasks text check (follow_up_tasks is null or char_length(follow_up_tasks) <= 2000),
  updated_at timestamptz not null default now()
);

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
    '/today'
  );
  return new;
end;
$$;

create trigger wellbeing_checkins_notify
  after insert on public.wellbeing_checkins
  for each row execute function private.notify_on_checkin();

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
    '/moments'
  );
  return new;
end;
$$;

create trigger moments_notify
  after insert on public.moments
  for each row execute function private.notify_on_moment();

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
    '/today'
  );
  return new;
end;
$$;

create trigger handoffs_notify
  after insert on public.handoffs
  for each row execute function private.notify_on_handoff();

alter table public.wellbeing_checkins enable row level security;
alter table public.wellbeing_checkins force row level security;
alter table public.request_presets enable row level security;
alter table public.request_presets force row level security;
alter table public.moments enable row level security;
alter table public.moments force row level security;
alter table public.handoffs enable row level security;
alter table public.handoffs force row level security;
alter table public.handoff_assignments enable row level security;
alter table public.handoff_assignments force row level security;
alter table public.handoff_acks enable row level security;
alter table public.handoff_acks force row level security;
alter table public.appointment_preparations enable row level security;
alter table public.appointment_preparations force row level security;

create policy wellbeing_checkins_select on public.wellbeing_checkins
  for select to authenticated
  using (
    member_profile_id = (select auth.uid())
    or (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
  );

create policy wellbeing_checkins_insert on public.wellbeing_checkins
  for insert to authenticated
  with check (
    member_profile_id = (select auth.uid())
    and (select private.has_role(household_id, array['member']::text[]))
  );

create policy request_presets_select on public.request_presets
  for select to authenticated
  using ((select private.is_active_member(household_id)));

create policy request_presets_insert on public.request_presets
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.has_role(household_id, array['organizer', 'caregiver']::text[]))
  );

create policy request_presets_update on public.request_presets
  for update to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])))
  with check ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])));

create policy moments_select on public.moments
  for select to authenticated
  using ((select private.is_active_member(household_id)));

create policy moments_insert on public.moments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.is_active_member(household_id))
  );

create policy moments_delete on public.moments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    or (select private.has_role(household_id, array['organizer', 'caregiver']::text[]))
  );

create policy handoffs_select on public.handoffs
  for select to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])));

create policy handoffs_insert on public.handoffs
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
  );

create policy handoff_assignments_select on public.handoff_assignments
  for select to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])));

create policy handoff_assignments_insert on public.handoff_assignments
  for insert to authenticated
  with check (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
  );

create policy handoff_assignments_update on public.handoff_assignments
  for update to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])))
  with check ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])));

create policy handoff_acks_select on public.handoff_acks
  for select to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])));

create policy handoff_acks_insert on public.handoff_acks
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
  );

create policy appointment_preparations_select on public.appointment_preparations
  for select to authenticated
  using ((select private.is_active_member(household_id)));

create policy appointment_preparations_insert on public.appointment_preparations
  for insert to authenticated
  with check ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])));

create policy appointment_preparations_update on public.appointment_preparations
  for update to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])))
  with check ((select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[])));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'moments',
  'moments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy moment_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'moments'
    and private.is_active_member(((storage.foldername(name))[1])::uuid)
  );

create policy moment_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'moments'
    and private.is_active_member(((storage.foldername(name))[1])::uuid)
  );

create policy moment_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'moments'
    and (
      private.has_role(
        ((storage.foldername(name))[1])::uuid,
        array['organizer', 'caregiver']::text[]
      )
      or ((storage.foldername(name))[2])::uuid = (select auth.uid())
    )
  );

grant select, insert on table public.wellbeing_checkins to authenticated;
grant select, insert, update on table public.request_presets to authenticated;
grant select, insert, delete on table public.moments to authenticated;
grant select, insert on table public.handoffs to authenticated;
grant select, insert, update on table public.handoff_assignments to authenticated;
grant select, insert on table public.handoff_acks to authenticated;
grant select, insert, update on table public.appointment_preparations to authenticated;

revoke execute on function private.notify_on_checkin() from public, anon, authenticated;
revoke execute on function private.notify_on_moment() from public, anon, authenticated;
revoke execute on function private.notify_on_handoff() from public, anon, authenticated;
grant execute on function private.notify_on_checkin() to postgres;
grant execute on function private.notify_on_moment() to postgres;
grant execute on function private.notify_on_handoff() to postgres;
