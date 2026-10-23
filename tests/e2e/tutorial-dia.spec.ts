import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// O capítulo "O dia" com o Zeno de verdade em cena (docs/interacao/telas/tutorial.md › Capítulo "O dia"): a conta
// nova do Começar ao fim, rever por Ajustes › Tutorial, sair no meio, os estados (noite, dia fechado, "Seu plano
// começa amanhã"), a apresentação com a chave pk-tour-auto, o axe com o balão aberto e o caminho sem o Zeno.
// O WebGL dos testes roda na CPU (SwiftShader): o Zeno anda mais devagar, e os testes esperam com folga.
// Os ganchos window.__pkTour (src/tutorial/tour.ts) e window.__pkZeno (tests/e2e/global.d.ts) estão sempre ligados.

// um teste por vez neste arquivo: cada um desenha o Zeno, e dois juntos atrasam o tempo de cena
test.describe.configure({ mode: 'default', timeout: 480_000 });

const balloon = (page: Page) => page.locator('.tt-pos:not([data-leaving]) .tt-balloon');
const tourState = (page: Page) => page.evaluate(() => window.__pkTour!.state);
const zenoPresent = (page: Page) => page.evaluate(() => window.__pkZeno.present);
const SLOW = { timeout: 45_000 };

async function enterDemo(page: Page, agora = '2026-10-22T07:42') {
  await page.goto(`/entrar?agora=${agora}`);
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje/);
}

/** O perfil da demonstração (IndexedDB do aparelho): o estado do tutorial. */
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
      firstSteps?: { markAt?: number; addAt?: number; rateAt?: number; rating?: number };
    };
  });
}

/** O anel de hoje na semana ("Quinta, 22, hoje. 25% do dia feito."): a conta do dia. */
const dayCount = (page: Page) => page.locator('.pk-wk [aria-label*="hoje."]').first().getAttribute('aria-label');

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
}

/** O que recebe o toque no meio de um elemento: o véu, o próprio elemento, ou outro (o balão, o Zeno). */
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

/** O balão e o corpo do Zeno longe do anel do passo (o anel parado no alvo). */
async function clearOfRing(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const box = (el: Element | null) => {
            const r = el?.getBoundingClientRect();
            return r && r.width > 0 ? r : null;
          };
          const ring = box(document.querySelector('.tt-ring'));
          const b = box(document.querySelector('.tt-pos:not([data-leaving]) .tt-balloon'));
          const hit = document.querySelector<HTMLElement>('.zn-hit');
          const z = hit && !hit.hidden ? box(hit) : null;
          const cross = (a: DOMRect | null, c: DOMRect | null) =>
            !!a && !!c && a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
          return { balloon: cross(b, ring), zeno: cross(z, ring) };
        }),
      { timeout: 15_000 },
    )
    .toEqual({ balloon: false, zeno: false });
}

/** Os alvos dos passos de fazer, para conferir que só eles respondem. */
const DO_TARGETS: Record<string, string> = {
  marcar: '[data-tour="pp-mark"] [role="checkbox"]',
  somar: '[data-tour="pp-add"] button',
  nota: '[data-tour="pp-rate"] button',
  'nota-escolher': '[data-tour="pp-rate-options"] [role="radio"]',
  'nota-salvar': '[data-tour="pp-rate-save"]',
};

/**
 * Guarda cada texto que o balão anunciou (a região viva .tt-sr): a resposta depois da ação fica pouco na tela, e o
 * teste confere depois, sem correr atrás dela.
 */
async function recordBalloon(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __ttTexts?: string[] };
    if (w.__ttTexts) return;
    const texts: string[] = [];
    w.__ttTexts = texts;
    const sr = document.querySelector('.tt-sr');
    if (!sr) return;
    new MutationObserver(() => {
      const t = sr.textContent ?? '';
      if (t && texts.at(-1) !== t) texts.push(t);
    }).observe(sr, { childList: true, characterData: true, subtree: true });
  });
}
const balloonTexts = (page: Page) =>
  page.evaluate(() => (window as unknown as { __ttTexts?: string[] }).__ttTexts ?? []);

/**
 * Anda pelo capítulo "O dia" até o fim, fazendo as ações de verdade nos Primeiros passos, e devolve os passos que
 * apareceram. Em cada passo, o balão e o Zeno ficam longe do alvo, e no passo de fazer só o alvo responde.
 */
