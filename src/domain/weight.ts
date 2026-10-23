// Peso e cintura: a média de 7 dias e a frase neutra da tendência ("desceu", "subiu" ou "ficou estável").
// A tendência pede 3 pesagens. Nada de cor: o título é sempre neutro.
import type { DayKey, Measurement } from '@/types';
import { addDays, diffDays } from './day';
import { formatNumber } from './format';

export interface WeightPoint {
  day: DayKey;
  value: number;
  /** média das pesagens dos 7 dias que terminam neste dia */
  avg: number;
}

export interface WeightTrend {
  /** já tem 3 pesagens */
  ready: boolean;
  count: number;
  needed: number;
  points: WeightPoint[];
  /** última pesagem e a média de agora */
  last: Measurement | null;
  avg: number | null;
  /** variação da média no período (kg), arredondada a 0,1 */
  delta: number | null;
  /** semanas comparadas (até 3) */
  weeks: number;
  direction: 'down' | 'up' | 'stable' | null;
  /** "Tendência −1,1 kg em 3 semanas" */
  title: string;
  /** "A média de 7 dias desceu 1,1 kg em 3 semanas." */
  sentence: string;
}

export const WEIGHT_NEEDED = 3;
const STABLE_KG = 0.2;

/** Média das medidas nos 7 dias que terminam em `day` (null sem medidas). */
export function avg7(list: Measurement[], day: DayKey): number | null {
  let sum = 0;
  let n = 0;
  for (const m of list) {
    const d = diffDays(day, m.day);
    if (d >= 0 && d < 7) {
      sum += m.value;
      n++;
    }
  }
  return n ? sum / n : null;
}

export function weightTrend(list: Measurement[], today: DayKey, weeksWanted = 3, unit = 'kg'): WeightTrend {
  const sorted = [...list].filter((m) => m.day <= today).sort((a, b) => (a.day < b.day ? -1 : 1));
  const points = sorted.map((m) => ({ day: m.day, value: m.value, avg: avg7(sorted, m.day) ?? m.value }));
  const last = sorted[sorted.length - 1] ?? null;
  const base: WeightTrend = {
    ready: false,
    count: sorted.length,
    needed: WEIGHT_NEEDED,
    points,
    last,
    avg: last ? avg7(sorted, last.day) : null,
    delta: null,
    weeks: 0,
    direction: null,
    title: '',
    sentence: '',
  };
  if (sorted.length < WEIGHT_NEEDED || !last) return base;
  const first = sorted[0];
  const spanWeeks = Math.floor(diffDays(last.day, first.day) / 7);
  const weeks = Math.max(1, Math.min(weeksWanted, spanWeeks));
  const thenDay = addDays(last.day, -weeks * 7);
  const thenAvg = avg7(sorted, thenDay) ?? first.value;
  const nowAvg = base.avg ?? last.value;
  const delta = Math.round((nowAvg - thenAvg) * 10) / 10;
  const direction = Math.abs(delta) < STABLE_KG ? 'stable' : delta < 0 ? 'down' : 'up';
  const wk = weeks === 1 ? '1 semana' : `${weeks} semanas`;
  const amount = `${formatNumber(Math.abs(delta))} ${unit}`;
  const sign = delta < 0 ? '−' : '+';
  return {
    ...base,
    ready: true,
    delta,
    weeks,
    direction,
    title: direction === 'stable' ? `Tendência estável em ${wk}` : `Tendência ${sign}${amount} em ${wk}`,
    sentence:
      direction === 'stable'
        ? `A média de 7 dias ficou estável em ${wk}.`
        : `A média de 7 dias ${direction === 'down' ? 'desceu' : 'subiu'} ${amount} em ${wk}.`,
  };
}

/** A última medida antes de um dia (o placeholder "83,3" da folha do peso). */
export function lastBefore(list: Measurement[], day: DayKey): Measurement | null {
  let best: Measurement | null = null;
  for (const m of list) if (m.day < day && (!best || m.day > best.day)) best = m;
  return best;
}
