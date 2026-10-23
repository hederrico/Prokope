// O motor da corrida fora do React (jornada.md › Corrida em andamento): som das trocas, contagem 3, 2, 1,
// vibração e a trava da tela (Wake Lock). Ele segue rodando quando a pessoa minimiza o treino, porque o app
// continua aberto e a faixa do Hoje troca de cor igual.
// O tempo nunca é contado por tique: a cada verificação, decorrido = agora − começo − pausas (runElapsed).
//
// Para outras telas (a faixa RunStrip do Hoje): chame `startRunEngine()` ao mostrar a faixa e `prepareRun()`
// dentro do toque em "Começar" (o iPhone só libera o áudio e a trava da tela depois de um gesto).
import { create } from 'zustand';
import type { Run } from '@/types';
import { runElapsed, runPosition, runWeek, type RunBlock, type RunPosition } from '@/data';
import { haptic } from '@/motion';
import { useDataStore } from '@/stores/data';
import { nowMs } from '@/stores/clock';

// ---------- som (Web Audio) ----------

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    // o bipe abaixa a música em vez de pará-la (Safari 17+)
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session && session.type !== 'transient') session.type = 'transient';
  } catch {
    /* sem audioSession */
  }
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  return ctx;
}

/** Um tom com envelope de 10 ms de ataque e 150 ms de saída, em volume 0,6. */
function tone(freq: number, ms: number, at = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01 + at / 1000;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(0.6, t + 0.01);
  gain.gain.setValueAtTime(0.6, t + ms / 1000);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000 + 0.15);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + ms / 1000 + 0.17);
}

export const runSound = {
  /** contagem: 660 Hz, 60 ms */
  tick: () => safe(() => tone(660, 60)),
  /** trote: dois bipes de 880 Hz (120 ms, com 80 ms entre eles) */
  run: () =>
    safe(() => {
      tone(880, 120);
      tone(880, 120, 200);
    }),
  /** caminhada: um tom de 523 Hz de 300 ms */
  walk: () => safe(() => tone(523, 300)),
};

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    /* sem áudio: tudo segue igual */
  }
}

// ---------- trava da tela ----------

type WakeState = 'on' | 'off' | 'unsupported';
interface WakeLockSentinelLike {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', fn: () => void): void;
}

export const useWakeLock = create<{ state: WakeState }>(() => ({ state: 'off' }));
let sentinel: WakeLockSentinelLike | null = null;
let wantLock = false;

/** Pede para a tela ficar acesa (no começar e a cada volta para a frente). */
export async function requestWakeLock(): Promise<boolean> {
  wantLock = true;
  const wl = (navigator as unknown as { wakeLock?: { request(t: 'screen'): Promise<WakeLockSentinelLike> } })
    .wakeLock;
  if (!wl) {
    useWakeLock.setState({ state: 'unsupported' });
    return false;
  }
  if (sentinel && !sentinel.released) {
    useWakeLock.setState({ state: 'on' });
    return true;
  }
  try {
    const s = await wl.request('screen');
    sentinel = s;
    useWakeLock.setState({ state: 'on' });
    s.addEventListener('release', () => {
      if (sentinel === s) sentinel = null;
      useWakeLock.setState({ state: 'off' });
    });
    return true;
  } catch {
    useWakeLock.setState({ state: 'off' });
    return false;
  }
}

/** Solta a trava (treino pausado por mais de 10 min, encerrado ou descartado). */
export function releaseWakeLock(): void {
  wantLock = false;
  const s = sentinel;
  sentinel = null;
  if (s && !s.released) void s.release().catch(() => {});
  useWakeLock.setState((st) => (st.state === 'unsupported' ? st : { state: 'off' }));
}

/** Dentro do toque em "Começar": libera o áudio e pede a trava da tela. */
export function prepareRun(): void {
  audio();
  void requestWakeLock();
}

// ---------- o motor ----------

export type RunEvent =
  | { type: 'block'; run: Run; position: RunPosition; previous: RunBlock }
  | { type: 'done'; run: Run; position: RunPosition };

const listeners = new Set<(e: RunEvent) => void>();

/** Avisos do motor (troca de bloco, fim do treino) enquanto o app está na frente. */
export function onRunEvent(fn: (e: RunEvent) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function activeRun(): Run | null {
  let best: Run | null = null;
  for (const r of Object.values(useDataStore.getState().runs)) {
    if ((r.status === 'running' || r.status === 'paused') && (!best || r.startedAt > best.startedAt)) best = r;
  }
  return best && nowMs() - best.startedAt < 2 * 3_600_000 ? best : null;
}

function soundOn(): boolean {
  return useDataStore.getState().profile?.prefs?.runSound ?? true;
}

/** Posição do treino agora. */
export function positionOf(run: Run, at = nowMs()): RunPosition {
  return runPosition(runWeek(run.week), runElapsed(run, Math.max(at, run.startedAt)));
}

let timer: ReturnType<typeof setInterval> | null = null;
let last: { runId: string; index: number; countdown: number; done: boolean } | null = null;
let pausedSince: number | null = null;
let boundVisibility = false;

function check() {
  const run = activeRun();
  if (!run) {
    last = null;
    pausedSince = null;
    if (wantLock) releaseWakeLock();
    if (timer) clearInterval(timer);
    timer = null;
    return;
  }
  const pos = positionOf(run);
  const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  // pausado por mais de 10 min: solta a trava da tela
  if (run.status === 'paused') {
    pausedSince ??= run.pauses[run.pauses.length - 1]?.from ?? nowMs();
    if (nowMs() - pausedSince > 10 * 60_000 && sentinel) releaseWakeLock();
  } else pausedSince = null;

  const countdown = pos.done ? 0 : Math.ceil(pos.remaining);
  if (!last || last.runId !== run.id || hidden) {
    // primeira leitura, outro treino ou app escondido: só acompanha, sem som pelas trocas perdidas
    last = { runId: run.id, index: pos.index, countdown, done: pos.done };
    return;
  }
  if (run.status !== 'running') {
    last = { ...last, countdown };
    return;
  }
  if (pos.done && !last.done) {
    last = { runId: run.id, index: pos.index, countdown, done: true };
    for (const l of [...listeners]) l({ type: 'done', run, position: pos });
    return;
  }
  if (pos.index !== last.index) {
    const previous = runWeek(run.week).blocks[last.index];
    last = { runId: run.id, index: pos.index, countdown, done: pos.done };
    if (soundOn()) (pos.block.kind === 'run' ? runSound.run : runSound.walk)();
    haptic();
    for (const l of [...listeners]) l({ type: 'block', run, position: pos, previous });
    return;
  }
  // contagem 3, 2, 1 antes da troca (um tique por segundo)
  if (countdown !== last.countdown && countdown >= 1 && countdown <= 3 && soundOn()) runSound.tick();
  last = { ...last, countdown };
}

/** Liga o motor (idempotente). Ele se desliga sozinho quando não há treino em andamento. */
export function startRunEngine(): void {
  if (typeof window === 'undefined') return;
  if (!boundVisibility) {
    boundVisibility = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      // de volta: retoma o áudio, pede a trava de novo e confere o tempo
      if (ctx?.state === 'suspended') void ctx.resume().catch(() => {});
      const run = activeRun();
      if (run?.status === 'running' && wantLock) void requestWakeLock();
      // as trocas que passaram com o app escondido não tocam som: recomeça a leitura do zero
      last = null;
      check();
    });
  }
  if (!timer) timer = setInterval(check, 250);
  check();
}

/** Para testes: a última posição vista pelo motor. */
export function engineSnapshot() {
  return last;
}
