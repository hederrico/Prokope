// Os três jeitos de ver o Hoje (hoje.md › Os três jeitos de ver o dia): Resumo, Lista completa e Linha do tempo.
// O botão no topo do Hoje diz o jeito atual e abre a folha da escolha (?folha=jeito); a mesma escolha aparece em
// Ajustes › Aparência. A escolha fica no perfil (profile.prefs.todayView) e acompanha a pessoa nos aparelhos.
import { OptionCard, OptionGroup } from '@/components/ui';
import { Icon, type IconName } from '@/icons';
import type { TodayViewPref } from '@/types';

interface TodayViewOption {
  value: TodayViewPref;
  title: string;
  description: string;
  icon: IconName;
}

const TODAY_VIEWS: readonly TodayViewOption[] = [
  {
    value: 'summary',
    title: 'Resumo',
    description: 'Os momentos do dia, com o que já foi feito recolhido e a faixa dos horários no topo.',
    icon: 'list-checks',
  },
  {
    value: 'full',
    title: 'Lista completa',
    description: 'Tudo aberto o dia todo, com o horário em cada hábito que tem horário.',
    icon: 'list-bullets',
  },
  {
    value: 'timeline',
    title: 'Linha do tempo',
    description: 'Tudo em ordem de horário, com a linha do agora.',
    icon: 'clock',
  },
];

/** O grupo de rádio dos três jeitos (folha do Hoje e Ajustes › Aparência). */
export function TodayViewOptions({
  value,
  onChange,
  className,
}: {
  value: TodayViewPref;
  onChange: (view: TodayViewPref) => void;
  className?: string;
}) {
  return (
    <OptionGroup<TodayViewPref>
      value={value}
      onChange={onChange}
      label="Jeito de ver o Hoje"
      pillar="accent"
      className={className}
    >
      {TODAY_VIEWS.map((v) => (
        <OptionCard
          key={v.value}
          value={v.value}
          title={v.title}
          description={v.description}
          badge={v.value === 'summary' ? 'padrão' : undefined}
        />
      ))}
    </OptionGroup>
  );
}

/** O botão do topo do Hoje: o ícone e o nome do jeito atual. O leitor ouve "Jeito de ver o dia: Resumo". */
export function TodayViewButton({ view, onOpen }: { view: TodayViewPref; onOpen: () => void }) {
  const current = TODAY_VIEWS.find((v) => v.value === view) ?? TODAY_VIEWS[0]!;
  return (
    <button
      type="button"
      className="pk-reset td-viewbtn"
      aria-haspopup="dialog"
      aria-label={`Jeito de ver o dia: ${current.title}. Trocar`}
      onClick={onOpen}
      data-tour="hoje-jeito"
    >
      <Icon name={current.icon} weight="bold" />
      <span>{current.title}</span>
      <Icon name="caret-down" weight="bold" className="td-viewbtn-cv" />
    </button>
  );
}
