// Progresso · um pilar (habito-progresso.md › Vista de um pilar): montada pelo tipo de cada hábito do pilar, nesta
// ordem: contadores (um cartão por hábito, barras em g ou anéis em L), Hábitos, Limites da semana, Dias sem e Notas.
// Seção sem hábito não aparece; um hábito de dois pilares aparece nos dois. Toda linha abre o hábito.
import { m } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  BudgetRow,
  CardHeader,
  EmptyState,
  HabitList,
  HabitRow,
  MiniBar,
  PillarBubble,
  SectionLabel,
  ValuePill,
  WeekDots,
  fmtNumber,
  pillarAttrs,
} from '@/components/ui';
import { Icon } from '@/icons';
import { fadeUpItem, useCascadeOnce } from '@/motion';
import { formatVolume, isWeeklyKind, useDomain, type ProgressView, type WeekProgress } from '@/data';
import type { DayKey } from '@/types';
import type { Habit } from '@/types';
import { DailyBarsChart } from './DailyBarsChart';
import { DayRings } from './DayRings';
import { useDrawGate, useDrawnValue } from './draw';
import { fmt1, pillarColor } from './format';

export interface PillarViewProps {
  p: ProgressView;
  today: DayKey;
  onOpenDay: (day: DayKey) => void;
}

function weekText(habit: Habit, w: WeekProgress, today: DayKey): string {
  if (isWeeklyKind(habit)) return `${w.done} de ${w.target} na semana`;
  if (habit.type === 'time') {
    const counted = w.days.filter(
      (d) => d.day <= today && (d.state === 'done' || d.state === 'partial' || d.state === 'notDone') && !(d.day === today && d.state === 'notDone'),
    ).length;
    return `no horário em ${w.done} de ${counted} ${counted === 1 ? 'dia' : 'dias'}`;
  }
  if (habit.goal.perWeek) return `${w.done} de ${w.scheduled} · meta ${habit.goal.perWeek}`;
  return `${w.done} de ${w.scheduled}`;
}

function NoteTile({ habit, avg, onOpen }: { habit: Habit; avg: number | null; onOpen: () => void }) {
  const data = useDomain();
  const { observe, started } = useDrawGate<HTMLButtonElement>(`pg:nota:${habit.id}`, { durationMs: 400 });
  const pct = avg !== null ? (avg / 5) * 100 : 0;
  const v = useDrawnValue(`pg:nota:${habit.id}`, pct, 0, started);
  const pa = pillarAttrs(pillarColor(data.pillarById.get(habit.pillarId)));
  return (
    <button
      ref={observe}
      type="button"
      className={`pk-reset pk-card pg-nt pk-press ${pa.className ?? ''}`}
      data-pillar={pa['data-pillar']}
      data-hue={pa['data-hue']}
      aria-label={`${habit.name}, média ${avg !== null ? `${fmtNumber(avg)} de 5` : 'sem notas'}`}
      onClick={onOpen}
    >
      <span className="pg-nt-h">
        <PillarBubble icon={habit.icon} pillar={pillarColor(data.pillarById.get(habit.pillarId))} size="sm" />
        <b>{habit.name}</b>
      </span>
      <span className="pg-ntv">
        <b>{avg !== null ? fmt1(avg) : '—'}</b>
        <span className="cap">de 5</span>
      </span>
      <MiniBar value={v} thick />
    </button>
  );
}

