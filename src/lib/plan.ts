import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import {
  matchesYmd,
  utcWindowForYmds,
} from "@/lib/time";

type Client = SupabaseClient<Database>;

export type DayItem = {
  id: string;
  at: string;
  source: "event" | "routine" | "dose" | "note";
  title: string;
  detail?: string;
  status: string;
  assignedTo?: string | null;
  doseId?: string;
  occurrenceId?: string;
  routineId?: string;
  eventId?: string;
};

export async function loadRangeItems(
  supabase: Client,
  householdId: string,
  timeZone: string,
  startYmd: string,
  endYmd: string,
) {
  const window = utcWindowForYmds(startYmd, endYmd);
  const [{ data: events }, { data: occurrences }, { data: doses }, { data: plans }, { data: routines }, { data: deliveries }, { data: notes }] =
    await Promise.all([
      supabase
        .from("calendar_events")
        .select("id, title, kind, starts_at, status, assigned_to, all_day")
        .eq("household_id", householdId)
        .gte("starts_at", window.start)
        .lte("starts_at", window.end)
        .order("starts_at"),
      supabase
        .from("routine_occurrences")
        .select("id, due_at, status, assigned_to, routine_id")
        .eq("household_id", householdId)
        .gte("due_at", window.start)
        .lte("due_at", window.end)
        .order("due_at"),
      supabase
        .from("medication_doses")
        .select("id, due_at, status, member_profile_id, plan_id, marked_at, marked_by, caregiver_note")
        .eq("household_id", householdId)
        .gte("due_at", window.start)
        .lte("due_at", window.end)
        .order("due_at"),
      supabase
        .from("medication_plans")
        .select("id, name, amount_text, strength_label, reminder_text")
        .eq("household_id", householdId),
      supabase
        .from("routines")
        .select("id, title, kind")
        .eq("household_id", householdId),
      supabase
        .from("scheduled_deliveries")
        .select("id, deliver_at, status, voice_note_id")
        .eq("household_id", householdId)
        .neq("status", "canceled")
        .gte("deliver_at", window.start)
        .lte("deliver_at", window.end)
        .order("deliver_at"),
      supabase.from("voice_notes").select("id, title").eq("household_id", householdId),
    ]);

  const routineTitle = (id: string) =>
    (routines ?? []).find((item) => item.id === id)?.title ?? "Reminder";
  const planName = (id: string) =>
    (plans ?? []).find((item) => item.id === id)?.name ?? "Medication reminder";
  const planDetail = (id: string) => {
    const plan = (plans ?? []).find((item) => item.id === id);
    if (!plan) return undefined;
    return `${plan.strength_label} · ${plan.amount_text}`;
  };
  const noteTitle = (id: string) =>
    (notes ?? []).find((item) => item.id === id)?.title || "Scheduled note";

  const items: DayItem[] = [
    ...(events ?? []).map((event) => ({
      id: `event-${event.id}`,
      at: event.starts_at,
      source: "event" as const,
      title: event.title,
      detail: event.kind,
      status: event.status,
      assignedTo: event.assigned_to,
      eventId: event.id,
    })),
    ...(occurrences ?? []).map((item) => ({
      id: `routine-${item.id}`,
      at: item.due_at,
      source: "routine" as const,
      title: routineTitle(item.routine_id),
      status: item.status,
      assignedTo: item.assigned_to,
      occurrenceId: item.id,
      routineId: item.routine_id,
    })),
    ...(doses ?? []).map((item) => ({
      id: `dose-${item.id}`,
      at: item.due_at,
      source: "dose" as const,
      title: planName(item.plan_id),
      detail: planDetail(item.plan_id),
      status: item.status,
      assignedTo: item.member_profile_id,
      doseId: item.id,
    })),
    ...(deliveries ?? []).map((item) => ({
      id: `note-${item.id}`,
      at: item.deliver_at,
      source: "note" as const,
      title: noteTitle(item.voice_note_id),
      status: item.status,
    })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const byDay = (ymd: string) => items.filter((item) => matchesYmd(item.at, ymd, timeZone));

  return { items, byDay, events, occurrences, doses, plans };
}

export function nextOpenItem(items: DayItem[], now = new Date()) {
  const nowMs = now.getTime();
  return (
    items.find(
      (item) =>
        (item.status === "scheduled" || item.status === "open") &&
        new Date(item.at).getTime() >= nowMs,
    ) ?? items.find((item) => item.status === "scheduled" || item.status === "open")
  );
}

export async function loadHouseholdPeople(supabase: Client, householdId: string) {
  const [{ data: members }, { data: profiles }] = await Promise.all([
    supabase
      .from("household_members")
      .select("profile_id, role")
      .eq("household_id", householdId)
      .eq("status", "active")
      .order("created_at"),
    supabase.from("profiles").select("id, display_name"),
  ]);

  return (members ?? []).map((member) => ({
    id: member.profile_id,
    name: (profiles ?? []).find((profile) => profile.id === member.profile_id)?.display_name ?? "KindCare member",
    role: member.role,
  }));
}
