// Textos e contas pequenas da Jornada, da corrida e da revisão (só apresentação; as regras ficam no domínio).
import type { DayKey, Habit, Pillar } from '@/types';
import type { RunBlock, RunWeek } from '@/data';
import { addDays, capitalize, formatNumber, formatTime, weekdayOf, weekdayShortLabel } from '@/data';
import type { PillarColor } from '@/components/ui';

/** "Fase 2 · Alimentação". */
export function phaseTitle(p: { number: number; name: string }): string {
  return `Fase ${p.number} · ${p.name}`;
}

/** "a, b e c". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** Nome curto do hábito para frases ("academia", "corrida"). */
export function shortName(h: Habit): string {
  return h.shortName || h.name.toLocaleLowerCase('pt-BR');
}

/** "Academia, corrida e YouTube" (no máximo 3 nomes; o resto vira "e mais 2"). */
export function habitsPhrase(habits: Habit[]): string {
  const names = habits.map(shortName);
  if (!names.length) return '';
  const shown = names.length > 3 ? [...names.slice(0, 2), `mais ${names.length - 2}`] : names;
  return capitalize(joinNames(shown));
}

/** "Seg e qua · 7h10". */
export function scheduleLabel(days: number[], time: string | null | undefined): string {
  const d = joinNames([...days].sort((a, b) => a - b).map((x) => weekdayShortLabel(x)));
  const text = capitalize(d);
  if (!text) return time ? formatTime(time) : 'Escolher';
  return time ? `${text} · ${formatTime(time)}` : text;
}

/** O próximo dia da agenda a partir de `from` (inclusive). */
export function nextScheduledDay(days: number[], from: DayKey): DayKey | null {
  if (!days.length) return null;
  for (let i = 0; i < 14; i++) {
    const d = addDays(from, i);
    if (days.includes(weekdayOf(d))) return d;
  }
  return null;
}

/** Minutos de uma duração em segundos: "1", "1,5", "20". */
export function minutesOf(seconds: number): string {
  return formatNumber(seconds / 60, 1);
}

/** Os blocos do meio (sem aquecimento e volta à calma). */
export function middleBlocks(w: RunWeek): RunBlock[] {
  return w.blocks.filter((b) => b.kind === 'run' || b.kind === 'walk');
}

/** "8 × (1 + 1,5)", "15 + 2 + 8", "20 min contínuos". */
export function runWeekLabel(w: RunWeek): string {
  const mid = middleBlocks(w);
  const runs = mid.filter((b) => b.kind === 'run');
  const walks = mid.filter((b) => b.kind === 'walk');
  if (runs.length === 1 && !walks.length) return `${minutesOf(runs[0].seconds)} min contínuos`;
  const sameRun = runs.every((b) => b.seconds === runs[0].seconds);
  const sameWalk = walks.every((b) => b.seconds === walks[0]?.seconds);
  if (runs.length > 1 && runs.length === walks.length && sameRun && sameWalk) {
    return `${runs.length} × (${minutesOf(runs[0].seconds)} + ${minutesOf(walks[0].seconds)})`;
  }
  return mid.map((b) => minutesOf(b.seconds)).join(' + ');
}

/** Legenda do treino: [rótulo, valor] por tipo de bloco. */
export function runLegend(w: RunWeek): { kind: RunBlock['kind']; label: string; value: string }[] {
  const out: { kind: RunBlock['kind']; label: string; value: string }[] = [];
  const of = (kind: RunBlock['kind']) => w.blocks.filter((b) => b.kind === kind);
  const describe = (list: RunBlock[]) => {
    if (!list.length) return '';
    if (list.length > 1 && list.every((b) => b.seconds === list[0].seconds))
      return `${list.length} × ${minutesOf(list[0].seconds)} min`;
    return `${list.map((b) => minutesOf(b.seconds)).join(' + ')} min`;
  };
  const warm = of('warmup');
  if (warm.length) out.push({ kind: 'warmup', label: 'Aquecimento caminhando', value: describe(warm) });
  out.push({ kind: 'run', label: 'Trote', value: describe(of('run')) });
  const walk = of('walk');
  if (walk.length) out.push({ kind: 'walk', label: 'Caminhada', value: describe(walk) });
  const cool = of('cooldown');
  if (cool.length) out.push({ kind: 'cooldown', label: 'Volta à calma', value: describe(cool) });
  return out;
}

/** O hábito entra no "x de N" do dia ou na constância (fora: medições, limites e contadores sem meta).
 *  Espelha a regra do domínio (countsInConstancy), que não sai por '@/data'. */
export function countsInTheDay(h: Habit): boolean {
  if (h.archived) return false;
  switch (h.type) {
    case 'check':
    case 'time':
    case 'rating':
    case 'checklist':
    case 'daysSince':
    case 'weekly':
      return true;
    case 'counter':
      return h.goal.value !== undefined;
    case 'number':
      return h.goal.value !== undefined && !h.goal.measuring;
    default:
      return false;
  }
}

/** Resumo de uma fase: a descrição gravada, quando houver; senão, os nomes dos hábitos. */
export function phaseSummary(phase: { description?: string | null }, habits: Habit[]): string {
  const d = phase.description?.trim();
  return d ? capitalize(d) : habitsPhrase(habits);
}

/** Cor do pilar para os componentes (a chave da paleta do pilar). */
export function pillarColor(p: Pillar | null | undefined): PillarColor | undefined {
  return p?.color;
}

/** "2× por semana · do condomínio", "até 60 min por dia" (o que entra com uma fase). */
export function habitGoalPhrase(h: Habit): string {
  const g = h.goal;
  const desc = h.description?.trim();
  let main: string;
  if (h.type === 'weekly' || h.type === 'budget') main = g.perWeek ? `${g.perWeek}× por semana` : '';
  else if (g.value != null && g.unit && !g.measuring) {
    const amount = g.unit === 'ml' ? `${formatNumber(g.value / 1000, 1)} L` : `${formatNumber(g.value)} ${g.unit}`;
    main = g.direction === 'atMost' ? `até ${amount} por dia` : `${amount} por dia`;
  } else if (h.type === 'checklist') main = `${h.checklist.length} passos`;
  else main = 'todo dia';
  return [main, desc].filter(Boolean).join(' · ');
}

/** "segunda, 2 de novembro" já vem do domínio; aqui, a frase "amanhã, 2 nov" / "hoje" para os botões. */
export function relativeStart(day: DayKey, today: DayKey): 'hoje' | 'amanhã' | null {
  if (day === today) return 'hoje';
  if (day === addDays(today, 1)) return 'amanhã';
  return null;
}
