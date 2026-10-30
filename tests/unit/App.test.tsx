import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);

describe('App', () => {
  beforeEach(() => {
    searchMock.mockReset();
    weatherMock.mockReset();
    searchMock.mockResolvedValue([mockWeatherData.city]);
    weatherMock.mockResolvedValue(mockWeatherData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders hook data and changes temperature units without new service calls', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Clima Agora' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Aguardando busca');
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();

    await user.type(screen.getByRole('searchbox'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('heading', { name: 'Sao Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Clima Agora' })).toBeInTheDocument();
    expect(screen.getByText('22 °C')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);

    await user.click(screen.getByRole('button', { name: '°F Fahrenheit' }));

    expect(screen.getByText('72 °F')).toBeInTheDocument();
    expect(screen.getAllByText('63 °F')).toHaveLength(2);
    expect(screen.getByText('77 °F')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '°C Celsius' }));

    expect(screen.getByText('22 °C')).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(mockWeatherData.city);
  });

  it('shows the empty state when geocoding returns no cities', async () => {
    searchMock.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'Recife');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeInTheDocument();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('shows loading and blocks a new search without losing focus until the weather request finishes', async () => {
    const user = userEvent.setup();
    let resolveWeather!: (data: WeatherData) => void;
    weatherMock.mockReturnValue(
      new Promise<WeatherData>((resolve) => {
        resolveWeather = resolve;
      }),
    );
    render(<App />);
    const input = screen.getByRole('searchbox');

    await user.type(input, 'São Paulo{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Buscar' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByText('22 °C')).not.toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(searchMock).toHaveBeenCalledOnce();

    await act(async () => {
      resolveWeather(mockWeatherData);
    });

    expect(await screen.findByText('22 °C')).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input).not.toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Buscar' })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
  });

  it('moves focus to the results region when retrying so it is not lost to the body', async () => {
    const user = userEvent.setup();
    weatherMock.mockRejectedValueOnce(new WeatherServiceError('api'));
    weatherMock.mockReturnValueOnce(new Promise(() => {}));
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    const retry = await screen.findByRole('button', { name: 'Tentar novamente' });

    retry.focus();
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Condições meteorológicas' })).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  it.each([
    ['search', 'Não foi possível buscar cidades. Tente novamente.'],
    ['weather', 'Não foi possível carregar o clima. Tente novamente.'],
  ] as const)('retries a failed %s operation through ErrorState', async (operation, message) => {
    const user = userEvent.setup();
    const failure = new WeatherServiceError('network', 'Falha de rede.');
    if (operation === 'search') searchMock.mockRejectedValueOnce(failure);
    else weatherMock.mockRejectedValueOnce(failure);
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('22 °C')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledTimes(operation === 'search' ? 2 : 1);
    expect(weatherMock).toHaveBeenCalledTimes(operation === 'weather' ? 2 : 1);
  });

  it('distinguishes a city without weather coverage from a search without results', async () => {
    const user = userEvent.setup();
    weatherMock.mockResolvedValue({ ...mockWeatherData, current: undefined, forecast: [] });
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(
      await screen.findByRole('heading', { name: 'Previsão não disponível para esta cidade' }),
    ).toBeInTheDocument();
    expect(screen.getByText(mockWeatherData.city.name)).toBeInTheDocument();
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();
  });

  it('never converts or invents absent temperatures in either unit', async () => {
    const user = userEvent.setup();
    weatherMock.mockResolvedValue({
      ...mockWeatherData,
      current: { weatherCode: 2 },
      forecast: [{ date: '2026-10-29' }, { date: '2026-10-30', minC: 0 }],
    });
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('heading', { name: 'Sao Paulo' });
    await user.click(screen.getByRole('button', { name: '°F Fahrenheit' }));

    expect(screen.getAllByText('Não disponível').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('32 °F')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(document.body).not.toHaveTextContent(/NaN|undefined|null/);
    expect(screen.getAllByRole('status').map((status) => status.textContent)).toEqual([
      'Alguns dados não estão disponíveis',
      'Alguns dados não estão disponíveis',
    ]);
  });

  it('does not present the previous city as current while another search is pending or fails', async () => {
    const user = userEvent.setup();
    let rejectSearch!: (reason: unknown) => void;
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('22 °C')).toBeInTheDocument();

    searchMock.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectSearch = reject;
      }),
    );
    const input = screen.getByRole('searchbox');
    await user.clear(input);
    await user.type(input, 'Recife');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(screen.queryByText('22 °C')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sao Paulo' })).not.toBeInTheDocument();

    await act(async () => {
      rejectSearch(new WeatherServiceError('api'));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível buscar cidades. Tente novamente.',
    );
    expect(screen.queryByText('22 °C')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sao Paulo' })).not.toBeInTheDocument();
  });

  it('starts in Celsius after a new session and does not use browser storage', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const { unmount } = render(<App />);

    await user.click(screen.getByRole('button', { name: '°F Fahrenheit' }));
    expect(screen.getByRole('button', { name: '°F Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    unmount();
    render(<App />);

    expect(screen.getByRole('button', { name: '°C Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '°F Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Aguardando busca');
    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
  });
});
