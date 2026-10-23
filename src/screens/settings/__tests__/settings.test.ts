// Ajustes: os textos montados a partir dos dados (tipo, meta e fase), a biblioteca de ícones, a escada da meta,
// os horários em uso e os alarmes sugeridos, e a palavra "apagar".
import { describe, expect, it } from 'vitest';
import type { HabitListItem } from '@/data';
import type { Habit, Pillar, Profile } from '@/types';
import { daysLabel, exitSentence, goalText, habitLine, joinList, matchesWord, byListOrder } from '../habitText';
import { ICON_CATALOG, ICON_CHIPS, iconSections, searchIcons, iconForName } from '../iconLibrary';
import {
  formFromHabit,
  formToDraft,
  draftToForm,
  newForm,
  rampSteps,
  rampText,
  stepFor,
  roundStep,
} from '../habitForm';
import { scheduleRows, suggestedAlarms } from '../schedule';

function habit(over: Partial<Habit>): Habit {
  return {
    id: over.id ?? 'h',
    name: 'Hábito',
    type: 'check',
    icon: 'check-circle',
    pillarId: 'p1',
    alsoIn: [],
    phase: 1,
    startDay: '2026-09-21',
    goal: {},
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], moment: 'day' },
    quickAdds: [],
    checklist: [],
    order: 0,
    archived: false,
    createdAt: 0,
    updatedAt: 0,
    ...over,
  } as Habit;
}

const profile = {
  name: 'Ana',
  timeZone: 'America/Sao_Paulo',
  dayStartHour: 4,
  schedule: { wake: '06:50', bed: '22:00', screensOff: '21:00', chores: '20:30', checkin: '20:30', caffeine: '14:00' },
  scheduleLog: [],
  weeklyReview: { weekday: 6, time: '18:00' },
  collectionDays: [0, 3],
  weekendTolerance: true,
  prefs: { theme: 'system', motion: true, sound: false, runSound: true, weightTrendOnly: false },
  phaseThreshold: 0.7,
  planSetupAt: 1,
  linkId: null,
  createdAt: 0,
  updatedAt: 0,
} as Profile;

const pillar = (id: string, name: string): Pillar =>
  ({ id, name, color: 'damasco', icon: 'heart', order: 0, archived: false, createdAt: 0, updatedAt: 0 }) as Pillar;

function item(h: Habit, status: HabitListItem['status'] = 'active'): HabitListItem {
  return { habit: h, pillar: pillar(h.pillarId, 'P'), alsoIn: [], status, pausedUntil: null, startsOn: null };
}

