import type { Category, FestivalDay, HighscoreRecord } from "../../../shared/src/types";

export type DaySelection = FestivalDay | "overall";

export function filterHighscores(
  rows: HighscoreRecord[],
  category: Category,
  day: DaySelection
): HighscoreRecord[] {
  return rows.filter((entry) => (
    entry.category === category
    && (day === "overall" || entry.festival_day === day)
  ));
}

export function normalizeParticipant(pseudonym: string): string {
  return pseudonym.trim().normalize("NFKC").toLocaleLowerCase("de-DE");
}

/**
 * Returns the best three unique people from an already sorted leaderboard.
 * The full leaderboard remains untouched and may contain repeated attempts.
 */
export function uniquePodium(rows: HighscoreRecord[]): HighscoreRecord[] {
  const seen = new Set<string>();
  const podium: HighscoreRecord[] = [];

  for (const entry of rows) {
    const participant = normalizeParticipant(entry.pseudonym);
    if (!seen.has(participant)) {
      seen.add(participant);
      podium.push(entry);
    }
    if (podium.length === 3) {
      break;
    }
  }

  return podium;
}
