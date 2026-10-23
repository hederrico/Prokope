// Revisão da semana: a janela (do dia e da hora escolhidos até 2 dias depois) e o resumo da semana
// ("O que deu certo" e um "Para olhar com carinho", no máximo).
import type { DayKey, Habit, Millis, Profile, Review, WeekKey } from '@/types';
import type { DomainData } from './context';
import { addDays, dayStartInstant, instantAt, logicalDay, weekDays, weekStart, type Clock } from './day';
import { formatTime } from './format';
import { countsInConstancy, habitDay, isCountable, isDoneLike, isFlexibleWeekly } from './habitState';
import { currentPhase } from './phases';
import { weekConstancy } from './stats';

export interface ReviewWindow {
  /** semana revista (segunda) */
  week: WeekKey;
  /** dia da revisão */
  day: DayKey;
  opensAt: Millis;
  /** fecha na virada do dia lógico, 2 dias depois do dia escolhido */
  closesAt: Millis;
  open: boolean;
}

/** A janela da revisão em curso agora (ou a próxima, com open = false). */
export function reviewWindow(profile: Profile, now: Millis, clock: Clock): ReviewWindow {
  const today = logicalDay(now, clock);
  const { weekday, time } = profile.weeklyReview ?? { weekday: 6, time: '18:00' };
  const candidates = [-7, 0, 7].map((offset) => {
    const day = addDays(weekStart(addDays(today, offset)), weekday);
    return {
      week: weekStart(day),
      day,
      opensAt: instantAt(day, time, clock),
      closesAt: dayStartInstant(addDays(day, 3), clock),
    };
  });
  const open = candidates.find((c) => now >= c.opensAt && now < c.closesAt);
  if (open) return { ...open, open: true };
  const next = candidates.find((c) => c.opensAt > now) ?? candidates[2];
  return { ...next, open: false };
}

/** A revisão que passou da janela sem ser feita (fica em Revisões da semana até a próxima abrir). */
export function pendingReview(data: DomainData, now: Millis): ReviewWindow | null {
  const w = reviewWindow(data.profile, now, data.clock);
  if (w.open) return null;
  const prevDay = addDays(w.day, -7);
  const prevWeek = weekStart(prevDay);
  const r = data.reviews.get(prevWeek);
  if (r?.status === 'done') return null;
  // só se a semana revista já era do plano
  const started = data.phases.find((p) => p.start)?.start ?? data.habits.find((h) => h.startDay)?.startDay;
  if (!started || started > addDays(prevWeek, 6)) return null;
  return {
    week: prevWeek,
    day: prevDay,
    opensAt: instantAt(prevDay, data.profile.weeklyReview?.time ?? '18:00', data.clock),
    closesAt: dayStartInstant(addDays(prevDay, 3), data.clock),
    open: false,
  };
}

export interface ReviewLine {
  habitId: string;
  text: string;
  done: number;
  of: number;
  ratio: number;
}

export interface ReviewSummary {
  week: WeekKey;
  days: DayKey[];
  constancy: number | null;
  /** fase em curso e se esta é a última semana dela (revisão em 3 passos) */
  phase: number | null;
  endOfPhase: boolean;
  /** até 4 linhas, do mais firme para o menos */
  highlights: ReviewLine[];
  /** no máximo uma, em tom gentil */
  gentle: ReviewLine | null;
  /** o ajuste da revisão anterior (o passo 1 pergunta se funcionou) */
  previousTweak: { week: WeekKey; text: string } | null;
}

function nightish(h: Habit): boolean {
  return h.schedule.moment === 'evening';
}

