// @vitest-environment node
// As ações gravam pela fonte ativa (aqui, a LocalSource no IndexedDB de mentira) e devolvem o desfazer.
import { LocalSource } from '@/data/localSource';
import { seedDemo } from '@/data/seed';
import { connectSource, disconnectSource, useDataStore, whenReady } from '@/stores/data';
import { setFixedNow } from '@/stores/clock';
import { instantAt, DEFAULT_CLOCK } from '@/domain/day';
import { markId } from '@/domain/context';
import { defaultPlanDraft } from '@/domain/planTemplate';
import { getDomainData } from '@/data/useDomain';
import { daysSince } from '@/domain/daysSince';
import {
  addEntry,
  archiveHabit,
  archivePillar,
  createHabit,
  createPillar,
  deleteAllData,
  deletePillar,
  endPause,
  exportData,
  finishReview,
  finishRun,
  logMeasurement,
  logSleep,
  logSlip,
  markHabit,
  pauseRun,
  rate,
  removeEntry,
  reorderPillars,
  restoreHabit,
  restorePillar,
  resumeRun,
  saveCheckin,
  saveReviewStep,
  setMark,
  setRunSchedule,
  setScheduleTime,
  setupPlan,
  skipToday,
  spendBudget,
  startPause,
  startPhase,
  startRun,
  stayInPhase,
  toggleHabit,
  unskipToday,
} from '@/actions';

const THU = '2026-10-22';
let uid = 0;

async function openStory(time = '12:41') {
  const now = instantAt(THU, time, DEFAULT_CLOCK);
  setFixedNow(now);
  const source = await LocalSource.open(`t${++uid}`);
  await seedDemo(source, now);
  connectSource(source);
  await whenReady();
  return source;
}

const habitBy = (name: string) => Object.values(useDataStore.getState().habits).find((h) => h.name === name)!;
const pillarBy = (name: string) => Object.values(useDataStore.getState().pillars).find((p) => p.name === name)!;
const marks = () => useDataStore.getState().marks;

afterEach(() => {
  disconnectSource();
  setFixedNow(null);
});

describe('LocalSource', () => {
  it('guarda no aparelho, sobrevive a reabrir e avisa as mudanças', async () => {
    const a = await LocalSource.open('persist');
    const seen: string[] = [];
    a.listen('pillars', (docs, meta) =>
      seen.push(`${docs.length}${meta.hasPendingWrites ? ' esperando' : ''}${meta.metadataOnly ? ' (metadados)' : ''}`),
    );
    await new Promise((r) => setTimeout(r, 0));
    await a.write([{ op: 'set', col: 'pillars', id: 'p1', data: { name: 'Mente' } }]);
    await a.write([{ op: 'merge', col: 'pillars', id: 'p1', data: { order: 2 } }]);
    // cada escrita: a mudança na hora (esperando) e, gravada no aparelho, só os metadados (não espera mais)
    expect(seen).toEqual(['0', '1 esperando', '1 (metadados)', '1 esperando', '1 (metadados)']);
    await a.close();
    const b = await LocalSource.open('persist');
    expect(b.get('pillars', 'p1')).toEqual({ id: 'p1', name: 'Mente', order: 2 });
    await b.deleteAll();
    expect(b.getAll('pillars')).toEqual([]);
    await b.close();
  });
});

