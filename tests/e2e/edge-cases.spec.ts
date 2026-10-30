import { expect, test } from '@playwright/test';
import {
  BLANK_SEARCH_MESSAGE,
  city,
  cityRegion,
  currentRegion,
  expectNoBrokenText,
  forecast,
  forecastRegion,
  freezeClock,
  mockApi,
  searchButton,
  searchField,
  searchFor,
  unitButton,
} from './support';

test.beforeEach(async ({ page }) => {
  await freezeClock(page);
});

test.describe('Blank search (AC-01.5)', () => {
  for (const [label, value] of [
    ['empty', ''],
    ['spaces only', '     '],
    ['tabs and spaces', ' \t \t '],
  ] as const) {
    test(`blocks a search with ${label} input and recovers once a city is typed`, async ({
      page,
    }) => {
      const api = await mockApi(page);
      await page.goto('/');
      const search = page.getByRole('search', { name: 'Buscar cidades' });

      await searchField(page).fill(value);
      await searchButton(page).click();

      await expect(search.getByRole('status')).toHaveText(BLANK_SEARCH_MESSAGE);
      await expect(searchField(page)).toBeFocused();
      await expect(searchField(page)).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByRole('status').filter({ hasText: 'Aguardando busca' })).toBeVisible();
      await expect(page.getByText('Carregando...')).toHaveCount(0);
      await expect(page.getByRole('alert')).toHaveCount(0);
      expect(api.geocoding).toHaveLength(0);
      expect(api.forecast).toHaveLength(0);

      await searchField(page).fill('São');
      await expect(search.getByRole('status')).toHaveCount(0);
      await expect(searchField(page)).not.toHaveAttribute('aria-invalid', 'true');

      await searchField(page).fill('São Paulo');
      await searchField(page).press('Enter');
      await expect(currentRegion(page)).toBeVisible();
      expect(api.geocoding).toHaveLength(1);
    });
  }

  test('blocks submitting with the Enter key as well', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/');

    await searchField(page).fill('   ');
    await searchField(page).press('Enter');

    await expect(page.getByRole('search').getByRole('status')).toHaveText(BLANK_SEARCH_MESSAGE);
    expect(api.geocoding).toHaveLength(0);
  });

  test('blocks a blank search after a previous result without discarding that result', async ({
    page,
  }) => {
    const api = await mockApi(page);
    await page.goto('/');
    await searchFor(page, 'São Paulo');
    await expect(currentRegion(page)).toBeVisible();

    await searchFor(page, '   ');

    await expect(page.getByRole('search').getByRole('status')).toHaveText(BLANK_SEARCH_MESSAGE);
    await expect(currentRegion(page)).toBeVisible();
    expect(api.geocoding).toHaveLength(1);
    expect(api.forecast).toHaveLength(1);
  });
});

