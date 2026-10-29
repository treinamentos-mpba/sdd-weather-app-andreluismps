import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService';

const city = {
  id: 3448433,
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.5505,
  longitude: -46.6333,
};

const fetchMock = vi.fn<typeof fetch>();

function mockResponse(payload: unknown, status = 200) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(payload), { status }));
}

describe('searchCities', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each([
    '',
    '   ',
    '\n\t',
  ])('returns no cities without a request for empty input %j', async (name) => {
    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('encodes the trimmed name and sends only the public geocoding parameters', async () => {
    mockResponse({ results: [city] });
    const name = "São Paulo & L'Haÿ-les-Roses";

    await searchCities(`  ${name}  `);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=pt&format=json`,
      { signal: expect.any(AbortSignal) },
    );
  });

  it('maps only City fields and preserves missing optional fields', async () => {
    const minimalCity = { id: 1, name: 'Berlin', latitude: 52.52, longitude: 13.41 };
    mockResponse({ results: [{ ...city, population: 123 }, minimalCity] });

    await expect(searchCities('São Paulo')).resolves.toEqual([city, minimalCity]);
  });

  it('returns at most five cities', async () => {
    mockResponse({
      results: Array.from({ length: 6 }, (_value, index) => ({ ...city, id: index })),
    });

    expect(await searchCities('São Paulo')).toHaveLength(5);
  });

  it.each([
    {},
    { results: [] },
  ])('returns an empty list for a successful empty payload %j', async (payload) => {
    mockResponse(payload);

    await expect(searchCities('unknown')).resolves.toEqual([]);
  });

  it('throws WeatherServiceError for a non-OK response without reading its body', async () => {
    const response = new Response('private upstream details', { status: 503 });
    const jsonSpy = vi.spyOn(response, 'json');
    fetchMock.mockResolvedValue(response);

    const error = await searchCities('São Paulo').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({
      name: 'WeatherServiceError',
      kind: 'api',
      message: 'Não foi possível buscar cidades. Tente novamente.',
    });
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it('recognizes an API error payload even with a successful HTTP status', async () => {
    mockResponse({ error: true, reason: 'upstream details' });

    await expect(searchCities('São Paulo')).rejects.toMatchObject({ kind: 'api' });
  });

  it('normalizes network failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(searchCities('São Paulo')).rejects.toMatchObject({
      kind: 'network',
      message: 'Falha de rede.',
    });
  });

  it.each([
    null,
    [],
    { results: null },
    { results: [{ ...city, latitude: 'invalid' }] },
  ])('rejects malformed payloads %j', async (payload) => {
    mockResponse(payload);

    await expect(searchCities('São Paulo')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('rejects unreadable JSON', async () => {
    fetchMock.mockResolvedValue(new Response('not json'));

    await expect(searchCities('São Paulo')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('aborts and rejects after ten seconds even if the request ignores cancellation', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
    const pending = searchCities('São Paulo');
    const rejection = expect(pending).rejects.toMatchObject({
      kind: 'timeout',
      message: 'A requisição demorou demais.',
    });

    await vi.advanceTimersByTimeAsync(9_999);
    const signal = fetchMock.mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    await rejection;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the timeout after a successful response', async () => {
    vi.useFakeTimers();
    mockResponse({ results: [city] });

    await searchCities('São Paulo');

    expect(vi.getTimerCount()).toBe(0);
  });
});

const weatherPayload = {
  timezone: 'America/Sao_Paulo',
  current: {
    time: '2026-10-29T10:00',
    temperature_2m: 22.4,
    weather_code: 2,
    relative_humidity_2m: 68,
    wind_speed_10m: 12.3,
    precipitation: 0.1,
    surface_pressure: 1015.2,
  },
  daily: {
    time: ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
    weather_code: [2, 3, 61, 1, 0],
    temperature_2m_min: [17, 16, 18, 17, 18],
    temperature_2m_max: [25, 24, 23, 26, 27],
  },
};

describe('getWeather', () => {
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

  it('requests the selected coordinates, fields and canonical units from the public endpoint', async () => {
    mockResponse(weatherPayload);

    await getWeather(city);

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      latitude: '-23.5505',
      longitude: '-46.6333',
      current:
        'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure,weather_code',
      daily: 'weather_code,temperature_2m_min,temperature_2m_max',
      forecast_days: '5',
      timezone: 'auto',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
    });
  });

  it('maps current fields and the five parallel daily entries without rounding temperatures', async () => {
    mockResponse(weatherPayload);

    const weather = await getWeather(city);

    expect(weather.city).toBe(city);
    expect(weather.timezone).toBe('America/Sao_Paulo');
    expect(weather.current).toEqual({
      temperatureC: 22.4,
      weatherCode: 2,
      relativeHumidityPercent: 68,
      windSpeedKmh: 12.3,
      precipitationMm: 0.1,
      surfacePressureHpa: 1015.2,
      referenceTime: '2026-10-29T10:00',
    });
    expect(weather.forecast).toEqual([
      { date: '2026-10-29', weatherCode: 2, minC: 17, maxC: 25 },
      { date: '2026-10-30', weatherCode: 3, minC: 16, maxC: 24 },
      { date: '2026-10-31', weatherCode: 61, minC: 18, maxC: 23 },
      { date: '2026-11-01', weatherCode: 1, minC: 17, maxC: 26 },
      { date: '2026-11-02', weatherCode: 0, minC: 18, maxC: 27 },
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    { precipitation: null, expected: 0 },
    { precipitation: 0, expected: 0 },
    { precipitation: undefined, expected: undefined },
  ])('maps precipitation $precipitation to $expected', async ({ precipitation, expected }) => {
    mockResponse({
      ...weatherPayload,
      current: { ...weatherPayload.current, precipitation },
    });

    const weather = await getWeather(city);

    expect(weather.current?.precipitationMm).toBe(expected);
  });

  it('uses the returned timezone rather than the host calendar date', async () => {
    vi.setSystemTime(new Date('2026-10-28T12:30:00Z'));
    mockResponse({ ...weatherPayload, timezone: 'Pacific/Kiritimati' });

    const weather = await getWeather(city);

    expect(weather.forecast[0].date).toBe('2026-10-29');
    expect(weather.forecast[4].date).toBe('2026-11-02');
  });

  it('keeps a missing date in place without shifting subsequent parallel values', async () => {
    mockResponse({
      ...weatherPayload,
      daily: {
        time: ['2026-10-29', '2026-10-31', '2026-11-01', '2026-11-02'],
        weather_code: [2, 61, 1, 0],
        temperature_2m_min: [17, 18, 17, 18],
        temperature_2m_max: [25, 23, 26, 27],
      },
    });

    const weather = await getWeather(city);

    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast[1]).toEqual({ date: '2026-10-30' });
    expect(weather.forecast[2]).toEqual({
      date: '2026-10-31',
      weatherCode: 61,
      minC: 18,
      maxC: 23,
    });
  });

  it('maps arrays by their dates even when daily entries arrive out of order', async () => {
    mockResponse({
      ...weatherPayload,
      daily: {
        time: ['2026-10-30', '2026-10-29'],
        weather_code: [3, 2],
        temperature_2m_min: [16, 17],
        temperature_2m_max: [24, 25],
      },
    });

    const weather = await getWeather(city);

    expect(weather.forecast[0]).toEqual({ date: '2026-10-29', weatherCode: 2, minC: 17, maxC: 25 });
    expect(weather.forecast[1]).toEqual({ date: '2026-10-30', weatherCode: 3, minC: 16, maxC: 24 });
  });

  it('preserves partial current data and marks absent daily values as unavailable', async () => {
    mockResponse({
      ...weatherPayload,
      current: { temperature_2m: 0, relative_humidity_2m: null },
      daily: { time: weatherPayload.daily.time, temperature_2m_min: [0, null] },
    });

    const weather = await getWeather(city);

    expect(weather.current).toEqual({ temperatureC: 0 });
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast[0]).toEqual({ date: '2026-10-29', minC: 0 });
    expect(weather.forecast[1]).toEqual({ date: '2026-10-30' });
  });

  it.each([
    { current: undefined },
    { current: null },
    { daily: undefined },
    { daily: null },
    { timezone: undefined },
    { timezone: 'not-a-timezone' },
    { current: { temperature_2m: 'warm' } },
    { daily: { time: 'not-an-array' } },
    { daily: { time: ['invalid-date'] } },
    { daily: { time: weatherPayload.daily.time, weather_code: 'sunny' } },
  ])('rejects missing sections and structurally invalid responses %j', async (override) => {
    mockResponse({ ...weatherPayload, ...override });

    const error = await getWeather(city).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({
      kind: 'invalid-response',
      message: 'Não foi possível carregar o clima. Tente novamente.',
    });
  });

  it('throws an API error for a non-OK response', async () => {
    mockResponse({}, 503);

    await expect(getWeather(city)).rejects.toMatchObject({
      kind: 'api',
      message: 'Não foi possível carregar o clima. Tente novamente.',
    });
  });

  it('rejects an API error payload', async () => {
    mockResponse({ error: true });

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'api' });
  });

  it('normalizes network errors with the shared network message', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(getWeather(city)).rejects.toMatchObject({
      kind: 'network',
      message: 'Falha de rede.',
    });
  });

  it('rejects unreadable JSON', async () => {
    fetchMock.mockResolvedValue(new Response('not json'));

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('aborts the forecast request after ten seconds', async () => {
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
    const pending = getWeather(city);
    const rejection = expect(pending).rejects.toMatchObject({
      kind: 'timeout',
      message: 'A requisição demorou demais.',
    });

    await vi.advanceTimersByTimeAsync(10_000);

    await rejection;
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns the JSON payload and clears the timer after success', async () => {
    mockResponse({ results: [] });

    await expect(fetchWithTimeout('https://example.test')).resolves.toEqual({ results: [] });

    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false);
  });

  it.each([
    {
      cause: new DOMException('Aborted', 'AbortError'),
      kind: 'timeout',
      message: 'A requisição demorou demais.',
    },
    { cause: new TypeError('Failed to fetch'), kind: 'network', message: 'Falha de rede.' },
  ])('normalizes $kind errors and clears the timer', async ({ cause, kind, message }) => {
    fetchMock.mockRejectedValue(cause);

    const error = await fetchWithTimeout('https://example.test').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ kind, message });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves HTTP errors and clears the timer after failure', async () => {
    mockResponse({}, 503);

    await expect(fetchWithTimeout('https://example.test')).rejects.toMatchObject({ kind: 'api' });

    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    {
      cause: new DOMException('Aborted', 'AbortError'),
      kind: 'timeout',
      message: 'A requisição demorou demais.',
    },
    { cause: new TypeError('Connection terminated'), kind: 'network', message: 'Falha de rede.' },
  ])('normalizes $kind errors while reading JSON', async ({ cause, kind, message }) => {
    const response = new Response('{}');
    vi.spyOn(response, 'json').mockRejectedValue(cause);
    fetchMock.mockResolvedValue(response);

    await expect(fetchWithTimeout('https://example.test')).rejects.toMatchObject({
      kind,
      message,
    });

    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the timeout active until the response body has been read', async () => {
    const response = new Response('{}');
    vi.spyOn(response, 'json').mockImplementation(() => new Promise<never>(() => {}));
    fetchMock.mockResolvedValue(response);
    const pending = fetchWithTimeout('https://example.test');
    const rejection = expect(pending).rejects.toMatchObject({
      kind: 'timeout',
      message: 'A requisição demorou demais.',
    });

    await vi.advanceTimersByTimeAsync(10_000);

    await rejection;
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