async function walkDay(page: Page, opts: { rating?: number; stopAt?: string } = {}): Promise<string[]> {
  const rating = opts.rating ?? 4;
  const word = ['Improvisado', 'Fraco', 'Ok', 'Bom', 'Completo'][rating - 1]!;
  const seen: string[] = [];
  await recordBalloon(page);
  for (let guard = 0; guard < 40; guard++) {
    const last = seen.at(-1) ?? null;
    // o passo seguinte, com o balão já na tela (ou o fim do capítulo)
    await page.waitForFunction(
      (last) => {
        const s = window.__pkTour!.state;
        if (s.run !== 'hoje') return true;
        const b = document.querySelector('.tt-pos:not([data-leaving]) .tt-balloon');
        return s.stepId !== last && !!s.text && !!b?.textContent?.includes(s.text.slice(0, 24));
      },
      last,
      { timeout: 40_000 },
    );
    const s = await tourState(page);
    if (s.run !== 'hoje') break;
    const id = s.stepId!;
    seen.push(id);
    if (id === opts.stopAt) break;
    if (s.veil !== 'none' && id !== 'fim') await clearOfRing(page);
    if (DO_TARGETS[id]) {
      expect(s.veil).toBe('do');
      expect(await hitAt(page, DO_TARGETS[id])).toBe('alvo');
    }
    switch (id) {
      case 'marcar':
        await page.getByRole('checkbox', { name: 'Primeira marcação no app' }).click();
        await expect.poll(() => balloonTexts(page)).toContain('Isso. Um pé depois do outro.');
        break;
      case 'somar':
        await page.getByRole('button', { name: /^Primeiro registro, \d de 3\. Somar 1$/ }).click();
        break;
      case 'nota':
        await page.locator('[data-tour="pp-rate"] button').click();
        await expect(page.getByRole('dialog', { name: 'Primeira nota' })).toBeVisible();
        break;
      case 'nota-escolher':
        await page
          .getByRole('dialog', { name: 'Primeira nota' })
          .getByRole('radio', { name: `${rating}, ${word}` })
          .click();
        break;
      case 'nota-salvar':
        await page.getByRole('button', { name: `Salvar nota ${rating}` }).click();
        await expect.poll(() => balloonTexts(page)).toContain('Obrigado por contar.');
        break;
      default:
        // passo de olhar: o véu segura o toque fora do alvo, até nas abas
        expect(s.veil).toBe('look');
        expect(await hitAt(page, '[role="tab"][aria-selected="false"]')).toBe('véu');
        await balloon(page)
          .getByRole('button', { name: /^(Próximo|Concluir)$/ })
          .click();
    }
  }
  return seen;
}

