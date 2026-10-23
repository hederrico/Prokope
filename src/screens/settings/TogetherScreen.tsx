// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-rotina-conta.md).
import { NavBar } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function TogetherScreen() {
  return (
    <>
      <NavBar title={'A dois'} />
      <PlaceholderNote owner="D6" />
      <PlaceholderLinks
        links={[
          { label: 'Convite (folha)', sheet: 'convite', args: { id: 'abc' } },
          { label: 'Ir para o Hoje (troca de aba)', to: '/hoje' },
        ]}
      />
    </>
  );
}
