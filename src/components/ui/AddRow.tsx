// AddRow: a linha tracejada de adicionar, no fim da lista ("Novo pilar", "Criar outro pilar"). Quadro: addRow().
import clsx from 'clsx';
import { Icon } from '@/icons';
import './ui.css';

export type AddRowProps = { children: string; onClick: () => void; className?: string };

export function AddRow({ children, onClick, className }: AddRowProps) {
  return (
    <button type="button" className={clsx('pk-reset pk-addrow pk-press', className)} onClick={onClick}>
      <span aria-hidden="true">
        <Icon name="plus" weight="bold" />
      </span>
      {children}
    </button>
  );
}
