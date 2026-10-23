// Chip: filtro (liga e desliga), opção de lista ("Proteína ✓") ou informativo. Quadro: chip().
// Com `selected` definido, vira botão de alternar (Toggle do Base UI, aria-pressed). Só com onClick, botão simples.
// Sem nenhum dos dois, é texto. O ligado tem ✓ ou fundo cheio, nunca só a cor; o ✓ entra com a mola toque.
import { Toggle } from '@base-ui/react/toggle';
import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { Icon, type IconName, type IconWeight } from '@/icons';
import { spring } from '@/motion/tokens';
import { usePrevious, useReduced } from './lib';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type ChipProps = {
  children: string;
  /** definido (true ou false): chip de ligar e desligar */
  selected?: boolean;
  /** ligado no tom do pilar, com ✓ (em vez do fundo cheio) */
  tint?: boolean;
  /** verde de sucesso */
  ok?: boolean;
  icon?: IconName;
  iconWeight?: IconWeight;
  /** texto pequeno à direita ("7 g") */
  detail?: string;
  onClick?: () => void;
  /** troca de estado do chip de alternar */
  onPressedChange?: (pressed: boolean) => void;
  pillar?: PillarColor;
  disabled?: boolean;
  className?: string;
};

export function Chip({
  children,
  selected,
  tint,
  ok,
  icon,
  iconWeight = 'bold',
  detail,
  onClick,
  onPressedChange,
  pillar,
  disabled,
  className,
}: ChipProps) {
  const reduced = useReduced();
  const checkRef = useRef<SVGSVGElement>(null);
  const prev = usePrevious(selected);
  const showCheck = tint && selected;
  useLayoutEffect(() => {
    if (reduced || !showCheck || prev !== false || !checkRef.current) return;
    animate(checkRef.current, { scale: [0.4, 1] }, spring.toque);
  }, [showCheck, prev, reduced]);

  const p = pillarAttrs(pillar);
  const toggled = selected !== undefined;
  const cls = clsx(
    'pk-chip',
    (toggled || onClick) && 'hit',
    selected && !tint && 'sel',
    tint && (selected || !toggled) && 'tint',
    ok && 'ok',
    p.className,
    className,
  );
  const content = (
    <>
      {showCheck ? <Icon ref={checkRef} name="check" weight="bold" /> : icon && <Icon name={icon} weight={iconWeight} />}
      {children}
      {detail && <small>{detail}</small>}
    </>
  );
  const attrs = { 'data-pillar': p['data-pillar'], 'data-hue': p['data-hue'] };
  if (toggled) {
    return (
      <Toggle
        pressed={selected}
        disabled={disabled}
        onPressedChange={(v) => {
          onPressedChange?.(v);
          onClick?.();
        }}
        className={clsx('pk-reset', cls)}
        {...attrs}
      >
        {content}
      </Toggle>
    );
  }
  if (onClick) {
    return (
      <button type="button" disabled={disabled} className={clsx('pk-reset', cls)} onClick={onClick} {...attrs}>
        {content}
      </button>
    );
  }
  return (
    <span className={cls} {...attrs}>
      {content}
    </span>
  );
}

/** Fileira de chips. nowrap: rola de lado e esmaece no fim (nenhum chip some com letra maior). */
export function ChipRow({ children, nowrap, className, label }: { children: React.ReactNode; nowrap?: boolean; className?: string; label?: string }) {
  return (
    <div className={clsx('pk-chips', nowrap && 'nowrap', className)} role={label ? 'group' : undefined} aria-label={label}>
      {children}
    </div>
  );
}
