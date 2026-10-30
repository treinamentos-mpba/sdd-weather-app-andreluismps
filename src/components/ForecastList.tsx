import { useId } from 'react';
import { formatTemperature } from '../lib/temperature';
import { getWeatherPresentation } from '../lib/weatherCodes';
import type { City, ForecastDay, Unit } from '../types/weather';

interface ForecastListProps {
  city: City;
  forecast: ForecastDay[];
  unit: Unit;
}

function formatForecastDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    weekday: 'short',
  }).format(new Date(`${date}T12:00:00Z`));
}

function displayTemperature(value: number | undefined, unit: Unit): string {
  return value === undefined ? 'Não disponível' : formatTemperature(value, unit);
}

export default function ForecastList({ city, forecast, unit }: ForecastListProps) {
  const headingId = useId();
  const hasMissingData = forecast.some(
    (day) => day.weatherCode === undefined || day.minC === undefined || day.maxC === undefined,
  );

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-white/10 bg-white/5 p-5 text-white shadow-glass backdrop-blur-md sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium uppercase text-white/60">Próximos dias</p>
          <h2 id={headingId} className="mt-1 text-xl font-semibold">
            Previsão em {city.name}
          </h2>
        </div>
        <p className="text-sm text-white/60">5 dias</p>
      </div>

      {forecast.length > 0 ? (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {forecast.map((day) => {
              const presentation = getWeatherPresentation(day.weatherCode);

              return (
                <li
                  key={day.date}
                  className="min-w-0 rounded-lg border border-white/10 bg-night-800/70 p-3 sm:p-4"
                >
                  <time dateTime={day.date} className="text-sm font-medium capitalize">
                    {formatForecastDate(day.date)}
                  </time>
                  <span aria-hidden="true" className="mt-4 block text-3xl">
                    {presentation.icon}
                  </span>
                  <p className="mt-2 min-h-10 text-sm text-white/70">{presentation.label}</p>
                  <dl className="mt-3 grid grid-cols-1 gap-2 border-t border-white/10 pt-3 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="text-white/70">Mín.</dt>
                      <dd className="mt-1 font-medium tabular-nums">
                        {displayTemperature(day.minC, unit)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/70">Máx.</dt>
                      <dd className="mt-1 font-medium tabular-nums">
                        {displayTemperature(day.maxC, unit)}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
          {hasMissingData && (
            <p role="status" className="mt-4 text-sm text-sun">
              Alguns dados não estão disponíveis
            </p>
          )}
        </>
      ) : (
        <p role="status" className="text-sm text-white/65">
          Previsão não disponível para esta cidade.
        </p>
      )}
    </section>
  );
}
