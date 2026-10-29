import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData = {
  city: {
    id: 3448433,
    name: 'Sao Paulo',
    admin1: 'Sao Paulo',
    country: 'Brazil',
    latitude: -23.5505,
    longitude: -46.6333,
  },
  timezone: 'America/Sao_Paulo',
  current: {
    temperatureC: 22,
    weatherCode: 2,
    relativeHumidityPercent: 68,
    windSpeedKmh: 12.3,
    precipitationMm: 0.1,
    surfacePressureHpa: 1015.2,
    referenceTime: '2026-10-29T10:00',
  },
  forecast: [
    { date: '2026-10-29', weatherCode: 2, minC: 17, maxC: 25 },
    { date: '2026-10-30', weatherCode: 3, minC: 16, maxC: 24 },
    { date: '2026-10-31', weatherCode: 61, minC: 18, maxC: 23 },
    { date: '2026-11-01', weatherCode: 1, minC: 17, maxC: 26 },
    { date: '2026-11-02', weatherCode: 0, minC: 18, maxC: 27 },
  ],
};
