// DayRings: um anel por dia (água em L). Quadro: waterRow do Progresso › Alimentação.
// Desenha ao aparecer como o anel grande (ring), 30 ms entre os dias; o ✓ entra em micro depois que o anel fecha.
// Dias futuros ficam no trilho e não são tocáveis. Tocar num dia abre "Progresso · um dia".
import clsx from 'clsx';
import { Ring } from '@/components/ui';
import { Icon } from '@/icons';
import { formatNumber, parseDay, weekdayShort } from '@/data';
import type { DayKey } from '@/types';
import { useDrawGate, useDrawnValue } from './draw';
import type { BarDay } from './DailyBarsChart';

export interface DayRingsProps {
  chartKey: string;
  days: BarDay[];
  goal: number;
  /** ml → mostra em L com uma casa ("3,0") */
  unit?: string;
  onSelect?: (day: DayKey) => void;
}

function shortValue(v: number, unit?: string) {
  if (unit === 'ml') return (v / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return formatNumber(v);
}


export function DayRings({ chartKey, days, goal, unit, onSelect }: DayRingsProps) {
  const { observe, started, first } = useDrawGate<HTMLDivElement>(chartKey, { durationMs: 600 + days.length * 30 });
  const targets = days.map((d) => (d.future || goal <= 0 ? 0 : Math.min(1, d.total / goal)));
  const shown = useDrawnValue(chartKey, targets, targets.map(() => 0), started);
  const values = shown.length === targets.length ? shown : targets;
  const many = days.length > 7;

  return (
    <div ref={observe} className={clsx('pg-rings', many && 'many')}>
      {days.map((d, i) => {
        const reached = !d.future && d.total >= goal && goal > 0;
        const inner = reached ? (
          <Icon
            name="check"
            weight="bold"
            className="pg-rcheck"
            style={{ transitionDelay: first ? `${600 + i * 30}ms` : '0ms', opacity: values[i] >= 1 ? 1 : 0 }}
          />
        ) : d.isToday ? (
          <Icon name="drop" weight="duotone" />
        ) : null;
        const content = (
          <>
            <Ring
              size={36}
              stroke={4.5}
              value={values[i] ?? 0}
              color="var(--mark)"
              track="var(--track)"
              delay={first ? i * 30 : 0}
              timing={first ? 'ring' : 'fill'}
            >
              {inner}
            </Ring>
            <span className={clsx('pg-wd', d.isToday && 'on')}>
              {d.isToday ? 'hoje' : many ? parseDay(d.day).date : weekdayShort(d.day)}
            </span>
            {!many && <span className="pg-wv">{!d.future && d.total > 0 ? shortValue(d.total, unit) : ''}</span>}
          </>
        );
        if (d.future || !onSelect) {
          return (
            <div key={d.day} className="pg-rday" aria-hidden={d.future || undefined}>
              {content}
            </div>
          );
        }
        return (
          <button
            key={d.day}
            type="button"
            className="pk-reset pg-rday pk-press"
            aria-label={`${d.isToday ? 'hoje' : weekdayShort(d.day)} ${shortValue(d.total, unit)} ${unit === 'ml' ? 'litros' : (unit ?? '')}${reached ? ', meta batida' : ''}`}
            onClick={() => onSelect(d.day)}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
