// Estado da casca que não é dado da pessoa: o que está aberto agora. O aviso de versão nova espera não haver
// folha nem tela cheia nem Desfazer na tela (telas/estados.md › Nova versão pronta).
import { create } from 'zustand';

interface ShellState {
  /** uma folha está aberta (pelo ?folha= ou local) */
  sheetOpen: boolean;
  /** a tela atual é uma tela cheia (sem a barra de abas) */
  fullScreen: boolean;
  /** um toast com Desfazer está na tela */
  undoVisible: boolean;
  /** última vez que a pessoa tocou na tela (ms, performance.now) */
  lastTouch: number;
}

export const useShellState = create<ShellState>()(() => ({
  sheetOpen: false,
  fullScreen: false,
  undoVisible: false,
  lastTouch: 0,
}));

export function setShellState(patch: Partial<ShellState>): void {
  useShellState.setState(patch);
}

let openSheets = 0;
/** Conta as folhas abertas (a do ?folha= e as locais). Devolve a função que fecha a conta. */
export function trackSheetOpen(): () => void {
  openSheets++;
  setShellState({ sheetOpen: true });
  let done = false;
  return () => {
    if (done) return;
    done = true;
    openSheets = Math.max(0, openSheets - 1);
    setShellState({ sheetOpen: openSheets > 0 });
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => setShellState({ lastTouch: performance.now() }), {
    capture: true,
    passive: true,
  });
  window.addEventListener('keydown', () => setShellState({ lastTouch: performance.now() }), {
    capture: true,
    passive: true,
  });
}
