// ValuePill: o valor registrado à direita da linha ("6h52 ✓", "83,6 kg ✓", "22h" fantasma). Quadro: vpill().
// Toque abre a folha para corrigir. O valor novo entra com opacidade em micro e um toque da mola.
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { Icon, type IconName } from '@/icons';
import { spring, tween } from '@/motion/tokens';
import { useReduced } from './lib';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type ValuePillProps = {
  /** o valor registrado: "6h52", "83,6 kg", "4 · Bom" */
  value: string;
  /** done: feito, no tom do pilar, com ✓ · ok: verde de sucesso · ghost: ainda não registrado */
  state?: 'done' | 'ghost' | 'ok';
  /** ícone à esquerda do valor; no feito e no ok, o padrão é o ✓ (null tira) */
  icon?: IconName | null;
  /** abre a folha para corrigir. Sem onClick, a pílula é só texto */
  onClick?: () => void;
  /** nome lido: "Acordar, 6h52, feito. Abre o horário" */
  label: string;
  pillar?: PillarColor;
  className?: string;
};

export function ValuePill({ value, state = 'done', icon, onClick, label, pillar, className }: ValuePillProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReduced();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    animate(el, { opacity: [0.2, 1] }, tween.micro);
    if (!reduced) animate(el, { scale: [0.94, 1] }, spring.toque);
  }, [value, state, reduced]);

  const p = pillarAttrs(pillar);
  const ic = icon === undefined ? (state === 'ghost' ? null : 'check') : icon;
  const cls = clsx('pk-vpill', state !== 'done' && state, p.className, className);
  const setRef = (el: HTMLElement | null) => {
    ref.current = el;
  };
  const content = (
    <>
      {ic && <Icon name={ic} weight="bold" />}
      {value}
    </>
  );
  if (!onClick) {
    return (
      <span ref={setRef} role="img" aria-label={label} className={cls} data-pillar={p['data-pillar']} data-hue={p['data-hue']}>
        {content}
      </span>
    );
  }
  return (
    <button
      ref={setRef}
      type="button"
      className={clsx('pk-reset pk-press hit', cls)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      aria-label={label}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
