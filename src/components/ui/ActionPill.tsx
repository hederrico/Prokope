// ActionPill: a pílula que abre a folha ou a tela cheia do registro ("Dar nota", "Começar"). Quadro: doPill().
// Depois do registro, a tela troca por uma ValuePill ("4 · Bom").
import clsx from 'clsx';
import { Icon, type IconName } from '@/icons';
import './ui.css';

export type ActionPillProps = {
  /** "Dar nota", "Começar" */
  children: string;
  onClick: () => void;
  /** nome lido: "Almoço, sem nota. Dar nota" */
  label?: string;
  icon?: IconName;
  className?: string;
};

export function ActionPill({ children, onClick, label, icon, className }: ActionPillProps) {
  return (
    <button type="button" className={clsx('pk-reset pk-dop pk-press hit', className)} aria-label={label} onClick={onClick}>
      {icon && <Icon name={icon} weight="bold" />}
      {children}
    </button>
  );
}
