import { useId } from 'react';
import { formatMetric, formatReferenceTime, type MetricUnit } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherPresentation } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
  isStale?: boolean;
}

export default function CurrentWeather({
  city,
  current,
  unit,
  isStale = false,
}: CurrentWeatherProps) {
  const headingId = useId();
  const weatherPresentation = getWeatherPresentation(current.weatherCode);
  const temperature =
    current.temperatureC === undefined
      ? 'Não disponível'
      : formatTemperature(current.temperatureC, unit);
  const locationDetails = [city.admin1, city.country].filter(Boolean).join(', ');
  const referenceTimeLabel = formatReferenceTime(current.referenceTime);
  const metrics: Array<{ label: string; value: number | undefined; unit: MetricUnit }> = [
    { label: 'Umidade relativa', value: current.relativeHumidityPercent, unit: '%' },
    { label: 'Vento', value: current.windSpeedKmh, unit: 'km/h' },
    { label: 'Precipitação', value: current.precipitationMm, unit: 'mm' },
    { label: 'Pressão', value: current.surfacePressureHpa, unit: 'hPa' },
  ];
  const hasMissingData =
    current.temperatureC === undefined ||
    current.relativeHumidityPercent === undefined ||
    current.windSpeedKmh === undefined ||
    current.precipitationMm === undefined ||
    current.surfacePressureHpa === undefined;

  return (
    <section
      aria-labelledby={headingId}
      className="w-full min-w-0 break-words rounded-lg border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md text-white sm:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-full">
          <p className="text-sm font-medium uppercase text-white/60">Clima atual</p>
          <h2 id={headingId} className="mt-1 text-xl font-semibold">
            {city.name}
          </h2>
          {locationDetails && <p className="mt-1 text-sm text-white/60">{locationDetails}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-4xl sm:text-5xl">
            {weatherPresentation.icon}
          </span>
          <p className="max-w-40 text-right text-sm font-medium sm:text-base">
            {weatherPresentation.label}
          </p>
        </div>
      </header>

      <div className="mt-6">
        <p className="text-sm text-white/60">Temperatura</p>
        <p
          className={`mt-1 font-semibold tabular-nums ${current.temperatureC === undefined ? 'text-2xl sm:text-3xl' : 'text-5xl sm:text-6xl'}`}
          aria-live="polite"
        >
          {temperature}
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-2 divide-x divide-y divide-white/10 border-y border-white/10 sm:grid-cols-4 sm:divide-y-0">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 px-3 py-3 first:pl-0 sm:py-4">
            <dt className="text-xs text-white/60 sm:text-sm">{metric.label}</dt>
            <dd className="mt-1 font-medium tabular-nums">
              {formatMetric(metric.value, metric.unit)}
            </dd>
          </div>
        ))}
      </dl>

      {hasMissingData && (
        <p role="status" className="mt-4 text-sm text-sun">
          Alguns dados não estão disponíveis
        </p>
      )}

      {isStale && (
        <p role="status" className="mt-2 text-sm text-sun">
          Dados desatualizados
        </p>
      )}

      <p className="mt-4 text-xs text-white/60">
        Referência: <time dateTime={current.referenceTime}>{referenceTimeLabel}</time>
      </p>
    </section>
  );
}
