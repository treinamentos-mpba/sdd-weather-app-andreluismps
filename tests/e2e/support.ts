import { expect, type Page, type Route } from '@playwright/test';

export const NOW = new Date('2026-10-29T15:00:00Z');

export const city = {
  id: 3448439,
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.5475,
  longitude: -46.63611,
};
export const homonym = { ...city, id: 2, latitude: 10.5, longitude: 20.25 };

export const forecast = {
  timezone: 'America/Sao_Paulo',
  current: {
    time: '2026-10-29T10:00',
    temperature_2m: 0,
    weather_code: 2,
    relative_humidity_2m: 68,
    wind_speed_10m: 12.3,
    precipitation: 0.1,
    surface_pressure: 1015.2,
  },
  daily: {
    time: ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
    weather_code: [2, 3, 61, 1, 0],
    temperature_2m_min: [1.4, 16, 18, 17, 18],
    temperature_2m_max: [20, 24, 23, 26, 27],
  },
};

export type Reply = Parameters<Route['fulfill']>[0] | 'hang';
export type Replier = (url: URL, attempt: number) => Reply;

export interface Api {
  geocoding: URL[];
  forecast: URL[];
}

/** Relógio pausado em NOW: Date é fixo e timers só disparam com fastForward. */
export async function freezeClock(page: Page) {
  await page.clock.install({ time: new Date(NOW.getTime() - 60_000) });
  await page.clock.pauseAt(NOW);
}

/** Registra as respostas da Open-Meteo e impede qualquer saída para a rede real. */
export async function mockApi(
  page: Page,
  replies: { geocoding?: Replier; forecast?: Replier } = {},
): Promise<Api> {
  const api: Api = { geocoding: [], forecast: [] };

  // Fontes externas não fazem parte do comportamento testado e atrasariam o `load`.
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );

  const respond = (calls: URL[], replier: Replier) => async (route: Route) => {
    const url = new URL(route.request().url());
    calls.push(url);
    const reply = replier(url, calls.length);
    if (reply === 'hang') return;
    await route.fulfill(reply);
  };

  await page.route(
    'https://geocoding-api.open-meteo.com/**',
    respond(api.geocoding, replies.geocoding ?? (() => ({ json: { results: [city] } }))),
  );
  await page.route(
    'https://api.open-meteo.com/**',
    respond(api.forecast, replies.forecast ?? (() => ({ json: forecast }))),
  );
  return api;
}

export const searchField = (page: Page) => page.getByRole('searchbox', { name: 'Cidade' });
export const searchButton = (page: Page) =>
  page.getByRole('button', { name: 'Buscar', exact: true });

export async function searchFor(page: Page, name: string) {
  await searchField(page).fill(name);
  await searchButton(page).click();
}

export const cityRegion = (page: Page, name: string = city.name) =>
  page.getByRole('region', { name, exact: true });
export const currentRegion = (page: Page) => cityRegion(page);
export const forecastRegion = (page: Page, name: string = city.name) =>
  page.getByRole('region', { name: `Previsão em ${name}`, exact: true });
export const unitButton = (page: Page, unit: 'Celsius' | 'Fahrenheit') =>
  page
    .getByRole('group', { name: 'Unidade de temperatura' })
    .getByRole('button', { name: `${unit === 'Celsius' ? '°C' : '°F'} ${unit}`, exact: true });

export const BLANK_SEARCH_MESSAGE = 'Informe o nome de uma cidade para iniciar a busca';

/** Garante que nenhum texto de fallback do código vaze para a tela. */
export async function expectNoBrokenText(page: Page) {
  await expect(page.locator('main')).not.toContainText(/NaN|undefined|null|Infinity/);
}
