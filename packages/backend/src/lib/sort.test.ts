import { describe, expect, it } from "vitest";
import { sortHighscores } from "./sort.js";

describe("sortHighscores", () => {
  it("sorts by time ascending", () => {
    const sorted = sortHighscores([
      {
        id: "2",
        pseudonym: "Bravo",
        time_seconds: 2.1,
        category: "0.5l",
        festival_day: "Friday",
        created_at: "2026-07-09T10:00:00.000Z"
      },
      {
        id: "1",
        pseudonym: "Alpha",
        time_seconds: 1.9,
        category: "0.5l",
        festival_day: "Friday",
        created_at: "2026-07-09T10:00:01.000Z"
      }
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual(["1", "2"]);
  });

  it("uses older created_at as tie-breaker when times match", () => {
    const sorted = sortHighscores([
      {
        id: "newer",
        pseudonym: "Late",
        time_seconds: 1.634,
        category: "0.33l",
        festival_day: "Thursday",
        created_at: "2026-07-09T10:00:02.000Z"
      },
      {
        id: "older",
        pseudonym: "Early",
        time_seconds: 1.634,
        category: "0.33l",
        festival_day: "Thursday",
        created_at: "2026-07-09T10:00:01.000Z"
      }
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual(["older", "newer"]);
  });
});
