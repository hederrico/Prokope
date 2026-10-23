// IntervalStrip: a fileira de blocos proporcionais do treino (quadro: strip()). Esforço alto e cheio, descanso baixo,
// aquecimento e volta à calma num tom mais claro. Com `current`, os feitos ficam cheios, o atual ganha o contorno
// e os seguintes ficam vazados; o contorno anda de um bloco para o outro com layout calma. Decorativa: o texto ao
// lado diz o mesmo.
import clsx from 'clsx';
import { m } from 'motion/react';
import type { RunBlock } from '@/data';
import { spring } from '@/motion';
import './run.css';

export interface IntervalStripProps {
  blocks: RunBlock[];
  /** índice do bloco atual; sem ele, a fileira é neutra (o plano) */
  current?: number;
  /** todos feitos (Treino feito) ou até qual índice (exclusivo) num treino encerrado antes */
  doneUntil?: number;
  /** liga o contorno animado (um layoutId por tela) */
  outlineId?: string;
  className?: string;
}

const KIND_CLASS: Record<RunBlock['kind'], string> = { effort: 't', rest: 'w', warmup: 'c', cooldown: 'c' };

export function IntervalStrip({ blocks, current, doneUntil, outlineId, className }: IntervalStripProps) {
  return (
    <div className={clsx('rn-strip', className)} aria-hidden="true">
      {blocks.map((b, i) => {
        let st = '';
        if (doneUntil !== undefined) st = i < doneUntil ? 'done' : 'fut';
        else if (current !== undefined) st = i < current ? 'done' : i === current ? 'cur' : 'fut';
        return (
          <i key={i} className={clsx(KIND_CLASS[b.kind], st)} style={{ flex: b.seconds }}>
            {st === 'cur' &&
              (outlineId ? (
                <m.span className="rn-cur" layoutId={outlineId} transition={spring.calma} />
              ) : (
                <span className="rn-cur" />
              ))}
          </i>
        );
      })}
    </div>
  );
}
