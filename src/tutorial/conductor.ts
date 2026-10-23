// O condutor do tutorial (docs/interacao/telas/tutorial.md › Condutor): roda os passos de um roteiro, um por vez.
// Para cada passo: navega até a rota, espera o alvo existir, rola até ele, mostra o anel e o balão, pede o gesto ao
// Zeno e espera a ação (o "Próximo", o toque no alvo ou o aviso do onTour). Grava o capítulo como visto só no fim.
// Quem escreve no useTour (run, step, practice) é só ele. O que a camada desenha fica em useTourView.
// Sair (stop) sempre funciona: limpa o véu, desliga o practice, sai do exemplo e manda o Zeno embora.
import { create } from 'zustand';
import { CHAPTERS } from '@/domain/tutorial';
import type { ExampleMode } from '@/data/example';
import { onTour, useTour, type TourEvent, type TourRun } from '@/stores/tour';
import type { Habit, TutorialChapter } from '@/types';
import type { ZenoController } from '@/zeno';
import type { StepTarget, StepWait, TourContext, TourScript, TourStep, ZenoMove } from './types';

// ---------- o que a camada desenha ----------

export interface BalloonView {
  /** muda a cada passo (o balão troca com a entrada) */
  key: string;
  text: string;
  /** "3 de 9" (sem contador num roteiro de um passo) */
  counter: string | null;
  /** o rótulo do botão do passo de olhar; null no passo de fazer */
  next: string | null;
  /** "Sair do tutorial" */
  exit: boolean;
  /** o foco vai para o balão ao abrir (no Começar, o foco fica com o título do passo) */
  focus: boolean;
  /** modo acompanhar: sem véu, e o balão se recolhe quando a pessoa usa a tela */
  follow: boolean;
  /** é a resposta depois da ação ("Isso.") */
  reply: boolean;
  /** onde o balão fica sem o Zeno (o "place" do passo) */
  place: 'near' | 'top' | 'bottom';
  /** encostado em cima, o balão cobre este elemento por inteiro (o "cover" do modo acompanhar) */
  cover: string | null;
}

export interface TourView {
  balloon: BalloonView | null;
  /** o alvo do anel (null: sem anel) */
  target: Element | null;
  /** o alvo como foi escrito no roteiro, para achar de novo se a tela trocar o elemento */
  targetSpec: string | null;
  /** a região em volta do alvo que o balão não cobre (o "around" do passo); null: só o alvo */
  around: Element | null;
  /** look: o véu segura todos os toques; do: só o alvo responde; none: sem véu */
  veil: 'none' | 'look' | 'do';
  stepId: string | null;
  /** o balão foi recolhido (modo acompanhar) */
  collapsed: boolean;
}

const IDLE: TourView = {
  balloon: null,
  target: null,
  targetSpec: null,
  around: null,
  veil: 'none',
  stepId: null,
  collapsed: false,
};

export const useTourView = create<TourView>(() => IDLE);

// ---------- dependências (trocadas nos testes) ----------

export interface ConductorDeps {
  scripts: Partial<Record<TourRun, TourScript>>;
  /** navega pelo router (a camada liga ao montar) */
  navigate(to: string): void;
  zeno(): ZenoController;
  example(): ExampleMode;
  habits(): Habit[];
  /** acha o alvo à mostra, ou null */
  find(target: StepTarget, ctx: TourContext): Element | null;
  /** rola até o alvo e espera ele parar de mexer */
  reveal(el: Element, isLive: () => boolean): Promise<void>;
  /** espera o alvo existir, até timeout ms */
  waitFor<T>(find: () => T | null, timeout: number, isLive: () => boolean): Promise<T | null>;
  markDone(ch: TutorialChapter): Promise<unknown>;
}

const CHAPTER_IDS = new Set<string>(CHAPTERS.map((c) => c.id));
/** As raízes das abas (navegacao.md › Rotas): o primeiro trecho da rota diz a aba. */
const TAB_ROOTS = ['/hoje', '/progresso', '/jornada', '/ajustes'];
export const isChapter = (run: TourRun): run is TutorialChapter => CHAPTER_IDS.has(run);

