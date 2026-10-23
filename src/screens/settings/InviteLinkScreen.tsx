// O link do convite (/convite/:id): com a sessão pronta, abre o Hoje e, 600 ms depois da primeira pintura, a folha
// do convite sobe. Sem sessão, a tela pede para entrar primeiro e volta para cá depois do login
// (ajustes-rotina-conta.md › A dois · convite recebido).
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FullScreen } from '@/components/shell';
import { Button, PillarBubble } from '@/components/ui';
import { useSession } from '@/data';
import './settings.css';

// o mesmo link abre a folha uma vez só (o efeito pode rodar duas vezes em desenvolvimento)
let opening: string | null = null;

export default function InviteLinkScreen() {
  const id = useParams().id ?? '';
  const session = useSession();
  const navigate = useNavigate();
  const ready = session.status === 'ready' && !session.needsOnboarding;

  useEffect(() => {
    if (!ready || !id || opening === id) return;
    opening = id;
    void navigate('/hoje', { replace: true });
    // a tela sai logo depois do primeiro navigate; a folha sobe 600 ms depois, sobre o Hoje
    setTimeout(() => {
      opening = null;
      void navigate(`/hoje?folha=convite&id=${encodeURIComponent(id)}`);
    }, 600);
  }, [ready, id, navigate]);

  if (ready) return <FullScreen />;

  return (
    <FullScreen>
      <div className="st-pad st-phero c" style={{ paddingTop: 72 }}>
        <PillarBubble icon="heart" size="lg" className="st-heart" />
        <h1 className="ttl2" style={{ marginTop: 8 }}>
          Convite para um espaço a dois
        </h1>
        <p className="lead" style={{ maxWidth: 310 }}>
          Entre no Prokopē com a sua conta Google para ver o convite. Cada um continua vendo só os próprios dados.
        </p>
      </div>
      <div className="st-pad st-cta" style={{ display: 'grid', gap: 10 }}>
        {session.firebaseAvailable && (
          <Button wide icon="google-logo" onClick={() => void session.signIn().catch(() => undefined)}>
            Entrar com Google
          </Button>
        )}
        <Button wide variant={session.firebaseAvailable ? 'ghost' : 'primary'} onClick={() => void session.enterDemo()}>
          Ver na demonstração
        </Button>
      </div>
    </FullScreen>
  );
}
