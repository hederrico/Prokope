// O que as linhas dos Primeiros passos fazem: os mesmos gestos e tempos das linhas de verdade (useTodayActions),
// mas o estado fica em memória (src/stores/practice.ts) e só a primeira vez de cada gesto vai para o perfil
// (src/actions/practice.ts). Cada gesto avisa o tutorial (emitTour), para o passo andar sozinho.
// O Desfazer do toast volta a linha de treino. O instante guardado fica, porque o gesto aconteceu.
import { practiceAdd, practiceMark, practiceRate } from '@/actions';
import { showUndo } from '@/components/shell';
import { mealWord } from '@/data';
import { choreography } from '@/motion/tokens';
import { playSoftTick } from '@/motion/sound';
import { PRACTICE_GOAL, usePractice } from '@/stores/practice';
import { emitTour } from '@/stores/tour';
import type { FirstStepRating } from '@/types';

const MERGE_MS = 1500;
const OUTSIDE = 'não entra nos seus números';

/** O toast sobe no +200 ms da coreografia, contado do toque. */
function later(startedAt: number, fn: () => void) {
  const wait = Math.max(0, choreography.toast * 1000 - (performance.now() - startedAt));
  window.setTimeout(fn, wait);
}

/** O círculo de "Primeira marcação no app". */
export function practiceCheck(on: boolean): void {
  const t0 = performance.now();
  // nível 1 da escada, como ao marcar de verdade (a vibração vem do próprio CheckButton)
  if (on) playSoftTick();
  usePractice.setState({ marked: on });
  emitTour(on ? { type: 'pp-mark' } : { type: 'pp-unmark' });
  if (on) void practiceMark();
  later(t0, () =>
    showUndo(
      on
        ? { title: 'Primeira marcação feita', detail: OUTSIDE, pillar: 'accent', icon: 'check' }
        : { title: 'Primeira marcação desmarcada', pillar: 'accent', icon: 'arrow-counter-clockwise' },
      () => {
        usePractice.setState({ marked: !on });
        emitTour({ type: 'undo' });
      },
    ),
  );
}

// toques seguidos no + em até 1,5 s viram um toast só ("+3"), e o Desfazer volta para antes do primeiro
let chain: { before: number; count: number; at: number } | null = null;

/** O + de "Primeiro registro · 0 de 3": soma 1 por toque, até 3. */
export function practiceAddOne(): void {
  const t0 = performance.now();
  const before = usePractice.getState().added;
  if (before >= PRACTICE_GOAL) return;
  const total = before + 1;
  usePractice.setState({ added: total });
  emitTour({ type: 'pp-add', total });
  void practiceAdd();
  // a sequência continua só se a linha está onde ela deixou (o grupo zerado ou um Desfazer começam outra)
  if (chain && t0 - chain.at <= MERGE_MS && chain.before + chain.count === before) {
    chain.count += 1;
    chain.at = t0;
  } else {
    chain = { before, count: 1, at: t0 };
  }
  const mine = chain;
  later(t0, () =>
    showUndo(
      {
        title: `Primeiro registro · +${mine.count}`,
        detail: `${total} de ${PRACTICE_GOAL}`,
        pillar: 'accent',
        icon: 'plus',
      },
      () => {
        if (chain === mine) chain = null;
        usePractice.setState({ added: mine.before });
      },
    ),
  );
}

/** "Salvar nota 4" na folha de treino: a linha vira "4 · Bom". A folha já fechou; o toast vem 60 ms depois. */
export function practiceRateWith(rating: FirstStepRating): void {
  const before = usePractice.getState().rating;
  usePractice.setState({ rating });
  emitTour({ type: 'pp-rate', rating });
  void practiceRate(rating);
  window.setTimeout(
    () =>
      showUndo(
        { title: `Nota ${rating} · ${mealWord(rating)}`, detail: OUTSIDE, pillar: 'accent', icon: 'check' },
        () => usePractice.setState({ rating: before }),
      ),
    60,
  );
}
