// Treino feito (jornada.md › Treino feito). O anel fecha uma vez e o check se desenha com a mola toque, com uma
// vibração bônus (nível 1 da escada). Sem confete. Encerrado antes, mostra o que foi feito e conta pelo que o
// hábito define: a partir da meta é feito, a partir do mínimo é parcial, abaixo fica registrado sem contar.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { m } from 'motion/react';
import { FullScreen, useGoBack } from '@/components/shell';
import { Button, Card, ListGroup, ListItem, Ring, StatGroup, pillarAttrs } from '@/components/ui';
import { Icon } from '@/icons';
import { finishRun } from '@/actions';
import {
  addDays,
  formatDayCompact,
  formatTime,
  runWeek,
  useDataStatus,
  usePillars,
  useRunPlan,
  type RunWeek,
} from '@/data';
import { haptic, spring, tween, usePrefersReducedMotion } from '@/motion';
import { nowMs } from '@/stores/clock';
import type { Run } from '@/types';
import { RunScheduleSheet } from '@/screens/journey/RunScheduleSheet';
import { nextScheduledDay } from '@/screens/journey/shared';
import { IntervalStrip } from './IntervalStrip';
import { positionOf, releaseWakeLock } from './engine';
import './run.css';

/** Segundos de trote feitos em `seconds` de treino. */
function runSecondsDone(w: RunWeek, seconds: number): number {
  let acc = 0;
  let total = 0;
  for (const b of w.blocks) {
    if (b.kind === 'run') total += Math.min(b.seconds, Math.max(0, seconds - acc));
    acc += b.seconds;
  }
  return total;
}

/** Blocos começados até `seconds` (para pintar a fileira de um treino encerrado antes). */
function blocksStarted(w: RunWeek, seconds: number): number {
  let acc = 0;
  let n = 0;
  for (const b of w.blocks) {
    if (seconds > acc) n++;
    acc += b.seconds;
  }
  return n;
}

/** Fim previsto de um treino que terminou com o app escondido: começo + pausas + duração. */
function predictedEnd(run: Run): number {
  const paused = run.pauses.reduce((n, p) => n + Math.max(0, (p.to ?? p.from) - p.from), 0);
  return run.startedAt + paused + runWeek(run.week).totalSeconds * 1000;
}

