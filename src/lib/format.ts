// Date and number helpers for the admin dashboard. Pakistan time is UTC+5 (no DST).

export const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD of a moment, in Pakistan time. */
export function karachiDayKey(date: Date) {
  return new Date(date.getTime() + KARACHI_OFFSET_MS).toISOString().slice(0, 10);
}

/** UTC instant of midnight (Pakistan time) at the start of the given day key. */
export function karachiMidnight(dayKey: string) {
  return new Date(Date.parse(`${dayKey}T00:00:00Z`) - KARACHI_OFFSET_MS);
}

const shortDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Karachi",
});
const dateOnly = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Karachi",
});

/** "19 Nov" for a YYYY-MM-DD key. */
export function formatDayKey(dayKey: string) {
  return shortDay.format(new Date(`${dayKey}T00:00:00Z`));
}

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

export function formatDate(iso: string) {
  return dateOnly.format(new Date(iso));
}

/** 950 → "950", 12_400 → "12.4K", 1_250_000 → "1.25M". */
export function formatCompact(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${trim(value / 1_000_000, 2)}M`;
  if (Math.abs(value) >= 10_000) return `${trim(value / 1_000, 1)}K`;
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function trim(value: number, digits: number) {
  return Number(value.toFixed(digits)).toString();
}

/** Percentage change, or null when the previous value was 0 (shown as "New"). */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
