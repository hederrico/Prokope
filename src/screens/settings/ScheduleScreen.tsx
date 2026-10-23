// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-rotina-conta.md).
import { NavBar } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function ScheduleScreen() {
  return (
    <>
      <NavBar title={'Horários'} />
      <PlaceholderNote owner="D6" />
      <PlaceholderLinks links={[{ label: 'Ir para o Hoje (troca de aba)', to: '/hoje' }]} />
    </>
  );
}