test.describe('tutorial "O dia" com o Zeno', () => {
  test('conta nova do começo ao fim: o Começar, os passos de "O dia" e a entrada na Jornada', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: /Testar o primeiro acesso/ }).click();
    await expect(page).toHaveURL(/\/comecar\/1/);

    // o Começar: o Zeno entra e fica no canto de cima, ao lado do título, que o balão cobre
    await expect(balloon(page)).toContainText('Oi, eu sou o Zeno.', SLOW);
    expect(await zenoPresent(page)).toBe(true);
    expect(await hitAt(page, '.sh-full-foot button')).toBe('alvo');
    expect(await hitAt(page, '[data-tour="ob-opcoes"] [role="radio"]')).toBe('alvo');
    await balloon(page).getByRole('button', { name: 'Próximo' }).click();
    await expect(balloon(page)).toContainText('Dá para começar com o plano base');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(balloon(page)).toContainText('Cada pilar é uma parte da sua vida.', SLOW);
    // o primeiro chip e o Continuar respondem; recolhido, o corpo dele deixa o toque passar
    expect(await hitAt(page, '[data-tour="ob-chips"] > :first-child')).toBe('alvo');
    await page.getByRole('button', { name: 'Sem Shorts e TikTok' }).click();
    await expect(balloon(page)).toHaveCount(0);
    await expect(page.locator('.zn-hit')).toHaveCSS('pointer-events', 'none');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(balloon(page)).toContainText('Seus horários guiam o dia.', SLOW);
    // os dias da coleta e o primeiro horário ficam livres
    expect(await hitAt(page, '[data-tour="ob-horario"]')).toBe('alvo');
    expect(await hitAt(page, '[role="checkbox"][aria-label="Sexta"]')).toBe('alvo');
    await page.getByRole('button', { name: 'Começar a fase 1' }).click();

    // "O dia" começa no Hoje, com o Zeno junto
    await expect(page).toHaveURL(/\/hoje$/);
    await expect(balloon(page)).toContainText('Este é o seu dia. Os hábitos ficam em Manhã', SLOW);
    expect(await tourState(page)).toMatchObject({ run: 'hoje', practice: true, veil: 'look' });
    expect(await zenoPresent(page)).toBe(true);
    const count = await dayCount(page);
    expect((await savedTutorial(page)).firstSteps).toBeUndefined();

    const steps = await walkDay(page);
    expect(steps).toEqual([
      'dia',
      'primeiros',
      'marcar',
      'desfazer',
      'somar',
      'nota',
      'nota-escolher',
      'nota-salvar',
      'habito',
      'dias-sem',
      'semana',
      'jeitos',
      'checkin',
      'fim',
    ]);

    // o fim: o grupo sai, o Zeno vai embora, o capítulo fica como visto e os Primeiros passos ficam gravados
    await expect(page.locator('[data-tour="pp-group"]')).toHaveCount(0);
    expect(await tourState(page)).toMatchObject({ run: null, practice: false, veil: 'none' });
    await expect.poll(() => zenoPresent(page), SLOW).toBe(false);
    await expect.poll(async () => (await savedTutorial(page)).done?.hoje ?? 0).toBeGreaterThan(0);
    const saved = await savedTutorial(page);
    expect(saved.firstSteps).toMatchObject({ rating: 4 });
    for (const k of ['markAt', 'addAt', 'rateAt'] as const) expect(typeof saved.firstSteps?.[k]).toBe('number');
    // nada contou no dia
    expect(await dayCount(page)).toBe(count);

    // na Jornada, a entrada dos Primeiros passos
    await page.getByRole('tab', { name: 'Jornada' }).click();
    await expect(page.locator('[data-tour="pp-journey"]')).toContainText('Primeiros passos com o Zeno');
  });

  test('rever "O dia" por Ajustes › Tutorial não grava os Primeiros passos de novo', async ({ page }) => {
    await enterDemo(page);
    // a primeira vez dos gestos, sem o tutorial (nota 2)
    await page.evaluate(() => window.__pkPractice.show(true));
    await page.getByRole('checkbox', { name: 'Primeira marcação no app' }).click();
    await page.getByRole('button', { name: /^Primeiro registro, 0 de 3\. Somar 1$/ }).click();
    await page.locator('[data-tour="pp-rate"] button').click();
    await page.getByRole('dialog', { name: 'Primeira nota' }).getByRole('radio', { name: '2, Fraco' }).click();
    await page.getByRole('button', { name: 'Salvar nota 2' }).click();
    await expect.poll(async () => (await savedTutorial(page)).firstSteps?.rating).toBe(2);
    await page.evaluate(() => window.__pkPractice.show(false));
    const before = (await savedTutorial(page)).firstSteps;

    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: /^Tutorial/ }).click();
    await page.getByRole('button', { name: /^O dia/ }).click();
    await expect(page).toHaveURL(/\/hoje$/);
    await expect(balloon(page)).toContainText('Este é o seu dia.', SLOW);
    // a demonstração tem limites na semana: o passo entra
    const steps = await walkDay(page, { rating: 5 });
    expect(steps).toContain('limites');
    expect(steps.at(-1)).toBe('fim');

    await expect.poll(async () => (await savedTutorial(page)).done?.hoje ?? 0).toBeGreaterThan(0);
    expect((await savedTutorial(page)).firstSteps).toEqual(before);
    // a aba Ajustes lembra a tela de onde o capítulo começou: Ajustes › Tutorial, com "O dia" visto
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await expect(page).toHaveURL(/\/ajustes\/tutorial$/);
    await expect(page.getByRole('button', { name: /^O dia/ })).toContainText('Visto');
  });

  test('sair no meio, com a folha da nota aberta: tudo volta ao normal', async ({ page }) => {
    await enterDemo(page);
    await page.evaluate(() => window.__pkTour!.start('hoje'));
    await expect(balloon(page)).toContainText('Este é o seu dia.', SLOW);
    await walkDay(page, { stopAt: 'nota-escolher' });
    await expect(page.getByRole('dialog', { name: 'Primeira nota' })).toBeVisible();
    expect(await tourState(page)).toMatchObject({ run: 'hoje', stepId: 'nota-escolher', practice: true });

    await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    await expect(balloon(page)).toHaveCount(0);
    await expect(page.locator('.tt-veil-layer')).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Primeira nota' })).toHaveCount(0);
    await expect(page).toHaveURL(/\/hoje$/);
    await expect(page.locator('[data-tour="pp-group"]')).toHaveCount(0);
    expect(await tourState(page)).toMatchObject({ run: null, practice: false, veil: 'none' });
    await expect.poll(() => zenoPresent(page), SLOW).toBe(false);
    expect((await savedTutorial(page)).done?.hoje).toBeUndefined();
    // a tela volta a responder
    await page.getByRole('tab', { name: 'Progresso' }).click();
    await expect(page).toHaveURL(/\/progresso/);
  });

  test('à noite: Ainda hoje e Feitos hoje, sem o cartão da semana, e o check-in já na tela', async ({ page }) => {
    await enterDemo(page, '2026-10-22T20:34');
    await page.evaluate(() => window.__pkTour!.start('hoje'));
    await expect(balloon(page)).toContainText('À noite, ele se divide em Ainda hoje e Feitos hoje.', SLOW);
    // sem a semana: 14 passos (a demonstração tem dias sem e limites)
    expect((await tourState(page)).counter).toBe('1 de 14');
    await clearOfRing(page);
    await page.evaluate(() => window.__pkTour!.stop());
    await expect(balloon(page)).toHaveCount(0);
    await expect(page.locator('[data-tour="pp-group"]')).toHaveCount(0);
  });

  test('no dia fechado: o anel, sem os momentos, a semana e o botão do jeito', async ({ page }) => {
    await enterDemo(page, '2026-10-22T21:10');
    await expect(page.getByRole('heading', { name: 'Dia fechado' })).toBeVisible();
    await page.evaluate(() => window.__pkTour!.start('hoje'));
    await expect(balloon(page)).toContainText('Este é o seu dia, já fechado.', SLOW);
    expect((await tourState(page)).counter).toBe('1 de 9');
    await clearOfRing(page);
    // o grupo fica acima do anel, e marcar o treino não reabre o dia
    const steps = await walkDay(page, { stopAt: 'desfazer' });
    expect(steps).toEqual(['fechado', 'primeiros', 'marcar', 'desfazer']);
    await expect(page.getByRole('heading', { name: 'Dia fechado' })).toBeVisible();
    await page.evaluate(() => window.__pkTour!.stop());
    await expect(balloon(page)).toHaveCount(0);
  });

  test('"Seu plano começa amanhã" (primeiro acesso depois das 20h): o Hoje ainda sem hábitos', async ({ page }) => {
    await enterDemo(page, '2026-10-22T21:10');
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: /Testar o primeiro acesso/ }).click();
    await expect(page).toHaveURL(/\/comecar\/1/);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/comecar\/2/);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.locator('.ob-cap')).toContainText('começa amanhã');
    await page.getByRole('button', { name: 'Começar a fase 1' }).click();
    await expect(page).toHaveURL(/\/hoje$/);
    await expect(balloon(page)).toContainText('Seu plano começa amanhã, e os hábitos aparecem aqui.', SLOW);
    expect((await tourState(page)).counter).toBe('1 de 10');
  });

  test('a apresentação com a chave pk-tour-auto: o Zeno entra, acena e oferece; "Vamos" começa "O dia"', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('pk-tour-auto', 'on'));
    await enterDemo(page);
    await expect(balloon(page)).toContainText('Oi, eu sou o Zeno. Vou andar com você por aqui.', SLOW);
    expect(await zenoPresent(page)).toBe(true);
    expect(await tourState(page)).toMatchObject({ run: 'intro', offer: 'intro', veil: 'none' });
    // sem véu: a tela continua respondendo, e o corpo do Zeno deixa o toque passar
    await expect(page.locator('.zn-hit')).toHaveCSS('pointer-events', 'none');
    await balloon(page).getByRole('button', { name: 'Vamos' }).click();
    await expect(balloon(page)).toContainText('Este é o seu dia.', SLOW);
    expect(await tourState(page)).toMatchObject({ run: 'hoje', practice: true });
    expect(await zenoPresent(page)).toBe(true);
    await expect.poll(async () => (await savedTutorial(page)).introAt ?? 0).toBeGreaterThan(0);
    await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    await expect.poll(() => zenoPresent(page), SLOW).toBe(false);
  });

  test('a apresentação: "Agora não" responde e o Zeno vai embora; sem o Zeno, nada é oferecido', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pk-tour-auto', 'on'));
    await enterDemo(page);
    await expect(balloon(page)).toContainText('Quer conhecer o app comigo?', SLOW);
    await recordBalloon(page);
    await balloon(page).getByRole('button', { name: 'Agora não' }).click();
    await expect.poll(() => balloonTexts(page)).toContain('Tudo bem. Fica em Ajustes › Tutorial.');
    await expect(balloon(page)).toHaveCount(0, { timeout: 6000 });
    await expect.poll(() => zenoPresent(page), SLOW).toBe(false);
    expect((await tourState(page)).run).toBeNull();
    await expect.poll(async () => (await savedTutorial(page)).introAt ?? 0).toBeGreaterThan(0);

    // "Mostrar o Zeno" desligado: o Progresso, na primeira vez, não oferece o capítulo
    await page.evaluate(() => window.__pkShell.navigate('/ajustes/aparencia'));
    await page.getByRole('switch', { name: /Mostrar o Zeno/ }).click();
    await expect.poll(() => page.evaluate(() => window.__pkZeno.available)).toBe(false);
    await page.getByRole('tab', { name: 'Progresso' }).click();
    await page.waitForTimeout(2500);
    await expect(balloon(page)).toHaveCount(0);
    expect((await tourState(page)).offer).toBeNull();
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`o axe com o balão aberto num passo de olhar e num de fazer, e o toque no Zeno (${colorScheme === 'light' ? 'claro' : 'escuro'})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await enterDemo(page);
      await page.evaluate(() => window.__pkTour!.start('hoje'));
      await expect(balloon(page)).toContainText('Este é o seu dia.', SLOW);
      await expect(balloon(page)).toBeFocused();
      await axe(page);

      // tocar no Zeno (à toa, depois de apontar): a fala dele aparece no balão por um instante, e o texto volta
      await expect.poll(() => page.evaluate(() => window.__pkZeno.stats()?.rate), SLOW).toBe(30);
      await page.locator('.zn-hit').click();
      await expect(balloon(page)).toContainText(/Oi!|Hehe\.|Tô aqui\./);
      await expect(balloon(page)).toContainText('Este é o seu dia.', { timeout: 4000 });

      await walkDay(page, { stopAt: 'marcar' });
      expect((await tourState(page)).veil).toBe('do');
      await clearOfRing(page);
      await axe(page);
      await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    });
  }

  test('sem o Zeno ("Mostrar o Zeno" desligado): o mesmo capítulo, só com o balão perto do alvo', async ({ page }) => {
    await enterDemo(page);
    await page.evaluate(() => window.__pkShell.navigate('/ajustes/aparencia'));
    await page.getByRole('switch', { name: /Mostrar o Zeno/ }).click();
    await expect.poll(() => page.evaluate(() => window.__pkZeno.available)).toBe(false);
    await page.evaluate(() => window.__pkTour!.start('hoje'));
    await expect(balloon(page)).toContainText('Este é o seu dia.', SLOW);
    expect(await zenoPresent(page)).toBe(false);
    await expect(page.locator('canvas.zn-gl:not(.zn-snap)')).toHaveCount(0);
    const steps = await walkDay(page, { stopAt: 'habito' });
    expect(steps).toEqual([
      'dia',
      'primeiros',
      'marcar',
      'desfazer',
      'somar',
      'nota',
      'nota-escolher',
      'nota-salvar',
      'habito',
    ]);
    await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    await expect(balloon(page)).toHaveCount(0);
    expect(await zenoPresent(page)).toBe(false);
  });
});
