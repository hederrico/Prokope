// CardHeader: o título de cartão, com legenda e algo à direita. Quadro: ch(título, legenda, direita).
// O título é h3 dentro da seção.
import clsx from 'clsx';
import type { ReactNode } from 'react';
import './ui.css';

export type CardHeaderProps = { title: string; subtitle?: string; trailing?: ReactNode; className?: string };

export function CardHeader({ title, subtitle, trailing, className }: CardHeaderProps) {
  return (
    <div className={clsx('pk-ch', className)}>
      <span>
        <h3>{title}</h3>
        {subtitle && <span className="cap">{subtitle}</span>}
      </span>
      {trailing}
    </div>
  );
}
