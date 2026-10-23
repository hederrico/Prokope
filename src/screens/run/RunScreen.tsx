// Treino em andamento (jornada.md › Treino em andamento). Usado na rua, sem olhar, com o celular no braço:
// esforço em cor cheia, descanso em tom claro, e o número grande é o que falta para a troca. Os blocos e os nomes
// (correr e caminhar, pedalar e pedalar leve) vêm do plano do hábito da rota (/treino/:habito/:semana/:treino; a rota
// antiga /corrida/:semana/:treino é a do primeiro treino guiado).
// O tempo vem sempre da hora de início e das pausas (sobrevive a recarregar e à tela bloqueada). O som das trocas,
// a contagem e a vibração ficam no motor (engine.ts), que segue rodando com o treino minimizado.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AnimatePresence, LayoutGroup, m } from 'motion/react';
import clsx from 'clsx';
import { FullScreen, Sheet, showUndo, useGoBack } from '@/components/shell';
import { Button, PillarBubble, pillarAttrs } from '@/components/ui';
import { Icon, type IconName } from '@/icons';
import { discardRun, finishRun, pauseRun, readRunCopy, resumeRun, setRunSound, startRun } from '@/actions';
import {
  formatClockSeconds,
  intervalsCompleted,
  planWeek,
  useDataStatus,
  usePillars,
  usePrefs,
  useRunLive,
  useRunPlan,
  type RunBlock,
  type RunPosition,
  type TrainingNames,
} from '@/data';
import { distance, dur, fadeUp, tween, usePrefersReducedMotion } from '@/motion';
import { nowMs } from '@/stores/clock';
import type { Run } from '@/types';
import { IntervalStrip } from './IntervalStrip';
import { onRunEvent, positionOf, releaseWakeLock, requestWakeLock, startRunEngine, useWakeLock, weekOf } from './engine';
import { runDonePath, runPath } from './paths';
import { blockIcon, blockWord, blockWordLower } from './words';
import './run.css';

// ---------- textos ----------

/** "1 minuto e 30 segundos", "40 segundos", "5 minutos" (para o leitor de tela). */
function spokenDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const min = Math.floor(s / 60);
  const rest = s % 60;
  const parts: string[] = [];
  if (min) parts.push(`${min} ${min === 1 ? 'minuto' : 'minutos'}`);
  if (rest || !min) parts.push(`${rest} ${rest === 1 ? 'segundo' : 'segundos'}`);
  return parts.join(' e ');
}

function agoText(seconds: number): string {
  const s = Math.max(1, Math.round(seconds));
  return s < 60 ? `${s} s` : `${Math.round(s / 60)} min`;
}

function progressText(pos: RunPosition): string {
  if (pos.block.kind === 'warmup') return 'aquecimento';
  if (pos.block.kind === 'cooldown') return 'volta à calma';
  return `intervalo ${pos.interval} de ${pos.intervals}`;
}

function blockAnnouncement(pos: RunPosition, names: TrainingNames): string {
  const base = `${blockWord(pos.block.kind, names)}, ${spokenDuration(pos.block.seconds)}.`;
  return pos.block.kind === 'effort' || pos.block.kind === 'rest'
    ? `${base} Intervalo ${pos.interval} de ${pos.intervals}.`
    : base;
}

// ---------- a tela ----------

