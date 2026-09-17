alter table public.profiles
  add column notify_in_app boolean not null default true,
  add column notify_email boolean not null default false;

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  assigned_to uuid references public.profiles (id),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  notes text check (notes is null or char_length(notes) <= 2000),
  kind text not null check (kind in ('appointment', 'event', 'task')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  status text not null default 'open' check (status in ('open', 'done', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_events_household_starts_idx
  on public.calendar_events (household_id, starts_at);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  assigned_to uuid not null references public.profiles (id),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  kind text not null check (kind in ('check_in', 'appointment', 'task', 'custom')),
  notes text check (notes is null or char_length(notes) <= 2000),
  local_time time not null,
  start_on date not null,
  end_on date,
  recurrence text not null default 'none'
    check (recurrence in ('none', 'daily', 'weekdays', 'weekly')),
  days_of_week smallint[]
    check (
      days_of_week is null
      or (
        cardinality(days_of_week) between 1 and 7
        and days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
      )
    ),
  follow_up text not null default 'none' check (follow_up in ('none', 'notify_caregiver')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index routines_household_idx on public.routines (household_id, active);

create table public.routine_occurrences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  assigned_to uuid not null references public.profiles (id),
  due_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'done', 'skipped', 'needs_help')),
  completed_at timestamptz,
  completed_by uuid references public.profiles (id),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (routine_id, due_at)
);

create index routine_occurrences_household_due_idx
  on public.routine_occurrences (household_id, due_at);
create index routine_occurrences_assigned_idx
  on public.routine_occurrences (assigned_to, due_at);

create table public.medication_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  member_profile_id uuid not null references public.profiles (id),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  strength_label text not null check (char_length(btrim(strength_label)) between 1 and 80),
  amount_text text not null check (char_length(btrim(amount_text)) between 1 and 80),
  reminder_text text check (reminder_text is null or char_length(reminder_text) <= 500),
  times time[] not null check (cardinality(times) between 1 and 6),
  days_of_week smallint[]
    check (
      days_of_week is null
      or (
        cardinality(days_of_week) between 1 and 7
        and days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
      )
    ),
  start_on date not null,
  end_on date,
  refill_note text check (refill_note is null or char_length(refill_note) <= 500),
  notify_organizer boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index medication_plans_household_idx
  on public.medication_plans (household_id, active);

create table public.medication_doses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  plan_id uuid not null references public.medication_plans (id) on delete cascade,
  member_profile_id uuid not null references public.profiles (id),
  due_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'taken', 'skipped', 'needs_help')),
  marked_at timestamptz,
  marked_by uuid references public.profiles (id),
  caregiver_note text check (caregiver_note is null or char_length(caregiver_note) <= 500),
  created_at timestamptz not null default now(),
  unique (plan_id, due_at)
);

create index medication_doses_household_due_idx
  on public.medication_doses (household_id, due_at);
create index medication_doses_member_idx
  on public.medication_doses (member_profile_id, due_at);

create table public.member_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  member_profile_id uuid not null references public.profiles (id),
  kind text not null
    check (kind in ('call_me', 'groceries', 'ride', 'something_else')),
  message text check (message is null or char_length(message) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id)
);

create index member_requests_household_idx
  on public.member_requests (household_id, created_at desc);

create table public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  body text not null check (char_length(body) <= 500),
  kind text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index in_app_notifications_profile_idx
  on public.in_app_notifications (profile_id, created_at desc);
