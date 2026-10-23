// A faixa do dia, no topo do Resumo (hoje.md › Os três jeitos de ver o dia): das 6h às 23h (alargada se algum
// horário passar disso), um ponto por hábito com horário, na cor do pilar (feito cheio, parcial meio cheio como o
// círculo de marcar, por fazer só o contorno) e a marca do agora. Tocar num ponto leva até a linha do hábito.
// Pontos próximos ficam lado a lado e dividem uma área de toque de 44 px (stripLayout.ts). Nada aqui anima sozinho:
// o ponto troca de cor em micro quando o hábito é marcado, e a marca do agora anda com o relógio, sem ser anunciada.
import { useCallback, useId, useLayoutEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { pillarAttrs } from '@/components/ui';
import { dayStripRange, formatTime, isDoneLike, logicalMinutes, type TodayItem } from '@/data';
import { listNames, shortOf } from './copy';
import { stripTargets, stripTicks, stripX, type StripTarget } from './stripLayout';
import { pillarColor } from './visual';

type DotState = 'done' | 'partial' | 'open' | 'skipped';

/** Metade da distância entre dois pontos lado a lado (ponto de 14 px + 4 px): o vão entre eles. */
const HALF_STEP = 9;

function stateOf(item: TodayItem): DotState {
  if (item.state === 'skipped') return 'skipped';
  if (item.state === 'partial') return 'partial';
  return isDoneLike(item.state) ? 'done' : 'open';
}

const STATE_WORD: Record<DotState, string> = {
  done: 'feito',
  partial: 'feito em parte',
  open: 'por fazer',
  skipped: 'não conta hoje',
};

/** "6h", "12h", "0h" (minutos do dia lógico). */
function hourLabel(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return formatTime(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
}

/** Largura do elemento (a faixa desenha em px); começa pela largura do iPhone de 390 menos as margens. */
function useWidth(fallback: number) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(fallback);
  const ref = useCallback((node: HTMLElement | null) => setEl(node), []);
  useLayoutEffect(() => {
    if (!el) return;
    const read = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [ref, width] as const;
}

export interface DayStripProps {
  /** os hábitos do dia com horário, já no estado de agora */
  items: TodayItem[];
  /** minutos do dia lógico agora; null num dia que passou (sem a marca do agora) */
  now: number | null;
  dayStartHour: number;
  /** leva até as linhas destes hábitos */
  onReveal: (habitIds: string[]) => void;
  className?: string;
}

export function DayStrip({ items, now, dayStartHour, onReveal, className }: DayStripProps) {
  const descId = useId();
  const [ref, width] = useWidth(358);
  const points = useMemo(
    () => items.map((i) => ({ id: i.habit.id, minutes: logicalMinutes(i.time!, dayStartHour) })),
    [items, dayStartHour],
  );
  const range = useMemo(() => dayStripRange(points.map((p) => p.minutes)), [points]);
  const geometry = { ...range, width };
  const targets = useMemo(() => stripTargets(points, { ...range, width }), [points, range, width]);
  const byId = new Map(items.map((i) => [i.habit.id, i]));
  const minutesOf = new Map(points.map((p) => [p.id, p.minutes]));

  // a marca do agora fica sempre do lado certo de cada ponto: os pontos lado a lado saem um pouco do horário
  // exato, e a marca passa no vão entre o último que já foi e o primeiro que ainda vem
  let nowX = now === null ? null : stripX(now, geometry);
  if (nowX !== null && now !== null) {
    let lo = -Infinity;
    let hi = Infinity;
    for (const d of targets.flatMap((t) => t.dots)) {
      if ((minutesOf.get(d.id) ?? 0) <= now) lo = Math.max(lo, d.x + HALF_STEP);
      else hi = Math.min(hi, d.x - HALF_STEP);
    }
    nowX = Math.min(Math.max(nowX, lo), hi);
  }
  const ticks = stripTicks(range.start, range.end).map((m) => ({ m, x: stripX(m, geometry) }));

  if (!items.length) return null;

  const done = items.filter((i) => stateOf(i) === 'done' || stateOf(i) === 'partial').length;
  const first = Math.min(...points.map((p) => p.minutes));
  const last = Math.max(...points.map((p) => p.minutes));
  const next =
    now === null
      ? null
      : (items
          .filter((i) => (minutesOf.get(i.habit.id) ?? 0) >= now && stateOf(i) === 'open')
          .sort((a, b) => (minutesOf.get(a.habit.id) ?? 0) - (minutesOf.get(b.habit.id) ?? 0))[0] ?? null);
  const description = [
    `${items.length} ${items.length === 1 ? 'hábito' : 'hábitos'} com horário, ${
      first === last ? `às ${hourLabel(first)}` : `das ${hourLabel(first)} às ${hourLabel(last)}`
    }; ${done === 0 ? 'nenhum feito' : `${done} ${done === 1 ? 'feito' : 'feitos'}`}.`,
    next ? `O próximo é ${shortOf(next.habit)}, às ${formatTime(next.time!)}.` : null,
    'Toque num ponto para ir até o hábito.',
  ]
    .filter(Boolean)
    .join(' ');

  const labelOf = (t: StripTarget) => {
    const list = t.ids.map((id) => byId.get(id)!).filter(Boolean);
    if (list.length === 1) {
      const i = list[0]!;
      return `${i.habit.name}, ${formatTime(i.time!)}, ${STATE_WORD[stateOf(i)]}. Mostrar na lista`;
    }
    const from = hourLabel(minutesOf.get(t.ids[0]!)!);
    const to = hourLabel(minutesOf.get(t.ids[t.ids.length - 1]!)!);
    const n = list.filter((i) => stateOf(i) === 'done' || stateOf(i) === 'partial').length;
    return `${from === to ? `Às ${from}` : `Das ${from} às ${to}`}: ${listNames(
      list.map((i) => i.habit.name),
      list.length,
    )}; ${n === 0 ? 'nenhum feito' : `${n} de ${list.length} feitos`}. Mostrar na lista`;
  };

  return (
    <div
      className={clsx('td-strip td-pad', className)}
      role="group"
      aria-label="Faixa do dia"
      aria-describedby={descId}
      data-flip="strip"
    >
      <p id={descId} className="pk-sr">
        {description}
      </p>
      <div ref={ref} className="td-strip-box">
        <span className="td-strip-track" aria-hidden="true">
          {nowX !== null && <i className="td-strip-past" style={{ width: Math.max(0, nowX - 10) }} />}
        </span>
        {ticks.map((t) => (
          <i key={t.m} className="td-strip-tick" style={{ left: t.x }} aria-hidden="true" />
        ))}
        {nowX !== null && <i className="td-strip-now" style={{ left: nowX }} aria-hidden="true" />}
        {targets.map((t) => (
          <button
            key={t.ids.join('|')}
            type="button"
            className="pk-reset td-strip-hit"
            style={{ left: t.x0, width: t.x1 - t.x0 }}
            aria-label={labelOf(t)}
            onClick={() => onReveal(t.ids)}
          >
            {t.dots.map((d) => {
              const item = byId.get(d.id);
              if (!item) return null;
              const p = pillarAttrs(pillarColor(item));
              return (
                <span
                  key={d.id}
                  className={clsx('td-strip-dot', p.className)}
                  data-pillar={p['data-pillar']}
                  data-hue={p['data-hue']}
                  data-state={stateOf(item)}
                  style={{ left: d.x - t.x0 }}
                  aria-hidden="true"
                />
              );
            })}
          </button>
        ))}
        <span className="td-strip-lbls" aria-hidden="true">
          {ticks
            .filter((t) => nowX === null || Math.abs(t.x - nowX) > 26)
            .map((t) => (
              <span key={t.m} className="td-strip-lbl pk-num" style={{ left: t.x }}>
                {hourLabel(t.m)}
              </span>
            ))}
          {nowX !== null && now !== null && (
            <span className="td-strip-lbl now pk-num" style={{ left: nowX }}>
              {hourLabel(now)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
