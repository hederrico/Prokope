// Provisório da casca (B1): o agente D5 troca este arquivo pela tela de verdade (docs/interacao/telas/jornada.md).
import { NavBar } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function RunPlanScreen() {
  return (
    <>
      <NavBar title={'Plano de corrida'} />
      <PlaceholderNote owner="D5" />
      <PlaceholderLinks links={[{ label: 'Começar o treino da semana 1', to: '/corrida/1/1' }]} />
    </>
  );
}
