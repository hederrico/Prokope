// Heatmap: a grade do hábito, uma semana por coluna (de cima para baixo, segunda a domingo). Quadro: heat().
// Todo estado tem forma: feito cheio, parcial meio quadrado (de baixo para cima), não feito o trilho, pausado
// hachurado, fora da agenda pontilhado, futuro vazado e hoje com anel em volta. Só a célula de hoje anima (micro).
// role="img" com a frase do período; com onSelect, tocar num dia abre aquele dia (a lista é a alternativa do leitor).
import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type HeatState = 'done' | 'partial' | 'none' | 'paused' | 'off' | 'future';
export type HeatmapProps = {
  /** dias em ordem, a partir de uma segunda */
  days: { date: string; state: HeatState }[];
  today?: string;
  /** "Desde 21 de setembro: 24 dias feitos, 1 parcial, 8 sem caminhada" */
  label: string;
  onSelect?: (date: string) => void;
  pillar?: PillarColor;
  /** lado da célula em px (padrão 22) */
  cell?: number;
  className?: string;
};

export const HEAT_CLASS: Record<HeatState, string> = {
  done: 'd',
  partial: 'p',
  none: '',
  paused: 'x',
  off: 'u',
  future: 'f',
};

export function Heatmap({ days, today, label, onSelect, pillar, cell, className }: HeatmapProps) {
  const p = pillarAttrs(pillar);
  const onClick = onSelect
    ? (e: MouseEvent<HTMLDivElement>) => {
        const date = (e.target as HTMLElement).closest<HTMLElement>('[data-date]')?.dataset.date;
        const d = days.find((x) => x.date === date);
        if (d && d.state !== 'future') onSelect(d.date);
      }
    : undefined;
  return (
    <div
      role="img"
      aria-label={label}
      className={clsx('pk-hm', onSelect && 'sel', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      style={cell ? { gridTemplateRows: `repeat(7, ${cell}px)`, gridAutoColumns: `${cell}px` } : undefined}
      onClick={onClick}
    >
      {days.map((d) => (
        <i key={d.date} data-date={d.date} className={clsx(HEAT_CLASS[d.state], d.date === today && 't')} />
      ))}
    </div>
  );
}