export default function RunDoneScreen() {
  const params = useParams();
  const week = Number(params.semana) || 1;
  const session = Number(params.treino) || 1;
  const plan = useRunPlan();
  const { status } = useDataStatus();
  const pillars = usePillars({ includeArchived: true });
  const goBack = useGoBack();
  const reduced = usePrefersReducedMotion();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // ao chegar: o treino em andamento desta rota termina (no fim previsto, se acabou com o app escondido)
  const finishing = useRef(false);
  const active = plan.activeRun;
  useEffect(() => {
    if (!active || finishing.current || active.week !== week || active.session !== session) return;
    finishing.current = true;
    const pos = positionOf(active);
    void finishRun(active.id, pos.done && active.status === 'running' ? { endedAt: Math.min(nowMs(), predictedEnd(active)) } : {});
    releaseWakeLock();
  }, [active, week, session]);

  const run = useMemo(
    () => plan.history.find((r) => r.week === week && r.session === session) ?? null,
    [plan.history, week, session],
  );

  const habit = plan.habit;
  const pillar = pillars.find((p) => p.pillar.id === (habit?.pillarId ?? run?.habitId))?.pillar;
  const color = pillar?.color ?? 'damasco';
  const w = runWeek(run?.week ?? week);
  const seconds = run?.seconds ?? 0;
  const complete = seconds >= w.totalSeconds - 1;
  const target = Math.min(1, seconds / w.totalSeconds);
  const trot = runSecondsDone(w, seconds);
  const minutes = Math.round(seconds / 60);
  const intervals = run?.intervalsDone ?? 0;
  const perWeek = habit?.goal.perWeek ?? 2;

  // o anel fecha do último valor até o fim; o check entra com a mola toque; uma vibração bônus
  const fresh = !!run?.endedAt && nowMs() - run.endedAt < 15_000;
  const [ringValue, setRingValue] = useState(() => (fresh && !reduced ? Math.max(0, target - 0.12) : target));
  useEffect(() => {
    if (!run) return;
    const id = requestAnimationFrame(() => setRingValue(target));
    return () => cancelAnimationFrame(id);
  }, [run, target]);
  const buzzed = useRef(false);
  useEffect(() => {
    if (fresh && !buzzed.current) {
      buzzed.current = true;
      haptic();
    }
  }, [fresh]);

  // o foco vai para o título
  const titleRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    if (run) titleRef.current?.focus({ preventScroll: true });
  }, [run?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextDay = run ? nextScheduledDay(plan.schedule.days, addDays(run.day, 1)) : null;
  const nextLabel = nextDay
    ? `${formatDayCompact(nextDay)}${plan.schedule.time ? ` · ${formatTime(plan.schedule.time)}` : ''}`
    : 'Escolher dias';
  const attrs = pillarAttrs(color);

  if (!run) {
    return (
      <FullScreen footer={<Button wide onClick={() => goBack('/hoje')}>Voltar ao dia</Button>}>
        <div className="rn-done">
          {status === 'ready' && !active && (
            <>
              <h1 className="lt">Treino</h1>
              <p className="sub muted">Este treino não está mais por aqui.</p>
            </>
          )}
        </div>
      </FullScreen>
    );
  }

  const summary = `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}, ${intervals} de ${w.intervals} ${w.intervals === 1 ? 'intervalo' : 'intervalos'}`;

  return (
    <FullScreen
      footer={
        <m.div
          className="rn-foot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: tween.base }}
        >
          <ListGroup>
            <ListItem
              icon="calendar-dots"
              pillar={color}
              title="Próximo treino"
              value={nextLabel}
              onClick={() => setScheduleOpen(true)}
            />
          </ListGroup>
          <Button wide onClick={() => goBack('/hoje')}>
            Voltar ao dia
          </Button>
        </m.div>
      }
    >
      <m.div
        className={attrs.className}
        data-pillar={attrs['data-pillar']}
        data-hue={attrs['data-hue']}
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: tween.base }}
      >
        <div className="rn-done">
          <Ring size={168} stroke={12} value={ringValue} color="var(--mark)" track="var(--wash)">
            <m.span
              style={{ display: 'grid' }}
              initial={fresh && !reduced ? { scale: 0.4, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1, transition: { ...spring.toque, delay: 0.3 } }}
            >
              <Icon name="check" weight="bold" className="ck" />
            </m.span>
            <b>{minutes} min</b>
          </Ring>
          <h1 ref={titleRef} tabIndex={-1} className="lt" aria-describedby="rn-done-sum">
            Treino feito
          </h1>
          <p className="sub muted">
            Semana {run.week} · treino {Math.min(run.session, perWeek)} de {perWeek}
          </p>
          <span id="rn-done-sum" className="rn-sr">
            {summary}
          </span>
          <StatGroup
            pillar={color}
            items={[
              { label: 'Intervalos', icon: 'repeat', value: intervals, unit: `de ${w.intervals}` },
              { label: 'Trote', icon: 'person-simple-run', value: Math.round(trot / 60), unit: 'min' },
              { label: 'Caminhada', icon: 'person-simple-walk', value: Math.max(0, minutes - Math.round(trot / 60)), unit: 'min' },
            ]}
          />
          <Card className="rn-dstrip">
            <IntervalStrip blocks={w.blocks} doneUntil={complete ? w.blocks.length : blocksStarted(w, seconds)} />
          </Card>
        </div>
      </m.div>
      <RunScheduleSheet
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        days={plan.schedule.days}
        time={plan.schedule.time}
        perWeek={perWeek}
        pillar={color}
      />
    </FullScreen>
  );
}
