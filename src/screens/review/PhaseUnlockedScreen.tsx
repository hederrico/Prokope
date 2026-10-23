// Fase desbloqueada (jornada.md › Fase desbloqueada): nível 6 da escada, uma vez por fase (phases/{n}.celebratedAt).
// O emblema cresce com a mola festa, o confete cai uma vez, "Fase 3" e o nome sobem com a festa, a frase e o pé
// entram com fadeUp. Reabrir mostra tudo parado. Reduzido: confete já desenhado e o resto em opacidade de 150 ms.
// Sem som e sem vibração.
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { m } from 'motion/react';
import { FullScreen, useGoBack } from '@/components/shell';
import { Button, PillarBubble, type PillarColor } from '@/components/ui';
import { Icon } from '@/icons';
import { markPhaseCelebrated } from '@/actions';
import {
  addDays,
  capitalize,
  formatDayLong,
  formatPercent,
  formatTime,
  useDataStatus,
  useJourney,
  useNow,
  usePillars,
  useRunPlan,
  weekdayName,
} from '@/data';
import { distance, spring, tween, usePrefersReducedMotion } from '@/motion';
import { RunScheduleSheet } from '@/screens/journey/RunScheduleSheet';
import { habitsPhrase, nextScheduledDay, shortName } from '@/screens/journey/shared';
import { Confetti } from './Confetti';
import './review.css';

export default function PhaseUnlockedScreen() {
  const n = Number(useParams().numero) || 0;
  const j = useJourney();
  // o primeiro treino guiado que entra com esta fase (a corrida, no plano base)
  const training = j.trainings.find((t) => t.habit.phase === n) ?? null;
  const plan = useRunPlan(training?.habit.id ?? null);
  const pillars = usePillars();
  const { today } = useNow();
  const { status } = useDataStatus();
  const goBack = useGoBack();
  const reduced = usePrefersReducedMotion();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const phase = j.phases.find((p) => p.number === n) ?? null;
  const prev = j.phases.find((p) => p.number === n - 1) ?? null;

  // a celebração acontece uma vez: decide na chegada (antes de marcar) e não muda mais
  const [celebrate, setCelebrate] = useState<boolean | null>(null);
  if (celebrate === null && status === 'ready' && phase) setCelebrate(!phase.phase.celebratedAt);
  useEffect(() => {
    if (celebrate && phase && !phase.phase.celebratedAt) void markPhaseCelebrated(n);
  }, [celebrate, phase, n]);

  const emblemRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const footRef = useRef<HTMLDivElement>(null);

  // o foco vai para "Fase 3, Movimento"
  useEffect(() => {
    if (celebrate !== null) titleRef.current?.focus({ preventScroll: true });
  }, [celebrate]);

  if (!phase || celebrate === null) return <FullScreen />;

  const play = celebrate && !reduced;
  const start = phase.start ?? addDays(today, 1);
  const when =
    start === today
      ? 'hoje'
      : start === addDays(today, 1)
        ? `amanhã, ${formatDayLong(start)}`
        : formatDayLong(start);
  const what = habitsPhrase(phase.habits);
  const closed = prev?.constancy != null ? ` com ${formatPercent(prev.constancy)}` : '';
  const sentence = [
    prev ? `A fase ${prev.number} fechou${closed}.` : '',
    what
      ? `${what} ${phase.habits.length === 1 ? 'entra' : 'entram'} no seu dia a partir de ${when}.`
      : `A fase começa ${start === today ? 'hoje' : `a partir de ${when}`}.`,
  ]
    .filter(Boolean)
    .join(' ');

  const runHabit = training && plan.habit?.id === training.habit.id ? plan.habit : null;
  const runPillar = runHabit ? pillars.find((p) => p.pillar.id === runHabit.pillarId)?.pillar : undefined;
  const firstRun = runHabit ? nextScheduledDay(plan.schedule.days, start) : null;
  const firstRunLabel = firstRun
    ? `${capitalize(weekdayName(firstRun))}${plan.schedule.time ? `, ${formatTime(plan.schedule.time)}` : ''} · ${Math.round((plan.weeks[0]?.totalSeconds ?? 0) / 60)} min`
    : 'Escolher os dias';

  const enter = (delay: number, festa = false) =>
    !celebrate
      ? { initial: false as const }
      : reduced
        ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.15, delay: 0 } } }
        : festa
          ? {
              initial: { opacity: 0, y: 12 },
              animate: { opacity: 1, y: 0, transition: { y: { ...spring.festa, delay }, opacity: { ...tween.base, delay } } },
            }
          : {
              initial: { opacity: 0, y: distance.rise },
              animate: { opacity: 1, y: 0, transition: { ...tween.base, delay } },
            };

  return (
    <FullScreen
      footer={
        <m.div ref={footRef} className="rv-wfoot" {...enter(0.6)}>
          {runHabit && (
            <button type="button" className="rv-firstrun" onClick={() => setScheduleOpen(true)}>
              <PillarBubble icon={runHabit.icon} pillar={runPillar?.color} />
              <span>
                <b>Primeiro treino de {shortName(runHabit)}</b>
                <small>{firstRunLabel}</small>
              </span>
              <Icon name="caret-right" weight="bold" />
            </button>
          )}
          <Button wide onClick={() => goBack('/hoje')}>
            Ver meu dia
          </Button>
        </m.div>
      }
    >
      <m.div
        className="rv-win"
        data-pillar="accent"
        initial={celebrate ? { opacity: 0 } : false}
        animate={{ opacity: 1, transition: tween.base }}
      >
        <Confetti
          colors={pillars.map((p) => p.pillar.color as PillarColor)}
          play={play}
          delay={120}
          emblem={emblemRef}
          avoid={[titleRef, textRef]}
          foot={footRef}
        />
        <div className="rv-winc">
          <m.span
            ref={emblemRef}
            className="rv-emb"
            aria-hidden="true"
            {...(!celebrate
              ? { initial: false as const }
              : reduced
                ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.15 } } }
                : { initial: { scale: 0.8 }, animate: { scale: 1, transition: spring.festa } })}
          >
            <Icon name="path" weight="duotone" />
          </m.span>
          <h1 ref={titleRef} tabIndex={-1} aria-describedby="rv-win-p">
            <m.span className="eyebrow" {...enter(0.2, true)}>
              Fase {phase.number}
            </m.span>
            <m.span className="rv-big" {...enter(0.2, true)}>
              {phase.name}
            </m.span>
          </h1>
          <m.p id="rv-win-p" ref={textRef} {...enter(0.4)}>
            {sentence}
          </m.p>
        </div>
      </m.div>
      {runHabit && (
        <RunScheduleSheet
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          days={plan.schedule.days}
          time={plan.schedule.time}
          perWeek={plan.perWeek}
          pillar={runPillar?.color}
          habitId={runHabit.id}
        />
      )}
    </FullScreen>
  );
}
