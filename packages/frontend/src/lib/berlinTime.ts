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
