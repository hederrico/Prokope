import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Jornada, corrida e Revisão da semana no tamanho do iPhone, sobre o modo demonstração.
// A demonstração é semeada na quinta da história (22 out). A revisão de fim da fase 2 cai no domingo, 1 nov:
// os testes da revisão abrem a semana de 26 out com ?agora=2026-11-01T18:30 sobre os mesmos dados.

// (window.__pkShell está declarado em tests/e2e/global.d.ts)

/** Entra na demonstração com a hora fixada (?agora=), ou com o relógio de verdade (null: a corrida precisa do tempo andando). */
async function enterDemo(page: Page, agora: string | null = '2026-10-22T12:48') {
  await page.goto(agora ? `/entrar?agora=${agora}` : '/entrar');
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje/);
}

async function go(page: Page, to: string) {
  await page.evaluate((to) => window.__pkShell.navigate(to), to);
}

/** Espera a passagem assentar (a mola calma leva cerca de 350 ms). */
async function settle(page: Page) {
  await page.waitForTimeout(650);
}

/** "Tempo total 1:05 · ..." → 65. */
async function totalSeconds(page: Page): Promise<number> {
  const text = (await page.locator('.rn-b p').textContent()) ?? '';
  const m = /(\d+):(\d{2})/.exec(text);
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
}

