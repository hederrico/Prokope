// Plano de corrida "do zero aos 30 minutos" em 13 semanas (SPEC, grupo D), 2 treinos por semana.
// Cada treino: 5 min de aquecimento caminhando, os blocos da semana e 5 min de volta à calma.
// O motor nunca conta por tique: o tempo é agora − começo − pausas (runElapsed), e runPosition acha o bloco.
import type { Millis, Run } from '@/types';
import { formatNumber } from './format';

export type RunBlockKind = 'warmup' | 'run' | 'walk' | 'cooldown';

export interface RunBlock {
  kind: RunBlockKind;
  seconds: number;
  /** número do intervalo de trote (1 a N), nos blocos de trote */
  interval?: number;
}

export interface RunWeek {
  week: number;
  /** "8× (1 + 1,5)", "15 + 2 + 8", "20 contínuos" */
  label: string;
  /** frase para o leitor de tela */
  description: string;
  blocks: RunBlock[];
  totalSeconds: number;
  /** segundos de trote */
  runSeconds: number;
  /** intervalos de trote */
  intervals: number;
}

const WARMUP = 5 * 60;
const COOLDOWN = 5 * 60;

type Spec = { repeat: number; run: number; walk: number } | { seq: number[] } | { continuous: number };

const SPECS: Spec[] = [
  { repeat: 8, run: 1, walk: 1.5 },
  { repeat: 8, run: 1, walk: 1 },
  { repeat: 6, run: 1.5, walk: 1.5 },
  { repeat: 5, run: 2, walk: 1.5 },
  { repeat: 4, run: 3, walk: 1.5 },
  { repeat: 3, run: 4, walk: 1.5 },
  { repeat: 3, run: 5, walk: 2 },
  { repeat: 2, run: 8, walk: 2 },
  { repeat: 2, run: 10, walk: 2 },
  { seq: [15, 2, 8] },
  { continuous: 20 },
  { continuous: 25 },
  { continuous: 30 },
];

function minutesText(m: number): string {
  if (m === 1) return '1 minuto';
  if (m === 1.5) return '1 minuto e meio';
  if (m % 1 === 0.5) return `${Math.floor(m)} minutos e meio`;
  return `${formatNumber(m)} minutos`;
}

function buildWeek(week: number, spec: Spec): RunWeek {
  const blocks: RunBlock[] = [{ kind: 'warmup', seconds: WARMUP }];
  let label: string;
  let description: string;
  let interval = 0;
  if ('repeat' in spec) {
    for (let i = 0; i < spec.repeat; i++) {
      blocks.push({ kind: 'run', seconds: spec.run * 60, interval: ++interval });
      blocks.push({ kind: 'walk', seconds: spec.walk * 60 });
    }
    label = `${spec.repeat}× (${formatNumber(spec.run)} + ${formatNumber(spec.walk)})`;
    description = `${spec.repeat} vezes ${minutesText(spec.run)} de trote e ${minutesText(spec.walk)} de caminhada`;
  } else if ('seq' in spec) {
    spec.seq.forEach((m, i) => {
      if (i % 2 === 0) blocks.push({ kind: 'run', seconds: m * 60, interval: ++interval });
      else blocks.push({ kind: 'walk', seconds: m * 60 });
    });
    label = spec.seq.map((m) => formatNumber(m)).join(' + ');
    description = `${minutesText(spec.seq[0])} de trote, ${minutesText(spec.seq[1])} de caminhada e ${minutesText(spec.seq[2])} de trote`;
  } else {
    blocks.push({ kind: 'run', seconds: spec.continuous * 60, interval: ++interval });
    label = `${spec.continuous} contínuos`;
    description = `${spec.continuous} minutos de trote contínuo`;
  }
  blocks.push({ kind: 'cooldown', seconds: COOLDOWN });
  const runSeconds = blocks.filter((b) => b.kind === 'run').reduce((n, b) => n + b.seconds, 0);
  const totalSeconds = blocks.reduce((n, b) => n + b.seconds, 0);
  return {
    week,
    label,
    description: `Semana ${week}: ${description}. ${minutesText(runSeconds / 60)} de trote.`,
    blocks,
    totalSeconds,
    runSeconds,
    intervals: interval,
  };
}

export const RUN_PLAN: RunWeek[] = SPECS.map((s, i) => buildWeek(i + 1, s));
export const RUN_WEEKS = RUN_PLAN.length;
export const RUN_SESSIONS_PER_WEEK = 2;

export function runWeek(week: number): RunWeek {
  return RUN_PLAN[Math.min(Math.max(1, week), RUN_WEEKS) - 1];
}

export interface RunPosition {
  /** bloco atual (o último, quando terminou) */
  index: number;
  block: RunBlock;
  next: RunBlock | null;
  /** segundos já feitos no bloco e quanto falta */
  inBlock: number;
  remaining: number;
  /** intervalo de trote atual (o último começado) e o total */
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

/** Intervalos de trote completos até `elapsed`. */
export function intervalsCompleted(week: RunWeek, elapsedSeconds: number): number {
  let acc = 0;
  let n = 0;
  for (const b of week.blocks) {
    acc += b.seconds;
    if (b.kind === 'run' && elapsedSeconds >= acc) n++;
  }
  return n;
}

/** O próximo treino do plano a partir dos treinos feitos (2 por semana; depois da semana 13, repete a 13). */
export function nextSession(doneSessions: number): { week: number; session: number } {
  const week = Math.min(RUN_WEEKS, Math.floor(doneSessions / RUN_SESSIONS_PER_WEEK) + 1);
  const session = doneSessions >= RUN_WEEKS * RUN_SESSIONS_PER_WEEK ? 2 : (doneSessions % RUN_SESSIONS_PER_WEEK) + 1;
  return { week, session };
}
