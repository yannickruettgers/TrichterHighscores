export function parseTimeSeconds(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  const seconds = Number(normalized);

  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}