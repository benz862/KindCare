import { z } from "zod";

import { inviteRoles } from "@/lib/roles";

export const passwordSchema = z
  .string()
  .min(12, "Use a password with at least 12 characters.");

export const signInSchema = z.object({
  email: z.email("Enter a valid email."),
  password: passwordSchema,
  next: z.string().optional(),
});

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Use a shorter name."),
  email: z.email("Enter a valid email."),
  password: passwordSchema,
  next: z.string().optional(),
});

export const emailSchema = z.object({
  email: z.email("Enter a valid email."),
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

export const patientSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter the name of the person you support.")
    .max(80, "Use a shorter name."),
  phone: z
    .string()
    .trim()
    .max(30, "Use a shorter phone number.")
    .optional()
    .refine(
      (value) => !value || value.length === 0 || (value.length >= 7 && value.length <= 30),
      "Enter a phone number you can text.",
    ),
});

export const householdSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name this household.")
    .max(80, "Use a shorter household name."),
  supportedPersonName: z
    .string()
    .trim()
    .max(80, "Use a shorter name.")
    .optional(),
});

export const invitationSchema = z.object({
  email: z.email("Enter a valid email."),
  role: z.enum(inviteRoles, { error: "Choose a role." }),
});

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(80, "Use a shorter name."),
  phone: z
    .string()
    .trim()
    .max(30, "Use a shorter phone number.")
    .optional()
    .refine(
      (value) => !value || value.length === 0 || (value.length >= 7 && value.length <= 30),
      "Enter a phone number people can actually call.",
    ),
  relationship: z
    .string()
    .trim()
    .max(80, "Use a shorter relationship.")
    .optional(),
  includeInTalk: z.boolean(),
  isEmergency: z.boolean(),
});

export const deliveryRecurrences = ["none", "daily", "weekdays", "weekly"] as const;

export const voiceNoteSchema = z
  .object({
    recipientId: z.uuid("Choose who should receive this note."),
    title: z
      .string()
      .trim()
      .max(80, "Use a shorter title.")
      .optional(),
    bodyText: z
      .string()
      .trim()
      .max(2000, "Keep the written note a little shorter.")
      .optional(),
    storagePath: z
      .string()
      .trim()
      .max(500)
      .optional(),
    durationSeconds: z.number().int().min(1).max(180).optional(),
    sendNow: z.boolean(),
    deliverAt: z.string().optional(),
    recurrence: z.enum(deliveryRecurrences, { error: "Choose how often this should arrive." }),
  })
  .refine((value) => Boolean(value.storagePath || value.bodyText), {
    message: "Record a short voice note or write a text note.",
  })
  .refine((value) => value.sendNow || Boolean(value.deliverAt), {
    message: "Choose when this note should arrive.",
  });

export const calendarKinds = ["appointment", "event", "task"] as const;
export const routineKinds = ["check_in", "appointment", "task", "custom"] as const;
export const requestKinds = ["call_me", "groceries", "ride", "something_else"] as const;
export const doseStatuses = ["taken", "skipped", "needs_help"] as const;
export const occurrenceStatuses = ["done", "skipped", "needs_help"] as const;
export const weekdayNumbers = [0, 1, 2, 3, 4, 5, 6] as const;

const optionalNote = z
  .string()
  .trim()
  .max(2000, "Keep that note a little shorter.")
  .optional();

const timeValue = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Choose a time.");

const dateValue = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");

function weekdayList(value: number[] | undefined) {
  if (!value || value.length === 0) return null;
  return [...new Set(value)].sort((a, b) => a - b);
}

export const calendarEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Name this calendar item.")
    .max(80, "Use a shorter title."),
  kind: z.enum(calendarKinds, { error: "Choose what kind of item this is." }),
  startsAt: z.string().min(1, "Choose a start time."),
  endsAt: z.string().optional(),
  allDay: z.boolean(),
  assignedTo: z.string().optional(),
  notes: optionalNote,
});

