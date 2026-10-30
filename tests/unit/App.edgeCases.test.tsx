import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);
const first: City = mockWeatherData.city;
const homonym: City = { ...first, id: 2, latitude: 10.5, longitude: 20.25 };
const recife: City = {
  id: 3,
  name: 'Recife',
  country: 'Brazil',
  latitude: -8.05,
  longitude: -34.88,
};

async function submit(user: ReturnType<typeof userEvent.setup>, query: string) {
  await user.type(screen.getByRole('searchbox'), query);
  await user.click(screen.getByRole('button', { name: 'Buscar' }));
}

describe('App edge cases', () => {
  beforeEach(() => {
    searchMock.mockReset();
    weatherMock.mockReset();
    weatherMock.mockImplementation(async (city) => ({ ...mockWeatherData, city }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lists up to five results, disambiguates homonyms and loads the chosen city', async () => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([first, homonym, recife]);
    render(<App />);

    await submit(user, 'Sao');

    const group = await screen.findByRole('group', { name: 'Cidades encontradas' });
    expect(group.querySelectorAll('button')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'Sao Paulo, Sao Paulo, Brazil (-23,55, -46,63)' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Sao Paulo, Sao Paulo, Brazil (10,50, 20,25)' }),
    ).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Recife, Brazil' }));

    expect(await screen.findByRole('heading', { name: 'Recife' })).toBeInTheDocument();
    expect(weatherMock).toHaveBeenLastCalledWith(recife);
    expect(screen.getByRole('button', { name: 'Recife, Brazil' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(searchMock).toHaveBeenCalledOnce();
  });

  it('hides the previous city weather while another result is loading', async () => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([first, recife]);
    render(<App />);
    await submit(user, 'Sao');
    expect(await screen.findByText('22 °C')).toBeInTheDocument();
    weatherMock.mockReturnValueOnce(new Promise(() => {}));

    await user.click(screen.getByRole('button', { name: 'Recife, Brazil' }));

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(screen.queryByText('22 °C')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recife, Brazil' })).toBeDisabled();
  });

  it.each([
    ['2026-10-29T15:00:00Z', false],
    ['2026-10-29T15:00:01Z', true],
  ])('shows the stale warning only after two hours (%s)', async (now, isStale) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(now));
    const user = userEvent.setup();
    searchMock.mockResolvedValue([first]);
    render(<App />);

    await submit(user, 'Sao Paulo');
    await screen.findByText('22 °C');

    expect(screen.getByText('29/10/2026 às 10:00')).toBeInTheDocument();
    expect(screen.queryByText('Dados desatualizados') !== null).toBe(isStale);
  });

  it('says freshness is unknown instead of stale when the source gives no time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    const user = userEvent.setup();
    searchMock.mockResolvedValue([first]);
    weatherMock.mockResolvedValue({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, referenceTime: undefined },
    });
    render(<App />);

    await submit(user, 'Sao Paulo');

    expect(await screen.findByText('Atualidade não informada')).toBeInTheDocument();
    expect(screen.queryByText('Dados desatualizados')).not.toBeInTheDocument();
  });

  it('converts negative, zero and fractional values correctly from Celsius to Fahrenheit and back', async () => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([first]);
    const values = [0, -10, 20, 1.4, -0.5];
    weatherMock.mockResolvedValue({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, temperatureC: 1.4 },
      forecast: mockWeatherData.forecast.map((day, index) => ({
        ...day,
        minC: values[index],
        maxC: values[index],
      })),
    });
    render(<App />);
    await submit(user, 'Sao Paulo');
    const forecast = await screen.findByRole('region', { name: 'Previsão em Sao Paulo' });
    const current = screen.getByRole('region', { name: 'Sao Paulo' });
    const shown = () =>
      within(forecast)
        .getAllByRole('listitem')
        .map((day) =>
          within(day)
            .getAllByRole('definition')
            .map((value) => value.textContent),
        );

    expect(current).toHaveTextContent('1 °C');
    expect(shown()).toEqual([
      ['0 °C', '0 °C'],
      ['-10 °C', '-10 °C'],
      ['20 °C', '20 °C'],
      ['1 °C', '1 °C'],
      ['-1 °C', '-1 °C'],
    ]);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(current).toHaveTextContent('35 °F');
    expect(shown()).toEqual([
      ['32 °F', '32 °F'],
      ['14 °F', '14 °F'],
      ['68 °F', '68 °F'],
      ['35 °F', '35 °F'],
      ['31 °F', '31 °F'],
    ]);

    await user.click(screen.getByRole('button', { name: 'Celsius' }));
    expect(current).toHaveTextContent('1 °C');
    expect(shown()[3]).toEqual(['1 °C', '1 °C']);
    expect(weatherMock).toHaveBeenCalledOnce();
  });

  it('keeps offering retry after consecutive failures until the request succeeds', async () => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([first]);
    const failure = new WeatherServiceError('timeout');
    weatherMock.mockRejectedValueOnce(failure).mockRejectedValueOnce(failure);
    render(<App />);
    await submit(user, 'Sao Paulo');

    for (const attempt of [1, 2]) {
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Não foi possível carregar o clima. Tente novamente.',
      );
      expect(weatherMock).toHaveBeenCalledTimes(attempt);
      await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    }

    expect(await screen.findByText('22 °C')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(weatherMock).toHaveBeenCalledTimes(3);
    expect(searchMock).toHaveBeenCalledOnce();
  });

  it('announces the partial forecast notice for a missing day', async () => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([first]);
    weatherMock.mockResolvedValue({
      ...mockWeatherData,
      forecast: mockWeatherData.forecast.map((day, index) =>
        index === 1 ? { date: day.date } : day,
      ),
    });
    render(<App />);

    await submit(user, 'Sao Paulo');

    const forecast = await screen.findByRole('region', { name: 'Previsão em Sao Paulo' });
    expect(forecast).toHaveTextContent('Alguns dados não estão disponíveis');
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it.each([
    ['search', 'timeout', 'Não foi possível buscar cidades. Tente novamente.'],
    ['search', 'network', 'Não foi possível buscar cidades. Tente novamente.'],
    ['weather', 'api', 'Não foi possível carregar o clima. Tente novamente.'],
    ['weather', 'timeout', 'Não foi possível carregar o clima. Tente novamente.'],
  ] as const)('shows the spec message for a %s %s failure, never the raw service text', async (operation, kind, message) => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([first]);
    const failure = new WeatherServiceError(kind, 'texto interno do serviço');
    if (operation === 'search') searchMock.mockRejectedValue(failure);
    else weatherMock.mockRejectedValue(failure);
    render(<App />);

    await submit(user, 'Sao Paulo');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(message);
    expect(alert).not.toHaveTextContent('texto interno');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });
});
