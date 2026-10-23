// @vitest-environment node
// Treino guiado: o plano em semanas (qualquer esforço), o motor por blocos, o próximo treino e a migração na leitura
// da corrida de antes (type 'weekly', role 'run', sem plano), sem perder os treinos feitos nem o progresso.
import { describe, expect, it } from 'vitest';
import type { Habit, Run, TrainingPlan } from '@/types';
import { buildDomainData, emptyRawData } from '../context';
import { instantAt, DEFAULT_CLOCK } from '../day';
import { migrationPatch, normalizeHabit } from '../normalize';
import {
  RUN_PLAN,
  RUN_TEMPLATE,
  effortSecondsDone,
  effortTimeLabel,
  gerund,
  intervalsCompleted,
  nextSession,
  planWeek,
  planWeeks,
  runPosition,
  sessionStatus,
  templateOf,
  trainingOf,
} from '../runPlan';
import { journeyView, runPlanView } from '../views';

const PEDAL: TrainingPlan = {
  effort: 'Pedalar',
  rest: 'Pedalar leve',
  warmupMin: 3,
  cooldownMin: 0,
  weeks: [
    { kind: 'repeat', repeat: 4, effort: 3, rest: 2 },
    { kind: 'continuous', minutes: 15 },
  ],
};

/** A corrida como ela está hoje no Firestore de quem já usa o app (antes do Treino guiado). */
function oldRun(): Habit {
  return {
    id: 'corrida',
    name: 'Corrida',
    type: 'weekly',
    icon: 'person-simple-run',
    pillarId: 'corpo',
    alsoIn: [],
    phase: 3,
    startDay: '2026-10-05',
    role: 'run',
    description: 'do zero aos 30 minutos',
    shortName: 'corrida',
    goal: { perWeek: 2, value: 30, unit: 'min', partialMin: 15 },
    schedule: { days: [0, 2], moment: 'morning', time: '07:10' },
    quickAdds: [],
    checklist: [],
    order: 3,
    archived: false,
    archivedAt: null,
    createdAt: 0,
    updatedAt: 0,
  };
}

function doneRun(i: number, week: number, session: number, habitId = 'corrida'): Run {
  const startedAt = instantAt('2026-10-05', '07:10', DEFAULT_CLOCK) + i * 2 * 86_400_000;
  return {
    id: `r${i}`,
    habitId,
    day: '2026-10-05',
    week,
    session,
    startedAt,
    pauses: [],
    status: 'done',
    endedAt: startedAt + 30 * 60_000,
    seconds: 1800,
    intervalsDone: 8,
  };
}

