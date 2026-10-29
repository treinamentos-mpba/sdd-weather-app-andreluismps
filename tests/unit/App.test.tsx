import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(screen.getByText('72 °F')).toBeInTheDocument();
    expect(screen.getAllByText('63 °F')).toHaveLength(2);
    expect(screen.getByText('77 °F')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Celsius' }));

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

  it('shows loading and disables search until the weather request finishes', async () => {
    const user = userEvent.setup();
    let resolveWeather!: (data: WeatherData) => void;
    weatherMock.mockReturnValue(
      new Promise<WeatherData>((resolve) => {
        resolveWeather = resolve;
      }),
    );
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(screen.queryByText('22 °C')).not.toBeInTheDocument();

    await act(async () => {
      resolveWeather(mockWeatherData);
    });

    expect(await screen.findByText('22 °C')).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeEnabled();
  });

  it.each([
    'search',
    'weather',
  ] as const)('retries a failed %s operation through ErrorState', async (operation) => {
    const user = userEvent.setup();
    const failure = new WeatherServiceError('network', 'Falha de rede.');
    if (operation === 'search') searchMock.mockRejectedValueOnce(failure);
    else weatherMock.mockRejectedValueOnce(failure);
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
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
});
