// GoalBar: a barra com segmentos e a linha de meta (proteína, água em lista). Quadro: pbar().
// Cada registro é um segmento (separados por 2 px). O segmento novo cresce da largura 0 em fill, com --ease-out.
// Quando a barra encosta na linha, a linha acende (de --text-2 para --ink) e entra o selo "meta batida".
// Além da meta, a barra continua e mostra "+6 g". Se o total passa do fim da barra, a escala cresce e tudo anda junto.
// Reduzido: a largura troca de uma vez e o segmento novo aparece com opacidade em micro.
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '@/icons';
import { haptic } from '@/motion/haptics';
import { dur, ease, tween } from '@/motion/tokens';
import { chanSet, chanStop, chanTo, makeChan, type Chan } from './channel';
import { bezierTimeFor, fmtNumber, useReduced } from './lib';
import { NumberFlow } from './NumberFlow';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type GoalBarProps = {
  /** um valor por registro, na ordem (gramas, litros) */
  segments: number[];
  goal: number;
  /** valor do fim da barra; o padrão é goalBarScale(total, goal) */
  scale?: number;
  /** unidade curta ("g", "L") e por extenso para o leitor ("gramas", "litros") */
  unit: string;
  unitName?: string;
  /** rótulo da linha de meta; padrão "meta 80 g". null tira o rótulo */
  goalLabel?: string | null;
  /** 8 px em vez de 12 */
  thin?: boolean;
  /** listrada: hoje, até o dia fechar (Progresso) */
  striped?: boolean;
  /** linha de baixo com o selo "meta batida" e o "+6 g" (padrão true) */
  status?: boolean;
  /** nome lido; padrão "46 de 80 gramas" */
  label?: string;
  pillar?: PillarColor;
  className?: string;
};

/** Fim da barra: 1,5 × a meta (80 g → 120 g, como no quadro). Se o total passa disso, a escala cresce em passos
 *  de um quarto da meta, com folga de 10%, para a barra nunca vazar. */
export function goalBarScale(total: number, goal: number): number {
  const g = goal > 0 ? goal : Math.max(1, total);
  const base = g * 1.5;
  if (total <= base) return base;
  const step = g / 4;
  return Math.ceil(total / 0.9 / step) * step;
}

/** Nome lido da barra: "46 de 80 gramas". */
export function goalBarLabel(total: number, goal: number, unitName: string): string {
  return `${fmtNumber(total)} de ${fmtNumber(goal)} ${unitName}`;
}

const EPS = 0.01;

