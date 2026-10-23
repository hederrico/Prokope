// @vitest-environment node
// Editar jornada: parar nesta fase, voltar a seguir, tirar da fase e mover, sobre a história da demonstração
// (quinta, 22 out; fase 2 em curso desde 12 out; fase 3 prevista para 2 nov). Cada ação tem o desfazer.
import { LocalSource } from '@/data/localSource';
import { seedDemo } from '@/data/seed';
import { getDomainData } from '@/data/useDomain';
import { connectSource, disconnectSource, useDataStore, whenReady } from '@/stores/data';
import { setFixedNow } from '@/stores/clock';
import { addDays, instantAt, DEFAULT_CLOCK } from '@/domain/day';
import { habitDay, isActiveOn } from '@/domain/habitState';
import { habitsList } from '@/domain/views';
import {
  keepHabitFollowing,
  moveHabitToPhase,
  removeHabitFromPhase,
  restoreHabit,
  startPhase,
  stopHabitAtPhase,
  undoPhaseChoice,
} from '@/actions';

const THU = '2026-10-22';
let uid = 0;

async function openStory(day = THU, time = '12:41') {
  const now = instantAt(day, time, DEFAULT_CLOCK);
  setFixedNow(now);
  const source = await LocalSource.open(`ej${++uid}`);
  await seedDemo(source, now);
  connectSource(source);
  await whenReady();
  return source;
}

const habitBy = (name: string) => Object.values(useDataStore.getState().habits).find((h) => h.name === name)!;
const fresh = (id: string) => useDataStore.getState().habits[id];

afterEach(() => {
  disconnectSource();
  setFixedNow(null);
});

describe('Editar jornada', () => {
  it('parar numa fase futura: nada muda até ela começar; o "Mudar de ideia" da fase devolve o hábito', async () => {
    await openStory();
    const weight = habitBy('Peso');
    const undo = await stopHabitAtPhase(weight.id, 3);
    expect(fresh(weight.id)).toMatchObject({ untilPhase: 3, untilDay: null });
    let data = getDomainData();
    expect(isActiveOn(fresh(weight.id), THU, data)).toBe(true);

    // a fase 3 começa amanhã: hoje ainda vale; amanhã ele sai
    const tomorrow = addDays(THU, 1);
    const undoStart = await startPhase(3, tomorrow);
    data = getDomainData();
    expect(isActiveOn(fresh(weight.id), THU, data)).toBe(true);
    expect(isActiveOn(fresh(weight.id), tomorrow, data)).toBe(false);
    await undoStart();
    await undoPhaseChoice(3);
    data = getDomainData();
    expect(isActiveOn(fresh(weight.id), tomorrow, data)).toBe(true);

    // o desfazer devolve o documento como era (sem o campo, como os antigos)
    await undo();
    expect(fresh(weight.id).untilPhase ?? null).toBeNull();
    expect(isActiveOn(fresh(weight.id), tomorrow, getDomainData())).toBe(true);
  });

  it('parar na fase em curso: sai a partir de hoje; os dias antes ficam', async () => {
    await openStory();
    const walk = habitBy('Caminhada com o cachorro');
    const undo = await stopHabitAtPhase([walk.id], 2);
    expect(fresh(walk.id)).toMatchObject({ untilPhase: 2, untilDay: THU });
    const data = getDomainData();
    expect(habitDay(fresh(walk.id), THU, data, THU).state).toBe('inactive');
    expect(habitDay(fresh(walk.id), '2026-10-21', data, THU).state).not.toBe('inactive');
    expect(habitsList(data, THU).find((h) => h.habit.id === walk.id)?.status).toBe('archived');
    await undo();
    expect(fresh(walk.id).untilPhase ?? null).toBeNull();
  });

  it('voltar a seguir: os dias em que ficou fora viram pausa do hábito', async () => {
    await openStory();
    const walk = habitBy('Caminhada com o cachorro');
    await stopHabitAtPhase(walk.id, 2);
    // três dias depois, volta a seguir
    const later = addDays(THU, 3);
    setFixedNow(instantAt(later, '09:00', DEFAULT_CLOCK));
    const undo = await keepHabitFollowing(walk.id);
    expect(fresh(walk.id)).toMatchObject({ untilPhase: null, untilDay: null });
    const pause = Object.values(useDataStore.getState().pauses).find((p) => p.habitIds?.includes(walk.id));
    expect(pause).toMatchObject({ start: THU, end: addDays(later, -1) });
    await undo();
    expect(fresh(walk.id)).toMatchObject({ untilPhase: 2, untilDay: THU });
    expect(Object.values(useDataStore.getState().pauses).some((p) => p.habitIds?.includes(walk.id))).toBe(false);

    // desarquivar em Ajustes (ele aparece entre os arquivados) faz o mesmo
    await restoreHabit(walk.id);
    expect(fresh(walk.id)).toMatchObject({ untilPhase: null, untilDay: null, archived: false });
    expect(Object.values(useDataStore.getState().pauses).find((p) => p.habitIds?.includes(walk.id))).toMatchObject({
      start: THU,
      end: addDays(later, -1),
    });
  });

  it('voltar a seguir no mesmo dia: sem pausa', async () => {
    await openStory();
    const walk = habitBy('Caminhada com o cachorro');
    await stopHabitAtPhase(walk.id, 2);
    await keepHabitFollowing(walk.id);
    expect(Object.values(useDataStore.getState().pauses).some((p) => p.habitIds?.includes(walk.id))).toBe(false);
    expect(isActiveOn(fresh(walk.id), THU, getDomainData())).toBe(true);
  });

  it('tirar da fase: o que já está no dia continua; o que esperava entra hoje', async () => {
    await openStory();
    const protein = habitBy('Proteína');
    const youtube = habitBy('YouTube');
    const startDay = protein.startDay;
    const undo = await removeHabitFromPhase([protein.id, youtube.id]);
    expect(fresh(protein.id)).toMatchObject({ phase: null, startDay });
    expect(fresh(youtube.id)).toMatchObject({ phase: null, startDay: THU });
    await undo();
    expect(fresh(protein.id).phase).toBe(2);
    expect(fresh(youtube.id)).toMatchObject({ phase: 3, startDay: null });
  });

  it('mover para a fase de parada (ou depois) desfaz a parada', async () => {
    await openStory();
    const gesture = habitBy('Pequeno gesto');
    await moveHabitToPhase(gesture.id, 3);
    await stopHabitAtPhase(gesture.id, 4);
    expect(fresh(gesture.id).untilPhase).toBe(4);
    await moveHabitToPhase(gesture.id, 4);
    expect(fresh(gesture.id)).toMatchObject({ phase: 4, untilPhase: null });
  });
});
