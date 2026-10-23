// WeekCard: o cartão do topo do Hoje, com a semana e o resumo do dia. Quadro: weekCard(feitos, pct, vals).
// "3 de 12 feitos hoje" é texto (não é anunciado a cada mudança; o toast já diz). "76% na semana ›" abre o Progresso.
// Os números rolam em fill, +120 ms depois do toque (o reflexo distante da coreografia).
import type { ReactNode } from 'react';
import { Icon } from '@/icons';
import { choreography } from '@/motion/tokens';
import { NumberFlow } from './NumberFlow';
import { WeekStrip, type WeekStripProps } from './WeekStrip';
import './ui.css';

export type WeekCardProps = {
  doneToday: number;
  totalToday: number;
  /** constância da semana, de 0 a 100 */
  weekPct: number;
  days: WeekStripProps['days'];
  today: string;
  selected?: string;
  onSelect?: (date: string) => void;
  onOpenProgress: () => void;
  /** linha pequena no fim (ajuste da semana) */
  footer?: ReactNode;
  className?: string;
};

export function WeekCard({
  doneToday,
  totalToday,
  weekPct,
  days,
  today,
  selected,
  onSelect,
  onOpenProgress,
  footer,
  className,
}: WeekCardProps) {
  const delay = choreography.distant * 1000;
  const head = (
    <>
      <span className="sum">
        <b className="pk-num">
          <NumberFlow value={doneToday} delay={delay} /> de <NumberFlow value={totalToday} delay={delay} />
        </b>{' '}
        <span className="muted">feitos hoje</span>
      </span>
      <button
        type="button"
        className="pk-reset pk-wkgo hit"
        aria-label={`${Math.round(weekPct)}% na semana. Abre o Progresso`}
        onClick={onOpenProgress}
      >
        <span className="pk-num" aria-hidden="true">
          <NumberFlow value={Math.round(weekPct)} delay={delay} suffix="%" />
        </span>
        <span aria-hidden="true">na semana</span>
        <Icon name="caret-right" weight="bold" />
      </button>
    </>
  );
  return (
    <WeekStrip
      days={days}
      today={today}
      selected={selected}
      onSelect={onSelect}
      head={head}
      foot={footer}
      className={className}
    />
  );
}
