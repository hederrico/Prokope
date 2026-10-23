// @vitest-environment node
import { DEFAULT_CLOCK, instantAt } from '@/domain/day';
import {
  buildPlan,
  chosenCount,
  defaultPlanDraft,
  laterSummary,
  planChips,
  planStartDay,
  TEMPLATE_HABITS,
  TEMPLATE_PILLARS,
  toggleChip,
} from '@/domain/planTemplate';

let n = 0;
const newId = () => `x${++n}`;

describe('plano base', () => {
  it('tem 4 pilares e hábitos nas 4 fases', () => {
    expect(TEMPLATE_PILLARS.map((p) => p.name)).toEqual(['Mente', 'Alimentação', 'Corpo', 'Família']);
    expect(new Set(TEMPLATE_HABITS.map((h) => h.phase))).toEqual(new Set([1, 2, 3, 4]));
  });

  it('as medições vêm desmarcadas e são 7 hábitos escolhidos', () => {
    const draft = defaultPlanDraft();
    for (const key of ['weight', 'waist', 'screenTime']) expect(draft.habits).not.toContain(key);
    expect(chosenCount(draft)).toBe(7);
    const mente = planChips(draft, 'mente');
    expect(mente.find((c) => c.chip === 'sleep')).toMatchObject({
      label: 'Acordar e deitar',
      on: true,
      habitKeys: ['wake', 'bed'],
    });
    // a caminhada aparece em Corpo e em Família e liga junto
    const corpo = planChips(draft, 'corpo');
    expect(corpo.find((c) => c.chip === 'walk')).toMatchObject({ on: true, alsoLabel: 'também em Família' });
    const off = toggleChip(draft, 'walk', false);
    expect(planChips(off, 'familia').find((c) => c.chip === 'walk')?.on).toBe(false);
    expect(laterSummary('mente')).toBe('Depois: limite do YouTube, ritual do sono e silêncio');
  });

  it('monta pilares, hábitos e fases; a fase 1 começa hoje (ou amanhã depois das 20h)', () => {
    const morning = instantAt('2026-10-22', '07:03', DEFAULT_CLOCK);
    const night = instantAt('2026-10-22', '20:10', DEFAULT_CLOCK);
    expect(planStartDay(morning, DEFAULT_CLOCK)).toBe('2026-10-22');
    expect(planStartDay(night, DEFAULT_CLOCK)).toBe('2026-10-23');
    const plan = buildPlan(defaultPlanDraft(), { now: morning, clock: DEFAULT_CLOCK, newId });
    expect(plan.pillars).toHaveLength(4);
    expect(plan.phases.map((p) => [p.number, p.start, p.end])).toEqual([
      [1, '2026-10-22', '2026-11-11'],
      [2, null, null],
      [3, null, null],
      [4, null, null],
    ]);
    const active = plan.habits.filter((h) => h.startDay);
    expect(active.map((h) => h.name).sort()).toEqual(
      [
        'Acordar',
        'Caminhada com o cachorro',
        'Check-in do dia',
        'Deitar',
        'Louça',
        'Lixo e recicláveis',
        'Telas desligadas',
        'Zero refrigerante',
      ].sort(),
    );
    const walk = plan.habits.find((h) => h.name === 'Caminhada com o cachorro')!;
    const familia = plan.pillars.find((p) => p.name === 'Família')!;
    const corpo = plan.pillars.find((p) => p.name === 'Corpo')!;
    expect(walk.pillarId).toBe(familia.id);
    expect(walk.alsoIn).toEqual([corpo.id]);
    expect(walk.goal).toMatchObject({ value: 20, partialMin: 10, perWeek: 6 });
    const protein = plan.habits.find((h) => h.role === 'protein')!;
    expect(protein.startDay).toBeNull();
    expect(protein.goal.ramp).toMatchObject({ step: 10, everyWeeks: 2, max: 110 });
    expect(protein.quickAdds.map((q) => `${q.name} ${q.amount}`)).toEqual([
      'Ovo 6',
      'Queijo 5',
      'Feijão 7',
      'Leite 6',
      'Whey 22',
      'Iogurte 10',
      'Frango 30',
    ]);
  });

  it('pilar fora do plano nasce arquivado, e o hábito compartilhado passa para o outro', () => {
    const draft = defaultPlanDraft();
    draft.pillars = draft.pillars.map((p) => (p.key === 'familia' ? { ...p, enabled: false } : p));
    const plan = buildPlan(draft, { now: 0, clock: DEFAULT_CLOCK, newId });
    const familia = plan.pillars.find((p) => p.name === 'Família')!;
    const corpo = plan.pillars.find((p) => p.name === 'Corpo')!;
    expect(familia.archived).toBe(true);
    expect(plan.habits.find((h) => h.name === 'Louça')?.archived).toBe(true);
    expect(plan.habits.find((h) => h.name === 'Caminhada com o cachorro')).toMatchObject({
      pillarId: corpo.id,
      archived: false,
    });
  });

  it('do zero: nada criado', () => {
    const plan = buildPlan(defaultPlanDraft('empty'), { now: 0, clock: DEFAULT_CLOCK, newId });
    expect(plan.pillars).toHaveLength(0);
    expect(plan.habits).toHaveLength(0);
    expect(plan.phases).toHaveLength(0);
  });
});
