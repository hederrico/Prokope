// A dois · convite recebido (?folha=convite&id=:id, sobre o Hoje): os avatares, quem convidou, os três pontos do que
// muda, "Aceitar convite" e "Agora não". Aceitar troca o conteúdo por "Pronto. Vocês estão ligados." com "Escolher o
// que mostrar"; "Agora não" guarda só que foi visto (ajustes-rotina-conta.md › A dois · convite recebido).
import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useNavigate } from 'react-router';
import { Sheet, type SheetScreenProps } from '@/components/shell';
import { Button } from '@/components/ui';
import { useInvite, useSession, useTogether } from '@/data';
import { useNow } from '@/data/useDomain';
import { acceptInvite, markInviteSeen } from '@/actions';
import { Icon, type IconName } from '@/icons';
import { spring, tween } from '@/motion/tokens';
import './settings.css';

function Point({ icon, children }: { icon: IconName; children: string }) {
  return (
    <div className="st-pt" role="listitem">
      <span aria-hidden="true">
        <Icon name={icon} />
      </span>
      <p>{children}</p>
    </div>
  );
}

export default function InviteSheet({ params, close }: SheetScreenProps) {
  const id = params.get('id') ?? '';
  const invite = useInvite(id);
  const together = useTogether();
  const navigate = useNavigate();
  const { now } = useNow();
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const session = useSession();
  // na demonstração não há outra pessoa: aceitar o próprio convite simula a ligação
  const demo = session.mode === 'demo';
  const mine = together.invites.some((i) => i.id === id) && !demo;
  const valid = !!invite && invite.status === 'pending' && invite.expiresAt > now && !mine;
  const label = 'Convite para um espaço a dois';

  const accept = async () => {
    if (state === 'busy') return;
    setState('busy');
    try {
      await acceptInvite(id);
      setState('done');
    } catch {
      setState('error');
    }
  };

  let body: React.ReactNode;
  if (state === 'done') {
    body = (
      <div className="st-inv" key="done">
        <div className="st-pair" aria-hidden="true">
          <span className="pk-avatar">{(invite?.fromName ?? '?').charAt(0).toLocaleUpperCase('pt-BR')}</span>
          <span className="st-pair-heart">
            <Icon name="heart" weight="fill" />
          </span>
        </div>
        <h2 className="ttl2" tabIndex={-1}>
          Pronto. Vocês estão ligados.
        </h2>
        <p className="lead" style={{ margin: 0, textAlign: 'center' }}>
          Tudo começa desligado. Você escolhe o que mostrar.
        </p>
        <div className="st-acts">
          <Button wide onClick={() => void navigate('/ajustes/a-dois', { replace: true })}>
            Escolher o que mostrar
          </Button>
          <Button wide variant="ghost" onClick={close}>
            Fechar
          </Button>
        </div>
      </div>
    );
  } else if (invite === undefined) {
    body = (
      <div className="st-inv" key="loading">
        <p className="lead" style={{ margin: 0, textAlign: 'center' }}>
          Abrindo o convite…
        </p>
      </div>
    );
  } else if (!valid) {
    const expired = !!invite && invite.status === 'pending' && invite.expiresAt <= now;
    body = (
      <div className="st-inv" key="invalid">
        <h2 className="ttl2" tabIndex={-1}>
          {mine ? 'Este convite é seu' : expired ? 'O convite venceu' : 'Este convite não vale mais'}
        </h2>
        <p className="lead" style={{ margin: 0, textAlign: 'center' }}>
          {mine
            ? 'Mande o link para a outra pessoa abrir no Prokopē dela.'
            : 'Peça um convite novo para quem convidou. Ele vale por 7 dias.'}
        </p>
        <div className="st-acts">
          <Button wide variant="secondary" onClick={close}>
            Fechar
          </Button>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="st-inv" key="invite">
        <div className="st-pair" aria-hidden="true">
          <span className="pk-avatar">{invite.fromName.charAt(0).toLocaleUpperCase('pt-BR')}</span>
          <span className="st-pair-heart">
            <Icon name="heart" />
          </span>
        </div>
        <h2 className="ttl2" tabIndex={-1}>{`${invite.fromName} convidou você para um espaço a dois`}</h2>
        <div className="st-pts" role="list">
          <Point icon="eye-slash">Cada um continua vendo só os próprios dados.</Point>
          <Point icon="toggle-left">Você escolhe o que mostrar. Tudo começa desligado.</Point>
          <Point icon="hand-heart">Dá para mandar um carinho. Sem placar e sem números.</Point>
        </div>
        <div className="st-acts">
          <Button wide disabled={state === 'busy'} onClick={() => void accept()}>
            Aceitar convite
          </Button>
          <Button
            wide
            variant="ghost"
            onClick={() => {
              void markInviteSeen(id).catch(() => undefined);
              close();
            }}
          >
            Agora não
          </Button>
        </div>
        {state === 'error' && (
          <p className="cap" style={{ color: 'var(--text-2)' }}>
            Não deu para aceitar agora. Confira a internet e tente de novo.
          </p>
        )}
        <p className="cap">Recusar não avisa ninguém. A ligação se desfaz em Ajustes&nbsp;›&nbsp;A&nbsp;dois.</p>
        {demo && <p className="cap">Na demonstração, aceitar o próprio convite mostra como fica a ligação.</p>}
      </div>
    );
  }

  return (
    <Sheet label={label}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={state === 'done' ? 'done' : 'main'}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ ...spring.calma, opacity: tween.micro }}
        >
          {body}
        </m.div>
      </AnimatePresence>
    </Sheet>
  );
}