describe('textos de hábito', () => {
  it('tipo, meta e fase de cada tipo', () => {
    expect(habitLine(habit({ type: 'time', goal: { timeKey: 'wake' } }), profile)).toBe('Horário · meta 6h50 · fase 1');
    expect(
      habitLine(habit({ schedule: { days: [0, 1, 2, 3, 4, 5, 6], moment: 'evening', timeKey: 'chores' } }), profile),
    ).toBe('Sim ou não · até 20h30 · fase 1');
    expect(habitLine(habit({ schedule: { days: [], moment: 'evening', useCollectionDays: true } }), profile)).toBe(
      'Sim ou não · seg e qui · fase 1',
    );
    expect(
      habitLine(
        habit({
          type: 'counter',
          phase: 2,
          goal: { value: 80, unit: 'g', ramp: { step: 10, everyWeeks: 2, max: 110, ask: true, since: '' } },
        }),
        profile,
      ),
    ).toBe('Contador · meta 80 g, subindo · fase 2');
    expect(goalText(habit({ type: 'counter', goal: { value: 3000, unit: 'ml' } }), profile)).toBe('meta 3 L');
    expect(goalText(habit({ type: 'budget', goal: { perWeek: 2, unit: 'dias' } }), profile)).toBe('até 2 dias');
    expect(
      goalText(habit({ type: 'weekly', goal: { perWeek: 1 }, schedule: { days: [3], moment: 'day' } }), profile),
    ).toBe('quinta');
    expect(goalText(habit({ goal: { perWeek: 6 } }), profile)).toBe('meta 6 de 7');
    expect(
      habitLine(
        habit({ role: 'checkin', schedule: { days: [0, 1, 2, 3, 4, 5, 6], moment: 'evening', timeKey: 'checkin' } }),
        profile,
      ),
    ).toBe('Nota de 1 a 5 e texto · 20h30 · fase 1');
    // conta sem fases: a linha perde o "· fase N"
    expect(habitLine(habit({ type: 'daysSince' }), profile, false)).toBe('Dias sem');
  });

  it('dias e listas', () => {
    expect(daysLabel([0, 3])).toBe('seg e qui');
    expect(daysLabel([3])).toBe('quinta');
    expect(daysLabel([0, 1, 2, 3, 4, 5, 6])).toBe('todos os dias');
    expect(joinList(['a', 'b', 'c'])).toBe('a, b e c');
  });

  it('o destino dos hábitos quando o pilar sai', () => {
    const futebol = habit({ id: 'f', name: 'Futebol', pillarId: 'corpo' });
    const walk = habit({ id: 'w', name: 'Caminhada', pillarId: 'familia', alsoIn: ['corpo'] });
    const pillars = [pillar('corpo', 'Corpo'), pillar('familia', 'Família')];
    expect(
      exitSentence(
        [
          { kind: 'goes', habit: futebol },
          { kind: 'stays', habit: walk },
        ],
        pillars,
      ),
    ).toBe('Futebol sai do seu dia. Caminhada continua em Família.');
  });

  it('a ordem da lista: os do pilar primeiro, depois o momento do dia', () => {
    const a = { habit: habit({ id: 'a', name: 'A', pillarId: 'outro', schedule: { days: [], moment: 'morning' } }) };
    const b = { habit: habit({ id: 'b', name: 'B', pillarId: 'p', schedule: { days: [], moment: 'evening' } }) };
    const c = { habit: habit({ id: 'c', name: 'C', pillarId: 'p', schedule: { days: [], moment: 'morning' } }) };
    expect(byListOrder([a, b, c], 'p').map((x) => x.habit.id)).toEqual(['c', 'b', 'a']);
  });

  it('a palavra apagar ignora caixa, acento e espaço', () => {
    expect(matchesWord(' Apagar ')).toBe(true);
    expect(matchesWord('APÁGAR')).toBe(true);
    expect(matchesWord('apaga')).toBe(false);
  });
});

describe('biblioteca de ícones', () => {
  it('154 ícones em 10 categorias, com Todos nos chips', () => {
    expect(ICON_CATALOG).toHaveLength(154);
    expect(new Set(ICON_CATALOG.map((e) => e.name)).size).toBe(154);
    expect(ICON_CHIPS).toHaveLength(11);
    expect(ICON_CHIPS[0].label).toBe('Todos');
  });
  it('busca sem acento, por começo de palavra', () => {
    expect(searchIcons('agua')[0].label).toBe('Água');
    expect(searchIcons('poupar').map((e) => e.label)).toContain('Cofrinho');
  });
  it('a categoria sugerida pelo nome sobe para o topo', () => {
    const s = iconSections('dinheiro');
    expect(s[0].key).toBe('dinheiro');
    expect(s[0].suggested).toBe(true);
    expect(iconForName('Finanças')).toBe('wallet');
  });
});

