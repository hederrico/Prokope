// WeekDots: as 7 bolinhas da semana de um hábito, sempre com o texto "2 de 7 · meta 6" ao lado. Quadro: dots().
// Decorativas (aria-hidden). A bolinha nova enche em micro, +60 ms depois do toque (escala 0,6 → 1).
import { useLayoutEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { choreography, tween } from '@/motion/tokens';
import { useReduced } from './lib';
import './ui.css';

export type WeekDotsProps = { total: number; done: number };

export function WeekDots({ total, done }: WeekDotsProps) {
  const reduced = useReduced();
  const refs = useRef<(HTMLElement | null)[]>([]);
  const prev = useRef(done);
  useLayoutEffect(() => {
    const before = prev.current;
    prev.current = done;
    if (reduced || done <= before) return;
    for (let i = before; i < done; i++) {
      const el = refs.current[i];
      if (el) animate(el, { scale: [0.6, 1] }, { ...tween.micro, delay: choreography.local });
    }
  }, [done, reduced]);
  return (
    <span className="pk-dots" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} ref={(el) => void (refs.current[i] = el)} className={i < done ? 'on' : undefined} />
      ))}
    </span>
  );
}
/** decorativo: o nome acessível da linha ignora as bolinhas */
WeekDots.decorative = true;
