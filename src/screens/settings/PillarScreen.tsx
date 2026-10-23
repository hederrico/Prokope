// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-plano.md).
import { useParams } from 'react-router';
import { NavBar, useScreenTitle } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function PillarScreen() {
  const id = useParams().id ?? '';
  const name = id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Pilar';
  useScreenTitle(name);
  return (
    <>
      <NavBar title={name} />
      <PlaceholderNote owner="D6" />
      <PlaceholderLinks
        links={[
          { label: 'Caminhada com o cachorro', to: '/ajustes/habitos/caminhada' },
          { label: 'Editar o pilar', to: `/ajustes/pilares/${id}/editar` },
        ]}
      />
    </>
  );
}
