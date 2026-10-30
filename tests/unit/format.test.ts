import { describe, expect, it } from 'vitest';
import {
  formatForecastDate,
  formatMetric,
  formatReferenceTime,
  getDayLabel,
  getShortDate,
  isFiniteNumber,
} from '../../src/lib/format';

describe('isFiniteNumber', () => {
  it.each([0, -0, 1.5, -10])('accepts the number %s, including zero', (value) => {
    expect(isFiniteNumber(value)).toBe(true);
  });

  it.each([
    null,
    undefined,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    '1',
    '',
    {},
    [],
    false,
  ])('rejects %s', (value) => {
    expect(isFiniteNumber(value)).toBe(false);
  });
});

describe('safe date formatting', () => {
  it.each([
    '',
    'not-a-date',
    '2026-13-45',
    '2026-10-29T10:00',
    null,
    undefined,
    20261029,
  ])('falls back to a readable label for the invalid date %s', (date) => {
    const invalid = date as unknown as string;
    expect(getShortDate(invalid)).toBe('Data indisponível');
    expect(getDayLabel(invalid, 3)).toBe('Data indisponível');
    expect(formatForecastDate(invalid)).toBe('Data indisponível');
  });

  it('keeps Hoje and Amanhã even when the date is unusable', () => {
    expect(getDayLabel('', 0)).toBe('Hoje');
    expect(getDayLabel('', 1)).toBe('Amanhã');
  });

  it('formats a valid forecast date in pt-BR', () => {
    expect(formatForecastDate('2026-10-29')).toMatch(/29/);
  });
});

describe('getDayLabel', () => {
  it.each([
    ['2026-10-29', 0, 'Hoje'],
    ['2026-10-30', 1, 'Amanhã'],
    ['2026-10-31', 2, 'sábado'],
    ['2026-11-01', 3, 'domingo'],
    ['2026-11-02', 4, 'segunda-feira'],
    ['2026-12-31', 2, 'quinta-feira'],
    ['2027-01-01', 3, 'sexta-feira'],
  ] as const)('labels %s at index %s as %s', (date, index, expected) => {
    expect(getDayLabel(date, index)).toBe(expected);
  });
});

describe('getShortDate', () => {
  it.each([
    ['2026-10-29', '29/10'],
    ['2026-01-02', '02/01'],
    ['2026-12-31', '31/12'],
    ['2027-01-01', '01/01'],
    ['2028-02-29', '29/02'],
  ])('formats local forecast date %s as %s', (date, expected) => {
    expect(getShortDate(date)).toBe(expected);
  });
});

describe('format helpers', () => {
  it('formats weather metrics with Portuguese decimal separators and units', () => {
    expect(formatMetric(68, '%')).toBe('68%');
    expect(formatMetric(12.3, 'km/h')).toBe('12,3 km/h');
    expect(formatMetric(0.1, 'mm')).toBe('0,1 mm');
    expect(formatMetric(1015.2, 'hPa')).toBe('1.015,2 hPa');
    expect(formatMetric(undefined, 'mm')).toBe('Não disponível');
    expect(formatMetric(0, 'mm')).toBe('0 mm');
  });

  it.each([
    null,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    '12',
    {},
  ])('shows %s as an unavailable metric', (value) => {
    expect(formatMetric(value, 'km/h')).toBe('Não disponível');
  });

  it('formats the source local reference time without using the host timezone', () => {
    expect(formatReferenceTime('2026-10-29T10:00')).toBe('29/10/2026 às 10:00');
    expect(formatReferenceTime(undefined)).toBe('Atualidade não informada');
    expect(formatReferenceTime('invalid')).toBe('Atualidade não informada');
    expect(formatReferenceTime(null)).toBe('Atualidade não informada');
    expect(formatReferenceTime('')).toBe('Atualidade não informada');
  });
});
