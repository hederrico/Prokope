// Treino guiado (SPEC, grupo D): um plano em semanas, de qualquer esforço (correr, pedalar, nadar), com N treinos por
// semana. Cada treino: o aquecimento, os blocos da semana (esforço e descanso) e a volta à calma.
// O modelo pronto é a corrida "do zero aos 30 minutos" em 13 semanas, 2 treinos por semana, com 5 min de caminhada
// antes e depois. O plano é do hábito (habit.training); sem plano, vale o modelo.
// O motor nunca conta por tique: o tempo é agora − começo − pausas (runElapsed), e runPosition acha o bloco.
import type { Habit, Millis, Run, TrainingPlan, TrainingWeek } from '@/types';
import { formatNumber } from './format';

/** esforço (correr) e descanso (caminhar), entre o aquecimento e a volta à calma */
export type RunBlockKind = 'warmup' | 'effort' | 'rest' | 'cooldown';

export interface RunBlock {
  kind: RunBlockKind;
  seconds: number;
  /** número do intervalo de esforço (1 a N), nos blocos de esforço */
  interval?: number;
}

export interface RunWeek {
  week: number;
  /** "8× (1 + 1,5)", "15 + 2 + 8", "20 contínuos" */
  label: string;
  /** frase para o leitor de tela ("Semana 3: 6 vezes correr 1 minuto e meio e caminhar 1 minuto e meio. ...") */
  description: string;
  blocks: RunBlock[];
  totalSeconds: number;
  /** segundos de esforço */
  effortSeconds: number;
  /** intervalos de esforço */
  intervals: number;
}

/** Os nomes do esforço e do descanso, como a pessoa escreveu ("Pedalar", "Pedalar leve"). */
export interface TrainingNames {
  effort: string;
  rest: string;
}

export const DEFAULT_EFFORT = 'Correr';
export const DEFAULT_REST = 'Caminhar';

// ---------- o modelo pronto ----------

const RUN_WEEKS_SPEC: TrainingWeek[] = [
  { kind: 'repeat', repeat: 8, effort: 1, rest: 1.5 },
  { kind: 'repeat', repeat: 8, effort: 1, rest: 1 },
  { kind: 'repeat', repeat: 6, effort: 1.5, rest: 1.5 },
  { kind: 'repeat', repeat: 5, effort: 2, rest: 1.5 },
  { kind: 'repeat', repeat: 4, effort: 3, rest: 1.5 },
  { kind: 'repeat', repeat: 3, effort: 4, rest: 1.5 },
  { kind: 'repeat', repeat: 3, effort: 5, rest: 2 },
  { kind: 'repeat', repeat: 2, effort: 8, rest: 2 },
  { kind: 'repeat', repeat: 2, effort: 10, rest: 2 },
  { kind: 'sequence', steps: [15, 2, 8] },
  { kind: 'continuous', minutes: 20 },
  { kind: 'continuous', minutes: 25 },
  { kind: 'continuous', minutes: 30 },
];

export interface TrainingTemplate {
  key: string;
  name: string;
  /** treinos por semana sugeridos */
  perWeek: number;
  plan: TrainingPlan;
}

export const RUN_TEMPLATE: TrainingTemplate = {
  key: 'corrida-30',
  name: 'Corrida do zero aos 30 minutos',
  perWeek: 2,
  plan: { effort: DEFAULT_EFFORT, rest: DEFAULT_REST, warmupMin: 5, cooldownMin: 5, weeks: RUN_WEEKS_SPEC },
};

export const TRAINING_TEMPLATES: TrainingTemplate[] = [RUN_TEMPLATE];

function cloneWeek(w: TrainingWeek): TrainingWeek {
  return w.kind === 'sequence' ? { kind: 'sequence', steps: [...w.steps] } : { ...w };
}

/** Uma cópia do plano (para editar sem mexer no original). */
export function clonePlan(plan: TrainingPlan): TrainingPlan {
  return { ...plan, weeks: plan.weeks.map(cloneWeek) };
}

/** O plano do modelo da corrida (cópia nova, com os nomes padrão). */
export function runTemplatePlan(): TrainingPlan {
  return clonePlan(RUN_TEMPLATE.plan);
}

/** A semana que começa um plano montado do zero: 5 × (2 + 1). */
export const BLANK_WEEK: TrainingWeek = { kind: 'repeat', repeat: 5, effort: 2, rest: 1 };

/** Um plano de uma semana só, para montar do seu jeito (os nomes e os minutos de antes e depois ficam). */
export function blankPlan(from?: Partial<TrainingPlan>): TrainingPlan {
  return {
    effort: from?.effort ?? DEFAULT_EFFORT,
    rest: from?.rest ?? DEFAULT_REST,
    warmupMin: from?.warmupMin ?? 5,
    cooldownMin: from?.cooldownMin ?? 5,
    weeks: [cloneWeek(BLANK_WEEK)],
  };
}

