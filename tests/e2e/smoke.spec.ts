import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Fumaça: o app abre no tamanho do iPhone, com as fontes certas, nos dois temas, e sem problemas de acessibilidade do axe.
for (const colorScheme of ['light', 'dark'] as const) {
  test(`abre o app no tema ${colorScheme === 'light' ? 'claro' : 'escuro'}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/hoje');

    const title = page.getByRole('heading', { level: 1, name: 'Prokopē' });
    await expect(title).toBeVisible();
    await expect(page.getByText('προκοπή')).toBeVisible();

    // as fontes hospedadas carregaram (Fraunces e Literata de public/fonts, Onest do Fontsource)
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() =>
      [...document.fonts]
        .filter((f) => f.status === 'loaded')
        .map((f) => `${f.family.replace(/["']/g, '')} ${f.style}`),
    );
    expect(loaded).toEqual(expect.arrayContaining(['Fraunces normal', 'Literata italic', 'Onest Variable normal']));

    const scheme = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    expect(scheme).toBe(colorScheme);

    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations).toEqual([]);
  });
}

test('tem o manifesto do app instalável', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await (await request.get(href!)).json();
  expect(manifest).toMatchObject({ name: 'Prokopē', display: 'standalone', start_url: '/hoje', lang: 'pt-BR' });
});
