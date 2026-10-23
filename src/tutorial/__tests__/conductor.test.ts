// O condutor (conductor.ts) com dependências de mentira: anda pelo "Próximo", pelo aviso do onTour e pelo toque no
// alvo; pula o passo condicional e o alvo que não existe; sair limpa tudo; o capítulo fica como visto só no fim.
import { vi } from 'vitest';
import { emitTour, useTour, type TourRun } from '@/stores/tour';
import type { ExampleMode } from '@/data/example';
import type { Habit } from '@/types';
import type { ZenoController } from '@/zeno';
import { createConductor, useTourView, type ConductorDeps } from '../conductor';
import { selectorOf } from '../dom';
import type { TourScript } from '../types';

const done = () => Promise.resolve();

function fakeZeno(available = false) {
  const z = {
    available,
    present: false,
    enter: vi.fn(async () => {
      z.present = true;
    }),
    leave: vi.fn(async () => {
      z.present = false;
    }),
    moveTo: vi.fn(done),
    lookAt: vi.fn(),
    pointAt: vi.fn(done),
    rest: vi.fn(),
    talk: vi.fn(),
    wave: vi.fn(done),
    nod: vi.fn(done),
    hop: vi.fn(done),
    sit: vi.fn(done),
    stand: vi.fn(done),
    celebrate: vi.fn(done),
    showShell: vi.fn(done),
    anchor: () => null,
    onMove: () => () => undefined,
  };
  return z satisfies ZenoController;
}

function fakeExample() {
  const ex = {
    active: false,
    enter: vi.fn(async () => {
      ex.active = true;
    }),
    leave: vi.fn(async () => {
      ex.active = false;
    }),
  };
  return ex satisfies ExampleMode;
}

/** Espera simples, sem quadros: procura a cada 5 ms. */
async function poll<T>(find: () => T | null, timeout: number, isLive: () => boolean): Promise<T | null> {
  const start = Date.now();
  for (;;) {
    if (!isLive()) return null;
    const found = find();
    if (found) return found;
    if (Date.now() - start > timeout) return null;
    await new Promise((r) => setTimeout(r, 5));
  }
}

function setup(
  scripts: Partial<Record<TourRun, TourScript>>,
  opts: { habits?: Partial<Habit>[]; zeno?: boolean } = {},
) {
  const zeno = fakeZeno(opts.zeno);
  const example = fakeExample();
  const markDone = vi.fn(async () => undefined);
  const navigate = vi.fn((to: string) => c.setPath(to));
  const deps: ConductorDeps = {
    scripts,
    navigate,
    zeno: () => zeno,
    example: () => example,
    habits: () => (opts.habits ?? []) as Habit[],
    find: (target, ctx) => (typeof target === 'string' ? document.querySelector(selectorOf(target)) : target(ctx)),
    reveal: async () => undefined,
    waitFor: poll,
    markDone,
  };
  const c = createConductor(deps);
  c.setPath('/hoje');
  return { c, zeno, example, markDone, navigate };
}

const balloon = () => useTourView.getState().balloon;

