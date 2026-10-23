// Sua rotina · 3 de 3 (entrada.md): os horários dos hábitos escolhidos, a revisão da semana (dia e hora) e os dias
// de coleta. Cada horário é um <input type="time"> nativo (a roda do iPhone presa ao valor), sem folha nem "Pronto".
// A linha inteira é o alvo. Telas desligadas acompanha o deitar até a pessoa mudar o horário das telas.
import type { MouseEvent } from 'react';
import { DayPicker, InsightCard, ListGroup, ListItem, TimeValue } from '@/components/ui';
import { weekdayLabel, weekdayShortLabel, type PlanDraft } from '@/data';
import type { Weekday } from '@/types';
import { chosenHabits, collectionHabit, routineRows, withTime } from './plan';
import { StepHead } from './StepHead';

/** Tocar fora do valor abre a escolha nativa do valor da linha. */
function openPicker(e: MouseEvent<HTMLElement>) {
  const target = e.target as HTMLElement;
  if (target.closest('input, select')) return;
  const field = e.currentTarget.querySelector<HTMLInputElement | HTMLSelectElement>('input, select');
  if (!field) return;
  try {
    field.showPicker();
  } catch {
    field.focus();
  }
}

export function RoutineStep({
  draft,
  onDraft,
}: {
  draft: PlanDraft;
  onDraft: (fn: (d: PlanDraft) => PlanDraft) => void;
}) {
  const rows = routineRows(draft);
  const collect = collectionHabit(draft);
  const hasTimes = chosenHabits(draft).some((c) => c.habit.type === 'time');
  const bed = rows.find((r) => r.key === 'bed');
  const review = draft.weeklyReview;
  const short = collect?.habit.short ?? '';

  return (
    <>
      <StepHead
        step={3}
        title="Sua rotina"
        lead={rows.length ? 'Toque num horário para ajustar ao seu ritmo.' : 'Escolha quando revisar a semana.'}
      />
      <div className="ob-body">
        {rows.length > 0 && (
          <ListGroup label="Horários">
            {rows.map((r) => (
              <div key={r.key} className="ob-row" onClick={openPicker}>
                <ListItem
                  icon={r.icon}
                  pillar={r.pillar}
                  title={r.title}
                  subtitle={r.subtitle}
                  trailing={
                    <TimeValue
                      kind="time"
                      value={r.value}
                      label={r.title}
                      onChange={(v) => onDraft((d) => withTime(d, r.key, v))}
                    />
                  }
                />
              </div>
            ))}
          </ListGroup>
        )}
        {bed && (
          <span className="ob-sr" aria-live="polite">
            {bed.subtitle}
          </span>
        )}
        {hasTimes && draft.weekendTolerance && (
          <InsightCard
            pillar="accent"
            icon="sun-horizon"
            text="No fim de semana, até 1h de diferença conta como feito."
            animateIn={false}
          />
        )}
        <ListGroup>
          <div className="ob-row" onClick={openPicker}>
            <ListItem
              icon="calendar-check"
              title="Revisão da semana"
              subtitle="resumo em 3 passos"
              trailing={
                <span className="ob-review num">
                  <span>
                    {weekdayShortLabel(review.weekday)},
                    <select
                      aria-label={`Dia da revisão da semana, ${weekdayLabel(review.weekday)}`}
                      value={review.weekday}
                      onChange={(e) =>
                        onDraft((d) => ({
                          ...d,
                          weeklyReview: { ...d.weeklyReview, weekday: Number(e.target.value) as Weekday },
                        }))
                      }
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((w) => (
                        <option key={w} value={w}>
                          {weekdayLabel(w)}
                        </option>
                      ))}
                    </select>
                  </span>
                  &nbsp;
                  <span>
                    {review.time}
                    <input
                      type="time"
                      aria-label="Horário da revisão da semana"
                      value={review.time}
                      onChange={(e) =>
                        e.target.value &&
                        onDraft((d) => ({ ...d, weeklyReview: { ...d.weeklyReview, time: e.target.value } }))
                      }
                    />
                  </span>
                </span>
              }
            />
          </div>
          {collect && (
            <div className="ob-col">
              <ListItem
                icon={collect.habit.icon}
                pillar={collect.pillar.color}
                title={`Coleta do ${short}`}
                subtitle={
                  draft.collectionDays.length ? `o ${short} entra no Hoje nesses dias` : `O ${short} não entra no Hoje`
                }
                chevron={false}
              />
              <DayPicker
                value={draft.collectionDays}
                onChange={(v) => onDraft((d) => ({ ...d, collectionDays: v as Weekday[] }))}
                pillar={collect.pillar.color}
                label={`Dias de coleta do ${short}`}
              />
            </div>
          )}
        </ListGroup>
      </div>
    </>
  );
}
