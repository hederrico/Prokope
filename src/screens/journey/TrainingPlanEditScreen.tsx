// Editar plano (tela cheia, a partir do plano do treino guiado na Jornada): o mesmo editor do formulário do hábito,
// num formulário próprio: Cancelar · Plano · Salvar (acende quando algo mudou). Salvar grava o plano no hábito e
// volta ao plano; os treinos feitos e o progresso continuam (jornada.md › Editar plano).
import { useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { FullScreen, NavBar, useGoBack } from '@/components/shell';
import { updateHabit } from '@/actions';
import { clonePlan, sessionsPerWeek, trainingOf, useHabit, type HabitView } from '@/data';
import type { PillarColor } from '@/components/ui';
import { TrainingPlanEditor } from '@/screens/settings/TrainingPlanEditor';
import { trainingPlanPath } from '@/screens/run/paths';

export default function TrainingPlanEditScreen() {
  const { id } = useParams();
  const view = useHabit(id);
  if (!view || view.habit.type !== 'guided') return <Navigate to="/jornada" replace />;
  return <PlanForm key={view.habit.id} view={view} />;
}

function PlanForm({ view }: { view: HabitView }) {
  const goBack = useGoBack();
  const habit = view.habit;
  const saved = trainingOf(habit);
  const [plan, setPlan] = useState(() => clonePlan(saved));
  const [busy, setBusy] = useState(false);
  const changed = JSON.stringify(plan) !== JSON.stringify(saved);
  const back = () => goBack(trainingPlanPath(habit.id));
  const save = async () => {
    if (!changed || busy) return;
    setBusy(true);
    await updateHabit(habit.id, { training: plan });
    back();
  };
  return (
    <FullScreen
      top={
        <NavBar
          cancel
          title="Plano"
          onBack={back}
          action={{ label: 'Salvar', disabled: !changed || busy, onClick: () => void save() }}
        />
      }
    >
      <TrainingPlanEditor
        plan={plan}
        onChange={setPlan}
        perWeek={sessionsPerWeek(habit)}
        pillar={view.pillar?.color as PillarColor | undefined}
        name={habit.name}
      />
    </FullScreen>
  );
}
