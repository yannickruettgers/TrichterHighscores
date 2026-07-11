export const CATEGORIES = ["0.33l", "0.5l", "1.0l"] as const;
export const FESTIVAL_DAYS = [
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
] as const;

export type Category = (typeof CATEGORIES)[number];
export type FestivalDay = (typeof FESTIVAL_DAYS)[number];

export interface HighscoreRecord {
  id: string;
  pseudonym: string;
  time_seconds: number;
  category: Category;
  festival_day: FestivalDay;
  created_at: string;
}

export interface CreateHighscoreInput {
  pseudonym: string;
  time_seconds: number;
  category: Category;
  festival_day: FestivalDay;
}
