// PlusButton: o "+" num círculo de 40 px que usa um do limite da semana. Quadro: plusBtn().
// Responde como o CheckButton (0,9 e volta com a mola), sem o ✓. Com o limite cheio, continua disponível e neutro.
import clsx from 'clsx';
import { Icon } from '@/icons';
import { useTapGuard } from './lib';
import './ui.css';

export type PlusButtonProps = {
  onClick: () => void;
  /** "Refeições livres, 0 de 2 na semana. Usar uma" */
  label: string;
  /** limite cheio ou passado */
  full?: boolean;
  className?: string;
};

export function PlusButton({ onClick, label, full, className }: PlusButtonProps) {
  const guarded = useTapGuard(onClick, 300);
  return (
    <button
      type="button"
      className={clsx('pk-reset pk-chk plus hit', full && 'full', className)}
      aria-label={label}
      onClick={() => guarded()}
    >
      <Icon name="plus" weight="bold" />
    </button>
  );
}
