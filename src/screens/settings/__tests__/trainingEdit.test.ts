// @vitest-environment node
// O editor do plano do Treino guiado: adicionar, duplicar, remover, trocar o formato, usar um modelo, e o
// formulário do hábito com o tipo novo (padrões, rascunho e Editar hábito).
import { describe, expect, it } from 'vitest';
import { runTemplatePlan } from '@/data';
import type { Habit, TrainingPlan } from '@/types';
import {
  addWeek,
  applyTemplate,
  BLANK_KEY,
  convertWeek,
  duplicateWeek,
  removeWeek,
  setWeek,
  templateKey,
} from '../trainingEdit';
import { draftToForm, formFromHabit, formToDraft, newForm } from '../habitForm';
import { goalText, habitLine } from '../habitText';

const pedal = (): TrainingPlan => ({
  effort: 'Pedalar',
  rest: 'Pedalar leve',
  warmupMin: 5,
  cooldownMin: 5,
  weeks: [{ kind: 'repeat', repeat: 5, effort: 2, rest: 1 }],
});

describe('editar o plano', () => {
  it('adiciona igual à última, duplica logo depois e remove (sempre fica uma)', () => {
    let p = addWeek(pedal());
    expect(p.weeks).toHaveLength(2);
    expect(p.weeks[1]).toEqual(p.weeks[0]);
    p = setWeek(p, 1, { kind: 'continuous', minutes: 15 });
    p = duplicateWeek(p, 0);
    expect(p.weeks.map((w) => w.kind)).toEqual(['repeat', 'repeat', 'continuous']);
    p = removeWeek(p, 1);
    expect(p.weeks.map((w) => w.kind)).toEqual(['repeat', 'continuous']);
    const one = pedal();
    expect(removeWeek(one, 0)).toBe(one);
  });

  it('troca o formato da semana mantendo perto o tempo de esforço', () => {
    expect(convertWeek({ kind: 'continuous', minutes: 20 }, 'repeat')).toEqual({
      kind: 'repeat',
      repeat: 4,
      effort: 5,
      rest: 1,
    });
    expect(convertWeek({ kind: 'continuous', minutes: 20 }, 'sequence')).toEqual({
      kind: 'sequence',
      steps: [12, 2, 8],
    });
    expect(convertWeek({ kind: 'repeat', repeat: 8, effort: 1, rest: 1.5 }, 'continuous')).toEqual({
      kind: 'continuous',
      minutes: 8,
    });
    expect(convertWeek({ kind: 'sequence', steps: [15, 2, 8] }, 'repeat')).toEqual({
      kind: 'repeat',
      repeat: 2,
      effort: 15,
      rest: 2,
    });
  });

  it('usa um modelo sem perder os nomes da pessoa, e reconhece de onde veio o plano', () => {
    const run = applyTemplate(pedal(), 'corrida-30');
    expect(run.weeks).toHaveLength(13);
    expect(run.effort).toBe('Pedalar');
    expect(templateKey(run)).toBe('corrida-30');
    expect(templateKey(pedal())).toBe(BLANK_KEY);
    const blank = applyTemplate(run, BLANK_KEY);
    expect(blank.weeks).toHaveLength(1);
    expect(templateKey(addWeek(blank))).toBeUndefined();
  });
});

describe('formulário do Treino guiado', () => {
  it('começa com o modelo da corrida, 2 treinos por semana e seg e qua às 7h', () => {
    const f = newForm('guided', {}, 'corpo', 'now');
    expect(f.training?.weeks).toHaveLength(13);
    expect(f.training?.effort).toBe('Correr');
    expect(f.goal.perWeek).toBe(2);
    expect(f.days).toEqual([0, 2]);
    expect(f.time).toBe('07:00');
    expect(f.moment).toBe('morning');
    // de outro tipo, nada de plano
    expect(newForm('check', {}, 'corpo', 'now').training).toBeNull();
  });

  it('o rascunho guarda o plano e o horário (o "‹ Tipo" e fechar sem querer não perdem nada)', () => {
    const f = { ...newForm('guided', {}, 'corpo', 'now'), name: 'Bicicleta', training: pedal(), time: '06:30' };
    const back = newForm('guided', draftToForm(formToDraft(f)), 'corpo', 'now');
    expect(back.training).toEqual(pedal());
    expect(back.time).toBe('06:30');
    expect(back.days).toEqual([0, 2]);
  });

  it('Editar hábito lê a corrida de antes já com o plano, e a lista diz o tipo novo', () => {
    const h = {
      id: 'c',
      name: 'Corrida',
      type: 'guided',
      icon: 'person-simple-run',
      pillarId: 'corpo',
      alsoIn: [],
      phase: 3,
      startDay: null,
      goal: { perWeek: 2 },
      schedule: { days: [0, 2], moment: 'morning', time: '07:10' },
      quickAdds: [],
      checklist: [],
      training: runTemplatePlan(),
      order: 0,
      archived: false,
      createdAt: 0,
      updatedAt: 0,
    } as Habit;
    const f = formFromHabit(h);
    expect(f.training?.weeks).toHaveLength(13);
    expect(f.time).toBe('07:10');
    expect(goalText(h, null)).toBe('seg e qua, 7h10');
    expect(habitLine(h, null)).toBe('Treino guiado · seg e qua, 7h10 · fase 3');
  });
});
