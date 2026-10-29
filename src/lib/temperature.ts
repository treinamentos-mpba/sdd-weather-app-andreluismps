import type { Unit } from '../types/weather';

function roundHalfAwayFromZero(value: number): number {
  const rounded = Math.sign(value) * Math.floor(Math.abs(value) + 0.5);
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function convertTemperature(temperatureCelsius: number, unit: Unit): number {
  const temperature =
    unit === 'fahrenheit' ? (temperatureCelsius * 9) / 5 + 32 : temperatureCelsius;
  return roundHalfAwayFromZero(temperature);
}

export function formatTemperature(temperatureCelsius: number, unit: Unit): string {
  const value = convertTemperature(temperatureCelsius, unit);
  const unitLabel = unit === 'celsius' ? '°C' : '°F';
  return `${value} ${unitLabel}`;
}
