// Icon: o ícone do Phosphor pelo nome em kebab-case (como o ico() do quadro), ou a Salsicha para o cachorro.
// Sempre decorativo (aria-hidden): o nome do controle vem do texto ou do aria-label (componentes.md › Icon).
import { forwardRef } from 'react';
import type { IconProps as PhosphorIconProps } from '@phosphor-icons/react';
import { phosphorIcons } from './registry';
import { Salsicha } from './Salsicha';
import type { IconName, IconWeight } from './names';

export type IconProps = Omit<PhosphorIconProps, 'weight' | 'ref' | 'alt'> & {
  name: IconName;
  /** Duotone em hábito e pilar, Regular ao lado de texto, Bold em controles pequenos, Fill na aba ativa.
   *  Padrão: duotone, como o ico() do quadro. */
  weight?: IconWeight;
  /** Tamanho em px (ou qualquer medida CSS). Padrão: 1em, para seguir o font-size, como os ícones do quadro. */
  size?: number | string;
};

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, weight = 'duotone', size = '1em', ...rest },
  ref,
) {
  const Component = name === 'salsicha' ? Salsicha : phosphorIcons[name];
  return <Component ref={ref} weight={weight} size={size} aria-hidden="true" focusable="false" {...rest} />;
});
Icon.displayName = 'Icon';
