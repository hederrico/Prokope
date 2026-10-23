// SectionLabel: o rótulo de grupo em caixa alta (Manhã, Ao longo do dia), com um valor à direita. Quadro: gl().
// É h2, para o rotor do VoiceOver pular de grupo em grupo. Dentro de folha, sem margem lateral (inset).
import clsx from 'clsx';
import type { ReactNode } from 'react';
import './ui.css';

export type SectionLabelProps = {
  children: string;
  /** "1 de 2", "a partir das 20h30" */
  trailing?: ReactNode;
  inset?: boolean;
  /** nível do cabeçalho (padrão 2) */
  level?: 2 | 3;
  id?: string;
  className?: string;
};

export function SectionLabel({ children, trailing, inset, level = 2, id, className }: SectionLabelProps) {
  const H = level === 3 ? 'h3' : 'h2';
  return (
    <H id={id} className={clsx('pk-gl', inset && 'in', className)}>
      {children}
      {trailing != null && <span>{trailing}</span>}
    </H>
  );
}
