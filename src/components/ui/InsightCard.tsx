// InsightCard: a frase do que os dados mostram, com a base ("24 dias com · 8 dias sem"). Quadro: .insight.
// Só aparece com 7 dias com e 7 sem (regra da tela). Pode trazer dois rostinhos lado a lado (decorativos:
// os números estão na frase). Entra com fadeUp na primeira vez; depois, parado.
import clsx from 'clsx';
import { m } from 'motion/react';
import { Icon, type IconName } from '@/icons';
import { fadeUp } from '@/motion/tokens';
import { Face, type FaceKind, type FaceLevel } from './Face';
import { fmtNumber } from './lib';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type InsightCardProps = {
  pillar: PillarColor;
  icon: IconName;
  text: string;
  basis?: string;
  /** dois rostinhos lado a lado: a média com e sem o hábito */
  compare?: { with: number; without: number; withLabel: string; withoutLabel: string; kind?: FaceKind };
  /** entra com fadeUp (padrão true) */
  animateIn?: boolean;
  className?: string;
};

const level = (v: number) => Math.max(1, Math.min(5, Math.round(v))) as FaceLevel;

export function InsightCard({ pillar, icon, text, basis, compare, animateIn = true, className }: InsightCardProps) {
  const p = pillarAttrs(pillar);
  const kind = compare?.kind ?? 'mood';
  return (
    <m.div
      {...(animateIn ? fadeUp : {})}
      className={clsx('pk-insight', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
    >
      <Icon name={icon} weight="duotone" />
      <div>
        <p>{text}</p>
        {compare && (
          <div className="pk-fx" aria-hidden="true">
            <span>
              <Face kind={kind} level={level(compare.with)} selected />
              <span>
                <b>{fmtNumber(compare.with)}</b>
                {compare.withLabel}
              </span>
            </span>
            <span>
              <Face kind={kind} level={level(compare.without)} selected />
              <span>
                <b>{fmtNumber(compare.without)}</b>
                {compare.withoutLabel}
              </span>
            </span>
          </div>
        )}
        {basis && <small>{basis}</small>}
      </div>
    </m.div>
  );
}
