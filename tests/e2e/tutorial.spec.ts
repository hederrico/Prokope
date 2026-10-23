import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// O tutorial com o Zeno (docs/interacao/telas/tutorial.md), no tamanho do iPhone e na demonstração: o Zeno nos três
// passos do Começar e "O dia" no Hoje, Ajustes › Tutorial, "Sair do tutorial", e as ofertas com a chave de teste.
// Os testes rodam com VITE_TOUR_AUTO=off: o Zeno só se oferece com localStorage['pk-tour-auto'] = 'on'.
// O gancho window.__pkTour está declarado em src/tutorial/tour.ts (sempre ligado, como o window.__pkShell).
// O Zeno de verdade entra em cena (o WebGL dos testes roda na CPU e anda mais devagar): as esperas têm folga.
// O capítulo "O dia" inteiro, com os Primeiros passos, está em tutorial-dia.spec.ts.

test.describe.configure({ timeout: 120_000 });
const SLOW = { timeout: 20_000 };

// o balão que sai na troca de passo fica de fora (data-leaving)
const balloon = (page: Page) => page.locator('.tt-pos:not([data-leaving]) .tt-balloon');
const tourState = (page: Page) => page.evaluate(() => window.__pkTour!.state);

async function enterDemo(page: Page, agora = '07:03') {
  await page.goto(`/entrar?agora=${agora}`);
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje/);
}

async function go(page: Page, to: string) {
  await page.evaluate((to) => window.__pkShell.navigate(to), to);
  await page.waitForTimeout(600);
}

/** O estado do tutorial guardado no perfil da demonstração (IndexedDB do aparelho). */
async function savedTutorial(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('prokope-local-demo', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const row = await new Promise<{ data: { tutorial?: Record<string, unknown> } } | undefined>((resolve) => {
      const r = db.transaction('docs').objectStore('docs').get('profile/profile');
      r.onsuccess = () => resolve(r.result);
    });
    db.close();
    return (row?.data.tutorial ?? {}) as {
      introAt?: number;
      done?: Record<string, number>;
      offered?: Record<string, number>;
    };
  });
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
}

/** O que recebe o toque no meio de um elemento (o véu segura, ou o elemento responde). */
async function hitAt(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) return 'sem elemento';
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!hit) return 'nada';
    if (hit.closest('.tt-block')) return 'véu';
    return el.contains(hit) ? 'alvo' : 'outro';
  }, selector);
}

