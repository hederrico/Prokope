// A entrada dos Primeiros passos na Jornada (jornada.md › Primeiros passos com o Zeno): uma entrada só, com a data
// do primeiro gesto e o que foi feito, no ponto do caminho em que ela aconteceu.
import type { DayKey, Millis, TutorialState } from '@/types';
import { DEFAULT_CLOCK, logicalDay, type Clock } from './day';

export const FIRST_STEPS_TITLE = 'Primeiros passos com o Zeno';

export type FirstStepKind = 'mark' | 'add' | 'rate';

export interface FirstStepsEntry {
  /** o instante do primeiro gesto */
  at: Millis;
  /** o dia lógico dele */
  day: DayKey;
  /** o que foi feito, na ordem das linhas do grupo */
  kinds: FirstStepKind[];
  /** "a primeira marcação, o primeiro registro e a primeira nota" */
  text: string;
}

const PHRASES: Record<FirstStepKind, string> = {
  mark: 'a primeira marcação',
  add: 'o primeiro registro',
  rate: 'a primeira nota',
};

const FIELDS: [FirstStepKind, 'markAt' | 'addAt' | 'rateAt'][] = [
  ['mark', 'markAt'],
  ['add', 'addAt'],
  ['rate', 'rateAt'],
];

function validAt(value: unknown): value is Millis {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** "a, b e c" */
function joinPhrases(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

/** A entrada da Jornada, ou null antes do primeiro gesto (e com dados que não são instantes). */
export function firstStepsEntry(
  steps: TutorialState['firstSteps'] | null | undefined,
  clock: Clock = DEFAULT_CLOCK,
): FirstStepsEntry | null {
  if (!steps) return null;
  const done = FIELDS.filter(([, field]) => validAt(steps[field]));
  if (!done.length) return null;
  const at = Math.min(...done.map(([, field]) => steps[field] as Millis));
  const kinds = done.map(([kind]) => kind);
  return { at, day: logicalDay(at, clock), kinds, text: joinPhrases(kinds.map((k) => PHRASES[k])) };
}

/**
 * Onde a entrada fica no caminho das fases: antes da primeira fase que ainda não tinha começado no dia dela (ou que
 * começou naquele dia). Numa conta nova, é o começo do caminho; numa que já estava na fase 2, fica entre a fase 2
 * e a 3. Depois de todas, o fim.
 */
export function firstStepsIndex(phases: readonly { start: DayKey | null }[], day: DayKey): number {
  const i = phases.findIndex((p) => !p.start || p.start >= day);
  return i < 0 ? phases.length : i;
}
