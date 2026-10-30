import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);
const firstCity = mockWeatherData.city;
const secondCity: City = { ...firstCity, id: 2, name: 'Recife' };
const secondWeather: WeatherData = { ...mockWeatherData, city: secondCity };

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('useWeather', () => {
  beforeEach(() => {
    searchMock.mockReset();
    weatherMock.mockReset();
  });

  it('starts idle and retry does nothing before an operation', async () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      error: null,
      query: '',
    });
    await act(() => result.current.retry());

    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('does not call services for a whitespace-only search', async () => {
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('   '));

    expect(result.current).toMatchObject({ status: 'empty', query: '', data: null, error: null });
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('stays loading through geocoding and automatically loads the first city', async () => {
    const cities = deferred<City[]>();
    const weather = deferred<WeatherData>();
    searchMock.mockReturnValue(cities.promise);
    weatherMock.mockReturnValue(weather.promise);
    const { result } = renderHook(() => useWeather());
    let pending!: Promise<void>;

    act(() => {
      pending = result.current.search('  São Paulo  ');
    });
    expect(result.current).toMatchObject({ status: 'loading', query: 'São Paulo', data: null });
    await act(async () => {
      cities.resolve([firstCity, secondCity]);
    });

    expect(searchMock).toHaveBeenCalledWith('São Paulo');
    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(firstCity);
    expect(result.current).toMatchObject({ status: 'loading', cities: [firstCity, secondCity] });

    await act(async () => {
      weather.resolve(mockWeatherData);
      await pending;
    });

    expect(result.current).toMatchObject({
      status: 'success',
      data: mockWeatherData,
      selectedCity: firstCity,
      error: null,
    });
  });

  it('returns empty without requesting weather when there are no cities', async () => {
    searchMock.mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('Unknown'));

    expect(result.current).toMatchObject({ status: 'empty', cities: [], data: null, error: null });
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it.each([
    new WeatherServiceError('network', 'Falha de rede.'),
    new WeatherServiceError('timeout', 'A requisição demorou demais.'),
    new WeatherServiceError('api'),
    new WeatherServiceError('invalid-response'),
  ])('shows the stable search message for a %s geocoding failure and retries it', async (failure) => {
    searchMock.mockRejectedValueOnce(failure);
    searchMock.mockResolvedValueOnce([firstCity]);
    weatherMock.mockResolvedValue(mockWeatherData);
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Não foi possível buscar cidades. Tente novamente.',
      query: 'São Paulo',
    });
    await act(() => result.current.retry());

    expect(searchMock).toHaveBeenNthCalledWith(2, 'São Paulo');
    expect(result.current).toMatchObject({ status: 'success', data: mockWeatherData, error: null });
  });

  it.each([
    new WeatherServiceError('network', 'Falha de rede.'),
    new WeatherServiceError('timeout', 'A requisição demorou demais.'),
    new WeatherServiceError('api'),
    new WeatherServiceError('invalid-response'),
  ])('shows the stable weather message for a %s forecast failure and retries only weather', async (failure) => {
    searchMock.mockResolvedValue([firstCity, secondCity]);
    weatherMock.mockRejectedValueOnce(failure);
    weatherMock.mockResolvedValueOnce(mockWeatherData);
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Não foi possível carregar o clima. Tente novamente.',
      cities: [firstCity, secondCity],
      selectedCity: firstCity,
    });
    await act(() => result.current.retry());

    expect(searchMock).toHaveBeenCalledOnce();
    expect(weatherMock).toHaveBeenNthCalledWith(2, firstCity);
    expect(result.current).toMatchObject({ status: 'success', error: null });
  });

  it('tracks the explicitly selected city while keeping the search results', async () => {
    searchMock.mockResolvedValue([firstCity, secondCity]);
    weatherMock.mockResolvedValueOnce(mockWeatherData).mockResolvedValueOnce(secondWeather);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));

    await act(() => result.current.selectCity(secondCity));

    expect(result.current).toMatchObject({
      status: 'success',
      selectedCity: secondCity,
      cities: [firstCity, secondCity],
      data: secondWeather,
    });
  });

  it('clears old weather during explicit selection and retries the selected city', async () => {
    searchMock.mockResolvedValue([firstCity, secondCity]);
    weatherMock.mockResolvedValueOnce(mockWeatherData);
    const pendingWeather = deferred<WeatherData>();
    weatherMock.mockReturnValueOnce(pendingWeather.promise);
    weatherMock.mockResolvedValueOnce(secondWeather);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    let pending!: Promise<void>;

    act(() => {
      pending = result.current.selectCity(secondCity);
    });
    expect(result.current).toMatchObject({ status: 'loading', data: null, error: null });
    await act(async () => {
      pendingWeather.reject(new WeatherServiceError('api'));
      await pending;
    });
    expect(result.current.status).toBe('error');
    await act(() => result.current.retry());

    expect(weatherMock).toHaveBeenNthCalledWith(3, secondCity);
    expect(result.current).toMatchObject({
      status: 'success',
      data: secondWeather,
      cities: [firstCity, secondCity],
    });
  });

  it('keeps the city but returns empty when there are no usable weather values', async () => {
    searchMock.mockResolvedValue([firstCity]);
    const emptyWeather: WeatherData = {
      city: firstCity,
      timezone: mockWeatherData.timezone,
      current: { referenceTime: '2026-10-29T10:00' },
      forecast: [{ date: '2026-10-29' }],
    };
    weatherMock.mockResolvedValue(emptyWeather);
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('São Paulo'));

    expect(result.current).toMatchObject({ status: 'empty', data: emptyWeather, error: null });
  });

  it('accepts partial data and zero-valued temperatures', async () => {
    weatherMock.mockResolvedValue({
      ...mockWeatherData,
      current: { temperatureC: 0 },
      forecast: [],
    });
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.selectCity(firstCity));

    expect(result.current.status).toBe('success');
    expect(result.current.data?.current?.temperatureC).toBe(0);
  });

  it('uses a safe fallback message for unexpected failures', async () => {
    searchMock.mockRejectedValue(new Error('private upstream details'));
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('São Paulo'));

    expect(result.current.error).toBe('Não foi possível buscar cidades. Tente novamente.');
  });

  it('ignores a late city search without automatically loading its weather', async () => {
    const staleCities = deferred<City[]>();
    searchMock.mockReturnValueOnce(staleCities.promise);
    searchMock.mockResolvedValueOnce([secondCity]);
    weatherMock.mockResolvedValue(secondWeather);
    const { result } = renderHook(() => useWeather());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.search('São Paulo');
    });
    await act(() => result.current.search('Recife'));

    await act(async () => {
      staleCities.resolve([firstCity]);
      await pending;
    });

    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(secondCity);
    expect(result.current).toMatchObject({
      status: 'success',
      query: 'Recife',
      data: secondWeather,
    });
  });

  it.each([
    'resolve',
    'reject',
  ] as const)('ignores a late weather %s after another selection', async (outcome) => {
    const staleWeather = deferred<WeatherData>();
    weatherMock.mockReturnValueOnce(staleWeather.promise);
    weatherMock.mockResolvedValueOnce(secondWeather);
    const { result } = renderHook(() => useWeather());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.selectCity(firstCity);
    });
    await act(() => result.current.selectCity(secondCity));

    await act(async () => {
      if (outcome === 'resolve') staleWeather.resolve(mockWeatherData);
      else staleWeather.reject(new WeatherServiceError('network'));
      await pending;
    });

    expect(result.current).toMatchObject({ status: 'success', data: secondWeather, error: null });
  });

  it('invalidates an in-flight search when a blank search replaces it', async () => {
    const staleCities = deferred<City[]>();
    searchMock.mockReturnValue(staleCities.promise);
    const { result } = renderHook(() => useWeather());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.search('São Paulo');
    });
    await act(() => result.current.search('  '));

    await act(async () => {
      staleCities.resolve([firstCity]);
      await pending;
    });

    expect(result.current).toMatchObject({ status: 'empty', query: '', data: null });
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('does not start weather loading after a pending search is unmounted', async () => {
    const cities = deferred<City[]>();
    searchMock.mockReturnValue(cities.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.search('São Paulo');
    });
    unmount();

    await act(async () => {
      cities.resolve([firstCity]);
      await pending;
    });

    expect(weatherMock).not.toHaveBeenCalled();
  });
});
