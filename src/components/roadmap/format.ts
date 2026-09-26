import type { Duration, Locale } from "@/lib/engine/types";
import { htmlLang, type MessageKey, type MessageVars } from "@/lib/i18n";

type Translate = (key: MessageKey, vars?: MessageVars) => string;

/** Under three weeks reads better in days ("Up to 15 days" rather than "Up to 3 wks"). */
const DAYS_BELOW_WEEKS = 3;

export function formatDurationRange(d: Pick<Duration, "minWeeks" | "maxWeeks">, t: Translate) {
  if (d.maxWeeks <= 0) return t("duration.none");
  if (d.maxWeeks < DAYS_BELOW_WEEKS) {
    const min = Math.round(d.minWeeks * 7);
    const max = Math.max(1, Math.round(d.maxWeeks * 7));
    if (min === 0) return t("duration.upToDays", { max });
    return min === max ? t("duration.exactDays", { n: max }) : t("duration.days", { min, max });
  }
  const max = Math.ceil(d.maxWeeks);
  if (d.minWeeks <= 0) return t("duration.upToWeeks", { max });
  const min = Math.max(1, Math.floor(d.minWeeks));
  return min === max ? t("duration.exactWeeks", { n: max }) : t("duration.weeks", { min, max });
}

export function formatTypical(weeks: number, t: Translate) {
  if (weeks <= 0) return t("duration.none");
  const value =
    weeks < DAYS_BELOW_WEEKS
      ? t("duration.exactDays", { n: Math.max(1, Math.round(weeks * 7)) })
      : t("duration.exactWeeks", { n: Math.round(weeks) });
  return t("duration.typical", { value });
}

/** Month and year only: day-level precision would claim more than the data supports. */
export function formatMonthYear(date: string | number, locale: Locale, upper = false) {
  const ms = typeof date === "number" ? date : Date.parse(`${date}T00:00:00Z`);
  const text = new Intl.DateTimeFormat(htmlLang[locale], {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(ms);
  return upper ? text.toLocaleUpperCase(htmlLang[locale]) : text;
}

export function formatDay(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(htmlLang[locale], { dateStyle: "medium", timeZone: "UTC" }).format(
    Date.parse(`${date}T00:00:00Z`),
  );
}

export function formatCad(amount: number, locale: Locale) {
  return new Intl.NumberFormat(htmlLang[locale], {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function pick(text: { en: string; fr: string }, locale: Locale) {
  return text[locale] || text.en;
}
