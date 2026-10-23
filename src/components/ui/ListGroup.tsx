// ListGroup: o cartão que agrupa ListItems, com divisória de 1 px. Quadro: lg().
import clsx from 'clsx';
import { Children, type ReactNode } from 'react';
import './ui.css';

export type ListGroupProps = { children: ReactNode; label?: string; className?: string };

export function ListGroup({ children, label, className }: ListGroupProps) {
  return (
    <ul className={clsx('pk-lg', className)} aria-label={label}>
      {Children.toArray(children).map((child, i) => (
        <li key={i}>{child}</li>
      ))}
    </ul>
  );
}
