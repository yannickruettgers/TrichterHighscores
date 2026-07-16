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
  const achievedAt = body.achieved_at;

  if (typeof pseudonym !== "string" || pseudonym.trim().length < 2 || pseudonym.trim().length > 32) {
    return false;
  }

  if (typeof timeValue !== "number" || !Number.isFinite(timeValue) || timeValue <= 0) {
    return false;
  }

  const roundedTime = Math.round(timeValue * 1000) / 1000;
  if (Math.abs(timeValue - roundedTime) > Number.EPSILON * Math.max(1, Math.abs(timeValue))) {
    return false;
  }

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return false;
  }

  if (!FESTIVAL_DAYS.includes(festivalDay as (typeof FESTIVAL_DAYS)[number])) {
    return false;
  }

  if (
    typeof achievedAt !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(achievedAt)
    || !Number.isFinite(Date.parse(achievedAt))
  ) {
    return false;
  }

  return true;
}
