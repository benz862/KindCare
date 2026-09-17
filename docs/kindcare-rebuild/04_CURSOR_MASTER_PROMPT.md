# Cursor Master Prompt — Build KindCare Fresh

Copy everything below this line into Cursor.

---

Build a new, production-minded KindCare application from scratch. Do not attempt to repair or preserve the prior Care Circle/Caregiver Companion implementation. Use the documents in `docs/kindcare-rebuild/` as the product source of truth, reading them in numeric order before changing code.

## Product

KindCare is a private, warm care-companion app owned by SkillBinder LLC. It helps a caregiver coordinate everyday support and helps an older adult feel connected. The brand line is: “More connection. More kindness. More peace of mind.”

The app has two distinct experiences:

- **Caregiver**: a polished workspace for messages, calendar, scheduled voice notes, medication plans, reminders/routines, trusted people, and gentle daily oversight.
- **Member**: a drastically simpler home screen with voice messages, clear bulletins, today’s medication/tasks, upcoming appointments, a way to talk to trusted people, and a carefully explained help action.

KindCare is not medical advice, medical monitoring, or emergency dispatch. Never imply otherwise.

Use passkeys for Face ID, Touch ID, Android biometric/device unlock, and Windows Hello where supported. The app must never collect or store biometric data. Follow `05_AUTH_AND_DEVICE_ACCESS.md` for the shared-device and recovery rules.

Medication plans are caregiver-entered records based on the prescription label or clinician-approved information. Build scheduling and status logging only: never recommend a dose, calculate a dose, advise on a missed dose, assess drug interactions, or claim that a member took a medication. “Taken” must mean “marked taken by [person] at [time].”

## Tech choices

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase for Auth, Postgres, RLS, Storage, Realtime
- Resend for transactional email
- Stripe for subscriptions later; use Stripe Checkout, webhooks, and customer portal
- Deploy to Vercel

## How to work

1. First inspect the repository and summarize what can be reused safely versus what should be replaced.
2. Propose a new directory structure and implementation plan before making major changes.
3. Create the design foundation first: KindCare tokens, reusable layout, form controls, cards, and accessible member-mode components.
4. Build one complete vertical slice at a time: authentication + household creation, invitations/roles, voice notes and scheduling, calendar/routines, medication plan and dose statuses, then alerts.
5. Write Supabase migrations and RLS policies with each data feature. Verify cross-household isolation with tests.
6. Keep all credentials in environment variables. Do not fabricate production keys, email addresses, URLs, Stripe products, or Supabase project IDs.
7. Run type checks and relevant tests after each substantial phase. Explain failures plainly and fix them before moving on.

## Visual direction

Use the KindCare brand palette: Trust Navy `#0B4A86`, Care Teal `#10C1B5`, Warm Spark `#FF724F`, Soft Mist `#E8F7F4`, Ink `#13233D`, Cloud `#F8FBFA`.

Aim for polished, calm, premium, and warm. Use generous spacing, large type, clean surfaces, real hierarchy, and accessible contrast. Avoid clinical dashboards, crowded sidebars, tiny text, harsh red alerts, and generic template-like layouts.

## First request

Start by reading `docs/kindcare-rebuild/00_START_HERE.md`, then provide:

1. A concise rebuild assessment.
2. The proposed project structure.
3. A phased task list with acceptance criteria.
4. The first small implementation step you will take.

Do not start Stripe, Resend, or production Supabase account setup until the account credentials and product/pricing decisions are provided.
