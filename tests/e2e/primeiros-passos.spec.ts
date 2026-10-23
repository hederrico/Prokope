import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Os Primeiros passos do tutorial "O dia" (docs/interacao/telas/tutorial.md › Primeiros passos) na demonstração:
// o grupo no topo do Hoje, os três gestos com os componentes de verdade, nada nas contas do dia, a primeira vez
// gravada em profile.tutorial.firstSteps e uma entrada só na Jornada. O condutor do tutorial ainda não liga o
// grupo: os testes usam window.__pkPractice.show (src/stores/practice.ts).

async function enterDemo(page: Page, agora: string) {
  await page.goto(`/entrar?agora=${agora}`);
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(page.locator('[data-screen="/hoje"] h1')).toBeVisible();
}

async function go(page: Page, to: string) {
  await page.evaluate((to) => window.__pkShell.navigate(to), to);
}

async function showPractice(page: Page, on: boolean) {
  await page.evaluate((on) => window.__pkPractice.show(on), on);
}

/** Os documentos de uma coleção da demonstração (IndexedDB do aparelho). */
async function docs(page: Page, col: string): Promise<{ id: string; data: Record<string, unknown> }[]> {
  return page.evaluate(async (col) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('prokope-local-demo');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const rows = await new Promise<{ col: string; id: string; data: Record<string, unknown> }[]>((resolve) => {
      const r = db.transaction('docs').objectStore('docs').getAll();
      r.onsuccess = () => resolve(r.result);
    });
    db.close();
    return rows.filter((r) => r.col === col).map((r) => ({ id: r.id, data: r.data }));
  }, col);
}

async function firstSteps(page: Page): Promise<Record<string, unknown> | undefined> {
  const [profile] = await docs(page, 'profile');
  return (profile?.data.tutorial as { firstSteps?: Record<string, unknown> } | undefined)?.firstSteps;
}

/** A conta do dia pelo anel de hoje na semana ("Quinta, 22, hoje. 25% do dia feito." = 3 de 12). */
async function dayCount(page: Page): Promise<string | null> {
  return page.locator('.pk-wk [aria-label*="hoje."]').first().getAttribute('aria-label');
}

const group = (page: Page) => page.locator('[data-tour="pp-group"]');
const markBox = (page: Page) => page.getByRole('checkbox', { name: 'Primeira marcação no app' });
const plus = (page: Page) => page.getByRole('button', { name: /^Primeiro registro, \d de 3\. Somar 1$/ });
const toast = (page: Page, text: string | RegExp) => page.locator('.sh-toast').filter({ hasText: text });
/** A linha do registro de treino pelo nome dela ("Primeiro registro, 2 de 3. ..."): o número rola num NumberFlow. */
const addRow = (page: Page, n: number) =>
  page.getByRole('button', { name: new RegExp(`^Primeiro registro, ${n} de 3\\. Só para treinar`) });

/** O topo de um elemento na página (para conferir a ordem na tela). */
async function top(page: Page, selector: string): Promise<number> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
}

async function addThree(page: Page) {
  for (let i = 0; i < 3; i++) {
    await plus(page).click();
    await page.waitForTimeout(200);
  }
}

