import { describe, expect, it } from "vitest";
import { isCreateHighscoreInput } from "./validation.js";

describe("isCreateHighscoreInput", () => {
  it("accepts a valid highscore payload", () => {
    expect(
      isCreateHighscoreInput({
        pseudonym: "FunnelFox",
        time_seconds: 1.634,
        category: "0.5l",
        festival_day: "Friday",
        achieved_at: "2026-07-24T18:30:00.000Z"
      })
    ).toBe(true);
  });

  it("rejects values with more than three decimal places", () => {
    expect(
      isCreateHighscoreInput({
        pseudonym: "PrecisionFail",
        time_seconds: 1.6345,
        category: "0.5l",
        festival_day: "Friday",
        achieved_at: "2026-07-24T18:30:00.000Z"
      })
    ).toBe(false);
  });

  it.each([1.001, 1.003, 2.002, 5.007])("accepts time values that are valid but tricky for floating-point (%s)", (timeSeconds) => {
    expect(
      isCreateHighscoreInput({
        pseudonym: "FunnelFox",
        time_seconds: timeSeconds,
        category: "1.0l",
        festival_day: "Friday",
        achieved_at: "2026-07-24T18:30:00.000Z"
      })
    ).toBe(true);
  });

  it("rejects non-positive times", () => {
    expect(
      isCreateHighscoreInput({
        pseudonym: "TooFast",
        time_seconds: 0,
        category: "0.33l",
        festival_day: "Wednesday",
        achieved_at: "2026-07-22T18:30:00.000Z"
      })
    ).toBe(false);
  });

  it("rejects invalid category values", () => {
    expect(
      isCreateHighscoreInput({
        pseudonym: "WrongCategory",
        time_seconds: 2.111,
        category: "2.0l",
        festival_day: "Sunday",
        achieved_at: "2026-07-26T18:30:00.000Z"
      })
    ).toBe(false);
  });

  it.each([
    undefined,
    "2026-07-24 18:30",
    "2026-13-24T18:30:00Z",
    "not-a-date"
  ])("rejects invalid achieved_at values", (achieved_at) => {
    expect(
      isCreateHighscoreInput({
        pseudonym: "TimeTraveller",
        time_seconds: 2.111,
        category: "1.0l",
        festival_day: "Friday",
        achieved_at
      })
    ).toBe(false);
  });
});
