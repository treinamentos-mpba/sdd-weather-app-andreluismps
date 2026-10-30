import { expect, test } from '@playwright/test';
import {
  city,
  currentRegion,
  forecast,
  forecastRegion,
  freezeClock,
  homonym,
  mockApi,
  searchFor,
  unitButton,
} from './support';

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

  test('keeps keyboard focus while searching, choosing a city and retrying', async ({ page }) => {
    let homonymFailures = 0;
    await mockApi(page, {
      geocoding: () => ({ json: { results: [city, homonym] } }),
      forecast: (url) =>
        url.searchParams.get('latitude') === String(homonym.latitude) && homonymFailures++ === 0
          ? { status: 503, json: {} }
          : { json: forecast },
    });
    await page.goto('/');
    const input = page.getByRole('searchbox', { name: 'Cidade' });

    await input.fill('São Paulo');
    await input.press('Enter');
    await expect(currentRegion(page)).toBeVisible();
    await expect(input).toBeFocused();

    const homonymButton = page
      .getByRole('group', { name: 'Cidades encontradas' })
      .getByRole('button', { name: /\(10,50, 20,25\)$/ });
    await homonymButton.focus();
    await homonymButton.press('Enter');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(homonymButton).toBeFocused();

    const retry = page.getByRole('button', { name: 'Tentar novamente' });
    await retry.focus();
    await retry.press('Enter');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(currentRegion(page)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Condições meteorológicas' })).toBeFocused();
  });

  test('draws the search field boundary with at least 3:1 contrast', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');

    const ratio = await page.getByRole('searchbox', { name: 'Cidade' }).evaluate((input) => {
      type Color = { r: number; g: number; b: number; a: number };
      const parse = (value: string): Color => {
        const [r, g, b, a = 1] = (value.match(/[\d.]+/g) ?? []).map(Number);
        return { r, g, b, a };
      };
      const over = (top: Color, base: Color): Color => ({
        r: top.r * top.a + base.r * (1 - top.a),
        g: top.g * top.a + base.g * (1 - top.a),
        b: top.b * top.a + base.b * (1 - top.a),
        a: 1,
      });
      const luminance = ({ r, g, b }: Color) => {
        const [lr, lg, lb] = [r, g, b].map((channel) => {
          const value = channel / 255;
          return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
      };
      // Pior caso: ponto mais claro do gradiente de fundo da página.
      const lightestBackground: Color = { r: 0x1a, g: 0x21, b: 0x38, a: 1 };
      const backgroundOf = (element: Element): Color => {
        const layers: Color[] = [];
        for (let node: Element | null = element; node; node = node.parentElement) {
          const color = parse(getComputedStyle(node).backgroundColor);
          if (color.a > 0) layers.push(color);
        }
        return layers.reverse().reduce(over, lightestBackground);
      };
      const surrounding = backgroundOf(input.parentElement as Element);
      const border = over(parse(getComputedStyle(input).borderTopColor), backgroundOf(input));
      const [lighter, darker] = [luminance(border), luminance(surrounding)].sort((a, b) => b - a);
      return (lighter + 0.05) / (darker + 0.05);
    });

    expect(ratio).toBeGreaterThanOrEqual(3);
  });

  test('never shows NaN, undefined or null when the API returns null and absent fields', async ({
    page,
  }) => {
    await mockApi(page, {
      geocoding: () => ({
        json: {
          results: [{ id: 9, name: 'São Paulo', admin1: null, latitude: -23.5, longitude: -46.6 }],
        },
      }),
      forecast: () => ({
        json: {
          timezone: 'America/Sao_Paulo',
          current: {
            time: null,
            temperature_2m: null,
            weather_code: null,
            relative_humidity_2m: 0,
            wind_speed_10m: null,
            precipitation: null,
            // surface_pressure ausente
          },
          daily: {
            time: ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
            weather_code: [null, 3, null, 1, 0],
            temperature_2m_min: [null, 16, 0, null, 18],
            temperature_2m_max: [20, null, 0, 26, null],
          },
        },
      }),
    });
    await page.goto('/');

    await searchFor(page, 'São Paulo');

    const current = currentRegion(page);
    await expect(current).toBeVisible();
    await expect(current).toContainText('Atualidade não informada');
    await expect(current).toContainText('Condição não disponível');
    await expect(current.getByText('0%', { exact: true })).toBeVisible();
    await expect(current.getByText('0 mm', { exact: true })).toBeVisible();
    await expect(current.getByText('Não disponível', { exact: true })).toHaveCount(3);
    await expect(forecastRegion(page).getByRole('listitem')).toHaveCount(5);
    await expect(forecastRegion(page).getByText('0 °C', { exact: true })).toHaveCount(2);

    for (const unit of ['Celsius', 'Fahrenheit'] as const) {
      await unitButton(page, unit).click();
      await expect(page.locator('main')).not.toContainText(/NaN|undefined|null|Infinity/);
    }
    await expect(forecastRegion(page).getByText('32 °F', { exact: true })).toHaveCount(2);
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
