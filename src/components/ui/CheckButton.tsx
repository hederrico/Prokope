// CheckButton: o círculo de marcar um hábito de sim ou não. Quadro: chk(on, label).
// Ao marcar: encolhe a 0,9 em press (CSS :active), enche e volta com a mola toque, e o ✓ se desenha (pathLength 0 → 1).
// Ao desmarcar: o inverso em micro, sem quique. Reduzido (ou dado vindo de outro aparelho): troca de opacidade em micro.
import { Checkbox } from '@base-ui/react/checkbox';
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { haptic } from '@/motion/haptics';
import { spring, tween } from '@/motion/tokens';
import { chanSet, chanStop, chanTo, makeChan, type Chan } from './channel';
import { useReduced, useTapGuard } from './lib';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type CheckButtonProps = {
  checked: boolean;
  /** nome do hábito, com o contexto: "Louça, até 20h30" */
  label: string;
  onCheckedChange: (checked: boolean) => void;
  /** cor do pilar (sem ela, herda o data-pillar da linha) */
  pillar?: PillarColor;
  /** fez parte da meta (meio cheio, aria-checked="mixed") */
  partial?: boolean;
  disabled?: boolean;
  /** troca suave, sem mola nem celebração (marcado em outro aparelho) */
  quiet?: boolean;
  className?: string;
};

/** O ✓ do Phosphor (bold), em SVG, para poder desenhar o traço. */
const CHECK_PATH = 'M40 144 L96 200 L224 72';

export function CheckButton({
  checked,
  label,
  onCheckedChange,
  pillar,
  partial,
  disabled,
  quiet,
  className,
}: CheckButtonProps) {
  const reduced = useReduced();
  const fillRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const chans = useRef<{ scale: Chan; fillOp: Chan; dash: Chan; tickOp: Chan } | null>(null);
  const prev = useRef(checked);
  const guarded = useTapGuard((v: boolean) => {
    // nível 1 da escada: vibração bônus ao marcar, dentro do gesto
    if (v && !quiet) haptic();
    onCheckedChange(v);
  }, 300);

  // estado inicial já no valor, antes da primeira pintura
  useLayoutEffect(() => {
    const f = fillRef.current!;
    const s = svgRef.current!;
    const p = pathRef.current!;
    chans.current = {
      scale: makeChan(checked ? 1 : 0, (v) => (f.style.transform = `scale(${v})`)),
      fillOp: makeChan(1, (v) => (f.style.opacity = String(v))),
      dash: makeChan(checked ? 0 : 1, (v) => (p.style.strokeDashoffset = String(v))),
      tickOp: makeChan(checked ? 1 : 0, (v) => (s.style.opacity = String(v))),
    };
    return () => {
      const c = chans.current;
      if (c) Object.values(c).forEach(chanStop);
    };
    // só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const c = chans.current;
    if (!c || prev.current === checked) return;
    prev.current = checked;
    if (reduced || quiet) {
      chanSet(c.scale, 1);
      chanSet(c.dash, 0);
      chanTo(c.fillOp, checked ? 1 : 0, tween.micro);
      chanTo(c.tickOp, checked ? 1 : 0, tween.micro);
      return;
    }
    chanSet(c.fillOp, 1);
    if (checked) {
      if (c.scale.v < 0.35) chanSet(c.scale, 0.35);
      chanTo(c.scale, 1, spring.toque);
      chanSet(c.tickOp, 1);
      chanTo(c.dash, 0, { ...spring.toque, delay: 0.04 });
    } else {
      chanTo(c.dash, 1, tween.exit);
      chanTo(c.tickOp, 0, { ...tween.exit, delay: 0.09 });
      chanTo(c.scale, 0, tween.micro);
    }
  }, [checked, reduced, quiet]);

  const p = pillarAttrs(pillar);
  return (
    <Checkbox.Root
      checked={checked}
      indeterminate={!checked && partial}
      disabled={disabled}
      onCheckedChange={(v) => guarded(v)}
      aria-label={label}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      data-partial={!checked && partial ? '' : undefined}
      className={clsx('pk-chk hit', p.className, className)}
    >
      {!checked && partial && <span className="pk-chk-half" aria-hidden="true" />}
      <span ref={fillRef} className="pk-chk-f" aria-hidden="true" />
      <svg ref={svgRef} className="pk-chk-v" viewBox="0 0 256 256" aria-hidden="true">
        <path ref={pathRef} d={CHECK_PATH} pathLength={1} strokeDasharray="1 2" />
      </svg>
    </Checkbox.Root>
  );
}
