import { describe, expect, it } from 'vitest';
import { getWeatherPresentation } from '../../src/lib/weatherCodes';

describe('getWeatherPresentation', () => {
  it('returns a Portuguese label and icon for known WMO codes', () => {
    expect(getWeatherPresentation(0)).toEqual({ label: 'Céu limpo', icon: '☀️' });
    expect(getWeatherPresentation(61)).toEqual({ label: 'Chuva fraca', icon: '🌧️' });
  });

  it('returns the generic presentation for missing or unknown codes', () => {
    expect(getWeatherPresentation(999)).toEqual({
      label: 'Condição não disponível',
      icon: '❔',
    });
    expect(getWeatherPresentation()).toEqual({
      label: 'Condição não disponível',
      icon: '❔',
    });
  });
});
