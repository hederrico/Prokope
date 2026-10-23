// BudgetSlots: os espaços do limite da semana (refeições livres, tranqueiras) ou das metas da semana. Quadro: slots().
// Decorativos: o texto ao lado diz "1 de 2 na semana". O espaço novo enche com escala 0,6 → 1 e a mola toque.
import { useLayoutEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { choreography, spring } from '@/motion/tokens';
import { useReduced } from './lib';
import './ui.css';

export type BudgetSlotsProps = {
  total: number;
  used: number;
  /** used: limite (preenche em --track, neutro) · on: meta (preenche no --fill do pilar) */
  kind?: 'used' | 'on';
};

export function BudgetSlots({ total, used, kind = 'used' }: BudgetSlotsProps) {
  const reduced = useReduced();
  const refs = useRef<(HTMLElement | null)[]>([]);
  const prev = useRef(used);
  useLayoutEffect(() => {
    const before = prev.current;
    prev.current = used;
    if (reduced || used <= before) return;
    for (let i = before; i < Math.min(used, total); i++) {
      const el = refs.current[i];
      if (el) animate(el, { scale: [0.6, 1] }, { ...spring.toque, delay: choreography.local });
    }
  }, [used, total, reduced]);
  return (
    <span className="pk-slots" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} ref={(el) => void (refs.current[i] = el)} className={i < used ? kind : undefined} />
      ))}
    </span>
  );
}
BudgetSlots.decorative = true;
