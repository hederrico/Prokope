// MiniBar: a barra fina de porcentagem (força do hábito, pilares, notas). Quadro: mbar(pct, grossa).
// Decorativa: a porcentagem fica em texto ao lado. A largura anda em fill quando o valor muda; na montagem, já no valor.
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { dur, ease } from '@/motion/tokens';
import { chanSet, chanStop, chanTo, makeChan, type Chan } from './channel';
import { useReduced } from './lib';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type MiniBarProps = { value: number; thick?: boolean; pillar?: PillarColor; className?: string };

export function MiniBar({ value, thick, pillar, className }: MiniBarProps) {
  const reduced = useReduced();
  const ref = useRef<HTMLElement>(null);
  const chan = useRef<Chan | null>(null);
  const pct = Math.max(0, Math.min(100, value));
  useLayoutEffect(() => {
    const el = ref.current!;
    chan.current = makeChan(pct, (v) => (el.style.width = `${v}%`));
    return () => chanStop(chan.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const c = chan.current;
    if (!c || Math.abs(c.v - pct) < 0.01) return;
    if (reduced) chanSet(c, pct);
    else chanTo(c, pct, { duration: dur.fill, ease: ease.out });
  }, [pct, reduced]);
  const p = pillarAttrs(pillar);
  return (
    <span
      className={clsx('pk-mbar', thick && 'thick', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      aria-hidden="true"
    >
      <i ref={ref} />
    </span>
  );
}
