create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references public.households (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null
    check (
      status in (
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
      )
    ),
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_status_idx on public.subscriptions (status);

create table public.stripe_webhook_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.stripe_webhook_events force row level security;

create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using ((select private.is_active_member(household_id)));

grant select on table public.subscriptions to authenticated;

revoke all on table public.stripe_webhook_events from public, anon, authenticated;
revoke insert, update, delete on table public.subscriptions from public, anon, authenticated;
