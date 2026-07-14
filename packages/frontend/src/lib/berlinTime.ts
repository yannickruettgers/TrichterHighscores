const BERLIN_TIME_ZONE = "Europe/Berlin";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BERLIN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

function partsFor(date: Date): Record<string, string> {
  return Object.fromEntries(
    formatter.formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value])
  );
}

export function formatBerlinDateTimeLocal(date = new Date()): string {
  const parts = partsFor(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Converts a Europe/Berlin datetime-local value to a storage-safe ISO instant. */
export function berlinDateTimeLocalToIso(value: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return undefined;
  }

  const [, year, month, day, hour, minute] = match;
  const wallClockAsUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute);
  if (!Number.isFinite(wallClockAsUtc)) {
    return undefined;
  }

  let instant = wallClockAsUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const zoned = partsFor(new Date(instant));
    const zonedAsUtc = Date.UTC(
      +zoned.year,
      +zoned.month - 1,
      +zoned.day,
      +zoned.hour,
      +zoned.minute,
      +zoned.second
    );
    instant -= zonedAsUtc - wallClockAsUtc;
  }

  const result = new Date(instant);
  if (Number.isNaN(result.getTime()) || formatBerlinDateTimeLocal(result) !== value) {
    return undefined;
  }
  return result.toISOString();
}

export function festivalDayForLocalDateTime(value: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T/.exec(value);
  if (!match) {
    return undefined;
  }
  const day = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])).getUTCDay();
  return [undefined, undefined, undefined, "Wednesday", "Thursday", "Friday", "Saturday"][day]
    ?? (day === 0 ? "Sunday" : undefined);
}

const FESTIVAL_DAY_NUMBERS: Record<string, number> = {
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

/** Moves a datetime-local value to a festival day in the same ISO week. */
export function moveLocalDateTimeToFestivalDay(value: string, festivalDay: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  const targetDay = FESTIVAL_DAY_NUMBERS[festivalDay];
  if (!match || !targetDay) {
    return undefined;
  }

  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  if (
    date.getUTCFullYear() !== +match[1]
    || date.getUTCMonth() !== +match[2] - 1
    || date.getUTCDate() !== +match[3]
  ) {
    return undefined;
  }

  const currentDay = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + targetDay - currentDay);
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${match[4]}:${match[5]}`;
}
