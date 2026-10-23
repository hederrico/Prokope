// Card: o cartão branco do quadro (.card, .card.p, .card.tint), para as telas comporem os seus blocos.
import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** 16 px de respiro */
  padded?: boolean;
  /** fundo --wash do pilar, sem sombra */
  tint?: boolean;
  pillar?: PillarColor;
  children: ReactNode;
};

export function Card({ padded, tint, pillar, className, children, ...rest }: CardProps) {
  const p = pillarAttrs(pillar);
  return (
    <div
      className={clsx('pk-card', padded && 'p', tint && 'tint', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      {...rest}
    >
      {children}
    </div>
  );
}