describe('registros', () => {
  it('marcar e desfazer', async () => {
    await openStory('07:42');
    const walk = habitBy('Caminhada com o cachorro');
    expect(marks()[markId(THU, walk.id)]).toBeUndefined();
    const pending: boolean[] = [];
    const stop = useDataStore.subscribe((s, prev) => {
      if (s.pendingWrites !== prev.pendingWrites) pending.push(s.pendingWrites);
    });
    const undo = await markHabit(walk.id, THU);
    stop();
    expect(marks()[markId(THU, walk.id)]?.status).toBe('done');
    // a mudança veio deste aparelho: pode celebrar (o fim da gravação não muda a origem)
    expect(useDataStore.getState().origins.marks).toBe('local');
    // esperando enquanto grava no aparelho; gravado, volta a falso (como o Firestore com internet)
    expect(pending).toEqual([true, false]);
    expect(useDataStore.getState().pendingWrites).toBe(false);
    await undo();
    expect(marks()[markId(THU, walk.id)]).toBeUndefined();
    await toggleHabit(walk.id, THU);
    await toggleHabit(walk.id, THU);
    expect(marks()[markId(THU, walk.id)]).toBeUndefined();
  });

  it('corrigir um dia: feito, parcial, sem', async () => {
    await openStory();
    const walk = habitBy('Caminhada com o cachorro');
    const day = '2026-10-21';
    await setMark(walk.id, day, 'partial');
    expect(marks()[markId(day, walk.id)]?.status).toBe('partial');
    const undo = await setMark(walk.id, day, 'none');
    expect(marks()[markId(day, walk.id)]).toBeUndefined();
    await undo();
    expect(marks()[markId(day, walk.id)]?.status).toBe('partial');
    // caminhada de 12 min com mínimo de 10: parcial
    await markHabit(walk.id, '2026-10-17', { value: 12 });
    expect(marks()[markId('2026-10-17', walk.id)]?.status).toBe('partial');
  });

  it('deitar e acordar: o deitar conta na noite anterior; fora da tolerância grava sem contar', async () => {
    await openStory('06:30');
    const wake = habitBy('Acordar');
    const bed = habitBy('Deitar');
    const undo = await logSleep({ bed: '22:40', wake: '06:52' }, THU);
    expect(marks()[markId(THU, wake.id)]).toMatchObject({ status: 'done', time: '06:52' });
    expect(marks()[markId('2026-10-21', bed.id)]).toMatchObject({ status: 'logged', time: '22:40' });
    await undo();
    expect(marks()[markId(THU, wake.id)]).toBeUndefined();
    await logSleep({ bed: '00:30', wake: '06:50' }, THU);
    expect(marks()[markId('2026-10-21', bed.id)]).toMatchObject({ status: 'logged', time: '00:30' });
    await logSleep({ bed: '22:10' }, THU);
    expect(marks()[markId('2026-10-21', bed.id)]).toMatchObject({ status: 'done', time: '22:10' });
  });

  it('nota, check-in e peso', async () => {
    await openStory();
    const lunch = habitBy('Almoço');
    const u1 = await rate(lunch.id, THU, 4, { tags: ['Proteína'] });
    expect(marks()[markId(THU, lunch.id)]).toMatchObject({ rating: 4, status: 'done', tags: ['Proteína'] });
    await u1();
    const u2 = await saveCheckin(THU, { mood: 4, energy: 3, good: ['Passeio', ' ', 'Almoço'] });
    expect(useDataStore.getState().checkins[THU]).toMatchObject({ mood: 4, energy: 3, good: ['Passeio', 'Almoço'] });
    await u2();
    expect(useDataStore.getState().checkins[THU]).toBeUndefined();
    await logMeasurement('weight', THU, 83.4);
    expect(useDataStore.getState().measurements[`${THU}_weight`]?.value).toBe(83.4);
  });

  it('somas: toques seguidos juntam, o − tira uma porção', async () => {
    await openStory('09:00');
    const protein = habitBy('Proteína');
    const before = Object.keys(useDataStore.getState().entries).length;
    const cheese = protein.quickAdds.find((q) => q.name === 'Queijo')!;
    await addEntry(protein.id, { amount: cheese.amount, item: cheese.name, quickAddId: cheese.id }, THU);
    const undo2 = await addEntry(protein.id, { amount: cheese.amount, item: cheese.name, quickAddId: cheese.id }, THU);
    const entries = useDataStore.getState().entries;
    expect(Object.keys(entries).length).toBe(before + 1);
    const e = Object.values(entries).find((x) => x.item === 'Queijo' && x.day === THU)!;
    expect([e.count, e.amount]).toEqual([2, 10]);
    await undo2();
    expect(useDataStore.getState().entries[e.id]).toMatchObject({ count: 1, amount: 5 });
    await addEntry(protein.id, { amount: 5, item: 'Queijo', count: 2 }, THU, { merge: false });
    const last = Object.values(useDataStore.getState().entries).find((x) => x.item === 'Queijo' && x.count === 2)!;
    await removeEntry(last.id, { portions: 1 });
    expect(useDataStore.getState().entries[last.id]).toMatchObject({ count: 1, amount: 5 });
    await removeEntry(last.id);
    expect(useDataStore.getState().entries[last.id]).toBeUndefined();
    const junk = habitBy('Tranqueiras');
    await spendBudget(junk.id, THU);
    expect(
      Object.values(useDataStore.getState().entries).filter((x) => x.habitId === junk.id && x.day === THU),
    ).toHaveLength(1);
  });

  it('deslize: a contagem vai a 0 e volta com o desfazer', async () => {
    await openStory();
    const soda = habitBy('Zero refrigerante');
    const undo = await logSlip(soda.id);
    let ds = daysSince(soda, getDomainData(), THU);
    expect([ds.current, ds.record, ds.total]).toEqual([0, 21, 32]);
    await undo();
    ds = daysSince(soda, getDomainData(), THU);
    expect([ds.current, ds.record, ds.total]).toEqual([12, 21, 33]);
  });

  it('hoje não se aplica e voltar a contar', async () => {
    await openStory();
    const wake = habitBy('Acordar');
    await skipToday(wake.id, THU);
    expect(marks()[markId(THU, wake.id)]).toMatchObject({ skipped: true, status: 'done', time: '06:52' });
    await unskipToday(wake.id, THU);
    expect(marks()[markId(THU, wake.id)]).toMatchObject({ skipped: false, status: 'done' });
    const dishes = habitBy('Louça');
    await skipToday(dishes.id, THU);
    await unskipToday(dishes.id, THU);
    expect(marks()[markId(THU, dishes.id)]).toBeUndefined();
  });

  it('arquivar e desarquivar um hábito', async () => {
    await openStory();
    const football = habitBy('Futebol');
    const undo = await archiveHabit(football.id);
    expect(useDataStore.getState().habits[football.id]).toMatchObject({ archived: true, archivedDay: THU });
    await undo();
    expect(useDataStore.getState().habits[football.id].archived).toBe(false);
    await archiveHabit(football.id);
    await restoreHabit(football.id);
    expect(useDataStore.getState().habits[football.id].archived).toBe(false);
  });
});

