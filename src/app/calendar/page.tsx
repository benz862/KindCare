import type { Metadata } from "next";
import Link from "next/link";

import { EventForm } from "@/components/plan/event-form";
import { DayItemList } from "@/components/plan/day-item-list";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { requireHousehold } from "@/lib/auth/session";
import { runDueDeliveries } from "@/lib/connection";
import { loadHouseholdPeople, loadRangeItems } from "@/lib/plan";
import { canEditCalendar, isCareTeamRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import {
  addDaysYmd,
  formatDayHeading,
  formatMonthHeading,
  startOfMonthYmd,
  startOfWeekYmd,
  ymdInZone,
} from "@/lib/time";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Calendar" };

const views = ["day", "week", "month"] as const;
type CalendarView = (typeof views)[number];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const context = await requireHousehold();
  await runDueDeliveries();
  const params = await searchParams;
  const timeZone = context.membership.household.timezone;
  const today = ymdInZone(new Date(), timeZone);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : today;
  const view: CalendarView = views.includes(params.view as CalendarView)
    ? (params.view as CalendarView)
    : context.membership.role === "member"
      ? "day"
      : "day";
  const careTeam = isCareTeamRole(context.membership.role);
  const canEdit = canEditCalendar(context.membership.role);
  const supabase = await createClient();
  const householdId = context.membership.household.id;

  const rangeStart =
    view === "month"
      ? startOfWeekYmd(startOfMonthYmd(date))
      : view === "week"
        ? startOfWeekYmd(date)
        : date;
  const rangeEnd =
    view === "month"
      ? addDaysYmd(rangeStart, 41)
      : view === "week"
        ? addDaysYmd(rangeStart, 6)
        : date;

  const [{ byDay }, people] = await Promise.all([
    loadRangeItems(supabase, householdId, timeZone, rangeStart, rangeEnd),
    loadHouseholdPeople(supabase, householdId),
  ]);

  const prevDate =
    view === "month" ? addDaysYmd(startOfMonthYmd(date), -1) : view === "week" ? addDaysYmd(date, -7) : addDaysYmd(date, -1);
  const nextDate =
    view === "month" ? addDaysYmd(startOfMonthYmd(date), 32) : view === "week" ? addDaysYmd(date, 7) : addDaysYmd(date, 1);

  const heading =
    view === "month" ? formatMonthHeading(date) : view === "week" ? `Week of ${formatDayHeading(rangeStart, timeZone)}` : formatDayHeading(date, timeZone);

  return (
    <AppShell
      displayName={context.displayName}
      role={context.membership.role}
      householdName={context.membership.household.name}
    >
      <p className="text-xs font-bold tracking-[0.16em] text-navy/60">CALENDAR</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-navy">
        {careTeam ? "Household calendar" : "Coming up"}
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/75">
        {careTeam
          ? "Appointments, events, reminders, medication times, and scheduled notes share this calendar."
          : "Today, tomorrow, and the next few days. KindCare is not medical monitoring."}
      </p>

      {careTeam ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {views.map((item) => (
            <ButtonLink
              key={item}
              href={`/calendar?view=${item}&date=${date}`}
              variant={view === item ? "primary" : "secondary"}
              size="compact"
            >
              {item === "day" ? "Day" : item === "week" ? "Week" : "Month"}
            </ButtonLink>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold text-navy">{heading}</h2>
        <div className="flex gap-2">
          <ButtonLink href={`/calendar?view=${view}&date=${prevDate}`} variant="secondary" size="compact">
            Previous
          </ButtonLink>
          <ButtonLink href={`/calendar?view=${view}&date=${today}`} variant="secondary" size="compact">
            Today
          </ButtonLink>
          <ButtonLink href={`/calendar?view=${view}&date=${nextDate}`} variant="secondary" size="compact">
            Next
          </ButtonLink>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        {!careTeam ? <MemberAgenda byDay={byDay} timeZone={timeZone} today={today} /> : null}

        {careTeam && view === "day" ? (
          <Card>
            <DayItemList
              items={byDay(date)}
              timeZone={timeZone}
              empty="Nothing is on this day yet."
              canEditEvents={canEdit}
              showCaregiverNote={canEdit}
            />
          </Card>
        ) : null}

        {careTeam && view === "week" ? (
          <div className="grid gap-4 md:grid-cols-7">
            {Array.from({ length: 7 }, (_, index) => {
              const ymd = addDaysYmd(rangeStart, index);
              const items = byDay(ymd);
              return (
                <Card key={ymd} className="p-4">
                  <Link className="font-semibold text-navy underline-offset-4 hover:underline" href={`/calendar?view=day&date=${ymd}`}>
                    {formatDayHeading(ymd, timeZone).split(",")[0]}
                  </Link>
                  <p className="text-sm text-navy/70">{ymd.slice(8)}</p>
                  <ul className="mt-3 grid gap-2">
                    {items.length === 0 ? (
                      <li className="text-sm text-navy/60">Quiet</li>
                    ) : (
                      items.slice(0, 4).map((item) => (
                        <li key={item.id} className="text-sm text-ink/80">
                          {item.title}
                        </li>
                      ))
                    )}
                  </ul>
                </Card>
              );
            })}
          </div>
        ) : null}

        {careTeam && view === "month" ? (
          <Card>
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                <p key={label} className="text-xs font-bold uppercase tracking-wide text-navy/60">
                  {label}
                </p>
              ))}
              {Array.from({ length: 42 }, (_, index) => {
                const ymd = addDaysYmd(rangeStart, index);
                const inMonth = ymd.startsWith(date.slice(0, 7));
                const items = byDay(ymd);
                return (
                  <Link
                    key={ymd}
                    href={`/calendar?view=day&date=${ymd}`}
                    className={cn(
                      "min-h-24 rounded-2xl border border-navy/8 p-2 text-left hover:bg-mist",
                      inMonth ? "bg-white" : "bg-cloud text-navy/50",
                      ymd === today ? "outline outline-2 outline-offset-1 outline-teal" : "",
                    )}
                  >
                    <p className="text-sm font-semibold">{Number(ymd.slice(8))}</p>
                    {items.slice(0, 3).map((item) => (
                      <p key={item.id} className="truncate text-xs text-ink/75">
                        {item.title}
                      </p>
                    ))}
                    {items.length > 3 ? <p className="text-xs text-navy/60">+{items.length - 3}</p> : null}
                  </Link>
                );
              })}
            </div>
          </Card>
        ) : null}

        {canEdit ? (
          <Card>
            <h2 className="font-serif text-2xl font-semibold text-navy">Add a calendar item</h2>
            <p className="mt-2 leading-7 text-ink/75">
              Use Plan for repeating reminders and medication times. This form is for appointments,
              events, and one-time tasks.
            </p>
            <div className="mt-5">
              <EventForm people={people} />
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

function MemberAgenda({
  byDay,
  timeZone,
  today,
}: {
  byDay: (ymd: string) => import("@/lib/plan").DayItem[];
  timeZone: string;
  today: string;
}) {
  const tomorrow = addDaysYmd(today, 1);
  const coming = Array.from({ length: 12 }, (_, index) => addDaysYmd(today, index + 2)).flatMap((ymd) =>
    byDay(ymd),
  );

  return (
    <>
      <Card>
        <h2 className="font-serif text-3xl font-semibold text-navy">Today</h2>
        <DayItemList
          items={byDay(today)}
          timeZone={timeZone}
          empty="Nothing else is planned for today."
          size="member"
        />
      </Card>
      <Card>
        <h2 className="font-serif text-3xl font-semibold text-navy">Tomorrow</h2>
        <DayItemList
          items={byDay(tomorrow)}
          timeZone={timeZone}
          empty="Nothing is planned for tomorrow yet."
          size="member"
        />
      </Card>
      <Card>
        <h2 className="font-serif text-3xl font-semibold text-navy">Coming up</h2>
        {coming.length === 0 ? (
          <p className="mt-3 text-lg leading-8 text-ink/75">No later appointments are on the calendar.</p>
        ) : (
          <DayItemList
            items={coming.filter((item) => item.source === "event" || item.source === "dose").slice(0, 8)}
            timeZone={timeZone}
            empty="No later appointments are on the calendar."
            size="member"
          />
        )}
      </Card>
    </>
  );
}
