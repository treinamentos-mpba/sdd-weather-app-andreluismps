import type { City, ForecastDay, RequestErrorKind, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const SEARCH_ERROR_MESSAGE = 'Não foi possível buscar cidades. Tente novamente.';
const FORECAST_ERROR_MESSAGE = 'Não foi possível carregar o clima. Tente novamente.';
const REQUEST_TIMEOUT_MS = 10_000;

export class WeatherServiceError extends Error {
  readonly kind: RequestErrorKind;

  constructor(kind: RequestErrorKind, message = SEARCH_ERROR_MESSAGE) {
    super(message);
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

async function fetchPayload(
  url: string,
  signal: AbortSignal,
  message: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new WeatherServiceError('api', message);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    if (isRecord(error) && (error.name === 'AbortError' || error.name === 'TypeError')) throw error;
    throw new WeatherServiceError('invalid-response', message);
  }

  if (!isRecord(payload)) throw new WeatherServiceError('invalid-response', message);
  if (payload.error === true) throw new WeatherServiceError('api', message);
  return payload;
}

export async function fetchWithTimeout(
  url: string,
  message = SEARCH_ERROR_MESSAGE,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new WeatherServiceError('timeout', 'A requisição demorou demais.'));
      controller.abort();
    }, REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([fetchPayload(url, controller.signal, message), timeout]);
  } catch (error) {
    if (isRecord(error) && error.name === 'AbortError') {
      throw new WeatherServiceError('timeout', 'A requisição demorou demais.');
    }
    if (error instanceof WeatherServiceError) throw error;
    throw new WeatherServiceError('network', 'Falha de rede.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;
  const payload = await fetchWithTimeout(url, SEARCH_ERROR_MESSAGE);
  if (payload.results === undefined) return [];
  if (!Array.isArray(payload.results)) throw new WeatherServiceError('invalid-response');

  return payload.results.slice(0, 5).map(mapCity);
}

function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new WeatherServiceError('invalid-response', FORECAST_ERROR_MESSAGE);
  }
  return value;
}

function forecastDates(timezone: string): string[] {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return Array.from({ length: 5 }, (_value, offset) =>
    new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10),
  );
}

function mapForecast(daily: Record<string, unknown>, timezone: string): ForecastDay[] {
  if (!Array.isArray(daily.time)) {
    throw new WeatherServiceError('invalid-response', FORECAST_ERROR_MESSAGE);
  }
  const indexByDate = new Map<string, number>();
  daily.time.forEach((date: unknown, index: number) => {
    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      indexByDate.has(date)
    ) {
      throw new WeatherServiceError('invalid-response', FORECAST_ERROR_MESSAGE);
    }
    indexByDate.set(date, index);
  });

  const [weatherCodes, minima, maxima] = [
    'weather_code',
    'temperature_2m_min',
    'temperature_2m_max',
  ].map((field) => {
    const values = daily[field];
    if (values === undefined || values === null) return [];
    if (!Array.isArray(values)) {
      throw new WeatherServiceError('invalid-response', FORECAST_ERROR_MESSAGE);
    }
    return values.map(optionalNumber);
  });

  return forecastDates(timezone).map((date) => {
    const index = indexByDate.get(date);
    return {
      date,
      weatherCode: index === undefined ? undefined : weatherCodes[index],
      minC: index === undefined ? undefined : minima[index],
      maxC: index === undefined ? undefined : maxima[index],
    };
  });
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure,weather_code',
    daily: 'weather_code,temperature_2m_min,temperature_2m_max',
    forecast_days: '5',
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  });
  const payload = await fetchWithTimeout(`${FORECAST_URL}?${params}`, FORECAST_ERROR_MESSAGE);
  const { current, daily, timezone } = payload;
  if (!isRecord(current) || !isRecord(daily) || typeof timezone !== 'string' || !timezone) {
    throw new WeatherServiceError('invalid-response', FORECAST_ERROR_MESSAGE);
  }
  if (current.time != null && typeof current.time !== 'string') {
    throw new WeatherServiceError('invalid-response', FORECAST_ERROR_MESSAGE);
  }

  try {
    return {
      city,
      timezone,
      current: {
        temperatureC: optionalNumber(current.temperature_2m),
        weatherCode: optionalNumber(current.weather_code),
        relativeHumidityPercent: optionalNumber(current.relative_humidity_2m),
        windSpeedKmh: optionalNumber(current.wind_speed_10m),
        precipitationMm: current.precipitation === null ? 0 : optionalNumber(current.precipitation),
        surfacePressureHpa: optionalNumber(current.surface_pressure),
        referenceTime: current.time ?? undefined,
      },
      forecast: mapForecast(daily, timezone),
    };
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    throw new WeatherServiceError('invalid-response', FORECAST_ERROR_MESSAGE);
  }
}
