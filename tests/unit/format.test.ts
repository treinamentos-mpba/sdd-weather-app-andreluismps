import { describe, expect, it } from 'vitest';
import { formatMetric, formatReferenceTime, getDayLabel, getShortDate } from '../../src/lib/format';

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
  });

  it('formats the source local reference time without using the host timezone', () => {
    expect(formatReferenceTime('2026-10-29T10:00')).toBe('29/10/2026 às 10:00');
    expect(formatReferenceTime(undefined)).toBe('Atualidade não informada');
    expect(formatReferenceTime('invalid')).toBe('Atualidade não informada');
  });
});
