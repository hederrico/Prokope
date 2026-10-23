// Plano de um treino guiado (jornada.md › Plano do treino): as semanas do plano do hábito, o treino da semana em
// blocos proporcionais, os dias de treino e o atalho para editar o plano. Nada anima ao aparecer: as barras são o
// plano, não um progresso. Com o plano em curso, "Começar treino" fica fixo no rodapé.
// Rota: /jornada/treino/:id. A rota antiga /jornada/corrida leva ao primeiro treino guiado.
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { NavBar, useScreenTitle } from '@/components/shell';
import {
  BudgetSlots,
  Button,
  Card,
  EmptyState,
  ListGroup,
  ListItem,
  MiniBar,
  PillarBubble,
  SectionLabel,
  Tag,
} from '@/components/ui';
import {
  capitalize,
  effortTimeLabel,
  formatDayShort,
  useDataStatus,
  usePillars,
  useRunPlan,
  type TrainingNames,
} from '@/data';
import { tween } from '@/motion';
import { IntervalStrip } from '@/screens/run/IntervalStrip';
import { prepareRun } from '@/screens/run/engine';
import { runPath, trainingEditPath, trainingPlanPath } from '@/screens/run/paths';
import { RunScheduleSheet } from './RunScheduleSheet';
import { aroundText, minutesOf, runLegend, runWeekLabel, scheduleLabel } from './shared';
import './journey.css';

const lower = (s: string) => s.toLocaleLowerCase('pt-BR');

export default function RunPlanScreen() {
  const { id } = useParams();
  const { status } = useDataStatus();
  const plan = useRunPlan(id ?? null);

  // a rota antiga da corrida abre o primeiro treino guiado
  if (!id) {
    if (status !== 'ready') return <NavBar />;
    if (plan.habit) return <Navigate to={trainingPlanPath(plan.habit.id)} replace state={{ transition: 'none' }} />;
    return (
      <>
        <NavBar />
        <div className="jr-pad">
          <h1 className="ttl2 jr-title">Treino guiado</h1>
          <p className="lead">O plano aparece aqui quando um Treino guiado faz parte do seu plano.</p>
        </div>
      </>
    );
  }
  if (!plan.habit) {
    return (
      <>
        <NavBar />
        {status === 'ready' && (
          <div className="jr-pad" style={{ marginTop: 24 }}>
            <EmptyState title="Este treino não existe mais." detail="Ele pode ter sido apagado em outro aparelho." />
          </div>
        )}
      </>
    );
  }
  return <TrainingPlan key={plan.habit.id} habitId={plan.habit.id} />;
}