describe('formulário de hábito', () => {
  it('passos do − e + por unidade', () => {
    expect(stepFor('g')).toBe(5);
    expect(stepFor('ml')).toBe(250);
    expect(stepFor('L')).toBe(0.25);
    expect(stepFor('vezes')).toBe(1);
    expect(stepFor('min')).toBe(5);
    expect(roundStep(0.30000000004, 0.25)).toBe(0.25);
  });
  it('a escada da meta', () => {
    const ramp = { step: 10, everyWeeks: 2, max: 110 };
    expect(rampSteps(80, ramp)).toEqual([
      { value: 80, when: 'agora' },
      { value: 90, when: 'em 2 sem' },
      { value: 100, when: 'em 4 sem' },
      { value: 110, when: 'em 6 sem' },
    ]);
    expect(rampText(ramp, 'g')).toBe('+10 g a cada 2 semanas, até 110 g');
  });
  it('trocar de tipo guarda nome, pilar e dias; meta volta ao padrão', () => {
    const f = newForm('counter', { type: 'check', name: 'Leitura', pillarId: 'p2', days: [0, 2] }, 'p1', 'now');
    expect(f.name).toBe('Leitura');
    expect(f.pillarId).toBe('p2');
    expect(f.days).toEqual([0, 2]);
    expect(f.goal.unit).toBe('vezes');
    // o rascunho vai e volta sem perder nada (o ícone só quando escolhido)
    const back = draftToForm(formToDraft({ ...f, icon: 'book-open', iconChosen: true }));
    expect(back.icon).toBe('book-open');
    expect(back.iconChosen).toBe(true);
    expect(draftToForm(formToDraft({ ...f, icon: 'book-open', iconChosen: false })).icon).toBeNull();
  });
  it('editar parte do hábito salvo', () => {
    const h = habit({ name: 'Proteína', type: 'counter', goal: { value: 80, unit: 'g' }, phase: 2 });
    const f = formFromHabit(h);
    expect(f.name).toBe('Proteína');
    expect(f.phase).toBe(2);
    expect(f.iconChosen).toBe(true);
  });
});

describe('horários e lembretes', () => {
  const wake = habit({
    id: 'wake',
    name: 'Acordar',
    type: 'time',
    shortName: 'acordar',
    goal: { timeKey: 'wake', toleranceMin: 15 },
    schedule: { days: [], moment: 'morning', timeKey: 'wake' },
  });
  const bed = habit({
    id: 'bed',
    name: 'Deitar',
    type: 'time',
    goal: { timeKey: 'bed' },
    schedule: { days: [], moment: 'evening', timeKey: 'bed' },
  });
  const dishes = habit({
    id: 'd',
    name: 'Louça',
    shortName: 'louça',
    schedule: { days: [], moment: 'evening', timeKey: 'chores' },
  });
  const trash = habit({
    id: 't',
    name: 'Lixo e recicláveis',
    shortName: 'lixo',
    schedule: { days: [], moment: 'evening', timeKey: 'chores' },
  });
  const checkin = habit({
    id: 'c',
    name: 'Check-in do dia',
    shortName: 'check-in',
    role: 'checkin',
    schedule: { days: [], moment: 'evening', timeKey: 'checkin' },
  });
  const ritual = habit({
    id: 'r',
    name: 'Ritual do sono',
    type: 'checklist',
    phase: 4,
    startDay: null,
    checklist: [{ id: '1', name: 'Cafeína só até as 14h' }],
  });
  const list = [
    item(wake),
    item(bed),
    item(dishes),
    item(trash),
    item(checkin),
    { ...item(ritual, 'upcoming'), startsOn: '2026-11-23' },
  ];

  it('só os horários em uso, em ordem; a cafeína espera a fase do ritual', () => {
    const rows = scheduleRows(profile, list);
    expect(rows.map((r) => r.key)).toEqual(['wake', 'caffeine', 'chores', 'checkin', 'bed']);
    expect(rows[0].subtitle).toBe('15 min de tolerância');
    expect(rows[1].off).toBe(true);
    expect(rows[1].phase).toBe(4);
    expect(rows[1].subtitle).toBe('Ritual do sono · começa em 23 nov');
    expect(rows[2].subtitle).toBe('Louça, lixo e recicláveis');
  });

  it('alarmes sugeridos: o mesmo horário junta, o deitar ganha o preparo e a revisão vem no fim', () => {
    const alarms = suggestedAlarms(profile, list);
    expect(alarms.map((a) => `${a.time} ${a.label}`)).toEqual([
      '06:50 Acordar',
      '20:30 Louça, lixo e check-in',
      '21:50 Preparar para deitar',
      '18:00 Revisão da semana',
    ]);
  });
});
