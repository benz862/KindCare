create table public.companion_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  member_profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('member', 'companion')),
  content text not null check (char_length(content) between 1 and 1500),
  caregiver_summary text check (caregiver_summary is null or char_length(caregiver_summary) <= 220),
  needs_attention boolean not null default false,
  created_at timestamptz not null default now()
);

create index companion_messages_member_created_idx
  on public.companion_messages (member_profile_id, created_at desc);
create index companion_messages_household_attention_idx
  on public.companion_messages (household_id, needs_attention, created_at desc);

alter table public.companion_messages enable row level security;
alter table public.companion_messages force row level security;

create policy companion_messages_select on public.companion_messages
  for select to authenticated
  using (
    member_profile_id = (select auth.uid())
    or (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
  );

create policy companion_messages_insert on public.companion_messages
  for insert to authenticated
  with check (
    member_profile_id = (select auth.uid())
    and (select private.is_active_member(household_id))
  );

grant select, insert on table public.companion_messages to authenticated;
