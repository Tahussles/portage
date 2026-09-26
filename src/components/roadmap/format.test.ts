import { describe, expect, it } from "vitest";
import { translate, type MessageKey, type MessageVars } from "@/lib/i18n";
import { formatDurationRange, formatMonthYear, formatTypical } from "./format";

const en = (key: MessageKey, vars?: MessageVars) => translate("en", key, vars);
const fr = (key: MessageKey, vars?: MessageVars) => translate("fr", key, vars);

describe("roadmap formatting", () => {
  it("shows short official windows in days and long ones in weeks", () => {
    expect(formatDurationRange({ minWeeks: 0, maxWeeks: 2.1 }, en)).toBe("Up to 15 days");
    expect(formatDurationRange({ minWeeks: 3, maxWeeks: 10 }, en)).toBe("3 to 10 wks");
    expect(formatDurationRange({ minWeeks: 0.7, maxWeeks: 5 }, en)).toBe("1 to 5 wks");
    expect(formatDurationRange({ minWeeks: 3, maxWeeks: 10 }, fr)).toBe("3 à 10 sem.");
    expect(formatDurationRange({ minWeeks: 0, maxWeeks: 0 }, en)).toBe("No wait");
  });

  it("formats the typical duration", () => {
    expect(formatTypical(12, en)).toBe("Typically 12 wks");
    expect(formatTypical(2.1, fr)).toBe("Habituellement 15 jours");
  });

  it("formats month and year in UTC so the month never slips", () => {
    expect(formatMonthYear("2027-02-01", "en")).toBe("Feb 2027");
    expect(formatMonthYear("2027-05-01", "fr", true)).toBe("MAI 2027");
  });
});
