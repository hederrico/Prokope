// Button: primário, secundário, fantasma, tingido (cor do pilar), atenção, pequeno e largura total. Quadro: btn().
// 52 px de altura mínima, cantos de pílula, texto de 17 px que quebra linha em vez de vazar. Nunca vermelho.
// Pressionado: 0,97 e fundo 4% mais escuro em press; volta com a mola. Desabilitado: --track e --text-3.
import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName, type IconWeight } from '@/icons';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'tint' | 'warn';
  size?: 'md' | 'sm';
  wide?: boolean;
  icon?: IconName;
  iconWeight?: IconWeight;
  /** cor do pilar no tint */
  pillar?: PillarColor;
  children: ReactNode;
};

const VARIANT = { primary: 'p', secondary: 's', ghost: 'g', tint: 'tintb', warn: 'warn' } as const;

export function Button({
  variant = 'primary',
  size = 'md',
  wide,
  icon,
  iconWeight = 'bold',
  pillar,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const p = pillarAttrs(pillar);
  return (
    <button
      type={type}
      className={clsx('pk-reset pk-btn pk-press', VARIANT[variant], size === 'sm' && 'sm hit', wide && 'w', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      {...rest}
    >
      {icon && <Icon name={icon} weight={iconWeight} />}
      {children}
    </button>
  );
}
