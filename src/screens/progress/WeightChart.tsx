// WeightChart: o peso de cada dia (pontos) e a média de 7 dias (linha), com d3-shape e d3-scale.
// Quadro: weightChart() do Progresso › Medidas. O eixo tem 0,4 kg de folga acima e abaixo dos extremos.
// Desenha ao aparecer: a linha em pathLength 0 → 1 (ring), os pontos juntos em opacidade (base), o ponto final e
// o rótulo em micro no fim. Arrastar ou tocar mostra o fio no dia mais perto e o rótulo, que abre o dia.
// Com "Mostrar só a tendência", só a linha da média; com o olho fechado, os números viram •••.
import clsx from 'clsx';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { animate } from 'motion/react';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useReduced } from '@/components/ui';
import { dur, spring } from '@/motion';
import { addDays, diffDays, formatDayCompact, formatDayMonth, formatDayShort } from '@/data';
import type { DayKey } from '@/types';
import { useDrawGate } from './draw';
import { fmt1 } from './format';
import { useMergedRef, useWidth } from './useWidth';

export interface WeightPointView {
  day: DayKey;
  value: number;
  avg: number;
}

export interface WeightChartProps {
  chartKey: string;
  points: WeightPointView[];
  /** janela do gráfico */
  from: DayKey;
  to: DayKey;
  today: DayKey;
  unit: string;
  trendOnly?: boolean;
  /** o olho fechado: os números viram ••• */
  hidden?: boolean;
  /** a frase da tendência (nome do gráfico) */
  sentence: string;
  onOpenDay?: (day: DayKey) => void;
}

const DOTS = '•••';
const EASE = 'cubic-bezier(.2, .8, .2, 1)';


