// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-plano.md).
import { NavBar } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function PillarsScreen() {
  return (
    <>
      <NavBar title={'Pilares'} />
      <PlaceholderNote owner="D6" />
      <PlaceholderLinks
        links={[
          { label: 'Mente', to: '/ajustes/pilares/mente' },
          { label: 'Corpo', to: '/ajustes/pilares/corpo' },
          { label: 'Apagar Corpo', sheet: 'apagar', args: { pilar: 'corpo' } },
          { label: 'Novo pilar', to: '/ajustes/pilares/novo' },
        ]}
      />
    </>
  );
}