export default function RunScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { status } = useDataStatus();
  // o treino guiado da rota (sem :habito, a rota antiga da corrida: o primeiro treino guiado)
  const plan = useRunPlan(params.habito ?? null);
  const week = Math.min(plan.weeks.length, Math.max(1, Number(params.semana) || 1));
  const session = Math.max(1, Number(params.treino) || 1);
  const habitId = plan.habit?.id ?? null;
  const pillars = usePillars({ includeArchived: true });
  const prefs = usePrefs();
  const reduced = usePrefersReducedMotion();
  const wake = useWakeLock((s) => s.state);

  // ---------- o treino: retoma o que está em andamento ou começa um novo ----------
  const [startedId, setStartedId] = useState<string | null>(null);
  const starting = useRef(false);
  // esta tela já teve um treino (retomado ou começado): salvar ou descartar não pode começar outro sozinho
  const hadRun = useRef(false);
  const [waitedCopy, setWaitedCopy] = useState(false);
  const active = plan.activeRun;
  const runId = active?.id ?? startedId;
  useEffect(() => {
    if (status !== 'ready') return undefined;
    if (active) {
      hadRun.current = true;
      // um treino de cada vez: o que está em andamento (deste ou de outro treino guiado) é o que abre
      if (active.habitId !== habitId || active.week !== week || active.session !== session)
        void navigate(runPath(active.habitId, active.week, active.session), {
          replace: true,
          state: { transition: 'none' },
        });
      return undefined;
    }
    if (!habitId || startedId || starting.current || hadRun.current) return undefined;
    // a cópia local diz que há um treino que ainda não chegou dos dados: espera um pouco
    const copy = readRunCopy();
    if (!waitedCopy && copy && nowMs() - copy.startedAt < 2 * 3_600_000) {
      const t = setTimeout(() => setWaitedCopy(true), 1500);
      return () => clearTimeout(t);
    }
    starting.current = true;
    void startRun({ week, session, habitId }).then((u) => u.id && setStartedId(u.id));
    return undefined;
  }, [status, active, startedId, week, session, navigate, waitedCopy, habitId]);

  const live = useRunLive(runId ?? undefined, 4);
  const run = live?.run ?? null;
  const runRef = useRef<Run | null>(run);
  useLayoutEffect(() => {
    runRef.current = run;
  });

  // motor (som, contagem, vibração) e a trava da tela
  useEffect(() => {
    startRunEngine();
  }, [run?.id]);
  useEffect(() => {
    if (run?.status === 'running') void requestWakeLock();
  }, [run?.id, run?.status]);

  const habit = live?.habit ?? plan.habit;
  const names = live?.names ?? plan.names;
  const pillar = pillars.find((p) => p.pillar.id === habit?.pillarId)?.pillar;
  const color = pillar?.color ?? 'damasco';
  const attrs = pillarAttrs(color);
  const word = (kind: RunBlock['kind']) => blockWord(kind, names);
  const icon = (kind: RunBlock['kind']): IconName => blockIcon(kind, names, habit?.icon);

  const pos = live?.position ?? null;
  const paused = run?.status === 'paused';
  const planBlocks = useMemo(() => planWeek(plan.plan, week).blocks, [plan.plan, week]);
  const blocks = live?.week.blocks ?? planBlocks;

  // ---------- fim do treino ----------
  // a rota antiga (/corrida/:semana/:treino) termina na antiga; a de cada treino guiado, na dele
  const doneRoute = params.habito
    ? runDonePath(run?.habitId ?? habitId ?? '', run?.week ?? week, run?.session ?? session)
    : `/corrida/${run?.week ?? week}/${run?.session ?? session}/feito`;
  const goDone = useCallback(() => {
    void navigate(doneRoute, { replace: true, state: { transition: 'none' } });
  }, [navigate, doneRoute]);
  useEffect(() => {
    if (pos?.done && run?.status === 'running' && document.visibilityState === 'visible') goDone();
  }, [pos?.done, run?.status, goDone]);

  // ---------- região viva ----------
  const namesRef = useRef(names);
  useLayoutEffect(() => {
    namesRef.current = names;
  });
  const [said, setSaid] = useState('');
  const say = useCallback((text: string) => {
    setSaid('');
    requestAnimationFrame(() => setSaid(text));
  }, []);
  useEffect(
    () =>
      onRunEvent((e) => {
        if (e.run.id !== runRef.current?.id || e.type !== 'block') return;
        say(blockAnnouncement(e.position, namesRef.current));
      }),
    [say],
  );

  // ---------- volta ao app ----------
  const hiddenAt = useRef<{ index: number } | null>(null);
  const [back, setBack] = useState<{ key: number; kind: RunBlock['kind']; ago: number } | null>(null);
  useEffect(() => {
    const onVis = () => {
      const r = runRef.current;
      if (!r) return;
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = { index: positionOf(r).index };
        return;
      }
      const was = hiddenAt.current;
      hiddenAt.current = null;
      if (!was || r.status !== 'running') return;
      const p = positionOf(r);
      if (p.done) return goDone();
      if (p.index !== was.index) {
        setBack({ key: nowMs(), kind: p.block.kind, ago: p.inBlock });
        say(
          `O treino seguiu com a tela bloqueada. Agora: ${blockWordLower(p.block.kind, namesRef.current)}, faltam ${spokenDuration(p.remaining)}.`,
        );
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [goDone, say]);
  useEffect(() => {
    if (!back) return;
    const t = setTimeout(() => setBack(null), 5000);
    return () => clearTimeout(t);
  }, [back]);

  // ---------- anel: anda a cada quadro, pela hora de início ----------
  const arcRef = useRef<SVGCircleElement>(null);
  const R = 117;
  const C = 2 * Math.PI * R;
  useEffect(() => {
    let raf = 0;
    const born = performance.now();
    const drawIn = reduced ? 0 : dur.ring * 1000;
    const loop = () => {
      const r = runRef.current;
      const arc = arcRef.current;
      if (r && arc) {
        const p = positionOf(r);
        let v = p.block.seconds ? p.inBlock / p.block.seconds : 0;
        // na chegada, o anel se desenha uma vez em ring (depois avança sozinho, sem token)
        const t = drawIn ? Math.min(1, (performance.now() - born) / drawIn) : 1;
        if (t < 1) v *= 1 - Math.pow(1 - t, 3);
        arc.style.strokeDashoffset = String(C * (1 - Math.min(1, Math.max(0, v))));
        arc.style.opacity = v > 0.001 ? '1' : '0';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [C, reduced, run?.id]);

  // ---------- controles ----------
  const [endOpen, setEndOpen] = useState(false);
  const [dimOpen, setDimOpen] = useState(false);
  const onPause = async () => {
    if (!run) return;
    if (run.status === 'running') {
      await pauseRun(run.id);
      say('Pausado');
    } else {
      await resumeRun(run.id);
      say('Continuando');
      void requestWakeLock();
    }
  };
  const soundOn = prefs.runSound ?? true;

  const save = async () => {
    if (!run) return;
    setEndOpen(false);
    await finishRun(run.id);
    releaseWakeLock();
    goDone();
  };
  const discard = async () => {
    if (!run) return;
    setEndOpen(false);
    const undo = await discardRun(run.id);
    releaseWakeLock();
    goBack('/hoje');
    showUndo({ title: 'Treino descartado', icon: 'person-simple-run', pillar: 'accent' }, () => void undo());
  };

  const kind = pos?.block.kind ?? blocks[0]?.kind ?? 'warmup';
  const trot = kind === 'effort';
  const remaining = pos ? Math.ceil(pos.remaining - 1e-6) : 0;
  const counting = !!pos && !paused && !pos.done && remaining >= 1 && remaining <= 3;
  const clockText = counting ? String(remaining) : formatClockSeconds(remaining);
  const next = pos?.next ?? null;
  const title = `Semana ${run?.week ?? week} · treino ${run?.session ?? session}`;
  const timerLabel = pos
    ? `${word(kind)}, faltam ${spokenDuration(pos.remaining)}${paused ? ', pausado' : ''}. ${
        next ? `Depois: ${blockWordLower(next.kind, names)}, ${spokenDuration(next.seconds)}.` : 'Último bloco.'
      } Tempo total ${spokenDuration(pos.elapsed)}, ${progressText(pos)}.`
    : 'Preparando o treino';

  // a rota aponta para um treino guiado que não existe mais (e nada está em andamento)
  if (status === 'ready' && !habit && !active && !run) {
    return (
      <FullScreen footer={<Button wide onClick={() => goBack('/hoje')}>Voltar ao dia</Button>}>
        <div className="rn-done">
          <h1 className="lt">Treino</h1>
          <p className="sub muted">Este treino não está mais por aqui.</p>
        </div>
      </FullScreen>
    );
  }

  return (
    <FullScreen top={<></>}>
      <div className={clsx('rn-full', trot ? 'trot' : 'walk', attrs.className)} data-pillar={attrs['data-pillar']} data-hue={attrs['data-hue']}>
        <div className="rn">
          <div className="rn-top">
            <button type="button" className="rn-btn" aria-label="Minimizar treino" onClick={() => goBack()}>
              <Icon name="caret-down" weight="bold" />
            </button>
            <span>
              <h1 tabIndex={-1}>{title}</h1>
              {wake === 'on' ? (
                <span className="rn-awake">
                  <Icon name="lightbulb" weight="regular" />
                  Tela acesa
                </span>
              ) : (
                <button type="button" className="rn-awake hit" onClick={() => setDimOpen(true)}>
                  <Icon name="lightbulb" weight="regular" />A tela pode apagar
                </button>
              )}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={soundOn}
              className="rn-btn"
              aria-label="Som nas trocas"
              onClick={() => void setRunSound(!soundOn)}
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={soundOn ? 'on' : 'off'}
                  style={{ display: 'grid' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: tween.micro }}
                  exit={{ opacity: 0, transition: tween.micro }}
                >
                  <Icon name={soundOn ? 'speaker-high' : 'speaker-slash'} weight="fill" />
                </m.span>
              </AnimatePresence>
            </button>
          </div>

          <AnimatePresence>
            {back && (
              <m.div
                key={back.key}
                className="rn-back"
                role="status"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: distance.rise }}
                animate={{ opacity: 1, y: 0, transition: tween.base }}
                exit={{ opacity: 0, transition: tween.micro }}
              >
                <PillarBubble icon="lock-simple-open" pillar={color} />
                <span>
                  <b>O treino seguiu com a tela bloqueada</b>
                  <small>
                    Agora: {blockWordLower(back.kind, names)}, há {agoText(back.ago)}. Os avisos voltaram.
                  </small>
                </span>
              </m.div>
            )}
          </AnimatePresence>

          <div className="rn-c">
            <AnimatePresence mode="wait" initial={false}>
              <m.span
                key={pos ? `${pos.index}` : 'x'}
                className={clsx('rn-state', word(kind).length > 10 && 'long')}
                initial={reduced ? { opacity: 0 } : fadeUp.initial}
                animate={reduced ? { opacity: 1, transition: tween.micro } : fadeUp.animate}
                exit={{ opacity: 0, transition: tween.micro }}
              >
                <Icon name={icon(kind)} weight="bold" />
                {word(kind)}
              </m.span>
            </AnimatePresence>

            <button type="button" className="rn-ring" role="timer" aria-live="off" aria-label={timerLabel} onClick={() => say(timerLabel)}>
              <svg viewBox="0 0 248 248" aria-hidden="true">
                <circle className="trk" cx="124" cy="124" r={R} fill="none" strokeWidth="14" />
                <circle
                  ref={arcRef}
                  className="arc"
                  cx="124"
                  cy="124"
                  r={R}
                  fill="none"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={C.toFixed(3)}
                  strokeDashoffset={C.toFixed(3)}
                />
              </svg>
              <span className="rc" aria-hidden="true">
                {counting ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <m.span
                      key={clockText}
                      className="rn-clock"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: tween.micro }}
                      exit={{ opacity: 0, transition: tween.micro }}
                    >
                      {clockText}
                    </m.span>
                  </AnimatePresence>
                ) : (
                  <span className="rn-clock">{clockText}</span>
                )}
                <span className="rn-left">{paused ? 'pausado' : 'faltam'}</span>
              </span>
            </button>

            <span className={clsx('rn-next', counting && 'soon')}>
              {next ? (
                <>
                  <Icon name={icon(next.kind)} weight="bold" />
                  Depois: {blockWordLower(next.kind, names)} <b>{formatClockSeconds(next.seconds)}</b>
                </>
              ) : (
                <>
                  <Icon name="flag-banner" weight="bold" />
                  Depois: fim do treino
                </>
              )}
            </span>
          </div>

          <div className="rn-b">
            <LayoutGroup id="rn-strip">
              <IntervalStrip blocks={blocks} current={pos?.index ?? 0} outlineId="rn-cur" />
            </LayoutGroup>
            <p>
              Tempo total {formatClockSeconds(pos?.elapsed ?? 0)} · {pos ? progressText(pos) : 'aquecimento'}
            </p>
          </div>

          <div className="rn-ctl">
            <HoldToEnd onDone={() => setEndOpen(true)} />
            <span className="rn-cb">
              <button
                type="button"
                className="rn-rb p"
                aria-label={paused ? 'Continuar treino' : 'Pausar treino'}
                onClick={() => void onPause()}
                disabled={!run}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <m.span
                    key={paused ? 'play' : 'pause'}
                    style={{ display: 'grid' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: tween.micro }}
                    exit={{ opacity: 0, transition: tween.micro }}
                  >
                    <Icon name={paused ? 'play' : 'pause'} weight="fill" />
                  </m.span>
                </AnimatePresence>
              </button>
              <span aria-hidden="true">{paused ? 'Continuar' : 'Pausar'}</span>
            </span>
          </div>
          <button type="button" className="rn-sr" onClick={() => setEndOpen(true)}>
            Encerrar treino
          </button>
          <div className="rn-sr" aria-live="polite" aria-atomic="true">
            {said}
          </div>
        </div>
      </div>

      <EndSheet
        open={endOpen}
        onOpenChange={setEndOpen}
        run={run}
        onSave={() => void save()}
        onDiscard={() => void discard()}
      />
      <Sheet open={dimOpen} onOpenChange={setDimOpen} title="A tela pode apagar">
        <div className="rn-sheet">
          <p className="rn-sheet-p">
            Este aparelho não deixou o app manter a tela acesa. O treino continua contando certo, e o som avisa as trocas
            enquanto o app estiver aberto.
          </p>
          <p className="rn-sheet-p">Para a tela não apagar durante o treino, no iPhone:</p>
          <ol className="rn-sheet-steps">
            <li>Abra Ajustes › Tela e Brilho.</li>
            <li>Toque em Bloqueio Automático.</li>
            <li>Escolha Nunca durante o treino e volte ao tempo de antes depois.</li>
          </ol>
        </div>
      </Sheet>
    </FullScreen>
  );
}

