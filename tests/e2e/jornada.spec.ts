import { expect, test, type Page } from '@playwright/test';

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
  test('caminho das fases, Editar fases, plano de corrida e revisão passada', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('tab', { name: 'Jornada' }).click();
    await expect(page).toHaveURL(/\/jornada$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Jornada' })).toBeVisible();

    // as 4 fases, com a atual descrita por inteiro
    const path = page.getByRole('list', { name: 'Fases' });
    await expect(path.getByRole('listitem')).toHaveCount(4);
    await expect(page.getByRole('button', { name: /Fase 2, Alimentação, agora, semana 2 de 3/ })).toBeVisible();
    await expect(page.getByText('12 out – 1 nov')).toBeVisible();

    // uma fase futura abre Editar fases rolada até ela
    await page.getByRole('button', { name: /Fase 3, Movimento/ }).click();
    await expect(page).toHaveURL(/\/jornada\/fases#fase-3$/);
    await settle(page);
    await expect(page.getByRole('group', { name: 'Fase 3, Movimento' })).toBeInViewport();
    await page.getByRole('button', { name: 'Voltar para Jornada' }).click();
    await expect(page).toHaveURL(/\/jornada$/);
    await settle(page);

    // plano de corrida: as 13 semanas, sem "Começar treino" antes da fase 3
    await page.getByRole('button', { name: /^Plano de corrida/ }).click();
    await expect(page).toHaveURL(/\/jornada\/corrida$/);
    await expect(page.getByRole('heading', { name: 'Do zero aos 30 minutos' })).toBeVisible();
    await expect(page.locator('.jr-wr')).toHaveCount(13);
    await expect(page.getByText('a partir de 2 nov')).toBeVisible();
    await expect(page.getByRole('button', { name: /Começar treino/ })).toHaveCount(0);
    // outra semana troca o cartão do treino
    await page.getByRole('button', { name: /^Semana 13:/ }).click();
    await expect(page.getByRole('heading', { name: /Semana 13 · o treino/ })).toBeVisible();
    await page.getByRole('button', { name: 'Voltar para Jornada' }).click();
    await settle(page);

    // revisão passada: só leitura
    await page.getByRole('button', { name: /Domingo, 11 out/ }).click();
    await expect(page).toHaveURL(/\/jornada\/revisoes\/2026-10-11$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Domingo, 11 de outubro' })).toBeVisible();
    await expect(page.getByText(/fim da fase 1/)).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });

  test('Editar fases: sugestão para avançar e mover um hábito de fase', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/jornada/fases');
    await expect(page.getByRole('heading', { name: 'Fases', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Sugerir a próxima fase/ }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await sheet.getByRole('radio', { name: /^60%/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Sugerir a próxima fase.*60%/ })).toBeVisible();

    const phase4 = page.getByRole('group', { name: 'Fase 4, Profundidade' });
    await phase4.getByRole('button', { name: 'Pequeno gesto' }).click();
    await page.getByRole('dialog').getByRole('radio', { name: /Fase 3 · Movimento/ }).click();
    await expect(page.getByText('Pequeno gesto movido para a fase 3')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Fase 3, Movimento' }).getByRole('button', { name: 'Pequeno gesto' })).toBeVisible();
    await expect(phase4.getByRole('button', { name: 'Pequeno gesto' })).toHaveCount(0);
  });

  test('corrida: começa, pausa, sobrevive a recarregar e encerra com toque longo', async ({ page }) => {
    // espera de verdade pelo relógio (pausa, recarregar e o toque longo)
    test.setTimeout(60_000);
    await enterDemo(page, null);
    await go(page, '/corrida/1/1');
    await expect(page.getByRole('heading', { name: 'Semana 1 · treino 1' })).toBeVisible();
    await expect(page.locator('.rn-state')).toHaveText('Aquecimento');
    await expect(page.getByRole('timer')).toBeVisible();
    await expect(page.locator('.rn-next')).toContainText('Depois: trote');

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
