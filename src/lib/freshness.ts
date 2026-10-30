const STALE_AFTER_MS = 2 * 60 * 60 * 1000;

function offsetMs(timeZone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const wallClockAsUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );
  return wallClockAsUtc - Math.floor(utcMs / 1000) * 1000;
}

// referenceTime é horário local da cidade, sem offset; converte para o instante real.
export function isStaleReference(
  referenceTime: string | undefined,
  timezone: string,
  now: Date = new Date(),
): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(referenceTime ?? '');
  if (!match) return false;

  try {
    const [year, month, day, hour, minute] = match.slice(1).map(Number);
    const wallClockMs = Date.UTC(year, month - 1, day, hour, minute);
    const firstGuess = wallClockMs - offsetMs(timezone, wallClockMs);
    const instant = wallClockMs - offsetMs(timezone, firstGuess);
    return now.getTime() - instant > STALE_AFTER_MS;
  } catch {
    return false;
  }
}
