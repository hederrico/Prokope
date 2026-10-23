// Ring: o anel de progresso (dia, água, constância, dia fechado, corrida). Quadro: ring() e ringBox().
// Começa às 12h, ponta redonda, traço de cerca de 10% do diâmetro. Anima o strokeDashoffset:
// `ring` (600 ms) nos anéis grandes e `fill` (400 ms) nos pequenos da semana. Na montagem, já aparece no valor.
// Dia fechado: brilha uma vez em glow (900 ms) e assenta em 0,6. Reduzido: vai direto ao valor e o brilho fica parado.
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { animate } from 'motion/react';
import { dur, ease, tween } from '@/motion/tokens';
import { chanSet, chanStop, chanTo, makeChan, type Chan } from './channel';
import { useReduced } from './lib';
import './ui.css';

export type RingProps = {
  size: number;
  /** espessura do traço; padrão de cerca de 10% do diâmetro */
  stroke?: number;
  /** de 0 a 1 */
  value: number;
  /** cor do arco (padrão --accent-mark) e do trilho (padrão --track) */
  color?: string;
  track?: string;
  /** com label, o anel vira role="meter" com esse nome ("Água, 1,5 de 3 litros"); sem ele, é decorativo */
  label?: string;
  children?: ReactNode;
  /** brilho do dia fechado */
  glow?: boolean;
  /** ring (padrão) para anéis grandes e gráficos; fill para os pequenos (semana) */
  timing?: 'ring' | 'fill';
  /** atraso da coreografia, em ms (+120 no anel de hoje) */
  delay?: number;
  /** trilho tracejado (dia pausado) */
  dashedTrack?: boolean;
  /** troca suave de 150 ms, sem andar (dado vindo de outro aparelho) */
  quiet?: boolean;
  className?: string;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function Ring({
  size,
  stroke,
  value,
  color = 'var(--accent-mark)',
  track = 'var(--track)',
  label,
  children,
  glow,
  timing = 'ring',
  delay = 0,
  dashedTrack,
  quiet,
  className,
}: RingProps) {
  const reduced = useReduced();
  const sw = stroke ?? Math.max(3, Math.round(size * 0.1 * 2) / 2);
  const r = (size - sw) / 2;
  const C = 2 * Math.PI * r;
  const arcRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const chan = useRef<Chan | null>(null);
  const opChan = useRef<Chan | null>(null);
  const target = clamp01(value);

  useLayoutEffect(() => {
    const arc = arcRef.current!;
    chan.current = makeChan(target, (v) => {
      arc.style.strokeDashoffset = String(C * (1 - v));
    });
    opChan.current = makeChan(target > 0.0005 ? 1 : 0, (v) => (arc.style.opacity = String(v)));
    return () => {
      chanStop(chan.current);
      chanStop(opChan.current);
    };
    // C muda só com o tamanho: remonta o canal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [C]);

  useEffect(() => {
    const c = chan.current;
    const o = opChan.current;
    if (!c || !o || Math.abs(c.v - target) < 0.0005) return;
    const visible = target > 0.0005;
    if (reduced || quiet) {
      // troca por opacidade: some, muda e volta
      chanSet(c, target);
      chanSet(o, visible ? 0 : o.v);
      if (visible) chanTo(o, 1, { ...tween.micro, delay: delay / 1000 });
      else chanTo(o, 0, tween.micro);
      return;
    }
    if (visible) chanSet(o, 1);
    const ctl = chanTo(c, target, { duration: timing === 'fill' ? dur.fill : dur.ring, ease: ease.out, delay: delay / 1000 });
    if (!visible) ctl.then((ok) => ok && chanSet(o, 0));
  }, [target, reduced, quiet, timing, delay]);

  // brilho: na montagem já assentado; ao acender, brilha uma vez
  const glowMounted = useRef(false);
  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    if (!glowMounted.current) {
      glowMounted.current = true;
      el.style.opacity = glow ? '0.6' : '0';
      return;
    }
    if (!glow) {
      animate(el, { opacity: 0 }, tween.micro);
      return;
    }
    if (reduced) {
      animate(el, { opacity: 0.6 }, tween.micro);
      return;
    }
    animate(el, { opacity: [0, 1, 0.6], scale: [0.94, 1.03, 1] }, { duration: dur.glow, ease: ease.inOut, times: [0, 0.35, 1] });
  }, [glow, reduced]);

  const svg = (
    <svg className="pk-ringsvg" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={track}
        strokeWidth={sw}
        strokeDasharray={dashedTrack ? `${Math.max(1.5, sw * 0.6)} ${Math.max(2.5, sw)}` : undefined}
      />
      <circle
        ref={arcRef}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={C.toFixed(3)}
      />
    </svg>
  );

  const meter = label
    ? { role: 'meter', 'aria-label': label, 'aria-valuenow': Math.round(target * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 }
    : {};
  return (
    <span className={clsx('pk-ringbox', className)} style={{ width: size, height: size }} {...meter}>
      {glow !== undefined && <span ref={glowRef} className="pk-glow" aria-hidden="true" />}
      {svg}
      {children != null && <span className="rc">{children}</span>}
    </span>
  );
}