/** O botão de encerrar: toque longo de 800 ms, com um anel que enche em volta (linear). Soltar antes cancela. */
function HoldToEnd({ onDone }: { onDone: () => void }) {
  const ringRef = useRef<SVGCircleElement>(null);
  const raf = useRef(0);
  const startAt = useRef(0);
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const C = 2 * Math.PI * 44;

  const setProgress = (v: number) => {
    const el = ringRef.current;
    if (!el) return;
    el.style.strokeDashoffset = String(C * (1 - v));
    el.style.opacity = v > 0 ? '1' : '0';
  };
  const cancel = (showHint: boolean) => {
    if (!raf.current) return;
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    setProgress(0);
    if (showHint) {
      setHint(true);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(false), 1500);
    }
  };
  const begin = () => {
    startAt.current = performance.now();
    const step = () => {
      const v = Math.min(1, (performance.now() - startAt.current) / 800);
      setProgress(v);
      if (v >= 1) {
        raf.current = 0;
        setProgress(0);
        onDone();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    clearTimeout(hintTimer.current);
  }, []);

  return (
    <span className="rn-cb">
      <button
        type="button"
        className="rn-rb s"
        aria-label="Encerrar treino, segure"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          begin();
        }}
        onPointerUp={() => cancel(true)}
        onPointerCancel={() => cancel(false)}
        onLostPointerCapture={() => cancel(false)}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => {
          // teclado (Enter ou espaço): abre a folha direto
          if (e.detail === 0) onDone();
        }}
      >
        <Icon name="stop" weight="fill" />
        <svg className="rn-hold" viewBox="0 0 100 100" aria-hidden="true">
          <circle ref={ringRef} cx="50" cy="50" r="44" strokeDasharray={C.toFixed(2)} strokeDashoffset={C.toFixed(2)} style={{ opacity: 0 }} />
        </svg>
      </button>
      <span className={clsx('hint', hint && 'on')} aria-hidden="true">
        Segure para encerrar
      </span>
    </span>
  );
}

function EndSheet({
  open,
  onOpenChange,
  run,
  onSave,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  run: Run | null;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const pos = run ? positionOf(run) : null;
  const done = run && pos ? intervalsCompleted(weekOf(run), pos.elapsed) : 0;
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Encerrar o treino?"
      footer={
        <div className="rn-sheet-actions">
          <Button wide onClick={onSave}>
            Salvar o que fiz
          </Button>
          <Button wide variant="ghost" onClick={onDiscard}>
            Descartar treino
          </Button>
        </div>
      }
    >
      {pos && (
        <p className="rn-sheet-p">
          Até aqui: {Math.max(0, Math.floor(pos.elapsed / 60))} min e {done} de {pos.intervals}{' '}
          {pos.intervals === 1 ? 'intervalo' : 'intervalos'}. Salvar guarda o que você fez.
        </p>
      )}
    </Sheet>
  );
}
