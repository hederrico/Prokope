// HeatmapKey: a legenda do heatmap. Quadro: heatKey([['d', 'Feito'], ['p', 'Parcial'], ['', 'Sem registro'], ['d t', 'Hoje']]).
// Decorativa (a frase do heatmap já diz os números).
import clsx from 'clsx';
import { HEAT_CLASS, type HeatState } from './Heatmap';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type HeatmapKeyProps = {
  items: { state: HeatState | 'today'; label: string }[];
  pillar?: PillarColor;
  className?: string;
};

export function HeatmapKey({ items, pillar, className }: HeatmapKeyProps) {
  const p = pillarAttrs(pillar);
  return (
    <div
      className={clsx('pk-hmk', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      aria-hidden="true"
    >
      {items.map((it) => (
        <span key={it.label}>
          <i className={it.state === 'today' ? 'd t' : HEAT_CLASS[it.state]} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
