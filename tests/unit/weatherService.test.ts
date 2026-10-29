import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../src/services/weatherService';

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

    await expect(searchCities('São Paulo')).rejects.toMatchObject({ kind: 'network' });
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
    const rejection = expect(pending).rejects.toMatchObject({ kind: 'timeout' });

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
