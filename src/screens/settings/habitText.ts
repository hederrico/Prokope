// Textos de Ajustes montados a partir dos dados da pessoa: o tipo, a meta e a fase de cada hábito
// ("Horário · meta 6h50 · fase 1"), os dias ("seg e qui"), o destino dos hábitos de um pilar que sai e as datas da pausa.
// Funções puras (testadas em __tests__/habitText.test.ts): nada aqui conhece nome de hábito ou de pilar.
import {
  formatAmount,
  formatDayMonth,
  formatDayShort,
  formatTime,
  weekdayLabel,
  weekdayOf,
  weekdayShortLabel,
  capitalize,
} from '@/data';
import type { PillarHabitFate } from '@/data';
import type { DayKey, Habit, HabitType, Pillar, Profile, ScheduleKey } from '@/types';
import { PALETTE, type PaletteKey } from '@/styles/palette';

export const TYPE_LABELS: Record<HabitType, string> = {
  check: 'Sim ou não',
  weekly: 'Vezes por semana',
  time: 'Horário',
  checklist: 'Lista de passos',
  counter: 'Contador',
  number: 'Número',
  rating: 'Nota de 1 a 5',
  daysSince: 'Dias sem',
  budget: 'Limite por semana',
};

/** O tipo como a pessoa vê (o check-in é um registro de nota e texto). */
export function typeLabel(h: Pick<Habit, 'type' | 'role'>): string {
  if (h.role === 'checkin') return 'Nota de 1 a 5 e texto';
  return TYPE_LABELS[h.type];
}

/** "seg e qui", "quinta", "todos os dias", "seg, qua e sex". */
export function daysLabel(days: readonly number[], opts: { long?: boolean } = {}): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return 'todos os dias';
  if (sorted.length === 0) return 'nenhum dia';
  if (sorted.length === 1) return weekdayLabel(sorted[0]);
  const names = sorted.map((d) => (opts.long ? weekdayLabel(d) : weekdayShortLabel(d)));
  return joinList(names);
}

/** "a, b e c". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

function scheduleTime(key: ScheduleKey | undefined, profile: Profile | null): string | undefined {
  return key ? profile?.schedule?.[key] : undefined;
}

/** Valor da meta com unidade: "80 g", "3 L", "20 min". */
export function goalAmount(value: number, unit?: string): string {
  if (unit === 'L') return `${formatAmount(value)} L`;
  return formatAmount(value, unit);
}

/** A meta de um hábito em poucas palavras ("meta 6h50", "até 20h30", "meta 80 g, subindo"), ou null. */
export function goalText(h: Habit, profile: Profile | null): string | null {
  const g = h.goal ?? {};
  const s = h.schedule ?? { days: [], moment: 'day' };
  switch (h.type) {
    case 'time': {
      const t = scheduleTime(g.timeKey, profile) ?? g.time;
      return t ? `meta ${formatTime(t)}` : null;
    }
    case 'counter': {
      if (g.value === undefined) return null;
      return `meta ${goalAmount(g.value, g.unit)}${g.ramp ? ', subindo' : ''}`;
    }
    case 'budget':
      return g.perWeek ? `até ${g.perWeek}${g.unit === 'dias' ? ' dias' : ''}` : null;
    case 'weekly':
      if (s.days.length && s.days.length < 7) return daysLabel(s.days, { long: s.days.length === 1 });
      return g.perWeek ? `${g.perWeek} por semana` : null;
    case 'number':
      if (s.days.length === 7 || !s.days.length) return 'diário';
      return `semanal, ${daysLabel(s.days, { long: true })}`;
    case 'checklist':
      return h.checklist?.length ? `${h.checklist.length} ${h.checklist.length === 1 ? 'passo' : 'passos'}` : null;
    case 'rating':
    case 'daysSince':
      return null;
    default: {
      // sim ou não (e o check-in): meta da semana, dias de coleta, dias da agenda ou o horário
      if (g.perWeek && g.perWeek < 7) return `meta ${g.perWeek} de 7`;
      if (s.useCollectionDays && profile) return daysLabel(profile.collectionDays);
      if (s.days.length && s.days.length < 7) return daysLabel(s.days);
      const key = s.timeKey ?? g.timeKey;
      const t = scheduleTime(key, profile) ?? s.time;
      if (!t) return null;
      // as tarefas da casa têm prazo ("até 20h30"); os outros horários são a hora do hábito
      return key === 'chores' ? `até ${formatTime(t)}` : formatTime(t);
    }
  }
}

/** A linha de baixo de um hábito em Ajustes: "Horário · meta 6h50 · fase 1". */
export function habitLine(h: Habit, profile: Profile | null, showPhase = true): string {
  return [typeLabel(h), goalText(h, profile), showPhase && h.phase ? `fase ${h.phase}` : null]
    .filter(Boolean)
    .join(' · ');
}

