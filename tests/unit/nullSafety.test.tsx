import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import ForecastList from '../../src/components/ForecastList';
import { mockWeatherData } from '../../src/mocks/weatherData';
import type {
  City,
  CurrentWeather as CurrentWeatherData,
  ForecastDay,
} from '../../src/types/weather';

// Dados externos podem violar os tipos em runtime: null, NaN, Infinity ou texto.
const asCurrent = (value: Record<string, unknown>) => value as unknown as CurrentWeatherData;
const asForecast = (value: Record<string, unknown>[]) => value as unknown as ForecastDay[];
const BROKEN_TEXT = /NaN|undefined|null|Infinity|Invalid/i;

describe('CurrentWeather with null or invalid values', () => {
  it.each([
    ['celsius', 'null', null],
    ['fahrenheit', 'null', null],
    ['celsius', 'NaN', Number.NaN],
    ['fahrenheit', 'Infinity', Number.POSITIVE_INFINITY],
    ['celsius', 'a string', 'warm'],
  ] as const)('shows every field as unavailable in %s when values are %s', (unit, _label, bad) => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        unit={unit}
        current={asCurrent({
          temperatureC: bad,
          weatherCode: bad,
          relativeHumidityPercent: bad,
          windSpeedKmh: bad,
          precipitationMm: bad,
          surfacePressureHpa: bad,
          referenceTime: null,
        })}
      />,
    );

    expect(document.body).not.toHaveTextContent(BROKEN_TEXT);
    expect(screen.getAllByText('Não disponível')).toHaveLength(5);
    expect(screen.getByText('Condição não disponível')).toBeInTheDocument();
    expect(screen.getByText('Atualidade não informada')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Alguns dados não estão disponíveis');
  });

  it('renders an empty current object without visible placeholders from the code', () => {
    render(<CurrentWeather city={mockWeatherData.city} unit="celsius" current={asCurrent({})} />);

    expect(document.body).not.toHaveTextContent(BROKEN_TEXT);
    expect(screen.getAllByText('Não disponível')).toHaveLength(5);
  });

  it.each([
    ['null', null],
    ['an empty string', ''],
    ['a malformed date', '29/10/2026'],
    ['a non-string', 12345],
  ])('does not show a broken reference time for %s', (_label, referenceTime) => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        unit="celsius"
        current={asCurrent({ temperatureC: 22, referenceTime })}
      />,
    );

    expect(screen.getByText('Atualidade não informada')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(BROKEN_TEXT);
  });

  it('omits region and country that are null without leaving separators behind', () => {
    const city = { ...mockWeatherData.city, admin1: null, country: null } as unknown as City;
    render(<CurrentWeather city={city} unit="celsius" current={{ temperatureC: 22 }} />);

    expect(screen.getByRole('heading', { name: 'Sao Paulo' })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(BROKEN_TEXT);
    expect(document.body).not.toHaveTextContent(/,\s*$/m);
  });

  it('keeps real zero values visible while neighbors are missing', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        unit="fahrenheit"
        current={asCurrent({ temperatureC: 0, windSpeedKmh: 0, precipitationMm: null })}
      />,
    );

    expect(screen.getByText('32 °F')).toBeInTheDocument();
    expect(screen.getByText('0 km/h')).toBeInTheDocument();
    expect(screen.getAllByText('Não disponível')).toHaveLength(3);
  });
});

describe('ForecastList with null or invalid values', () => {
  it.each([
    ['null', null],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a string', 'cold'],
  ])('shows day values as unavailable when they are %s', (_label, bad) => {
    render(
      <ForecastList
        city={mockWeatherData.city}
        unit="fahrenheit"
        forecast={asForecast([
          { date: '2026-10-29', weatherCode: bad, minC: bad, maxC: bad },
          { date: '2026-10-30', weatherCode: 3, minC: 0, maxC: bad },
        ])}
      />,
    );

    expect(document.body).not.toHaveTextContent(BROKEN_TEXT);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getAllByText('Não disponível')).toHaveLength(3);
    expect(screen.getByText('32 °F')).toBeInTheDocument();
    expect(screen.getAllByText('Condição não disponível')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Alguns dados não estão disponíveis');
  });

  it.each([
    ['empty', ''],
    ['malformed', 'not-a-date'],
    ['null', null],
    ['a number', 20261029],
  ])('does not crash on a %s date and shows a safe label', (_label, date) => {
    render(
      <ForecastList
        city={mockWeatherData.city}
        unit="celsius"
        forecast={asForecast([{ date, weatherCode: 2, minC: 1, maxC: 2 }])}
      />,
    );

    expect(screen.getByText('Data indisponível')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(BROKEN_TEXT);
  });
});
