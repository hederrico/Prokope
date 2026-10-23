// Dados e conta: o perfil, exportar em CSV e JSON, sair da conta e, sozinho no fim, Apagar todos os dados
// (que abre uma tela própria). Sair não pede confirmação, a não ser que haja registros esperando internet
// (ajustes-rotina-conta.md › Dados e conta).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { NavBar, Sheet } from '@/components/shell';
import { Button, ListGroup, MiniBar, SectionLabel } from '@/components/ui';
import { formatDayMonth, useConnection, useProfile, useSession } from '@/data';
import { Icon } from '@/icons';
import { useExport, useSinceDay, type ExportState } from './dataHooks';
import { Foot, Row } from './parts';
import './settings.css';

export default function DataScreen() {
  const navigate = useNavigate();
  const session = useSession();
  const profile = useProfile();
  const since = useSinceDay();
  const { online, pending } = useConnection();
  const csv = useExport('csv');
  const json = useExport('json');
  const [confirmOut, setConfirmOut] = useState(false);
  const demo = session.mode === 'demo';
  const name = session.user?.name || profile?.name || 'Você';
  const waiting = pending && !online;

  const exportLine = (s: ExportState, normal: string) =>
    s.phase === 'working' ? (
      <>
        Preparando o arquivo…
        <MiniBar value={70} className="st-export-progress" />
      </>
    ) : s.phase === 'ready' ? (
      'Pronto · toque para salvar'
    ) : (
      normal
    );

  const signOut = () => {
    if (waiting) {
      setConfirmOut(true);
      return;
    }
    void session.signOut();
  };

  return (
    <div className="st-screen">
      <NavBar title="Dados e conta" />
      <div className="st-pad" style={{ paddingTop: 4 }}>
        <div className="pk-lg pk-profile st-profile">
          <span className="pk-avatar" aria-hidden="true">
            {name.charAt(0).toLocaleUpperCase('pt-BR')}
          </span>
          <span style={{ minWidth: 0 }}>
            <b>{name}</b>
            <small>
              <Icon name={demo ? 'device-mobile' : 'google-logo'} weight="regular" />
              {demo ? 'Demonstração, guardada neste aparelho' : 'Conta Google conectada'}
            </small>
            {waiting ? (
              <small>Registros esperando internet para subir</small>
            ) : (
              since && <small>{`Registrando desde ${formatDayMonth(since)}`}</small>
            )}
          </span>
        </div>
      </div>

      <SectionLabel>Seus dados</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <Row
            icon="file-csv"
            title="Exportar em CSV"
            subtitle={exportLine(csv.state, 'Abre no Numbers, no Excel e no Planilhas')}
            trailing={
              <span className="rv" aria-hidden="true">
                <Icon name="export" weight="regular" />
              </span>
            }
            onClick={() => void csv.run()}
          />
          <Row
            icon="file-code"
            title="Exportar em JSON"
            subtitle={exportLine(json.state, 'Cópia completa, para guardar ou levar a outro app')}
            trailing={
              <span className="rv" aria-hidden="true">
                <Icon name="export" weight="regular" />
              </span>
            }
            onClick={() => void json.run()}
          />
        </ListGroup>
      </div>
      <Foot>Inclui registros, pilares, hábitos e fases. O iPhone pergunta onde salvar.</Foot>

      <SectionLabel>Conta</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <Row
            icon="sign-out"
            title={demo ? 'Sair da demonstração' : 'Sair da conta'}
            subtitle={
              demo ? 'A demonstração continua guardada neste aparelho.' : 'Os registros continuam salvos na sua conta.'
            }
            chevron={false}
            onClick={signOut}
          />
        </ListGroup>
      </div>

      <div style={{ height: 28 }} />
      <div className="st-pad">
        <ListGroup>
          <Row
            icon="trash-simple"
            title="Apagar todos os dados"
            tone="warn"
            onClick={() => void navigate('/ajustes/dados/apagar')}
          />
        </ListGroup>
      </div>

      <Sheet
        open={confirmOut}
        onOpenChange={setConfirmOut}
        title="Sair agora?"
        footer={
          <div className="st-btns">
            <Button wide onClick={() => setConfirmOut(false)}>
              Esperar
            </Button>
            <Button
              wide
              variant="ghost"
              onClick={() => {
                setConfirmOut(false);
                void session.signOut();
              }}
            >
              Sair mesmo assim
            </Button>
          </div>
        }
      >
        <p className="lead" style={{ margin: 0 }}>
          Ainda há registros esperando internet para subir.
        </p>
      </Sheet>
    </div>
  );
}
