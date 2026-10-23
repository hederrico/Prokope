// SkeletonRow: o esqueleto de uma HabitRow (bolha, duas linhas e o controle), com as mesmas medidas.
import clsx from 'clsx';
import { Skeleton } from './Skeleton';
import './ui.css';

export type SkeletonRowProps = {
  /** largura da linha do título (0 a 1) */
  title?: number;
  /** sem o círculo do controle */
  noControl?: boolean;
  className?: string;
};

export function SkeletonRow({ title = 0.62, noControl, className }: SkeletonRowProps) {
  return (
    <div className={clsx('pk-skrow', className)} aria-hidden="true">
      <Skeleton width={40} height={40} radius={13} />
      <span>
        <Skeleton width={`${Math.round(title * 100)}%`} height={14} shape="pill" />
        <Skeleton width="42%" height={10} shape="pill" />
      </span>
      {noControl ? <span /> : <Skeleton width={40} height={40} shape="circle" />}
    </div>
  );
}
