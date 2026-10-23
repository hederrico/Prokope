// Ponto de entrada do Zeno: useZeno() devolve o controlador e <ZenoHost /> fica uma vez só na raiz do app.
// Este arquivo é leve e fica no pedaço principal do JavaScript. O desenho (src/zeno/zeno3d.ts, o boneco e o
// three.js) chega sob demanda, no primeiro enter(), e entra no pacote offline do service worker.
// Sem "Mostrar o Zeno" (Ajustes › Aparência) ou num aparelho sem WebGL, available é falso e tudo vira nada:
// o tutorial segue só com o balão.
import { createElement, useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { usePreferences } from '@/app/preferences';
import { usePillars } from '@/data/hooks';
import { zenoShown } from '@/domain/tutorial';
import { prefersReducedMotion } from '@/motion/reducedMotion';
import { useDataStore } from '@/stores/data';
import { shellColors } from './shell';
import type { ZenoBridge, ZenoRuntime } from './zeno3d';
import type { ZenoController, ZenoScene, ZenoTap } from './types';
import './zeno.css';

export type { ZenoController, ZenoGaze, ZenoPlace, ZenoScene, ZenoTap, ZenoTarget } from './types';

// ---------- o aparelho desenha? ----------
let webgl: boolean | null = null;

function detectWebGL(): boolean {
  // o three.js 0.170 só desenha com WebGL 2
  if (typeof document === 'undefined' || typeof WebGL2RenderingContext === 'undefined') return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** O aparelho consegue criar um contexto WebGL 2 (conferido uma vez, na primeira pergunta). */
export function webglSupported(): boolean {
  webgl ??= detectWebGL();
  return webgl;
}

// ---------- estado que a interface acompanha ----------
const useZenoStore = create<{ present: boolean; failed: boolean }>(() => ({ present: false, failed: false }));

const moveListeners = new Set<() => void>();
const tapListeners = new Set<(tap: ZenoTap) => void>();
const pillarListeners = new Set<() => void>();
let pillarKeys: readonly string[] = [];
let host: HTMLElement | null = null;
let runtime: ZenoRuntime | null = null;
let loading: Promise<ZenoRuntime | null> | null = null;
/** a última ordem foi entrar (um leave() no meio da carga cancela a entrada) */
let wanted = false;
/** o corpo pega o toque (touch); vale também para o desenho que ainda vai carregar */
let touchable = true;

const bridge: ZenoBridge = {
  shell: (dark) => shellColors(pillarKeys, dark),
  onPillars(cb) {
    pillarListeners.add(cb);
    return () => pillarListeners.delete(cb);
  },
  reduced: prefersReducedMotion,
  onMotion(cb) {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', cb);
    const off = usePreferences.subscribe(cb);
    return () => {
      mq.removeEventListener('change', cb);
      off();
    };
  },
  presence: (present) => useZenoStore.setState({ present }),
  moved() {
    for (const cb of [...moveListeners]) cb();
  },
  tapped(tap) {
    for (const cb of [...tapListeners]) cb(tap);
  },
};

function load(): Promise<ZenoRuntime | null> {
  if (runtime) return Promise.resolve(runtime);
  loading ??= import('./zeno3d')
    .then((mod) => {
      if (!host) return null;
      runtime = mod.createRuntime(host, bridge);
      runtime.setTouch(touchable);
      return runtime;
    })
    .catch((err: unknown) => {
      // sem o pedaço (sem internet, antes de o pacote offline chegar): o tutorial segue só com o balão
      console.warn('O Zeno não carregou agora.', err);
      loading = null;
      return null;
    })
    .finally(() => {
      if (!runtime) loading = null;
    });
  return loading;
}

const done = () => Promise.resolve();
/** o runtime, só com ele em cena */
const live = () => (runtime?.present ? runtime : null);

function isAvailable(): boolean {
  return !useZenoStore.getState().failed && zenoShown(useDataStore.getState().profile?.prefs) && webglSupported();
}

/** O controlador do Zeno: um só para o app inteiro. Fora de cena, os gestos não fazem nada e resolvem na hora. */
export const zeno: ZenoController = {
  get available() {
    return isAvailable();
  },
  get present() {
    return useZenoStore.getState().present;
  },
  async enter(opts = {}) {
    if (!isAvailable()) return;
    wanted = true;
    const rt = await load();
    if (!rt || !wanted || !isAvailable()) return;
    if (!rt.ensureRenderer()) {
      useZenoStore.setState({ failed: true });
      return;
    }
    await rt.enter(opts.place ?? 'bottom', !!opts.wave);
  },
  leave() {
    wanted = false;
    return runtime?.present ? runtime.leave() : done();
  },
  moveTo: (place) => live()?.moveTo(place) ?? done(),
  lookAt: (target, holdMs) => live()?.lookAtTarget(target, holdMs),
  pointAt: (target) => live()?.pointAt(target) ?? done(),
  rest: () => live()?.rest(),
  talk: (text) => live()?.talk(text),
  wave: () => live()?.wave() ?? done(),
  nod: () => live()?.nod() ?? done(),
  hop: () => live()?.hop() ?? done(),
  sit: () => live()?.sit() ?? done(),
  stand: () => live()?.stand() ?? done(),
  celebrate: (level) => live()?.celebrate(level) ?? done(),
  showShell: () => live()?.showShell() ?? done(),
  anchor: () => live()?.anchor() ?? null,
  onMove(cb) {
    moveListeners.add(cb);
    return () => {
      moveListeners.delete(cb);
    };
  },
  onTap(cb) {
    tapListeners.add(cb);
    return () => {
      tapListeners.delete(cb);
    };
  },
  scene: (id: ZenoScene) => live()?.scene(id) ?? done(),
  touch(on) {
    touchable = on;
    runtime?.setTouch(on);
  },
};

/** O controlador do Zeno; a tela redesenha quando available ou present mudam. */
export function useZeno(): ZenoController {
  useDataStore((s) => zenoShown(s.profile?.prefs));
  useZenoStore((s) => s.present);
  useZenoStore((s) => s.failed);
  return zeno;
}

/** Os números do desenho, para a tela /dev/zeno e os testes (null antes da primeira entrada). */
export function zenoStats(): ReturnType<ZenoRuntime['stats']> | null {
  return runtime?.stats() ?? null;
}

/** Só para capturas: segura o tempo da cena. */
export function freezeZeno(on: boolean): void {
  runtime?.freeze(on);
}

/**
 * O palco do Zeno, por cima da tela (z-index 70). Fica uma vez só, dentro do .sh-app: leva as cores dos pilares
 * ativos para o casco e tira o Zeno de cena quando a pessoa desliga "Mostrar o Zeno".
 */
export function ZenoHost() {
  const shown = useDataStore((s) => zenoShown(s.profile?.prefs));
  const present = useZenoStore((s) => s.present);
  const colors = usePillars()
    .map((p) => p.pillar.color)
    .join(',');

  useEffect(() => {
    pillarKeys = colors ? colors.split(',') : [];
    for (const cb of [...pillarListeners]) cb();
  }, [colors]);

  useEffect(() => {
    if (!shown && present) void zeno.leave();
  }, [shown, present]);

  const ref = useCallback((el: HTMLDivElement | null) => {
    host = el;
    if (el) runtime?.attach(el);
  }, []);

  return createElement('div', { className: 'zn-stage', 'aria-hidden': true, ref });
}

// testes automáticos (Playwright): o controlador e os números do desenho, como o window.Zeno do laboratório
if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.webdriver) {
  (window as unknown as { __pkZeno: unknown }).__pkZeno = {
    zeno,
    get available() {
      return zeno.available;
    },
    get present() {
      return zeno.present;
    },
    get frames() {
      return runtime?.loop.frames ?? 0;
    },
    get drawing() {
      return runtime?.loop.drawing ?? false;
    },
    stats: zenoStats,
    freeze: freezeZeno,
    params: () => (runtime ? Object.fromEntries(Object.entries(runtime.P).map(([k, p]) => [k, p.t])) : null),
  };
}
