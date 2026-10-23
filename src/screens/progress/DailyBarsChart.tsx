// DailyBarsChart: barras por dia com a linha da meta (proteína em g). Quadro: proteinChart() do Progresso › Alimentação.
// Desenha ao aparecer: cada barra sobe da base (fill), da esquerda para a direita, 30 ms entre elas.
// A barra de hoje fica listrada até a virada do dia lógico. Tocar numa barra abre "Progresso · um dia".
import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { chanSet, chanStop, chanTo, makeChan, type Chan } from '@/components/ui/channel';
import { useReduced } from '@/components/ui';
import { dur, ease } from '@/motion';
import { formatNumber, weekdayShort, parseDay } from '@/data';
import type { DayKey } from '@/types';
import { useDrawGate, useDrawnValue } from './draw';
import { useMergedRef, useWidth } from './useWidth';

export interface BarDay {
  day: DayKey;
  total: number;
  isToday: boolean;
  future: boolean;
}

export interface DailyBarsChartProps {
  /** chave do desenho (uma por gráfico, igual entre períodos para andar do valor velho ao novo) */
  chartKey: string;
  days: BarDay[];
  goal?: number;
  /** "g" */
  unit?: string;
  /** "Proteína por dia: segunda 84 g..." */
  label: string;
  onSelect?: (day: DayKey) => void;
}

/** Coluna com topo arredondado e base reta. */
function colPath(x: number, top: number, base: number, w: number, r: number): string {
  const rr = Math.max(0, Math.min(r, (base - top) / 2, w / 2));
  if (base - top < 0.5) return `M${x} ${base}H${x + w}Z`;
  return (
    `M${x} ${base}V${(top + rr).toFixed(1)}Q${x} ${top.toFixed(1)} ${x + rr} ${top.toFixed(1)}` +
    `H${x + w - rr}Q${x + w} ${top.toFixed(1)} ${x + w} ${(top + rr).toFixed(1)}V${base}Z`
  );
}

function Bar({
  x,
  w,
  base,
  top,
  r,
  delay,
  className,
  fill,
}: {
  x: number;
  w: number;
  base: number;
  top: number;
  r: number;
  delay: number;
  className: string;
  fill?: string;
}) {
  const ref = useRef<SVGPathElement>(null);
  const chan = useRef<Chan | null>(null);
  const reduced = useReduced();
  const geo = useRef({ x, w, base, r });
  useLayoutEffect(() => {
    geo.current = { x, w, base, r };
    if (chan.current) chan.current.apply(chan.current.v);
  });
  useLayoutEffect(() => {
    const el = ref.current!;
    chan.current = makeChan(top, (v) => {
      const g = geo.current;
      el.setAttribute('d', colPath(g.x, v, g.base, g.w, g.r));
    });
    return () => chanStop(chan.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const c = chan.current;
    if (!c || Math.abs(c.v - top) < 0.05) return;
    if (reduced) chanSet(c, top);
    else void chanTo(c, top, { duration: dur.fill, ease: ease.out, delay: delay / 1000 });
  }, [top, reduced, delay]);
  return <path ref={ref} className={className} style={fill ? { fill } : undefined} />;
}

export function DailyBarsChart({ chartKey, days, goal, unit = '', label, onSelect }: DailyBarsChartProps) {
  const { observe, started, first } = useDrawGate<HTMLDivElement>(chartKey, { durationMs: 400 + days.length * 30 });
  const [wref, width] = useWidth<HTMLDivElement>();
  const chartRef = useMergedRef<HTMLDivElement>(observe, wref);
  const hatch = useId().replace(/:/g, '');
  const totals = days.map((d) => (d.future ? 0 : d.total));
  const shown = useDrawnValue(chartKey, totals, totals.map(() => 0), started);
  const shownSafe = shown.length === totals.length ? shown : totals;

  const many = days.length > 7;
  const W = width;
  const labelRoom = goal ? 34 : 0;
  const PW = W - labelRoom;
  const slot = PW / Math.max(1, days.length);
  const bw = Math.min(24, slot * (many ? 0.62 : 0.7));
  const top = 10;
  const base = 122;
  const max = Math.max(goal ? goal * 1.375 : 0, ...totals.map((t) => t * 1.1), 1);
  const y = (v: number) => base - (Math.min(v, max) / max) * (base - top);
  const height = many ? 148 : 166;
  const firstDraw = first;

  return (
    <div
      ref={chartRef}
      className="pg-chart"
    >
      <svg className="pg-svg" width={W} height={height} viewBox={`0 0 ${W} ${height}`} role="img" aria-label={label}>
        <defs>
          <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect className="pg-hb" width="5" height="5" />
            <rect className="pg-hl" width="2.2" height="5" />
          </pattern>
        </defs>
        {days.map((d, i) => {
          const bx = +(slot * (i + 0.5) - bw / 2).toFixed(1);
          return <path key={`t${d.day}`} className="pg-trk" d={colPath(bx, top, base, bw, Math.min(7, bw / 2))} />;
        })}
        {days.map((d, i) => {
          if (d.future) return null;
          const bx = +(slot * (i + 0.5) - bw / 2).toFixed(1);
          return (
            <Bar
              key={`b${d.day}`}
              x={bx}
              w={bw}
              base={base}
              top={y(shownSafe[i] ?? 0)}
              r={Math.min(7, bw / 2)}
              delay={firstDraw ? i * 30 : 0}
              className={d.isToday ? 'pg-bar today' : 'pg-bar'}
              fill={d.isToday ? `url(#${hatch})` : undefined}
            />
          );
        })}
        <line className="pg-base" x1={0} x2={PW} y1={base} y2={base} />
        {goal !== undefined && (
          <>
            <line className="pg-meta" x1={0} x2={PW + 4} y1={y(goal)} y2={y(goal)} />
            <text className="pg-mt" x={W} y={y(goal) + 4} textAnchor="end">
              {formatNumber(goal)} {unit}
            </text>
          </>
        )}
        {days.map((d, i) => {
          const cx = slot * (i + 0.5);
          const showLabel = !many || i === 0 || parseDay(d.day).date % 7 === 1 || d.isToday;
          return (
            <g key={`l${d.day}`}>
              {showLabel && (
                <text className={d.isToday ? 'pg-ax on' : 'pg-ax'} x={cx} y={base + 18} textAnchor="middle">
                  {d.isToday ? 'hoje' : many ? parseDay(d.day).date : weekdayShort(d.day)}
                </text>
              )}
              {!many && !d.future && d.total > 0 && (
                <text className="pg-val" x={cx} y={base + 37} textAnchor="middle">
                  {formatNumber(d.total)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {onSelect && (
        <div className="pg-hits" style={{ width: PW }}>
          {days.map((d) =>
            d.future ? (
              <span key={d.day} />
            ) : (
              <button
                key={d.day}
                type="button"
                className="pk-reset pg-hit"
                aria-label={`${weekdayShort(d.day)}, ${parseDay(d.day).date}: ${formatNumber(d.total)} ${unit}${d.isToday ? ', hoje, até agora' : ''}`}
                onClick={() => onSelect(d.day)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