async function rate(page: Page, n: number, word: string) {
  await group(page).locator('[data-tour="pp-rate"] button').click();
  const sheet = page.getByRole('dialog', { name: 'Primeira nota' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('radio', { name: `${n}, ${word}` }).click();
  await sheet.getByRole('button', { name: `Salvar nota ${n}` }).click();
  await expect(sheet).toBeHidden();
}

async function axe(page: Page, include: string) {
  const r = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.describe('Primeiros passos', () => {
  test('o roteiro: marcar com Desfazer, somar, dar nota, nada nas contas e uma entrada na Jornada', async ({
    page,
  }) => {
    await enterDemo(page, '2026-10-22T07:42');
    const count = await dayCount(page);
    expect(count).toBe('Quinta, 22, hoje. 25% do dia feito.');
    const marks = (await docs(page, 'marks')).length;
    const entries = (await docs(page, 'entries')).length;
    expect(await firstSteps(page)).toBeUndefined();

    // o grupo entra no topo da lista, antes de Manhã
    await showPractice(page, true);
    await expect(group(page)).toBeVisible();
    await expect(group(page).getByRole('heading', { name: /^Primeiros passos/ })).toContainText(
      'não entram nos seus números',
    );
    expect(await top(page, '[data-tour="pp-group"]')).toBeLessThan(await top(page, 'section[aria-label="Manhã"]'));

    // marcar, desfazer pelo toast e marcar de novo: o CheckButton e o toast de verdade
    await markBox(page).click();
    await expect(markBox(page)).toHaveAttribute('aria-checked', 'true');
    await expect(toast(page, 'Primeira marcação feita')).toContainText('não entra nos seus números');
    await toast(page, 'Primeira marcação feita').getByRole('button', { name: 'Desfazer' }).click();
    await expect(markBox(page)).toHaveAttribute('aria-checked', 'false');
    await markBox(page).click();
    await expect(markBox(page)).toHaveAttribute('aria-checked', 'true');

    // somar 3 vezes: o número rola até 3 e o + vira "pronto"
    await expect(addRow(page, 0)).toBeVisible();
    await addThree(page);
    await expect(toast(page, 'Primeiro registro · +3')).toContainText('3 de 3');
    await expect(addRow(page, 3)).toBeVisible();
    await expect(plus(page)).toHaveCount(0);
    await expect(group(page).locator('[data-tour="pp-add"]')).toContainText('pronto');

    // dar nota pela folha de treino, como nas refeições
    await rate(page, 4, 'Bom');
    await expect(group(page).locator('[data-tour="pp-rate"]')).toContainText('4 · Bom');
    await expect(toast(page, 'Nota 4 · Bom')).toBeVisible();

    // nada conta: o dia, as marcas e os registros ficam iguais; a primeira vez de cada gesto foi gravada
    expect(await dayCount(page)).toBe(count);
    expect((await docs(page, 'marks')).length).toBe(marks);
    expect((await docs(page, 'entries')).length).toBe(entries);
    await expect.poll(() => firstSteps(page)).toMatchObject({ rating: 4 });
    const saved = (await firstSteps(page))!;
    for (const k of ['markAt', 'addAt', 'rateAt']) expect(typeof saved[k]).toBe('number');

    // o grupo sai com opacidade; na Jornada fica uma entrada só, entre a fase de agora e a próxima
    await showPractice(page, false);
    await expect(group(page)).toHaveCount(0);
    await go(page, '/jornada');
    const entry = page.locator('[data-tour="pp-journey"]');
    await expect(entry).toHaveCount(1);
    await expect(entry).toContainText('Primeiros passos com o Zeno');
    await expect(entry).toContainText('22 out · a primeira marcação, o primeiro registro e a primeira nota');
    const path = await page
      .locator('ol[aria-label="Fases"] > li')
      .evaluateAll((items) =>
        items.map((li) => (li.getAttribute('data-tour') ? 'pp' : (/Fase \d/.exec(li.textContent ?? '')?.[0] ?? '?'))),
      );
    expect(path).toEqual(['Fase 1', 'Fase 2', 'pp', 'Fase 3', 'Fase 4']);

    // rever: o grupo volta zerado, e nada é gravado de novo
    await go(page, '/hoje');
    await showPractice(page, true);
    await expect(markBox(page)).toHaveAttribute('aria-checked', 'false');
    await expect(addRow(page, 0)).toBeVisible();
    await expect(group(page).getByRole('button', { name: 'Primeira nota, sem nota. Dar nota' })).toBeVisible();
    await markBox(page).click();
    await plus(page).click();
    await rate(page, 2, 'Fraco');
    await expect(group(page).locator('[data-tour="pp-rate"]')).toContainText('2 · Fraco');
    await page.waitForTimeout(300);
    expect(await firstSteps(page)).toEqual(saved);
    expect(await dayCount(page)).toBe(count);
  });

  test('os três jeitos de ver: o grupo fica no topo da lista e não entra na conta', async ({ page }) => {
    await enterDemo(page, '2026-10-22T07:42');
    await showPractice(page, true);
    await expect(group(page)).toBeVisible();
    await markBox(page).click();
    for (const name of ['Lista completa', 'Linha do tempo'] as const) {
      await page.getByRole('button', { name: /^Jeito de ver o dia/ }).click();
      const sheet = page.getByRole('dialog', { name: 'Ver o dia' });
      await sheet.getByRole('radio', { name: new RegExp(`^${name}`) }).click();
      await expect(sheet).toBeHidden();
      await expect(page.getByRole('button', { name: new RegExp(`^Jeito de ver o dia: ${name}`) })).toBeVisible();
      // o mesmo grupo, com a marcação de treino (a linha fica em memória durante o capítulo)
      await expect(group(page)).toHaveCount(1);
      await expect(markBox(page)).toHaveAttribute('aria-checked', 'true');
      const first = name === 'Lista completa' ? 'section[aria-label="Manhã"]' : 'section[aria-label="Linha do tempo"]';
      expect(await top(page, '[data-tour="pp-group"]')).toBeLessThan(await top(page, first));
      await plus(page).click();
      expect(await dayCount(page)).toBe('Quinta, 22, hoje. 25% do dia feito.');
    }
    await expect(addRow(page, 2)).toBeVisible();
  });

  test('à noite: o grupo vem antes de Ainda hoje, e Feitos hoje não muda', async ({ page }) => {
    await enterDemo(page, '2026-10-22T20:34');
    await showPractice(page, true);
    await expect(group(page)).toBeVisible();
    const still = page.getByRole('heading', { name: /^Ainda hoje/ });
    const stillBefore = await still.textContent();
    expect(await top(page, '[data-tour="pp-group"]')).toBeLessThan(await top(page, 'section[aria-label="Ainda hoje"]'));
    await markBox(page).click();
    await plus(page).click();
    await expect(markBox(page)).toHaveAttribute('aria-checked', 'true');
    await expect(still).toHaveText(stillBefore ?? '');
    await expect(page.getByRole('button', { name: /^Feitos hoje · 8/ })).toBeVisible();
  });

  test('dia fechado (21h10): o grupo fica acima do anel, e marcar não mexe no dia', async ({ page }) => {
    await enterDemo(page, '2026-10-22T21:10');
    await expect(page.getByRole('heading', { name: 'Dia fechado' })).toBeVisible();
    await showPractice(page, true);
    await expect(group(page)).toBeVisible();
    expect(await top(page, '[data-tour="pp-group"]')).toBeLessThan(await top(page, '.td-closed-ring'));
    await markBox(page).click();
    await expect(markBox(page)).toHaveAttribute('aria-checked', 'true');
    // o CheckButton ignora um segundo toque em 300 ms
    await page.waitForTimeout(350);
    await markBox(page).click();
    await expect(markBox(page)).toHaveAttribute('aria-checked', 'false');
    await expect(toast(page, 'Primeira marcação desmarcada')).toBeVisible();
    // desmarcar o treino não reabre o dia
    await expect(page.getByRole('heading', { name: 'Dia fechado' })).toBeVisible();
    await expect(page.getByRole('meter', { name: '11 de 12 feitos hoje' })).toBeVisible();
  });

  test('conta nova depois das 20h ("Seu plano começa amanhã"): o grupo aparece e a entrada abre o caminho', async ({
    page,
  }) => {
    await enterDemo(page, '2026-10-22T21:10');
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: /Testar o primeiro acesso/ }).click();
    await expect(page).toHaveURL(/\/comecar\/1/);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForTimeout(550);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/comecar\/3/);
    await expect(page.locator('.ob-cap')).toContainText('começa amanhã');
    await page.getByRole('button', { name: 'Começar a fase 1' }).click();
    await expect(page).toHaveURL(/\/hoje$/);

    await showPractice(page, true);
    await expect(group(page)).toBeVisible();
    await markBox(page).click();
    await expect(markBox(page)).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => firstSteps(page)).toMatchObject({ markAt: expect.any(Number) });

    await go(page, '/jornada');
    const first = page.locator('ol[aria-label="Fases"] > li').first();
    await expect(first).toHaveAttribute('data-tour', 'pp-journey');
    await expect(first).toContainText('22 out · a primeira marcação');
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`o grupo, a folha e a entrada sem violações de acessibilidade (axe, ${colorScheme === 'light' ? 'claro' : 'escuro'})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await enterDemo(page, '2026-10-22T07:42');
      await showPractice(page, true);
      await expect(group(page)).toBeVisible();
      await markBox(page).click();
      await page.waitForTimeout(500);
      await axe(page, '[data-tour="pp-group"]');
      await group(page).locator('[data-tour="pp-rate"] button').click();
      await expect(page.getByRole('dialog', { name: 'Primeira nota' })).toBeVisible();
      await page.waitForTimeout(400);
      await axe(page, '[role="dialog"]');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await go(page, '/jornada');
      await expect(page.locator('[data-tour="pp-journey"]')).toBeVisible();
      await page.waitForTimeout(400);
      await axe(page, 'ol[aria-label="Fases"]');
    });
  }
});
