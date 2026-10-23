// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-rotina-conta.md).
import { NavBar } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';
import { useSession } from '@/data/session';

export default function DataScreen() {
  const session = useSession();
  return (
    <>
      <NavBar title="Dados e conta" />
      <PlaceholderNote owner="D6" />
      <PlaceholderLinks
        links={[
          { label: 'Apagar todos os dados', to: '/ajustes/dados/apagar' },
          { label: 'Recomeçar a demonstração', onClick: () => void session.resetDemo() },
          { label: 'Sair', onClick: () => void session.signOut() },
        ]}
      />
    </>
  );
}