beforeEach(() => {
  document.body.innerHTML = `
    <div data-tour="semana">A semana</div>
    <button data-tour="pp-mark"><span class="dentro">○</span></button>
    <div data-tour="grupo">Manhã</div>`;
  useTour.setState({ run: null, step: 0, practice: false });
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('condutor', () => {
  it('anda pelo Próximo, mostra "1 de 2" e grava o capítulo só no fim', async () => {
    const { c, markDone } = setup({
      hoje: {
        run: 'hoje',
        steps: [
          { id: 'semana', where: '/hoje', target: 'semana', text: 'Aqui fica a sua semana.' },
          { id: 'grupo', target: 'grupo', text: 'Este é o seu dia.' },
        ],
      },
    });
    expect(c.start('hoje')).toBe(true);
    await vi.waitFor(() => expect(balloon()?.text).toBe('Aqui fica a sua semana.'));
    expect(balloon()).toMatchObject({ counter: '1 de 2', next: 'Próximo', exit: true, focus: true });
    expect(useTourView.getState().veil).toBe('look');
    expect(useTourView.getState().target).toBe(document.querySelector('[data-tour="semana"]'));
    expect(useTour.getState()).toMatchObject({ run: 'hoje', step: 0 });
    c.next();
    await vi.waitFor(() => expect(balloon()?.text).toBe('Este é o seu dia.'));
    expect(balloon()).toMatchObject({ counter: '2 de 2', next: 'Concluir' });
    expect(markDone).not.toHaveBeenCalled();
    c.next();
    await vi.waitFor(() => expect(useTour.getState().run).toBeNull());
    expect(markDone).toHaveBeenCalledTimes(1);
    expect(markDone).toHaveBeenCalledWith('hoje');
    expect(balloon()).toBeNull();
    expect(useTourView.getState().veil).toBe('none');
  });

  it('anda pelo aviso do onTour, com a resposta antes de seguir', async () => {
    const { c, markDone } = setup({
      hoje: {
        run: 'hoje',
        steps: [
          {
            id: 'marcar',
            target: 'pp-mark',
            text: 'Toque no círculo para marcar.',
            wait: { event: 'pp-mark' },
            reply: { text: 'Isso. Um pé depois do outro.', ms: 400 },
          },
          { id: 'fim', text: 'Pronto.' },
        ],
      },
    });
    c.start('hoje');
    await vi.waitFor(() => expect(balloon()?.text).toBe('Toque no círculo para marcar.'));
    // passo de fazer: sem Próximo, e só o alvo responde
    expect(balloon()?.next).toBeNull();
    expect(useTourView.getState().veil).toBe('do');
    c.next(); // o Próximo não anda um passo de fazer
    emitTour({ type: 'pp-unmark' }); // outro aviso também não
    await new Promise((r) => setTimeout(r, 20));
    expect(balloon()?.text).toBe('Toque no círculo para marcar.');
    emitTour({ type: 'pp-mark' });
    await vi.waitFor(() => expect(balloon()?.text).toBe('Isso. Um pé depois do outro.'));
    expect(balloon()?.reply).toBe(true);
    await vi.waitFor(() => expect(balloon()?.text).toBe('Pronto.'));
    // um passo sem alvo: o véu cobre tudo
    expect(useTourView.getState().target).toBeNull();
    c.next();
    await vi.waitFor(() => expect(markDone).toHaveBeenCalledWith('hoje'));
  });

  it('anda pelo toque no alvo (também num filho dele)', async () => {
    const { c } = setup({
      ajustes: {
        run: 'ajustes',
        steps: [
          { id: 'tocar', target: 'pp-mark', text: 'Toque aqui.', wait: 'tap' },
          { id: 'depois', target: 'grupo', text: 'Depois.' },
        ],
      },
    });
    c.start('ajustes');
    await vi.waitFor(() => expect(balloon()?.text).toBe('Toque aqui.'));
    // um toque fora do alvo não anda
    (document.querySelector('[data-tour="grupo"]') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 20));
    expect(balloon()?.text).toBe('Toque aqui.');
    (document.querySelector('.dentro') as HTMLElement).click();
    await vi.waitFor(() => expect(balloon()?.text).toBe('Depois.'));
  });

  it('pula o passo condicional e o alvo que não existe, e a conta "1 de N" acompanha', async () => {
    const { c } = setup(
      {
        hoje: {
          run: 'hoje',
          steps: [
            { id: 'semana', target: 'semana', text: 'Semana.' },
            { id: 'limites', text: 'Limites.', when: (ctx) => ctx.hasHabitType('budget') },
            { id: 'dias-sem', text: 'Dias sem.', when: (ctx) => ctx.hasHabitType('daysSince') },
            { id: 'sumido', target: 'nao-existe', text: 'Sumido.', timeout: 30 },
            { id: 'fim', text: 'Fim.' },
          ],
        },
      },
      { habits: [{ id: 'refri', type: 'daysSince' }] },
    );
    c.start('hoje');
    await vi.waitFor(() => expect(balloon()?.text).toBe('Semana.'));
    // limites sai da conta (o plano não tem); o alvo sumido ainda conta até ser procurado
    expect(balloon()?.counter).toBe('1 de 4');
    c.next();
    await vi.waitFor(() => expect(balloon()?.text).toBe('Dias sem.'));
    expect(balloon()?.counter).toBe('2 de 4');
    c.next();
    await vi.waitFor(() => expect(balloon()?.text).toBe('Fim.'));
    expect(balloon()?.counter).toBe('3 de 3');
  });

  it('navega até a rota do passo', async () => {
    const { c, navigate } = setup({
      progresso: { run: 'progresso', steps: [{ id: 'p', where: '/progresso', target: 'semana', text: 'Progresso.' }] },
    });
    c.start('progresso');
    await vi.waitFor(() => expect(balloon()?.text).toBe('Progresso.'));
    expect(navigate).toHaveBeenCalledWith('/progresso');
  });

  it('sair limpa tudo: véu, practice, exemplo e Zeno, sem gravar', async () => {
    const leave = vi.fn();
    const { c, zeno, example, markDone } = setup(
      {
        progresso: {
          run: 'progresso',
          enter: (ctx) => ctx.setPractice(true),
          leave: (_ctx, reason) => leave(reason),
          steps: [
            { id: 'a', target: 'semana', text: 'Um.' },
            { id: 'b', target: 'grupo', text: 'Dois.' },
          ],
        },
      },
      { zeno: true },
    );
    c.start('progresso');
    await vi.waitFor(() => expect(balloon()?.text).toBe('Um.'));
    // "O progresso" usa o exemplo (CHAPTERS), e o Zeno entrou
    expect(example.enter).toHaveBeenCalled();
    expect(zeno.enter).toHaveBeenCalled();
    expect(useTour.getState().practice).toBe(true);
    c.stop();
    // a tela fica limpa na hora
    expect(useTour.getState()).toMatchObject({ run: null, practice: false });
    expect(balloon()).toBeNull();
    expect(useTourView.getState().veil).toBe('none');
    await vi.waitFor(() => expect(example.leave).toHaveBeenCalled());
    await vi.waitFor(() => expect(zeno.leave).toHaveBeenCalled());
    expect(leave).toHaveBeenCalledWith('stop');
    expect(markDone).not.toHaveBeenCalled();
    // o Próximo de depois não faz nada
    c.next();
    await new Promise((r) => setTimeout(r, 20));
    expect(balloon()).toBeNull();
  });

  it('sair do exemplo leva antes à raiz da aba (ou à rota do roteiro)', async () => {
    const order: string[] = [];
    const steps: TourScript['steps'] = [{ id: 'a', target: 'semana', text: 'Um.' }];
    const { c, example, navigate } = setup({
      habito: { run: 'habito', steps },
      jornada: { run: 'jornada', steps, exampleHome: '/jornada/fases' },
      progresso: { run: 'progresso', steps, exampleHome: null },
    });
    example.leave.mockImplementation(async () => {
      order.push(`leave em ${c.state.run ?? 'nada'}`);
      example.active = false;
    });
    navigate.mockImplementation((to: string) => {
      order.push(`navigate ${to}`);
      c.setPath(to);
    });

    // numa tela de hábito do exemplo: volta para a raiz da aba, e só então os dados da pessoa voltam
    c.start('habito');
    await vi.waitFor(() => expect(balloon()?.text).toBe('Um.'));
    c.setPath('/hoje/habito/caminhada-exemplo');
    c.stop();
    await vi.waitFor(() => expect(example.leave).toHaveBeenCalledTimes(1));
    expect(order.slice(-2)).toEqual(['navigate /hoje', 'leave em nada']);

    // a rota que o roteiro pediu
    c.start('jornada');
    await vi.waitFor(() => expect(balloon()?.text).toBe('Um.'));
    c.next();
    await vi.waitFor(() => expect(example.leave).toHaveBeenCalledTimes(2));
    expect(order.slice(-2)).toEqual(['navigate /jornada/fases', 'leave em nada']);

    // null: fica onde está
    c.setPath('/progresso/habito/x');
    c.start('progresso');
    await vi.waitFor(() => expect(balloon()?.text).toBe('Um.'));
    const before = navigate.mock.calls.length;
    c.stop();
    await vi.waitFor(() => expect(example.leave).toHaveBeenCalledTimes(3));
    expect(navigate.mock.calls.length).toBe(before);
  });

  it('com o Zeno, pede o gesto do passo e a fala', async () => {
    const { c, zeno } = setup(
      { hoje: { run: 'hoje', steps: [{ id: 'a', target: 'semana', text: 'Olha.', zeno: ['point', 'nod'] }] } },
      { zeno: true },
    );
    c.start('hoje');
    await vi.waitFor(() => expect(zeno.nod).toHaveBeenCalled());
    expect(zeno.talk).toHaveBeenCalledWith('Olha.');
    expect(zeno.pointAt).toHaveBeenCalledWith(document.querySelector('[data-tour="semana"]'));
    c.next();
    await vi.waitFor(() => expect(zeno.leave).toHaveBeenCalled());
  });

  it('um capítulo sem nenhum passo à mostra não fica como visto', async () => {
    const { c, markDone } = setup({
      jornada: { run: 'jornada', steps: [{ id: 'x', target: 'nao-existe', text: 'X.', timeout: 20 }] },
    });
    c.start('jornada');
    await vi.waitFor(() => expect(useTour.getState().run).toBeNull());
    expect(markDone).not.toHaveBeenCalled();
  });

  it('começar outro capítulo no meio troca o roteiro, sem gravar o primeiro', async () => {
    const { c, markDone } = setup({
      hoje: { run: 'hoje', steps: [{ id: 'a', target: 'semana', text: 'Hoje.' }] },
      ajustes: { run: 'ajustes', steps: [{ id: 'b', target: 'grupo', text: 'Ajustes.' }] },
    });
    c.start('hoje');
    await vi.waitFor(() => expect(balloon()?.text).toBe('Hoje.'));
    c.start('ajustes');
    await vi.waitFor(() => expect(balloon()?.text).toBe('Ajustes.'));
    expect(useTour.getState().run).toBe('ajustes');
    c.next();
    await vi.waitFor(() => expect(markDone).toHaveBeenCalledTimes(1));
    expect(markDone).toHaveBeenCalledWith('ajustes');
  });

  describe('modo acompanhar (Começar)', () => {
    const comecar: TourScript = {
      run: 'comecar',
      follow: { within: '/comecar/', end: '/hoje' },
      then: 'hoje',
      steps: [
        { id: 'oi', where: '/comecar/1', target: 'semana', text: 'Oi.', wait: 'next' },
        { id: 'como', where: '/comecar/1', target: 'semana', text: 'Como.' },
        { id: 'pilares', where: '/comecar/2', target: 'grupo', text: 'Pilares.' },
      ],
    };
    const hoje: TourScript = { run: 'hoje', steps: [{ id: 'semana', target: 'semana', text: 'Semana.' }] };

    it('um balão por passo, sem véu e sem foco; recolhe; segue para "O dia" no Hoje', async () => {
      const { c, navigate } = setup({ comecar, hoje });
      c.setPath('/comecar/1');
      c.start('comecar');
      await vi.waitFor(() => expect(balloon()?.text).toBe('Oi.'));
      expect(balloon()).toMatchObject({ follow: true, focus: false, exit: false, next: 'Próximo', counter: null });
      expect(useTourView.getState().veil).toBe('none');
      c.next();
      await vi.waitFor(() => expect(balloon()?.text).toBe('Como.'));
      c.collapse();
      await vi.waitFor(() => expect(useTourView.getState().collapsed).toBe(true));
      // o condutor não navega no Começar: a pessoa segue pelo fluxo
      c.setPath('/comecar/2');
      await vi.waitFor(() => expect(balloon()?.text).toBe('Pilares.'));
      expect(useTourView.getState().collapsed).toBe(false);
      // voltar não repete o balão
      c.setPath('/comecar/1');
      await vi.waitFor(() => expect(balloon()).toBeNull());
      expect(navigate).not.toHaveBeenCalled();
      c.setPath('/hoje');
      await vi.waitFor(() => expect(useTour.getState().run).toBe('hoje'));
      await vi.waitFor(() => expect(balloon()?.text).toBe('Semana.'));
      expect(balloon()?.follow).toBe(false);
    });

    it('sair do fluxo sem terminar não começa "O dia"', async () => {
      const { c } = setup({ comecar, hoje });
      c.setPath('/comecar/1');
      c.start('comecar');
      await vi.waitFor(() => expect(balloon()?.text).toBe('Oi.'));
      c.setPath('/entrar');
      await vi.waitFor(() => expect(useTour.getState().run).toBeNull());
      expect(balloon()).toBeNull();
    });
  });
});
