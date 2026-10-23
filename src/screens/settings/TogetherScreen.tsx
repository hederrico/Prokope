// A dois: um espaço sem placar. O convite é um link (Web Share API no iPhone; no computador, copia o link). A prévia
// mostra exatamente o que a outra pessoa vê no Hoje dela: o nome, o rostinho (se ligado) e o botão de carinho.
// Tudo começa desligado (ajustes-rotina-conta.md › A dois).
import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useNavigate } from 'react-router';
import { NavBar, showToast, showUndo } from '@/components/shell';
import {
  AddRow,
  Button,
  Face,
  ListGroup,
  ListItem,
  PillarBubble,
  SectionLabel,
  Switch,
  type FaceLevel,
} from '@/components/ui';
import { formatDayShort, logicalDay, useConnection, useHabits, useProfile, useSession, useTogether } from '@/data';
import { cancelInvite, createInvite, inviteUrl, setSharedHabit, setSharing, unlink } from '@/actions';
import { useNow } from '@/data/useDomain';
import { Icon } from '@/icons';
import { spring, tween } from '@/motion/tokens';
import { ChoiceSheet, Foot, Row } from './parts';
import { habitLine } from './habitText';
import './settings.css';

function isTouchDevice(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}

/** Compartilha o link pela folha do iPhone; no computador (ou se a folha não abrir), copia. */
async function shareLink(url: string, name: string): Promise<'shared' | 'copied' | 'failed'> {
  const text = `${name} convidou você para um espaço a dois no Prokopē.`;
  if (typeof navigator.share === 'function' && isTouchDevice()) {
    try {
      await navigator.share({ title: 'Prokopē a dois', text, url });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'shared';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export default function TogetherScreen() {
  const together = useTogether();
  const navigate = useNavigate();
  const session = useSession();
  const profile = useProfile();
  const { online } = useConnection();
  const { now } = useNow();
  const habits = useHabits('all');
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const myName = session.user?.name || profile?.name || 'Você';
  const linked = together.linked;
  const invite = together.invite;
  const expired = !invite && together.invites.some((i) => i.status === 'pending' && i.expiresAt <= now);
  const myShare = together.myShare;
  const partnerShare = together.partnerShare;

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let url = invite ? inviteUrl(invite.id) : null;
      if (!url) url = (await createInvite()).url ?? null;
      if (!url) return;
      const r = await shareLink(url, myName);
      if (r === 'copied')
        showToast({ title: 'Link copiado', detail: 'Cole no WhatsApp ou onde preferir.', icon: 'link' });
      if (r === 'failed')
        showToast({ title: 'Convite pronto', detail: 'Toque em Compartilhar convite de novo para mandar.' });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!invite) return;
    const undo = await cancelInvite(invite.id);
    showUndo({ title: 'Convite cancelado', icon: 'link' }, () => void undo());
  };

  const undoLink = async () => {
    const undo = await unlink();
    showUndo({ title: 'Ligação desfeita', icon: 'heart' }, () => void undo());
  };

  // hábitos a dois: os de papel "a dois" e os que esta pessoa já ligou
  const sharedIds = new Set(myShare?.habits ?? []);
  const candidates = habits.filter(
    (h) => h.status !== 'archived' && (h.habit.role === 'together' || sharedIds.has(h.habit.id)),
  );
  const unique = [...new Map(candidates.map((h) => [h.habit.id, h])).values()];
  const others = habits.filter((h) => h.status !== 'archived' && !unique.some((u) => u.habit.id === h.habit.id));
  const otherUnique = [...new Map(others.map((h) => [h.habit.id, h])).values()];

  const moodToday = myShare?.moodToday ?? null;
  const today = logicalDay(now);
  const showMood = !!myShare?.mood;
  const moodLevel =
    moodToday && moodToday.day === today ? (Math.max(1, Math.min(5, moodToday.mood)) as FaceLevel) : null;

  let inviteCard: React.ReactNode;
  if (linked) {
    const partner = together.partner?.name || 'a outra pessoa';
    inviteCard = (
      <div className="st-card st-invite">
        <div className="st-invite-head">
          <span className="pk-avatar" style={{ width: 40, height: 40, fontSize: 17 }} aria-hidden="true">
            {partner.charAt(0).toLocaleUpperCase('pt-BR')}
          </span>
          <span>
            <b>{`Ligado a ${partner}`}</b>
            <small>Cada um continua vendo só os próprios dados.</small>
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void undoLink()}>
          Desfazer a ligação
        </Button>
      </div>
    );
  } else if (invite) {
    inviteCard = (
      <div className="st-card st-invite">
        <div className="st-invite-head">
          <PillarBubble icon="link" pillar="accent" size="md" />
          <span>
            <b>{`Convite pronto · vale até ${formatDayShort(logicalDay(invite.expiresAt))}`}</b>
            <small>Mande o link pelo WhatsApp ou como preferir.</small>
          </span>
        </div>
        <Button wide variant="secondary" icon="share-network" disabled={busy} onClick={() => void share()}>
          Compartilhar de novo
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void cancel()}>
          Cancelar convite
        </Button>
        {session.mode === 'demo' && (
          <Button variant="ghost" size="sm" onClick={() => void navigate(`/convite/${encodeURIComponent(invite.id)}`)}>
            Abrir o convite aqui (demonstração)
          </Button>
        )}
      </div>
    );
  } else {
    inviteCard = (
      <div className="st-card st-invite">
        {expired && (
          <div className="st-invite-head">
            <span>
              <b>O convite venceu</b>
              <small>Crie outro e mande de novo. Vale por 7 dias.</small>
            </span>
          </div>
        )}
        <Button wide icon="share-network" disabled={!online || busy} onClick={() => void share()}>
          {expired ? 'Criar outro' : 'Compartilhar convite'}
        </Button>
        {!online && (
          <p className="cap" style={{ margin: 0, textAlign: 'center' }}>
            Precisa de internet para criar o convite
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="st-screen">
      <NavBar />
      <div className="st-pad st-phero c">
        <PillarBubble icon="heart" size="lg" className="st-heart" />
        <h1 className="ttl2" style={{ marginTop: 4 }} tabIndex={-1}>
          Um espaço a dois, sem placar
        </h1>
        <p className="lead" style={{ maxWidth: 310 }}>
          Cada pessoa continua vendo só os próprios dados. Aqui vocês escolhem o que compartilhar.
        </p>
      </div>

      <SectionLabel>Convite</SectionLabel>
      <div className="st-pad">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.div
            key={linked ? 'linked' : invite ? 'invite' : 'none'}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ...spring.calma, opacity: tween.micro }}
          >
            {inviteCard}
          </m.div>
        </AnimatePresence>
      </div>
      <Foot>
        O convite é um link que vale por 7 dias e funciona uma vez. Mande pelo WhatsApp ou como preferir. Qualquer um
        dos dois pode desfazer a ligação.
      </Foot>

      <SectionLabel>O que a outra pessoa vê</SectionLabel>
      <div className="st-pad">
        <ul className="pk-lg" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          <li className="st-prev" aria-label="Prévia: assim você aparece no Hoje da outra pessoa">
            <span>Assim você aparece no Hoje dela</span>
            <div className="st-peer" aria-hidden="true">
              <span className="pk-avatar">{myName.charAt(0).toLocaleUpperCase('pt-BR')}</span>
              <span className="grow">
                <b>{myName}</b>
                <AnimatePresence mode="wait" initial={false}>
                  {showMood ? (
                    <m.small key="mood" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {moodLevel ? (
                        <m.span
                          initial={{ scale: 0.6 }}
                          animate={{ scale: 1 }}
                          transition={spring.toque}
                          style={{ display: 'inline-flex' }}
                        >
                          <Face kind="mood" level={moodLevel} size={18} selected />
                        </m.span>
                      ) : (
                        <Icon name="smiley" weight="regular" />
                      )}
                      {moodLevel ? 'Como está hoje' : 'O rostinho aparece depois do check-in'}
                    </m.small>
                  ) : (
                    <m.small key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Nada compartilhado
                    </m.small>
                  )}
                </AnimatePresence>
              </span>
              <span className="st-hug">
                <Icon name="hand-heart" />
                Carinho
              </span>
            </div>
          </li>
          <li className={linked ? undefined : 'st-sw-dis'}>
            <ListItem
              icon="smiley"
              pillar="accent"
              title="Como estou hoje"
              subtitle="O rostinho do humor do dia, sem números."
              toggle={{
                checked: !!myShare?.mood,
                disabled: !linked,
                onCheckedChange: (on) => void setSharing({ mood: on }),
              }}
            />
          </li>
        </ul>
      </div>

      <SectionLabel>Hábitos a dois</SectionLabel>
      <div className="st-pad">
        {unique.length > 0 && (
          <ListGroup>
            {unique.map(({ habit, pillar, status }) => {
              const on = sharedIds.has(habit.id);
              const partnerOn = partnerShare?.habits?.includes(habit.id);
              const sub =
                on && linked && !partnerOn
                  ? 'esperando a outra pessoa'
                  : [
                      habit.goal.perWeek ? `${habit.goal.perWeek} por semana` : habitLine(habit, profile, false),
                      status === 'upcoming' && habit.phase ? `entra na fase ${habit.phase}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ');
              return (
                <div key={habit.id} className={linked ? undefined : 'st-sw-dis'}>
                  <Row
                    icon={habit.icon}
                    pillar={pillar?.color}
                    title={habit.name}
                    subtitle={sub}
                    trailing={
                      <Switch
                        label={`${habit.name} como hábito a dois`}
                        checked={on}
                        disabled={!linked}
                        onCheckedChange={(v) => void setSharedHabit(habit.id, v)}
                      />
                    }
                  />
                </div>
              );
            })}
          </ListGroup>
        )}
        <div className="st-add">
          <AddRow onClick={() => setPicking(true)}>Escolher outro hábito</AddRow>
        </div>
      </div>
      <Foot>Um hábito vira a dois só quando os dois ligam. Os dois veem e qualquer um marca.</Foot>
      {!linked && <Foot>Os interruptores valem depois que vocês se ligarem pelo convite.</Foot>}
      <Foot icon="hand-heart">
        Ninguém vê número, contagem ou sequência do outro. A única interação é mandar um carinho.
      </Foot>

      <ChoiceSheet
        open={picking}
        onOpenChange={setPicking}
        title="Escolher outro hábito"
        value={undefined}
        options={otherUnique.map((h) => ({
          value: h.habit.id,
          label: h.habit.name,
          icon: h.habit.icon,
          pillar: h.pillar?.color,
        }))}
        onChange={(id) => {
          if (linked) void setSharedHabit(id, true);
          else
            showToast({
              title: 'Primeiro, o convite',
              detail: 'Escolha os hábitos a dois depois que vocês se ligarem.',
            });
        }}
      />
    </div>
  );
}
