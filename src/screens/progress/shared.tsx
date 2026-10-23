// Peças pequenas do Progresso: a seta das linhas, o valor de um pilar na cor dele, o insight a partir da correlação.
import { InsightCard, type PillarColor } from '@/components/ui';
import { Icon } from '@/icons';
import type { Habit } from '@/types';
import type { Insight } from '@/data';
import { shortOf } from '@/screens/habit/text';

export function Chevron() {
  return (
    <span className="pg-chev" aria-hidden="true">
      <Icon name="caret-right" weight="bold" />
    </span>
  );
}


/** O insight de uma correlação pronta, com os dois rostinhos e a base ("24 dias com · 8 dias sem"). */
export function CorrelationInsight({
  insight,
  habit,
  pillar,
  compare,
  icon,
}: {
  insight: Insight;
  habit: Habit;
  pillar?: PillarColor;
  compare?: boolean;
  icon?: Parameters<typeof InsightCard>[0]['icon'];
}) {
  const c = insight.correlation;
  const short = shortOf(habit);
  return (
    <InsightCard
      pillar={pillar ?? 'accent'}
      icon={icon ?? habit.icon}
      text={insight.text}
      basis={`${c.withDays} ${c.withDays === 1 ? 'dia' : 'dias'} com · ${c.withoutDays} ${c.withoutDays === 1 ? 'dia' : 'dias'} sem`}
      compare={
        compare && c.withAvg !== null && c.withoutAvg !== null
          ? {
              with: c.withAvg,
              without: c.withoutAvg,
              withLabel: `com ${short}`,
              withoutLabel: `sem ${short}`,
              kind: c.metric,
            }
          : undefined
      }
    />
  );
}
