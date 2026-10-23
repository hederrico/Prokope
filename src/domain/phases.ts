// Fases: a linha do tempo (concluídas, a atual e as futuras, com datas previstas), o progresso da atual
// e a sugestão de avançar (constância da fase ≥ limite, 70% por padrão). Quem decide é a pessoa.
import type { DayKey, Habit, Phase } from '@/types';
import type { DomainData } from './context';
import { addDays, diffDays, minDay, weekStart } from './day';
import { isStoppedOn, stopDayOf } from './habitState';
import { constancy } from './stats';

export type PhaseStatus = 'done' | 'current' | 'future';

/** Um hábito na lista de uma fase em Editar jornada, com a fase de origem e a parada. */
export interface PhaseHabit {
  habit: Habit;
  /** fase em que entrou (null = sem fase) */
  from: number | null;
  /** fase em que sai do dia a dia (null = segue nas seguintes) */
  until: number | null;
  /** primeiro dia fora, quando já se sabe (a fase de parada começou, ou a parada foi escolhida nela) */
  stopDay: DayKey | null;
  /** a parada já vale hoje: o hábito saiu do dia a dia e é como um arquivado daquela data em diante */
  stopped: boolean;
}

function phaseHabit(h: Habit, data: DomainData, today: DayKey): PhaseHabit {
  return {
    habit: h,
    from: h.phase ?? null,
    until: h.untilPhase ?? null,
    stopDay: stopDayOf(h, data),
    stopped: isStoppedOn(h, today, data),
  };
}

/**
 * As fases são cumulativas: um hábito entra na fase `phase` e segue nas próximas, até a fase `untilPhase` (sem ela).
 * Os que continuam numa fase são os das fases anteriores que ainda valem nela; os que param nela também vêm,
 * para o "Voltar a seguir" ficar no mesmo lugar. Arquivados ficam fora.
 */
function phaseLists(data: DomainData, number: number, today: DayKey): { entering: PhaseHabit[]; carried: PhaseHabit[] } {
  const entering: PhaseHabit[] = [];
  const carried: PhaseHabit[] = [];
  for (const h of data.habits) {
    if (h.archived || h.phase == null) continue;
    if (h.phase === number) entering.push(phaseHabit(h, data, today));
    else if (h.phase < number && (h.untilPhase == null || h.untilPhase >= number)) carried.push(phaseHabit(h, data, today));
  }
  // da fase mais antiga para a mais nova; dentro de cada uma, a ordem dos hábitos
  carried.sort((a, b) => (a.from ?? 0) - (b.from ?? 0));
  return { entering, carried };
}

/** Os hábitos sem fase que seguem no plano (seguem em todas as fases). */
export function loosePhaseHabits(data: DomainData, today: DayKey): PhaseHabit[] {
  return data.habits
    .filter((h) => !h.archived && h.phase == null && !isStoppedOn(h, today, data))
    .map((h) => phaseHabit(h, data, today));
}

export interface PhaseWeek {
  index: number;
  start: DayKey;
  end: DayKey;
  /** constância da semana da fase (null no futuro) */
  ratio: number | null;
  current: boolean;
  future: boolean;
}

export interface PhaseView {
  phase: Phase;
  number: number;
  name: string;
  status: PhaseStatus;
  /** começo real (gravado) ou previsto */
  start: DayKey | null;
  /** fim planejado, real ou previsto (null = sem fim) */
  end: DayKey | null;
  /** datas calculadas, não gravadas (fases futuras) */
  predicted: boolean;
  weeks: number | null;
  /** semana atual da fase (1 a weeks), só na fase atual */
  weekIndex: number | null;
  /** dia da fase (1 = primeiro dia) */
  dayIndex: number | null;
  daysLeft: number | null;
  /** hábitos que entram nesta fase (ativos ou à espera), sem as medições e com "deitar e acordar" como um só */
  habits: Habit[];
  /** Editar jornada: todos os que entram nesta fase, com as medições ("Novos nesta fase") */
  entering: PhaseHabit[];
  /** Editar jornada: os das fases anteriores que seguem nesta, e os que param nela ("Continuam") */
  carried: PhaseHabit[];
  /** constância de fechamento (concluída) ou até agora (atual) */
  constancy: number | null;
  weekBars: PhaseWeek[];
  /** a semana atual é a última da fase */
  lastWeek: boolean;
}

/**
 * "Deitar e acordar" é um hábito só no plano (docs/visao.md, o chip do primeiro acesso, "Os 7 hábitos da fase 1"):
 * na lista de uma fase, o deitar fica junto do acordar quando os dois entram nela. No Hoje, continuam duas linhas.
 */
export function sleepPairAsOne(habits: Habit[]): Habit[] {
  if (!habits.some((h) => h.role === 'wake')) return habits;
  return habits.filter((h) => h.role !== 'bed');
}