export const routineSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "What would you like to remember?")
    .max(80, "Use a shorter title."),
  kind: z.enum(routineKinds, { error: "Choose a reminder type." }),
  assignedTo: z.uuid("Choose who this is for."),
  localTime: timeValue,
  startOn: dateValue,
  endOn: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(dateValue.optional()),
  recurrence: z.enum(deliveryRecurrences, { error: "Choose how often this should happen." }),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  notes: optionalNote,
  followUp: z.enum(["none", "notify_caregiver"], { error: "Choose how KindCare should follow up." }),
}).transform((value) => ({
  ...value,
  daysOfWeek: weekdayList(value.daysOfWeek),
}));

export const medicationPlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter the medication name from the label.")
    .max(80, "Use a shorter name."),
  strengthLabel: z
    .string()
    .trim()
    .min(1, "Enter the strength exactly as written on the label.")
    .max(80, "Use a shorter strength."),
  amountText: z
    .string()
    .trim()
    .min(1, "Enter the amount as written for this household.")
    .max(80, "Use a shorter amount."),
  reminderText: z
    .string()
    .trim()
    .max(500, "Keep the reminder a little shorter.")
    .optional(),
  refillNote: z
    .string()
    .trim()
    .max(500, "Keep the refill note a little shorter.")
    .optional(),
  memberProfileId: z.uuid("Choose who this plan is for."),
  times: z.array(timeValue).min(1, "Add at least one time.").max(6, "Use up to six times."),
  startOn: dateValue,
  endOn: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(dateValue.optional()),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  notifyOrganizer: z.boolean(),
}).transform((value) => ({
  ...value,
  daysOfWeek: weekdayList(value.daysOfWeek),
}));

export const memberRequestSchema = z.object({
  kind: z.enum(requestKinds, { error: "Choose what you need." }),
  label: z
    .string()
    .trim()
    .min(1, "Name this request.")
    .max(80, "Use a shorter request name.")
    .optional(),
  message: z
    .string()
    .trim()
    .max(500, "Keep that note a little shorter.")
    .optional(),
});

export const wellbeingFeelings = ["doing_well", "okay", "would_like_to_talk"] as const;

export const wellbeingCheckinSchema = z.object({
  feeling: z.enum(wellbeingFeelings, { error: "Choose how you are doing." }),
  note: z
    .string()
    .trim()
    .max(500, "Keep that note a little shorter.")
    .optional(),
});

export const requestPresetSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Name this button.")
    .max(80, "Use a shorter button name."),
  kind: z.enum(requestKinds, { error: "Choose what this request is like." }),
});

export const momentSchema = z
  .object({
    body: z
      .string()
      .trim()
      .max(500, "Keep that note a little shorter.")
      .optional(),
    photoPath: z
      .string()
      .trim()
      .max(500)
      .optional(),
  })
  .refine((value) => Boolean(value.body || value.photoPath), {
    message: "Write a short note or add a photo.",
  });

export const handoffSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write what changed today.")
    .max(2000, "Keep that handoff a little shorter."),
  assignmentTitle: z
    .string()
    .trim()
    .max(80, "Use a shorter assignment.")
    .optional(),
  assignedTo: z.string().optional(),
});

const optionalPrep = z
  .string()
  .trim()
  .max(2000, "Keep that appointment note a little shorter.")
  .optional();

export const appointmentPrepSchema = z.object({
  eventId: z.uuid().optional(),
  questions: optionalPrep,
  documentsToBring: optionalPrep,
  transportPlan: optionalPrep,
  followUpTasks: optionalPrep,
});

export const notificationPrefSchema = z.object({
  notifyInApp: z.boolean(),
  notifyEmail: z.boolean(),
});

export const doseMarkSchema = z.object({
  doseId: z.uuid(),
  status: z.enum(doseStatuses),
  caregiverNote: z
    .string()
    .trim()
    .max(500, "Keep that note a little shorter.")
    .optional(),
});

export const occurrenceMarkSchema = z.object({
  occurrenceId: z.uuid(),
  status: z.enum(occurrenceStatuses),
  note: z
    .string()
    .trim()
    .max(500, "Keep that note a little shorter.")
    .optional(),
});

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check what you entered.";
}
