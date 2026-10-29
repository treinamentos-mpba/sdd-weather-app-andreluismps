import { describe, expect, it } from 'vitest';
import { formatMetric, formatReferenceTime } from '../../src/lib/format';

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
