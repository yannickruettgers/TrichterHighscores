import { CATEGORIES, FESTIVAL_DAYS, type CreateHighscoreInput } from "../../../shared/src/types.js";

export function isCreateHighscoreInput(value: unknown): value is CreateHighscoreInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as Record<string, unknown>;
  const pseudonym = body.pseudonym;
  const timeValue = body.time_seconds;
  const category = body.category;
  const festivalDay = body.festival_day;

  if (typeof pseudonym !== "string" || pseudonym.trim().length < 2 || pseudonym.trim().length > 32) {
    return false;
  }

  if (typeof timeValue !== "number" || !Number.isFinite(timeValue) || timeValue <= 0) {
    return false;
  }

  if (!Number.isInteger(timeValue * 1000)) {
    return false;
  }

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return false;
  }

  if (!FESTIVAL_DAYS.includes(festivalDay as (typeof FESTIVAL_DAYS)[number])) {
    return false;
  }

  return true;
}
