import type { DayItem } from "@/lib/plan";
import { calendarKindLabels, doseStatusLabels, occurrenceStatusLabels } from "@/lib/plan-copy";
import { formatClock } from "@/lib/time";
import { DoseActions } from "@/components/plan/dose-actions";
import { OccurrenceActions } from "@/components/plan/occurrence-actions";
import { CompleteTaskButton, DeleteEventButton, StopRoutineButton } from "@/components/plan/plan-buttons";
import { cn } from "@/lib/cn";

export function calendarItemTone(item: DayItem) {
  if (item.source === "dose") return "border-l-spark bg-spark/10";
  if (item.source === "routine") return "border-l-teal bg-teal/10";
  if (item.source === "note") return "border-l-violet-500 bg-violet-50";
  if (item.detail === "appointment") return "border-l-navy bg-blue-50";
  if (item.detail === "task") return "border-l-amber-500 bg-amber-50";
  return "border-l-slate-400 bg-slate-50";
}

export function DayItemList({
  items,
  timeZone,
  empty,
  size = "care",
  canEditEvents = false,
  showCaregiverNote = false,
  canStopRoutines = false,
}: {
  items: DayItem[];
  timeZone: string;
  empty: string;
  size?: "care" | "member";
  canEditEvents?: boolean;
  showCaregiverNote?: boolean;
  canStopRoutines?: boolean;
}) {
  if (items.length === 0) {
    return <p className={size === "member" ? "mt-3 text-lg leading-8 text-ink/75" : "mt-2 leading-7 text-ink/75"}>{empty}</p>;
  }

  return (
    <ol className="mt-4 grid gap-3">
      {items.map((item) => (
        <li key={item.id} className={cn("rounded-2xl border-l-4 px-4 py-3", calendarItemTone(item))}>
          <p className={size === "member" ? "text-xl font-semibold text-navy" : "font-semibold text-navy"}>
            {formatClock(item.at, timeZone)} · {item.title}
          </p>
          <p className={size === "member" ? "text-base text-navy/70" : "text-sm text-navy/70"}>
            {itemSourceLabel(item)}
            {item.detail && item.source === "dose" ? ` · ${item.detail}` : ""}
            {` · ${statusLabel(item)}`}
          </p>
          {item.status === "scheduled" || item.status === "open" ? (
            <div className="mt-3">
              {item.doseId ? (
                <DoseActions
                  doseId={item.doseId}
                  size={size === "member" ? "member" : "compact"}
                  showSafety={size === "member"}
                  showCaregiverNote={showCaregiverNote}
                />
              ) : null}
              {item.occurrenceId ? (
                <OccurrenceActions
                  occurrenceId={item.occurrenceId}
                  size={size === "member" ? "member" : "compact"}
                />
              ) : null}
              {item.eventId && item.detail === "task" && item.status === "open" && canEditEvents ? (
                <CompleteTaskButton eventId={item.eventId} />
              ) : null}
            </div>
          ) : null}
          {item.eventId && canEditEvents ? (
            <div className="mt-2">
              <DeleteEventButton eventId={item.eventId} />
            </div>
          ) : null}
          {item.routineId && canStopRoutines ? (
            <div className="mt-2">
              <StopRoutineButton routineId={item.routineId} />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function itemSourceLabel(item: DayItem) {
  if (item.source === "dose") return "Medication reminder";
  if (item.source === "routine") return "Reminder";
  if (item.source === "note") return "Voice note";
  const kind = item.detail as keyof typeof calendarKindLabels;
  return calendarKindLabels[kind] ?? "Calendar";
}

function statusLabel(item: DayItem) {
  if (item.source === "dose") {
    return doseStatusLabels[item.status as keyof typeof doseStatusLabels] ?? item.status;
  }
  if (item.source === "routine") {
    return occurrenceStatusLabels[item.status as keyof typeof occurrenceStatusLabels] ?? item.status;
  }
  if (item.status === "done") return "Done";
  if (item.status === "delivered") return "Delivered";
  if (item.status === "scheduled") return "Scheduled";
  return item.status === "open" ? "Upcoming" : item.status;
}