/** As fases em ordem, com a atual e as datas previstas das futuras. */
export function phaseTimeline(data: DomainData, today: DayKey): PhaseView[] {
  const phases = data.phases;
  let currentIdx = -1;
  for (let i = 0; i < phases.length; i++) if (phases[i].start && phases[i].start! <= today) currentIdx = i;
  const views: PhaseView[] = [];
  let cursor: DayKey | null = null;
  phases.forEach((p, i) => {
    const status: PhaseStatus = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'future';
    let start = p.start;
    let end = p.end;
    let predicted = false;
    if (status === 'future') {
      start = cursor;
      end = start && p.weeks ? addDays(start, p.weeks * 7 - 1) : null;
      predicted = true;
    } else if (!end && p.weeks && start) {
      end = addDays(start, p.weeks * 7 - 1);
    }
    cursor = end ? addDays(end, 1) : null;
    // as medições ("só medindo": peso, cintura, tempo de tela) não são hábitos da fase (docs/visao.md › Fases)
    const habits = sleepPairAsOne(
      data.habits.filter((h) => h.phase === p.number && !h.archived && !h.goal.measuring),
    );
    let weekIndex: number | null = null;
    let dayIndex: number | null = null;
    let daysLeft: number | null = null;
    let lastWeek = false;
    const weekBars: PhaseWeek[] = [];
    if (start && status !== 'future') {
      dayIndex = diffDays(today, start) + 1;
      if (status === 'current') {
        weekIndex = Math.floor((dayIndex - 1) / 7) + 1;
        daysLeft = end ? Math.max(0, diffDays(end, today)) : null;
        lastWeek = !!end && diffDays(end, today) < 7;
      }
      const totalWeeks = end ? Math.ceil((diffDays(end, start) + 1) / 7) : Math.max(1, Math.ceil(dayIndex / 7));
      for (let w = 0; w < totalWeeks; w++) {
        const ws = addDays(start, w * 7);
        const we = end ? minDay(addDays(ws, 6), end) : addDays(ws, 6);
        const future = ws > today;
        // semana fechada com revisão: a constância guardada no fechamento
        const reviewed = we < today ? data.reviews.get(weekStart(ws)) : undefined;
        weekBars.push({
          index: w + 1,
          start: ws,
          end: we,
          ratio: future
            ? null
            : reviewed?.status === 'done' && reviewed.constancy != null && weekStart(ws) === ws
              ? reviewed.constancy
              : constancy(data, ws, we, today).ratio,
          current: ws <= today && we >= today,
          future,
        });
      }
    }
    let c: number | null = null;
    if (status === 'done') c = p.closingConstancy ?? (start && end ? constancy(data, start, end, today).ratio : null);
    else if (status === 'current' && start) c = constancy(data, start, today, today).ratio;
    const lists = phaseLists(data, p.number, today);
    views.push({
      phase: p,
      number: p.number,
      name: p.name,
      status,
      start,
      end,
      predicted,
      weeks: p.weeks,
      weekIndex,
      dayIndex,
      daysLeft,
      habits,
      entering: lists.entering,
      carried: lists.carried,
      constancy: c,
      weekBars,
      lastWeek,
    });
  });
  return views;
}

export function currentPhase(data: DomainData, today: DayKey): PhaseView | null {
  return phaseTimeline(data, today).find((p) => p.status === 'current') ?? null;
}

export function nextPhase(data: DomainData, today: DayKey): PhaseView | null {
  return phaseTimeline(data, today).find((p) => p.status === 'future') ?? null;
}

export interface PhaseSuggestion {
  /** a constância da fase passou do limite */
  suggestAdvance: boolean;
  constancy: number | null;
  threshold: number | null;
  next: PhaseView | null;
}

/** Sugestão da Revisão da semana no fim da fase (70% por padrão; null = não sugerir). */
export function phaseSuggestion(data: DomainData, today: DayKey): PhaseSuggestion {
  const cur = currentPhase(data, today);
  const threshold = data.profile.phaseThreshold ?? null;
  const c = cur?.constancy ?? null;
  return {
    suggestAdvance: threshold !== null && c !== null && c >= threshold,
    constancy: c,
    threshold,
    next: nextPhase(data, today),
  };
}

/** "Primeiro dia da fase 1": o dia é o começo da primeira fase e ainda não há nenhuma marca. */
export function isFirstDay(data: DomainData, day: DayKey): boolean {
  const first = data.phases.find((p) => p.start);
  if (first?.start === day) return data.marks.size === 0;
  if (!data.phases.length) {
    const starts = data.habits.map((h) => h.startDay).filter((d): d is DayKey => !!d);
    if (starts.length && starts.every((d) => d >= day) && starts.includes(day)) return data.marks.size === 0;
  }
  return false;
}
