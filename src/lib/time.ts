export function formatWhen(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function formatClock(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function localInputToIso(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function sameLocalDay(iso: string, timeZone: string) {
  return ymdInZone(new Date(iso), timeZone) === ymdInZone(new Date(), timeZone);
}

export function ymdInZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDaysYmd(ymd: string, days: number) {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function startOfWeekYmd(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return addDaysYmd(ymd, -date.getUTCDay());
}

export function startOfMonthYmd(ymd: string) {
  return `${ymd.slice(0, 7)}-01`;
}

export function formatDayHeading(ymd: string, timeZone: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function formatMonthHeading(ymd: string) {
  const [year, month] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function utcWindowForYmds(startYmd: string, endYmd: string) {
  return {
    start: `${addDaysYmd(startYmd, -1)}T00:00:00.000Z`,
    end: `${addDaysYmd(endYmd, 2)}T00:00:00.000Z`,
  };
}

export function matchesYmd(iso: string, ymd: string, timeZone: string) {
  return ymdInZone(new Date(iso), timeZone) === ymd;
}
