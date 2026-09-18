export const calendarKindLabels = {
  appointment: "Appointment",
  event: "Event",
  task: "Task",
} as const;

export const routineKindLabels = {
  check_in: "Check-in",
  appointment: "Appointment reminder",
  task: "Task",
  custom: "Custom reminder",
} as const;

export const requestKindLabels = {
  call_me: "Please call me",
  groceries: "I need groceries",
  ride: "I need a ride",
  something_else: "I need help with something",
} as const;

export const defaultRequestButtons = [
  { kind: "call_me" as const, label: requestKindLabels.call_me },
  { kind: "groceries" as const, label: requestKindLabels.groceries },
  { kind: "ride" as const, label: requestKindLabels.ride },
  { kind: "something_else" as const, label: requestKindLabels.something_else },
];

export const wellbeingFeelingLabels = {
  doing_well: "I’m doing well",
  okay: "I’m okay",
  would_like_to_talk: "I’d like to talk",
} as const;

export const weekdayLabels = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

export const doseStatusLabels = {
  scheduled: "Not yet marked",
  taken: "Marked taken",
  skipped: "Skipped",
  needs_help: "Needs follow-up",
} as const;

export const occurrenceStatusLabels = {
  scheduled: "Not yet marked",
  done: "Done",
  skipped: "Skipped",
  needs_help: "Needs follow-up",
} as const;

export const recurrenceLabels = {
  none: "Once",
  daily: "Every day",
  weekdays: "Weekdays",
  weekly: "Weekly",
} as const;
