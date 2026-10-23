// O dia fechado (hoje.md › Hoje · dia fechado): o anel de 196 px anda do penúltimo ao último em ring, brilha uma
// vez (glow) e assenta; "Dia fechado" e a frase entram com fadeUp; "Ver o dia" e "Amanhã cedo" vêm em cascata.
// A celebração acontece uma vez por dia (pk-dia-fechado-<dia>); reabrir mostra tudo parado, com o brilho assentado.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Button, HabitList, Ring, SectionLabel, WeekDots, useReduced } from '@/components/ui';
import { formatTime, greeting, markDayCelebrated, timeOf, weekdayName, type TodayItem } from '@/data';
import { haptic } from '@/motion/haptics';
import { dur, spring, tween } from '@/motion/tokens';
import { useClockStore } from '@/stores/clock';
import { shortOf, withParticiple } from './copy';
import { ItemRow } from './rows';
import { toastName, weekLen } from './useTodayActions';

export interface DayClosedViewProps {
  day: string;
  done: number;
  total: number;
  /** o dia acabou de fechar nesta tela: anel, brilho e vibração (uma vez por dia) */
  celebrate: boolean;
  /** o último registro do dia (a frase: "Telas desligadas às 21h04") */
  last: TodayItem | null;
  /** o hábito marcado na manhã seguinte (o deitar) e o que se marca junto (o acordar) */
  nextMorning: { later: TodayItem; with: TodayItem | null } | null;
  doneItems: TodayItem[];
  tomorrow: TodayItem[];
  minutes: number;
  /** "Ver o dia" na Lista completa e na Linha do tempo: o dia inteiro naquele jeito, no lugar dos Feitos hoje */
  dayView?: { title: string; node: ReactNode };
}

const fade = (delay: number, play: boolean) =>
  play
    ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0, transition: { ...tween.base, delay } } }
    : { initial: false as const, animate: { opacity: 1, y: 0 } };

export function DayClosedView({
  day,
  done,
  total,
  celebrate,
  last,
  nextMorning,
  doneItems,
  tomorrow,
  minutes,
  dayView,
}: DayClosedViewProps) {
  const reduced = useReduced();
  // a celebração começa no penúltimo valor e anda até o atual
  const [shownDone, setShownDone] = useState(celebrate ? Math.max(0, done - 1) : done);
  const [glow, setGlow] = useState(!celebrate);
  const [showDay, setShowDay] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const ringMs = (reduced ? dur.micro : dur.ring) * 1000;

  useEffect(() => {
    if (!celebrate) return;
    const a = window.setTimeout(() => setShownDone(done), 16);
    const b = window.setTimeout(() => {
      setGlow(true);
      // nível 4 da escada: vibração bônus, uma vez por dia
      haptic();
      markDayCelebrated(day);
    }, ringMs);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
    // só quando o dia fecha
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrate]);

  // o valor segue o dado depois da celebração (desmarcar recua o anel em fill)
  const [track, setTrack] = useState<{ done: number; timing: 'ring' | 'fill' }>({ done, timing: 'ring' });
  if (track.done !== done) {
    setTrack({ done, timing: done < track.done ? 'fill' : 'ring' });
    setShownDone(done);
  }

  useEffect(() => {
    if (showDay) listRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }, [showDay, reduced]);

  const clock = useClockStore((s) => s.clock);
  const lastTime = last?.mark?.time ?? (last?.mark?.at ? timeOf(last.mark.at, clock) : null);
  const sentence = [
    last ? `${withParticiple(toastName(last), 'marcad')}${lastTime ? ` às ${formatTime(lastTime)}` : ''}.` : null,
    `${greeting(minutes)}.`,
    nextMorning
      ? `O ${shortOf(nextMorning.later.habit)} você marca amanhã${nextMorning.with ? `, junto com o ${shortOf(nextMorning.with.habit)}` : ''}.`
      : null,
  ]
    .filter(Boolean)
    .join(' ');
  const tomorrowDay = tomorrow[0]?.day;
  const late = celebrate ? ringMs / 1000 : 0;

  return (
    <div className="td-closed-root">
      <div className="td-closed">
        <Ring
          size={196}
          stroke={14}
          value={total ? shownDone / total : 0}
          color="var(--accent-mark)"
          track="var(--accent-wash)"
          timing={track.timing}
          glow={glow}
          label={`${shownDone} de ${total} feitos hoje`}
          className="td-closed-ring"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={shownDone}
              className="disp pk-num td-closed-n"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: tween.micro }}
              exit={{ opacity: 0, transition: tween.micro }}
            >
              {shownDone}
            </m.span>
          </AnimatePresence>
          <span className="cap">de {total}</span>
        </Ring>
        <m.h1 className="ttl2 td-closed-h" tabIndex={-1} {...fade(late, celebrate)}>
          Dia fechado
        </m.h1>
        <m.p className="td-closed-p" {...fade(late, celebrate)}>
          {sentence}
        </m.p>
        <m.div {...fade(late + 0.15, celebrate)}>
          <Button variant="ghost" onClick={() => setShowDay((v) => !v)} aria-expanded={showDay}>
            {showDay ? 'Recolher o dia' : 'Ver o dia'}
          </Button>
        </m.div>
      </div>
      <AnimatePresence initial={false}>
        {showDay && (
          <m.div
            key="day"
            ref={listRef}
            className="td-closed-day"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { height: spring.calma, opacity: tween.base } }}
            exit={{ height: 0, opacity: 0, transition: { height: spring.calma, opacity: tween.exit } }}
          >
            {dayView ? (
              <section aria-label={dayView.title} className="td-closed-view">
                {dayView.node}
              </section>
            ) : (
              <>
                <SectionLabel trailing={String(doneItems.length)}>Feitos hoje</SectionLabel>
                <div className="td-pad">
                  <HabitList label="Feitos hoje">
                    {doneItems.map((item) => (
                      <ItemRow key={item.habit.id} item={item} />
                    ))}
                  </HabitList>
                </div>
              </>
            )}
          </m.div>
        )}
      </AnimatePresence>
      {tomorrow.length > 0 && (
        <m.div className="td-closed-tm" {...fade(late + 0.18, celebrate)}>
          <SectionLabel>Amanhã cedo</SectionLabel>
          <div className="td-pad">
            <HabitList label="Amanhã cedo">
              {tomorrow.map((item) => {
                const wd = tomorrowDay ? weekdayName(tomorrowDay) : '';
                const len = weekLen(item);
                const sub = item.week
                  ? {
                      subtitle: (
                        <>
                          <WeekDots total={len} done={Math.min(len, item.week.done)} />
                          <span className="pk-num">
                            {item.week.done} de {len}
                            {item.week.target < len ? ` · meta ${item.week.target}` : ''}
                          </span>
                        </>
                      ),
                      text: `${item.week.done} de ${len} na semana`,
                    }
                  : {
                      subtitle: [wd, item.goal.time ? `meta ${formatTime(item.goal.time)}` : null]
                        .filter(Boolean)
                        .join(' · '),
                      text: [wd, item.goal.time ? `meta ${formatTime(item.goal.time)}` : null]
                        .filter(Boolean)
                        .join(', '),
                    };
                return <ItemRow key={item.habit.id} item={item} readOnly={sub} />;
              })}
            </HabitList>
          </div>
        </m.div>
      )}
    </div>
  );
}
