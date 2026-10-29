import type { City, RequestErrorKind } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const SEARCH_ERROR_MESSAGE = 'Não foi possível buscar cidades. Tente novamente.';
const REQUEST_TIMEOUT_MS = 10_000;

export class WeatherServiceError extends Error {
  readonly kind: RequestErrorKind;

  constructor(kind: RequestErrorKind) {
    super(SEARCH_ERROR_MESSAGE);
    this.name = 'WeatherServiceError';
    this.kind = kind;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapCity(value: unknown): City {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    !Number.isFinite(value.id) ||
    typeof value.name !== 'string' ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.longitude) ||
    (value.admin1 !== undefined && typeof value.admin1 !== 'string') ||
    (value.country !== undefined && typeof value.country !== 'string')
  ) {
    throw new WeatherServiceError('invalid-response');
  }

  return {
    id: value.id,
    name: value.name,
    admin1: value.admin1,
    country: value.country,
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

async function fetchCities(url: string, signal: AbortSignal): Promise<City[]> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new WeatherServiceError('api');

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WeatherServiceError('invalid-response');
  }

  if (!isRecord(payload)) throw new WeatherServiceError('invalid-response');
  if (payload.error === true) throw new WeatherServiceError('api');
  if (payload.results === undefined) return [];
  if (!Array.isArray(payload.results)) throw new WeatherServiceError('invalid-response');

  return payload.results.slice(0, 5).map(mapCity);
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new WeatherServiceError('timeout'));
      controller.abort();
    }, REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([fetchCities(url, controller.signal), timeout]);
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    throw new WeatherServiceError('network');
  } finally {
    clearTimeout(timeoutId);
  }
}