/** Nome do hábito no meio de uma frase: "Futebol", "lixo e recicláveis" (depois do primeiro). */
function inSentence(h: Habit, first: boolean): string {
  return first ? h.name : h.name.charAt(0).toLocaleLowerCase('pt-BR') + h.name.slice(1);
}

/**
 * O que acontece com os hábitos quando o pilar sai, numa frase:
 * "Futebol sai do seu dia. Caminhada com o cachorro continua em Família."
 */
export function exitSentence(plan: PillarHabitFate[], pillars: Pillar[]): string {
  const name = (id: string | undefined) => pillars.find((p) => p.id === id)?.name ?? '';
  const parts: string[] = [];
  const goes = plan.filter((f) => f.kind === 'goes').map((f) => f.habit);
  if (goes.length) {
    const names = joinList(goes.map((h, i) => inSentence(h, i === 0)));
    parts.push(`${names} ${goes.length === 1 ? 'sai' : 'saem'} do seu dia.`);
  }
  for (const f of plan) {
    if (f.kind === 'moves') parts.push(`${f.habit.name} passa para ${name(f.to)}.`);
    else if (f.kind === 'stays') parts.push(`${f.habit.name} continua em ${name(f.habit.pillarId)}.`);
  }
  return parts.join(' ') || 'Nenhum hábito sai do seu dia.';
}

/** O detalhe do toast de arquivar: "Futebol saiu do seu dia". */
export function archivedDetail(plan: PillarHabitFate[]): string | undefined {
  const goes = plan.filter((f) => f.kind === 'goes').map((f) => f.habit);
  if (!goes.length) return undefined;
  const names = joinList(goes.map((h, i) => inSentence(h, i === 0)));
  return `${names} ${goes.length === 1 ? 'saiu' : 'saíram'} do seu dia`;
}

/** "sábado, 2 de janeiro" → "Sábado, 2 de janeiro". */
export function capitalized(text: string): string {
  return capitalize(text);
}

/** "dom, 3 jan". */
export function shortWeekdayDate(day: DayKey): string {
  const [y, m, d] = day.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0 = domingo
  return `${weekdayShortLabel((wd + 6) % 7)}, ${formatDayShort(day)}`;
}

/** Compara sem caixa, acento ou espaço: "Apagar", " apagar ", "APAGAR" valem. */
export function matchesWord(text: string, word = 'apagar'): boolean {
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').toLowerCase();
  return n(text) === n(word);
}

const MOMENT_ORDER: Record<string, number> = { morning: 0, day: 1, evening: 2, free: 3 };

/** Ordem das listas de Ajustes: no grupo de um pilar, os hábitos dele primeiro e os que vêm de outro pilar depois;
 *  dentro disso, pelo momento do dia (como no Hoje) e pela ordem do hábito. */
export function byListOrder<T extends { habit: Habit }>(items: T[], groupPillarId?: string): T[] {
  return [...items].sort((a, b) => {
    if (groupPillarId) {
      const pa = a.habit.pillarId === groupPillarId ? 0 : 1;
      const pb = b.habit.pillarId === groupPillarId ? 0 : 1;
      if (pa !== pb) return pa - pb;
    }
    const ma = MOMENT_ORDER[a.habit.schedule?.moment ?? 'day'] ?? 1;
    const mb = MOMENT_ORDER[b.habit.schedule?.moment ?? 'day'] ?? 1;
    return ma - mb || a.habit.order - b.habit.order || a.habit.name.localeCompare(b.habit.name, 'pt-BR');
  });
}

/** O rótulo do grupo Cor: "Mel" ou "Damasco · também em Corpo". */
export function colorLabel(c: PaletteKey, pillars: Pillar[], exceptId?: string): string {
  const used = pillars.find((p) => !p.archived && p.color === c && p.id !== exceptId);
  return used ? `${PALETTE[c].name} · também em ${used.name}` : PALETTE[c].name;
}

const WEEKDAY_NAMES = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

/** "domingo, 3 jan". */
export function longWeekdayShort(day: DayKey): string {
  return `${WEEKDAY_NAMES[weekdayOf(day)]}, ${formatDayShort(day)}`;
}

/** "no domingo, 3 jan", "na quinta, 29 out". */
export function onWeekdayShort(day: DayKey): string {
  return `${weekdayOf(day) >= 5 ? 'no' : 'na'} ${longWeekdayShort(day)}`;
}

/** "sábado, 2 de janeiro". */
export function longWeekdayMonth(day: DayKey): string {
  return `${WEEKDAY_NAMES[weekdayOf(day)]}, ${formatDayMonth(day)}`;
}