function sameWeek(a: TrainingWeek, b: TrainingWeek): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'repeat' && b.kind === 'repeat')
    return a.repeat === b.repeat && a.effort === b.effort && a.rest === b.rest;
  if (a.kind === 'continuous' && b.kind === 'continuous') return a.minutes === b.minutes;
  if (a.kind === 'sequence' && b.kind === 'sequence')
    return a.steps.length === b.steps.length && a.steps.every((s, i) => s === b.steps[i]);
  return false;
}

/** O modelo de onde o plano veio, enquanto ele não foi mexido (as semanas e os minutos de antes e depois). */
export function templateOf(plan: TrainingPlan): TrainingTemplate | null {
  return (
    TRAINING_TEMPLATES.find(
      (t) =>
        t.plan.warmupMin === plan.warmupMin &&
        t.plan.cooldownMin === plan.cooldownMin &&
        t.plan.weeks.length === plan.weeks.length &&
        t.plan.weeks.every((w, i) => sameWeek(w, plan.weeks[i])),
    ) ?? null
  );
}

// ---------- ler o plano de um hábito ----------

const positive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
const minutesOr = (n: unknown, d: number) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : d);

function validWeek(w: unknown): TrainingWeek | null {
  if (!w || typeof w !== 'object') return null;
  const x = w as Record<string, unknown>;
  if (x.kind === 'repeat' && positive(x.repeat) && positive(x.effort) && minutesOr(x.rest, -1) >= 0)
    return { kind: 'repeat', repeat: Math.round(x.repeat), effort: x.effort, rest: x.rest as number };
  if (x.kind === 'sequence' && Array.isArray(x.steps)) {
    const steps = x.steps.filter(positive);
    return steps.length ? { kind: 'sequence', steps } : null;
  }
  if (x.kind === 'continuous' && positive(x.minutes)) return { kind: 'continuous', minutes: x.minutes };
  return null;
}

const sanitized = new WeakMap<object, TrainingPlan>();

/**
 * O plano de um hábito, sempre válido: sem plano (ou de um documento antigo), o modelo da corrida; nomes vazios
 * voltam ao padrão; semanas estragadas saem. O mesmo plano gravado devolve sempre o mesmo objeto.
 */
export function trainingOf(habit: Pick<Habit, 'training'> | null | undefined): TrainingPlan {
  const raw = habit?.training;
  if (!raw || typeof raw !== 'object') return RUN_TEMPLATE.plan;
  const hit = sanitized.get(raw);
  if (hit) return hit;
  const weeks = (Array.isArray(raw.weeks) ? raw.weeks : []).map(validWeek).filter((w): w is TrainingWeek => !!w);
  const plan: TrainingPlan = {
    effort: (typeof raw.effort === 'string' && raw.effort.trim()) || DEFAULT_EFFORT,
    rest: (typeof raw.rest === 'string' && raw.rest.trim()) || DEFAULT_REST,
    warmupMin: minutesOr(raw.warmupMin, 5),
    cooldownMin: minutesOr(raw.cooldownMin, 5),
    weeks: weeks.length ? weeks : RUN_TEMPLATE.plan.weeks,
  };
  sanitized.set(raw, plan);
  return plan;
}

export function namesOf(plan: Pick<TrainingPlan, 'effort' | 'rest'>): TrainingNames {
  return { effort: plan.effort, rest: plan.rest };
}

/** Treinos por semana do hábito (2 no modelo). */
export function sessionsPerWeek(habit: Pick<Habit, 'goal'> | null | undefined): number {
  const n = habit?.goal?.perWeek;
  return positive(n) ? Math.round(n) : RUN_TEMPLATE.perWeek;
}

// ---------- textos ----------

function minutesText(m: number): string {
  if (m === 1) return '1 minuto';
  if (m === 0.5) return 'meio minuto';
  if (m === 1.5) return '1 minuto e meio';
  if (m % 1 === 0.5) return `${Math.floor(m)} minutos e meio`;
  return `${formatNumber(m, 1)} minutos`;
}

const lower = (s: string) => s.toLocaleLowerCase('pt-BR');

/**
 * O gerúndio do nome, quando ele é um verbo: "Correr" → "correndo", "Pedalar leve" → "pedalando leve",
 * "Nadar" → "nadando". Um nome que não termina em -ar, -er ou -ir ("Trote") fica sem gerúndio (null).
 */
