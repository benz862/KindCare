# Architecture

## Trust boundaries

The browser receives only the Supabase project URL and publishable key. Next.js Server Components and Server Actions resolve the signed-in user from secure session cookies. The active household, role, and permissions are loaded from `household_members`; action payloads never establish authority.

Every ordinary data query uses the signed-in user's Supabase session and is checked twice:

1. Server authorization verifies authentication, active membership, role/permission, and resource household ownership.
2. Postgres row-level security independently limits rows using `auth.uid()`.

The service-role client is server-only and limited to audit writes, auth administration, invitation acceptance, ownership transfer, fictional seeding, and future workers. Each call site first verifies a user context or a trusted job identity. The service-role key must never be prefixed with `NEXT_PUBLIC_`.

## Application layout

- `src/app/(auth)`: sign-in, sign-up, password recovery, and MFA challenge.
- `src/app/(protected)/dad`: supported-member experience and consent controls.
- `src/app/(protected)/caregiver`: caregiver Today and management workflows.
- `src/app/(protected)/settings`: MFA and caregiver-only household administration.
- `src/lib/auth`: centralized context and permission checks.
- `src/lib/data`: household-scoped dashboard reads.
- `supabase/migrations`: schema, RLS, storage, constraints, and atomic calendar review.
- `supabase/tests`: database authorization tests.

## Data and job model

Postgres is the source of truth. All household-owned rows include `household_id`, with composite foreign keys preventing a child resource from referencing another household. Local timestamps retain an IANA timezone and are converted server-side.

`voice_messages`, delivery attempts, private storage policies, notifications, and idempotency keys establish the later delivery boundary, but this milestone does not upload or deliver audio. Queues/Cron must be added only with retry, deduplication, and missed-notification operations in place.

## Consent and safety

Conversation consent is append-only: summaries, full transcripts, or safety-only. RLS allows caregiver transcript access only for `full_transcripts`; safety-only conversations are not caregiver-readable. Dad can see and change the current mode and its dated history.

Medication data represents reminders and member check-ins only. `need_help` creates a factual concerning alert and a neutral in-app caregiver notification. Dad's page always offers direct trusted-contact and local emergency calling and explicitly says the app does not monitor or dispatch help.