export function WeightChart({
  chartKey,
  points,
  from,
  to,
  today,
  unit,
  trendOnly,
  hidden,
  sentence,
  onOpenDay,
}: WeightChartProps) {
  const reduced = useReduced();
  const { observe, started, first } = useDrawGate<HTMLDivElement>(chartKey, { durationMs: 750 });
  const [wref, W] = useWidth<HTMLDivElement>();
  const [sel, setSel] = useState<number | null>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const dotsRef = useRef<SVGGElement>(null);
  const endRef = useRef<SVGGElement>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const setBox = useCallback((el: HTMLDivElement | null) => {
    boxRef.current = el;
  }, []);
  const chartRef = useMergedRef<HTMLDivElement>(observe, wref, setBox);

  const H = 152;
  const x0 = 26;
  const x1 = W - 42;
  const yTop = 14;
  const yBot = 126;
  const span = Math.max(1, diffDays(to, from));

  const geo = useMemo(() => {
    const vals = points.flatMap((p) => (trendOnly ? [p.avg] : [p.value, p.avg]));
    const lo = (vals.length ? Math.min(...vals) : 80) - 0.4;
    const hi = (vals.length ? Math.max(...vals) : 81) + 0.4;
    const x = scaleLinear().domain([0, span]).range([x0, x1]);
    const y = scaleLinear().domain([lo, hi]).range([yBot, yTop]);
    let ticks: number[] = [];
    for (let t = Math.ceil(lo); t <= Math.floor(hi); t++) ticks.push(t);
    if (ticks.length > 5) ticks = ticks.filter((_, i) => i % 2 === 0);
    if (!ticks.length) ticks = [Math.round(((lo + hi) / 2) * 10) / 10];
    const px = (p: WeightPointView) => x(diffDays(p.day, from));
    const path = line<WeightPointView>()
      .x(px)
      .y((p) => y(p.avg))(points);
    const xTicks: { i: number; day: DayKey }[] = [];
    for (let i = 0; i <= span; i += 7) xTicks.push({ i, day: addDays(from, i) });
    if (span - xTicks[xTicks.length - 1].i >= 4) xTicks.push({ i: span, day: to });
    else xTicks[xTicks.length - 1] = { i: span, day: to };
    return { x, y, ticks, px, path: path ?? '', xTicks };
  }, [points, trendOnly, span, from, to, x0, x1]);

  // desenho: na primeira vez, a linha em ring, os pontos em base e o fim em micro; depois, a linha redesenha em fill
  const sig = points.map((p) => `${p.day}:${p.value}`).join('|');
  const lastSig = useRef<string | null>(null);
  const lastCount = useRef(points.length);
  useLayoutEffect(() => {
    if (!started) return;
    const path = lineRef.current;
    const first = lastSig.current === null;
    const changed = !first && lastSig.current !== sig;
    const grew = points.length > lastCount.current;
    lastSig.current = sig;
    lastCount.current = points.length;
    if (reduced || !path) return;
    if (first && first) {
      path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: dur.ring * 1000,
        easing: EASE,
        fill: 'backwards',
      });
      dotsRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur.base * 1000, easing: EASE });
      endRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: dur.micro * 1000,
        delay: dur.ring * 1000,
        easing: EASE,
        fill: 'backwards',
      });
    } else if (changed) {
      path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: dur.fill * 1000, easing: EASE });
      if (grew) {
        const dots = dotsRef.current?.querySelectorAll('circle');
        const last = dots?.[dots.length - 1];
        if (last) void animate(last, { scale: [0, 1] }, spring.toque);
      }
    }
  }, [started, first, sig, reduced, points.length]);

  // tocar fora do gráfico apaga o fio e o rótulo
  useEffect(() => {
    if (sel === null) return;
    const onDown = (e: Event) => {
      if (boxRef.current && e.target instanceof Node && boxRef.current.contains(e.target)) return;
      setSel(null);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [sel]);

  const nearest = (clientX: number) => {
    const el = boxRef.current;
    if (!el || !points.length) return null;
    const rect = el.getBoundingClientRect();
    const px = clientX - rect.left;
    let best = 0;
    let bestD = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(geo.px(p) - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  const drag = useRef<{ x: number; y: number; id: number; dragging: boolean } | null>(null);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('.pg-tip')) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, dragging: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.dragging) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        d.dragging = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } else if (Math.abs(dy) > 8) {
        drag.current = null;
        return;
      } else return;
    }
    const i = nearest(e.clientX);
    if (i !== null) setSel(i);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.dragging) return;
    if (Math.abs(e.clientX - d.x) < 8 && Math.abs(e.clientY - d.y) < 8) {
      const i = nearest(e.clientX);
      if (i !== null) setSel(i);
    }
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!points.length) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const step = e.key === 'ArrowLeft' ? -1 : 1;
      setSel((s) => (s === null ? points.length - 1 : Math.max(0, Math.min(points.length - 1, s + step))));
    } else if (e.key === 'Escape') setSel(null);
    else if (e.key === 'Enter' && sel !== null) onOpenDay?.(points[sel].day);
  };

  const last = points[points.length - 1];
  const hide = !started;
  const selected = sel !== null ? points[sel] : null;
  const tipX = selected ? Math.max(70, Math.min(W - 70, geo.px(selected))) : 0;
  const num = (v: number) => (hidden ? DOTS : fmt1(v));

  return (
    <div
      ref={chartRef}
      className="pg-chart pg-weight"
      tabIndex={0}
      aria-label={`${sentence} Use as setas para ver cada dia.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={onKeyDown}
    >
      {selected && (
        <button
          type="button"
          className="pk-reset pg-tip"
          style={{ left: tipX }}
          onClick={() => onOpenDay?.(selected.day)}
          aria-label={`${formatDayMonth(selected.day)}: ${hidden ? 'valor oculto' : `${fmt1(selected.value)} ${unit}, média ${fmt1(selected.avg)}`}. Abrir o dia`}
        >
          {formatDayCompact(selected.day)} · {num(selected.value)} {unit} · média {num(selected.avg)}
        </button>
      )}
      <svg className="pg-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={sentence}>
        {geo.ticks.map((t) => (
          <g key={t}>
            <line className="pg-grid" x1={22} x2={W - 34} y1={geo.y(t)} y2={geo.y(t)} />
            {!trendOnly && (
              <text className="pg-ax" x={0} y={geo.y(t) + 4}>
                {hidden ? DOTS : t.toLocaleString('pt-BR')}
              </text>
            )}
          </g>
        ))}
        {selected && (
          <line className="pg-fio" x1={geo.px(selected)} x2={geo.px(selected)} y1={yTop - 6} y2={yBot + 4} />
        )}
        {!trendOnly && (
          <g ref={dotsRef} style={hide ? { opacity: 0 } : undefined}>
            {points.map((p) => (
              <circle key={p.day} className="pg-pts" cx={geo.px(p)} cy={geo.y(p.value)} r={3.2} />
            ))}
          </g>
        )}
        <path
          ref={lineRef}
          className="pg-ma"
          d={geo.path}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={hide ? 1 : 0}
        />
        {last && (
          <g ref={endRef} style={hide ? { opacity: 0 } : undefined}>
            <circle className="pg-end" cx={geo.px(last)} cy={geo.y(last.avg)} r={5} />
            {!trendOnly && (
              <text className="pg-val" x={geo.px(last) + 9} y={geo.y(last.avg) + 4.5}>
                {num(last.avg)}
              </text>
            )}
          </g>
        )}
        {selected && (
          <circle
            className="pg-end"
            cx={geo.px(selected)}
            cy={geo.y(trendOnly ? selected.avg : selected.value)}
            r={5}
          />
        )}
        {geo.xTicks.map((t) => (
          <text
            key={t.i}
            className={clsx('pg-ax', t.day === today && 'on')}
            x={geo.x(t.i)}
            y={148}
            textAnchor="middle"
          >
            {t.day === today ? 'hoje' : formatDayShort(t.day)}
          </text>
        ))}
      </svg>
      <ul className="pk-sr">
        {points.map((p) => (
          <li key={p.day}>
            {formatDayMonth(p.day)}: {hidden ? 'valor oculto' : `${fmt1(p.value)} ${unit}, média ${fmt1(p.avg)}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

