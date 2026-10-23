// Horários: cada horário é a meta dos hábitos ligados a ele e a hora do alarme sugerido. Tocar abre a roda do iPhone,
// e o horário grava quando a roda fecha (nunca a cada giro), com o toast "Deitar às 22h30" e Desfazer.
// Também a revisão da semana (dia e hora numa folha), a tolerância do fim de semana e os dias de coleta
// (docs/interacao/telas/ajustes-rotina-conta.md › Horários).
import { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { NavBar, Sheet, showUndo } from '@/components/shell';
import { Button, DayPicker, InsightCard, ListGroup, ListItem, SectionLabel, Tag, TimeValue } from '@/components/ui';
import { formatTime, useHabits, useProfile, weekdayShortLabel } from '@/data';
import { setCollectionDays, setScheduleTime, setWeekendTolerance, setWeeklyReview } from '@/actions';
import { tween } from '@/motion/tokens';
import type { ScheduleKey, TimeHM, Weekday } from '@/types';
import { Foot, Row, ValueButton } from './parts';
import { scheduleRows, type ScheduleRow } from './schedule';
import './settings.css';

export default function ScheduleScreen() {
  const profile = useProfile();
  const habits = useHabits('all');
  const rows = scheduleRows(profile, habits);
  const [reviewOpen, setReviewOpen] = useState(false);

  if (!profile) return <NavBar title="Horários" />;
  const review = profile.weeklyReview ?? { weekday: 6 as Weekday, time: '18:00' };
  const trash = habits.find((h) => h.status !== 'archived' && h.habit.schedule?.useCollectionDays);

  return (
    <div className="st-screen">
      <NavBar title="Horários" />
      <p className="lead st-lead">Cada horário é a meta dos hábitos ligados a ele e a hora do alarme sugerido.</p>

      {rows.length > 0 ? (
        <>
          <SectionLabel>Todo dia</SectionLabel>
          <div className="st-pad">
            <ListGroup>
              {rows.map((r) => (
                <TimeRow key={r.key} row={r} />
              ))}
            </ListGroup>
          </div>
          <Foot icon="info">
            Vale a partir de hoje, e os dias que passaram ficam como estavam. O alarme que você criou no iPhone não muda
            sozinho.
          </Foot>
        </>
      ) : (
        <div className="st-pad" style={{ paddingTop: 16 }}>
          <InsightCard
            pillar="accent"
            icon="clock"
            animateIn={false}
            text="Nenhum hábito usa um horário fixo ainda. Hábitos como Acordar e Deitar trazem o horário deles para cá."
          />
        </div>
      )}

      <SectionLabel>Toda semana</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <Row
            icon="calendar-check"
            title="Revisão da semana"
            subtitle="Resumo e um ajuste"
            trailing={
              <ValueButton
                label={`Revisão da semana, ${weekdayLongLabel(review.weekday)} às ${formatTime(review.time)}. Ajustável.`}
                onClick={() => setReviewOpen(true)}
              >
                {`${weekdayShortLabel(review.weekday)}, ${review.time}`}
              </ValueButton>
            }
          />
        </ListGroup>
      </div>

      <SectionLabel>Fim de semana</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <ListItem
            title="Tolerância de 1h"
            subtitle="Sábado e domingo, acordar e deitar até 1h fora do horário contam como feito."
            toggle={{ checked: !!profile.weekendTolerance, onCheckedChange: (on) => void setWeekendTolerance(on) }}
          />
        </ListGroup>
      </div>

      {trash && (
        <>
          <SectionLabel>Dias de coleta do lixo</SectionLabel>
          <div className="st-pad">
            <div className="pk-lg st-box">
              <DayPicker
                value={profile.collectionDays ?? []}
                onChange={(d) => void setCollectionDays(d as Weekday[])}
                pillar={trash.pillar?.color}
                label="Dias de coleta do lixo"
              />
            </div>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={(profile.collectionDays ?? []).length ? 'on' : 'off'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={tween.micro}
            >
              <Foot>
                {(profile.collectionDays ?? []).length
                  ? `${trash.habit.name} aparece no Hoje só nesses dias${
                      trash.habit.schedule.timeKey && profile.schedule[trash.habit.schedule.timeKey]
                        ? `, até ${formatTime(profile.schedule[trash.habit.schedule.timeKey])}`
                        : ''
                    }.`
                  : `Sem dia de coleta, ${trash.habit.name} não aparece no Hoje.`}
              </Foot>
            </m.div>
          </AnimatePresence>
        </>
      )}

      <ReviewSheet open={reviewOpen} onOpenChange={setReviewOpen} weekday={review.weekday} time={review.time} />
    </div>
  );
}

function weekdayLongLabel(d: number): string {
  return ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'][d] ?? '';
}

/** Uma linha de horário. O valor novo aparece na hora; grava quando a roda fecha (o campo perde o foco), nunca a
 *  cada giro. Se o campo mudou sem foco (teclado externo, automação), grava um instante depois. */
function TimeRow({ row }: { row: ScheduleRow }) {
  const [pending, setPending] = useState<TimeHM | null>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef<TimeHM | null>(null);
  const shown = pending ?? row.time;
  useEffect(() => () => clearTimeout(timer.current), []);
  const commit = async () => {
    clearTimeout(timer.current);
    const value = latest.current;
    latest.current = null;
    setPending(null);
    if (!value || value === row.time) return;
    const undo = await setScheduleTime(row.key as ScheduleKey, value);
    showUndo(
      { title: `${row.title} às ${formatTime(value)}`, detail: 'Mude também o alarme do iPhone.', icon: 'clock' },
      () => void undo(),
    );
  };
  const change = (v: TimeHM) => {
    latest.current = v;
    setPending(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const input = wrap.current?.querySelector('input');
      if (input && document.activeElement !== input) void commit();
    }, 1200);
  };
  return (
    <Row
      icon={row.icon}
      pillar={row.pillar?.color}
      title={row.title}
      titleTag={row.off && row.phase ? <Tag>{`fase ${row.phase}`}</Tag> : undefined}
      subtitle={row.subtitle}
      className={row.afterBed ? 'st-afterbed' : undefined}
      trailing={
        <span ref={wrap} onBlur={() => void commit()}>
          <TimeValue
            kind="time"
            value={shown}
            off={row.off}
            label={`${row.title}, ${formatTime(shown)}${row.subtitle ? `, ${row.subtitle}` : ''}`}
            display={shown}
            onChange={change}
          />
        </span>
      }
    />
  );
}

function ReviewSheet({
  open,
  onOpenChange,
  weekday,
  time,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  weekday: Weekday;
  time: TimeHM;
}) {
  const [day, setDay] = useState<Weekday>(weekday);
  const [hour, setHour] = useState<TimeHM>(time);
  const [seen, setSeen] = useState(open);
  if (open !== seen) {
    setSeen(open);
    if (open) {
      setDay(weekday);
      setHour(time);
    }
  }
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Revisão da semana"
      footer={
        <Button
          wide
          onClick={() => {
            onOpenChange(false);
            if (day !== weekday || hour !== time) {
              void setWeeklyReview(day, hour).then((undo) =>
                showUndo(
                  {
                    title: `Revisão ${weekdayLongLabel(day) === 'sábado' || weekdayLongLabel(day) === 'domingo' ? 'no' : 'na'} ${weekdayLongLabel(day)}, às ${formatTime(hour)}`,
                    icon: 'calendar-check',
                  },
                  () => void undo(),
                ),
              );
            }
          }}
        >
          Pronto
        </Button>
      }
    >
      <div className="st-field-row">
        <p className="lead" style={{ margin: 0 }}>
          O convite da revisão aparece no Hoje nesse dia e hora, e fica até dois dias depois.
        </p>
        <DayPicker single value={[day]} onChange={(d) => setDay(d[0] as Weekday)} label="Dia da revisão" />
        <ListGroup>
          <Row
            title="Horário"
            trailing={<TimeValue kind="time" value={hour} onChange={setHour} label="Horário da revisão" />}
          />
        </ListGroup>
      </div>
    </Sheet>
  );
}
