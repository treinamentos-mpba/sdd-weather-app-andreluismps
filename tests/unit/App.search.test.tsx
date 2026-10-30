import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { getWeather, searchCities } from '../../src/services/weatherService';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);
const BLANK_MESSAGE = 'Informe o nome de uma cidade para iniciar a busca';

describe('App search edge cases', () => {
  beforeEach(() => {
    searchMock.mockReset();
    weatherMock.mockReset();
    searchMock.mockResolvedValue([mockWeatherData.city]);
    weatherMock.mockImplementation(async (city) => ({ ...mockWeatherData, city }));
  });

  it.each([
    '',
    '   ',
  ])('does not start a search for the blank input %j and then accepts a real one', async (blank) => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('searchbox');

    if (blank) await user.type(input, blank);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByRole('search')).toHaveTextContent(BLANK_MESSAGE);
    expect(screen.getByText('Aguardando busca')).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, 'São Paulo{Enter}');

    expect(await screen.findByRole('heading', { name: 'Sao Paulo' })).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(screen.getByRole('search')).not.toHaveTextContent(BLANK_MESSAGE);
  });

  it('keeps the previous result when a blank search is blocked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await screen.findByText('22 °C');

    await user.clear(screen.getByRole('searchbox'));
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByRole('search')).toHaveTextContent(BLANK_MESSAGE);
    expect(screen.getByText('22 °C')).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledOnce();
  });

  it.each([
    'São Paulo',
    "L'Haÿ-les-Roses",
    'Aix-en-Provence',
    'Zürich',
  ])('searches "%s" exactly as typed and shows the matching city', async (name) => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([{ ...mockWeatherData.city, id: 9, name }]);
    render(<App />);

    await user.type(screen.getByRole('searchbox'), `  ${name}  `);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('heading', { name })).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledExactlyOnceWith(name);
    expect(screen.getByRole('region', { name: `Previsão em ${name}` })).toBeInTheDocument();
  });

  it('renders typed text and returned names as plain text, never as HTML', async () => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([
      {
        ...mockWeatherData.city,
        id: 9,
        name: '<b>Evil</b>',
        admin1: '<img src=x onerror=alert(1)>',
      },
    ]);
    const { container } = render(<App />);

    await user.click(screen.getByRole('searchbox'));
    await user.paste('<script>alert(1)</script>');
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: '<b>Evil</b>' })).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledExactlyOnceWith('<script>alert(1)</script>');
    expect(screen.getByRole('searchbox')).toHaveValue('<script>alert(1)</script>');
    expect(container.querySelector('b, img, script')).toBeNull();
    expect(container).toHaveTextContent('<img src=x onerror=alert(1)>');
  });

  it('keeps the field editable and filled after a search without results, then finds the corrected name', async () => {
    const user = userEvent.setup();
    searchMock.mockResolvedValueOnce([]);
    render(<App />);
    const input = screen.getByRole('searchbox');

    await user.type(input, 'Sao Paol{Enter}');

    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Confira o nome e tente outra busca.')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Cidades encontradas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).toHaveValue('Sao Paol');
    expect(input).toBeEnabled();
    expect(input).not.toHaveAttribute('readonly');
    expect(input).toHaveFocus();
    expect(weatherMock).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, 'São Paulo{Enter}');

    expect(await screen.findByRole('heading', { name: 'Sao Paulo' })).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledTimes(2);
    expect(searchMock).toHaveBeenLastCalledWith('São Paulo');
  });
});
