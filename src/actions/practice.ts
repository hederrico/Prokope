// Primeiros passos (tutorial.md › Primeiros passos): o instante da primeira vez de cada gesto de treino, guardado em
// profile.tutorial.firstSteps. Grava por mescla e só se o campo ainda não existe: rever o capítulo usa as mesmas
// linhas sem gravar de novo. Nada daqui vai para marks ou entries, então nada entra nas contas do dia, na
// constância, na força nem nos padrões. O estado das linhas durante o capítulo fica em src/stores/practice.ts.
import { tutorialOf } from '@/domain/tutorial';
import { useDataStore } from '@/stores/data';
import type { FirstStepRating, TutorialState } from '@/types';
import { commit, noUndo, now, profileMerge, type Undo } from './core';

type FirstSteps = NonNullable<TutorialState['firstSteps']>;
type StepField = 'markAt' | 'addAt' | 'rateAt';

// um toque logo depois do outro, antes de o perfil voltar com o campo, não grava duas vezes
const writing = new Set<StepField>();

async function recordOnce(field: StepField, extra: Partial<FirstSteps> = {}): Promise<Undo> {
  const profile = useDataStore.getState().profile;
  if (!profile || writing.has(field)) return noUndo();
  const at = tutorialOf(profile).firstSteps[field];
  if (typeof at === 'number' && at > 0) return noUndo();
  writing.add(field);
  try {
    return await commit([profileMerge({ tutorial: { firstSteps: { [field]: now(), ...extra } } })]);
  } finally {
    writing.delete(field);
  }
}

/**
 * "Primeira marcação no app": grava `markAt` na primeira vez. O desfazer volta o perfil ao que era; o Hoje não o
 * chama no Desfazer do toast, porque o gesto aconteceu (desfazer volta só a linha de treino).
 */
export function practiceMark(): Promise<Undo> {
  return recordOnce('markAt');
}

/** "Primeiro registro": grava `addAt` no primeiro toque no +. */
export function practiceAdd(): Promise<Undo> {
  return recordOnce('addAt');
}

/** "Primeira nota": grava `rateAt` e a nota da primeira vez (as outras notas ficam só na linha). */
export function practiceRate(rating: FirstStepRating): Promise<Undo> {
  return recordOnce('rateAt', { rating });
}