test.describe('Special characters (AC-01.6)', () => {
  for (const name of [
    'São Paulo',
    "L'Haÿ-les-Roses",
    'Aix-en-Provence',
    'Zürich',
    'Ōsaka',
    'Saint-Étienne',
  ]) {
    test(`preserves "${name}" in the request and shows the matching result`, async ({ page }) => {
      const api = await mockApi(page, {
        geocoding: () => ({ json: { results: [{ ...city, id: 5, name }] } }),
      });
      await page.goto('/');

      await searchFor(page, `  ${name}  `);

      await expect(cityRegion(page, name)).toBeVisible();
      await expect(forecastRegion(page, name)).toBeVisible();
      expect(api.geocoding).toHaveLength(1);
      const url = api.geocoding[0];
      expect(url.searchParams.get('name')).toBe(name);
      expect(url.search.startsWith('?name=')).toBe(true);
      expect(url.search).not.toMatch(/[<>"' #]|name=%20|%20&count=/);
    });
  }

  test('encodes reserved characters so they cannot add or change query parameters', async ({
    page,
  }) => {
    const hostile = 'Paris&apikey=secret #frag ?x=1 +plus %41 /path';
    const api = await mockApi(page, {
      geocoding: () => ({ json: { results: [{ ...city, id: 6, name: 'Paris' }] } }),
    });
    await page.goto('/');

    await searchFor(page, hostile);

    await expect(cityRegion(page, 'Paris')).toBeVisible();
    const url = api.geocoding[0];
    expect([...url.searchParams.keys()]).toEqual(['name', 'count', 'language', 'format']);
    expect(url.searchParams.get('name')).toBe(hostile);
    expect(url.searchParams.has('apikey')).toBe(false);
    expect(url.hash).toBe('');
    expect(url.pathname).toBe('/v1/search');
  });

  test('never treats the typed text or the returned names as markup or script', async ({
    page,
  }) => {
    const typed = '<img src=x onerror="window.__pwned=1">';
    await mockApi(page, {
      geocoding: () => ({
        json: {
          results: [
            { ...city, id: 7, name: '<b>Evil</b>', admin1: '<script>window.__pwned=1</script>' },
          ],
        },
      }),
    });
    await page.goto('/');

    await searchFor(page, typed);

    await expect(cityRegion(page, '<b>Evil</b>')).toBeVisible();
    await expect(cityRegion(page, '<b>Evil</b>')).toContainText(
      '<script>window.__pwned=1</script>, Brasil',
    );
    await expect(
      page.getByRole('group', { name: 'Cidades encontradas' }).getByRole('button'),
    ).toContainText('<b>Evil</b>, <script>window.__pwned=1</script>, Brasil');
    await expect(searchField(page)).toHaveValue(typed);
    await expect(page.locator('main b, main img, main script')).toHaveCount(0);
    const pwned = await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned);
    expect(pwned).toBeUndefined();
  });
});

test.describe('Search without results (AC-01.4)', () => {
  for (const [label, payload] of [
    ['an empty list', { results: [] }],
    ['no results field', { generationtime_ms: 0.4 }],
    ['a null results field', { results: null }],
  ] as const) {
    test(`shows the empty state for ${label}, keeps the field editable and finds a corrected name`, async ({
      page,
    }) => {
      const api = await mockApi(page, {
        geocoding: (url) =>
          url.searchParams.get('name') === 'Sao Paol'
            ? { json: payload }
            : { json: { results: [city] } },
      });
      await page.goto('/');

      await searchFor(page, 'Sao Paol');

      await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
      await expect(page.getByText('Confira o nome e tente outra busca.')).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.getByText('Tentar novamente')).toHaveCount(0);
      await expect(page.getByRole('group', { name: 'Cidades encontradas' })).toHaveCount(0);
      await expect(page.getByRole('region', { name: /São Paulo/ })).toHaveCount(0);
      expect(api.forecast).toHaveLength(0);
      await expectNoBrokenText(page);

      await expect(searchField(page)).toBeEditable();
      await expect(searchField(page)).toHaveValue('Sao Paol');
      await searchField(page).fill('São Paulo');
      await searchButton(page).click();

      await expect(currentRegion(page)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toHaveCount(0);
      expect(api.geocoding).toHaveLength(2);
      expect(api.forecast).toHaveLength(1);
    });
  }

  test('does not keep the previous city selected after a search without results', async ({
    page,
  }) => {
    const api = await mockApi(page, {
      geocoding: (_url, attempt) => (attempt === 1 ? { json: { results: [city] } } : { json: {} }),
    });
    await page.goto('/');
    await searchFor(page, 'São Paulo');
    await expect(currentRegion(page)).toBeVisible();

    await searchFor(page, 'Xyzzy');

    await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    await expect(currentRegion(page)).toHaveCount(0);
    await expect(forecastRegion(page)).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Cidades encontradas' })).toHaveCount(0);
    expect(api.forecast).toHaveLength(1);
  });
});

test.describe('Incomplete forecast response (AC-05.2, AC-05.6)', () => {
  const missingCurrent = {
    time: null,
    temperature_2m: null,
    weather_code: null,
    relative_humidity_2m: null,
    wind_speed_10m: null,
    precipitation: null,
    surface_pressure: null,
  };

  test('keeps the current weather when no forecast days are returned', async ({ page }) => {
    await mockApi(page, {
      forecast: () => ({
        json: {
          ...forecast,
          daily: { time: [], weather_code: [], temperature_2m_min: [], temperature_2m_max: [] },
        },
      }),
    });
    await page.goto('/');

    await searchFor(page, 'São Paulo');

    const current = currentRegion(page);
    await expect(current.getByText('0 °C', { exact: true })).toBeVisible();
    await expect(current.getByText('Alguns dados não estão disponíveis')).toHaveCount(0);
    const days = forecastRegion(page).getByRole('listitem');
    await expect(days).toHaveCount(5);
    await expect(days.getByText('Condição não disponível')).toHaveCount(5);
    await expect(days.getByText('Não disponível', { exact: true })).toHaveCount(10);
    await expect(forecastRegion(page).getByRole('status')).toHaveText(
      'Alguns dados não estão disponíveis',
    );
    await expectNoBrokenText(page);
  });

  test('keeps the forecast when the current block has only null values', async ({ page }) => {
    await mockApi(page, { forecast: () => ({ json: { ...forecast, current: missingCurrent } }) });
    await page.goto('/');

    await searchFor(page, 'São Paulo');

    const current = currentRegion(page);
    await expect(current.getByText('Não disponível', { exact: true })).toHaveCount(5);
    await expect(current).toContainText('Condição não disponível');
    await expect(current).toContainText('Atualidade não informada');
    await expect(current.getByRole('status')).toHaveText('Alguns dados não estão disponíveis');
    await expect(forecastRegion(page).getByRole('listitem')).toHaveCount(5);
    await expect(forecastRegion(page).getByRole('status')).toHaveCount(0);

    await unitButton(page, 'Fahrenheit').click();
    await expect(forecastRegion(page).getByText('35 °F', { exact: true })).toBeVisible();
    await expectNoBrokenText(page);
  });

  test('flags only the affected fields when part of the current block is missing', async ({
    page,
  }) => {
    await mockApi(page, {
      forecast: () => ({
        json: {
          ...forecast,
          current: { ...forecast.current, relative_humidity_2m: null, surface_pressure: undefined },
        },
      }),
    });
    await page.goto('/');

    await searchFor(page, 'São Paulo');

    const current = currentRegion(page);
    await expect(current.getByText('Não disponível', { exact: true })).toHaveCount(2);
    await expect(current.getByText('12,3 km/h', { exact: true })).toBeVisible();
    await expect(current.getByText('0,1 mm', { exact: true })).toBeVisible();
    await expect(current.getByRole('status')).toHaveText('Alguns dados não estão disponíveis');
    await expect(forecastRegion(page).getByRole('status')).toHaveCount(0);
  });

  test('marks a whole missing daily field without shifting the other values', async ({ page }) => {
    await mockApi(page, {
      forecast: () => ({
        json: {
          ...forecast,
          daily: { ...forecast.daily, temperature_2m_max: undefined, weather_code: [2, 3] },
        },
      }),
    });
    await page.goto('/');

    await searchFor(page, 'São Paulo');

    const days = forecastRegion(page).getByRole('listitem');
    await expect(days).toHaveCount(5);
    await expect(days.nth(0)).toContainText('Parcialmente nublado');
    await expect(days.nth(1)).toContainText('Nublado');
    await expect(days.nth(2)).toContainText('Condição não disponível');
    await expect(days.nth(1)).toContainText('16 °C');
    await expect(days.nth(4)).toContainText('18 °C');
    await expect(days.getByText('Não disponível', { exact: true })).toHaveCount(5);
    await expect(forecastRegion(page).getByRole('status')).toHaveText(
      'Alguns dados não estão disponíveis',
    );
    await expectNoBrokenText(page);
  });

  test('tells a city without weather coverage apart from an unknown city', async ({ page }) => {
    const api = await mockApi(page, {
      forecast: () => ({
        json: {
          timezone: 'America/Sao_Paulo',
          current: missingCurrent,
          daily: {
            time: [],
            weather_code: null,
            temperature_2m_min: null,
            temperature_2m_max: null,
          },
        },
      }),
    });
    await page.goto('/');

    await searchFor(page, 'São Paulo');

    await expect(
      page.getByRole('heading', { name: 'Previsão não disponível para esta cidade' }),
    ).toBeVisible();
    await expect(page.getByText('São Paulo', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(currentRegion(page)).toHaveCount(0);
    await expect(forecastRegion(page)).toHaveCount(0);
    await expect(
      page
        .getByRole('group', { name: 'Cidades encontradas' })
        .getByRole('button', { pressed: true }),
    ).toHaveCount(1);
    expect(api.forecast).toHaveLength(1);
    await expectNoBrokenText(page);
  });
});
