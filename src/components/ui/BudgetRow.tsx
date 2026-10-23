// BudgetRow: o limite da semana com quanto já foi usado. Quadro: budget({ p, t, s, used, total }).
// Passar do limite mostra "3 de 2" em --text-2, sem cor nova. Com onUse, ganha o PlusButton à direita.
import clsx from 'clsx';
import { BudgetSlots } from './BudgetSlots';
import { NumberFlow } from './NumberFlow';
import { pillarAttrs, type HabitVisual } from './pillar';
import { PlusButton } from './PlusButton';
import './ui.css';

export type BudgetRowProps = {
  habit: Pick<HabitVisual, 'name' | 'pillar'>;
  used: number;
  total: number;
  /** linha de baixo: "até 2 por semana", "a semana recomeça amanhã" */
  note?: string;
  /** usa um do limite (com Desfazer, na tela) */
  onUse?: () => void;
  className?: string;
};

export function BudgetRow({ habit, used, total, note, onUse, className }: BudgetRowProps) {
  const p = pillarAttrs(habit.pillar);
  const over = used > total;
  return (
    <div className={clsx('pk-budget', p.className, className)} data-pillar={p['data-pillar']} data-hue={p['data-hue']}>
      <span>
        <b>{habit.name}</b>
        {note && <span className="cap">{note}</span>}
      </span>
      <span className="r">
        <BudgetSlots total={total} used={Math.min(used, total)} />
        <span className={clsx('cap pk-num', over && 'over')} aria-label={`${used} de ${total} na semana`}>
          <NumberFlow value={used} delay={60} aria-hidden="true" /> de {total}
        </span>
        {onUse && (
          <PlusButton
            onClick={onUse}
            full={used >= total}
            label={`${habit.name}, ${used} de ${total} na semana. Usar um`}
          />
        )}
      </span>
    </div>
  );
}
