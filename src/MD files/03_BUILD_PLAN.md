# KindCare Rebuild Plan

## Phase 0 — Foundation

- Create a clean Next.js project in a new rebuild directory/repository.
- Add TypeScript, Tailwind CSS, linting, formatting, and a small component system.
- Add the KindCare design tokens, wordmark, and reusable page shell.
- Add a public marketing landing page, legal footer, privacy page, and terms placeholder.
- Keep secrets exclusively in environment variables. Never commit `.env.local`.

## Phase 1 — Identity and household privacy

- Connect Supabase Auth using email/password and password reset.
- Build profiles, households, household memberships, invitations, and role management.
- Write migrations and Row Level Security policies before building data screens.
- Add an audit trail for invitations, role changes, and help alerts.
- Test cross-household isolation before moving on.

## Phase 2 — Core connection

- Caregiver Today page
- Member Home page
- Voice-note recording/upload/playback using Supabase Storage
- Text note fallback and optional transcript field
- Scheduled voice-note delivery with a background job and delivery audit trail
- Contacts and trusted helpers

## Phase 3 — Everyday coordination

- Shared calendar with day/week/month caregiver views and simple member agenda
- Reminder/routine creation and recurring schedules
- Caregiver-entered medication plan and individual dose schedule
- Member completion/check-in flow for tasks and dose-status flow for medications
- Requests from member to caregiver
- In-app notifications and email notification preferences

## Phase 4 — Safety and communication

- Configurable help action and emergency contacts
- In-app alerts and audit events
- Resend email templates for invitations, password resets, help alerts, and important updates
- Do not send medical content or claim that a message was monitored

## Phase 5 — Revenue and launch readiness

- Decide pricing, trial rules, and what billing owner is responsible for payment.
- Connect Stripe using the SkillBinder Stripe account.
- Use Stripe Checkout and the customer portal; do not build a custom card-entry form.
- Process Stripe webhooks server-side and use them—not the browser—to update subscription status.
- Configure production Supabase, Resend domain, Stripe webhook, and Vercel environment variables.

## Data model outline

- `profiles` — authenticated person, display name, accessibility preferences
- `households` — private household/workspace
- `household_members` — profile, household, role, status
- `invitations` — one-time, expiring invitations
- `contacts` — trusted/emergency contact details, scoped to household
- `voice_notes` — author, recipient, storage path, text summary, read/listened timestamps
- `scheduled_deliveries` — future/repeating voice-note delivery time, state, and delivery audit
- `calendar_events` — appointments, events, tasks, scheduled messages, and calendar metadata
- `routines` — reminder definitions and recurrence
- `routine_occurrences` — individual scheduled instances and completion state
- `medication_plans` — caregiver-entered medication details, label source, schedule, and active dates
- `medication_doses` — individual dose occurrence, marked status, actor, timestamp, and note
- `help_alerts` — member requests for help and action history
- `consent_records` — consent and sharing choices
- `audit_events` — security-sensitive history
- `subscriptions` — server-managed Stripe subscription state

## Security requirements

- Enable RLS on every exposed Supabase table.
- Scope each policy to a household membership check; never rely on hidden UI elements.
- Keep Supabase service-role credentials server-only.
- Keep Resend and Stripe secrets server-only.
- Use signed URLs or controlled server access for private voice files.
- Rate limit login, password reset, invitation, and help-alert endpoints.
- Record medication-plan changes and dose-status changes in the audit log.
- Never generate medication dosage, interaction, missed-dose, or treatment guidance.
- Validate all server action and API input with schemas.
- Add logging that is useful without storing sensitive message contents unnecessarily.

## Acceptance tests for the first release

1. A caregiver cannot view another household’s data by altering a URL or request.
2. A member can listen to a voice note and mark a reminder complete on a phone.
3. A caregiver can schedule a voice note; it does not appear to the member until its scheduled delivery time.
4. A caregiver can create a medication plan and see dose statuses without the app making medical claims or recommendations.
5. A member can view upcoming appointments and check off tasks from a simple agenda.
6. A caregiver can invite a helper and remove them later.
7. A help alert clearly records who was notified and does not promise emergency dispatch.
8. Email templates use KindCare branding and send from the approved Resend domain.
9. Stripe subscription state cannot be faked from the browser.