describe('plano do treino guiado', () => {
  it('o modelo pronto é a corrida de 13 semanas, com correr e caminhar', () => {
    expect(RUN_TEMPLATE.name).toBe('Corrida do zero aos 30 minutos');
    expect(RUN_PLAN).toHaveLength(13);
    expect(RUN_PLAN[2].description).toBe(
      'Semana 3: 6 vezes correr 1 minuto e meio e caminhar 1 minuto e meio. 9 minutos correndo no total.',
    );
    expect(RUN_PLAN[9].description).toBe(
      'Semana 10: correr 15 minutos, caminhar 2 minutos e correr 8 minutos. 23 minutos correndo no total.',
    );
    expect(RUN_PLAN[12].description).toBe('Semana 13: correr 30 minutos sem parar. 30 minutos correndo no total.');
    expect(templateOf(trainingOf(null))?.key).toBe('corrida-30');
  });

  it('o gerúndio do nome escreve as frases (e um nome que não é verbo fica como está)', () => {
    expect(gerund('Correr')).toBe('correndo');
    expect(gerund('Pedalar leve')).toBe('pedalando leve');
    expect(gerund('Subir')).toBe('subindo');
    expect(gerund('Trote')).toBeNull();
    expect(effortTimeLabel({ effort: 'Nadar', rest: 'Descansar' })).toBe('tempo nadando');
    expect(effortTimeLabel({ effort: 'Trote', rest: 'Caminhada' })).toBe('tempo de trote');
  });

  it('monta os blocos de um plano de pedalar, com aquecimento e sem volta à calma', () => {
    const [w1, w2] = planWeeks(PEDAL);
    expect(w1.blocks.map((b) => `${b.kind}:${b.seconds / 60}`)).toEqual([
      'warmup:3',
      'effort:3',
      'rest:2',
      'effort:3',
      'rest:2',
      'effort:3',
      'rest:2',
      'effort:3',
      'rest:2',
    ]);
    expect(w1.totalSeconds).toBe(23 * 60);
    expect(w1.effortSeconds).toBe(12 * 60);
    expect(w1.intervals).toBe(4);
    expect(w1.label).toBe('4× (3 + 2)');
    expect(w1.description).toBe(
      'Semana 1: 4 vezes pedalar 3 minutos e pedalar leve 2 minutos. 12 minutos pedalando no total.',
    );
    expect(w2.blocks.map((b) => b.kind)).toEqual(['warmup', 'effort']);
    // a semana além da última volta para a última
    expect(planWeek(PEDAL, 9).week).toBe(2);
  });

  it('o motor acha o bloco pelo tempo e conta o esforço feito', () => {
    const w1 = planWeek(PEDAL, 1);
    // 3 min de aquecimento + 3 de esforço + 1 de descanso: no 1º descanso, intervalo 1
    const pos = runPosition(w1, 7 * 60);
    expect(pos.block.kind).toBe('rest');
    expect(pos.interval).toBe(1);
    expect(intervalsCompleted(w1, 7 * 60)).toBe(1);
    expect(effortSecondsDone(w1, 7 * 60)).toBe(3 * 60);
    // sem aquecimento, o primeiro bloco já é o esforço
    const direct = planWeek({ ...PEDAL, warmupMin: 0 }, 1);
    expect(runPosition(direct, 0).block.kind).toBe('effort');
    expect(runPosition(direct, 0).interval).toBe(1);
  });

  it('o treino inteiro é feito, a partir da metade é parcial, abaixo fica registrado', () => {
    const w = planWeek(PEDAL, 1);
    expect(sessionStatus(w, w.totalSeconds)).toBe('done');
    expect(sessionStatus(w, w.totalSeconds / 2)).toBe('partial');
    expect(sessionStatus(w, 60)).toBe('logged');
  });

  it('o próximo treino segue os treinos por semana do hábito e para na última semana', () => {
    expect(nextSession(0, 2, 3)).toEqual({ week: 1, session: 1 });
    expect(nextSession(3, 2, 3)).toEqual({ week: 2, session: 1 });
    expect(nextSession(5, 2, 3)).toEqual({ week: 2, session: 3 });
    expect(nextSession(9, 2, 3)).toEqual({ week: 2, session: 3 });
    // o padrão continua o da corrida: 2 por semana, 13 semanas
    expect(nextSession(3)).toEqual({ week: 2, session: 2 });
  });

  it('lê um plano estragado sem quebrar: nomes vazios, semanas inválidas, nada gravado', () => {
    const broken = {
      training: {
        effort: '  ',
        rest: '',
        warmupMin: -1,
        cooldownMin: 2,
        weeks: [{ kind: 'repeat', repeat: 0, effort: 1, rest: 1 }, { kind: 'continuous', minutes: 12 }, null],
      },
    } as unknown as Habit;
    const plan = trainingOf(broken);
    expect(plan.effort).toBe('Correr');
    expect(plan.rest).toBe('Caminhar');
    expect(plan.warmupMin).toBe(5);
    expect(plan.cooldownMin).toBe(2);
    expect(plan.weeks).toEqual([{ kind: 'continuous', minutes: 12 }]);
    // o mesmo plano gravado devolve o mesmo objeto (as semanas são calculadas uma vez)
    expect(trainingOf(broken)).toBe(plan);
    expect(trainingOf({ training: null } as Habit).weeks).toHaveLength(13);
  });
});

