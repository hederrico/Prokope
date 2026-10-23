import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// O modo exemplo na demonstração (telas/tutorial.md › Modo exemplo). Na demonstração, os dados da pessoa já são a
// história; o exemplo é outra cópia, e a da pessoa não muda. Os testes ligam o modo pelo gancho window.__pkExample.

async function enterDemo(page: Page) {
  await page.goto('/entrar?agora=2026-10-22T07:42');
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(page.locator('[data-screen="/hoje"] h1')).toBeVisible();
}

/** Volta a rolagem da tela para o topo. */
async function toTop(page: Page) {
  await page.evaluate(() => document.querySelectorAll('[data-screen-scroll]').forEach((el) => el.scrollTo(0, 0)));
  await page.waitForTimeout(100);
}

const banner = (page: Page) => page.getByRole('status').filter({ hasText: 'Exemplo · nada aqui é seu' });
const walk = (page: Page) => page.getByRole('checkbox', { name: /^Caminhada/ });
const football = (page: Page) => page.getByRole('checkbox', { name: /^Futebol/ });
/** A Manhã toda feita recolhe (com a caminhada da pessoa marcada, na próxima arrumação). */
const morningDone = (page: Page) => page.getByRole('button', { name: /^Tudo feito, peso, acordar e caminhada/ });

test.describe('modo exemplo', () => {
  test('a marca da pessoa fica, a do exemplo some, e recarregar volta para os dados dela', async ({ page }) => {
    await enterDemo(page);
    await expect(banner(page)).toHaveCount(0);

    // 1. a pessoa marca a caminhada
    await walk(page).click();
    await expect(walk(page)).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.sh-toast')).toContainText('Caminhada marcada');

    // 2. o exemplo: a faixa e a história de novo, sem a marca da pessoa (o Desfazer da pessoa sai junto)
    await page.evaluate(() => window.__pkExample.enter());
    await expect(banner(page)).toBeVisible();
    await expect(page.locator('.sh-toast')).toHaveCount(0);
    expect(await page.evaluate(() => window.__pkExample.active)).toBe(true);
    await expect(walk(page)).toHaveAttribute('aria-checked', 'false');
    // a faixa não esconde o cabeçalho
    await toTop(page);
    const bannerBox = (await banner(page).boundingBox())!;
    const headerBox = (await page.getByText('Quinta, 22 de outubro').boundingBox())!;
    expect(headerBox.y).toBeGreaterThanOrEqual(bannerBox.y + bannerBox.height);

    // 3. marca outro hábito no exemplo
    await football(page).click();
    await expect(football(page)).toHaveAttribute('aria-checked', 'true');

    // 4. sai: a marca da pessoa continua, a do exemplo sumiu, a faixa saiu e o Desfazer do exemplo também
    await page.evaluate(() => window.__pkExample.leave());
    await expect(banner(page)).toHaveCount(0);
    await expect(page.locator('.sh-toast')).toHaveCount(0);
    await expect(football(page)).toHaveAttribute('aria-checked', 'false');
    await morningDone(page).click();
    await expect(walk(page)).toHaveAttribute('aria-checked', 'true');

    // 5. recarregar no meio do exemplo sai dele, com os dados da pessoa (a hora fixa vai na URL, para o recarregar)
    await page.goto('/hoje?agora=2026-10-22T07:42');
    await expect(morningDone(page)).toBeVisible();
    await page.evaluate(() => window.__pkExample.enter());
    await expect(banner(page)).toBeVisible();
    await expect(walk(page)).toHaveAttribute('aria-checked', 'false');
    await football(page).click();
    await expect(football(page)).toHaveAttribute('aria-checked', 'true');
    // abre um hábito do exemplo: o id dele não existe nos dados da pessoa
    await page.getByRole('button', { name: /^Caminhada com o cachorro.*Abre o hábito/ }).click();
    await expect(page).toHaveURL(/\/hoje\/habito\//);
    await page.reload();
    // volta para onde a pessoa estava antes do exemplo
    await expect(page).toHaveURL(/\/hoje\?agora=/);
    await expect(page.locator('[data-screen="/hoje"] h1')).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
    expect(await page.evaluate(() => window.__pkExample.active)).toBe(false);
    await expect(football(page)).toHaveAttribute('aria-checked', 'false');
    await expect(morningDone(page)).toBeVisible();
  });

  test('a faixa fica por cima do Progresso sem esconder o título, e passa no axe', async ({ page }) => {
    await enterDemo(page);
    await page.evaluate(() => window.__pkExample.enter());
    await page.getByRole('tab', { name: 'Progresso' }).click();
    const title = page.getByRole('heading', { level: 1, name: 'Progresso' });
    await expect(title).toBeVisible();
    await expect(banner(page)).toBeVisible();
    const bannerBox = (await banner(page).boundingBox())!;
    const titleBox = (await title.boundingBox())!;
    expect(titleBox.y).toBeGreaterThanOrEqual(bannerBox.y + bannerBox.height);
    // ir para o fundo e voltar mantém o exemplo
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(300);
    await expect(banner(page)).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
