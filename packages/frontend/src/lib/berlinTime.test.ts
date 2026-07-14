import { describe, expect, it } from "vitest";
import {
  berlinDateTimeLocalToIso,
  festivalDayForLocalDateTime,
  formatBerlinDateTimeLocal,
  moveLocalDateTimeToFestivalDay
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

  it("moves between festival days in the same week without changing the time", () => {
    expect(moveLocalDateTimeToFestivalDay("2026-07-24T20:30", "Sunday")).toBe("2026-07-26T20:30");
    expect(moveLocalDateTimeToFestivalDay("2026-07-26T06:05", "Wednesday")).toBe("2026-07-22T06:05");
    expect(moveLocalDateTimeToFestivalDay("2026-07-20T12:00", "Friday")).toBe("2026-07-24T12:00");
  });

  it("moves safely across month and year boundaries", () => {
    expect(moveLocalDateTimeToFestivalDay("2026-12-30T23:15", "Sunday")).toBe("2027-01-03T23:15");
    expect(moveLocalDateTimeToFestivalDay("2026-03-01T08:00", "Wednesday")).toBe("2026-02-25T08:00");
  });

  it("rejects malformed dates and unknown festival days", () => {
    expect(moveLocalDateTimeToFestivalDay("2026-02-30T12:00", "Friday")).toBeUndefined();
    expect(moveLocalDateTimeToFestivalDay("not-a-date", "Friday")).toBeUndefined();
    expect(moveLocalDateTimeToFestivalDay("2026-07-24T12:00", "Monday")).toBeUndefined();
  });
});
