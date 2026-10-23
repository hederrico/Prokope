// O que o editor do plano do Treino guiado faz com as semanas (ajustes-plano.md › Plano do treino): adicionar,
// duplicar, remover, trocar o formato de uma semana e usar um modelo. Funções puras, sem tela (testadas em
// __tests__/trainingEdit.test.ts). Os minutos andam de meio em meio.
import { blankPlan, clonePlan, planWeeks, templateOf, TRAINING_TEMPLATES } from '@/data';
import type { TrainingPlan, TrainingWeek } from '@/types';
import { runWeekLabel } from '@/screens/journey/shared';

export type WeekKind = TrainingWeek['kind'];

const half = (m: number) => Math.max(0.5, Math.round(m * 2) / 2);
const whole = (m: number) => Math.max(1, Math.round(m));

function copy(w: TrainingWeek): TrainingWeek {
  return w.kind === 'sequence' ? { kind: 'sequence', steps: [...w.steps] } : { ...w };
}

/** Minutos de esforço de uma semana (o que a troca de formato tenta manter). */
export function effortMinutes(w: TrainingWeek): number {
  if (w.kind === 'repeat') return w.repeat * w.effort;
  if (w.kind === 'continuous') return w.minutes;
  return w.steps.filter((_, i) => i % 2 === 0).reduce((n, m) => n + m, 0);
}

/**
 * A semana em outro formato, mantendo perto o tempo de esforço: 8 × (1 + 1,5) vira a sequência 1 + 1,5 + 1 (o começo
 * da semana) e o contínuo de 8 min; 20 contínuos viram 4 × (5 + 1) e a sequência 12 + 2 + 8.
 */
export function convertWeek(w: TrainingWeek, kind: WeekKind): TrainingWeek {
  if (w.kind === kind) return copy(w);
  const effort = effortMinutes(w);
  if (kind === 'continuous') return { kind, minutes: whole(effort) };
  if (kind === 'repeat') {
    if (w.kind === 'sequence') {
      return { kind, repeat: Math.max(1, Math.ceil(w.steps.length / 2)), effort: w.steps[0], rest: w.steps[1] ?? 1 };
    }
    const repeat = Math.max(1, Math.round(effort / 5));
    return { kind, repeat, effort: half(effort / repeat), rest: 1 };
  }
  // sequência
  if (w.kind === 'repeat') return { kind, steps: [w.effort, w.rest || 1, w.effort] };
  const first = half(effort * 0.6);
  return { kind, steps: [first, 2, half(Math.max(0.5, effort - first))] };
}

/** Uma semana a mais no fim, igual à última (o mais comum é repetir e ajustar). */
export function addWeek(plan: TrainingPlan): TrainingPlan {
  const last = plan.weeks[plan.weeks.length - 1];
  return { ...plan, weeks: [...plan.weeks.map(copy), copy(last ?? { kind: 'repeat', repeat: 5, effort: 2, rest: 1 })] };
}

/** Duplica a semana `index` logo depois dela. */
export function duplicateWeek(plan: TrainingPlan, index: number): TrainingPlan {
  const weeks = plan.weeks.map(copy);
  if (!weeks[index]) return plan;
  weeks.splice(index + 1, 0, copy(weeks[index]));
  return { ...plan, weeks };
}

/** Tira a semana `index` (o plano fica com pelo menos uma). */
export function removeWeek(plan: TrainingPlan, index: number): TrainingPlan {
  if (plan.weeks.length <= 1 || !plan.weeks[index]) return plan;
  return { ...plan, weeks: plan.weeks.filter((_, i) => i !== index).map(copy) };
}

/** Troca a semana `index`. */
export function setWeek(plan: TrainingPlan, index: number, week: TrainingWeek): TrainingPlan {
  return { ...plan, weeks: plan.weeks.map((w, i) => (i === index ? copy(week) : copy(w))) };
}

/** "13 semanas · de 8 × (1 + 1,5) a 30 min contínuos" (o resumo do plano no formulário e no editor). */
export function planShape(plan: TrainingPlan): string {
  const weeks = planWeeks(plan);
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  const size = `${weeks.length} ${weeks.length === 1 ? 'semana' : 'semanas'}`;
  if (!first) return size;
  if (weeks.length === 1) return `${size} · ${runWeekLabel(first)}`;
  return `${size} · de ${runWeekLabel(first)} a ${runWeekLabel(last)}`;
}

/** A chave do "Começar de um modelo": um modelo pronto, o plano de uma semana só ou nenhum (plano da pessoa). */
export const BLANK_KEY = 'do-zero';

export function templateKey(plan: TrainingPlan): string | undefined {
  const t = templateOf(plan);
  if (t) return t.key;
  const blank = blankPlan(plan);
  if (JSON.stringify(blank.weeks) === JSON.stringify(plan.weeks)) return BLANK_KEY;
  return undefined;
}

/** Usa um modelo (as semanas e os minutos de antes e depois); os nomes do esforço e do descanso ficam os da pessoa. */
export function applyTemplate(plan: TrainingPlan, key: string): TrainingPlan {
  if (key === BLANK_KEY) return blankPlan(plan);
  const t = TRAINING_TEMPLATES.find((x) => x.key === key);
  if (!t) return plan;
  return { ...clonePlan(t.plan), effort: plan.effort, rest: plan.rest };
}
