// QuickAddButton: "+ 500 ml", soma na hora com Desfazer. Quadro: addPill().
// Toques seguidos valem: o intervalo mínimo é de 120 ms (só descarta o toque duplo acidental).
import clsx from 'clsx';
import { Icon } from '@/icons';
import { spellUnits, useTapGuard } from './lib';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type QuickAddButtonProps = {
  /** "500 ml", "1 L" */
  amount: string;
  onClick: () => void;
  /** nome lido; o padrão escreve a unidade por extenso: "Somar 500 mililitros" */
  label?: string;
  pillar?: PillarColor;
  className?: string;
};

export function QuickAddButton({ amount, onClick, label, pillar, className }: QuickAddButtonProps) {
  const guarded = useTapGuard(onClick, 120);
  const p = pillarAttrs(pillar);
  return (
    <button
      type="button"
      className={clsx('pk-reset pk-addp pk-press hit', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      aria-label={label ?? `Somar ${spellUnits(amount)}`}
      onClick={() => guarded()}
    >
      <Icon name="plus" weight="bold" />
      {amount}
    </button>
  );
}
