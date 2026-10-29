export type MetricUnit = '%' | 'km/h' | 'mm' | 'hPa';

export function getDayLabel(date: string, index: number): string {
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

export function getShortDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatMetric(value: number | undefined, unit: MetricUnit): string {
  if (value === undefined || !Number.isFinite(value)) return 'Não disponível';

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
  }).format(value);

  return unit === '%' ? `${formattedValue}${unit}` : `${formattedValue} ${unit}`;
}

export function formatReferenceTime(referenceTime?: string): string {
  if (!referenceTime) return 'Atualidade não informada';

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(referenceTime);
  if (!match) return 'Atualidade não informada';

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} às ${hour}:${minute}`;
}
