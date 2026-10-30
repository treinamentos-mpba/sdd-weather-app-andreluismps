import { expect, type Page, type Route, test } from '@playwright/test';

const NOW = new Date('2026-10-29T15:00:00Z');

const city = {
  id: 3448439,
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.5475,
  longitude: -46.63611,
};
const homonym = { ...city, id: 2, latitude: 10.5, longitude: 20.25 };

const forecast = {
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

type Reply = Parameters<Route['fulfill']>[0] | 'hang';
type Replier = (url: URL, attempt: number) => Reply;

interface Api {
  geocoding: URL[];
  forecast: URL[];
}

/** Relógio pausado em NOW: Date é fixo e timers só disparam com fastForward. */
async function freezeClock(page: Page) {
  await page.clock.install({ time: new Date(NOW.getTime() - 60_000) });
  await page.clock.pauseAt(NOW);
}

/** Registra as respostas da Open-Meteo e impede qualquer saída para a rede real. */
async function mockApi(
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

async function searchFor(page: Page, name: string) {
  await page.getByRole('searchbox', { name: 'Cidade' }).fill(name);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
}

const currentRegion = (page: Page) => page.getByRole('region', { name: city.name, exact: true });
const forecastRegion = (page: Page) =>
  page.getByRole('region', { name: `Previsão em ${city.name}`, exact: true });
const unitButton = (page: Page, unit: 'Celsius' | 'Fahrenheit') =>
  page
    .getByRole('group', { name: 'Unidade de temperatura' })
    .getByRole('button', { name: unit, exact: true });

test.describe('Weather app', () => {
  test.beforeEach(async ({ page }) => {
    await freezeClock(page);
  });

  test('searches a city, shows current weather and converts the forecast to Fahrenheit', async ({
    page,
  }) => {
    const api = await mockApi(page);
    await page.goto('/');

    await searchFor(page, 'São Paulo');

    const current = currentRegion(page);
    await expect(current).toContainText('São Paulo, Brasil');
    await expect(current).toContainText('Parcialmente nublado');
    await expect(current.getByText('0 °C', { exact: true })).toBeVisible();
    await expect(forecastRegion(page).getByRole('listitem')).toHaveCount(5);
    await expect(forecastRegion(page).getByText('1 °C', { exact: true })).toBeVisible();

    await unitButton(page, 'Fahrenheit').click();

    await expect(unitButton(page, 'Fahrenheit')).toHaveAttribute('aria-pressed', 'true');
    await expect(unitButton(page, 'Celsius')).toHaveAttribute('aria-pressed', 'false');
    await expect(current.getByText('32 °F', { exact: true })).toBeVisible();
    await expect(forecastRegion(page).getByText('35 °F', { exact: true })).toBeVisible();
    await expect(forecastRegion(page).getByText('68 °F', { exact: true })).toBeVisible();

    expect(api.geocoding.map((url) => url.searchParams.get('name'))).toEqual(['São Paulo']);
    expect(api.forecast.map((url) => url.searchParams.get('latitude'))).toEqual([
      String(city.latitude),
    ]);
  });

  test('lets the user pick between homonyms and shows the failure message with retry', async ({
    page,
  }) => {
    let homonymFailures = 0;
    const api = await mockApi(page, {
      geocoding: () => ({ json: { results: [city, homonym] } }),
      forecast: (url) =>
        url.searchParams.get('latitude') === String(homonym.latitude) && homonymFailures++ === 0
          ? { status: 503, json: {} }
          : { json: forecast },
    });
    await page.goto('/');
    await searchFor(page, 'São Paulo');
    await expect(currentRegion(page)).toBeVisible();

    const results = page.getByRole('group', { name: 'Cidades encontradas' });
    await expect(results.getByRole('button')).toHaveCount(2);
    await results.getByRole('button', { name: /\(10,50, 20,25\)$/ }).click();

    await expect(page.getByRole('alert')).toHaveText(
      'Não foi possível carregar o clima. Tente novamente.',
    );
    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(currentRegion(page).getByText('0 °C', { exact: true })).toBeVisible();
    expect(api.geocoding).toHaveLength(1);
    expect(api.forecast.map((url) => url.searchParams.get('latitude'))).toEqual([
      String(city.latitude),
      String(homonym.latitude),
      String(homonym.latitude),
    ]);
  });

  for (const { referenceTime, isStale } of [
    { referenceTime: '2026-10-29T10:00', isStale: false }, // exatamente 2 h (13:00Z)
    { referenceTime: '2026-10-29T09:59', isStale: true },
  ]) {
    test(`${isStale ? 'warns' : 'does not warn'} about stale data for a ${referenceTime} reference`, async ({
      page,
    }) => {
      await mockApi(page, {
        forecast: () => ({
          json: { ...forecast, current: { ...forecast.current, time: referenceTime } },
        }),
      });
      await page.goto('/');

      await searchFor(page, 'São Paulo');

      await expect(currentRegion(page)).toContainText(
        `${referenceTime.slice(8, 10)}/10/2026 às ${referenceTime.slice(11)}`,
      );
      await expect(currentRegion(page).getByText('Dados desatualizados')).toHaveCount(
        isStale ? 1 : 0,
      );
    });
  }

  test('shows the empty state for an unknown city without requesting the forecast', async ({
    page,
  }) => {
    const api = await mockApi(page, { geocoding: () => ({ json: { generationtime_ms: 0.5 } }) });
    await page.goto('/');

    await searchFor(page, 'Xyzzy');

    await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Cidades encontradas' })).toHaveCount(0);
    expect(api.forecast).toHaveLength(0);
  });

  test('recovers from a geocoding failure with the search message', async ({ page }) => {
    const api = await mockApi(page, {
      geocoding: (_url, attempt) =>
        attempt === 1 ? { status: 503, json: {} } : { json: { results: [city] } },
    });
    await page.goto('/');

    await searchFor(page, 'São Paulo');

    await expect(page.getByRole('alert')).toHaveText(
      'Não foi possível buscar cidades. Tente novamente.',
    );
    await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(currentRegion(page)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(api.geocoding).toHaveLength(2);
    expect(api.forecast).toHaveLength(1);
  });

  test('gives up after ten seconds without a forecast and succeeds on retry', async ({ page }) => {
    const api = await mockApi(page, {
      forecast: (_url, attempt) => (attempt === 1 ? 'hang' : { json: forecast }),
    });
    await page.goto('/');
    // Só avança o relógio depois que a requisição pendente existe, senão o timeout nem começou.
    const pendingForecast = page.waitForRequest('https://api.open-meteo.com/**');
    await searchFor(page, 'São Paulo');
    await pendingForecast;
    await expect(page.getByRole('status')).toHaveText('Carregando...');

    await page.clock.fastForward(9_999);
    await expect(page.getByRole('status')).toHaveText('Carregando...');
    await page.clock.fastForward(1);

    await expect(page.getByRole('alert')).toHaveText(
      'Não foi possível carregar o clima. Tente novamente.',
    );
    await expect(page.getByText('Carregando...')).toHaveCount(0);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(currentRegion(page).getByText('0 °C', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(api.forecast).toHaveLength(2);
  });

  test('keeps five dates and flags the section when a middle day is missing', async ({ page }) => {
    await mockApi(page, {
      forecast: () => ({
        json: {
          ...forecast,
          daily: {
            time: ['2026-10-29', '2026-10-31', '2026-11-01', '2026-11-02'],
            weather_code: [2, 61, 1, 0],
            temperature_2m_min: [1.4, 18, 17, 18],
            temperature_2m_max: [20, 23, 26, 27],
          },
        },
      }),
    });
    await page.goto('/');

    await searchFor(page, 'São Paulo');

    const days = forecastRegion(page).getByRole('listitem');
    await expect(days).toHaveCount(5);
    await expect(days.nth(1)).toContainText('Condição não disponível');
    await expect(days.nth(1).getByText('Não disponível', { exact: true })).toHaveCount(2);
    await expect(days.nth(2)).toContainText('18 °C');
    await expect(days.nth(2)).toContainText('23 °C');
    await expect(forecastRegion(page).getByRole('status')).toHaveText(
      'Alguns dados não estão disponíveis',
    );
    await expect(currentRegion(page)).toBeVisible();
  });

  test.describe('narrow viewport', () => {
    test.use({ viewport: { width: 320, height: 568 } });

    test('keeps the search flow usable without horizontal scrolling', async ({ page }) => {
      await mockApi(page);
      await page.goto('/');

      await searchFor(page, 'São Paulo');
      await expect(forecastRegion(page).getByRole('listitem')).toHaveCount(5);
      await unitButton(page, 'Fahrenheit').click();
      await expect(currentRegion(page).getByText('32 °F', { exact: true })).toBeVisible();

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });
  });
});
