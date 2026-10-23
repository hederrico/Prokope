// SegmentedControl: o controle segmentado (Semana · Mês · Fase). Quadro: seg().
// Grupo de rádio do Base UI (as setas trocam a opção). O fundo escolhido desliza de um segmento para o outro
// com a mola calma. Reduzido: troca com opacidade em micro.
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { spring, tween } from '@/motion/tokens';
import { useReduced } from './lib';
import './ui.css';

export type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** nome do grupo: "Período" */
  label: string;
  className?: string;
};

export function SegmentedControl<T extends string>({ options, value, onChange, label, className }: SegmentedControlProps<T>) {
  const reduced = useReduced();
  const thumb = useRef<HTMLSpanElement>(null);
  const n = options.length;
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const placed = useRef(false);

  // o fundo ocupa 1/n da largura (os segmentos são iguais) e anda em porcentagem da própria largura
  useLayoutEffect(() => {
    const el = thumb.current;
    if (!el) return;
    el.style.width = `calc((100% - 4px) / ${n})`;
    if (!placed.current) {
      placed.current = true;
      el.style.transform = `translateX(${index * 100}%)`;
    }
  }, [n, index]);
  useEffect(() => {
    const el = thumb.current;
    if (!el || !placed.current) return;
    const to = `translateX(${index * 100}%)`;
    if (el.style.transform === to) return;
    if (reduced) {
      el.style.transform = to;
      animate(el, { opacity: [0, 1] }, tween.micro);
    } else animate(el, { transform: to }, spring.calma);
  }, [index, reduced]);

  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as T)}
      aria-label={label}
      className={clsx('pk-sg', className)}
    >
      <span ref={thumb} className="pk-sg-thumb" aria-hidden="true" />
      {options.map((o) => (
        <Radio.Root key={o.value} value={o.value} className="pk-sg-opt">
          {o.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
