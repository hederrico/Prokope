import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Os capítulos que ensinam onde ver cada coisa (docs/interacao/telas/tutorial.md): "O hábito e os padrões",
// "O progresso" e "A jornada", no modo exemplo, e "Os ajustes", nos dados da pessoa. Cada um do começo ao fim, a
// saída no meio, a pessoa de volta aos dados dela, o capítulo visto em Ajustes › Tutorial, as ofertas de cada aba e o
// axe com o balão aberto. Até o encontro do balão com o Zeno ficar pronto, os capítulos rodam com "Mostrar o Zeno"
// desligado (só o balão); as ofertas precisam dele ligado (nada é oferecido sem o Zeno).

const AGORA = '2026-10-22T07:42';
// o balão que sai na troca de passo fica de fora (data-leaving)
const balloon = (page: Page) => page.locator('.tt-pos:not([data-leaving]) .tt-balloon');
const tourState = (page: Page) => page.evaluate(() => window.__pkTour!.state);
const banner = (page: Page) => page.getByRole('status').filter({ hasText: 'Exemplo · nada aqui é seu' });
const exampleOn = (page: Page) => page.evaluate(() => window.__pkExample.active);

async function enterDemo(page: Page) {
  await page.goto(`/entrar?agora=${AGORA}`);
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje/);
  await expect(page.locator('[data-screen="/hoje"] h1')).toBeVisible();
}

async function go(page: Page, to: string) {
  await page.evaluate((to) => window.__pkShell.navigate(to), to);
  await page.waitForTimeout(500);
}

/** "Mostrar o Zeno" desligado: o tutorial segue só com o balão (o encontro com o Zeno é conferido depois). */
async function zenoOff(page: Page) {
  await go(page, '/ajustes/aparencia');
  const sw = page.getByRole('switch', { name: 'Mostrar o Zeno' });
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await go(page, '/hoje');
}

/** Começa um capítulo por Ajustes › Tutorial. */
async function startFromSettings(page: Page, title: RegExp) {
  await go(page, '/ajustes/tutorial');
  await page.getByRole('button', { name: title }).click();
}

/**
 * Espera o passo aparecer (o balão com o texto) e, com `target`, confere o anel e o alvo à mostra. `timeout`: o
 * primeiro passo de uma oferta espera o exemplo e a entrada do Zeno.
 */
async function step(page: Page, id: string, text: string | RegExp, target?: string, timeout = 5000) {
  await expect(balloon(page)).toContainText(text, { timeout });
  await expect.poll(async () => (await tourState(page)).stepId).toBe(id);
  if (!target) return;
  await expect(page.locator('.tt-ring')).toHaveCount(1);
  await expect(page.locator(target).first()).toBeVisible();
}

const next = (page: Page) =>
  balloon(page)
    .getByRole('button', { name: /^(Próximo|Concluir)$/ })
    .click();

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

/** A tela limpa, de volta aos dados da pessoa: sem véu, sem balão, sem exemplo e sem a faixa. */
async function backToPerson(page: Page, path: RegExp) {
  await expect(balloon(page)).toHaveCount(0);
  await expect(page.locator('.tt-veil-layer')).toHaveCount(0);
  await expect(banner(page)).toHaveCount(0);
  await expect.poll(() => exampleOn(page)).toBe(false);
  await expect(page).toHaveURL(path);
  expect(await tourState(page)).toMatchObject({ run: null, practice: false, veil: 'none' });
}

/** O estado do tutorial e as marcas da caminhada guardados no aparelho (a demonstração da pessoa). */
async function saved(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('prokope-local-demo', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    type Row = { path: string; col: string; id: string; data: Record<string, unknown> };
    const rows = await new Promise<Row[]>((resolve) => {
      const r = db.transaction('docs').objectStore('docs').getAll();
      r.onsuccess = () => resolve(r.result as Row[]);
    });
    db.close();
    const walk = rows.find((r) => r.col === 'habits' && r.data.name === 'Caminhada com o cachorro');
    const marks: Record<string, string> = {};
    for (const r of rows) {
      if (r.col === 'marks' && walk && r.data.habitId === walk.id)
        marks[r.data.day as string] = r.data.status as string;
    }
    const profile = rows.find((r) => r.col === 'profile');
    return {
      walkId: walk?.id ?? null,
      habits: rows.filter((r) => r.col === 'habits').length,
      marks,
      tutorial: (profile?.data.tutorial ?? {}) as { done?: Record<string, number>; offered?: Record<string, number> },
    };
  });
}

