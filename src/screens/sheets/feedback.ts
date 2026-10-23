// Fechar uma folha de pergunta depois de gravar: a folha desce e o toast com Desfazer entra 60 ms depois,
// na tela de origem (registros.md › Comum a todas as folhas › Como sai).
import type { Undo } from '@/actions';
import { showUndo, type UndoInput } from '@/components/shell';

export function closeThenUndo(close: () => void, input: UndoInput, undo: Undo, onUndo?: () => void): void {
  close();
  window.setTimeout(() => {
    showUndo(input, () => {
      void undo().then(() => onUndo?.());
    });
  }, 60);
}

/** No botão do pé de uma folha com teclado: o toque não tira o foco do campo antes do clique. Senão o teclado
 *  começa a descer no toque, o botão desce junto e o clique cai fora dele (Android e navegador do computador). */
export function keepFocus(e: { preventDefault: () => void }): void {
  e.preventDefault();
}

/** Tira o foco do campo (fecha o teclado do iPhone junto com a folha). */
export function blurActive(): void {
  const el = document.activeElement;
  if (el instanceof HTMLElement && el.matches('input, textarea')) el.blur();
}
