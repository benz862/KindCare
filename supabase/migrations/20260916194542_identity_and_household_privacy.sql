create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  supported_person_name text
    check (supported_person_name is null or char_length(btrim(supported_person_name)) between 1 and 80),
  timezone text not null default 'America/New_York',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('organizer', 'caregiver', 'helper', 'member')),
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, profile_id)
);

create unique index household_members_one_active
  on public.household_members (profile_id)
  where status = 'active';

create index household_members_household_status_idx
  on public.household_members (household_id, status);

create index household_members_profile_idx
  on public.household_members (profile_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  email text not null,
  role text not null check (role in ('caregiver', 'helper', 'member')),
  token_hash text not null unique,
  invited_by uuid not null references public.profiles (id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitations_household_idx on public.invitations (household_id);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  member_profile_id uuid not null references public.profiles (id),
  choice text not null check (choice in ('share_with_caregivers', 'keep_private')),
  recorded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index consent_records_household_idx
  on public.consent_records (household_id, created_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete set null,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  outcome text not null check (outcome in ('success', 'denied', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_household_idx
  on public.audit_events (household_id, created_at desc);

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid());
$$;

create or replace function private.is_active_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members as hm
    where hm.household_id = p_household_id
      and hm.profile_id = (select auth.uid())
      and hm.status = 'active'
  );
$$;

create or replace function private.has_role(p_household_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members as hm
    where hm.household_id = p_household_id
      and hm.profile_id = (select auth.uid())
      and hm.status = 'active'
      and hm.role = any (p_roles)
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, 'KindCare member'), '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.handle_new_household()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.household_members (household_id, profile_id, role, status)
  values (new.id, new.created_by, 'organizer', 'active');

  insert into public.audit_events (
    household_id, actor_profile_id, event_type, outcome, metadata
  )
  values (
    new.id,
    new.created_by,
    'household.created',
    'success',
    jsonb_build_object('name', new.name)
  );

  return new;
end;
$$;

create trigger on_household_created
  after insert on public.households
  for each row execute function private.handle_new_household();

create or replace function public.create_invitation(
  p_household_id uuid,
  p_email text,
  p_role text
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

  if p_role = 'caregiver' then
    if not private.has_role(p_household_id, array['organizer']::text[]) then
      raise exception 'Only the household organizer can invite a caregiver.';
    end if;
  elsif not private.has_role(p_household_id, array['organizer', 'caregiver']::text[]) then
    raise exception 'You cannot invite someone to this household.';
  end if;

  normalized_email := lower(btrim(p_email));
  if normalized_email is null or position('@' in normalized_email) = 0 then
    raise exception 'Enter a valid email.';
  end if;

  raw_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.invitations (
    household_id, email, role, token_hash, invited_by, expires_at
  )
  values (
    p_household_id,
    normalized_email,
    p_role,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    (select auth.uid()),
    now() + interval '14 days'
  );

  insert into public.audit_events (
    household_id, actor_profile_id, event_type, outcome, metadata
  )
  values (
    p_household_id,
    (select auth.uid()),
    'invitation.created',
    'success',
    jsonb_build_object('role', p_role)
  );

  return raw_token;
end;
$$;

create or replace function public.invitation_preview(p_token text)
returns table (
  household_name text,
  role text,
  email text,
  expires_at timestamptz
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
    select h.name, i.role, i.email, i.expires_at
    from public.invitations as i
    join public.households as h on h.id = i.household_id
    where i.token_hash = hashed
      and i.accepted_at is null
      and i.revoked_at is null
      and i.expires_at > now();
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
  values (invite.household_id, actor, invite.role, 'active');

  update public.invitations
  set accepted_at = now()
  where id = invite.id;

  insert into public.audit_events (
    household_id, actor_profile_id, event_type, outcome, metadata
  )
  values (
    invite.household_id,
    actor,
    'invitation.accepted',
    'success',
    jsonb_build_object('role', invite.role)
  );

  return invite.household_id;
end;
$$;

create or replace function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite public.invitations%rowtype;
begin
  select * into invite from public.invitations where id = p_invitation_id;
  if invite.id is null then
    raise exception 'Invitation not found.';
  end if;
  if not private.has_role(invite.household_id, array['organizer', 'caregiver']::text[]) then
    raise exception 'You cannot change invitations for this household.';
  end if;

  update public.invitations
  set revoked_at = now()
  where id = p_invitation_id
    and accepted_at is null
    and revoked_at is null;

  insert into public.audit_events (
    household_id, actor_profile_id, event_type, outcome
  )
  values (invite.household_id, (select auth.uid()), 'invitation.revoked', 'success');
end;
$$;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.households enable row level security;
alter table public.households force row level security;
alter table public.household_members enable row level security;
alter table public.household_members force row level security;
alter table public.invitations enable row level security;
alter table public.invitations force row level security;
alter table public.consent_records enable row level security;
alter table public.consent_records force row level security;
alter table public.audit_events enable row level security;
alter table public.audit_events force row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.household_members as mine
      join public.household_members as theirs
        on theirs.household_id = mine.household_id
      where mine.profile_id = (select auth.uid())
        and mine.status = 'active'
        and theirs.profile_id = profiles.id
        and theirs.status = 'active'
    )
  );

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy households_select on public.households
  for select to authenticated
  using ((select private.is_active_member(id)));

create policy households_insert on public.households
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy households_update on public.households
  for update to authenticated
  using ((select private.has_role(id, array['organizer']::text[])))
  with check ((select private.has_role(id, array['organizer']::text[])));

create policy household_members_select on public.household_members
  for select to authenticated
  using ((select private.is_active_member(household_id)));

create policy household_members_update on public.household_members
  for update to authenticated
  using ((select private.has_role(household_id, array['organizer']::text[])))
  with check ((select private.has_role(household_id, array['organizer']::text[])));

create policy invitations_select on public.invitations
  for select to authenticated
  using ((select private.has_role(household_id, array['organizer', 'caregiver']::text[])));

create policy consent_records_select on public.consent_records
  for select to authenticated
  using ((select private.is_active_member(household_id)));

create policy consent_records_insert on public.consent_records
  for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and (
      member_profile_id = (select auth.uid())
      or (select private.has_role(household_id, array['organizer', 'caregiver']::text[]))
    )
  );

create policy audit_events_select on public.audit_events
  for select to authenticated
  using (
    household_id is not null
    and (select private.has_role(household_id, array['organizer', 'caregiver']::text[]))
  );

grant usage on schema public to anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update on table public.households to authenticated;
grant select, update on table public.household_members to authenticated;
grant select on table public.invitations to authenticated;
grant select, insert on table public.consent_records to authenticated;
grant select on table public.audit_events to authenticated;

grant execute on function public.create_invitation(uuid, text, text) to authenticated;
grant execute on function public.invitation_preview(text) to anon, authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;

revoke all on schema private from anon, authenticated;
revoke execute on function private.current_profile_id() from public, anon, authenticated;
revoke execute on function private.is_active_member(uuid) from public, anon, authenticated;
revoke execute on function private.has_role(uuid, text[]) from public, anon, authenticated;