test.describe('tutorial', () => {
  test('Testar o primeiro acesso: o Zeno nos três passos do Começar, e "O dia" começa no Hoje', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: /Testar o primeiro acesso/ }).click();
    await expect(page).toHaveURL(/\/comecar\/1/);

    // passo 1: o Zeno se apresenta, sem véu; o foco fica com o título do passo
    await expect(balloon(page)).toContainText('Oi, eu sou o Zeno. Vou com você nos primeiros passos.', SLOW);
    expect(await tourState(page)).toMatchObject({ run: 'comecar', veil: 'none' });
    await expect(page.locator('.tt-veil-layer')).toHaveCount(0);
    await expect(balloon(page).getByRole('button', { name: 'Sair do tutorial' })).toHaveCount(0);
    await axe(page);
    // a apresentação fica gravada no passo 1
    await expect.poll(async () => (await savedTutorial(page)).introAt ?? 0).toBeGreaterThan(0);
    await balloon(page).getByRole('button', { name: 'Próximo' }).click();
    await expect(balloon(page)).toContainText('Dá para começar com o plano base, que já vem com fases, ou do zero.');
    // o balão não cobre o Continuar preso embaixo
    expect(await hitAt(page, '.sh-full-foot button')).toBe('alvo');
    await page.getByRole('button', { name: 'Continuar' }).click();

    // passo 2: aponta para o primeiro chip; usar a tela recolhe o balão
    await expect(page).toHaveURL(/\/comecar\/2/);
    await expect(balloon(page)).toContainText('Cada pilar é uma parte da sua vida.', SLOW);
    await page.getByRole('button', { name: 'Sem Shorts e TikTok' }).click();
    await expect(balloon(page)).toHaveCount(0);
    expect((await tourState(page)).collapsed).toBe(true);
    await page.getByRole('button', { name: 'Continuar' }).click();

    // passo 3: o primeiro horário
    await expect(page).toHaveURL(/\/comecar\/3/);
    await expect(balloon(page)).toContainText(
      'Seus horários guiam o dia. Dá para mudar depois em Ajustes › Horários.',
      SLOW,
    );
    await page.getByRole('button', { name: 'Começar a fase 1' }).click();

    // no Hoje, o Zeno vai junto e "O dia" começa pelo condutor, com o véu e o anel
    await expect(page).toHaveURL(/\/hoje$/);
    await expect(balloon(page)).toContainText('Este é o seu dia.', SLOW);
    expect(await tourState(page)).toMatchObject({ run: 'hoje', veil: 'look', practice: true });
    await expect(page.locator('.tt-ring')).toHaveCount(1);
    // o foco vai para o balão
    await expect(balloon(page)).toBeFocused();
    // passo de olhar: o toque fora do alvo não faz nada (nem nas abas)
    expect(await hitAt(page, '[role="tab"][aria-selected="false"]')).toBe('véu');
    await axe(page);
    // o capítulo inteiro está em tutorial-dia.spec.ts; aqui o teste sai, e nada fica gravado
    await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    await expect(balloon(page)).toHaveCount(0);
    await expect(page.locator('.tt-veil-layer')).toHaveCount(0);
    expect(await tourState(page)).toMatchObject({ run: null, practice: false });
    expect((await savedTutorial(page)).done?.hoje).toBeUndefined();
  });

  test('Ajustes › Tutorial lista os capítulos e começa um na aba dele', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: /^Tutorial/ }).click();
    await expect(page).toHaveURL(/\/ajustes\/tutorial$/);
    await expect(page.getByRole('heading', { name: 'Capítulos' })).toBeVisible();
    const titles = ['O dia', 'O hábito e os padrões', 'O progresso', 'A jornada', 'Os ajustes'];
    for (const t of titles) await expect(page.getByRole('button', { name: new RegExp(`^${t}`) })).toBeVisible();
    await expect(page.getByText('Visto')).toHaveCount(0);
    await axe(page);

    await page.getByRole('button', { name: /^O progresso/ }).click();
    await expect(page).toHaveURL(/\/progresso/);
    await expect(balloon(page)).toContainText('No anel, a constância da semana.', SLOW);
    expect((await tourState(page)).run).toBe('progresso');
    // sair no meio não grava: o capítulo continua sem "Visto" (do começo ao fim: tutorial-capitulos.spec.ts)
    await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    await expect(balloon(page)).toHaveCount(0);
    await go(page, '/ajustes/tutorial');
    await expect(page.getByText('Visto')).toHaveCount(0);
  });

  test('"Sair do tutorial" limpa tudo e devolve o foco', async ({ page }) => {
    await enterDemo(page);
    // quem estava com o foco quando o capítulo começou recebe o foco de volta no fim
    await page.getByRole('tab', { name: 'Hoje' }).focus();
    await page.evaluate(() => window.__pkTour!.start('hoje'));
    await expect(balloon(page)).toContainText('Este é o seu dia.', SLOW);
    await expect(balloon(page)).toBeFocused();
    expect(await tourState(page)).toMatchObject({ run: 'hoje', practice: true, veil: 'look' });
    await expect(page.locator('.tt-veil-layer')).toHaveCount(1);
    await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    await expect(balloon(page)).toHaveCount(0);
    await expect(page.locator('.tt-veil-layer')).toHaveCount(0);
    expect(await tourState(page)).toMatchObject({ run: null, step: 0, practice: false, text: null });
    await expect(page.getByRole('tab', { name: 'Hoje' })).toBeFocused();
    // sair no meio não grava o capítulo, e a tela volta a responder
    expect((await savedTutorial(page)).done?.hoje).toBeUndefined();
    await page.getByRole('tab', { name: 'Progresso' }).click();
    await expect(page).toHaveURL(/\/progresso/);

    // pela API também, e Esc no balão sai
    await page.evaluate(() => window.__pkTour!.start('jornada'));
    await expect(balloon(page)).toContainText('Este é o caminho das fases', SLOW);
    // Esc com o foco no balão (o foco chega quando o balão assenta)
    await expect(balloon(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(balloon(page)).toHaveCount(0);
    expect((await tourState(page)).run).toBeNull();
    await page.evaluate(() => window.__pkTour!.start('progresso'));
    await expect(balloon(page)).toContainText('No anel, a constância da semana.', SLOW);
    await page.evaluate(() => window.__pkTour!.stop());
    await expect(balloon(page)).toHaveCount(0);
    await expect(page.locator('.tt-veil-layer')).toHaveCount(0);
  });

  test('com a chave de teste: a apresentação no Hoje e o capítulo ao abrir o Progresso, uma vez só', async ({
    page,
  }) => {
    // cada oferta espera a tela assentar, e o teste confere que nada volta depois de reabrir o app
    test.setTimeout(75_000);
    await page.addInitScript(() => localStorage.setItem('pk-tour-auto', 'on'));
    await enterDemo(page);

    // a conta da demonstração já existia (tem plano) e o Zeno ainda não se apresentou
    await expect(balloon(page)).toContainText('Oi, eu sou o Zeno. Vou andar com você por aqui.', SLOW);
    expect(await tourState(page)).toMatchObject({ run: 'intro', offer: 'intro', veil: 'none' });
    await expect(page.locator('.tt-veil-layer')).toHaveCount(0);
    await axe(page);
    await balloon(page).getByRole('button', { name: 'Agora não' }).click();
    await expect(balloon(page)).toContainText('Tudo bem. Fica em Ajustes › Tutorial.');
    await expect(balloon(page)).toHaveCount(0, SLOW);
    expect((await tourState(page)).run).toBeNull();
    await expect.poll(async () => (await savedTutorial(page)).introAt ?? 0).toBeGreaterThan(0);

    // reabrir o app: a apresentação não volta
    await page.reload();
    await expect(page).toHaveURL(/\/hoje/);
    await page.waitForTimeout(1800);
    await expect(balloon(page)).toHaveCount(0);

    // o Progresso, na primeira vez: "Mostrar" ou "Agora não", e as duas gravam
    await page.getByRole('tab', { name: 'Progresso' }).click();
    await expect(balloon(page)).toContainText('Quer que eu mostre o Progresso?', SLOW);
    expect((await tourState(page)).offer).toBe('progresso');
    await balloon(page).getByRole('button', { name: 'Agora não' }).click();
    await expect(balloon(page)).toHaveCount(0);
    await expect.poll(async () => (await savedTutorial(page)).offered?.progresso ?? 0).toBeGreaterThan(0);
    // abrir de novo (e depois de reabrir o app) não oferece de novo
    await page.getByRole('tab', { name: 'Hoje' }).click();
    await page.getByRole('tab', { name: 'Progresso' }).click();
    await page.waitForTimeout(1800);
    await expect(balloon(page)).toHaveCount(0);
    await page.reload();
    await page.waitForTimeout(1800);
    await expect(balloon(page)).toHaveCount(0);

    // a Jornada: "Mostrar" começa o capítulo
    await page.getByRole('tab', { name: 'Jornada' }).click();
    await expect(balloon(page)).toContainText('Quer que eu mostre a Jornada?', SLOW);
    await balloon(page).getByRole('button', { name: 'Mostrar' }).click();
    await expect(balloon(page)).toContainText('Este é o caminho das fases', SLOW);
    expect((await tourState(page)).run).toBe('jornada');
    await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    await expect(balloon(page)).toHaveCount(0);
    const saved = await savedTutorial(page);
    expect(saved.offered?.jornada).toBeGreaterThan(0);
    expect(saved.done?.jornada).toBeUndefined();
  });
});
