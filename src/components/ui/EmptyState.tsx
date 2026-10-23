// EmptyState: a lista vazia. Quadro: classe .empty. Uma frase em --text-2, com uma ação quando houver uma óbvia.
// Sem ilustração e sem tom de erro.
import clsx from 'clsx';
import { Icon, type IconName } from '@/icons';
import { Button } from './Button';
import './ui.css';

export type EmptyStateProps = {
  icon?: IconName;
  title: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({ icon, title, detail, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('pk-empty', className)}>
      {icon && <Icon name={icon} weight="regular" />}
      <b>{title}</b>
      {detail && <span className="cap">{detail}</span>}
      {action && (
        <Button variant="ghost" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