export function PillarView({ p, today, onOpenDay }: PillarViewProps) {
  const cascade = useCascadeOnce('progresso:pilar');
  const navigate = useNavigate();
  const data = useDomain();
  const v = p.pillar;
  if (!v) return null;
  const open = (id: string) => navigate(`/progresso/habito/${encodeURIComponent(id)}`);
  const colorOf = (h: Habit) => pillarColor(data.pillarById.get(h.pillarId)) ?? 'accent';
  const empty = !v.counters.length && !v.habits.length && !v.limits.length && !v.daysSince.length && !v.ratings.length;

  if (empty) {
    return (
      <div className="pg-pad">
        <EmptyState
          title="Nenhum hábito neste pilar."
          action={{ label: 'Criar hábito', onClick: () => navigate('/ajustes/habitos/novo/tipo') }}
        />
      </div>
    );
  }

  return (
    <m.div {...cascade}>
      {v.counters.length > 0 && (
        <div className="pg-pad pg-stack">
          {v.counters.map((c) => {
            const unit = c.habit.goal.unit;
            const liquid = unit === 'ml' || unit === 'L';
            const goal = c.days.find((d) => d.goal !== undefined)?.goal ?? c.habit.goal.value;
            const hasToday = c.days.some((d) => d.isToday);
            const sub = liquid
              ? `${c.habit.name} por dia${goal ? ` · meta ${unit === 'ml' ? formatVolume(goal) : `${goal} ${unit}`}` : ''}`
              : `${c.habit.name} por dia, em ${unit === 'g' ? 'gramas' : unit ?? 'unidades'}`;
            const pa = pillarAttrs(colorOf(c.habit));
            return (
              <m.div
                key={c.habit.id}
                variants={fadeUpItem}
                className={`pk-card p pg-pc ${pa.className ?? ''}`}
                data-pillar={pa['data-pillar']}
                data-hue={pa['data-hue']}
              >
                <CardHeader title={c.summary} subtitle={sub} />
                {liquid ? (
                  <DayRings
                    chartKey={`pg:aneis:${c.habit.id}`}
                    days={c.days}
                    goal={goal ?? 0}
                    unit={unit}
                    onSelect={onOpenDay}
                  />
                ) : (
                  <>
                    <div style={{ margin: '14px 0 12px' }}>
                      <DailyBarsChart
                        chartKey={`pg:barras:${c.habit.id}`}
                        days={c.days}
                        goal={goal}
                        unit={unit}
                        label={`${c.habit.name} por dia. ${c.summary}.`}
                        onSelect={onOpenDay}
                      />
                    </div>
                    {hasToday && (
                      <div className="pk-hmk" aria-hidden="true">
                        <span>
                          <i className="pg-khatch" />
                          hoje, até agora
                        </span>
                      </div>
                    )}
                  </>
                )}
              </m.div>
            );
          })}
        </div>
      )}

      {v.habits.length > 0 && (
        <m.section variants={fadeUpItem} aria-labelledby="pg-p-habitos">
          <SectionLabel id="pg-p-habitos">Hábitos</SectionLabel>
          <div className="pg-pad">
            <HabitList>
              {v.habits.map(({ habit, week }) => (
                <HabitRow
                  key={habit.id}
                  habit={{ name: habit.name, icon: habit.icon, pillar: colorOf(habit) }}
                  subtitle={
                    <>
                      {habit.type !== 'time' && <WeekDots total={isWeeklyKind(habit) ? week.target : week.scheduled} done={week.done} />}
                      {weekText(habit, week, today)}
                    </>
                  }
                  control={
                    <span className="pg-chevctl" aria-hidden="true">
                      <Icon name="caret-right" weight="bold" />
                    </span>
                  }
                  onOpen={() => open(habit.id)}
                />
              ))}
            </HabitList>
          </div>
        </m.section>
      )}

      {v.limits.length > 0 && (
        <m.section variants={fadeUpItem} aria-labelledby="pg-p-limites">
          <SectionLabel id="pg-p-limites">Limites da semana</SectionLabel>
          <div className="pg-pad">
            <ul className="pk-card pk-lst pg-limits">
              {v.limits.map(({ habit, budget }) => (
                <li key={habit.id}>
                  <button type="button" className="pk-reset pg-limit pk-press" onClick={() => open(habit.id)}>
                    <BudgetRow
                      habit={{ name: habit.name, pillar: colorOf(habit) }}
                      used={budget.used}
                      total={budget.limit}
                      note={`até ${budget.limit}${habit.goal.unit === 'dias' ? ' dias' : ''} por semana`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </m.section>
      )}

      {v.daysSince.length > 0 && (
        <m.section variants={fadeUpItem} aria-labelledby="pg-p-dias">
          <SectionLabel id="pg-p-dias">Dias sem</SectionLabel>
          <div className="pg-pad">
            <HabitList>
              {v.daysSince.map(({ habit, daysSince }) => (
                <HabitRow
                  key={habit.id}
                  habit={{ name: habit.name, icon: habit.icon, pillar: colorOf(habit) }}
                  subtitle={`recorde ${daysSince.record} ${daysSince.record === 1 ? 'dia' : 'dias'}`}
                  a11yLabel={`${habit.name}, ${daysSince.current} ${daysSince.current === 1 ? 'dia' : 'dias'} sem, recorde ${daysSince.record}`}
                  control={
                    <span className="pg-chevctl" aria-hidden="true">
                      <ValuePill
                        value={`${daysSince.current} ${daysSince.current === 1 ? 'dia' : 'dias'}`}
                        icon={null}
                        label={`${daysSince.current} dias`}
                        pillar={colorOf(habit)}
                      />
                      <Icon name="caret-right" weight="bold" />
                    </span>
                  }
                  onOpen={() => open(habit.id)}
                />
              ))}
            </HabitList>
          </div>
        </m.section>
      )}

      {v.ratings.length > 0 && (
        <m.section variants={fadeUpItem} aria-labelledby="pg-p-notas">
          <SectionLabel id="pg-p-notas" trailing={p.range.period === 'week' ? 'média da semana' : p.range.period === 'month' ? 'média do mês' : 'média da fase'}>
            {v.ratings.every((r) => r.habit.role === 'lunch' || r.habit.role === 'dinner') ? 'Notas dos pratos' : 'Notas'}
          </SectionLabel>
          <div className="pg-pad pg-two">
            {v.ratings.map((r) => (
              <NoteTile key={r.habit.id} habit={r.habit} avg={r.avg} onOpen={() => open(r.habit.id)} />
            ))}
          </div>
        </m.section>
      )}
      <div className="pg-spacer" />
    </m.div>
  );
}
