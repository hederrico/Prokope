// Stat: o número com o rótulo em cima (.stat 28 px, ou .big 44 px). Quadro: .stats > div com .k e .stat.
// Número que muda usa a Onest com algarismos tabulares e rola com o NumberFlow em fill.
// Leitura na ordem: "Recorde, 21 dias."
import clsx from 'clsx';
import { Icon, type IconName } from '@/icons';
import { NumberFlow } from './NumberFlow';
import './ui.css';

export type StatProps = {
  value: number | string;
  /** unidade pequena à direita ("dias", "g") */
  unit?: string;
  label: string;
  icon?: IconName;
  size?: 'md' | 'lg';
  /** casas decimais do número */
  decimals?: number;
  className?: string;
};

export function Stat({ value, unit, label, icon, size = 'md', decimals = 1, className }: StatProps) {
  return (
    <div className={clsx('pk-stat', size === 'lg' && 'lg', className)}>
      <span className="k">
        {icon && <Icon name={icon} weight="duotone" />}
        {label}
      </span>
      <span className="v">
        {typeof value === 'number' ? <NumberFlow value={value} format={{ maximumFractionDigits: decimals }} /> : value}
        {unit && <small>{unit}</small>}
      </span>
    </div>
  );
}
