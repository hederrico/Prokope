// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-plano.md › Novo hábito).
import { FullScreen, NavBar } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function NewHabitTypeScreen() {
  return (
    <FullScreen top={<NavBar cancel title="Novo hábito" />}>
      <PlaceholderNote owner="D6" />
      <PlaceholderLinks links={[{ label: 'Sim ou não', to: '/ajustes/habitos/novo/detalhes' }]} />
    </FullScreen>
  );
}
