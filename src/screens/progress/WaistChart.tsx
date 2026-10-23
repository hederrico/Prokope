// A linha da cintura (quadro: waistChart() do Progresso › Medidas): uma medida por semana, com o valor em cima
// de cada ponto e a data embaixo. Desenha em ring (pathLength), 120 ms depois do peso, pela fila dos gráficos.
// Tocar num ponto mostra o rótulo do dia, sem fio.
import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useReduced } from '@/components/ui';
import { dur } from '@/motion';
import { formatDayCompact, formatDayMonth, formatDayShort } from '@/data';
import type { DayKey } from '@/types';
import { useDrawGate } from './draw';
import { useMergedRef, useWidth } from './useWidth';
import { fmt1 } from './format';

export interface WaistChartProps {
  chartKey: string;
  points: { day: DayKey; value: number }[];
  unit: string;
  label: string;
  hidden?: boolean;
}

export function WaistChart({ chartKey, points, unit, label, hidden }: WaistChartProps) {
  const reduced = useReduced();
  const { observe, started, first } = useDrawGate<HTMLDivElement>(chartKey, { durationMs: 600 });
  const [wref, W] = useWidth<HTMLDivElement>();
  const chartRef = useMergedRef<HTMLDivElement>(observe, wref);
  const [sel, setSel] = useState<number | null>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotsRef = useRef<SVGGElement>(null);
  const H = 96;
  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals) - 0.5;
  const hi = Math.max(...vals) + 0.5;
  const x = scaleLinear()
    .domain([0, Math.max(1, points.length - 1)])
    .range(points.length > 1 ? [36, W - 36] : [W / 2, W / 2]);
  const y = scaleLinear().domain([lo, hi]).range([66, 26]);
  const d = line<{ value: number }>()
    .x((_, i) => x(i))
    .y((p) => y(p.value))(points);

  useLayoutEffect(() => {
    if (!started || !first || reduced) return;
    pathRef.current?.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: dur.ring * 1000,
      easing: 'cubic-bezier(.2, .8, .2, 1)',
      fill: 'backwards',
    });
    dotsRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur.base * 1000 });
  }, [started, first, reduced]);

  const hide = !started;
  const selected = sel !== null ? points[sel] : null;
  return (
    <div
      ref={chartRef}
      className="pg-chart pg-waist"
    >
      {selected && (
        <span className="pg-tip static" style={{ left: Math.max(70, Math.min(W - 70, x(sel!))) }} role="status">
          {formatDayCompact(selected.day)} · {hidden ? '•••' : fmt1(selected.value)} {unit}
        </span>
      )}
      <svg className="pg-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <path
          ref={pathRef}
          className="pg-ln2"
          d={d ?? ''}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={hide ? 1 : 0}
        />
        <g ref={dotsRef} style={hide ? { opacity: 0 } : undefined}>
          {points.map((p, i) => {
            const last = i === points.length - 1;
            return (
              <g key={p.day}>
                <circle className={clsx('pg-dt', last && 'on')} cx={x(i)} cy={y(p.value)} r={last ? 5 : 4.5} />
                <text className={clsx('pg-val', !last && 'soft')} x={x(i)} y={y(p.value) - 11} textAnchor="middle">
                  {hidden ? '•••' : fmt1(p.value)}
                </text>
                <text className={clsx('pg-ax', last && 'on')} x={x(i)} y={92} textAnchor="middle">
                  {formatDayShort(p.day)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="pg-hits pg-hits-pts">
        {points.map((p, i) => (
          <button
            key={p.day}
            type="button"
            className="pk-reset pg-hit"
            style={{ left: x(i) - 22 }}
            aria-label={`${formatDayMonth(p.day)}: ${hidden ? 'valor oculto' : `${fmt1(p.value)} ${unit}`}`}
            onClick={() => setSel((s) => (s === i ? null : i))}
          />
        ))}
      </div>
    </div>
  );
}
