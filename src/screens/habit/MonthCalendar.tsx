// MonthCalendar: o calendário do mês (habito-progresso.md). O mesmo no detalhe do hábito (variant="habit",
// dias grandes o bastante para tocar e corrigir) e no Progresso › Humor (variant="mood", a cor e o rostinho).
// A grade é uma lista de 7 colunas, lida por semana. Dia passado ou de hoje é botão; dia futuro não é tocável.
// As células aparecem juntas (nada de cascata célula a célula); trocar de mês anda 12 px na direção do tempo.
import clsx from 'clsx';
import { memo, useLayoutEffect, useRef, useState } from 'react';
import { m } from 'motion/react';
import { Face, type FaceLevel } from '@/components/ui';
import { Icon } from '@/icons';
import { distance, tween } from '@/motion';
import type { DayKey } from '@/types';
import './calendar.css';

const WEEKDAY_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export interface CalCell {
  day: DayKey;
  /** o número do dia */
  date: number;
  /** estado: 'd' feito, 'p' parcial, 'n' sem registro, 'x' pausado, 'u' fora da agenda, 'f' por vir,
   *  'i' antes do começo, 'e' fora do mês (escondido) */
  state: 'd' | 'p' | 'n' | 'x' | 'u' | 'f' | 'i' | 'e';
  /** feito sobre um dia pausado (a célula hachurada com ✓) */
  doneOver?: boolean;
  isToday?: boolean;
  /** humor de 1 a 5 (variant mood) */
  mood?: number | null;
  /** "21 de outubro, sem caminhada" */
  label: string;
  tappable: boolean;
  /** o mês em letras pequenas no dia 1, quando a grade atravessa dois meses */
  monthTag?: string;
}

export interface MonthCalendarProps {
  variant: 'habit' | 'mood';
  weeks: CalCell[][];
  /** o dia tocado (anel sel enquanto a folha está aberta) */
  selected?: DayKey | null;
  onSelect?: (day: DayKey) => void;
  /** troca a grade (mês novo): a chave e a direção do tempo (-1 passado, 1 futuro) */
  gridKey?: string;
  direction?: number;
  /** nome da lista para o leitor de tela */
  label: string;
}

function cellClass(c: CalCell, variant: MonthCalendarProps['variant'], selected: boolean) {
  const moodLevel = variant === 'mood' && c.mood ? `l${Math.max(1, Math.min(5, Math.round(c.mood)))}` : null;
  return clsx('pk-reset mc-c', moodLevel ?? c.state, c.doneOver && 'd', c.isToday && 't', selected && 'sel');
}

const Cell = memo(function Cell({
  c,
  variant,
  selected,
  onSelect,
}: {
  c: CalCell;
  variant: MonthCalendarProps['variant'];
  selected: boolean;
  onSelect?: (day: DayKey) => void;
}) {
  const checkRef = useRef<HTMLElement>(null);
  const prev = useRef(c.state);
  const done = c.state === 'd' || !!c.doneOver;
  // o ✓ se desenha quando o dia vira feito (corrigir um dia, desfazer)
  useLayoutEffect(() => {
    const was = prev.current;
    prev.current = c.state;
    const el = checkRef.current;
    if (!el || was === c.state || !done) return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }, [c.state, done]);

  if (c.state === 'e') return <span className="mc-c e" aria-hidden="true" />;
  const content = (
    <>
      {c.monthTag && <small aria-hidden="true">{c.monthTag}</small>}
      <span aria-hidden="true">{c.date}</span>
      {variant === 'habit' ? (
        <i ref={checkRef} aria-hidden="true">
          {done && <Icon name="check" weight="bold" />}
        </i>
      ) : c.mood ? (
        <Face kind="mood" level={Math.max(1, Math.min(5, Math.round(c.mood))) as FaceLevel} selected />
      ) : (
        <i className="mc-fs" aria-hidden="true" />
      )}
    </>
  );
  const cls = cellClass(c, variant, selected);
  const label = c.label;
  if (!c.tappable || !onSelect) {
    return (
      <span className={cls} role="img" aria-label={label}>
        {content}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={clsx(cls, 'hit')}
      aria-label={label}
      aria-current={c.isToday ? 'date' : undefined}
      onClick={() => onSelect(c.day)}
    >
      {content}
    </button>
  );
});

export function MonthCalendar({ variant, weeks, selected, onSelect, gridKey, direction = 0, label }: MonthCalendarProps) {
  const [firstKey] = useState(gridKey);
  const animateGrid = gridKey !== undefined && gridKey !== firstKey;
  return (
    <div className={variant === 'habit' ? 'mc-hab' : 'mc-mood'}>
      <div className="mc-head" aria-hidden="true">
        {WEEKDAY_LETTERS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <m.ol
        key={gridKey}
        className="mc-grid"
        aria-label={label}
        initial={animateGrid ? { opacity: 0, x: direction * distance.day } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={tween.base}
      >
        {weeks.flat().map((c) => (
          <li key={c.day} aria-hidden={c.state === 'e' || undefined}>
            <Cell c={c} variant={variant} selected={selected === c.day} onSelect={onSelect} />
          </li>
        ))}
      </m.ol>
    </div>
  );
}

/** As setas do mês (ou do período) no canto do cartão. */
export function MonthArrows({
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  prevLabel = 'Mês anterior',
  nextLabel = 'Próximo mês',
}: {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  prevLabel?: string;
  nextLabel?: string;
}) {
  return (
    <span className="mc-arrows">
      <button
        type="button"
        className="pk-reset mc-ar"
        aria-label={prevLabel}
        aria-disabled={prevDisabled || undefined}
        onClick={() => !prevDisabled && onPrev()}
      >
        <Icon name="caret-left" weight="bold" />
      </button>
      <button
        type="button"
        className="pk-reset mc-ar"
        aria-label={nextLabel}
        aria-disabled={nextDisabled || undefined}
        onClick={() => !nextDisabled && onNext()}
      >
        <Icon name="caret-right" weight="bold" />
      </button>
    </span>
  );
}
