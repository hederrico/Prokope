// Os nomes e os ícones dos blocos do treino guiado: o esforço e o descanso vêm do plano do hábito ("Correr" e
// "Caminhar", "Pedalar" e "Pedalar leve"); aquecimento e volta à calma são sempre os mesmos.
import type { RunBlockKind, TrainingNames } from '@/data';
import type { IconName } from '@/icons';

/** "Correr", "Caminhar", "Aquecimento", "Volta à calma". */
export function blockWord(kind: RunBlockKind, names: TrainingNames): string {
  switch (kind) {
    case 'effort':
      return names.effort;
    case 'rest':
      return names.rest;
    case 'warmup':
      return 'Aquecimento';
    default:
      return 'Volta à calma';
  }
}

/** O mesmo nome no meio de uma frase ("Depois: caminhar"). */
export function blockWordLower(kind: RunBlockKind, names: TrainingNames): string {
  return blockWord(kind, names).toLocaleLowerCase('pt-BR');
}

/** O ícone do descanso: caminhar quando o nome é caminhar ou andar; senão, um respiro. */
export function restIcon(names: TrainingNames): IconName {
  return /caminh|andar/i.test(names.rest) ? 'person-simple-walk' : 'wind';
}

/** O ícone de cada bloco: o esforço usa o ícone do hábito; os outros, o do descanso. */
export function blockIcon(kind: RunBlockKind, names: TrainingNames, habitIcon: IconName | undefined): IconName {
  if (kind === 'effort') return habitIcon ?? 'person-simple-run';
  return restIcon(names);
}
