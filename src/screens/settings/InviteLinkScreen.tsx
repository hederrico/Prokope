// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-rotina-conta.md › A dois).
import { useParams } from 'react-router';
import { FullScreen } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function InviteLinkScreen() {
  const id = useParams().id ?? '';
  return (
    <FullScreen>
      <div style={{ padding: '48px 16px 0' }}>
        <h1 className="ttl2" style={{ margin: '0 0 12px' }}>
          Convite para um espaço a dois
        </h1>
        <PlaceholderNote owner="D6" />
      </div>
      <PlaceholderLinks
        links={[
          {
            label: 'Abrir o Hoje com o convite',
            to: `/hoje?folha=convite&id=${encodeURIComponent(id)}`,
            replace: true,
          },
        ]}
      />
    </FullScreen>
  );
}
