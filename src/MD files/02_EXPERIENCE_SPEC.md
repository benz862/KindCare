# KindCare Experience Specification

## Information architecture

### Caregiver navigation

- **Today** — the useful daily overview
- **Messages** — voice notes and text notes
- **Calendar** — appointments, important events, reminders, and scheduled messages
- **Plan** — routines, medication plan, reminders, and tasks
- **People** — member profile, trusted helpers, and contacts
- **Settings** — household, notification, consent, billing, and privacy controls

### Member navigation

The member should not see a conventional app dashboard. Their home is a single, calm screen:

1. A warm greeting and date.
2. Today’s voice message, if present.
3. Today’s medication doses, tasks, and reminders, no more than three at once.
4. A “Talk to someone” button.
5. A carefully designed “I need help” button.

## Key screens

### 1. Welcome and household setup

Caregiver creates an account, names the household, and chooses whom they support. Explain the product plainly and include the non-medical/non-emergency notice in clear language. Do not ask for unnecessary health information.

### 2. Caregiver Today

Top area: a reassuring summary such as “George has two gentle reminders today.”

Content cards:

- Next planned item
- Recent connection (for example, “Voice note listened to today at 10:42 AM”)
- Open help requests
- A quick “Send a note” action
- A quick “Add a reminder” action

The page includes a compact day timeline so the caregiver can see medication times, appointments, tasks, and scheduled voice notes together.

The page should be actionable without becoming a spreadsheet.

### 3. Create a voice note

The caregiver chooses a recipient, records a short message, listens back, optionally adds a title/text summary, and either sends it now or schedules it for a chosen time. Scheduled messages can be one-time or repeating (for example, a weekday morning hello). The recipient’s interface shows a familiar play button, message title, sender, and date. A scheduled note must not be available to the member before its delivery time.

### 4. Calendar

The caregiver sees month, week, and day views. Calendar items can be appointments, social events, reminders, medication doses, tasks, and scheduled voice-note deliveries. The default view is a simple day timeline.

The member sees a simplified agenda/calendar: **Today**, **Tomorrow**, and **Coming up**. Keep it readable and focused on appointments and important events; do not expose complex scheduling controls.

### 5. Medication plan and dose tracking

The caregiver can create a medication plan from the prescription label or clinician-approved list:

- medication name and optional photo of the label
- strength exactly as written on the label
- caregiver-entered amount and timing
- plain-language reminder text
- start/end date, optional days of week, and refill note
- assigned member and notification preference

Each scheduled dose becomes a separate log entry. The member can select **Taken**, **Skip**, or **I need help**. A caregiver can log a dose on the member’s behalf and add a note. The caregiver dashboard shows status as “marked taken,” “skipped,” “not yet marked,” or “needs follow-up.” It must never claim to know whether a person actually took medicine.

For safety, show the prescription-label reminder whenever a plan is added or changed. Do not offer dosing suggestions, drug-interaction advice, dose calculations, or missed-dose instructions.

### 6. Routine/task editor

Use plain labels: “What would you like to remember?” “When?” “Who is it for?” “How should KindCare follow up?”

Reminder types: check-in, appointment, medication, task, custom. The member can check off ordinary tasks and reminders. Medication reminders use the separate medication-plan workflow above and keep the safety notice visible.

### 7. Trusted people and contacts

Separate app participants from emergency contacts. A contact can be saved for calls/texts without being able to view household information. Make roles understandable:

- Organizer: manages household and billing
- Caregiver: manages plan/messages
- Helper: sees assigned items and approved member information
- Member: uses the simplified home experience

### 8. Member help flow

Button label: “I need help.”

Flow:

1. Show a calm confirmation panel with the member’s chosen contacts.
2. State the emergency limitation clearly.
3. Offer actions: call emergency services, call a trusted person, send a help alert.
4. After an alert is sent, show exactly what happened and a large “Call [contact]” option.

## Accessibility requirements

- Body text minimum 18px in the member experience.
- Main member actions should be at least 56px tall.
- Do not rely on color alone for state or urgency.
- Strong visible keyboard focus and semantic labels.
- Captions/transcripts for voice notes when enabled by the sender.
- Respect reduced-motion preferences.
- Test at 200% browser zoom and on a narrow phone screen.

## Trust and content language

Good: “A gentle reminder from Anne.”

Avoid: “Compliance,” “patient monitoring,” “non-adherent,” or “we are watching.”

Always use the same plain disclaimer where relevant: “KindCare supports connection and coordination. It does not provide medical advice, medical monitoring, or emergency dispatch.”

For a medication item, use: “This is a reminder from your care plan. Please check your prescription label. If you are unsure, contact your caregiver, pharmacist, or clinician.”
