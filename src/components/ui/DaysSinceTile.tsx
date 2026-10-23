// DaysSinceTile: o cartão de "dias sem", com o número grande na serifa e sem controle. Quadro: semTile().
// À direita: "recorde 21", ou "seu recorde" com o troféu em --ink quando o número alcança o recorde.
// O número rola algarismo por algarismo, com a largura animada (RollingNumber). No deslize, desce devagar até 0.
// Ao passar do recorde com a tela aberta, entra o selo "novo recorde" com a mola festa (nível 5).
// O toque abre o hábito; o deslize fica no detalhe, longe de um toque sem querer.
import clsx from 'clsx';
import { useState } from 'react';
import { Icon } from '@/icons';
import { PillarBubble } from './PillarBubble';
import { pillarAttrs, type HabitVisual } from './pillar';
import { RollingNumber } from './RollingNumber';
import { Tag } from './Tag';
import './ui.css';

export type DaysSinceTileProps = {
  habit: HabitVisual;
  /** dias sem, contando hoje */
  days: number;
  /** o maior número de dias sem (inclui a contagem atual) */
  record: number;
  /** o que fica sem: "refrigerante", "Shorts e TikTok" */
  what: string;
  onOpen: () => void;
  className?: string;
};

/** Nome lido: "Zero refrigerante, 12 dias sem, recorde 21". */
export function daysSinceLabel(name: string, days: number, record: number): string {
  const d = days === 1 ? '1 dia sem' : `${days} dias sem`;
  return days > 0 && days >= record ? `${name}, ${d}, seu recorde` : `${name}, ${d}, recorde ${record}`;
}

export function DaysSinceTile({ habit, days, record, what, onOpen, className }: DaysSinceTileProps) {
  const isBest = days > 0 && days >= record;
  // novo recorde: o número subiu e passou do recorde que valia antes, com a tela aberta
  const [prev, setPrev] = useState({ days, record });
  const [broke, setBroke] = useState(false);
  const [brokeKey, setBrokeKey] = useState(0);
  if (prev.days !== days || prev.record !== record) {
    if (days > prev.days && days > prev.record) {
      if (!broke) setBrokeKey((k) => k + 1);
      setBroke(true);
    } else if (days < prev.days) setBroke(false);
    setPrev({ days, record });
  }

  const p = pillarAttrs(habit.pillar);
  return (
    <button
      type="button"
      className={clsx('pk-reset pk-ds pk-press', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      aria-label={daysSinceLabel(habit.name, days, record)}
      onClick={onOpen}
    >
      <span className="top" aria-hidden="true">
        <PillarBubble icon={habit.icon} pillar={habit.pillar} size="sm" />
        {broke ? (
          <Tag key={brokeKey} icon="trophy" iconWeight="fill" celebrate="festa">
            novo recorde
          </Tag>
        ) : isBest ? (
          <span className="rec best">
            <Icon name="trophy" weight="regular" />
            seu recorde
          </span>
        ) : (
          <span className="rec">recorde {record}</span>
        )}
      </span>
      <span className="dn" aria-hidden="true">
        <RollingNumber value={days} />
      </span>
      <span className="dl" aria-hidden="true">
        {days === 1 ? 'dia' : 'dias'} sem {what}
      </span>
    </button>
  );
}
