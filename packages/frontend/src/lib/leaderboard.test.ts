import { describe, expect, it } from "vitest";
import type { HighscoreRecord } from "../../../shared/src/types";
import { filterHighscores, normalizeParticipant, uniquePodium } from "./leaderboard";

function score(id: string, pseudonym: string, overrides: Partial<HighscoreRecord> = {}): HighscoreRecord {
  return {
    id,
    pseudonym,
    time_seconds: 1 + Number(id.replace(/\D/g, "") || 0) / 10,
    category: "0.33l",
    festival_day: "Wednesday",
    created_at: `2026-07-22T18:00:0${id.replace(/\D/g, "") || 0}.000Z`,
    ...overrides
  };
}

describe("leaderboard selection", () => {
  it("filters by category and optional festival day without changing order", () => {
    const rows = [
      score("1", "Alpha"),
      score("2", "Bravo", { festival_day: "Thursday" }),
      score("3", "Charlie", { category: "0.5l" })
    ];

    expect(filterHighscores(rows, "0.33l", "overall").map(({ id }) => id)).toEqual(["1", "2"]);
    expect(filterHighscores(rows, "0.33l", "Thursday").map(({ id }) => id)).toEqual(["2"]);
  });

  it("normalizes case, surrounding whitespace, and Unicode compatibility forms", () => {
    expect(normalizeParticipant("  ÄNNA ")).toBe(normalizeParticipant("änna"));
    expect(normalizeParticipant("ＦＯＸ")).toBe(normalizeParticipant("fox"));
  });

  it("keeps only the best sorted attempt per person on the podium", () => {
    const rows = [
      score("1", "Anna"),
      score("2", " anna "),
      score("3", "BRAVO"),
      score("4", "Charlie"),
      score("5", "Delta")
    ];

    expect(uniquePodium(rows).map(({ id }) => id)).toEqual(["1", "3", "4"]);
    expect(rows).toHaveLength(5);
  });

  it("supports fewer than three unique people", () => {
    expect(uniquePodium([score("1", "Anna"), score("2", "ANNA")])).toHaveLength(1);
  });
});
