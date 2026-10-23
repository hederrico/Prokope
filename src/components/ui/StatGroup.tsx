// StatGroup: os números lado a lado, com divisória, num cartão. Quadro: <div class="card stats">.
import clsx from 'clsx';
import { pillarAttrs, type PillarColor } from './pillar';
import { Stat, type StatProps } from './Stat';
import './ui.css';

export type StatGroupProps = { items: StatProps[]; pillar?: PillarColor; bare?: boolean; className?: string };

export function StatGroup({ items, pillar, bare, className }: StatGroupProps) {
  const p = pillarAttrs(pillar);
  return (
    <div
      className={clsx(!bare && 'pk-card', 'pk-stats', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
    >
      {items.map((it) => (
        <Stat key={it.label} {...it} />
      ))}
    </div>
  );
}
