// Os ganchos de teste da casca (src/app/router.tsx) e do Zeno (src/zeno/index.ts): só existem com navegador
// automatizado (navigator.webdriver).
// Uma declaração só para todos os testes; os specs usam window.__pkShell sem redeclarar.
// O do modo exemplo (window.__pkExample: enter, leave e active) fica declarado em src/data/example.ts.
export {};

interface ShellHookToastInput {
  title: string;
  detail?: string;
  pillar?: string;
  icon?: string;
}

interface ShellHook {
  navigate: (to: string, opts?: { state?: unknown; replace?: boolean }) => Promise<void>;
  showUndo: (input: ShellHookToastInput, undo: () => void) => string;
  showToast: (input: ShellHookToastInput & { id?: string; duration?: number }) => string;
}

/** O gancho do Zeno (src/zeno/index.ts), como o window.Zeno do laboratório: o controlador e os números do desenho. */
interface ZenoHook {
  zeno: import('../../src/zeno/types').ZenoController;
  readonly available: boolean;
  readonly present: boolean;
  /** quadros desenhados desde o primeiro enter() */
  readonly frames: number;
  /** o laço está rodando (a 60 ou a 30) */
  readonly drawing: boolean;
  stats(): {
    rate: 0 | 30 | 60;
    present: boolean;
    pointing: boolean;
    seated: boolean;
    sleeping: string | null;
    released: boolean;
    spot: { side: string; row: string; x: number; y: number };
    box: { left: number; top: number; width: number; height: number } | null;
  } | null;
  freeze(on: boolean): void;
  /** o alvo de cada parâmetro do corpo (fL e fR: o dedo de apontar) */
  params(): Record<string, number> | null;
}

declare global {
  interface Window {
    __pkShell: ShellHook;
    __pkZeno: ZenoHook;
    /** marcado pelos testes do Desfazer */
    __undone?: boolean;
  }
}