export function gerund(name: string): string | null {
  const [first, ...rest] = lower(name.trim()).split(/\s+/);
  const m = /^(.*[a-zà-ú])(a|e|i)r$/.exec(first ?? '');
  if (!m) return null;
  const g = `${m[1]}${m[2] === 'a' ? 'ando' : m[2] === 'e' ? 'endo' : 'indo'}`;
  return [g, ...rest].join(' ');
}

/** "tempo correndo", "tempo de trote" (o rótulo da coluna dos minutos de esforço). */
export function effortTimeLabel(names: TrainingNames): string {
  const g = gerund(names.effort);
  return g ? `tempo ${g}` : `tempo de ${lower(names.effort)}`;
}

/** "9 minutos correndo", "9 minutos de trote". */
export function effortMinutesText(names: TrainingNames, minutes: number): string {
  const g = gerund(names.effort);
  return g ? `${minutesText(minutes)} ${g}` : `${minutesText(minutes)} de ${lower(names.effort)}`;
}

/** "8× (1 + 1,5)", "15 + 2 + 8", "20 contínuos". */
export function weekLabel(w: TrainingWeek): string {
  if (w.kind === 'repeat') return `${w.repeat}× (${formatNumber(w.effort, 1)} + ${formatNumber(w.rest, 1)})`;
  if (w.kind === 'sequence') return w.steps.map((m) => formatNumber(m, 1)).join(' + ');
  return `${formatNumber(w.minutes, 1)} contínuos`;
}

/** "6 vezes correr 1 minuto e meio e caminhar 1 minuto e meio" (sem a semana e o total). */
export function weekPhrase(w: TrainingWeek, names: TrainingNames): string {
  const e = lower(names.effort);
  const r = lower(names.rest);
  if (w.kind === 'repeat') {
    const head = w.repeat === 1 ? '1 vez' : `${w.repeat} vezes`;
    return w.rest > 0
      ? `${head} ${e} ${minutesText(w.effort)} e ${r} ${minutesText(w.rest)}`
      : `${head} ${e} ${minutesText(w.effort)}`;
  }
  if (w.kind === 'sequence') {
    const parts = w.steps.map((m, i) => `${i % 2 === 0 ? e : r} ${minutesText(m)}`);
    return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
  }
  return `${e} ${minutesText(w.minutes)} sem parar`;
}

// ---------- montar as semanas ----------

/** Os blocos de uma semana: aquecimento, esforço e descanso, volta à calma. */
export function buildWeek(week: number, spec: TrainingWeek, plan: Omit<TrainingPlan, 'weeks'>): RunWeek {
  const names = namesOf(plan);
  const blocks: RunBlock[] = [];
  if (plan.warmupMin > 0) blocks.push({ kind: 'warmup', seconds: Math.round(plan.warmupMin * 60) });
  let interval = 0;
  if (spec.kind === 'repeat') {
    for (let i = 0; i < spec.repeat; i++) {
      blocks.push({ kind: 'effort', seconds: Math.round(spec.effort * 60), interval: ++interval });
      if (spec.rest > 0) blocks.push({ kind: 'rest', seconds: Math.round(spec.rest * 60) });
    }
  } else if (spec.kind === 'sequence') {
    spec.steps.forEach((m, i) => {
      if (i % 2 === 0) blocks.push({ kind: 'effort', seconds: Math.round(m * 60), interval: ++interval });
      else blocks.push({ kind: 'rest', seconds: Math.round(m * 60) });
    });
  } else {
    blocks.push({ kind: 'effort', seconds: Math.round(spec.minutes * 60), interval: ++interval });
  }
  if (plan.cooldownMin > 0) blocks.push({ kind: 'cooldown', seconds: Math.round(plan.cooldownMin * 60) });
  const effortSeconds = blocks.filter((b) => b.kind === 'effort').reduce((n, b) => n + b.seconds, 0);
  const totalSeconds = blocks.reduce((n, b) => n + b.seconds, 0);
  const phrase = weekPhrase(spec, names);
  return {
    week,
    label: weekLabel(spec),
    description: `Semana ${week}: ${phrase}. ${effortMinutesText(names, effortSeconds / 60)} no total.`,
    blocks,
    totalSeconds,
    effortSeconds,
    intervals: interval,
  };
}

const builtWeeks = new WeakMap<TrainingPlan, RunWeek[]>();

/** As semanas do plano, em blocos (calculadas uma vez por plano). */
export function planWeeks(plan: TrainingPlan): RunWeek[] {
  const hit = builtWeeks.get(plan);
  if (hit) return hit;
  const weeks = plan.weeks.map((w, i) => buildWeek(i + 1, w, plan));
  builtWeeks.set(plan, weeks);
  return weeks;
}

/** Uma semana do plano (a primeira ou a última, quando o número passa das pontas). */
export function planWeek(plan: TrainingPlan, week: number): RunWeek {
  const weeks = planWeeks(plan);
  return weeks[Math.min(Math.max(1, week), weeks.length) - 1];
}

