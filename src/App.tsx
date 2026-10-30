import { useState } from 'react';
import CityList from './components/CityList';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import { isStaleReference } from './lib/freshness';
import type { Unit } from './types/weather';

export default function App() {
  const { status, data, cities, selectedCity, error, search, selectCity, retry } = useWeather();
  const [unit, setUnit] = useState<Unit>('celsius');

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
          <SearchBar onSearch={search} disabled={status === 'loading'} />
          <UnitToggle unit={unit} onChange={setUnit} />
        </header>

        <CityList
          cities={cities}
          selectedId={selectedCity?.id}
          disabled={status === 'loading'}
          onSelect={selectCity}
        />

        <section aria-label="Condições meteorológicas" className="grid gap-5">
          {status === 'idle' && (
            <div className="border-y border-white/10 py-10 sm:py-14">
              <p className="text-sm font-medium uppercase text-white/55">Clima local</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Qual é o tempo?</h2>
              <p role="status" className="mt-3 text-sm text-white/65">
                Aguardando busca
              </p>
            </div>
          )}

          {status === 'loading' && <LoadingState />}

          {status === 'empty' && (
            <EmptyState
              title={
                data ? 'Previsão não disponível para esta cidade' : 'Nenhuma cidade encontrada'
              }
              hint={data ? data.city.name : 'Confira o nome e tente outra busca.'}
            />
          )}

          {status === 'error' && (
            <ErrorState
              message={error ?? 'Não foi possível carregar o clima. Tente novamente.'}
              onRetry={retry}
            />
          )}

          {status === 'success' && data && (
            <>
              {data.current && (
                <CurrentWeather
                  city={data.city}
                  current={data.current}
                  unit={unit}
                  isStale={isStaleReference(data.current.referenceTime, data.timezone)}
                />
              )}
              <ForecastList city={data.city} forecast={data.forecast} unit={unit} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
