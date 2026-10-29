export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperatureC?: number;
  weatherCode?: number;
  relativeHumidityPercent?: number;
  windSpeedKmh?: number;
  precipitationMm?: number;
  surfacePressureHpa?: number;
  referenceTime?: string;
}

export interface WeatherCodePresentation {
  label: string;
  icon: string;
}

export interface ForecastDay {
  date: string;
  weatherCode?: number;
  minC?: number;
  maxC?: number;
}

export interface WeatherData {
  city: City;
  timezone: string;
  current?: CurrentWeather;
  forecast: ForecastDay[];
}

export type RequestErrorKind = 'network' | 'api' | 'timeout' | 'invalid-response';

export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty'; message: string }
  | { status: 'error'; kind: RequestErrorKind; message: string };
