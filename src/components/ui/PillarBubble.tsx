// A bolha do ícone, com a cor do pilar (ou da paleta, pela .hued). Quadro: .bub, .bub.sm, .bub.lg e .lic.
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { Icon, type IconName, type IconWeight } from '@/icons';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type PillarBubbleProps = {
  icon: IconName;
  /** sem pilar, a bolha fica neutra (Ajustes) */
  pillar?: PillarColor;
  /** xs 26 (ícones empilhados), sm 32, li 32 (lista), md 40, lg 56 */
  size?: 'xs' | 'sm' | 'li' | 'md' | 'lg';
  /** Duotone em hábito e pilar; Fill quando o hábito está feito */
  weight?: IconWeight;
  /** fundo branco (sobre um cartão tingido) */
  raised?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function PillarBubble({ icon, pillar, size = 'md', weight = 'duotone', raised, className, style }: PillarBubbleProps) {
  const p = pillarAttrs(pillar);
  return (
    <span
      aria-hidden="true"
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      className={clsx('pk-bub', size !== 'md' && size, !pillar && 'neutral', raised && 'raised', p.className, className)}
      style={style}
    >
      <Icon name={icon} weight={weight} />
    </span>
  );
}
