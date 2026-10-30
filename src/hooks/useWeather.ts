import { useEffect, useRef, useState } from 'react';
import { getWeather, searchCities } from '../services/weatherService';
import type { City, RequestState, WeatherData } from '../types/weather';

interface WeatherState {
  status: RequestState<WeatherData>['status'];
  data: WeatherData | null;
  cities: City[];
  selectedCity: City | null;
  error: string | null;
  query: string;
}

interface UseWeatherResult extends WeatherState {
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

type Operation = { type: 'search'; name: string } | { type: 'weather'; city: City };

const SEARCH_ERROR_MESSAGE = 'Não foi possível buscar cidades. Tente novamente.';
const WEATHER_ERROR_MESSAGE = 'Não foi possível carregar o clima. Tente novamente.';

function hasWeatherData(data: WeatherData): boolean {
  const currentValues = data.current ? Object.values(data.current) : [];
  return (
    currentValues.some((value) => typeof value === 'number' && Number.isFinite(value)) ||
    data.forecast.some((day) =>
      [day.weatherCode, day.minC, day.maxC].some(
        (value) => typeof value === 'number' && Number.isFinite(value),
      ),
    )
  );
}

export default function useWeather(): UseWeatherResult {
  const [state, setState] = useState<WeatherState>({
    status: 'idle',
    data: null,
    cities: [],
    selectedCity: null,
    error: null,
    query: '',
  });
  const requestId = useRef(0);
  const lastOperation = useRef<Operation | null>(null);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  async function loadWeather(city: City, operationId: number): Promise<void> {
    lastOperation.current = { type: 'weather', city };
    try {
      const data = await getWeather(city);
      if (operationId !== requestId.current) return;
      setState((previous) => ({
        ...previous,
        status: hasWeatherData(data) ? 'success' : 'empty',
        data,
        error: null,
      }));
    } catch {
      if (operationId !== requestId.current) return;
      setState((previous) => ({
        ...previous,
        status: 'error',
        data: null,
        error: WEATHER_ERROR_MESSAGE,
      }));
    }
  }

  async function search(name: string): Promise<void> {
    const query = name.trim();
    const operationId = ++requestId.current;
    lastOperation.current = { type: 'search', name: query };
    setState({
      status: query ? 'loading' : 'empty',
      query,
      cities: [],
      selectedCity: null,
      data: null,
      error: null,
    });
    if (!query) return;

    try {
      const cities = await searchCities(query);
      if (operationId !== requestId.current) return;
      if (cities.length === 0) {
        setState({
          status: 'empty',
          query,
          cities: [],
          selectedCity: null,
          data: null,
          error: null,
        });
        return;
      }
      setState({
        status: 'loading',
        query,
        cities,
        selectedCity: cities[0],
        data: null,
        error: null,
      });
      await loadWeather(cities[0], operationId);
    } catch {
      if (operationId !== requestId.current) return;
      setState({
        status: 'error',
        query,
        cities: [],
        selectedCity: null,
        data: null,
        error: SEARCH_ERROR_MESSAGE,
      });
    }
  }

  async function selectCity(city: City): Promise<void> {
    const operationId = ++requestId.current;
    setState((previous) => ({
      ...previous,
      status: 'loading',
      selectedCity: city,
      data: null,
      error: null,
    }));
    await loadWeather(city, operationId);
  }

  async function retry(): Promise<void> {
    const operation = lastOperation.current;
    if (operation?.type === 'search') await search(operation.name);
    else if (operation?.type === 'weather') await selectCity(operation.city);
  }

  return { ...state, search, selectCity, retry };
}