function lineFor(h: Habit, data: DomainData, days: DayKey[], today: DayKey): ReviewLine | null {
  if (h.type === 'budget' || !countsInConstancy(h, data.profile)) return null;
  // hoje entra só se já foi feito (o dia ainda está andando)
  const states = days
    .map((d) => habitDay(h, d, data, today))
    .filter((s) => isCountable(s.state) && (s.day < today || isDoneLike(s.state)));
  if (!states.length) return null;
  const done = states.filter((s) => isDoneLike(s.state)).length;
  const of = isFlexibleWeekly(h, data.profile) ? (h.goal.perWeek ?? states.length) : states.length;
  const ratio = of ? Math.min(1, done / of) : 0;
  const unit = nightish(h) ? (of === 1 ? 'noite' : 'noites') : of === 1 ? 'dia' : 'dias';
  // o assunto ("Deitar às 22h") e a quantidade (" aconteceu em 3 de 7 noites"); sem nada feito, a frase não começa
  // pelo zero ("Futebol: 0 de 1 na semana" soa duro): diz que ficou para a próxima semana
  let subject = h.name;
  let amount: string;
  switch (h.type) {
    case 'daysSince':
      amount = done === of ? ' a semana toda' : ` em ${done} de ${of} dias`;
      break;
    case 'time': {
      const goal = states[states.length - 1]?.goal.time;
      if (goal) {
        subject = `${h.name} às ${formatTime(goal)}`;
        amount = ` aconteceu em ${done} de ${of} ${unit}`;
      } else {
        subject = `${h.name} no horário`;
        amount = ` em ${done} de ${of} ${unit}`;
      }
      break;
    }
    case 'counter': {
      const g = states[states.length - 1]?.goal;
      const unitText =
        g?.unit === 'ml' ? `${(g.value ?? 0) / 1000} L`.replace('.', ',') : `${g?.value ?? ''} ${g?.unit ?? ''}`.trim();
      subject = `${h.name} ${g?.unit === 'ml' ? 'chegou a' : 'acima de'} ${unitText}`;
      amount = ` em ${done} ${done === 1 ? 'dia' : 'dias'}`;
      break;
    }
    case 'rating':
      subject = `${h.name} com nota`;
      amount = ` em ${done} de ${of} dias`;
      break;
    case 'weekly':
      amount = `: ${done} de ${of} na semana`;
      break;
    default:
      amount = ` em ${done} de ${of} ${unit}`;
  }
  const text = done === 0 ? `${subject} ficou para a próxima semana` : `${subject}${amount}`;
  return { habitId: h.id, text, done, of, ratio };
}

/** O resumo da semana para o passo 1 da revisão. */
export function reviewSummary(data: DomainData, week: WeekKey, today: DayKey): ReviewSummary {
  const days = weekDays(week).filter((d) => d <= today);
  const lines = data.habits
    .filter((h) => !h.archived)
    .map((h) => lineFor(h, data, days, today))
    .filter((l): l is ReviewLine => !!l);
  const highlights = lines
    .filter((l) => l.ratio >= 0.7)
    .sort((a, b) => b.ratio - a.ratio || b.of - a.of)
    .slice(0, 4);
  const gentle = lines.filter((l) => l.ratio < 0.5).sort((a, b) => a.ratio - b.ratio)[0] ?? null;
  const phase = currentPhase(data, addDays(week, 6) < today ? addDays(week, 6) : today);
  const endOfPhase = !!phase?.end && phase.end >= week && phase.end <= addDays(week, 6);
  let previousTweak: ReviewSummary['previousTweak'] = null;
  const prev = data.reviews.get(addDays(week, -7));
  if (prev?.tweak) previousTweak = { week: prev.week, text: prev.tweak };
  return {
    week,
    days,
    constancy: weekConstancy(data, week, today).ratio,
    phase: phase?.number ?? null,
    endOfPhase,
    highlights,
    gentle,
    previousTweak,
  };
}

/** O ajuste da semana que aparece no cartão da semana do Hoje (até a próxima revisão). */
export function currentTweak(data: DomainData, today: DayKey): { week: WeekKey; text: string } | null {
  let best: Review | null = null;
  for (const r of data.reviews.values()) {
    if (r.status !== 'done' || !r.tweak) continue;
    if (r.week >= weekStart(today)) continue;
    if (!best || r.week > best.week) best = r;
  }
  if (!best) return null;
  // vale até a revisão seguinte ser feita
  const next = data.reviews.get(addDays(best.week, 7));
  if (next?.status === 'done') return null;
  return { week: best.week, text: best.tweak! };
}
