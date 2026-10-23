// Peças pequenas do Progresso: a seta das linhas e o cartão de um insight.
import { InsightCard, type PillarColor } from '@/components/ui';
import { Icon, type IconName } from '@/icons';

export function Chevron() {
  return (
    <span className="pg-chev" aria-hidden="true">
      <Icon name="caret-right" weight="bold" />
    </span>
  );
}


/** Um cartão de "O que os seus dados mostram": a frase, a base ("24 dias com · 8 dias sem"), o ícone e a cor. */
export function InsightItem({
  text,
  basis,
  icon,
  pillar,
}: {
  text: string;
  basis: string;
  icon: IconName;
  pillar?: PillarColor;
}) {
  return <InsightCard pillar={pillar ?? 'accent'} icon={icon} text={text} basis={basis} />;
}