test.describe('jornada', () => {
  test('caminho das fases, Editar jornada, plano de corrida e revisão passada', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('tab', { name: 'Jornada' }).click();
    await expect(page).toHaveURL(/\/jornada$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Jornada' })).toBeVisible();

    // as 4 fases, com a atual descrita por inteiro
    const path = page.getByRole('list', { name: 'Fases' });
    await expect(path.getByRole('listitem')).toHaveCount(4);
    await expect(page.getByRole('button', { name: /Fase 2, Alimentação, agora, semana 2 de 3/ })).toBeVisible();
    await expect(page.getByText('12 out – 1 nov')).toBeVisible();

    // uma fase futura abre Editar jornada rolada até ela
    await page.getByRole('button', { name: /Fase 3, Movimento/ }).click();
    await expect(page).toHaveURL(/\/jornada\/fases#fase-3$/);
    await settle(page);
    await expect(page.getByRole('group', { name: 'Fase 3, Movimento' })).toBeInViewport();
    await page.getByRole('button', { name: 'Voltar para Jornada' }).click();
    await expect(page).toHaveURL(/\/jornada$/);
    await settle(page);

    // o cartão do treino guiado (a corrida do modelo): as 13 semanas, sem "Começar treino" antes da fase 3
    await page.getByRole('button', { name: /^Corrida, plano de treino/ }).click();
    await expect(page).toHaveURL(/\/jornada\/treino\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Corrida' })).toBeVisible();
    await expect(page.getByText(/^Do zero aos 30 minutos\. 13 semanas, 2 treinos por semana/)).toBeVisible();
    await expect(page.locator('.jr-wr')).toHaveCount(13);
    await expect(page.getByText('a partir de 2 nov')).toBeVisible();
    await expect(page.getByRole('button', { name: /Começar treino/ })).toHaveCount(0);
    // outra semana troca o cartão do treino
    await page.getByRole('button', { name: /^Semana 13:/ }).click();
    await expect(page.getByRole('heading', { name: /Semana 13 · o treino/ })).toBeVisible();
    await expect(page.getByRole('list', { name: /^Semana 13: correr 30 minutos sem parar/ })).toBeVisible();
    await page.getByRole('button', { name: 'Voltar para Jornada' }).click();
    await settle(page);
    // a rota antiga do plano de corrida leva ao plano da corrida
    await go(page, '/jornada/corrida');
    await expect(page).toHaveURL(/\/jornada\/treino\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Corrida' })).toBeVisible();
    await page.getByRole('button', { name: 'Voltar para Jornada' }).click();
    await settle(page);

    // revisão passada: só leitura
    await page.getByRole('button', { name: /Domingo, 11 out/ }).click();
    await expect(page).toHaveURL(/\/jornada\/revisoes\/2026-10-11$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Domingo, 11 de outubro' })).toBeVisible();
    await expect(page.getByText(/fim da fase 1/)).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });

  test('Editar jornada: sugestão para avançar, as duas partes de cada fase e mover um hábito', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('tab', { name: 'Jornada' }).click();
    await page.getByRole('button', { name: 'Editar jornada', exact: true }).click();
    await expect(page).toHaveURL(/\/jornada\/fases$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Editar jornada' })).toBeVisible();

    await page.getByRole('button', { name: /Sugerir a próxima fase/ }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await sheet.getByRole('radio', { name: /^60%/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Sugerir a próxima fase.*60%/ })).toBeVisible();

    // a fase 1 (a primeira, concluída) só tem o resumo; a 2 tem "Continuam" (recolhida, com a contagem) e "Novos"
    const phase1 = page.getByRole('group', { name: 'Fase 1, Base' });
    await expect(phase1.getByText('7 hábitos')).toBeVisible();
    await expect(phase1.getByRole('heading', { name: /Continuam/ })).toHaveCount(0);
    const phase2 = page.getByRole('group', { name: 'Fase 2, Alimentação' });
    await expect(phase2.getByRole('heading', { name: /Continuam das fases anteriores/ })).toBeVisible();
    await expect(phase2.getByText('Os hábitos das fases anteriores seguem com você.')).toBeVisible();
    const fold = phase2.getByRole('button', { name: /10 hábitos da fase 1/ });
    await expect(fold).toHaveAttribute('aria-expanded', 'false');
    await expect(phase2.getByRole('list', { name: 'Novos nesta fase' }).getByRole('listitem')).toHaveCount(6);
    await fold.click();
    const carried = phase2.getByRole('list', { name: 'Continuam das fases anteriores' });
    await expect(carried.getByRole('button', { name: /^Peso, da fase 1\./ })).toBeVisible();
    // acordar e deitar são uma linha só, como no plano
    await expect(carried.getByRole('button', { name: /^Acordar e deitar, da fase 1\./ })).toBeVisible();

    // mover: o menu da linha leva ao Mover para
    const phase4 = page.getByRole('group', { name: 'Fase 4, Profundidade' });
    await phase4.getByRole('list', { name: 'Novos nesta fase' }).getByRole('button', { name: /^Pequeno gesto/ }).click();
    const menu = page.getByRole('dialog', { name: 'Pequeno gesto, opções' });
    await expect(menu.getByRole('button', { name: /Tirar da fase/ })).toBeVisible();
    await menu.getByRole('button', { name: /Mover para outra fase/ }).click();
    await page.getByRole('dialog', { name: 'Mover para' }).getByRole('radio', { name: /Fase 3 · Movimento/ }).click();
    await expect(page.getByText('Pequeno gesto movido para a fase 3')).toBeVisible();
    const phase3 = page.getByRole('group', { name: 'Fase 3, Movimento' });
    await expect(phase3.getByRole('list', { name: 'Novos nesta fase' }).getByRole('button', { name: /^Pequeno gesto/ })).toBeVisible();
    await expect(phase4.getByRole('list', { name: 'Novos nesta fase' }).getByRole('button', { name: /^Pequeno gesto/ })).toHaveCount(0);
  });

  test('Editar jornada: parar nesta fase, desfazer e voltar a seguir', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/jornada/fases');
    const phase3 = page.getByRole('group', { name: 'Fase 3, Movimento' });
    await phase3.getByRole('button', { name: /16 hábitos das fases 1 e 2/ }).click();
    const carried = phase3.getByRole('list', { name: 'Continuam das fases anteriores' });

    // o peso diário para na fase 3: até lá, tudo segue igual
    await carried.getByRole('button', { name: /^Peso, da fase 1\./ }).click();
    const menu = page.getByRole('dialog', { name: 'Peso, opções' });
    await expect(menu.getByRole('button', { name: /Parar nesta fase.*quando a fase 3 começar/ })).toBeVisible();
    await menu.getByRole('button', { name: /Parar nesta fase/ }).click();
    const toast = page.locator('.sh-toast').filter({ hasText: 'Peso para na fase 3' });
    await expect(toast).toBeVisible();
    await expect(carried.getByRole('button', { name: /^Peso, da fase 1 · para nesta fase\./ })).toBeVisible();
    // na fase 4 ele não continua mais
    const phase4 = page.getByRole('group', { name: 'Fase 4, Profundidade' });
    await expect(phase4.getByRole('button', { name: /18 hábitos das fases 1, 2 e 3/ })).toBeVisible();
    await toast.getByRole('button', { name: 'Desfazer' }).click();
    await expect(carried.getByRole('button', { name: /^Peso, da fase 1\./ })).toBeVisible();
    await expect(phase4.getByRole('button', { name: /19 hábitos/ })).toBeVisible();

    // de novo, e depois "Voltar a seguir" no mesmo lugar
    await carried.getByRole('button', { name: /^Peso, da fase 1\./ }).click();
    await page.getByRole('dialog', { name: 'Peso, opções' }).getByRole('button', { name: /Parar nesta fase/ }).click();
    await expect(carried.getByRole('button', { name: /para nesta fase/ })).toBeVisible();
    await carried.getByRole('button', { name: /^Peso, da fase 1 · para nesta fase/ }).click();
    await page.getByRole('dialog', { name: 'Peso, opções' }).getByRole('button', { name: /Voltar a seguir/ }).click();
    await expect(page.locator('.sh-toast').filter({ hasText: 'Peso volta a seguir' })).toBeVisible();
    await expect(carried.getByRole('button', { name: /^Peso, da fase 1\./ })).toBeVisible();
  });

  test('Editar jornada: parar na fase de agora tira do Hoje a partir de hoje', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/jornada/fases');
    const phase2 = page.getByRole('group', { name: 'Fase 2, Alimentação' });
    await phase2.getByRole('button', { name: /10 hábitos da fase 1/ }).click();
    await phase2.getByRole('button', { name: /^Louça, da fase 1\./ }).click();
    const menu = page.getByRole('dialog', { name: 'Louça, opções' });
    await expect(menu.getByRole('button', { name: /Parar nesta fase.*a partir de hoje/ })).toBeVisible();
    await menu.getByRole('button', { name: /Parar nesta fase/ }).click();
    await expect(page.locator('.sh-toast').filter({ hasText: 'Louça sai do dia a dia hoje' })).toBeVisible();
    await expect(phase2.getByRole('button', { name: /^Louça, da fase 1 · sai do dia a dia hoje/ })).toBeVisible();
    // o Hoje não tem mais a louça (nem na Noite recolhida)
    await page.getByRole('tab', { name: 'Hoje' }).click();
    await expect(page).toHaveURL(/\/hoje/);
    const hoje = page.locator('[data-screen="/hoje"]');
    await expect(hoje.getByText(/lixo/i).first()).toBeVisible();
    await expect(hoje.getByText(/louça/i)).toHaveCount(0);
    // em Ajustes, aparece com os arquivados (os dias antes ficam no histórico)
    await go(page, '/ajustes/habitos?ver=arquivados');
    await expect(page.getByRole('button', { name: /^Louça\./ })).toBeVisible();
  });

  test('Editar jornada: adicionar (trazer de outra fase e criar um novo nesta fase)', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/jornada/fases');
    const phase3 = page.getByRole('group', { name: 'Fase 3, Movimento' });

    // trazer da fase 4, com Desfazer
    await phase3.getByRole('button', { name: 'Adicionar hábito' }).click();
    const add = page.getByRole('dialog', { name: 'Adicionar à fase 3' });
    await expect(add.getByRole('button', { name: /Criar hábito novo nesta fase/ })).toBeVisible();
    await add.getByRole('button', { name: /^Ritual do sono/ }).click();
    const toast = page.locator('.sh-toast').filter({ hasText: 'Ritual do sono movido para a fase 3' });
    await expect(toast).toBeVisible();
    await expect(phase3.getByRole('list', { name: 'Novos nesta fase' }).getByRole('button', { name: /^Ritual do sono/ })).toBeVisible();
    await toast.getByRole('button', { name: 'Desfazer' }).click();
    await expect(phase3.getByRole('list', { name: 'Novos nesta fase' }).getByRole('button', { name: /^Ritual do sono/ })).toHaveCount(0);

    // criar um novo: o Novo hábito já chega com a fase escolhida e volta para Editar jornada
    await phase3.getByRole('button', { name: 'Adicionar hábito' }).click();
    await page.getByRole('dialog', { name: 'Adicionar à fase 3' }).getByRole('button', { name: /Criar hábito novo nesta fase/ }).click();
    await expect(page).toHaveURL(/\/ajustes\/habitos\/novo\/tipo\?fase=3$/);
    await page.getByRole('button', { name: /^Sim ou não/ }).click();
    await expect(page).toHaveURL(/novo\/detalhes\?tipo=check&fase=3$/);
    await expect(page.getByRole('button', { name: /Começa.*Na fase 3/ })).toBeVisible();
    await page.getByRole('textbox', { name: 'Nome' }).fill('Alongar');
    await page.getByRole('button', { name: 'Criar' }).click();
    await expect(page).toHaveURL(/\/jornada\/fases/);
    await expect(page.getByText(/Alongar entra na fase 3/)).toBeVisible();
    await expect(
      page.getByRole('group', { name: 'Fase 3, Movimento' }).getByRole('list', { name: 'Novos nesta fase' }).getByRole('button', { name: /^Alongar/ }),
    ).toBeVisible();
  });

  test('Editar jornada: tirar da fase e arquivar, com Desfazer', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/jornada/fases');
    const phase2 = page.getByRole('group', { name: 'Fase 2, Alimentação' });
    await phase2.getByRole('button', { name: /^Refeições livres/ }).click();
    await page.getByRole('dialog', { name: 'Refeições livres, opções' }).getByRole('button', { name: /Tirar da fase.*Continua no dia a dia/ }).click();
    await expect(page.locator('.sh-toast').filter({ hasText: 'Refeições livres seguem sem fase' })).toBeVisible();
    const loose = page.getByRole('list', { name: 'Hábitos sem fase' });
    await expect(loose.getByRole('button', { name: /^Refeições livres/ })).toBeVisible();
    await expect(phase2.getByRole('button', { name: /^Refeições livres/ })).toHaveCount(0);

    await loose.getByRole('button', { name: /^Futebol/ }).click();
    await page.getByRole('dialog', { name: 'Futebol, opções' }).getByRole('button', { name: /^Arquivar/ }).click();
    const toast = page.locator('.sh-toast').filter({ hasText: 'Futebol arquivado' });
    await expect(toast).toBeVisible();
    await expect(loose.getByRole('button', { name: /^Futebol/ })).toHaveCount(0);
    await toast.getByRole('button', { name: 'Desfazer' }).click();
    await expect(loose.getByRole('button', { name: /^Futebol/ })).toBeVisible();
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Editar jornada: acessibilidade no tema ${colorScheme === 'light' ? 'claro' : 'escuro'}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await enterDemo(page);
      await go(page, '/jornada/fases');
      const phase2 = page.getByRole('group', { name: 'Fase 2, Alimentação' });
      await phase2.getByRole('button', { name: /10 hábitos da fase 1/ }).click();
      await settle(page);
      const axe = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);
      const screen = await axe().include('[data-screen="/jornada/fases"]').analyze();
      expect(screen.violations).toEqual([]);
      await phase2.getByRole('button', { name: 'Adicionar hábito' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await settle(page);
      const add = await axe().include('[role="dialog"]').analyze();
      expect(add.violations).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await phase2.getByRole('button', { name: /^Peso, da fase 1\./ }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await settle(page);
      const menu = await axe().include('[role="dialog"]').analyze();
      expect(menu.violations).toEqual([]);
    });
  }

  test('corrida: começa, pausa, sobrevive a recarregar e encerra com toque longo', async ({ page }) => {
    // espera de verdade pelo relógio (pausa, recarregar e o toque longo)
    test.setTimeout(60_000);
    await enterDemo(page, null);
    // a rota antiga continua abrindo o treino do primeiro treino guiado (a corrida)
    await go(page, '/corrida/1/1');
    await expect(page.getByRole('heading', { name: 'Semana 1 · treino 1' })).toBeVisible();
    await expect(page.locator('.rn-state')).toHaveText('Aquecimento');
    await expect(page.getByRole('timer')).toBeVisible();
    await expect(page.locator('.rn-next')).toContainText('Depois: correr');

    // pausar e continuar
    await page.getByRole('button', { name: 'Pausar treino' }).click();
    await expect(page.locator('.rn-left')).toHaveText('pausado');
    await page.getByRole('button', { name: 'Continuar treino' }).click();
    await expect(page.locator('.rn-left')).toHaveText('faltam');

    // o tempo vem da hora de início: recarregar não recomeça o treino
    await page.waitForTimeout(2200);
    const before = await totalSeconds(page);
    expect(before).toBeGreaterThanOrEqual(1);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Semana 1 · treino 1' })).toBeVisible();
    await expect.poll(() => totalSeconds(page)).toBeGreaterThanOrEqual(before);

    // som nas trocas: interruptor
    const sound = page.getByRole('switch', { name: 'Som nas trocas' });
    await expect(sound).toHaveAttribute('aria-checked', 'true');
    await sound.click();
    await expect(sound).toHaveAttribute('aria-checked', 'false');

    // toque curto não encerra
    const stop = page.getByRole('button', { name: 'Encerrar treino, segure' });
    await stop.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // toque longo de 800 ms abre a folha
    const box = await stop.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1000);
    await page.mouse.up();
    const sheet = page.getByRole('dialog', { name: 'Encerrar o treino?' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Salvar o que fiz' }).click();
    await expect(page).toHaveURL(/\/corrida\/1\/1\/feito$/);
    await expect(page.getByRole('heading', { name: 'Treino feito' })).toBeVisible();
    await expect(page.getByText('Semana 1 · treino 1 de 2')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar ao dia' }).click();
    await expect(page).toHaveURL(/\/hoje/);
  });

  test('treino guiado de pedalar: criar com 2 semanas, ver na Jornada e fazer um treino', async ({ page }) => {
    await enterDemo(page, '2026-10-22T07:05');
    await go(page, '/ajustes/habitos/novo/tipo');
    await page.getByRole('button', { name: /^Treino guiado/ }).click();
    await expect(page).toHaveURL(/novo\/detalhes\?tipo=guided/);
    await page.getByRole('textbox', { name: 'Nome' }).fill('Bicicleta');
    // os nomes do esforço e do descanso (padrão: correr e caminhar)
    await page.getByRole('button', { name: /^Esforço, Correr/ }).click();
    await page.getByRole('textbox', { name: 'Nome do esforço' }).fill('Pedalar');
    await page.getByRole('dialog').getByRole('button', { name: 'Pronto' }).click();
    await page.getByRole('button', { name: /^Descanso, Caminhar/ }).click();
    await page.getByRole('textbox', { name: 'Nome do descanso' }).fill('Pedalar leve');
    await page.getByRole('dialog').getByRole('button', { name: 'Pronto' }).click();
    await expect(page.getByRole('button', { name: /^Descanso, Pedalar leve/ })).toBeVisible();

    // o plano começa no modelo da corrida (13 semanas); monta do zero, com 2 semanas
    await page.getByRole('button', { name: /^Plano, 13 semanas/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Plano', exact: true })).toBeVisible();
    const weeks = page.getByRole('list', { name: 'Semanas do plano' }).getByRole('listitem');
    await expect(weeks).toHaveCount(13);
    await page.getByRole('button', { name: /Começar de um modelo/ }).click();
    await page.getByRole('radio', { name: /Montar do zero/ }).click();
    await expect(weeks).toHaveCount(1);
    await page.getByRole('button', { name: 'Adicionar semana' }).click();
    const week2 = page.getByRole('dialog', { name: 'Semana 2' });
    await expect(week2).toBeVisible();
    await week2.getByRole('radio', { name: 'Contínuo' }).click();
    await expect(week2.getByText('pedalar sem parar')).toBeVisible();
    await week2.getByRole('button', { name: 'Aumentar pedalar' }).click();
    await week2.getByRole('button', { name: 'Pronto' }).click();
    await expect(weeks).toHaveCount(2);
    await expect(page.getByRole('button', { name: /^Semana 2: pedalar 11 minutos sem parar/ })).toBeVisible();
    await page.getByRole('button', { name: 'Voltar para Novo hábito' }).click();
    await expect(page.getByRole('button', { name: /^Plano, 2 semanas/ })).toBeVisible();
    await page.getByRole('button', { name: 'Criar' }).click();
    await expect(page).toHaveURL(/\/ajustes\/habitos$/);

    // a Jornada ganha um cartão, ao lado do da corrida
    await go(page, '/jornada');
    await expect(page.getByRole('button', { name: /^Corrida, plano de treino/ })).toBeVisible();
    const card = page.getByRole('button', { name: /^Bicicleta, plano de treino/ });
    await expect(card).toContainText('Semana 1 · treino 1 de 2 · 2 semanas');
    await card.click();
    await expect(page).toHaveURL(/\/jornada\/treino\/[^/]+$/);
    await expect(page.locator('.jr-wr')).toHaveCount(2);
    await expect(page.locator('.jr-leg')).toContainText('Pedalar leve');

    // o treino: os blocos e os nomes do plano
    await page.getByRole('button', { name: /Começar treino/ }).click();
    await expect(page).toHaveURL(/\/treino\/[^/]+\/1\/1$/);
    await expect(page.locator('.rn-state')).toHaveText('Aquecimento');
    await expect(page.locator('.rn-next')).toContainText('Depois: pedalar');
    // a hora pula para depois do fim (5 + 5 × (2 + 1) + 5 = 25 min): ao abrir, o treino terminou na hora prevista
    const path = new URL(page.url()).pathname;
    await page.goto(`${path}?agora=2026-10-22T07:40`);
    await expect(page).toHaveURL(/\/feito$/);
    await expect(page.getByRole('heading', { name: 'Treino feito' })).toBeVisible();
    await expect(page.getByText('Semana 1 · treino 1 de 2')).toBeVisible();
    await expect(page.locator('#rn-done-sum')).toHaveText('25 minutos, 5 de 5 intervalos');
    // os números do treino com os nomes do plano
    await expect(page.getByText('Pedalar leve', { exact: true })).toBeVisible();

    // de volta à Jornada, o cartão anda para o treino 2
    await go(page, '/jornada');
    const next = page.getByRole('button', { name: /^Bicicleta, plano de treino/ });
    await expect(next).toContainText('Semana 1 · treino 2 de 2');

    // o treino 2, retomado depois de reabrir o app e salvo antes do fim: guarda o que foi feito, sem outro treino
    await next.click();
    await page.getByRole('button', { name: /Começar treino/ }).click();
    await expect(page).toHaveURL(/\/treino\/[^/]+\/1\/2$/);
    await page.goto(`${new URL(page.url()).pathname}?agora=2026-10-22T07:48`);
    await expect(page.locator('.rn-b p')).toContainText('Tempo total 8:00');
    await page.getByRole('button', { name: 'Encerrar treino', exact: true }).dispatchEvent('click');
    await page.getByRole('dialog', { name: 'Encerrar o treino?' }).getByRole('button', { name: 'Salvar o que fiz' }).click();
    await expect(page).toHaveURL(/\/1\/2\/feito$/);
    await expect(page.locator('#rn-done-sum')).toHaveText('8 minutos, 1 de 5 intervalos');
  });

  test('revisão de fim de fase: passos, voltar, fechar guardando e começar a fase 3', async ({ page }) => {
    await enterDemo(page, '2026-10-22T12:00');
    await page.goto('/revisao/2026-10-26/1?agora=2026-11-01T18:30');
    await expect(page.getByRole('heading', { name: 'Sua semana' })).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Passo 1 de 3' })).toBeVisible();
    await expect(page.getByText(/fim da fase 2/)).toBeVisible();

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/revisao\/2026-10-26\/2/);
    await expect(page.getByRole('heading', { name: /Uma coisa para ajustar/ })).toBeVisible();
    await page.getByRole('textbox', { name: 'Ajuste da próxima semana' }).fill('Desligar as telas às 20h45.');
    await page.getByRole('textbox', { name: 'Cintura de hoje' }).fill('94,5');
    // sem programa a dois ativo, o bloco não aparece
    await expect(page.getByRole('radiogroup', { name: /programa a dois/i })).toHaveCount(0);

    // o ‹ volta um passo
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Sua semana' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('textbox', { name: 'Ajuste da próxima semana' })).toHaveValue('Desligar as telas às 20h45.');

    // o X fecha e guarda o rascunho
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Fechar' }).click();
    await expect(page).toHaveURL(/\/hoje/);
    await page.goto('/revisao/2026-10-26/2?agora=2026-11-01T18:30');
    await expect(page.getByRole('textbox', { name: 'Ajuste da próxima semana' })).toHaveValue('Desligar as telas às 20h45.');

    // passo 3: duas escolhas do mesmo peso
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Movimento' })).toBeVisible();
    const advance = page.getByRole('button', { name: /^Começar a fase 3\./ });
    const stay = page.getByRole('button', { name: /^Ficar mais uma semana\./ });
    await expect(advance).toBeVisible();
    await expect(stay).toBeVisible();
    const [a, s] = [await advance.boundingBox(), await stay.boundingBox()];
    expect(Math.abs(a!.height - s!.height)).toBeLessThan(2);
    expect(Math.abs(a!.width - s!.width)).toBeLessThan(2);

    await advance.click();
    await expect(page).toHaveURL(/\/fase\/3$/);
    await expect(page.getByRole('heading', { name: /Fase 3\s*Movimento/ })).toBeVisible();
    await expect(page.getByText(/a partir de amanhã, segunda, 2 de novembro/)).toBeVisible();
    await page.getByRole('button', { name: 'Ver meu dia' }).click();
    await expect(page).toHaveURL(/\/hoje/);
  });

  test('revisão: ficar mais uma semana', async ({ page }) => {
    await enterDemo(page, '2026-10-22T12:00');
    await page.goto('/revisao/2026-10-26/3?agora=2026-11-01T18:30');
    await page.getByRole('button', { name: /^Ficar mais uma semana\./ }).click();
    await expect(page).toHaveURL(/\/revisao\/2026-10-26\/fim/);
    await expect(page.getByRole('heading', { name: /Mais uma semana/ })).toBeVisible();
    await expect(page.getByText(/A fase 2 segue até domingo, 8 de novembro/)).toBeVisible();
    await expect(page.getByText(/O convite volta na Revisão da semana de 8 nov/)).toBeVisible();
  });
});