describe('plano', () => {
  it('pilares: criar, reordenar, arquivar com o compartilhado passando para o extra, restaurar e apagar', async () => {
    await openStory();
    const familia = pillarBy('Família');
    const corpo = pillarBy('Corpo');
    const walk = habitBy('Caminhada com o cachorro');
    const dishes = habitBy('Louça');
    await archivePillar(familia.id);
    let s = useDataStore.getState();
    expect(s.pillars[familia.id].archived).toBe(true);
    expect(s.habits[dishes.id]).toMatchObject({ archived: true, archivedWith: familia.id });
    expect(s.habits[walk.id]).toMatchObject({ pillarId: corpo.id, archived: false });
    await restorePillar(familia.id);
    s = useDataStore.getState();
    expect(s.habits[dishes.id].archived).toBe(false);
    expect(s.habits[walk.id].pillarId).toBe(familia.id);
    expect(s.habits[walk.id].alsoIn).toEqual([corpo.id]);

    const created = await createPillar({ name: ' Finanças ', color: 'mel', icon: 'piggy-bank' });
    expect(useDataStore.getState().pillars[created.id!]).toMatchObject({ name: 'Finanças', order: 4 });
    const ids = Object.values(useDataStore.getState().pillars)
      .sort((a, b) => a.order - b.order)
      .map((p) => p.id);
    await reorderPillars([created.id!, ...ids.filter((id) => id !== created.id)]);
    expect(useDataStore.getState().pillars[created.id!].order).toBe(0);
    const undoDelete = await deletePillar(created.id!);
    expect(useDataStore.getState().pillars[created.id!]).toBeUndefined();
    await undoDelete();
    expect(useDataStore.getState().pillars[created.id!]).toBeDefined();

    // apagar Corpo: Futebol vai com os registros; a caminhada só perde o extra
    const football = habitBy('Futebol');
    await deletePillar(corpo.id);
    s = useDataStore.getState();
    expect(s.habits[football.id]).toBeUndefined();
    expect(Object.values(s.marks).some((m) => m.habitId === football.id)).toBe(false);
    expect(s.habits[walk.id].alsoIn).toEqual([]);
  });

  it('criar hábito: fase futura espera, fase atual entra hoje', async () => {
    await openStory();
    const mente = pillarBy('Mente');
    const now = await createHabit({
      name: 'Leitura',
      type: 'check',
      pillarId: mente.id,
      icon: 'book-open',
      start: 2,
      goal: { value: 20, unit: 'min', partialMin: 10 },
    });
    expect(useDataStore.getState().habits[now.id!]).toMatchObject({ phase: 2, startDay: THU });
    const later = await createHabit({ name: 'Meditar', type: 'check', pillarId: mente.id, start: 3 });
    expect(useDataStore.getState().habits[later.id!]).toMatchObject({ phase: 3, startDay: null });
  });

  it('pausa: começa e encerra (o fim vira ontem)', async () => {
    await openStory('09:00');
    const created = await startPause({ start: '2026-10-20', end: '2026-10-30', reason: 'sick' });
    await endPause(created.id!, THU);
    expect(useDataStore.getState().pauses[created.id!].end).toBe('2026-10-21');
  });

  it('fases: começar a fase 3, desfazer, ficar mais uma semana', async () => {
    await openStory();
    const run = habitBy('Corrida');
    const undo = await startPhase(3, '2026-10-23');
    let s = useDataStore.getState();
    expect(s.phases['2']).toMatchObject({ end: '2026-10-22' });
    expect(s.phases['3']).toMatchObject({ start: '2026-10-23', end: '2026-11-12' });
    expect(s.habits[run.id].startDay).toBe('2026-10-23');
    await undo();
    s = useDataStore.getState();
    expect(s.phases['3'].start).toBeNull();
    expect(s.habits[run.id].startDay).toBeNull();
    await stayInPhase(2);
    expect(useDataStore.getState().phases['2'].end).toBe('2026-11-08');
  });

  it('revisão: passos e conclusão guardam a constância', async () => {
    await openStory();
    await saveReviewStep(THU, 2, { tweak: 'Desligar as telas às 20h45.', waist: 94.5 });
    expect(useDataStore.getState().reviews['2026-10-19']).toMatchObject({
      step: 2,
      status: 'draft',
      tweak: 'Desligar as telas às 20h45.',
    });
    expect(useDataStore.getState().measurements[`${THU}_waist`]?.value).toBe(94.5);
    await finishReview(THU, { decision: 'stay' });
    const r = useDataStore.getState().reviews['2026-10-19'];
    expect(r.status).toBe('done');
    expect(Math.round(r.constancy! * 100)).toBe(76);
  });

  it('horário muda a partir de hoje', async () => {
    await openStory();
    await setScheduleTime('bed', '22:30');
    const p = useDataStore.getState().profile!;
    expect(p.schedule.bed).toBe('22:30');
    expect(p.scheduleLog.filter((c) => c.key === 'bed').map((c) => c.time)).toEqual(['22:00', '22:30']);
  });
});

