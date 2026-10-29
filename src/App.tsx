import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { formatTemperature } from './lib/temperature';
import { getWeatherPresentation } from './lib/weatherCodes';
import { mockWeatherData } from './mocks/weatherData';
import type { RequestState, Unit, WeatherData } from './types/weather';

function normalizeCityName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
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

export default function App() {
  const [requestState, setRequestState] = useState<RequestState<WeatherData>>({ status: 'idle' });
  const [unit, setUnit] = useState<Unit>('celsius');
  const [lastSearch, setLastSearch] = useState('');

  function handleSearch(cityName: string) {
    setLastSearch(cityName);
    setRequestState({ status: 'loading' });

    void Promise.resolve()
      .then(() => {
        if (normalizeCityName(cityName) !== normalizeCityName(mockWeatherData.city.name)) {
          setRequestState({ status: 'empty', message: 'Nenhuma cidade encontrada' });
          return;
        }

        setRequestState({ status: 'success', data: mockWeatherData });
      })
      .catch(() => {
        setRequestState({
          status: 'error',
          kind: 'api',
          message: 'Não foi possível carregar o clima. Tente novamente.',
        });
      });
  }

  return (
    <div className="min-h-screen break-words bg-[linear-gradient(145deg,#1a2138_0%,#0b1020_42%,#11162a_100%)] text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 sm:py-8">
        <header className="grid min-w-0 gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-3xl text-sun">
              ☀
            </span>
            <h1 className="font-sans text-lg font-semibold">Clima Agora</h1>
          </div>
          <SearchBar onSearch={handleSearch} disabled={requestState.status === 'loading'} />
          <UnitToggle unit={unit} onChange={setUnit} />
        </header>

        <section aria-label="Condições meteorológicas" className="grid gap-5">
          {requestState.status === 'idle' && (
            <div className="border-y border-white/10 py-10 sm:py-14">
              <p className="text-sm font-medium uppercase text-white/55">Clima local</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Qual é o tempo?</h2>
              <p role="status" className="mt-3 text-sm text-white/65">
                Aguardando busca
              </p>
            </div>
          )}

          {requestState.status === 'loading' && <LoadingState />}

          {requestState.status === 'empty' && (
            <EmptyState title={requestState.message} hint="Confira o nome e tente outra busca." />
          )}

          {requestState.status === 'error' && (
            <ErrorState message={requestState.message} onRetry={() => handleSearch(lastSearch)} />
          )}

          {requestState.status === 'success' && (
            <>
              {requestState.data.current && (
                <CurrentWeather
                  city={requestState.data.city}
                  current={requestState.data.current}
                  unit={unit}
                />
              )}

              <section
                aria-labelledby="forecast-heading"
                className="rounded-lg border border-white/10 bg-white/5 p-5 text-white shadow-glass backdrop-blur-md sm:p-6"
              >
                <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium uppercase text-white/60">Próximos dias</p>
                    <h2 id="forecast-heading" className="mt-1 text-xl font-semibold">
                      Previsão em {requestState.data.city.name}
                    </h2>
                  </div>
                  <p className="text-sm text-white/60">5 dias</p>
                </div>

                {requestState.data.forecast.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {requestState.data.forecast.map((day) => {
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
                          <p className="mt-2 min-h-10 text-sm text-white/70">
                            {presentation.label}
                          </p>
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
                ) : (
                  <p role="status" className="text-sm text-white/65">
                    Previsão não disponível para esta cidade.
                  </p>
                )}
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
