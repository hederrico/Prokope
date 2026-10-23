// PauseStrip (a faixa dos dias da pausa) e DateSheet (o calendário em folha, ao alcance do polegar), de Pausar.
// A faixa: até 21 dias, uma célula hachurada por dia e a célula vazada da volta, com ▶; acima disso, uma barra com a
// data de começo e a de volta nas pontas. A folha: um mês em 7 colunas, células de 44 × 44, setas de mês, o arrasto de
// lado como atalho e hoje com anel; o toque no dia já escolhe e a folha fecha sozinha 200 ms depois.
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { animate, LayoutGroup, m } from 'motion/react';
import { Sheet } from '@/components/shell';
import { NumberFlow } from '@/components/ui';
import { addDays, diffDays, formatDayMonth, formatDayShort, monthDays, parseDay, weekdayOf } from '@/data';
import { Icon } from '@/icons';
import { spring } from '@/motion/tokens';
import { usePrefersReducedMotion } from '@/motion/reducedMotion';
import type { DayKey } from '@/types';
import { longWeekdayMonth, onWeekdayShort } from './habitText';
import './settings.css';

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function cellLabel(day: DayKey): string {
  const { date } = parseDay(day);
  return date === 1 ? formatDayShort(day) : String(date);
}

export function PauseStrip({
  start,
  end,
  today,
  inPause,
}: {
  start: DayKey;
  /** último dia pausado (a volta é end + 1) */
  end: DayKey;
  today: DayKey;
  /** a pausa já começou: os dias que passaram ficam mais claros e hoje ganha o anel */
  inPause?: boolean;
}) {
  const total = diffDays(end, start) + 1;
  const back = addDays(end, 1);
  const dayN = diffDays(today, start) + 1;
  const label = inPause
    ? `Dia ${dayN} de ${total} da pausa, volta no dia ${parseDay(back).date} de ${MONTHS[parseDay(back).month - 1]}`
    : `Pausa de ${formatDayMonth(start)} a ${formatDayMonth(end)}, volta no dia ${parseDay(back).date}`;

  return (
    <div className={clsx('st-range', inPause && 'first')}>
      <div className="st-range-top">
        <span className="cap num">
          {inPause ? (
            <>
              dia <NumberFlow value={dayN} /> de <NumberFlow value={total} />
            </>
          ) : (
            <>
              <NumberFlow value={total} /> {total === 1 ? 'dia' : 'dias'} de pausa
            </>
          )}
        </span>
        <span className="cap">volta {onWeekdayShort(back)}</span>
      </div>
      {total <= 21 ? (
        <LayoutGroup>
          <div
            className="st-cells"
            role="img"
            aria-label={label}
            style={{ gridTemplateColumns: `repeat(${total + 1}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: total }, (_, i) => {
              const d = addDays(start, i);
              const first = parseDay(d).date === 1;
              return (
                <m.span
                  key={d}
                  layout="position"
                  transition={spring.calma}
                  className={clsx(first && 'nm', inPause && d < today && 'ps', inPause && d === today && 'td')}
                >
                  <i />
                  <small>{total > 14 && !first && i % 2 === 1 ? '' : cellLabel(d)}</small>
                </m.span>
              );
            })}
            <m.span key="volta" layout="position" transition={spring.calma} className="bk">
              <i>
                <Icon name="play" weight="fill" />
              </i>
              <small>{cellLabel(back)}</small>
            </m.span>
          </div>
        </LayoutGroup>
      ) : (
        <div role="img" aria-label={label}>
          <div className="st-bar" />
          <div className="st-bar-ends" aria-hidden="true">
            <span>{formatDayShort(start)}</span>
            <span>volta {formatDayShort(back)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** O calendário em folha. `min` é o primeiro dia tocável; os dias da pausa aparecem hachurados. */
export function DateSheet({
  open,
  onOpenChange,
  title,
  value,
  min,
  today,
  range,
  role,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  value: DayKey;
  min: DayKey;
  today: DayKey;
  /** os dias pausados (começo e fim, incluídos) */
  range: { start: DayKey; end: DayKey };
  /** "começo da pausa" ou "volta" (para o leitor) */
  role: 'start' | 'back';
  onPick: (day: DayKey) => void;
}) {
  const initial = parseDay(value);
  const [month, setMonth] = useState({ y: initial.year, m: initial.month });
  const [picked, setPicked] = useState<DayKey | null>(null);
  const [seen, setSeen] = useState(open);
  const grid = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  if (open !== seen) {
    setSeen(open);
    if (open) {
      setMonth({ y: initial.year, m: initial.month });
      setPicked(null);
    }
  }

  const days = monthDays(month.y, month.m);
  const lead = weekdayOf(days[0]);
  const minMonth = parseDay(min);
  const canPrev = month.y > minMonth.year || (month.y === minMonth.year && month.m > minMonth.month);
  const shift = (delta: number) => {
    if (delta < 0 && !canPrev) return;
    setMonth(({ y, m: mo }) => {
      const t = mo - 1 + delta;
      return { y: y + Math.floor(t / 12), m: (((t % 12) + 12) % 12) + 1 };
    });
  };
  const selected = picked ?? value;

  const pick = (d: DayKey, el: HTMLElement) => {
    if (d < min) return;
    setPicked(d);
    if (!reduced) animate(el, { scale: [0.85, 1] }, spring.toque);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onPick(d);
      onOpenChange(false);
    }, 200);
  };

  const onKey = (e: React.KeyboardEvent, d: DayKey) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = addDays(d, step);
    const p = parseDay(next);
    if (p.month !== month.m || p.year !== month.y) setMonth({ y: p.year, m: p.month });
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <div className="st-cal-head">
        <button
          type="button"
          className="pk-reset st-cal-arrow"
          aria-label="Mês anterior"
          disabled={!canPrev}
          onClick={() => shift(-1)}
        >
          <Icon name="caret-left" weight="bold" />
        </button>
        <b aria-live="polite">{`${MONTHS[month.m - 1]} de ${month.y}`}</b>
        <button type="button" className="pk-reset st-cal-arrow" aria-label="Próximo mês" onClick={() => shift(1)}>
          <Icon name="caret-right" weight="bold" />
        </button>
      </div>
      <div
        ref={grid}
        className="st-cal"
        role="grid"
        aria-label={title}
        onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) shift(dx < 0 ? 1 : -1);
        }}
      >
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((w, i) => (
          <span key={i} className="st-cal-wd" aria-hidden="true">
            {w}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`v${i}`} aria-hidden="true" />
        ))}
        {days.map((d) => {
          const disabled = d < min;
          const inRange = d >= range.start && d <= range.end;
          const sel = d === selected;
          const desc = [
            longWeekdayMonth(d),
            sel ? (role === 'start' ? 'começo da pausa' : 'volta') : inRange ? 'dia da pausa' : null,
            d === today ? 'hoje' : null,
          ]
            .filter(Boolean)
            .join(', ');
          return (
            <button
              key={d}
              type="button"
              data-day={d}
              className={clsx(
                'pk-reset st-cal-day',
                inRange && !sel && 'in-pause',
                d === today && !sel && 'today',
                sel && 'sel',
              )}
              aria-label={desc}
              aria-pressed={sel}
              aria-disabled={disabled || undefined}
              tabIndex={sel ? 0 : -1}
              onClick={(e) => !disabled && pick(d, e.currentTarget)}
              onKeyDown={(e) => onKey(e, d)}
            >
              {parseDay(d).date}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
