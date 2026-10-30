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

describe('searchCities special characters and blank input', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    '\u00a0',
    '\u3000',
    ' \t\r\n ',
    '\u2003\u2003',
  ])('does not request anything for the blank input %j', async (blank) => {
    await expect(searchCities(blank)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'São Paulo',
    "L'Haÿ-les-Roses",
    'Aix-en-Provence',
    'Saint-Étienne',
    'Zu\u0308rich',
    '東京',
    'a&apikey=secret',
    'a#fragment',
    'a?x=1&y=2',
    '100% real',
    'a+b',
    'a/b\\c',
    '<script>alert(1)</script>',
    "'; DROP TABLE cities;--",
  ])('sends "%s" as exactly one encoded name parameter', async (name) => {
    mockResponse({ results: [] });

    await searchCities(`  ${name}  `);

    const requested = String(fetchMock.mock.calls[0][0]);
    const url = new URL(requested);
    expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
    expect([...url.searchParams.keys()]).toEqual(['name', 'count', 'language', 'format']);
    expect(url.searchParams.get('name')).toBe(name);
    expect(url.hash).toBe('');
    expect(requested).toContain(`?name=${encodeURIComponent(name)}&count=5&`);
    expect(requested).not.toMatch(/[<>" #]|%20&|name=%20/);
  });

  it('does not normalize accents, so a decomposed name reaches the API as typed', async () => {
    mockResponse({ results: [] });
    const decomposed = 'Zu\u0308rich';

    await searchCities(decomposed);

    const name = new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('name');
    expect(name).toBe(decomposed);
    expect(name).not.toBe(decomposed.normalize('NFC'));
  });

  it('returns names with markup as plain strings, never as parsed content', async () => {
    mockResponse({
      results: [
        { id: 1, name: '<b>Evil</b>', admin1: '<img src=x onerror=1>', latitude: 1, longitude: 2 },
      ],
    });

    await expect(searchCities('x')).resolves.toEqual([
      { id: 1, name: '<b>Evil</b>', admin1: '<img src=x onerror=1>', latitude: 1, longitude: 2 },
    ]);
  });
});

describe('getWeather with incomplete daily arrays', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T15:00:00Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const dates = ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'];

  it('marks the days beyond the end of shorter value arrays as unavailable', async () => {
    mockResponse(
      forecastPayload('Europe/Berlin', dates, {
        weather_code: [0, 1],
        temperature_2m_min: [1],
        temperature_2m_max: [],
      }),
    );

    const weather = await getWeather(city);

    expect(weather.forecast).toEqual([
      { date: '2026-10-29', weatherCode: 0, minC: 1 },
      { date: '2026-10-30', weatherCode: 1 },
      { date: '2026-10-31' },
      { date: '2026-11-01' },
      { date: '2026-11-02' },
    ]);
  });

  it('ignores extra values that have no matching date', async () => {
    mockResponse(
      forecastPayload('Europe/Berlin', dates.slice(0, 2), {
        weather_code: [0, 1, 2, 3, 4],
        temperature_2m_min: [1, 2, 3, 4, 5],
        temperature_2m_max: [11, 12, 13, 14, 15],
      }),
    );

    const weather = await getWeather(city);

    expect(weather.forecast.map(({ date }) => date)).toEqual(dates);
    expect(weather.forecast.map(({ weatherCode }) => weatherCode)).toEqual([
      0,
      1,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('keeps a complete current block when every daily field is absent', async () => {
    mockResponse({
      timezone: 'Europe/Berlin',
      current: { time: '2026-10-29T10:00', temperature_2m: 10, weather_code: 3 },
      daily: { time: [] },
    });

    const weather = await getWeather(city);

    expect(weather.current).toMatchObject({ temperatureC: 10, weatherCode: 3 });
    expect(weather.forecast.map(({ date }) => date)).toEqual(dates);
    expect(weather.forecast).toEqual(dates.map((date) => ({ date })));
  });
});

describe('Open-Meteo null and absent fields', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T15:00:00Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const berlin = { id: 7, name: 'Berlin', latitude: 52.52, longitude: 13.41 };

  it.each([
    ['absent', {}],
    ['null', { admin1: null, country: null }],
    ['empty', { admin1: '', country: '' }],
  ])('treats %s region and country as missing without failing the search', async (_label, extra) => {
    mockResponse({ results: [{ ...berlin, ...extra }] });

    await expect(searchCities('Berlin')).resolves.toEqual([
      { ...berlin, admin1: undefined, country: undefined },
    ]);
  });

  it('skips unusable entries but keeps the valid cities', async () => {
    mockResponse({
      results: [
        { ...berlin, id: 1, name: null },
        { ...berlin, id: 2, name: '   ' },
        { ...berlin, id: 3, latitude: null },
        { ...berlin, id: 4, longitude: 'x' },
        { ...berlin, id: null },
        null,
        berlin,
      ],
    });

    const cities = await searchCities('Berlin');

    expect(cities.map(({ id }) => id)).toEqual([7]);
  });

  it('fails only when no entry is usable', async () => {
    mockResponse({ results: [{ ...berlin, name: null }, null] });

    await expect(searchCities('Berlin')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('maps every null current field to unavailable and keeps real zeros', async () => {
    mockResponse({
      timezone: 'Europe/Berlin',
      current: {
        time: null,
        temperature_2m: 0,
        weather_code: null,
        relative_humidity_2m: null,
        wind_speed_10m: 0,
        precipitation: null,
        surface_pressure: null,
      },
      daily: { time: null, weather_code: null },
    });

    await expect(getWeather(berlin)).rejects.toMatchObject({ kind: 'invalid-response' });

    mockResponse({
      timezone: 'Europe/Berlin',
      current: {
        time: null,
        temperature_2m: 0,
        weather_code: null,
        relative_humidity_2m: null,
        wind_speed_10m: 0,
        precipitation: null,
        surface_pressure: null,
      },
      daily: { time: [] },
    });
    const weather = await getWeather(berlin);

    expect(weather.current).toEqual({
      temperatureC: 0,
      windSpeedKmh: 0,
      precipitationMm: 0,
    });
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast).toEqual(weather.forecast.map(({ date }) => ({ date })));
  });

  it('does not invent a zero precipitation when the whole current block is null', async () => {
    mockResponse({
      timezone: 'Europe/Berlin',
      current: {
        time: null,
        temperature_2m: null,
        weather_code: null,
        relative_humidity_2m: null,
        wind_speed_10m: null,
        precipitation: null,
        surface_pressure: null,
      },
      daily: {
        time: [],
        weather_code: null,
        temperature_2m_min: null,
        temperature_2m_max: null,
      },
    });

    const weather = await getWeather(berlin);

    expect(Object.values(weather.current ?? {}).every((value) => value === undefined)).toBe(true);
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast).toEqual(weather.forecast.map(({ date }) => ({ date })));
  });

  it.each([
    ['null', null],
    ['empty', ''],
  ])('drops a %s reference time instead of showing a broken timestamp', async (_label, time) => {
    mockResponse({
      timezone: 'Europe/Berlin',
      current: { time, temperature_2m: 10 },
      daily: { time: [] },
    });

    const weather = await getWeather(berlin);

    expect(weather.current?.referenceTime).toBeUndefined();
    expect(weather.current?.temperatureC).toBe(10);
  });

  it.each([
    ['timezone is missing', { timezone: undefined }],
    ['timezone is null', { timezone: null }],
    ['current is null', { current: null }],
    ['daily is null', { daily: null }],
  ])('treats the response as incomplete when %s', async (_label, override) => {
    mockResponse({
      timezone: 'Europe/Berlin',
      current: { time: '2026-10-29T10:00', temperature_2m: 10 },
      daily: { time: [] },
      ...override,
    });

    await expect(getWeather(berlin)).rejects.toMatchObject({
      kind: 'invalid-response',
      message: 'Não foi possível carregar o clima. Tente novamente.',
    });
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
