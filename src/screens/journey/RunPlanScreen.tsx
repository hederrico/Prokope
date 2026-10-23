// Plano de corrida (jornada.md › Plano de corrida): as 13 semanas, o treino da semana em blocos proporcionais
// e os dias de treino. Nada anima ao aparecer: as barras são o plano, não um progresso. Na fase da corrida,
// "Começar treino" fica fixo no rodapé.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { NavBar } from '@/components/shell';
import { BudgetSlots, Button, Card, ListGroup, ListItem, MiniBar, PillarBubble, SectionLabel, Tag } from '@/components/ui';
import { capitalize, formatDayShort, usePillars, useRunPlan } from '@/data';
import { tween } from '@/motion';
import { IntervalStrip } from '@/screens/run/IntervalStrip';
import { prepareRun } from '@/screens/run/engine';
import { RunScheduleSheet } from './RunScheduleSheet';
import { minutesOf, runLegend, runWeekLabel, scheduleLabel } from './shared';
import './journey.css';

export default function RunPlanScreen() {
  const plan = useRunPlan();
  const pillars = usePillars({ includeArchived: true });
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const habit = plan.habit;
  const pillar = useMemo(
    () => (habit ? pillars.find((p) => p.pillar.id === habit.pillarId)?.pillar : undefined),
    [pillars, habit],
  );
  const color = pillar?.color;
  const week = plan.weeks.find((w) => w.week === (selected ?? plan.next.week)) ?? plan.weeks[0];
  const maxRun = Math.max(...plan.weeks.map((w) => w.runSeconds));
  const perWeek = habit?.goal.perWeek ?? 2;
  const phase = habit?.phase ?? null;

  const start = (w: number) => {
    const session = w === plan.next.week ? plan.next.session : 1;
    prepareRun();
    void navigate(`/corrida/${w}/${session}`);
  };

  if (!habit) {
    return (
      <>
        <NavBar />
        <div className="jr-pad">
          <h1 className="ttl2 jr-title">Plano de corrida</h1>
          <p className="lead">O plano de corrida aparece quando o hábito Corrida faz parte do seu plano.</p>
        </div>
      </>
    );
  }

  const intro = plan.available
    ? `${plan.weeks.length} semanas, ${perWeek} treinos por semana. Dá para repetir uma semana quando quiser.`
    : `${plan.weeks.length} semanas, ${perWeek} treinos por semana. Entra no seu dia junto com a fase ${phase ?? ''}.`;
  const repeating = plan.available && selected != null && selected < plan.next.week;

  return (
    <>
      <NavBar />
      <div className="jr-pad jr-hero">
        <PillarBubble icon="person-simple-run" pillar={color} size="lg" />
        <h1 className="ttl2 jr-title" tabIndex={-1}>
          {capitalize(habit.description || habit.name)}
        </h1>
        <p className="sub muted">{intro}</p>
      </div>

      <div className="jr-pad" style={{ marginTop: 16 }}>
        <ListGroup>
          <ListItem
            icon="calendar-dots"
            pillar={color}
            title="Dias de treino"
            value={scheduleLabel(plan.schedule.days, plan.schedule.time)}
            onClick={() => setScheduleOpen(true)}
          />
        </ListGroup>
      </div>

      <SectionLabel trailing={`${minutesOf(week.totalSeconds)} min`}>{`Semana ${week.week} · o treino`}</SectionLabel>
      <div className="jr-pad">
        <Card padded pillar={color}>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={week.week}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: tween.micro }}
              exit={{ opacity: 0, transition: tween.micro }}
            >
              <WeekWorkout week={week} />
            </m.div>
          </AnimatePresence>
        </Card>
      </div>

      <SectionLabel trailing="tempo de trote">{`As ${plan.weeks.length} semanas`}</SectionLabel>
      <div className="jr-pad">
        <Card pillar={color}>
          <ul className="jr-weeks">
            {plan.weeks.map((w) => {
              const isCurrent = w.current && plan.available;
              const firstNotYet = !plan.available && w.week === 1 && plan.startsOn;
              return (
                <li key={w.week}>
                  <button
                    type="button"
                    className={`jr-wr${w.week === plan.next.week ? ' on' : ''}`}
                    aria-current={selected != null && w.week === week.week ? 'true' : undefined}
                    aria-label={`${w.description}${isCurrent ? ` Agora, ${w.sessionsDone} de ${perWeek} treinos.` : ''}`}
                    onClick={() => setSelected(w.week)}
                  >
                    <span className="jr-wn" aria-hidden="true">
                      {w.week}
                    </span>
                    <span>
                      <b>{runWeekLabel(w)}</b>
                      {firstNotYet && <small>a partir de {formatDayShort(plan.startsOn!)}</small>}
                      {isCurrent && (
                        <small>
                          <BudgetSlots total={perWeek} used={w.sessionsDone} kind="on" />
                          <Tag pillar={color}>agora</Tag>
                        </small>
                      )}
                    </span>
                    <MiniBar value={(w.runSeconds / maxRun) * 100} pillar={color} />
                    <span className="cap num" aria-hidden="true">
                      {minutesOf(w.runSeconds)} min
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
        <p className="foot">
          Em minutos, trote + caminhada. Todo treino começa e termina com 5 min de caminhada. Dá para repetir uma semana
          quantas vezes quiser.
        </p>
      </div>
      <div style={{ height: 24 }} />

      {plan.available && (
        <div className="jr-startbar">
          <Button wide icon="play" iconWeight="fill" onClick={() => start(repeating ? selected! : plan.next.week)}>
            {repeating ? `Repetir a semana ${selected}` : 'Começar treino'}
          </Button>
        </div>
      )}

      <RunScheduleSheet
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        days={plan.schedule.days}
        time={plan.schedule.time}
        perWeek={perWeek}
        pillar={color}
      />
    </>
  );
}

function WeekWorkout({ week }: { week: ReturnType<typeof useRunPlan>['weeks'][number] }) {
  const warm = week.blocks.find((b) => b.kind === 'warmup');
  const cool = week.blocks.find((b) => b.kind === 'cooldown');
  const middle = week.totalSeconds - (warm?.seconds ?? 0) - (cool?.seconds ?? 0);
  return (
    <>
      <IntervalStrip blocks={week.blocks} />
      <div className="jr-brk" aria-hidden="true">
        {warm && <span style={{ flex: warm.seconds }}>{minutesOf(warm.seconds)} min</span>}
        <span style={{ flex: middle }}>{runWeekLabel(week)}</span>
        {cool && <span style={{ flex: cool.seconds }}>{minutesOf(cool.seconds)} min</span>}
      </div>
      <ul className="jr-leg" aria-label={week.description}>
        {runLegend(week).map((r) => (
          <li key={r.kind} className="jr-lr">
            <span className="jr-sw" aria-hidden="true">
              <i className={r.kind === 'run' ? 't' : r.kind === 'walk' ? '' : 'c'} />
            </span>
            <span>{r.label}</span>
            <span className="num">{r.value}</span>
          </li>
        ))}
        <li className="jr-lr tot">
          <span className="jr-sw" />
          <span>Total</span>
          <span className="num">{minutesOf(week.totalSeconds)} min</span>
        </li>
      </ul>
    </>
  );
}
