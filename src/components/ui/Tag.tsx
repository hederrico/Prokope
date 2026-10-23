// Tag: o selo pequeno ("Família", "meta batida", "recorde", "Agora", "fase 4"). Quadro: tag().
// Quando o selo nasce de uma conquista, entra com a mola toque ou festa (escada de celebração). Os outros não animam.
import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { Icon, type IconName, type IconWeight } from '@/icons';
import { choreography, spring, tween } from '@/motion/tokens';
import { useReduced } from './lib';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type TagProps = {
  children: string;
  pillar?: PillarColor;
  icon?: IconName;
  iconWeight?: IconWeight;
  /** bolinha do pilar à esquerda */
  dot?: boolean;
  /** caixa alta */
  upper?: boolean;
  /** fundo branco sobre --wash */
  lift?: boolean;
  /** verde de sucesso ("meta batida") */
  ok?: boolean;
  /** entra com a mola ao montar: toque (meta batida) ou festa (novo recorde) */
  celebrate?: 'toque' | 'festa';
  className?: string;
};

export function Tag({ children, pillar, icon, iconWeight = 'bold', dot, upper, lift, ok, celebrate, className }: TagProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReduced();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!celebrate || !el) return;
    if (reduced) {
      animate(el, { opacity: [0, 1] }, tween.micro);
      return;
    }
    el.style.opacity = '0';
    const delay = choreography.distant;
    animate(el, { scale: [0.5, 1] }, { ...spring[celebrate], delay });
    animate(el, { opacity: [0, 1] }, { ...tween.base, delay });
    // só na montagem: o selo nasce uma vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const p = pillarAttrs(pillar);
  return (
    <span
      ref={ref}
      className={clsx('pk-tag', dot && 'dot', upper && 'up', lift && 'lift', ok && 'ok', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
    >
      {icon && <Icon name={icon} weight={iconWeight} />}
      {children}
    </span>
  );
}
