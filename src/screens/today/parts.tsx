// Peças menores do Hoje: a faixa de outro dia e o "Voltar para hoje", o aviso sem internet, o carinho recebido
// (A dois), o cartão da pausa, a faixa da corrida minimizada e o esqueleto de carregamento.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useNavigate } from 'react-router';
import { sendHug } from '@/actions';
import { Button, Face, Skeleton, SkeletonRow, Tag, type FaceLevel } from '@/components/ui';
import { Icon, type IconName } from '@/icons';
import {
  addDays,
  formatClockSeconds,
  formatDayHeader,
  formatDayMonth,
  moodWord,
  useConnection,
  useProfile,
  useRunLive,
  useSession,
  useTogether,
  weekDays,
  weekdayName,
  weekdayOf,
} from '@/data';
import type { DayKey, Pause } from '@/types';
import { distance, dur, spring, tween } from '@/motion/tokens';
import { haptic } from '@/motion/haptics';
import { startRunEngine } from '@/screens/run/engine';

// ---------- outro dia ----------

/** A faixa no lugar do cabeçalho: "Quarta, 21 de outubro · Você está vendo um dia que passou". */
export function PastDayBanner({ day }: { day: DayKey }) {
  const ref = useRef<HTMLHeadingElement>(null);
  // ao trocar de dia, o foco vai para a faixa
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [day]);
  return (
    <m.div
      className="td-pad td-past-wrap"
      initial={{ opacity: 0, y: -distance.rise }}
      animate={{ opacity: 1, y: 0, transition: tween.base }}
      exit={{ opacity: 0, transition: tween.exit }}
    >
      <div className="td-past" role="group" aria-label="Dia escolhido">
        <span className="pk-bub td-past-bub" aria-hidden="true">
          <Icon name="clock-counter-clockwise" weight="duotone" />
        </span>
        <h1 ref={ref} tabIndex={-1} aria-label={`${formatDayHeader(day)}. Você está vendo um dia que passou.`}>
          <AnimatePresence mode="popLayout" initial={false}>
            <m.b
              key={day}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: tween.micro }}
              exit={{ opacity: 0, transition: tween.micro }}
            >
              {formatDayHeader(day)}
            </m.b>
          </AnimatePresence>
          <small>Você está vendo um dia que passou</small>
        </h1>
      </div>
    </m.div>
  );
}

/** "Voltar para hoje", perto do polegar (acima da barra de abas). */
export function BackToToday({ onBack }: { onBack: () => void }) {
  return (
    <m.div
      className="td-back"
      initial={{ opacity: 0, y: distance.rise }}
      animate={{ opacity: 1, y: 0, transition: { ...tween.base, delay: 0.06 } }}
      exit={{ opacity: 0, transition: tween.exit }}
    >
      <Button icon="arrow-u-up-left" onClick={onBack}>
        Voltar para hoje
      </Button>
    </m.div>
  );
}

// ---------- sem internet ----------

type NetState = 'hidden' | 'offline' | 'synced';

/**
 * O aviso discreto abaixo do cabeçalho: entra quando a conexão cai por mais de 3 s (ou já está lá, parado,
 * se o Hoje abre sem internet). Quando volta e a fila sobe, vira "Tudo em dia" por 2 s e sai.
 */
