# Operations and launch gate

## Health and errors

- `GET /api/health` checks that the web process is responding; it intentionally returns no environment or database details.
- Server logs are structured JSON and must be shipped to an access-controlled service with content redaction and retention limits.
- Audit write failures are application errors. Investigate before retrying the user action to avoid duplicate side effects.

## Missed or failed notifications

Only in-app notifications exist in this milestone. Do not describe them as monitored or guaranteed. Before scheduled/external delivery is enabled:

1. Add an idempotent queue consumer and unique delivery key.
2. Define retry ceilings, exponential delay, dead-letter handling, and operator alerts.
3. Add a dashboard for overdue jobs without private message content.
4. Test a full provider outage and recovery without duplicate sends.
5. Keep external previews neutral.

## Backup and recovery

Before launch, enable encrypted automated Postgres and Storage backups in each environment. Perform and document a restore into an isolated project, verify row counts and object integrity, rotate restored secrets, and delete the recovery environment.

## Incident response

1. Stop affected workers or deployment while preserving evidence.
2. Revoke exposed credentials and sessions; remember that deleting a Supabase user alone does not invalidate existing access tokens.
3. Determine affected households from factual audit records, not raw sensitive content in logs.
4. Follow reviewed legal notification obligations and provider procedures.
5. Repair, test cross-household isolation, deploy, and document lessons learned.

## Production launch gate

- Threat model and independent authorization test completed.
- Privacy policy, terms, consent copy, retention/deletion/export, vendor contracts, regions, encryption, incident process, and BAA needs reviewed.
- Separate staging/production projects and secrets configured.
- Backups and restore test completed.
- Auth, RLS, consent, check-in, timezone, idempotency, retry, and safety tests passing.
- Older-adult/caregiver accessibility and mobile usability review completed.
- Error monitoring, alerts, support channel, escalation contacts, and operational ownership assigned.
- Product copy consistently states supportive companion and care coordination—not family, clinician, monitoring, or emergency-service replacement.
