import type { Unit } from '../types/weather';
import { isFiniteNumber, UNAVAILABLE_LABEL } from './format';

function roundHalfAwayFromZero(value: number): number {
  const rounded = Math.sign(value) * Math.floor(Math.abs(value) + 0.5);
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function convertTemperature(temperatureCelsius: number, unit: Unit): number {
  const temperature =
    unit === 'fahrenheit' ? (temperatureCelsius * 9) / 5 + 32 : temperatureCelsius;
  return roundHalfAwayFromZero(temperature);
}

export function formatTemperature(temperatureCelsius: unknown, unit: Unit): string {
  if (!isFiniteNumber(temperatureCelsius)) return UNAVAILABLE_LABEL;
  const value = convertTemperature(temperatureCelsius, unit);
  const unitLabel = unit === 'celsius' ? '°C' : '°F';
  return `${value} ${unitLabel}`;
}
