import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities } from '../../src/services/weatherService';

const city = { id: 1, name: 'Berlin', latitude: 52.52, longitude: 13.41 };
const fetchMock = vi.fn<typeof fetch>();

function mockResponse(payload: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(payload)));
}

function forecastPayload(timezone: string, dates: string[], daily = {}) {
  return {
    timezone,
    current: { time: `${dates[0]}T10:00`, temperature_2m: 10 },
    daily: {
      time: dates,
      weather_code: [0, 1, 2, 3, 61],
      temperature_2m_min: [1, 2, 3, 4, 5],
      temperature_2m_max: [11, 12, 13, 14, 15],
      ...daily,
    },
  };
}

describe('Open-Meteo request contract', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses only HTTPS public endpoints without apikey or customer- hosts', async () => {
    mockResponse({ results: [] });
    await searchCities('Berlin');
    mockResponse(forecastPayload('Europe/Berlin', ['2026-10-29']));
    await getWeather(city);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [input] of fetchMock.mock.calls) {
      const url = new URL(String(input));
      expect(url.protocol).toBe('https:');
      expect(['geocoding-api.open-meteo.com', 'api.open-meteo.com']).toContain(url.hostname);
      expect(url.searchParams.has('apikey')).toBe(false);
      expect(String(input)).not.toMatch(/customer-|apikey/i);
    }
  });
});

describe('getWeather edge cases', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each([
    [
      'Europe/Berlin',
      '2026-03-28T12:00:00Z',
      ['2026-03-28', '2026-03-29', '2026-03-30', '2026-03-31', '2026-04-01'],
    ],
    [
      'America/New_York',
      '2026-11-01T03:30:00Z',
      ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'],
    ],
  ])('keeps five consecutive local dates across %s daylight-saving changes', async (timezone, now, dates) => {
    vi.setSystemTime(new Date(now));
    mockResponse(forecastPayload(timezone, dates));

    const weather = await getWeather(city);

    expect(weather.forecast.map(({ date }) => date)).toEqual(dates);
    expect(weather.forecast.map(({ weatherCode }) => weatherCode)).toEqual([0, 1, 2, 3, 61]);
  });

  it('returns exactly five local dates, ignoring past and extra days in a longer payload', async () => {
    vi.setSystemTime(new Date('2026-10-29T15:00:00Z'));
    mockResponse(
      forecastPayload(
        'Europe/Berlin',
        [
          '2026-10-28',
          '2026-10-29',
          '2026-10-30',
          '2026-10-31',
          '2026-11-01',
          '2026-11-02',
          '2026-11-03',
        ],
        {
          weather_code: [9, 0, 1, 2, 3, 61, 8],
          temperature_2m_min: [90, 1, 2, 3, 4, 5, 80],
          temperature_2m_max: [91, 11, 12, 13, 14, 15, 81],
        },
      ),
    );

    const weather = await getWeather(city);

    expect(weather.forecast.map(({ date }) => date)).toEqual([
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(weather.forecast.map(({ weatherCode }) => weatherCode)).toEqual([0, 1, 2, 3, 61]);
    expect(weather.forecast.map(({ minC }) => minC)).toEqual([1, 2, 3, 4, 5]);
  });

  it.each([
    ['duplicate dates', { time: ['2026-10-29', '2026-10-29', '2026-10-31'] }],
    ['a non-numeric temperature entry', { temperature_2m_min: [1, 'warm', 3, 4, 5] }],
    ['a non-numeric weather code entry', { weather_code: [0, 1, '2', 3, 61] }],
  ])('rejects %s instead of showing misleading data', async (_name, daily) => {
    vi.setSystemTime(new Date('2026-10-29T15:00:00Z'));
    mockResponse(
      forecastPayload(
        'Europe/Berlin',
        ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
        daily,
      ),
    );

    await expect(getWeather(city)).rejects.toMatchObject({
      kind: 'invalid-response',
      message: 'Não foi possível carregar o clima. Tente novamente.',
    });
  });

  it('ignores a response that arrives after the timeout', async () => {
    vi.setSystemTime(new Date('2026-10-29T15:00:00Z'));
    let respond!: (response: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          respond = resolve;
        }),
    );
    const pending = getWeather(city);
    const rejection = expect(pending).rejects.toMatchObject({ kind: 'timeout' });
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;

    respond(new Response(JSON.stringify(forecastPayload('Europe/Berlin', ['2026-10-29']))));
    await vi.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: 'timeout' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps null values in their own day without shifting neighboring days', async () => {
    vi.setSystemTime(new Date('2026-10-29T15:00:00Z'));
    mockResponse(
      forecastPayload(
        'Europe/Berlin',
        ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
        {
          weather_code: [0, null, 2, 3, 61],
          temperature_2m_min: [1, 2, null, 4, 5],
          temperature_2m_max: [11, 12, 13, null, 15],
        },
      ),
    );

    const weather = await getWeather(city);

    expect(weather.forecast).toEqual([
      { date: '2026-10-29', weatherCode: 0, minC: 1, maxC: 11 },
      { date: '2026-10-30', minC: 2, maxC: 12 },
      { date: '2026-10-31', weatherCode: 2, maxC: 13 },
      { date: '2026-11-01', weatherCode: 3, minC: 4 },
      { date: '2026-11-02', weatherCode: 61, minC: 5, maxC: 15 },
    ]);
  });
});
