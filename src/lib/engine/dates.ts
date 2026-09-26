// Date helpers for the engine. All dates are UTC calendar dates; `today` is always passed in.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses "YYYY-MM-DD" or "YYYY-MM" (first of the month) or a Date into a UTC midnight Date. */
export function toUtcDate(value: string | Date): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error("Invalid date");
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(value);
  if (!m) throw new Error(`Invalid date: ${value}`);
  const [, y, mo, d] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, d ? Number(d) : 1));
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date;
}

/** Same as toUtcDate, but returns null for missing or unparseable input. */
export function tryUtcDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    return toUtcDate(value);
  } catch {
    return null;
  }
}

export function addWeeks(date: Date, weeks: number): Date {
  return new Date(date.getTime() + Math.round(weeks * 7) * DAY_MS);
}

/** Adds calendar months, clamping to the last day of the target month. */
export function addMonths(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(date.getUTCDate(), lastDay)));
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
