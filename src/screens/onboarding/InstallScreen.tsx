// Provisório da casca (B1): o agente D3 troca este arquivo pela tela de verdade (docs/interacao/telas/estados.md › Instalar no iPhone).
import { useNavigate } from 'react-router';
import { FullScreen } from '@/components/shell';
import { PlaceholderNote } from '@/components/shell/Placeholder';
import { markInstallDismissed } from '@/app/platform';

export default function InstallScreen() {
  const navigate = useNavigate();
  return (
    <FullScreen
      footer={
        <button
          type="button"
          style={{
            minHeight: 52,
            width: '100%',
            borderRadius: 999,
            border: 0,
            background: 'none',
            color: 'var(--accent-ink)',
            font: '600 17px/1.2 var(--font-ui)',
          }}
          onClick={() => {
            markInstallDismissed();
            void navigate('/entrar');
          }}
        >
          Agora não
        </button>
      }
    >
      <div style={{ padding: '48px 16px 0' }}>
        <h1 className="ttl2" style={{ margin: '0 0 12px' }}>
          Instale o Prokopē no iPhone
        </h1>
        <PlaceholderNote owner="D3" />
      </div>
    </FullScreen>
  );
}
