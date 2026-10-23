// Skeleton: o esqueleto com as formas do conteúdo, parado, com no máximo uma respiração de opacidade
// (1 → 0,7 a cada 1,6 s). Sem brilho que pisca. Parado no movimento reduzido.
// SkeletonGroup só aparece se a espera passar de 300 ms (antes disso, nada) e entra em micro.
import clsx from 'clsx';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { m } from 'motion/react';
import { tween } from '@/motion/tokens';
import './ui.css';

export type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  shape?: 'rect' | 'pill' | 'circle';
  radius?: number;
  className?: string;
  style?: CSSProperties;
};

/** Uma forma do esqueleto (bloco em --track). */
export function Skeleton({ width = '100%', height = 14, shape = 'rect', radius, className, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx('pk-sk', shape !== 'rect' && shape, className)}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export type SkeletonGroupProps = {
  children: ReactNode;
  /** espera antes de aparecer, em ms (padrão 300) */
  delay?: number;
  /** texto para o leitor enquanto carrega */
  label?: string;
  className?: string;
};

/** O conjunto que respira junto. Fica invisível nos primeiros 300 ms (resposta rápida nunca mostra o esqueleto). */
export function SkeletonGroup({ children, delay = 300, label = 'Carregando', className }: SkeletonGroupProps) {
  const [show, setShow] = useState(delay <= 0);
  useEffect(() => {
    if (delay <= 0) return;
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return (
    <div role="status" aria-label={label} className={className}>
      {show && (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: tween.micro }}>
          <div className="pk-skel-g">{children}</div>
        </m.div>
      )}
    </div>
  );
}
