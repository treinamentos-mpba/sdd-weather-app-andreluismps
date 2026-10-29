import { describe, expect, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weatherData';

describe('mockWeatherData', () => {
  it('provides a selected city, current weather, and five consecutive forecast days', () => {
    expect(mockWeatherData.city.name).toBe('Sao Paulo');
    expect(mockWeatherData.current).toMatchObject({
      temperatureC: 22,
      weatherCode: 2,
    });
    expect(mockWeatherData.forecast).toHaveLength(5);

    const dates = mockWeatherData.forecast.map(({ date }) => Date.parse(`${date}T00:00:00Z`));
    const oneDay = 24 * 60 * 60 * 1000;

    expect(dates.slice(1).every((date, index) => date - dates[index] === oneDay)).toBe(true);
  });
});