/** A semana de um treino feito pelo hábito (o plano dele; sem hábito, o modelo da corrida). */
export function weekOfHabit(habit: Pick<Habit, 'training'> | null | undefined, week: number): RunWeek {
  return planWeek(trainingOf(habit), week);
}

// o plano do modelo, pronto (os testes e as telas antigas)
export const RUN_PLAN: RunWeek[] = planWeeks(RUN_TEMPLATE.plan);
export const RUN_WEEKS = RUN_PLAN.length;
export const RUN_SESSIONS_PER_WEEK = RUN_TEMPLATE.perWeek;

export function runWeek(week: number): RunWeek {
  return planWeek(RUN_TEMPLATE.plan, week);
}

// ---------- o motor ----------

export interface RunPosition {
  /** bloco atual (o último, quando terminou) */
  index: number;
  block: RunBlock;
  next: RunBlock | null;
  /** segundos já feitos no bloco e quanto falta */
  inBlock: number;
  remaining: number;
  /** intervalo de esforço atual (o último começado) e o total */
  interval: number;
  intervals: number;
  elapsed: number;
  total: number;
  done: boolean;
}

/** Onde o treino está depois de `elapsed` segundos. */
export function runPosition(week: RunWeek, elapsedSeconds: number): RunPosition {
  const elapsed = Math.max(0, elapsedSeconds);
  let acc = 0;
  let interval = 0;
  for (let i = 0; i < week.blocks.length; i++) {
    const b = week.blocks[i];
    if (b.interval) interval = b.interval;
    if (elapsed < acc + b.seconds) {
      return {
        index: i,
        block: b,
        next: week.blocks[i + 1] ?? null,
        inBlock: elapsed - acc,
        remaining: acc + b.seconds - elapsed,
        interval: b.kind === 'warmup' ? 0 : interval,
        intervals: week.intervals,
        elapsed,
        total: week.totalSeconds,
        done: false,
      };
    }
    acc += b.seconds;
  }
  const last = week.blocks.length - 1;
  return {
    index: last,
    block: week.blocks[last],
    next: null,
    inBlock: week.blocks[last].seconds,
    remaining: 0,
    interval: week.intervals,
    intervals: week.intervals,
    elapsed: week.totalSeconds,
    total: week.totalSeconds,
    done: true,
  };
}

/** Segundos de treino: agora − começo − pausas (a tela bloqueada não desvia o tempo). */
export function runElapsed(run: Pick<Run, 'startedAt' | 'pauses' | 'endedAt'>, now: Millis): number {
  const end = run.endedAt ?? now;
  let paused = 0;
  for (const p of run.pauses ?? []) paused += Math.max(0, (p.to ?? end) - p.from);
  return Math.max(0, (end - run.startedAt - paused) / 1000);
}

/** Intervalos de esforço completos até `elapsed`. */
export function intervalsCompleted(week: RunWeek, elapsedSeconds: number): number {
  let acc = 0;
  let n = 0;
  for (const b of week.blocks) {
    acc += b.seconds;
    if (b.kind === 'effort' && elapsedSeconds >= acc) n++;
  }
  return n;
}

/** Segundos de esforço feitos em `seconds` de treino. */
export function effortSecondsDone(week: RunWeek, seconds: number): number {
  let acc = 0;
  let total = 0;
  for (const b of week.blocks) {
    if (b.kind === 'effort') total += Math.min(b.seconds, Math.max(0, seconds - acc));
    acc += b.seconds;
  }
  return total;
}

/**
 * Como um treino conta: o treino inteiro é feito, a partir da metade é parcial, e abaixo fica registrado sem contar
 * (a meta de cada treino é o próprio plano).
 */
export function sessionStatus(week: RunWeek, seconds: number): 'done' | 'partial' | 'logged' {
  if (seconds >= week.totalSeconds - 1) return 'done';
  if (seconds >= week.totalSeconds / 2) return 'partial';
  return 'logged';
}

/**
 * O próximo treino a partir dos treinos feitos: `perWeek` por semana, na ordem; depois da última semana, repete a
 * última. Contar os feitos (e não guardar a posição) mantém o progresso de quem já treinava antes do plano editável.
 */
export function nextSession(
  doneSessions: number,
  weeks: number = RUN_WEEKS,
  perWeek: number = RUN_SESSIONS_PER_WEEK,
): { week: number; session: number } {
  const per = Math.max(1, Math.round(perWeek));
  const total = Math.max(1, weeks);
  const week = Math.min(total, Math.floor(doneSessions / per) + 1);
  const session = doneSessions >= total * per ? per : (doneSessions % per) + 1;
  return { week, session };
}
