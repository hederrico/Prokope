// A cor e o visual de um hábito para os componentes (o hábito só guarda o pillarId; a tela passa a cor).
import type { PillarColor } from '@/components/ui';
import type { TodayItem } from '@/data';

export function pillarColor(item: Pick<TodayItem, 'pillar'>): PillarColor {
  return (item.pillar?.color as PillarColor | undefined) ?? 'accent';
}

export function visualOf(item: TodayItem) {
  return { name: item.habit.name, icon: item.habit.icon, pillar: pillarColor(item) };
}
