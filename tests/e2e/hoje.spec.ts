import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// O Hoje na demonstração, com a hora fixa da história (?agora=): marcar com Desfazer, somar juntando toques,
// a noite com Ainda hoje e Feitos hoje, o dia fechado, outro dia pelo "Marcar ontem", o menu do hábito pelo toque
// longo, o convite da revisão no domingo e o aviso sem internet.

async function enterDemo(page: Page, agora: string) {
  await page.goto(`/entrar?agora=${agora}`);
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(page.locator('[data-screen="/hoje"] h1')).toBeVisible();
}

/** O toast atual (um por vez). */
function toast(page: Page) {
  return page.locator('.sh-toast');
}

/** Troca o jeito de ver o dia pelo botão do topo (a folha fecha sozinha depois da escolha). */
async function chooseView(page: Page, name: 'Resumo' | 'Lista completa' | 'Linha do tempo') {
  await page.getByRole('button', { name: /^Jeito de ver o dia/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Ver o dia' });
  await sheet.getByRole('radio', { name: new RegExp(`^${name}`) }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('button', { name: new RegExp(`^Jeito de ver o dia: ${name}`) })).toBeVisible();
}

test.describe('Hoje', () => {
  test('manhã: marcar a caminhada mostra o toast e o Desfazer volta', async ({ page }) => {
    await enterDemo(page, '2026-10-22T07:42');
    await expect(page.getByRole('heading', { name: 'Bom dia, Henrique' })).toBeVisible();
    const walk = page.getByRole('checkbox', { name: /^Caminhada/ });
    await expect(walk).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText('Hoje é um bom dia para voltar.')).toBeVisible();

    await walk.click();
    await expect(walk).toHaveAttribute('aria-checked', 'true');
    await expect(toast(page)).toContainText('Caminhada marcada');
    await expect(toast(page)).toContainText('3 de 7 na semana');
    // o convite troca a frase no lugar e sai só na próxima arrumação
    await expect(page.getByText('De volta hoje.')).toBeVisible();

    await toast(page).getByRole('button', { name: 'Desfazer' }).click();
    await expect(walk).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText('Hoje é um bom dia para voltar.')).toBeVisible();
  });

  test('tarde: toques seguidos no mesmo botão juntam num registro só', async ({ page }) => {
    await enterDemo(page, '2026-10-22T12:41');
    await expect(page.getByRole('heading', { name: 'Boa tarde, Henrique' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Tudo feito/ })).toBeVisible();
    const bean = page.getByRole('button', { name: 'Somar feijão, 7 gramas' });
    await bean.click();
    await page.waitForTimeout(200);
    await bean.click();
    await page.waitForTimeout(200);
    await bean.click();
    await expect(toast(page).filter({ hasText: 'Feijão × 3 · 21 g' })).toBeVisible();
    await expect(page.getByRole('meter', { name: '67 de 80 gramas' })).toBeVisible();
    // o Desfazer tira os três de uma vez
    await toast(page).filter({ hasText: 'Feijão × 3' }).getByRole('button', { name: 'Desfazer' }).click();
    await expect(page.getByRole('meter', { name: '46 de 80 gramas' })).toBeVisible();
  });

  test('noite: check-in no topo, Feitos hoje abre para desmarcar', async ({ page }) => {
    await enterDemo(page, '2026-10-22T20:34');
    await expect(page.getByRole('heading', { name: /Ainda hoje/ })).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: /Como você está agora/ })).toBeVisible();
    await expect(page.getByText('às 21h · em 26 min')).toBeVisible();

    await page.getByRole('button', { name: /^Feitos hoje · 8/ }).click();
    const dishes = page.getByRole('checkbox', { name: /^Louça/ });
    await expect(dishes).toHaveAttribute('aria-checked', 'true');
    await dishes.click();
    await expect(dishes).toHaveAttribute('aria-checked', 'false');
    await expect(toast(page)).toContainText('Louça desmarcada');
  });

  test('dia fechado: o último hábito fecha o dia e o Desfazer reabre', async ({ page }) => {
    await enterDemo(page, '2026-10-22T21:03');
    await page.getByRole('checkbox', { name: /^Telas desligadas/ }).click();
    await expect(page.getByRole('heading', { name: 'Dia fechado' })).toBeVisible();
    await expect(page.getByText(/Telas desligadas às 21h03/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Amanhã cedo' })).toBeVisible();
    // a celebração fica guardada: uma vez por dia
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pk-dia-fechado-2026-10-22'))).toBe('1');

    await toast(page).getByRole('button', { name: 'Desfazer' }).click();
    await expect(page.getByRole('heading', { name: 'Dia fechado' })).toBeHidden();
    await expect(page.getByRole('checkbox', { name: /^Telas desligadas/ })).toHaveAttribute('aria-checked', 'false');
  });

  test('outro dia: Marcar ontem abre a quarta, marca sem celebrar e volta para hoje', async ({ page }) => {
    await enterDemo(page, '2026-10-22T07:42');
    await page.getByRole('button', { name: 'Marcar ontem' }).click();
    await expect(page).toHaveURL(/\/hoje\?dia=2026-10-21$/);
    await expect(
      page.getByRole('heading', { name: /Quarta, 21 de outubro. Você está vendo um dia que passou/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Caminhada com o cachorro\. sem registro, dá para marcar/ }),
    ).toBeVisible();
    // num dia passado, proteína e água são valores, sem botões de somar
    await expect(page.getByRole('button', { name: /^Somar/ })).toHaveCount(0);

    await page.getByRole('checkbox', { name: /^Caminhada/ }).click();
    await expect(toast(page)).toContainText('Caminhada marcada na quarta');

    await page.getByRole('button', { name: 'Voltar para hoje' }).click();
    await expect(page).toHaveURL(/\/hoje$/);
    await expect(page.getByRole('heading', { name: 'Bom dia, Henrique' })).toBeVisible();
  });

  test('menu do hábito: o toque longo abre o menu e Hoje não se aplica tira o dia da conta', async ({ page }) => {
    await enterDemo(page, '2026-10-22T12:41');
    const row = page.getByRole('button', { name: /^Futebol\./ });
    // com a faixa do dia no topo, a linha fica atrás da barra de abas: rola até o meio da tela
    await row.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const box = (await row.boundingBox())!;
    await page.mouse.move(box.x + 80, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();
    const menu = page.getByRole('dialog', { name: 'Futebol, opções' });
    await expect(menu).toBeVisible();
    // um hábito de sim ou não não tem "Registrar outro horário"
    await expect(menu.getByRole('button', { name: /Registrar outro horário/ })).toHaveCount(0);
    await menu.getByRole('button', { name: /Hoje não se aplica/ }).click();
    await expect(menu).toBeHidden();
    await expect(toast(page)).toContainText('Futebol não conta hoje');
    await expect(page.getByRole('button', { name: 'Futebol não conta hoje. Opções' })).toBeVisible();
  });

  test('domingo: o convite da revisão ocupa o lugar da semana', async ({ page }) => {
    await enterDemo(page, '2026-10-22T07:42');
    // a demonstração já semeada continua; só a hora muda para o domingo às 18h
    await page.goto('/hoje?agora=2026-11-01T18:00');
    await expect(page.getByText('Revisão da semana', { exact: true })).toBeVisible();
    await expect(page.getByText('A fase 2 termina hoje')).toBeVisible();
    await page.getByRole('button', { name: 'Começar revisão' }).click();
    await expect(page).toHaveURL(/\/revisao\/2026-10-26\/1$/);
  });

  test('resumo: a faixa do dia leva até a linha, e abre a Noite recolhida se preciso', async ({ page }) => {
    await enterDemo(page, '2026-10-22T07:42');
    const strip = page.getByRole('group', { name: 'Faixa do dia' });
    await expect(strip).toHaveAccessibleDescription(/^6 hábitos com horário, das 6h50 às 22h; 1 feito\./);
    // o acordar já foi: tocar no ponto destaca a linha, sem mudar nada de lugar
    await strip.getByRole('button', { name: 'Acordar, 6h50, feito. Mostrar na lista' }).click();
    await expect(page.locator('.td-hl')).toHaveCount(1);
    // os pontos da noite estão perto demais: dividem uma área de toque de 44 px
    const evening = strip.getByRole('button', { name: /^Das 20h30 às 22h: .*nenhum feito\. Mostrar na lista$/ });
    const box = (await evening.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole('checkbox', { name: /^Telas desligadas/ })).toHaveCount(0);
    await evening.click();
    await expect(page.getByRole('checkbox', { name: /^Telas desligadas/ })).toBeInViewport();
    await expect(page.locator('.td-hl')).toHaveCount(5);
  });

  test('lista completa: nada recolhido, com o horário em cada linha', async ({ page }) => {
    await enterDemo(page, '2026-10-22T12:41');
    await chooseView(page, 'Lista completa');
    // a manhã completa não vira "Tudo feito" e a Noite fica aberta antes das 18h
    await expect(page.getByRole('button', { name: /^Tudo feito/ })).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: /^Caminhada/ })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('heading', { name: 'Noite' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Lixo e recicláveis\. até 20h30, coleta hoje\./ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Telas desligadas\. às 21h\./ })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Faixa do dia' })).toHaveCount(0);
    // marcar não tira a linha do lugar
    const football = page.getByRole('checkbox', { name: /^Futebol/ });
    await football.scrollIntoViewIfNeeded();
    const before = (await football.boundingBox())!.y;
    await football.click();
    await expect(football).toHaveAttribute('aria-checked', 'true');
    await expect(toast(page)).toContainText('Futebol marcado');
    expect((await football.boundingBox())!.y).toBe(before);
  });

  test('linha do tempo: em ordem de horário, com a linha do agora', async ({ page }) => {
    await enterDemo(page, '2026-10-22T07:42');
    await chooseView(page, 'Linha do tempo');
    const tl = page.getByRole('region', { name: 'Linha do tempo' });
    // os sem horário entram pelo momento: a manhã depois do acordar, o "ao longo do dia" no meio do dia
    await expect(tl.getByRole('heading', { level: 2 })).toHaveText([
      '6h50',
      'Manhã',
      'Ao longo do dia',
      'Noite',
      '20h30',
      '21h',
      '22h',
    ]);
    // a linha do agora passa entre a manhã e o resto do dia, fora do leitor de tela
    const now = tl.locator('.td-tl-now');
    await expect(now).toHaveText('7h42');
    await expect(now.locator('xpath=..')).toHaveAttribute('aria-hidden', 'true');
    const y = async (name: string) => (await tl.getByRole('heading', { name, exact: true }).boundingBox())!.y;
    const nowY = (await now.boundingBox())!.y;
    expect(nowY).toBeGreaterThan(await y('Manhã'));
    expect(nowY).toBeLessThan(await y('Ao longo do dia'));
    // marcar deixa a caminhada no lugar, marcada
    const walk = page.getByRole('checkbox', { name: /^Caminhada/ });
    await walk.scrollIntoViewIfNeeded();
    const before = (await walk.boundingBox())!.y;
    await walk.click();
    await expect(walk).toHaveAttribute('aria-checked', 'true');
    expect((await walk.boundingBox())!.y).toBe(before);
  });

  test('a troca: o jeito escolhido fica guardado e aparece em Ajustes › Aparência', async ({ page }) => {
    await enterDemo(page, '2026-10-22T07:42');
    await page.getByRole('button', { name: 'Jeito de ver o dia: Resumo. Trocar' }).click();
    const sheet = page.getByRole('dialog', { name: 'Ver o dia' });
    await expect(sheet.getByRole('radio', { name: /^Resumo/ })).toHaveAttribute('aria-checked', 'true');
    await sheet.getByRole('radio', { name: /^Linha do tempo/ }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('region', { name: 'Linha do tempo' })).toBeVisible();
    // abrir o app de novo mantém o jeito
    await page.goto('/hoje?agora=2026-10-22T07:50');
    await expect(page.getByRole('button', { name: 'Jeito de ver o dia: Linha do tempo. Trocar' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Linha do tempo' })).toBeVisible();
    // Ajustes › Aparência mostra a mesma escolha, e trocar lá vale no Hoje
    await page.evaluate(() => window.__pkShell.navigate('/ajustes/aparencia'));
    const group = page.getByRole('radiogroup', { name: 'Jeito de ver o Hoje' });
    await expect(group.getByRole('radio', { name: /^Linha do tempo/ })).toHaveAttribute('aria-checked', 'true');
    await group.getByRole('radio', { name: /^Lista completa/ }).click();
    await page.evaluate(() => window.__pkShell.navigate('/hoje'));
    await expect(page.getByRole('button', { name: 'Jeito de ver o dia: Lista completa. Trocar' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Linha do tempo' })).toHaveCount(0);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`os três jeitos e a folha sem violações de acessibilidade (axe, ${colorScheme === 'light' ? 'claro' : 'escuro'})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await enterDemo(page, '2026-10-22T20:34');
      const check = async (include: string) => {
        await page.waitForTimeout(400);
        const r = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(r.violations).toEqual([]);
      };
      await check('[data-screen="/hoje"]');
      await page.getByRole('button', { name: /^Jeito de ver o dia/ }).click();
      await expect(page.getByRole('dialog', { name: 'Ver o dia' })).toBeVisible();
      await check('[role="dialog"]');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      for (const name of ['Lista completa', 'Linha do tempo'] as const) {
        await chooseView(page, name);
        await check('[data-screen="/hoje"]');
      }
    });
  }

  test('sem internet: o aviso entra depois de 3 s e vira Tudo em dia na volta', async ({ page }) => {
    await enterDemo(page, '2026-10-22T07:42');
    // a conexão cai só para o app (navigator.onLine e os eventos): o servidor de desenvolvimento recarregaria a página
    const setOnline = (on: boolean) =>
      page.evaluate((on) => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => on });
        window.dispatchEvent(new Event(on ? 'online' : 'offline'));
      }, on);
    await setOnline(false);
    const notice = page.getByRole('status').filter({ hasText: 'Sem internet.' });
    // uma queda curta não mostra nada
    await page.waitForTimeout(1500);
    await expect(notice).toHaveCount(0);
    await expect(notice).toBeVisible({ timeout: 5000 });
    // marcar continua funcionando
    await page.getByRole('checkbox', { name: /^Caminhada/ }).click();
    await expect(toast(page)).toContainText('Caminhada marcada');
    await setOnline(true);
    await expect(page.getByText('Tudo em dia.')).toBeVisible();
    await expect(page.getByText('Tudo em dia.')).toBeHidden({ timeout: 5000 });
  });
});
