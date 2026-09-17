# Security and privacy notes

## Implemented controls

- RLS is enabled on every exposed application table and private storage objects.
- Household records carry explicit ownership and cross-table composite foreign keys.
- Roles and permissions come from active server-read memberships, not request parameters or editable auth user metadata.
- Caregiver-sensitive actions require TOTP assurance level 2.
- Invitation tokens contain 256 bits of entropy; only SHA-256 hashes are stored and invitations expire.
- Audit rows cannot be inserted, updated, or deleted by browser roles.
- Caregiver notes/administration, alerts, audit data, and membership administration are excluded from Dad's policies and routes.
- Logs redact keys commonly associated with identity, health, voice, secrets, and conversation content.
- Audio storage is private and scoped by the household UUID at the first object-path segment.
- Security headers deny framing and unnecessary device capabilities. Production CSP excludes `unsafe-eval`.

## Threat-model priorities

Before production, independently test:

1. IDOR/cross-household reads and writes on every Server Action, REST endpoint, Data API table, and storage path.
2. Session theft, reset-link abuse, MFA enrollment/recovery, stale JWT authorization, revoked membership, and ownership-transfer races.
3. Invitation forwarding, email mismatch, replay, expiry, brute force, and account enumeration.
4. Consent downgrade/withdrawal, transcript policy transitions, caregiver note leakage, and exported-data filtering.
5. Schedule timezone/DST edge cases, duplicate jobs, retry storms, missed reminders, and neutral notification previews.
6. Prompt/tool injection and unauthorized model actions before any AI provider is connected.
7. Urgent-language false positives/negatives, rate limits, alert fatigue, and factual audit records.

## Known pre-launch gaps

- Ownership transfer uses a compensating server-side update because the current milestone has no privileged transactional API. Replace it with a reviewed transactional backend operation before production.
- No account recovery policy exists for a lost MFA device.
- No deletion/export workflow UI, backup restore test, penetration test, vendor review, or formal incident response has been completed.
- No scheduled worker, external notification provider, AI, or audio upload is active.
- The included policies and tests are a foundation, not a legal/compliance certification.

## Required operational separation

Use independent Supabase and Vercel projects, domains, secrets, logs, storage, backups, and support access for staging and production. Never connect this project to the existing Careful Companion app without a separate architecture, privacy, and migration review.
