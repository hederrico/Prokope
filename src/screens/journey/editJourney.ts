// Editar jornada: as linhas de cada fase (com "acordar e deitar" juntos), os textos de cada estado e quem pode
// entrar numa fase pela folha "Adicionar hábito". Só apresentação: quem continua e onde para vem do domínio.
import type { DayKey, Habit } from '@/types';
import type { HabitListItem, PhaseHabit, PhaseView } from '@/data';
import { formatDayShort } from '@/data';

/** Uma linha da lista de uma fase: um hábito, ou o acordar e o deitar juntos (um hábito só no plano). */
export interface JourneyRow {
  /** o id do primeiro hábito (chave da linha e do layoutId) */
  key: string;
  habits: Habit[];
  /** "Peso", "Acordar e deitar" */
  name: string;
  /** dois hábitos numa linha só (acordar e deitar) */
  pair: boolean;
  /** concordância das frases: "Telas desligadas seguem", "Acordar e deitar voltam" */
  plural: boolean;
  icon: Habit['icon'];
  pillarId: string;
  from: number | null;
  until: number | null;
  stopDay: DayKey | null;
  stopped: boolean;
}

function lower(name: string): string {
  return name.charAt(0).toLocaleLowerCase('pt-BR') + name.slice(1);
}

function firstWord(name: string): string {
  return name.trim().split(/\s+/)[0]?.toLocaleLowerCase('pt-BR') ?? '';
}

/** O nome pede o verbo no plural ("Telas desligadas", "Refeições livres", "Momentos de silêncio")? */
function pluralName(name: string): boolean {
  const w = firstWord(name);
  return w.length > 3 && /(as|os|es)$/.test(w);
}

/**
 * As linhas de uma lista, na ordem dela. O deitar vai junto do acordar quando os dois estão na mesma lista com a
 * mesma origem e a mesma parada (é assim que o plano conta: "Os 7 hábitos da fase 1"); o que se faz na linha vale
 * para os dois.
 */
export function journeyRows(list: PhaseHabit[]): JourneyRow[] {
  const wake = list.find((x) => x.habit.role === 'wake');
  const bed = list.find((x) => x.habit.role === 'bed');
  const paired = !!wake && !!bed && wake.from === bed.from && wake.until === bed.until && wake.stopped === bed.stopped;
  const rows: JourneyRow[] = [];
  for (const x of list) {
    if (paired && x === bed) continue;
    const habits = paired && x === wake ? [wake.habit, bed!.habit] : [x.habit];
    const pair = habits.length > 1;
    rows.push({
      key: x.habit.id,
      habits,
      name: pair ? `${habits[0].name} e ${lower(habits[1].name)}` : x.habit.name,
      pair,
      plural: pair || pluralName(x.habit.name),
      icon: x.habit.icon,
      pillarId: x.habit.pillarId,
      from: x.from,
      until: x.until,
      stopDay: x.stopDay,
      stopped: x.stopped,
    });
  }
  return rows;
}

/** As linhas da folha "Adicionar hábito", a partir da lista de Ajustes (com o acordar e o deitar juntos). */
export function candidateRows(items: HabitListItem[]): JourneyRow[] {
  return journeyRows(
    items.map((i) => ({
      habit: i.habit,
      from: i.habit.phase ?? null,
      until: i.habit.untilPhase ?? null,
      stopDay: null,
      stopped: false,
    })),
  );
}

/**
 * Quem pode entrar na fase pela folha "Adicionar hábito": os hábitos de outras fases ou sem fase que ainda não
 * seguem nela. Os que já estão no dia a dia não vão para uma fase que ainda não começou (sairiam do Hoje até lá);
 * os das fases anteriores já seguem nesta. Arquivados e parados ficam fora.
 */
export function addCandidates(items: HabitListItem[], phase: PhaseView): HabitListItem[] {
  const started = phase.status === 'current';
  return items
    .filter((i) => {
      const h = i.habit;
      if (i.status === 'archived' || h.phase === phase.number) return false;
      if ((h.untilPhase ?? null) !== null) return false;
      const inDay = i.status === 'active' || i.status === 'paused';
      if (!started) return !inDay;
      return h.phase == null || !inDay || h.phase > phase.number;
    })
    .sort((a, b) => (a.habit.phase ?? 0) - (b.habit.phase ?? 0));
}

/** O estado da parada, para a linha: "para na fase 3", "para nesta fase", "fora do dia a dia desde 23 out". */
export function stopText(
  row: Pick<JourneyRow, 'until' | 'stopped' | 'stopDay'>,
  at: number | null,
  today: DayKey,
): string | null {
  if (row.until == null) return null;
  if (row.until !== at) return `para na fase ${row.until}`;
  if (row.stopped && row.stopDay) {
    return row.stopDay >= today ? 'sai do dia a dia hoje' : `fora do dia a dia desde ${formatDayShort(row.stopDay)}`;
  }
  return 'para nesta fase';
}

/** A linha de baixo de cada linha: a fase de origem (nos que continuam) e a parada. */
export function rowSubtitle(
  row: JourneyRow,
  part: 'carried' | 'entering' | 'loose',
  at: number | null,
  today: DayKey,
): string | undefined {
  const stop = stopText(row, at, today);
  const parts = [part === 'carried' && row.from != null ? `da fase ${row.from}` : null, stop].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

/** Particípio que concorda com o nome ("Proteína movida", "Peso movido", "Acordar e deitar movidos"). */
export function participle(row: Pick<JourneyRow, 'name' | 'pair'>, stem: string): string {
  if (row.pair) return `${stem}os`;
  const first = firstWord(row.name);
  if (first.endsWith('as')) return `${stem}as`;
  if (first.endsWith('os') || (first.length > 3 && first.endsWith('es'))) return `${stem}os`;
  if (first.endsWith('a')) return `${stem}a`;
  return `${stem}o`;
}

/** O verbo que concorda com a linha: verb(row, 'segue', 'seguem'). */
export function verb(row: Pick<JourneyRow, 'plural'>, singular: string, plural: string): string {
  return row.plural ? plural : singular;
}

/** "1 hábito", "10 hábitos". */
export function habitsCount(n: number): string {
  return n === 1 ? '1 hábito' : `${n} hábitos`;
}

/** "da fase 1", "das fases 1 e 2", "das fases 1, 2 e 3" (de onde vêm os que continuam). */
export function fromPhases(numbers: number[]): string {
  const list = [...new Set(numbers)].sort((a, b) => a - b).map(String);
  if (list.length <= 1) return `da fase ${list[0] ?? ''}`.trim();
  return `das fases ${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}`;
}

/** A linha de baixo de um hábito na folha "Adicionar hábito": de onde ele vem e o que muda. */
export function candidateSubtitle(row: Pick<JourneyRow, 'from'>, phase: Pick<PhaseView, 'number' | 'status'>): string {
  if (row.from == null)
    return phase.status === 'current' ? 'sem fase · fica nesta fase' : 'sem fase · entra quando esta fase começar';
  if (row.from > phase.number)
    return phase.status === 'current' ? `da fase ${row.from} · entra hoje` : `da fase ${row.from} · entra mais cedo`;
  return `da fase ${row.from} · passa para esta fase`;
}
