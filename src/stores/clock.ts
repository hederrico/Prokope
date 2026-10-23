// Relógio do app: a hora atual e o dia lógico (vira às 4h no fuso do perfil).
// Atualiza a cada minuto, na virada do dia e ao voltar para a frente (visibilitychange).
// Para capturas e testes, a hora pode ser fixada: setFixedNow(ms) ou ?agora=20:34 na URL (veja installAgoraParam).
import { create } from 'zustand';
import type { DayKey } from '@/types';
import { clockOf, instantAt, logicalDay, logicalMinutesOf, nextDayTurn, type Clock } from '@/domain/day';
import { useDataStore } from './data';

export interface ClockState {
  /** agora, em ms */
  now: number;
  /** dia lógico atual */
  today: DayKey;
  /** minutos desde a meia-noite do dia lógico (0h30 da madrugada = 1470) */
  minutes: number;
  /** fuso e virada do perfil */
  clock: Clock;
  /** hora fixada (capturas e testes) */
  fixed: boolean;
}

let fixedNow: number | null = null;

/** Agora, respeitando a hora fixada. Use nas ações no lugar de Date.now(). */
export function nowMs(): number {
  return fixedNow ?? Date.now();
}

function compute(now: number, clock: Clock): Omit<ClockState, 'fixed'> {
  return { now, today: logicalDay(now, clock), minutes: logicalMinutesOf(now, clock), clock };
}

export const useClockStore = create<ClockState>(() => ({
  ...compute(Date.now(), clockOf(null)),
  fixed: false,
}));

/** Recalcula o relógio agora (chamado pelos temporizadores e ao voltar para a frente). */
export function tick() {
  const clock = clockOf(useDataStore.getState().profile);
  const next = compute(nowMs(), clock);
  const s = useClockStore.getState();
  if (
    s.today !== next.today ||
    s.minutes !== next.minutes ||
    s.clock.timeZone !== clock.timeZone ||
    s.clock.dayStartHour !== clock.dayStartHour ||
    s.fixed !== (fixedNow !== null)
  ) {
    useClockStore.setState({ ...next, fixed: fixedNow !== null });
  } else if (Math.abs(s.now - next.now) > 1000) {
    useClockStore.setState({ now: next.now });
  }
}

/** Fixa a hora (ms) ou volta ao relógio real (null). */
export function setFixedNow(ms: number | null) {
  fixedNow = ms;
  tick();
}

/**
 * Lê "20:34", "2026-10-22T20:34" ou "2026-10-22" como instante no fuso do perfil.
 * Só o horário usa o dia lógico de hoje.
 */
export function parseAgora(value: string, clock: Clock = clockOf(useDataStore.getState().profile)): number | null {
  const v = value.trim();
  const hm = /^(\d{1,2})[:h](\d{2})$/.exec(v);
  if (hm) return instantAt(logicalDay(Date.now(), clock), `${hm[1].padStart(2, '0')}:${hm[2]}`, clock);
  const full = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{1,2}):(\d{2}))?$/.exec(v);
  if (full) return instantAt(full[1], `${(full[2] ?? '12').padStart(2, '0')}:${full[3] ?? '00'}`, clock);
  return null;
}

/** Em desenvolvimento e nas capturas: ?agora=20:34 fixa a hora do app. */
export function installAgoraParam(search: string = typeof location !== 'undefined' ? location.search : '') {
  const value = new URLSearchParams(search).get('agora');
  if (!value) return;
  const ms = parseAgora(value);
  if (ms !== null) setFixedNow(ms);
}

let started = 0;
let cleanupFns: (() => void)[] = [];

/** Liga os temporizadores do relógio. Devolve a função que desliga. */
export function startClock(): () => void {
  started++;
  if (started === 1) {
    tick();
    let minuteTimer: ReturnType<typeof setTimeout> | undefined;
    let turnTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleMinute = () => {
      const now = Date.now();
      minuteTimer = setTimeout(
        () => {
          tick();
          scheduleMinute();
        },
        60_000 - (now % 60_000) + 50,
      );
    };
    const scheduleTurn = () => {
      clearTimeout(turnTimer);
      const s = useClockStore.getState();
      const wait = Math.max(1000, nextDayTurn(nowMs(), s.clock) - nowMs() + 50);
      // setTimeout aceita no máximo ~24 dias; a virada é sempre em menos de 1 dia
      turnTimer = setTimeout(() => {
        tick();
        scheduleTurn();
      }, wait);
    };
    scheduleMinute();
    scheduleTurn();
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        tick();
        scheduleTurn();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    // o fuso e a virada vêm do perfil
    const unsubProfile = useDataStore.subscribe((s, prev) => {
      if (s.profile?.timeZone !== prev.profile?.timeZone || s.profile?.dayStartHour !== prev.profile?.dayStartHour) {
        tick();
        scheduleTurn();
      }
    });
    cleanupFns = [
      () => clearTimeout(minuteTimer),
      () => clearTimeout(turnTimer),
      () => document.removeEventListener('visibilitychange', onVisible),
      () => window.removeEventListener('focus', onVisible),
      unsubProfile,
    ];
  }
  return () => {
    started = Math.max(0, started - 1);
    if (started === 0) {
      for (const f of cleanupFns) f();
      cleanupFns = [];
    }
  };
}

/** O dia lógico de hoje (hook). */
export function useTodayKey(): DayKey {
  return useClockStore((s) => s.today);
}
