// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-plano.md).
import { NavBar } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function HabitsScreen() {
  return (
    <>
      <NavBar title={'Hábitos'} />
      <PlaceholderNote owner="D6" />
      <PlaceholderLinks
        links={[
          { label: 'Caminhada com o cachorro', to: '/ajustes/habitos/caminhada' },
          { label: 'Novo hábito', to: '/ajustes/habitos/novo/tipo' },
        ]}
      />
    </>
  );
}
