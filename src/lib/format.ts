export type MetricUnit = '%' | 'km/h' | 'mm' | 'hPa';

export const UNAVAILABLE_LABEL = 'Não disponível';
export const UNAVAILABLE_DATE_LABEL = 'Data indisponível';

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseLocalDate(date: unknown): Date | null {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDayLabel(date: string, index: number): string {
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';

  const parsed = parseLocalDate(date);
  if (!parsed) return UNAVAILABLE_DATE_LABEL;
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(parsed);
}

export function getShortDate(date: string): string {
  const parsed = parseLocalDate(date);
  if (!parsed) return UNAVAILABLE_DATE_LABEL;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(parsed);
}

export function formatForecastDate(date: string): string {
  const parsed = parseLocalDate(date);
  if (!parsed) return UNAVAILABLE_DATE_LABEL;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    weekday: 'short',
  }).format(parsed);
}

export function formatMetric(value: unknown, unit: MetricUnit): string {
  if (!isFiniteNumber(value)) return UNAVAILABLE_LABEL;

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
  }).format(value);

  return unit === '%' ? `${formattedValue}${unit}` : `${formattedValue} ${unit}`;
}

export function formatReferenceTime(referenceTime?: string | null): string {
  if (typeof referenceTime !== 'string' || !referenceTime) return 'Atualidade não informada';

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(referenceTime);
  if (!match) return 'Atualidade não informada';

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} às ${hour}:${minute}`;
}
