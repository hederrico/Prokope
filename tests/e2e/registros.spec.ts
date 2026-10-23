import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// As folhas de registro (docs/interacao/telas/registros.md) no tamanho do iPhone, com a demonstração semeada na hora
// de cada quadro (?agora=). As folhas abrem por ?folha= sobre o Hoje; PW_SHEET_HOST troca a tela de baixo
// (por exemplo /dev/componentes, enquanto o Hoje estiver em obra). A navegação usa o gancho window.__pkShell.
// A hora vem com a data (quinta, 22 de outubro de 2026), para os dias da história não dependerem do relógio.

const HOST = process.env.PW_SHEET_HOST ?? '/hoje';

// (window.__pkShell está declarado em tests/e2e/global.d.ts)

async function enterDemo(page: Page, agora: string) {
  await page.goto(`/entrar?agora=${agora}`);
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje/);
}

async function go(page: Page, to: string) {
  await page.evaluate((to) => window.__pkShell.navigate(to), to);
}

/** Lê a base da demonstração no aparelho (IndexedDB) para achar ids. */
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

const toast = (page: Page, text: string | RegExp) => page.locator('.sh-toast').filter({ hasText: text });

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.describe('registros rápidos', () => {
  test('proteína: cada toque grava, a meta acende e o − tira uma porção com Desfazer', async ({ page }) => {
    await enterDemo(page, '2026-10-22T12:41');
    await go(page, `${HOST}?folha=proteina`);
    const sheet = page.getByRole('dialog', { name: 'Proteína' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('de 80 g')).toBeVisible();
    await expect(sheet.locator('.pk-vpill')).toContainText('faltam');

    await sheet.getByRole('button', { name: 'Somar frango, 30 gramas' }).click();
    await expect(sheet.getByRole('meter')).toHaveAttribute('aria-valuenow', '76');
    await expect(sheet.getByRole('group', { name: /frango, 30 gramas/ })).toBeVisible();

    await sheet.getByRole('button', { name: 'Somar ovo, 6 gramas' }).click();
    await expect(sheet.getByText('meta batida')).toBeVisible();
    await expect(sheet.locator('.pk-pb-m.lit')).toHaveCount(1);
    await expect(sheet.locator('.pk-pb-over')).toBeVisible();

    // o − na última porção vira a faixa com Desfazer, que devolve a linha
    await sheet.getByRole('button', { name: 'Tirar uma porção de frango' }).click();
    await expect(sheet.getByText('Frango removido')).toBeVisible();
    await expect(sheet.getByRole('meter')).toHaveAttribute('aria-valuenow', '52');
    await sheet.getByRole('button', { name: 'Desfazer' }).click();
    await expect(sheet.getByRole('group', { name: /frango, 30 gramas/ })).toBeVisible();
    await expect(sheet.getByRole('meter')).toHaveAttribute('aria-valuenow', '82');

    // "Outro": campo de gramas
    await sheet.getByRole('button', { name: /Outro alimento/ }).click();
    await sheet.getByRole('textbox', { name: 'Gramas' }).fill('15');
    await sheet.getByRole('button', { name: 'Somar 15 g' }).click();
    await expect(sheet.getByRole('meter')).toHaveAttribute('aria-valuenow', '97');

    // fecha sem nada para salvar
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('água: soma no toque e o anel fecha com o selo', async ({ page }) => {
    await enterDemo(page, '2026-10-22T15:20');
    await go(page, `${HOST}?folha=agua`);
    const sheet = page.getByRole('dialog', { name: 'Água' });
    await expect(sheet.getByRole('meter', { name: /1,5 de 3 litros/ })).toBeVisible();
    await expect(sheet.getByText('Garrafinha', { exact: true })).toBeVisible();
    await sheet.getByRole('button', { name: 'Somar 1 litro' }).click();
    await expect(sheet.getByRole('meter', { name: /2,5 de 3 litros/ })).toBeVisible();
    await sheet.getByRole('button', { name: 'Somar 500 mililitros' }).click();
    await expect(sheet.getByText('meta batida')).toBeVisible();
  });

  test('deitar e acordar: os dois horários num botão, e o Desfazer na tela de origem', async ({ page }) => {
    await enterDemo(page, '2026-10-22T06:57');
    await go(page, `${HOST}?folha=acordar`);
    const sheet = page.getByRole('dialog', { name: 'Deitar e acordar' });
    await expect(sheet).toBeVisible();
    const wake = sheet.getByLabel(/^Acordei hoje às/);
    await expect(wake).toHaveValue('06:57');
    await wake.fill('07:30');
    await expect(sheet.getByText('40 min depois da meta')).toBeVisible();
    await wake.fill('06:52');
    await expect(sheet.getByText('conta como feito', { exact: true })).toHaveCount(2);
    await sheet.getByRole('button', { name: /Salvar 22h e 6h52/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(toast(page, 'Deitar e acordar registrados')).toBeVisible();
    await expect(toast(page, 'Deitar e acordar registrados').getByRole('button', { name: 'Desfazer' })).toBeVisible();
  });

  test('nota do almoço: escolhe, repete a nota no botão e grava', async ({ page }) => {
    await enterDemo(page, '2026-10-22T12:30');
    await go(page, `${HOST}?folha=nota&refeicao=almoco`);
    const sheet = page.getByRole('dialog', { name: 'Como foi o almoço?' });
    const save = sheet.getByRole('button', { name: 'Escolha uma nota' });
    await expect(save).toHaveAttribute('aria-disabled', 'true');
    await sheet.getByRole('radio', { name: '5, Completo' }).click();
    await sheet.getByRole('button', { name: 'Sentado, sem tela' }).click();
    await expect(sheet.getByRole('button', { name: 'Sentado, sem tela' })).toHaveAttribute('aria-pressed', 'true');
    await sheet.getByRole('button', { name: 'Salvar nota 5' }).click();
    await expect(toast(page, 'Almoço · nota 5')).toBeVisible();
    // reabre com a nota e o chip marcados
    await go(page, `${HOST}?folha=nota&refeicao=almoco`);
    await expect(page.getByRole('radio', { name: '5, Completo' })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Sentado, sem tela' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('check-in: abre com o humor, guarda rascunho ao fechar e salva', async ({ page }) => {
    await enterDemo(page, '2026-10-22T20:34');
    await go(page, `${HOST}?folha=checkin&humor=4`);
    const sheet = page.getByRole('dialog', { name: 'Check-in do dia' });
    await expect(sheet.getByRole('radiogroup', { name: 'Humor' }).getByRole('radio', { name: 'Bem, 4 de 5' })).toBeChecked();
    await expect(sheet.getByRole('button', { name: 'Falta a energia' })).toHaveAttribute('aria-disabled', 'true');
    await sheet.getByRole('textbox', { name: 'Coisa boa 1 de 3' }).fill('Passeio no fim da tarde');
    await sheet.getByRole('textbox', { name: /Tempo de tela total/ }).fill('108');
    await sheet.getByRole('textbox', { name: 'Coisa boa 2 de 3' }).focus();
    await expect(sheet.getByRole('textbox', { name: /Tempo de tela total/ })).toHaveValue('1h 48min');

    // fechar sem salvar guarda o rascunho
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await go(page, `${HOST}?folha=checkin`);
    const again = page.getByRole('dialog', { name: 'Check-in do dia' });
    await expect(again.getByRole('textbox', { name: 'Coisa boa 1 de 3' })).toHaveValue('Passeio no fim da tarde');
    await expect(again.getByRole('radio', { name: 'Bem, 4 de 5' })).toBeChecked();

    await again.getByRole('radiogroup', { name: 'Energia' }).getByRole('radio', { name: 'Boa, 4 de 5' }).click();
    await again.getByRole('button', { name: 'Salvar check-in' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(toast(page, 'Check-in salvo')).toBeVisible();
    const saved = await docs(page, 'checkins');
    expect(saved.some((c) => c.data.mood === 4 && c.data.energy === 4 && c.data.screenMinutes === 108)).toBe(true);
  });

  test('deslize: prévia gentil, registra com Desfazer e edita pelo histórico', async ({ page }) => {
    await enterDemo(page, '2026-10-22T16:10');
    const habits = await docs(page, 'habits');
    const id = habits.find((h) => h.data.name === 'Zero refrigerante')?.id;
    expect(id).toBeTruthy();
    await go(page, `/hoje/habito/${id}?folha=deslize&habito=${id}`);
    const sheet = page.getByRole('dialog', { name: 'Registrar um deslize?' });
    await expect(sheet.getByText(/recorde de 21 dias continua guardado/)).toBeVisible();
    await expect(sheet.locator('.rg-stats')).toContainText('12');
    await sheet.getByRole('button', { name: /^Registrar deslize\. A contagem atual vai de 12 para 0/ }).click();
    await expect(toast(page, 'Deslize registrado.')).toBeVisible();

    const mine = (await docs(page, 'slips')).find((s) => s.data.habitId === id && s.data.day === '2026-10-22');
    expect(mine).toBeTruthy();
    await go(page, `/hoje/habito/${id}?folha=deslize&habito=${id}&deslize=${mine!.id}`);
    const edit = page.getByRole('dialog', { name: 'Editar deslize' });
    await expect(edit).toBeVisible();
    await edit.getByRole('button', { name: 'Apagar este deslize' }).click();
    await expect(toast(page, 'Deslize apagado')).toBeVisible();
  });

  test('peso: decimal com vírgula, referência da última pesagem e o botão que repete o valor', async ({ page }) => {
    await enterDemo(page, '2026-10-22T06:30');
    await go(page, `${HOST}?folha=peso`);
    const sheet = page.getByRole('dialog', { name: 'Peso de hoje' });
    const field = sheet.getByRole('textbox', { name: /Peso de hoje, em quilos/ });
    await expect(field).toBeFocused();
    await expect(sheet.getByText(/Última pesagem: ontem/)).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Digite o peso' })).toHaveAttribute('aria-disabled', 'true');
    await field.fill('350');
    await expect(sheet.getByText('Confira o número')).toBeVisible();
    await field.fill('83.6');
    await expect(field).toHaveValue('83,6');
    await sheet.getByRole('button', { name: 'Salvar 83,6 kg' }).click();
    await expect(toast(page, 'Peso registrado')).toBeVisible();
    const weights = await docs(page, 'measurements');
    expect(weights.some((w) => w.data.kind === 'weight' && w.data.value === 83.6)).toBe(true);
  });

  test('um dia que passou: &dia= grava naquele dia', async ({ page }) => {
    await enterDemo(page, '2026-10-22T12:41');
    await go(page, `${HOST}?folha=proteina&dia=2026-10-21`);
    const sheet = page.getByRole('dialog', { name: 'Proteína' });
    await expect(sheet.getByText('Quarta, 21 de outubro')).toBeVisible();
    await expect(sheet.getByRole('heading', { name: 'Neste dia' })).toBeVisible();
  });
});

test('folhas de registro sem violações de acessibilidade (axe)', async ({ page }) => {
  await enterDemo(page, '2026-10-22T12:41');
  for (const q of ['proteina', 'agua', 'acordar', 'nota&refeicao=almoco', 'checkin&humor=4', 'peso']) {
    await go(page, `${HOST}?folha=${q}`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(500);
    await axe(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
});
