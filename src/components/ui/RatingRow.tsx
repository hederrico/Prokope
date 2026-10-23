// RatingRow: a nota de 1 a 5 só para leitura (Progresso). Quadro: r5(). Na linha do Hoje, use ActionPill.
import clsx from 'clsx';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type RatingValue = 1 | 2 | 3 | 4 | 5;
export type RatingRowProps = { value?: RatingValue; pillar?: PillarColor; className?: string };

/** VoiceOver: "Nota 4 de 5" ou "Sem nota". */
export function RatingRow({ value, pillar, className }: RatingRowProps) {
  const p = pillarAttrs(pillar);
  return (
    <span
      role="img"
      aria-label={value ? `Nota ${value} de 5` : 'Sem nota'}
      className={clsx('pk-r5', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true" className={n === value ? 'on' : undefined}>
          {n}
        </span>
      ))}
    </span>
  );
}