describe('migração na leitura', () => {
  it('a corrida de antes vira Treino guiado com o plano de 13 semanas', () => {
    const before = oldRun();
    const h = normalizeHabit(before);
    expect(h.type).toBe('guided');
    expect(h.training?.effort).toBe('Correr');
    expect(h.training?.rest).toBe('Caminhar');
    expect(h.training?.weeks).toHaveLength(13);
    // o resto do documento fica como estava
    expect(h).toMatchObject({ id: 'corrida', role: 'run', schedule: before.schedule, startDay: '2026-10-05' });
    expect(h.goal.perWeek).toBe(2);
    // o documento antigo não muda; o próximo merge leva os campos da migração
    expect(before.type).toBe('weekly');
    expect(migrationPatch(h)).toMatchObject({ type: 'guided' });
    // um documento no formato de hoje volta igual (o mesmo objeto), sem nada para gravar
    expect(normalizeHabit(h)).toBe(h);
    const other = { ...before, id: 'academia', role: null, name: 'Academia' };
    expect(normalizeHabit(other)).toBe(other);
    expect(migrationPatch(other)).toBeNull();
  });

  it('sem perder os treinos feitos nem o progresso: semana e treino atuais', () => {
    const raw = emptyRawData();
    raw.habits = [oldRun()];
    // 5 treinos feitos: semanas 1 e 2 completas e o 1º da semana 3
    raw.runs = [doneRun(0, 1, 1), doneRun(1, 1, 2), doneRun(2, 2, 1), doneRun(3, 2, 2), doneRun(4, 3, 1)];
    const data = buildDomainData(raw);
    expect(data.habits[0].type).toBe('guided');
    const now = instantAt('2026-10-22', '12:00', DEFAULT_CLOCK);
    const plan = runPlanView(data, now, 'corrida');
    expect(plan.habit?.id).toBe('corrida');
    expect(plan.next).toEqual({ week: 3, session: 2 });
    expect(plan.sessionsDone).toBe(5);
    expect(plan.history).toHaveLength(5);
    expect(plan.weeks[2].sessionsDone).toBe(1);
    expect(plan.names).toEqual({ effort: 'Correr', rest: 'Caminhar' });
    // sem id (as rotas antigas), o primeiro treino guiado
    expect(runPlanView(data, now).habit?.id).toBe('corrida');
    // a Jornada mostra o cartão com o nome do hábito e onde a pessoa está
    const j = journeyView(data, now);
    expect(j.trainings.map((t) => [t.habit.name, t.next.week, t.next.session, t.weeks])).toEqual([
      ['Corrida', 3, 2, 13],
    ]);
  });

  it('a Jornada mostra um cartão por treino guiado ativo; arquivado sai, os treinos ficam', () => {
    const raw = emptyRawData();
    const pedal: Habit = {
      ...oldRun(),
      id: 'bike',
      name: 'Bicicleta',
      type: 'guided',
      role: null,
      icon: 'person-simple-bike',
      description: undefined,
      goal: { perWeek: 3 },
      training: PEDAL,
      order: 4,
    };
    raw.habits = [oldRun(), pedal];
    raw.runs = [doneRun(0, 1, 1, 'bike')];
    const now = instantAt('2026-10-22', '12:00', DEFAULT_CLOCK);
    const j = journeyView(buildDomainData(raw), now);
    expect(j.trainings.map((t) => t.habit.name)).toEqual(['Corrida', 'Bicicleta']);
    expect(j.trainings[1]).toMatchObject({ weeks: 2, perWeek: 3, next: { week: 1, session: 2 } });
    expect(j.trainings[1].names).toEqual({ effort: 'Pedalar', rest: 'Pedalar leve' });

    raw.habits = [oldRun(), { ...pedal, archived: true, archivedAt: now, archivedDay: '2026-10-22' }];
    const data = buildDomainData(raw);
    expect(journeyView(data, now).trainings.map((t) => t.habit.name)).toEqual(['Corrida']);
    // o plano do arquivado ainda abre, com o histórico
    expect(runPlanView(data, now, 'bike').history).toHaveLength(1);
  });
});
