// Textos do detalhe do hábito e do Progresso, montados a partir do hábito da pessoa (nada fixo por nome).
import type { DayKey, Habit } from '@/types';
import type { HabitDayState, ResolvedGoal } from '@/data';
import {
  capitalize,
  diffDays,
  formatAmount,
  formatDayMonth,
  formatTime,
  formatVolume,
  weekdayName,
  weekdayOf,
} from '@/data';

/** Nome curto para frases ("caminhada", "refrigerante"). */
export function shortOf(habit: Habit): string {
  return habit.shortName ?? habit.name.charAt(0).toLocaleLowerCase('pt-BR') + habit.name.slice(1);
}

/** Plural de um nome contável de uma palavra ("caminhada" → "caminhadas"); null quando não dá para saber. */
export function pluralNoun(short: string): string | null {
  if (/\s/.test(short.trim())) return null;
  const w = short.trim();
  if (/ção$/.test(w)) return w.replace(/ção$/, 'ções');
  if (/(ada|ida|ura|eira|ina|ola)$/.test(w)) return `${w}s`;
  return null;
}

/** "24 caminhadas" ou "24 dias feitos". */
export function countNoun(n: number, short: string): string {
  const plural = pluralNoun(short);
  if (plural) return n === 1 ? short : plural;
  return n === 1 ? 'dia feito' : 'dias feitos';
}

/** Particípio que concorda com o nome ("Caminhada marcada", "Acordar marcado", "Telas desligadas marcadas"). */
export function agree(name: string, base: string): string {
  const first = name.trim().split(/\s+/)[0]?.toLocaleLowerCase('pt-BR') ?? '';
  const stem = base.replace(/o$/, '');
  if (/as$/.test(first)) return `${stem}as`;
  if (/(os|es)$/.test(first)) return `${stem}os`;
  if (/a$/.test(first)) return `${stem}a`;
  return `${stem}o`;
}

/** O artigo do nome: "a caminhada", "o acordar", "as telas desligadas". */
export function article(name: string): string {
  const first = name.trim().split(/\s+/)[0]?.toLocaleLowerCase('pt-BR') ?? '';
  if (/as$/.test(first)) return 'as';
  if (/(os|es)$/.test(first)) return 'os';
  if (/a$/.test(first)) return 'a';
  return 'o';
}

/** "na quarta", "no sábado", "hoje", "ontem" ou "em 14 de outubro". */
export function onDay(day: DayKey, today: DayKey): string {
  const d = diffDays(today, day);
  if (d === 0) return 'hoje';
  if (d > 0 && d < 7) {
    const wd = weekdayOf(day);
    return `${wd >= 5 ? 'no' : 'na'} ${weekdayName(day)}`;
  }
  return `em ${formatDayMonth(day)}`;
}

/** "ontem", "hoje", "anteontem" ou "quarta, 14 out". */
export function relativeDay(day: DayKey, today: DayKey): string {
  const d = diffDays(today, day);
  if (d === 0) return 'hoje';
  if (d === 1) return 'ontem';
  if (d === 2) return 'anteontem';
  return weekdayName(day);
}

/** Meta do dia em texto curto: "20 min ou mais", "80 g", "3 L", "6h50". */
export function goalText(habit: Habit, goal: ResolvedGoal): string | null {
  if (goal.time) return formatTime(goal.time);
  if (goal.value === undefined) return null;
  const v = goal.unit === 'ml' ? formatVolume(goal.value) : formatAmount(goal.value, goal.unit);
  if (habit.type === 'counter' || habit.type === 'number') return goal.direction === 'atMost' ? `até ${v}` : v;
  return goal.direction === 'atMost' ? `até ${v}` : `${v} ou mais`;
}

/** A linha de baixo do título do hábito: "20 min ou mais · meta 6 de 7 dias". */
export function habitSubtitle(habit: Habit, goal: ResolvedGoal): string {
  const parts: string[] = [];
  const g = goalText(habit, goal);
  switch (habit.type) {
    case 'time':
      if (habit.description) parts.push(habit.description);
      if (g) parts.push(`meta ${g}`);
      parts.push(`até ${goal.toleranceMin} min depois conta`);
      break;
    case 'counter':
      if (habit.description) parts.push(habit.description);
      if (g) parts.push(`meta ${g} por dia`);
      break;
    case 'budget': {
      const n = goal.perWeek ?? 0;
      parts.push(`até ${n}${goal.unit === 'dias' ? ' dias' : ''} por semana`);
      if (habit.description) parts.push(habit.description);
      break;
    }
    case 'weekly':
      parts.push(`${goal.perWeek ?? 1} ${goal.perWeek === 1 ? 'vez' : 'vezes'} por semana`);
      if (habit.description) parts.push(habit.description);
      break;
    case 'number':
      if (habit.description) parts.push(habit.description);
      parts.push(goal.measuring ? 'só medindo' : g ? `meta ${g}` : '');
      break;
    case 'checklist':
      parts.push(habit.description ?? `${habit.checklist.length} passos`);
      break;
    default: {
      const desc = habit.description ?? (g && habit.type === 'check' ? g : null);
      if (desc) parts.push(desc);
      if (goal.perWeek) parts.push(`meta ${goal.perWeek} de 7 dias`);
    }
  }
  return parts.filter(Boolean).join(' · ');
}

/** Como o dia é lido pelo leitor de tela e na legenda: "caminhada feita", "sem caminhada". */
export function dayStateWords(state: HabitDayState, habit: Habit, opts: { partialText?: string } = {}): string {
  const short = shortOf(habit);
  switch (state) {
    case 'done':
      return `${short} ${agree(short, 'feito')}`;
    case 'partial':
      return opts.partialText ? `parcial, ${opts.partialText}` : 'parcial';
    case 'notDone':
      return `sem ${short}`;
    case 'skipped':
      return 'não contou neste dia';
    case 'paused':
      return 'dia pausado';
    case 'offSchedule':
      return 'fora da agenda';
    case 'future':
      return 'por vir';
    default:
      return 'antes do começo';
  }
}

/** "menos de 20 min" (o parcial). */
export function partialText(goal: ResolvedGoal): string | null {
  if (goal.value === undefined || goal.partialMin === undefined) return null;
  return `menos de ${formatAmount(goal.value, goal.unit)}`;
}

/** Frase do insight do hábito quando ainda não dá para comparar (estados.md › Poucos dados). */
export function waitingSentence(missingWith: number, missingWithout: number, short: string, needed = 7): string {
  const rule = `Os padrões aparecem com ${needed} dias com e ${needed} sem.`;
  if (missingWith > 0) return `${rule} Faltam ${missingWith} ${missingWith === 1 ? 'dia' : 'dias'} com ${short}.`;
  if (missingWithout > 0) return `${rule} Os dias sem chegam no tempo deles.`;
  return '';
}

export { capitalize };
