alter table public.stripe_webhook_events
  add column if not exists household_id uuid references public.households (id) on delete set null,
  add column if not exists stripe_object_id text,
  add column if not exists livemode boolean;

create index if not exists stripe_webhook_events_type_created_idx
  on public.stripe_webhook_events (type, created_at desc);

create index if not exists stripe_webhook_events_household_idx
  on public.stripe_webhook_events (household_id, created_at desc);
