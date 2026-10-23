// Provisório da casca (B1): o agente D5 troca este arquivo pela tela de verdade (docs/interacao/telas/jornada.md).
import { NavBar } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function EditPhasesScreen() {
  return (
    <>
      <NavBar title={'Fases'} />
      <PlaceholderNote owner="D5" />
      <PlaceholderLinks links={[{ label: 'Fase 3 desbloqueada', to: '/fase/3' }]} />
    </>
  );
}
