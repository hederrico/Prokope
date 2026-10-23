// Folha "Acordei às" (?folha=acordar): registros.md › Deitar e acordar; quadro: f-registros.js › 3.
// Pergunta: o acordar de hoje (abre na hora de agora) e o deitar de ontem (abre na meta). Cada horário abre a roda
// nativa; a linha de baixo diz se conta como feito. O botão repete os dois horários, grava (logSleep) e fecha.
import { AnimatePresence, m } from 'motion/react';
import { useRef, useState } from 'react';
import { logSleep } from '@/actions';
import { Sheet, type SheetScreenProps } from '@/components/shell';
import { Button, ListGroup, PillarBubble, TimeValue, useReduced, type PillarColor } from '@/components/ui';
import { formatMinutes, formatTime, timeMeetsGoal, timeOf, useNow, useSleep } from '@/data';
import { Icon, type IconName } from '@/icons';
import type { TimeHM } from '@/types';
import { spring, tween } from '@/motion/tokens';
import { closeThenUndo } from './feedback';
import { lateText, onDay } from './lib';
import { DayNote, SheetTitle } from './parts';
import { useHabitPillar, useSheetDay } from './hooks';

export default function WakeSheet({ params, close }: SheetScreenProps) {
  const { now, clock } = useNow();
  const sd = useSheetDay(params);
  const sleep = useSleep(sd.day);
  const wakePillar = useHabitPillar(sleep.wake?.habit.id);
  const bedPillar = useHabitPillar(sleep.bed?.habit.id);
  // hoje, o acordar abre na hora de agora; num dia que passou, na meta
  const [wake, setWake] = useState<TimeHM>(
    () => sleep.wake?.state.mark?.time ?? (sd.isPast ? sleep.wake?.state.goal.time : undefined) ?? timeOf(now, clock),
  );
  const [bed, setBed] = useState<TimeHM>(() => sleep.bed?.state.mark?.time ?? sleep.bed?.state.goal.time ?? '22:00');
  const saving = useRef(false);

  const start = clock.dayStartHour;
  const w = sleep.wake;
  const b = sleep.bed;
  const tolerance = w?.state.goal.toleranceMin ?? b?.state.goal.toleranceMin ?? 15;
  const times = [b && formatTime(bed), w && formatTime(wake)].filter(Boolean).join(' e ');

  async function save() {
    if (saving.current || (!w && !b)) return;
    saving.current = true;
    const undo = await logSleep({ wake: w ? wake : undefined, bed: b ? bed : undefined }, sd.day, {
      wakeId: w?.habit.id,
      bedId: b?.habit.id,
    });
    closeThenUndo(
      close,
      {
        title: w && b ? 'Deitar e acordar registrados' : `${(w ?? b)!.habit.name} registrado`,
        detail: sd.label ?? undefined,
        pillar: wakePillar ?? bedPillar,
        icon: 'check',
      },
      undo,
    );
  }

  const title = w && b ? 'Deitar e acordar' : (w ?? b)?.habit.name ?? 'Acordei às';

  return (
    <Sheet
      title={
        <SheetTitle icon={w?.habit.icon ?? b?.habit.icon ?? 'alarm'} pillar={wakePillar ?? bedPillar}>
          {title}
        </SheetTitle>
      }
      label={title}
      className="rg-sheet"
      footer={
        <Button wide onClick={() => void save()} aria-disabled={!w && !b}>
          Salvar <span className="num">{times}</span>
        </Button>
      }
    >
      <div className="rg-stack">
        <DayNote label={sd.label} />
        {b && w && (
          <p className="lead">
            {sd.isPast
              ? 'O deitar da noite anterior vem junto.'
              : 'O deitar de ontem vem junto, para o celular ficar longe à noite.'}
          </p>
        )}
        <ListGroup className="rg-lg">
          {b && (
            <TimeRow
              icon={b.habit.icon}
              pillar={bedPillar}
              title={`Deitei ${onDay(b.day, sd.today)}`}
              goal={b.state.goal.time}
              tolerance={b.state.goal.toleranceMin}
              value={bed}
              onChange={setBed}
              dayStartHour={start}
            />
          )}
          {w && (
            <TimeRow
              icon={w.habit.icon}
              pillar={wakePillar}
              title={`Acordei ${onDay(w.day, sd.today)}`}
              goal={w.state.goal.time}
              tolerance={w.state.goal.toleranceMin}
              value={wake}
              onChange={setWake}
              dayStartHour={start}
            />
          )}
        </ListGroup>
        <p className="rg-foot">
          <Icon name="info" weight="regular" />
          Até {formatMinutes(tolerance)} de diferença da meta conta como feito.
        </p>
      </div>
    </Sheet>
  );
}

function TimeRow({
  icon,
  pillar,
  title,
  goal,
  tolerance,
  value,
  onChange,
  dayStartHour,
}: {
  icon: IconName;
  pillar?: PillarColor;
  title: string;
  goal: TimeHM | undefined;
  tolerance: number;
  value: TimeHM;
  onChange: (v: TimeHM) => void;
  dayStartHour: number;
}) {
  const reduced = useReduced();
  const ok = timeMeetsGoal(value, goal, tolerance, dayStartHour);
  const status = ok ? 'conta como feito' : goal ? lateText(value, goal, dayStartHour) : '';
  const spoken = `${title} às ${formatTime(value)}. ${status ? `${status[0]!.toUpperCase()}${status.slice(1)}. ` : ''}Alterar horário`;
  return (
    <div className="rg-li">
      <PillarBubble icon={icon} pillar={pillar} size="li" />
      <span aria-hidden="true">
        <b>{title}</b>
        {goal && (
          <small>
            meta {formatTime(goal)} ·
            <AnimatePresence mode="wait" initial={false}>
              <m.span
                key={ok ? 'ok' : status}
                className={ok ? 'rg-ok' : 'rg-diff'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: tween.micro }}
                exit={{ opacity: 0, transition: tween.exit }}
              >
                {ok && (
                  <m.span
                    style={{ display: 'inline-flex' }}
                    initial={{ scale: reduced ? 1 : 0.4 }}
                    animate={{ scale: 1, transition: spring.toque }}
                  >
                    <Icon name="check-circle" weight="bold" />
                  </m.span>
                )}
                {status}
              </m.span>
            </AnimatePresence>
          </small>
        )}
      </span>
      <TimeValue kind="time" raised value={value} onChange={(v) => onChange(v as TimeHM)} label={spoken} />
    </div>
  );
}
