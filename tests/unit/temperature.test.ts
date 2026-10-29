import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature } from '../../src/lib/temperature';

describe('temperature utilities', () => {
  it('converts Celsius values to Fahrenheit and rounds to whole degrees', () => {
    expect(convertTemperature(0, 'fahrenheit')).toBe(32);
    expect(convertTemperature(-10, 'fahrenheit')).toBe(14);
    expect(convertTemperature(20, 'fahrenheit')).toBe(68);
    expect(convertTemperature(1.4, 'fahrenheit')).toBe(35);
  });

  it('rounds half values away from zero and formats the selected unit', () => {
    expect(convertTemperature(0.5, 'celsius')).toBe(1);
    expect(convertTemperature(-0.5, 'celsius')).toBe(-1);
    expect(formatTemperature(22, 'celsius')).toBe('22 °C');
    expect(formatTemperature(22, 'fahrenheit')).toBe('72 °F');
  });
});