export function GoalBar({
  segments,
  goal,
  scale,
  unit,
  unitName,
  goalLabel,
  thin,
  striped,
  status = true,
  label,
  pillar,
  className,
}: GoalBarProps) {
  const reduced = useReduced();
  const total = segments.reduce((a, b) => a + b, 0);
  const sc = scale ?? goalBarScale(total, goal);
  const n = segments.length;

  // segmentos que saem (Desfazer) ficam até encolher
  const [kept, setKept] = useState(n);
  if (n > kept) setKept(n);
  const count = reduced ? n : Math.max(n, kept);

  const segRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const chans = useRef<(Chan & { el: HTMLElement })[]>([]);
  const lineRef = useRef<HTMLSpanElement>(null);
  const lineChan = useRef<Chan | null>(null);
  const first = useRef(true);
  const fillT = { duration: dur.fill, ease: ease.out };

  useLayoutEffect(() => {
    const isFirst = first.current;
    first.current = false;
    const pending: Promise<unknown>[] = [];
    for (let i = 0; i < count; i++) {
      const el = segRefs.current[i];
      if (!el) continue;
      const target = i < n ? (segments[i]! / sc) * 100 : 0;
      let ch = chans.current[i];
      if (!ch || ch.el !== el) {
        const isNew = !isFirst && i < n;
        const c = makeChan(isNew && !reduced ? 0 : target, (v) => (el.style.width = `${v}%`)) as Chan & { el: HTMLElement };
        c.el = el;
        chans.current[i] = c;
        ch = c;
        if (isNew && reduced) {
          el.style.opacity = '0';
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out', fill: 'forwards' });
        }
      }
      if (Math.abs(ch.v - target) > EPS) {
        if (reduced) chanSet(ch, target);
        else pending[i] = chanTo(ch, target, fillT);
      }
    }
    if (count > n) {
      const leaving = pending.slice(n).filter(Boolean);
      // os que saem somem quando terminam de encolher (no reduzido, já)
      Promise.all(leaving).then((done) => done.every(Boolean) && setKept((k) => (k === count ? n : k)));
    }
    // linha da meta: anda junto quando a escala muda
    const lineEl = lineRef.current;
    if (lineEl) {
      const left = (goal / sc) * 100;
      if (!lineChan.current) lineChan.current = makeChan(left, (v) => (lineEl.style.left = `${v}%`));
      else if (Math.abs(lineChan.current.v - left) > EPS) {
        if (reduced) chanSet(lineChan.current, left);
        else chanTo(lineChan.current, left, fillT);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, sc, count, n, goal, reduced]);

  useEffect(
    () => () => {
      chans.current.forEach((c) => chanStop(c));
      chanStop(lineChan.current);
    },
    [],
  );

  // a linha acende quando a barra encosta nela, e não no fim da animação
  const hit = goal > 0 && total >= goal;
  const [lit, setLit] = useState(hit);
  const prevTotal = useRef(total);
  useEffect(() => {
    const before = prevTotal.current;
    prevTotal.current = total;
    if (hit === lit) return;
    const instant = reduced || before === total;
    const p = hit ? (goal - before) / (total - before) : (before - goal) / (before - total);
    const ms = instant ? 0 : bezierTimeFor(ease.out, Math.max(0, Math.min(1, p))) * dur.fill * 1000;
    const id = setTimeout(() => {
      setLit(hit);
      // nível 2 da escada: meta batida, com vibração bônus
      if (hit && !instant) haptic();
    }, ms);
    return () => clearTimeout(id);
  }, [total, hit, lit, goal, reduced]);

  const over = Math.max(0, total - goal);
  const showLabel = goalLabel !== null;
  const p = pillarAttrs(pillar);
  const name = unitName ?? unit;

  return (
    <div className={clsx('pk-gb', p.className, className)} data-pillar={p['data-pillar']} data-hue={p['data-hue']}>
      <div
        role="meter"
        aria-valuenow={total}
        aria-valuemin={0}
        aria-valuemax={Math.max(goal, total)}
        aria-label={label ?? goalBarLabel(total, goal, name)}
        className={clsx('pk-pb', thin && 'thin', striped && 'striped', !showLabel && 'nolabel')}
      >
        <div className="pk-pb-t">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} ref={(el) => void (segRefs.current[i] = el)} className="pk-pb-s" />
          ))}
        </div>
        {goal > 0 && (
          <span ref={lineRef} className={clsx('pk-pb-m', lit && 'lit')} aria-hidden="true">
            {showLabel && <span>{goalLabel ?? `meta ${fmtNumber(goal)} ${unit}`}</span>}
          </span>
        )}
      </div>
      {status && (
        <AnimatePresence initial={false}>
          {lit && (
            <m.div
              key="st"
              className="pk-pb-st"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1, transition: reduced ? tween.micro : tween.base }}
              exit={{ height: 0, opacity: 0, transition: reduced ? tween.micro : tween.exit }}
            >
              <div>
                <span className="pk-vpill ok">
                  <Icon name="check" weight="bold" />
                  meta batida
                </span>
                {over > 0 && (
                  <m.span
                    className="pk-pb-over"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { ...tween.base, delay: 0.06 } }}
                  >
                    +<NumberFlow value={over} /> {unit}
                  </m.span>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
