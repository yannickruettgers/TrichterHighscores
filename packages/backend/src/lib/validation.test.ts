import { describe, expect, it } from "vitest";
import { isCreateHighscoreInput } from "./validation.js";

describe("isCreateHighscoreInput", () => {
  it("accepts a valid highscore payload", () => {
    expect(
      isCreateHighscoreInput({
        pseudonym: "FunnelFox",
        time_seconds: 1.634,
        category: "0.5l",
        festival_day: "Friday"
      })
    ).toBe(true);
  });

  it("rejects values with more than three decimal places", () => {
    expect(
      isCreateHighscoreInput({
        pseudonym: "PrecisionFail",
        time_seconds: 1.6345,
        category: "0.5l",
        festival_day: "Friday"
      })
    ).toBe(false);
  });

  it("rejects non-positive times", () => {
    expect(
      isCreateHighscoreInput({
        pseudonym: "TooFast",
        time_seconds: 0,
        category: "0.33l",
        festival_day: "Wednesday"
      })
    ).toBe(false);
  });

  it("rejects invalid category values", () => {
    expect(
      isCreateHighscoreInput({
        pseudonym: "WrongCategory",
        time_seconds: 2.111,
        category: "2.0l",
        festival_day: "Sunday"
      })
    ).toBe(false);
  });
});