export function OfflineNotice() {
  const connection = useConnection();
  const { mode } = useSession();
  const online = connection.online;
  // na demonstração não há servidor: a fila local nunca "sobe" (pendingWrites fica verdadeiro), então não espera
  const pending = mode === 'demo' ? false : connection.pending;
  const [state, setState] = useState<NetState>(() => (online ? 'hidden' : 'offline'));
  const [animateIn, setAnimateIn] = useState(false);
  useEffect(() => {
    if (!online) {
      if (state === 'offline') return;
      // queda curta não mostra nada; caiu de novo durante o "Tudo em dia": volta na hora
      const id = window.setTimeout(
        () => {
          setAnimateIn(true);
          setState('offline');
        },
        state === 'synced' ? 0 : 3000,
      );
      return () => window.clearTimeout(id);
    }
    if (state === 'offline' && !pending) {
      const id = window.setTimeout(() => setState('synced'), 0);
      return () => window.clearTimeout(id);
    }
    if (state === 'synced') {
      const id = window.setTimeout(() => setState('hidden'), 2000);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [online, pending, state]);

  return (
    <AnimatePresence initial={false}>
      {state !== 'hidden' && (
        <m.div
          key="off"
          className="td-off-wrap"
          initial={animateIn ? { height: 0, opacity: 0, y: -distance.rise } : false}
          animate={{
            height: 'auto',
            opacity: 1,
            y: 0,
            transition: { height: spring.calma, opacity: tween.base, y: tween.base },
          }}
          exit={{ height: 0, opacity: 0, y: -distance.rise, transition: { duration: dur.micro, ease: [0.4, 0, 1, 1] } }}
        >
          <div className="td-pad td-off-pad">
            <div className="td-off" role="status">
              <AnimatePresence mode="popLayout" initial={false}>
                {state === 'offline' ? (
                  <m.span
                    key="o"
                    className="td-off-in"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: tween.micro }}
                    exit={{ opacity: 0, transition: tween.micro }}
                  >
                    <Icon name="cloud-slash" weight="regular" />
                    <span>
                      <b>Sem internet.</b> Tudo continua salvo aqui e sobe quando voltar.
                    </span>
                  </m.span>
                ) : (
                  <m.span
                    key="s"
                    className="td-off-in"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: tween.micro }}
                    exit={{ opacity: 0, transition: tween.micro }}
                  >
                    <Icon name="cloud-check" weight="regular" />
                    <span>
                      <b>Tudo em dia.</b>
                    </span>
                  </m.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

// ---------- A dois ----------

const hugSeen = new Set<string>();

/** O carinho recebido: um cartão discreto no topo até o fim do dia (vários viram um só, sem contagem). */
export function HugCard() {
  const t = useTogether();
  const [first] = useState(() => {
    const key = t.hugsToday[0]?.day ?? '';
    return !hugSeen.has(key);
  });
  const day = t.hugsToday[0]?.day;
  useEffect(() => {
    if (day) hugSeen.add(day);
  }, [day]);
  if (!t.hugsToday.length) return null;
  const name = t.partner?.name || 'Alguém';
  return (
    <m.div
      className="td-pad"
      initial={first ? { opacity: 0, y: distance.rise } : false}
      animate={{ opacity: 1, y: 0, transition: tween.base }}
    >
      <div className="td-hug" data-pillar="accent" role="status">
        <span className="pk-bub td-hug-bub" aria-hidden="true">
          <Icon name="hand-heart" weight="duotone" />
        </span>
        <span>
          <b>{name} mandou um carinho</b>
        </span>
      </div>
    </m.div>
  );
}

/** Como a outra pessoa aparece no Hoje (A dois): o nome, o rostinho se ela compartilha e o botão de carinho. */
export function PeerCard() {
  const t = useTogether();
  // "Enviado" por 60 s, que também é o limite de um carinho por minuto
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (!sent) return;
    const id = window.setTimeout(() => setSent(false), 60_000);
    return () => window.clearTimeout(id);
  }, [sent]);
  if (!t.linked || !t.partner) return null;
  const share = t.partnerShare;
  const mood = share?.mood && share.moodToday ? share.moodToday.mood : null;
  return (
    <div className="td-peer" data-flip="peer">
      <span className="td-peer-av" aria-hidden="true">
        {t.partner.name.charAt(0).toLocaleUpperCase('pt-BR')}
      </span>
      <span className="td-peer-t">
        <b>{t.partner.name}</b>
        {mood ? (
          <small className="td-peer-mood">
            <Face kind="mood" level={mood as FaceLevel} size={16} />
            {moodWord(mood)} hoje
          </small>
        ) : (
          <small>Nada compartilhado</small>
        )}
      </span>
      <button
        type="button"
        className="pk-reset td-hugbtn pk-press hit"
        disabled={sent}
        aria-label={sent ? 'Carinho enviado' : `Mandar um carinho para ${t.partner.name}`}
        onClick={() => {
          haptic();
          setSent(true);
          void sendHug();
        }}
      >
        <Icon name={sent ? 'heart' : 'hand-heart'} weight={sent ? 'fill' : 'regular'} />
        {sent ? 'Enviado' : 'Carinho'}
      </button>
    </div>
  );
}

// ---------- pausa ----------

const REASONS: Record<string, { label: string; icon: IconName }> = {
  vacation: { label: 'Férias', icon: 'tree-palm' },
  sick: { label: 'Doença', icon: 'thermometer-simple' },
  travel: { label: 'Viagem', icon: 'airplane-tilt' },
};

/** O centro do Hoje pausado: "Pausa até 2 de janeiro", o motivo e o "Encerrar a pausa", discreto. */
export function PauseCard({ pause, onEnd, past }: { pause: Pause; onEnd: () => void; past: boolean }) {
  const profile = useProfile();
  const back = addDays(pause.end, 1);
  const reason = pause.reason ? REASONS[pause.reason] : undefined;
  const reviewDay = profile?.weeklyReview?.weekday;
  const withReview = reviewDay !== undefined && weekdayOf(back) === reviewDay;
  return (
    <div className="pk-card td-pause" data-pillar="accent" data-flip="pause">
      <span className="pk-bub lg td-pause-bub" aria-hidden="true">
        <Icon name={reason?.icon ?? 'pause'} weight="duotone" />
      </span>
      <h2 className="ttl2">Pausa até {formatDayMonth(pause.end)}</h2>
      {reason && <Tag pillar="accent">{reason.label}</Tag>}
      <p>Nada fica pendente. Estes dias não contam na constância nem na força dos hábitos.</p>
      <span className="cap">
        Tudo volta {weekdayOf(back) === 6 ? 'no' : 'na'} {weekdayName(back)}, {formatDayMonth(back)}
        {withReview ? ', com a revisão da semana.' : '.'}
      </span>
      {!past && (
        <Button variant="ghost" onClick={onEnd}>
          Encerrar a pausa
        </Button>
      )}
    </div>
  );
}

// ---------- corrida minimizada ----------

const BLOCK_NAMES: Record<string, string> = {
  run: 'Trote',
  walk: 'Caminhada',
  warmup: 'Aquecimento',
  cooldown: 'Volta à calma',
};

/** A faixa da corrida em andamento, fixa no topo do Hoje, na cor do pilar da corrida. */
export function RunStrip({ pillar }: { pillar?: string }) {
  const live = useRunLive();
  const navigate = useNavigate();
  const runId = live?.run.id;
  // o motor da corrida (som das trocas, vibração, trava da tela) continua com o treino minimizado
  useEffect(() => {
    if (runId) startRunEngine();
  }, [runId]);
  if (!live) return null;
  const { run, position, paused } = live;
  const base = `/corrida/${run.week}/${run.session}`;
  const done = position.done;
  const phase = BLOCK_NAMES[position.block.kind] ?? 'Treino';
  const hued = pillar && !['mente', 'alim', 'corpo', 'familia', 'accent'].includes(pillar);
  return (
    <m.button
      type="button"
      className={hued ? 'pk-reset td-run hued' : 'pk-reset td-run'}
      data-pillar={hued ? undefined : (pillar ?? 'corpo')}
      data-hue={hued ? pillar : undefined}
      initial={{ y: '-100%' }}
      animate={{ y: 0, transition: tween.base }}
      onClick={() => void navigate(done ? `${base}/feito` : base)}
      aria-label={
        done
          ? 'Treino completo. Ver resumo'
          : `Corrida em andamento, ${phase.toLocaleLowerCase('pt-BR')}, faltam ${Math.ceil(position.remaining)} segundos${position.interval > 0 ? `, intervalo ${position.interval} de ${position.intervals}` : ''}. Abrir`
      }
    >
      {done ? (
        <span className="td-run-t">
          <Icon name="check" weight="bold" />
          Treino completo · ver resumo
        </span>
      ) : (
        <>
          <span className="td-run-t" aria-live="polite">
            <Icon name="person-simple-run" weight="fill" />
            {phase}
            {paused ? ' · pausado' : ''}
          </span>
          <span className="td-run-clock pk-num" aria-hidden="true">
            {formatClockSeconds(position.remaining)}
          </span>
          {position.interval > 0 && (
            <span className="td-run-i" aria-hidden="true">
              intervalo {position.interval} de {position.intervals}
            </span>
          )}
        </>
      )}
    </m.button>
  );
}

// ---------- carregando ----------

const LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

/** O esqueleto do Hoje: a semana pinta na hora (vem do aparelho); o resto espera 300 ms e respira junto. */
export function TodaySkeleton({ today }: { today: DayKey }) {
  const [slow, setSlow] = useState(false);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const a = window.setTimeout(() => setShown(true), 300);
    const b = window.setTimeout(() => setSlow(true), 8000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);
  return (
    <div aria-busy="true" className="td-skel">
      <span className="pk-sr" role="status">
        Carregando o seu dia.
      </span>
      <div className="td-pad" aria-hidden="true">
        <div className="pk-card pk-wkc td-skel-wk">
          <div className="pk-wkh">
            {shown && (
              <>
                <Skeleton width={132} height={14} shape="pill" />
                <Skeleton width={96} height={12} shape="pill" />
              </>
            )}
          </div>
          <ul className="pk-wk">
            {weekDays(today).map((d, i) => (
              <li key={d} className={d === today ? 'pk-wkd today' : 'pk-wkd'}>
                <span className="in">
                  <span>{LETTERS[i]}</span>
                  <span className="rg td-skel-rg">
                    <b>{Number(d.slice(8))}</b>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {shown && (
        <m.div
          className="td-skel-body pk-skel-g"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: tween.micro }}
        >
          <div className="td-skel-gl">
            <Skeleton width={64} height={10} shape="pill" />
          </div>
          <div className="td-pad">
            <div className="pk-card pk-lst">
              <SkeletonRow title={0.42} />
              <SkeletonRow title={0.36} />
              <SkeletonRow title={0.76} />
            </div>
          </div>
          <div className="td-skel-gl">
            <Skeleton width={110} height={10} shape="pill" />
          </div>
          <div className="td-pad">
            <div className="pk-card pk-lst">
              <SkeletonRow title={0.46} />
              <SkeletonRow title={0.64} />
            </div>
          </div>
        </m.div>
      )}
      {slow && (
        <m.p
          className="td-slow cap"
          initial={{ opacity: 0, y: distance.rise }}
          animate={{ opacity: 1, y: 0, transition: tween.base }}
        >
          Está demorando. Confira a internet.
        </m.p>
      )}
    </div>
  );
}
