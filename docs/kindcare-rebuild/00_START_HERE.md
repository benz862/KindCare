# KindCare Rebuild — Start Here

This folder is the source of truth for a fresh KindCare rebuild. It deliberately does **not** ask Cursor to repair or extend the existing prototype. Build a new application from these specifications, using the existing code only as optional reference material.

## The product in one sentence

KindCare helps an older adult feel connected and supported while giving their trusted caregiver a calm, private place to coordinate everyday care.

## Read in this order

1. `01_PRODUCT_VISION.md` — what we are building and what we are not building.
2. `02_EXPERIENCE_SPEC.md` — the two user experiences and their important screens.
3. `03_BUILD_PLAN.md` — implementation order, services, and acceptance criteria.
4. `05_AUTH_AND_DEVICE_ACCESS.md` — Face ID, fingerprint, passkeys, shared-device rules, and recovery.
5. `06_FEATURE_BACKLOG.md` — worthwhile additions after the first release.
6. `04_CURSOR_MASTER_PROMPT.md` — paste this into Cursor to begin.

## Non-negotiables

- The older-adult experience must be dramatically simpler than the caregiver experience.
- KindCare is supportive companionship and coordination, not medical advice, medical monitoring, or emergency dispatch.
- Emergency actions must make the limits clear and should guide the person to call local emergency services when appropriate.
- Every household is private. A person can only see information they are explicitly allowed to see.
- The visual tone is warm, polished, clear, and reassuring—not clinical, childish, or cluttered.
- Brand line: **More connection. More kindness. More peace of mind.**
- Owner: **SkillBinder LLC**.

## Preferred stack

- Next.js + TypeScript + Tailwind CSS
- Supabase: Auth, Postgres, Row Level Security, Storage, Realtime
- Resend: transactional email
- Stripe: subscriptions, when plans are defined
- Vercel: deployment

## Definition of a successful first release

A caregiver can create a household, invite a loved one and trusted helpers, leave a voice note, schedule a gentle reminder, and see whether a connection/check-in happened. The older adult can open a very simple home screen, listen to a message, tap to connect with a trusted person, and use a clearly explained help action.
