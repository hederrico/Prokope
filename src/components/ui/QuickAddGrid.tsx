// QuickAddGrid: a grade de 4 colunas dos botões rápidos (3 alimentos que seguem a hora e o "Mais"). Quadro: .qa.
import clsx from 'clsx';
import { pillarAttrs, type PillarColor } from './pillar';
import { QuickAddMore, QuickAddTile } from './QuickAddTile';
import './ui.css';

export type QuickAddGridProps = {
  items: { id: string; name: string; grams: number }[];
  onAdd: (id: string) => void;
  /** sem onMore, o "Mais" não aparece */
  onMore?: () => void;
  pillar?: PillarColor;
  className?: string;
};

export function QuickAddGrid({ items, onAdd, onMore, pillar, className }: QuickAddGridProps) {
  const p = pillarAttrs(pillar);
  return (
    <div className={clsx('pk-qa', p.className, className)} data-pillar={p['data-pillar']} data-hue={p['data-hue']}>
      {items.map((it) => (
        <QuickAddTile key={it.id} name={it.name} grams={it.grams} onAdd={() => onAdd(it.id)} />
      ))}
      {onMore && <QuickAddMore onClick={onMore} />}
    </div>
  );
}
