// Provisório da casca (B1): o agente D3 troca este arquivo pela tela de verdade (docs/interacao/telas/estados.md › Conta sem acesso).
import { FullScreen } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';
import { useSession } from '@/data/session';

export default function AccessDeniedScreen() {
  const session = useSession();
  return (
    <FullScreen>
      <div style={{ padding: '48px 16px 0' }}>
        <h1 className="ttl2" style={{ margin: '0 0 12px' }}>
          Esta conta ainda não tem acesso
        </h1>
        <PlaceholderNote owner="D3" />
      </div>
      <PlaceholderLinks links={[{ label: 'Entrar com outra conta', onClick: () => void session.signOut() }]} />
    </FullScreen>
  );
}
