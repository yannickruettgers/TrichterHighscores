import { describe, expect, it } from "vitest";
import {
  berlinDateTimeLocalToIso,
  festivalDayForLocalDateTime,
  formatBerlinDateTimeLocal
} from "./berlinTime";

describe("Europe/Berlin admin time helpers", () => {
  it("formats an instant as a Berlin datetime-local value", () => {
    expect(formatBerlinDateTimeLocal(new Date("2026-07-24T18:30:00.000Z"))).toBe("2026-07-24T20:30");
  });

  it("converts summer and winter wall-clock values with the correct offset", () => {
    expect(berlinDateTimeLocalToIso("2026-07-24T20:30")).toBe("2026-07-24T18:30:00.000Z");
    expect(berlinDateTimeLocalToIso("2026-01-24T20:30")).toBe("2026-01-24T19:30:00.000Z");
  });

  it("rejects malformed and nonexistent DST wall-clock values", () => {
    expect(berlinDateTimeLocalToIso("not-a-date")).toBeUndefined();
    expect(berlinDateTimeLocalToIso("2026-03-29T02:30")).toBeUndefined();
  });

  it("maps Wednesday through Sunday to festival days", () => {
    expect(festivalDayForLocalDateTime("2026-07-22T12:00")).toBe("Wednesday");
    expect(festivalDayForLocalDateTime("2026-07-26T12:00")).toBe("Sunday");
    expect(festivalDayForLocalDateTime("2026-07-27T12:00")).toBeUndefined();
  });
});