test.describe('tutorial · capítulos', () => {
  test('"O hábito e os padrões": do começo ao fim no exemplo, e a pessoa volta para os dados dela', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await enterDemo(page);
    await zenoOff(page);
    // a pessoa marca a caminhada de hoje antes do capítulo
    const walk = page.getByRole('checkbox', { name: /^Caminhada/ });
    await walk.click();
    await expect(walk).toHaveAttribute('aria-checked', 'true');
    await expect.poll(async () => (await saved(page)).marks['2026-10-22']).toBe('done');
    const before = await saved(page);
    expect(before.marks['2026-10-01']).toBe('done');

    await startFromSettings(page, /^O hábito e os padrões/);
    // a caminhada do exemplo: outra tela, com a faixa
    await expect(page).toHaveURL(/\/hoje\/habito\/[^/]+$/);
    expect(page.url()).not.toContain(before.walkId!);
    await expect(banner(page)).toBeVisible();
    await step(page, 'topo', 'Cada hábito tem uma tela assim.', '[data-tour="habito-topo"]');
    expect((await tourState(page)).counter).toBe('1 de 8');
    await axe(page);
    await next(page);
    await step(
      page,
      'forca',
      'A força do hábito cresce com a constância e cai devagar. Um dia sem não zera nada.',
      '[data-tour="habito-numeros"]',
    );
    await next(page);
    await step(
      page,
      'calendario',
      'cheio é feito, meio cheio é parcial e pontilhado é fora da agenda',
      '[data-tour="habito-calendario"]',
    );
    await next(page);

    // passo de fazer: só o calendário responde, e um dia por vir não anda o passo
    await step(page, 'dia', 'Toque num dia que passou para corrigir.', '[data-tour="habito-calendario"]');
    expect((await tourState(page)).veil).toBe('do');
    await expect(balloon(page).getByRole('button', { name: /Próximo|Concluir/ })).toHaveCount(0);
    expect(await hitAt(page, '[role="tab"][aria-selected="false"]')).toBe('véu');
    await page.getByRole('img', { name: /^30 de outubro/ }).click();
    await page.waitForTimeout(300);
    expect((await tourState(page)).stepId).toBe('dia');
    await page.getByRole('button', { name: /^1 de outubro,/ }).click();

    // na folha de corrigir: escolher grava no exemplo e o passo responde
    await step(page, 'corrigir', 'Escolha como foi esse dia.', '[data-tour="habito-corrigir"]');
    await axe(page);
    await page.getByRole('radio', { name: /Sem caminhada/ }).click();
    await expect(balloon(page)).toContainText('Isso. É assim que se corrige um dia.');
    await expect(page.getByRole('button', { name: /^1 de outubro, sem caminhada/ })).toBeVisible();

    await step(
      page,
      'padroes',
      'Aqui o app compara os dias com e sem este hábito.',
      '[data-tour="habito-padroes"] > *',
    );
    await expect(balloon(page)).toContainText('compara os dias no horário com os outros');
    await next(page);
    await step(page, 'menu', 'No ⋯ fica o menu: editar o hábito ou tirar só de hoje.', '[data-tour="habito-menu"]');
    await next(page);
    await step(page, 'pausar', 'você pausa o hábito por uns dias ou arquiva', '[data-tour="habito-pausar"] > *');
    await expect(balloon(page).getByRole('button', { name: 'Concluir' })).toBeVisible();
    await next(page);

    // de volta ao Hoje, com os dados da pessoa: a marca dela continua, e o dia corrigido no exemplo não veio junto
    await backToPerson(page, /\/hoje$/);
    const after = await saved(page);
    expect(after.marks['2026-10-22']).toBe('done');
    expect(after.marks['2026-10-01']).toBe('done');
    expect(after.habits).toBe(before.habits);
    expect(after.tutorial.done?.habito).toBeGreaterThan(0);
    await go(page, '/ajustes/tutorial');
    await expect(page.getByRole('button', { name: /^O hábito e os padrões/ })).toContainText('Visto');
  });

  test('"O progresso": a semana, o período, os pilares, os dados, o humor e as medidas', async ({ page }) => {
    test.setTimeout(90_000);
    await enterDemo(page);
    await zenoOff(page);
    await startFromSettings(page, /^O progresso/);
    await expect(page).toHaveURL(/\/progresso/);
    await expect(banner(page)).toBeVisible();
    await step(page, 'semana', 'No anel, a constância da semana.', '[data-tour="progresso-semana"]');
    await expect(balloon(page)).toContainText('Tocar na semana passada abre a revisão dela.');
    expect((await tourState(page)).counter).toBe('1 de 9');
    await axe(page);
    await next(page);

    // trocar o período: a seta anda o passo; voltar para esta semana também
    await step(
      page,
      'periodo',
      'Para ver a semana anterior, toque na seta ‹ do período.',
      '[data-tour="progresso-periodo"]',
    );
    expect((await tourState(page)).veil).toBe('do');
    await page.getByRole('button', { name: 'Período anterior' }).click();
    await expect(balloon(page)).toContainText('Isso. A tela toda acompanha o período.');
    await expect(page.getByRole('group', { name: 'Período' })).toContainText('semana passada');
    await step(page, 'voltar', 'Para voltar, toque em "Voltar para esta semana".', '[data-tour="progresso-agora"]');
    await page.getByRole('button', { name: 'Voltar para esta semana' }).click();
    await step(page, 'pilares', 'Os pilares ficam do maior para o menor.', '[data-tour="progresso-pilares"]');
    await expect(page.getByRole('group', { name: 'Período' })).toContainText('esta semana');
    await next(page);
    await step(page, 'dados', 'o app compara os dias com e sem um hábito', '[data-tour="progresso-dados"]');
    await next(page);

    // os chips: Humor e Medidas
    await step(page, 'aba-humor', 'Toque em Humor.', '[data-tour="progresso-aba-humor"]');
    expect(await hitAt(page, '[data-tour="progresso-aba-medidas"]')).toBe('véu');
    await page.locator('[data-tour="progresso-aba-humor"]').click();
    await step(page, 'humor', 'Cada dia mostra o humor do check-in da noite.', '[data-tour="progresso-humor"]');
    await expect(page.locator('[data-tour="progresso-aba-humor"]')).toHaveAttribute('aria-pressed', 'true');
    await next(page);
    await step(page, 'aba-medidas', 'Agora toque em Medidas.', '[data-tour="progresso-aba-medidas"]');
    await page.locator('[data-tour="progresso-aba-medidas"]').click();
    await step(page, 'medidas', 'Aqui ficam o peso e a média de 7 dias.', '[data-tour="progresso-peso"]');
    await expect(balloon(page)).toContainText('Para ver só a tendência');
    await next(page);

    // de volta à visão geral desta semana, com os dados da pessoa
    await backToPerson(page, /\/progresso$/);
    await expect(page.locator('[data-chip="overview"]')).toHaveAttribute('aria-pressed', 'true');
    expect((await saved(page)).tutorial.done?.progresso).toBeGreaterThan(0);
  });

  test('"A jornada": as fases, Editar jornada, o treino guiado com o plano e as revisões', async ({ page }) => {
    test.setTimeout(90_000);
    await enterDemo(page);
    await zenoOff(page);
    await startFromSettings(page, /^A jornada/);
    await expect(page).toHaveURL(/\/jornada$/);
    await expect(banner(page)).toBeVisible();
    // sem os Primeiros passos na demonstração, o passo deles fica de fora da conta
    await step(page, 'caminho', 'Este é o caminho das fases', '[data-tour="jornada-caminho"]');
    expect((await tourState(page)).counter).toBe('1 de 7');
    await next(page);
    await step(page, 'agora', 'A fase de agora mostra as semanas e os hábitos novos.', '[data-tour="jornada-agora"]');
    await axe(page);
    await next(page);
    await step(page, 'proxima', 'a revisão sugere avançar. Você decide.', '[data-tour="jornada-proxima"]');
    await next(page);
    await step(page, 'editar', 'Em Editar jornada você muda as datas', '[data-tour="jornada-editar"]');
    await next(page);
    await step(page, 'treino', 'Este é um treino guiado: um plano em semanas', '[data-tour="jornada-treino"]');
    await page.locator('[data-tour="jornada-treino"]').click();
    await expect(page).toHaveURL(/\/jornada\/treino\/[^/]+$/);
    await step(page, 'plano', 'Este é o treino da semana, bloco a bloco.', '[data-tour="treino-semana"]');
    await next(page);
    await step(page, 'revisoes', 'As que passaram ficam aqui, só para ler.', '[data-tour="jornada-revisoes"] > *');
    await expect(page).toHaveURL(/\/jornada$/);
    await next(page);
    await backToPerson(page, /\/jornada$/);
    expect((await saved(page)).tutorial.done?.jornada).toBeGreaterThan(0);
  });

  test('"Os ajustes": só apontando, nos dados da pessoa, e o último passo abre o Tutorial', async ({ page }) => {
    test.setTimeout(90_000);
    await enterDemo(page);
    await zenoOff(page);
    const before = await saved(page);
    await startFromSettings(page, /^Os ajustes/);
    await expect(page).toHaveURL(/\/ajustes$/);
    // os dados da pessoa: sem exemplo
    await expect(banner(page)).toHaveCount(0);
    await step(page, 'plano', 'Em Meu plano ficam os seus hábitos e pilares.', '[data-tour="ajustes-plano"] > *');
    await expect(balloon(page)).toContainText('"Também conta em"');
    expect((await tourState(page)).counter).toBe('1 de 8');
    await axe(page);
    await next(page);
    await step(page, 'novo-habito', 'Um dos tipos é o Treino guiado', '[data-tour="ajustes-novo-habito"]');
    await expect(page).toHaveURL(/\/ajustes\/habitos$/);
    await next(page);
    await step(page, 'pausar', 'Em Pausar, você pausa o app ou alguns hábitos', '[data-tour="ajustes-pausar"]');
    await expect(page).toHaveURL(/\/ajustes$/);
    await next(page);
    await step(page, 'rotina', 'Em Horários ficam as horas que guiam o seu dia.', '[data-tour="ajustes-rotina"] > *');
    await next(page);
    await step(page, 'aparencia', 'o jeito de ver o Hoje e "Mostrar o Zeno"', '[data-tour="ajustes-aparencia"]');
    await next(page);
    await step(page, 'a-dois', 'Em A dois, você liga o app com outra pessoa', '[data-tour="ajustes-a-dois"]');
    await next(page);
    await step(page, 'conta', 'No seu nome ficam os dados e a conta', '[data-tour="ajustes-conta"] > *');
    await next(page);
    await step(page, 'tutorial', 'E em Tutorial ficam todos os capítulos', '[data-tour="ajustes-tutorial"]');
    expect((await tourState(page)).veil).toBe('do');
    expect(await hitAt(page, '[data-tour="ajustes-tutorial"] button')).toBe('alvo');
    expect(await hitAt(page, '[data-tour="ajustes-a-dois"] button')).toBe('véu');
    await page.locator('[data-tour="ajustes-tutorial"] button').click();
    await expect(page).toHaveURL(/\/ajustes\/tutorial$/);
    await expect(balloon(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Os ajustes/ })).toContainText('Visto');
    // nada mudou nos dados (só o capítulo visto)
    expect((await saved(page)).habits).toBe(before.habits);
  });

  test('sair no meio de um capítulo com exemplo: na raiz da aba, sem exemplo, sem folha e sem gravar', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await enterDemo(page);
    await zenoOff(page);
    // no meio do hábito, com a folha de corrigir aberta
    await startFromSettings(page, /^O hábito e os padrões/);
    await step(page, 'topo', 'Cada hábito tem uma tela assim.', '[data-tour="habito-topo"]');
    await next(page);
    await next(page);
    await next(page);
    await step(page, 'dia', 'Toque num dia que passou para corrigir.');
    await page.getByRole('button', { name: /^1 de outubro,/ }).click();
    await step(page, 'corrigir', 'Escolha como foi esse dia.', '[data-tour="habito-corrigir"]');
    await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    await backToPerson(page, /\/hoje$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // no meio da jornada, no plano do treino do exemplo
    await startFromSettings(page, /^A jornada/);
    await step(page, 'caminho', 'Este é o caminho das fases');
    for (let i = 0; i < 4; i++) await next(page);
    await step(page, 'treino', 'Este é um treino guiado');
    await page.locator('[data-tour="jornada-treino"]').click();
    await step(page, 'plano', 'Este é o treino da semana, bloco a bloco.');
    await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    await backToPerson(page, /\/jornada$/);

    // nada ficou como visto
    const t = (await saved(page)).tutorial;
    expect(t.done?.habito).toBeUndefined();
    expect(t.done?.jornada).toBeUndefined();
  });

  test('as ofertas de cada aba começam o capítulo certo, e "O hábito" abre o hábito do exemplo', async ({ page }) => {
    // cada oferta espera a tela assentar; o Zeno fica ligado (nada é oferecido sem ele)
    test.setTimeout(120_000);
    await page.addInitScript(() => localStorage.setItem('pk-tour-auto', 'on'));
    await enterDemo(page);
    await expect(balloon(page)).toContainText('Oi, eu sou o Zeno.', { timeout: 6000 });
    await balloon(page).getByRole('button', { name: 'Agora não' }).click();
    await expect(balloon(page)).toHaveCount(0, { timeout: 6000 });
    const person = await saved(page);

    // "O hábito", na tela de um hábito da pessoa: o capítulo volta ao Hoje e abre a caminhada do exemplo
    await page.getByRole('button', { name: /^Caminhada com o cachorro.*Abre o hábito/ }).click();
    await expect(page).toHaveURL(new RegExp(`/hoje/habito/${person.walkId}$`));
    await expect(balloon(page)).toContainText('Quer que eu mostre o hábito e os padrões?', { timeout: 6000 });
    await balloon(page).getByRole('button', { name: 'Mostrar' }).click();
    await step(page, 'topo', 'Cada hábito tem uma tela assim.', '[data-tour="habito-topo"]', 12_000);
    await expect(page).toHaveURL(/\/hoje\/habito\/[^/]+$/);
    expect(page.url()).not.toContain(person.walkId!);
    await expect(page.getByText('Este hábito não existe mais.')).toHaveCount(0);
    await expect(banner(page)).toBeVisible();
    await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
    await backToPerson(page, /\/hoje$/);

    // Progresso, Jornada e Ajustes: "Mostrar" começa o primeiro passo de cada um
    const tabs = [
      {
        tab: 'Progresso',
        ask: 'Quer que eu mostre o Progresso?',
        id: 'semana',
        text: 'No anel, a constância da semana.',
        path: /\/progresso$/,
      },
      {
        tab: 'Jornada',
        ask: 'Quer que eu mostre a Jornada?',
        id: 'caminho',
        text: 'Este é o caminho das fases',
        path: /\/jornada$/,
      },
      {
        tab: 'Ajustes',
        ask: 'Quer que eu mostre os Ajustes?',
        id: 'plano',
        text: 'Em Meu plano ficam os seus hábitos e pilares.',
        path: /\/ajustes$/,
      },
    ];
    for (const t of tabs) {
      await page.getByRole('tab', { name: t.tab }).click();
      await expect(balloon(page)).toContainText(t.ask, { timeout: 6000 });
      await balloon(page).getByRole('button', { name: 'Mostrar' }).click();
      await step(page, t.id, t.text, undefined, 12_000);
      await balloon(page).getByRole('button', { name: 'Sair do tutorial' }).click();
      await backToPerson(page, t.path);
    }
    const offered = (await saved(page)).tutorial.offered ?? {};
    for (const ch of ['habito', 'progresso', 'jornada', 'ajustes']) expect(offered[ch]).toBeGreaterThan(0);
  });
});
