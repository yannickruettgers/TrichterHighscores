import type { HighscoreRecord } from "../../../shared/src/types.js";

export function sortHighscores(records: HighscoreRecord[]): HighscoreRecord[] {
  return [...records].sort((a, b) => {
    if (a.time_seconds !== b.time_seconds) {
      return a.time_seconds - b.time_seconds;
    }

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}