function TrainingPlan({ habitId }: { habitId: string }) {
  const plan = useRunPlan(habitId);
  const pillars = usePillars({ includeArchived: true });
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const habit = plan.habit!;
  useScreenTitle(habit.name);
  const pillar = useMemo(() => pillars.find((p) => p.pillar.id === habit.pillarId)?.pillar, [pillars, habit]);
  const color = pillar?.color;
  const week = plan.weeks.find((w) => w.week === (selected ?? plan.next.week)) ?? plan.weeks[0];
  const maxEffort = Math.max(1, ...plan.weeks.map((w) => w.effortSeconds));
  const perWeek = plan.perWeek;
  const total = plan.weeks.length;
  const canTrain = plan.available && !habit.archived;

  const start = (w: number) => {
    const session = w === plan.next.week ? plan.next.session : 1;
    prepareRun();
    void navigate(runPath(habit.id, w, session));
  };

  const shape = `${total} ${total === 1 ? 'semana' : 'semanas'}, ${perWeek} ${perWeek === 1 ? 'treino' : 'treinos'} por semana.`;
  const when = habit.archived
    ? 'Arquivado. Os treinos feitos ficam no histórico.'
    : plan.available
      ? 'Dá para repetir uma semana quando quiser.'
      : habit.phase
        ? `Entra no seu dia junto com a fase ${habit.phase}.`
        : plan.startsOn
          ? `Começa em ${formatDayShort(plan.startsOn)}.`
          : '';
  const intro = [habit.description ? `${capitalize(habit.description)}.` : '', shape, when].filter(Boolean).join(' ');
  const repeating = canTrain && selected != null && selected < plan.next.week;

  return (
    <>
      <NavBar />
      <div className="jr-pad jr-hero">
        <PillarBubble icon={habit.icon} pillar={color} size="lg" />
        <h1 className="ttl2 jr-title" tabIndex={-1}>
          {habit.name}
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
          <ListItem
            icon="pencil-simple"
            pillar={color}
            title="Editar o plano"
            value={`${total} ${total === 1 ? 'semana' : 'semanas'}`}
            onClick={() => void navigate(trainingEditPath(habit.id))}
          />
        </ListGroup>
      </div>

      <SectionLabel trailing={`${minutesOf(week.totalSeconds)} min`}>{`Semana ${week.week} · o treino`}</SectionLabel>
      <div className="jr-pad">
        <Card padded pillar={color}>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={`${week.week}:${week.label}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: tween.micro }}
              exit={{ opacity: 0, transition: tween.micro }}
            >
              <WeekWorkout week={week} names={plan.names} />
            </m.div>
          </AnimatePresence>
        </Card>
      </div>

      <SectionLabel trailing={effortTimeLabel(plan.names)}>
        {total === 1 ? 'A semana' : `As ${total} semanas`}
      </SectionLabel>
      <div className="jr-pad">
        <Card pillar={color}>
          <ul className="jr-weeks">
            {plan.weeks.map((w) => {
              const isCurrent = w.current && canTrain;
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
                          <BudgetSlots total={perWeek} used={Math.min(perWeek, w.sessionsDone)} kind="on" />
                          <Tag pillar={color}>agora</Tag>
                        </small>
                      )}
                    </span>
                    <MiniBar value={(w.effortSeconds / maxEffort) * 100} pillar={color} />
                    <span className="cap num" aria-hidden="true">
                      {minutesOf(w.effortSeconds)} min
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
        <p className="foot">
          {`Em minutos, ${lower(plan.names.effort)} + ${lower(plan.names.rest)}. ${aroundText(
            plan.plan.warmupMin,
            plan.plan.cooldownMin,
          )} Dá para repetir uma semana quantas vezes quiser.`}
        </p>
      </div>
      <div style={{ height: 24 }} />

      {canTrain && (
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
        habitId={habit.id}
      />
    </>
  );
}

/** "5 min" embaixo do aquecimento; num bloco estreito (menos de 4 min), só o número, que a legenda explica. */
function edgeLabel(seconds: number): string {
  return seconds >= 240 ? `${minutesOf(seconds)} min` : minutesOf(seconds);
}

/** O treino de uma semana: a fileira de blocos, as medidas por baixo e a legenda com os nomes do plano. */
export function WeekWorkout({
  week,
  names,
}: {
  week: ReturnType<typeof useRunPlan>['weeks'][number];
  names: TrainingNames;
}) {
  const warm = week.blocks.find((b) => b.kind === 'warmup');
  const cool = week.blocks.find((b) => b.kind === 'cooldown');
  const middle = week.totalSeconds - (warm?.seconds ?? 0) - (cool?.seconds ?? 0);
  return (
    <>
      <IntervalStrip blocks={week.blocks} />
      <div className="jr-brk" aria-hidden="true">
        {warm && <span style={{ flex: warm.seconds }}>{edgeLabel(warm.seconds)}</span>}
        <span style={{ flex: middle }}>{runWeekLabel(week)}</span>
        {cool && <span style={{ flex: cool.seconds }}>{edgeLabel(cool.seconds)}</span>}
      </div>
      <ul className="jr-leg" aria-label={week.description}>
        {runLegend(week, names).map((r) => (
          <li key={r.kind} className="jr-lr">
            <span className="jr-sw" aria-hidden="true">
              <i className={r.kind === 'effort' ? 't' : r.kind === 'rest' ? '' : 'c'} />
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