/** Só o caminho, sem a busca. */
const pathPart = (to: string) => to.split(/[?#]/)[0] || '/';

interface Active {
  token: number;
  script: TourScript;
  ctx: TourContext;
  /** entrou no modo exemplo */
  exampleOn: boolean;
  /** quantos passos apareceram (sem nenhum, o capítulo não fica como visto) */
  shown: number;
  /** esperas em andamento; sair resolve todas */
  cancels: Set<() => void>;
}

type Source = (done: (why: string) => void) => () => void;

export interface TourState {
  run: TourRun | null;
  step: number;
  practice: boolean;
  stepId: string | null;
  text: string | null;
  counter: string | null;
  veil: TourView['veil'];
  collapsed: boolean;
}

export function createConductor(deps: ConductorDeps) {
  let token = 0;
  let active: Active | null = null;
  // a saída do roteiro que terminou, até os dados da pessoa voltarem: um roteiro novo espera ela, para a saída de
  // antes não levar junto o exemplo do novo
  let closing: Promise<void> = Promise.resolve();
  let path = '/';
  const pathListeners = new Set<() => void>();
  const nextListeners = new Set<() => void>();
  const collapseListeners = new Set<() => void>();

  const live = (t: number) => t === token;

  function view(patch: Partial<TourView>) {
    useTourView.setState(patch);
  }

  function makeCtx(run: TourRun): TourContext {
    return {
      run,
      path: () => path,
      navigate: (to) => deps.navigate(to),
      get zeno() {
        return deps.zeno();
      },
      get example() {
        return deps.example();
      },
      setPractice: (on) => useTour.setState({ practice: on }),
      habits: () => deps.habits(),
      hasHabitType: (type) => deps.habits().some((h) => h.type === type),
    };
  }

  const passes = (step: TourStep, ctx: TourContext) => {
    try {
      return !step.when || step.when(ctx);
    } catch {
      return false;
    }
  };
  const whereOf = (step: TourStep, ctx: TourContext) =>
    typeof step.where === 'function' ? step.where(ctx) : (step.where ?? null);
  const textOf = (step: TourStep, ctx: TourContext) => (typeof step.text === 'function' ? step.text(ctx) : step.text);
  const specOf = (step: TourStep) => (typeof step.target === 'string' ? step.target : null);
  const aroundOf = (step: TourStep, el: Element | null) => {
    if (!el || !step.around) return null;
    try {
      return el.closest(step.around);
    } catch {
      return null;
    }
  };

  /** Espera a primeira das fontes; sair do roteiro resolve com null. */
  function waitAny(a: Active, sources: Source[]): Promise<string | null> {
    return new Promise((resolve) => {
      const cleanups: (() => void)[] = [];
      let settled = false;
      const done = (why: string | null) => {
        if (settled) return;
        settled = true;
        for (const c of cleanups) c();
        a.cancels.delete(cancel);
        resolve(why);
      };
      const cancel = () => done(null);
      a.cancels.add(cancel);
      for (const s of sources) {
        if (settled) break;
        cleanups.push(s(done));
      }
    });
  }

  const fromSet =
    (set: Set<() => void>, why: string): Source =>
    (done) => {
      const fn = () => done(why);
      set.add(fn);
      return () => set.delete(fn);
    };
  const onPath: Source = fromSet(pathListeners, 'path');
  const onNext: Source = fromSet(nextListeners, 'next');
  const onCollapse: Source = fromSet(collapseListeners, 'collapse');
  const after =
    (ms: number): Source =>
    (done) => {
      const id = setTimeout(() => done('time'), ms);
      return () => clearTimeout(id);
    };
  const onTap =
    (el: Element | null, spec: string | null): Source =>
    (done) => {
      let sel: string | null = null;
      if (spec) sel = /^[\w-]+$/.test(spec) ? `[data-tour="${spec}"]` : spec;
      const onClick = (e: Event) => {
        const node = e.target as Element | null;
        if (!node) return;
        const hit = (el && el.contains(node)) || (sel && typeof node.closest === 'function' && node.closest(sel));
        // o toque segue para o alvo, que faz o que sempre faz; o passo anda depois
        if (hit) setTimeout(() => done('tap'), 0);
      };
      document.addEventListener('click', onClick, true);
      return () => document.removeEventListener('click', onClick, true);
    };
  const onEvent =
    (w: { event: TourEvent['type']; match?: (e: TourEvent) => boolean }): Source =>
    (done) =>
      onTour((e) => {
        if (e.type === w.event && (!w.match || w.match(e))) done('event');
      });

  function waitPath(a: Active, where: string, timeout: number): Promise<string | null> {
    if (pathPart(where) === path) return Promise.resolve('path');
    return waitAny(a, [
      (done) => {
        const fn = () => {
          if (pathPart(where) === path) done('path');
        };
        pathListeners.add(fn);
        return () => pathListeners.delete(fn);
      },
      after(timeout),
    ]);
  }

  function actionSources(wait: StepWait, el: Element | null, spec: string | null): Source[] {
    if (wait === 'next') return [onNext];
    if (wait === 'tap') return [onTap(el, spec)];
    if (wait === 'none') return [];
    return [onEvent(wait)];
  }

  function zenoAct(moves: ZenoMove | ZenoMove[] | undefined, el: Element | null, text: string | null) {
    const z = deps.zeno();
    if (!z.available) return;
    const list = moves ? (Array.isArray(moves) ? moves : [moves]) : [];
    void (async () => {
      if (text) z.talk(text);
      for (const m of list) {
        switch (m) {
          case 'point':
            if (el) await z.pointAt(el);
            break;
          case 'look':
            if (el) z.lookAt(el, 1500);
            break;
          case 'wave':
            await z.wave();
            break;
          case 'nod':
            await z.nod();
            break;
          case 'hop':
            await z.hop();
            break;
          case 'sit':
            await z.sit();
            break;
          case 'stand':
            await z.stand();
            break;
          case 'rest':
            z.rest();
            break;
          case 'celebrate':
            await z.celebrate('small');
            break;
          case 'party':
            await z.celebrate('medium');
            break;
          case 'shell':
            await z.showShell();
            break;
        }
      }
    })().catch(() => undefined);
  }

  // ---------- modo guiado: os capítulos ----------

  async function runGuided(a: Active) {
    const { script, ctx } = a;
    const t = a.token;
    const steps = script.steps;
    // a conta do "3 de 9" sai das condições no começo; um passo que cai depois (condição ou alvo) sai da conta
    const counted = new Set(steps.filter((s) => passes(s, ctx)));
    let total = counted.size;
    let index = 0;
    for (let i = 0; i < steps.length; i++) {
      if (!live(t)) return;
      const step = steps[i];
      if (!passes(step, ctx)) {
        if (counted.has(step)) total--;
        continue;
      }
      if (!counted.has(step)) {
        counted.add(step);
        total++;
      }
      useTour.setState({ step: i });
      // entre um passo e outro, o anel some e o balão sai; o véu fica
      view({ balloon: null, target: null, targetSpec: null, around: null, stepId: step.id });

      const where = whereOf(step, ctx);
      if (where && pathPart(where) !== path) {
        deps.navigate(where);
        await waitPath(a, where, 4000);
        if (!live(t)) return;
      }

      let el: Element | null = null;
      const target = step.target;
      if (target) {
        el = await deps.waitFor(
          () => deps.find(target, ctx),
          step.timeout ?? 3000,
          () => live(t),
        );
        if (!live(t)) return;
        if (!el) {
          // o alvo não existe nesta tela (outro estado do dia, outro plano): o passo sai da conta
          total--;
          continue;
        }
        await deps.reveal(el, () => live(t));
        if (!live(t)) return;
      }

      await step.enter?.(ctx);
      if (!live(t)) return;
      index++;
      a.shown++;
      const wait = step.wait ?? 'next';
      const isLast = !steps.slice(i + 1).some((s) => passes(s, ctx));
      const text = textOf(step, ctx);
      const veil = wait === 'next' ? 'look' : el ? 'do' : 'none';
      view({
        balloon: {
          key: `${script.run}:${step.id}`,
          text,
          counter: total > 1 ? `${index} de ${total}` : null,
          next: wait === 'next' ? (step.nextLabel ?? (isLast ? 'Concluir' : 'Próximo')) : null,
          exit: true,
          focus: true,
          follow: false,
          reply: false,
          place: step.place ?? 'near',
          cover: null,
        },
        target: el,
        targetSpec: specOf(step),
        around: aroundOf(step, el),
        veil,
        collapsed: false,
      });
      zenoAct(step.zeno, el, text);

      const why = await waitAny(a, actionSources(wait, el, specOf(step)));
      if (!live(t) || why === null) return;

      if (step.reply) {
        const r = typeof step.reply === 'string' ? { text: step.reply } : step.reply;
        const cur = useTourView.getState().balloon;
        if (r.text && cur) {
          view({ balloon: { ...cur, text: r.text, next: null, reply: true } });
        }
        zenoAct(r.zeno ?? 'nod', el, r.text ?? null);
        await waitAny(a, [after(r.ms ?? 1600)]);
        if (!live(t)) return;
      }
      await step.leave?.(ctx);
    }
    if (!live(t)) return;
    await finish(a, 'done');
  }

  // ---------- modo acompanhar: o Começar ----------

  async function runFollow(a: Active) {
    const { script, ctx } = a;
    const t = a.token;
    const follow = script.follow!;
    const seen = new Set<string>();
    while (live(t)) {
      const here = path;
      if (here === follow.end || here.startsWith(follow.end + '/')) {
        await finish(a, 'done');
        return;
      }
      if (!here.startsWith(follow.within)) {
        // saiu do fluxo sem terminar (trocou de conta, saiu): o roteiro acaba sem seguir para o próximo
        await finish(a, 'stop');
        return;
      }
      const i = script.steps.findIndex((s) => {
        const w = whereOf(s, ctx);
        return !seen.has(s.id) && (!w || pathPart(w) === here) && passes(s, ctx);
      });
      if (i < 0) {
        view({ balloon: null, target: null, targetSpec: null, around: null, veil: 'none' });
        await waitAny(a, [onPath]);
        continue;
      }
      const step = script.steps[i];
      seen.add(step.id);
      useTour.setState({ step: i });

      let el: Element | null = null;
      const target = step.target;
      if (target) {
        el = await deps.waitFor(
          () => (path === here ? deps.find(target, ctx) : null),
          step.timeout ?? 3000,
          () => live(t) && path === here,
        );
        if (!live(t)) return;
        if (!el) continue;
      }
      await step.enter?.(ctx);
      if (!live(t)) return;
      a.shown++;
      const wait = step.wait ?? 'none';
      const text = textOf(step, ctx);
      view({
        balloon: {
          key: `${script.run}:${step.id}`,
          text,
          counter: null,
          next: wait === 'next' ? (step.nextLabel ?? 'Próximo') : null,
          // sem "Sair do tutorial": o balão se recolhe sozinho quando a pessoa usa a tela
          exit: false,
          focus: false,
          follow: true,
          reply: false,
          place: step.place ?? 'top',
          cover: follow.cover ?? null,
        },
        target: el,
        targetSpec: specOf(step),
        around: aroundOf(step, el),
        veil: 'none',
        collapsed: false,
        stepId: step.id,
      });
      zenoAct(step.zeno, el, text);
      const why = await waitAny(a, [...actionSources(wait, el, specOf(step)), onPath, onCollapse]);
      if (!live(t) || why === null) return;
      if (why === 'collapse') {
        view({ collapsed: true });
        // o Zeno fica à toa num canto até a pessoa seguir
        const z = deps.zeno();
        if (z.available) z.rest();
        await waitAny(a, [onPath]);
        if (!live(t)) return;
      }
      await step.leave?.(ctx);
    }
  }

  // ---------- começo e fim ----------

  async function runScript(a: Active, opts: { keepZeno?: boolean }) {
    const t = a.token;
    try {
      await a.script.enter?.(a.ctx);
      if (!live(t)) return;
      const run = a.script.run;
      const wantsExample = a.script.example ?? (isChapter(run) && !!CHAPTERS.find((c) => c.id === run)?.example);
      if (wantsExample) {
        a.exampleOn = true;
        await deps.example().enter();
        if (!live(t)) return;
      }
      const z = deps.zeno();
      if (z.available && !z.present && !opts.keepZeno) await z.enter({ place: 'bottom', wave: false });
      if (!live(t)) return;
      if (a.script.follow) await runFollow(a);
      else await runGuided(a);
    } catch (err) {
      console.error('[tutorial]', err);
      if (live(t)) stop();
    }
  }

  /**
   * Limpa o que o roteiro ligou. `keepZeno`: o próximo roteiro continua com o Zeno em cena. `dataBack` avisa quando
   * os dados da pessoa voltaram (antes de o Zeno ir embora, que pode demorar).
   */
  async function cleanup(a: Active, reason: 'done' | 'stop', keepZeno: boolean, dataBack?: () => void) {
    try {
      await a.script.leave?.(a.ctx, reason);
    } catch (err) {
      console.error('[tutorial]', err);
    }
    const ex = deps.example();
    if (a.exampleOn || ex.active) {
      // antes de os dados da pessoa voltarem, sai da tela do exemplo (um hábito que só existe na história)
      const home = exampleHomeOf(a.script);
      if (home && pathPart(home) !== path) {
        deps.navigate(home);
        await untilPath(home, 1500);
      }
      await ex.leave().catch(() => undefined);
    }
    dataBack?.();
    const z = deps.zeno();
    if (!keepZeno && z.available && z.present) await z.leave().catch(() => undefined);
  }

  /** Onde a pessoa fica ao sair do exemplo: a raiz da aba de agora (padrão), a rota do roteiro, ou onde está. */
  function exampleHomeOf(script: TourScript): string | null {
    const home = script.exampleHome === undefined ? 'tab' : script.exampleHome;
    if (home !== 'tab') return home;
    return TAB_ROOTS.find((r) => path === r || path.startsWith(r + '/')) ?? null;
  }

  /** Espera o caminho chegar (fora de um roteiro: na saída), até `timeout` ms. */
  function untilPath(where: string, timeout: number): Promise<void> {
    if (pathPart(where) === path) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        pathListeners.delete(check);
        clearTimeout(id);
        resolve();
      };
      const check = () => {
        if (pathPart(where) === path) done();
      };
      const id = setTimeout(done, timeout);
      pathListeners.add(check);
    });
  }

  async function finish(a: Active, reason: 'done' | 'stop') {
    if (active !== a) return;
    const run = a.script.run;
    const next = reason === 'done' ? a.script.then : undefined;
    const chain = !!(next && deps.scripts[next]);
    // a tela fica limpa na hora; o resto (exemplo, Zeno) sai em seguida
    token++;
    for (const c of [...a.cancels]) c();
    active = null;
    if (!chain) {
      useTourView.setState(IDLE);
      useTour.setState({ run: null, step: 0, practice: false });
    }
    // um roteiro novo espera só os dados da pessoa voltarem (o exemplo sair), e não o Zeno ir embora
    let dataBack: () => void = () => undefined;
    closing = new Promise<void>((resolve) => (dataBack = resolve));
    try {
      if (reason === 'done' && isChapter(run) && a.shown > 0) await deps.markDone(run).catch(() => undefined);
      await cleanup(a, reason, chain, dataBack);
    } finally {
      dataBack();
    }
    if (chain && next) start(next, { keepZeno: true });
  }

  function start(run: TourRun, opts: { keepZeno?: boolean } = {}): boolean {
    const script = deps.scripts[run];
    if (!script) return false;
    const prev = active;
    if (prev) {
      token++;
      for (const c of [...prev.cancels]) c();
      active = null;
    }
    const t = ++token;
    const a: Active = { token: t, script, ctx: makeCtx(run), exampleOn: false, shown: 0, cancels: new Set() };
    active = a;
    useTourView.setState(IDLE);
    useTour.setState({ run, step: 0, practice: false });
    const keepZeno = opts.keepZeno || (!!prev && deps.zeno().present);
    const before = closing;
    void (async () => {
      // o roteiro de antes sai primeiro (do exemplo, na raiz da aba), e o novo começa depois; com um que acabou de
      // terminar e ainda está saindo (o último passo de "Os ajustes" abre a lista dos capítulos), o novo espera os
      // dados da pessoa voltarem
      await before;
      if (prev) await cleanup(prev, 'stop', true);
      if (live(t)) await runScript(a, { keepZeno });
    })();
    return true;
  }

  function stop() {
    const a = active;
    if (!a) {
      useTourView.setState(IDLE);
      useTour.setState({ run: null, step: 0, practice: false });
      return;
    }
    void finish(a, 'stop');
  }

  return {
    start,
    stop,
    /** o "Próximo" do balão */
    next() {
      for (const fn of [...nextListeners]) fn();
    },
    /** recolhe o balão do modo acompanhar (a pessoa tocou na tela, abriu uma folha, o alvo sumiu) */
    collapse() {
      for (const fn of [...collapseListeners]) fn();
    },
    /** a camada avisa a cada troca de lugar */
    setPath(next: string) {
      const p = pathPart(next);
      if (p === path) return;
      path = p;
      for (const fn of [...pathListeners]) fn();
    },
    /** troca as dependências (a camada liga o navigate, o Zeno e o exemplo de verdade) */
    bind(patch: Partial<ConductorDeps>) {
      Object.assign(deps, patch);
    },
    get running(): TourRun | null {
      return active?.script.run ?? null;
    },
    get state(): TourState {
      const tour = useTour.getState();
      const v = useTourView.getState();
      return {
        run: tour.run,
        step: tour.step,
        practice: tour.practice,
        stepId: v.stepId,
        text: v.balloon?.text ?? null,
        counter: v.balloon?.counter ?? null,
        veil: v.veil,
        collapsed: v.collapsed,
      };
    },
  };
}

export type Conductor = ReturnType<typeof createConductor>;