describe('corrida', () => {
  it('um treino completo marca a Corrida como feita', async () => {
    await openStory('07:10');
    await startPhase(3, THU);
    const t0 = instantAt(THU, '07:10', DEFAULT_CLOCK);
    const run = await startRun({ week: 1, session: 1 });
    setFixedNow(t0 + 5 * 60_000);
    await pauseRun(run.id!);
    setFixedNow(t0 + 7 * 60_000);
    await resumeRun(run.id!);
    setFixedNow(t0 + 33 * 60_000);
    await finishRun(run.id!);
    const r = useDataStore.getState().runs[run.id!];
    expect(r).toMatchObject({ status: 'done', seconds: 30 * 60, intervalsDone: 8 });
    const corrida = habitBy('Corrida');
    expect(marks()[markId(THU, corrida.id)]).toMatchObject({ status: 'done', value: 30 });
  });

  it('um treino guiado de pedalar usa os blocos do plano dele e conta pelo plano', async () => {
    await openStory('07:10');
    const corpo = pillarBy('Corpo');
    const created = await createHabit({
      name: 'Bicicleta',
      type: 'guided',
      pillarId: corpo.id,
      icon: 'person-simple-bike',
      goal: { perWeek: 3 },
      schedule: { days: [1, 3, 5], moment: 'morning', time: '06:30' },
      training: {
        effort: 'Pedalar',
        rest: 'Pedalar leve',
        warmupMin: 2,
        cooldownMin: 2,
        weeks: [
          { kind: 'repeat', repeat: 2, effort: 1, rest: 1 },
          { kind: 'continuous', minutes: 5 },
        ],
      },
      start: THU,
    });
    const bike = useDataStore.getState().habits[created.id!];
    expect(bike).toMatchObject({ type: 'guided', training: { effort: 'Pedalar' } });
    const t0 = instantAt(THU, '07:10', DEFAULT_CLOCK);
    const run = await startRun({ week: 1, session: 1, habitId: bike.id });
    // 2 + 2 × (1 + 1) + 2 = 8 min; encerrado com 5 min, conta como parcial (a partir da metade)
    setFixedNow(t0 + 5 * 60_000);
    await finishRun(run.id!);
    expect(useDataStore.getState().runs[run.id!]).toMatchObject({ status: 'done', seconds: 300, intervalsDone: 2 });
    expect(marks()[markId(THU, bike.id)]).toMatchObject({ status: 'partial', value: 5, goal: { value: 8 } });
  });

  it('a corrida de antes chega como Treino guiado e a próxima gravação já sai no formato novo', async () => {
    const source = await openStory('12:41');
    const corrida = habitBy('Corrida');
    // o documento como ele está no Firestore de quem já usa o app (sem plano, 'weekly')
    const old: Record<string, unknown> = {
      ...corrida,
      type: 'weekly',
      goal: { perWeek: 2, value: 30, unit: 'min', partialMin: 15 },
    };
    delete old.training;
    await source.write([{ op: 'set', col: 'habits', id: corrida.id, data: old }]);
    expect(source.get('habits', corrida.id)).toMatchObject({ type: 'weekly' });
    expect(source.get('habits', corrida.id)).not.toHaveProperty('training');
    // na leitura, já é Treino guiado com o plano de 13 semanas
    const read = useDataStore.getState().habits[corrida.id];
    expect(read.type).toBe('guided');
    expect(read.training?.weeks).toHaveLength(13);
    // um merge só dos dias grava junto o formato novo
    await setRunSchedule({ days: [1, 3], time: '06:30' }, corrida.id);
    const saved = source.get('habits', corrida.id) as unknown as typeof corrida;
    expect(saved.type).toBe('guided');
    expect(saved.training?.effort).toBe('Correr');
    expect(saved.training?.weeks).toHaveLength(13);
    expect(saved.schedule).toMatchObject({ days: [1, 3], time: '06:30' });
  });
});

describe('dados', () => {
  it('exporta CSV e JSON', async () => {
    await openStory();
    const csv = await exportData('csv');
    expect(csv.filename).toBe(`prokope-${THU}.csv`);
    expect(csv.content.split('\n')[0]).toContain('dia,pilar,hábito,tipo,valor,unidade,fase');
    const json = await exportData('json');
    const parsed = JSON.parse(json.content);
    expect(parsed.habits.length).toBeGreaterThan(10);
  });

  it('apagar tudo e montar o plano de novo (primeiro acesso)', async () => {
    await openStory();
    await deleteAllData();
    const s = useDataStore.getState();
    expect(s.profile).toBeNull();
    expect(Object.keys(s.habits)).toHaveLength(0);
    await setupPlan(defaultPlanDraft(), { name: 'Henrique' });
    const after = useDataStore.getState();
    expect(after.profile?.planSetupAt).toBeTruthy();
    expect(Object.keys(after.pillars)).toHaveLength(4);
    expect(after.phases['1'].start).toBe(THU);
  });
});
