import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature } from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [-10, 14],
    [20, 68],
    [1.4, 35],
    [2.5, 37],
    [-37.5, -36],
  ])('converts %s Celsius to %s Fahrenheit', (temperature, expected) => {
    expect(convertTemperature(temperature, 'fahrenheit')).toBe(expected);
  });

  it.each([
    [0, 0],
    [100, 100],
    [-40, -40],
    [1.4, 1],
    [-1.4, -1],
    [0.5, 1],
    [-0.5, -1],
    [1.5, 2],
    [-1.5, -2],
    [0.1, 0],
    [-0.1, 0],
  ])('keeps %s in Celsius and rounds to %s without negative zero', (temperature, expected) => {
    expect(convertTemperature(temperature, 'celsius')).toBe(expected);
  });
});

describe('formatTemperature', () => {
  it.each([
    [22.4, 'celsius', '22 °C'],
    [22.5, 'celsius', '23 °C'],
    [-22.5, 'celsius', '-23 °C'],
    [-0.1, 'celsius', '0 °C'],
    [0, 'fahrenheit', '32 °F'],
    [100, 'fahrenheit', '212 °F'],
    [-40, 'fahrenheit', '-40 °F'],
    [22, 'fahrenheit', '72 °F'],
    [2.5, 'fahrenheit', '37 °F'],
    [-37.5, 'fahrenheit', '-36 °F'],
  ] as const)('formats %s in %s as %s', (temperature, unit, expected) => {
    expect(formatTemperature(temperature, unit)).toBe(expected);
  });

  it.each([
    ['celsius', '°C'],
    ['fahrenheit', '°F'],
  ] as const)('uses the unitLabel %s → %s', (unit, label) => {
    expect(formatTemperature(0, unit).endsWith(` ${label}`)).toBe(true);
  });
});
