import { describe, expect, it } from 'vitest';
import { getWeatherPresentation } from '../../src/lib/weatherCodes';

describe('getWeatherPresentation', () => {
  it.each([
    { code: 0, label: 'Céu limpo', icon: '☀️' },
    { code: 3, label: 'Nublado', icon: '☁️' },
    { code: 45, label: 'Neblina', icon: '🌫️' },
    { code: 61, label: 'Chuva fraca', icon: '🌧️' },
    { code: 71, label: 'Neve fraca', icon: '🌨️' },
    { code: 95, label: 'Trovoada', icon: '⛈️' },
  ])('returns the Portuguese label and icon for WMO code $code', ({ code, label, icon }) => {
    expect(getWeatherPresentation(code)).toEqual({ label, icon });
  });

  it.each([
    undefined,
    999,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('returns the generic presentation for missing or unknown code %s', (code) => {
    expect(getWeatherPresentation(code)).toEqual({
      label: 'Condição não disponível',
      icon: '❔',
    });
  });

  it('uses the fallback when no code argument is provided', () => {
    expect(getWeatherPresentation()).toEqual({
      label: 'Condição não disponível',
      icon: '❔',
    });
  });
});
