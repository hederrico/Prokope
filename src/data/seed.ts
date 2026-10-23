// Semente do modo demonstração: a história ilustrativa de docs/telas/SPEC.md, contada a partir de hoje.
// Hoje é a "quinta" da história: a fase 1 começou 31 dias antes e a fase 2 está na semana 2 de 3.
// Os registros de hoje seguem a hora atual (depois das 7h10, ovo × 3 e leite; depois das 10h30, whey...).
// Todos os números são de exemplo: nenhum dado pessoal de verdade.
import type { Checkin, DayKey, Entry, Habit, Mark, Measurement, Phase, Review, Slip, TimeHM } from '@/types';
import { markId, measurementId } from '@/domain/context';
import { addDays, clockOf, instantAt, logicalDay, weekdayOf, weekStart, type Clock } from '@/domain/day';
import { goalOn, timeMeetsGoal } from '@/domain/habitState';
import { buildDomainData } from '@/domain/context';
import { buildPlan, defaultPlanDraft, newProfile, TEMPLATE_HABITS } from '@/domain/planTemplate';
import { PROFILE_ID, type DataSource, type WriteOp } from './source';

export const DEMO_NAME = 'Henrique';

/** Dias de cada coisa, contados para trás a partir de hoje (1 = ontem). */
const STORY = {
  phase1Start: 31,
  phase2Start: 10,
  phase2End: -10,
  /** zero refrigerante começou 2 dias antes da fase 1 (recorde de 21 dias, deslize há 12 dias) */
  sodaStart: 33,
  sodaSlip: 12,
  /**
   * Os dias sem caminhada perto do calendário do quadro: 23, 26 e 29 set; 7, 14, 16, 18 e 21 out (24 com e 8 sem,
   * 17 em outubro). O quadro tem 3 out no lugar de 18 out, mas com ele a força ficaria em 75%, e não nos 72% da
   * história (a força pesa mais os dias recentes).
   */
  walkMisses: [1, 4, 6, 8, 15, 23, 26, 29],
  /** dias sem check-in (3 e 17 out no Humor do quadro: 20 check-ins em 22 dias) */
  checkinMisses: [5, 19],
  /**
   * Telas, louça e jantar ficam mais para trás nos dias de acordar tarde: a constância do resto do dia dá 84% nos
   * dias de acordar no horário e 61% nos outros, como no Progresso do quadro.
   */
  screensMisses: [1, 4, 6, 8, 10, 13, 15, 17, 19, 20, 24, 26, 31],
  /** acordar fora do horário em 12 dias (20 com e 12 sem desde 21 set, como no quadro) */
  wakeLate: {
    1: '07:20',
    4: '08:00',
    6: '07:15',
    8: '07:25',
    10: '07:18',
    13: '07:30',
    15: '07:22',
    19: '08:05',
    20: '07:12',
    23: '07:28',
    26: '08:10',
    29: '07:20',
  } as Record<number, TimeHM>,
  /**
   * Deitar tarde em 14 noites (fora da tolerância, também no fim de semana). A energia do dia seguinte segue a noite:
   * 3,6 depois de deitar até 22h e 2,8 depois das outras, como no Humor do quadro.
   */
  bedLate: {
    3: '22:40',
    7: '22:50',
    9: '23:10',
    11: '23:20',
    12: '23:15',
    15: '22:50',
    16: '23:00',
    18: '23:20',
    21: '22:45',
    23: '23:20',
    25: '23:10',
    26: '23:15',
    28: '22:40',
    30: '22:40',
  } as Record<number, TimeHM>,
  dishesMisses: [4, 6, 8, 10, 13, 14, 19, 20, 22, 23, 27, 29],
  /** o lixo esquecido numa segunda de coleta */
  trashMiss: 10,
  /** sem nota do almoço na segunda e na terça desta semana (o anel da terça fica perto dos 75% do quadro) */
  lunchMisses: [2, 3, 7],
  dinnerMisses: [1, 2, 4, 6, 8, 9, 10],
  lunchRatings: [4, 3, 4, 5, 3, 4, 3, 4, 4, 3],
  /** o jantar de segunda com 4 (média do jantar na semana perto dos 3,9 do quadro) */
  dinnerRatings: [4, 4, 4, 5, 4, 4, 3, 4, 5, 4],
  /**
   * Proteína dos dias da fase 2 (1 = ontem): seg 84, ter 92, qua 71 na história; na semana passada, 80 g ou mais
   * em 1 de 7 dias (o padrão "a proteína chegou a 80 g em 2 dos 3 dias fechados" do Progresso)
   */
  protein: [71, 92, 84, 76, 72, 84, 70, 74, 68, 75],
  /** água desta semana como no quadro: seg 3 L, ter 2,5 L, qua 3,2 L (3 L ou mais em 2 dos 3 dias fechados) */
  water: [3200, 2500, 3000, 2500, 3000, 2500, 3200, 2000, 3000, 2500],
  /** tranqueiras e refeições livres (dias atrás) */
  junk: [2, 6, 9],
  freeMeals: [4, 7],
};

/** Gerador pseudoaleatório com semente fixa (a história é sempre a mesma). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pesos de exemplo perto de 84 kg, descendo 1,1 kg em 3 semanas (média de 7 dias). */
function weightFor(age: number): number | null {
  // sem pesagem em alguns dias
  if ([30, 24, 17, 10].includes(age)) return null;
  const noise = [0.2, -0.1, 0.3, 0, -0.2, 0.1, -0.3, 0.2, 0, -0.1, 0.1, 0.3, -0.2, 0, 0.2, -0.1];
  const base = 83.45 + age * 0.05;
  return Math.round((base + noise[age % noise.length]) * 10) / 10;
}

const WEIGHT_FIXED: Record<number, number> = { 0: 83.6, 1: 83.3 };

/**
 * Humor de cada dia (índice = dias atrás; 0 = hoje). De 1 a 21 de outubro é o calendário do Humor do quadro
 * (0 = sem check-in); setembro fecha a conta da caminhada: humor médio 4,1 com e 3,4 sem.
 */
const MOOD_BY_AGE = [
  4, // hoje
  3, 4, 4, 5, 0, 4, 4, 4, 3, 2, 3, 5, 4, 4, 3, 4, 3, 5, 0, 4, 4, // 21 a 1 out
  5, 3, 5, 5, 2, 4, 5, 3, 5, 4, // 30 a 21 set
];
/** Energia do dia seguinte: depois de deitar no horário (média 3,6) e depois de deitar tarde (2,8). */
const ENERGY_AFTER_ON_TIME = [4, 4, 3, 4, 3];
const ENERGY_AFTER_LATE = [3, 3, 2, 3, 3];
const GOOD = [
  ['Passeio com o cachorro', 'Café com calma'],
  ['Almoço caprichado', 'Conversa boa no trabalho', 'Dormi bem'],
  ['Futebol com os amigos'],
  ['Jantar em casa', 'Leitura antes de dormir'],
];

interface SeedContext {
  today: DayKey;
  now: number;
  clock: Clock;
  habits: Habit[];
  byKey: Map<string, Habit>;
  newId: () => string;
}

function dayOf(ctx: SeedContext, age: number): DayKey {
  return addDays(ctx.today, -age);
}

function at(ctx: SeedContext, day: DayKey, time: TimeHM): number {
  return instantAt(day, time, ctx.clock);
}

/** O evento de hoje já aconteceu (pela hora atual)? Dias passados sempre. */
function happened(ctx: SeedContext, day: DayKey, time: TimeHM): boolean {
  return day < ctx.today || at(ctx, day, time) <= ctx.now;
}

/** Monta e grava a demonstração. `now` define o dia de hoje e quais registros de hoje já aconteceram. */
export async function seedDemo(source: DataSource, now: number): Promise<void> {
  const ops = buildDemoOps(now, () => source.newId());
  for (let i = 0; i < ops.length; i += 400) await source.write(ops.slice(i, i + 400));
}

/**
 * Os documentos da demonstração (separado para os testes). O modo exemplo passa o fuso e a virada da pessoa, para o
 * "hoje" da história ser o mesmo dia dela.
 */
export function buildDemoOps(now: number, newId: () => string, clock: Clock = clockOf(null)): WriteOp[] {
  const today = logicalDay(now, clock);
  const p1 = addDays(today, -STORY.phase1Start);
  const p2 = addDays(today, -STORY.phase2Start);

  // o plano base inteiro, com tudo da fase 1 ligado (inclusive medições, futebol e Shorts)
  const draft = defaultPlanDraft('template');
  draft.habits = TEMPLATE_HABITS.filter((h) => h.phase === 1).map((h) => h.key);
  const plan = buildPlan(draft, { now: now - STORY.phase1Start * 86_400_000, clock, newId, startDay: p1 });
  const byKey = new Map<string, Habit>();
  for (const h of plan.habits) byKey.set(plan.templateKeys[h.id], h);
  // fase 2 já começou; os hábitos dela entram no começo da fase
  for (const h of plan.habits) {
    if (h.phase === 2) h.startDay = p2;
    if (h.role === 'protein' && h.goal.ramp) h.goal.ramp.since = p2;
  }
  const soda = byKey.get('soda')!;
  soda.startDay = addDays(today, -STORY.sodaStart);
  // Shorts e TikTok e o futebol já eram da rotina antes do plano (docs/visao.md: "Já ativo"): ficam fora das fases,
  // e a fase 1 tem os 7 hábitos da história
  for (const key of ['shorts', 'football']) {
    const h = byKey.get(key);
    if (h) h.phase = null;
  }

  const ctx: SeedContext = { today, now, clock, habits: plan.habits, byKey, newId };
  const phases: Phase[] = plan.phases.map((ph) => {
    if (ph.number === 1) {
      return {
        ...ph,
        start: p1,
        end: addDays(p2, -1),
        closingConstancy: 0.81,
        closedAt: at(ctx, addDays(p2, -1), '18:40'),
        celebratedAt: null,
      };
    }
    if (ph.number === 2) {
      return {
        ...ph,
        start: p2,
        end: addDays(today, -STORY.phase2End),
        celebratedAt: at(ctx, addDays(p2, -1), '18:42'),
      };
    }
    return ph;
  });

  const profile = {
    ...newProfile(DEMO_NAME, now - STORY.phase1Start * 86_400_000, clock),
    ...plan.profile,
    planSetupAt: now - STORY.phase1Start * 86_400_000,
    updatedAt: now,
  };

  const marks: Mark[] = [];
  const entries: Entry[] = [];
  const slips: Slip[] = [];
  const checkins: Checkin[] = [];
  const measurements: Measurement[] = [];
  const reviews: Review[] = [];
  const rand = mulberry32(2026);

  // marcas com a meta da época (precisa do domínio para calcular o horário e a tolerância)
  const dataFor = () =>
    buildDomainData({
      profile,
      pillars: plan.pillars,
      habits: plan.habits,
      marks: [],
      entries: [],
      slips: [],
      checkins: [],
      measurements: [],
      pauses: [],
      phases,
      reviews: [],
      runs: [],
    });
  const data = dataFor();

  const mark = (key: string, day: DayKey, time: TimeHM, extra: Partial<Mark> = {}) => {
    const h = byKey.get(key);
    if (!h || !happened(ctx, day, time)) return;
    const goal = goalOn(h, day, data);
    const instant = at(ctx, day, time);
    marks.push({
      id: markId(day, h.id),
      day,
      habitId: h.id,
      status: 'done',
      skipped: false,
      goal: { value: goal.value, time: goal.time, toleranceMin: goal.toleranceMin },
      at: instant,
      updatedAt: instant,
      ...extra,
    });
  };
  /** grava um horário com a meta da época; devolve se ficou dentro da tolerância */
  const timeMark = (key: string, day: DayKey, registeredAt: TimeHM, time: TimeHM, registeredDay: DayKey = day) => {
    const h = byKey.get(key);
    if (!h || !happened(ctx, registeredDay, registeredAt)) return null;
    const goal = goalOn(h, day, data);
    const ok = timeMeetsGoal(time, goal.time, goal.toleranceMin, clock.dayStartHour);
    const instant = at(ctx, registeredDay, registeredAt);
    marks.push({
      id: markId(day, h.id),
      day,
      habitId: h.id,
      status: ok ? 'done' : 'logged',
      skipped: false,
      time,
      goal: { time: goal.time, toleranceMin: goal.toleranceMin },
      at: instant,
      updatedAt: instant,
    });
    return ok;
  };
  const entry = (key: string, day: DayKey, time: TimeHM, amount: number, item?: string, count = 1) => {
    const h = byKey.get(key);
    if (!h || !happened(ctx, day, time)) return;
    const q = h.quickAdds.find((x) => x.name === item);
    entries.push({
      id: newId(),
      habitId: h.id,
      day,
      at: at(ctx, day, time),
      amount: amount * count,
      count,
      ...(item ? { item } : {}),
      ...(q ? { quickAddId: q.id } : {}),
    });
  };
  const isCollection = (day: DayKey) => profile.collectionDays.includes(weekdayOf(day));
  const isFootball = (day: DayKey) => (byKey.get('football')?.schedule.days ?? []).includes(weekdayOf(day));

  // ---------- os dias que passaram ----------
  let onTimeIdx = 0;
  let lateIdx = 0;
  // o deitar de cada noite ficou no horário? (com a tolerância do fim de semana)
  const bedOk = new Map<number, boolean>();
  /** a energia do dia segue a noite anterior: deitar no horário ou tarde (antes do plano, 3) */
  const energyAfter = (age: number): number => {
    const ok = bedOk.get(age + 1);
    if (ok === undefined) return 3;
    return ok
      ? ENERGY_AFTER_ON_TIME[onTimeIdx++ % ENERGY_AFTER_ON_TIME.length]
      : ENERGY_AFTER_LATE[lateIdx++ % ENERGY_AFTER_LATE.length];
  };
  for (let age = STORY.phase1Start; age >= 1; age--) {
    const day = dayOf(ctx, age);
    const next = addDays(day, 1);
    const inPhase2 = age <= STORY.phase2Start;

    // Mente: acordar, deitar (marcado na manhã seguinte), telas, check-in
    timeMark(
      'wake',
      day,
      '07:00',
      STORY.wakeLate[age] ?? (['06:48', '06:52', '06:45', '06:55', '06:50'] as TimeHM[])[age % 5],
    );
    // o deitar de ontem é registrado hoje às 6h58 (mais abaixo)
    if (age > 1) {
      const ok = timeMark(
        'bed',
        day,
        '06:58',
        STORY.bedLate[age] ?? (['22:05', '21:55', '22:10', '22:00'] as TimeHM[])[age % 4],
        next,
      );
      if (ok !== null) bedOk.set(age, ok);
    }
    if (!STORY.screensMisses.includes(age)) mark('screensOff', day, '21:04');

    // caminhada e o humor do dia
    const walked = !STORY.walkMisses.includes(age);
    if (walked) mark('walk', day, '07:43');
    // os minutos sorteados sempre, para os dias sem check-in não mudarem os números dos outros
    const screenMinutes = 95 + Math.round(rand() * 60);
    const youtubeMinutes = 25 + Math.round(rand() * 30);
    const mood = MOOD_BY_AGE[age] ?? 4;
    if (mood && !STORY.checkinMisses.includes(age)) {
      checkins.push({
        id: day,
        day,
        mood,
        energy: energyAfter(age),
        good: GOOD[age % GOOD.length],
        screenMinutes,
        youtubeMinutes,
        at: at(ctx, day, '20:40'),
        updatedAt: at(ctx, day, '20:40'),
      });
    }

    // Família
    if (!STORY.dishesMisses.includes(age)) mark('dishes', day, '20:15');
    if (isCollection(day) && age !== STORY.trashMiss) mark('trash', day, '20:20');
    // Corpo
    if (isFootball(day) && age !== 14) mark('football', day, '19:00');

    // Alimentação (fase 2)
    if (inPhase2) {
      const i = age - 1;
      if (!STORY.lunchMisses.includes(age)) mark('lunch', day, '13:10', { rating: STORY.lunchRatings[i % 10] });
      if (!STORY.dinnerMisses.includes(age)) mark('dinner', day, '19:50', { rating: STORY.dinnerRatings[i % 10] });
      const total = STORY.protein[i] ?? 80;
      entry('protein', day, '07:10', 6, 'Ovo', 3);
      entry('protein', day, '07:11', 6, 'Leite');
      let left = total - 24;
      if (left >= 40) {
        entry('protein', day, '10:30', 22, 'Whey');
        left -= 22;
      }
      if (left >= 30) {
        entry('protein', day, '12:50', 30, 'Frango');
        left -= 30;
      }
      if (left > 0) entry('protein', day, '19:30', left, 'Outro');
      let water = STORY.water[i] ?? 2500;
      const slots: TimeHM[] = ['08:05', '11:40', '15:00', '17:30', '19:00'];
      let s = 0;
      while (water > 0 && s < slots.length) {
        const amt = water >= 1000 && s % 2 === 1 ? 1000 : 500;
        entry('water', day, slots[s++], Math.min(amt, water), amt === 1000 ? '1 L' : '500 ml');
        water -= amt;
      }
      if (STORY.junk.includes(age)) entry('junk', day, '16:00', 1);
      if (STORY.freeMeals.includes(age)) entry('freeMeals', day, '20:00', 1);
    }

    // peso e cintura (medições desde a fase 1)
    const w = WEIGHT_FIXED[age] ?? weightFor(age);
    if (w !== null)
      measurements.push({
        id: measurementId(day, 'weight'),
        kind: 'weight',
        day,
        value: w,
        unit: 'kg',
        at: at(ctx, day, '07:00'),
      });
  }
  // dias antes da fase 1 também contam para o refrigerante (sem marcas: dias sem são calculados)
  slips.push({
    id: newId(),
    habitId: soda.id,
    day: dayOf(ctx, STORY.sodaSlip),
    at: at(ctx, dayOf(ctx, STORY.sodaSlip), '21:30'),
  });

  // cintura nos domingos (na revisão)
  const waistValues = [94.8, 95.0, 95.5, 96.0];
  let wi = 0;
  for (let age = 1; age <= STORY.phase1Start && wi < waistValues.length; age++) {
    const day = dayOf(ctx, age);
    if (weekdayOf(day) === 6) {
      measurements.push({
        id: measurementId(day, 'waist'),
        kind: 'waist',
        day,
        value: waistValues[wi++],
        unit: 'cm',
        at: at(ctx, day, '18:20'),
      });
    }
  }

  // revisões feitas (domingos que passaram), com a constância do fechamento
  const reviewConstancy = [0.74, 0.81, 0.78, 0.72];
  let ri = 0;
  for (let age = 1; age <= STORY.phase1Start; age++) {
    const day = dayOf(ctx, age);
    if (weekdayOf(day) !== profile.weeklyReview.weekday) continue;
    const week = weekStart(day);
    if (week < weekStart(p1)) continue;
    const isEnd = addDays(p2, -1) >= week && addDays(p2, -1) <= day;
    const phase = day < p2 ? 1 : 2;
    reviews.push({
      id: week,
      week,
      step: isEnd ? 3 : 2,
      status: 'done',
      constancy: reviewConstancy[ri++ % reviewConstancy.length],
      phase,
      endOfPhase: isEnd,
      tweakWorked: ri > 1 ? 'yes' : null,
      tweak: ri === 1 ? 'Separar a roupa da caminhada na noite anterior.' : null,
      waist: null,
      together: null,
      decision: isEnd ? 'advance' : null,
      highlights: [],
      gentle: [],
      doneAt: at(ctx, day, '18:40'),
      updatedAt: at(ctx, day, '18:40'),
    });
  }

  // ---------- hoje, pela hora atual ----------
  const d = today;
  timeMark('wake', d, '06:58', '06:52');
  timeMark('bed', addDays(d, -1), '06:58', '22:15', d);
  if (happened(ctx, d, '07:00')) {
    measurements.push({
      id: measurementId(d, 'weight'),
      kind: 'weight',
      day: d,
      value: WEIGHT_FIXED[0],
      unit: 'kg',
      at: at(ctx, d, '07:00'),
    });
  }
  entry('protein', d, '07:10', 6, 'Ovo', 3);
  // o leite logo depois dos ovos: na folha, o mais recente fica em cima (quadro: Leite, depois Ovo × 3)
  entry('protein', d, '07:11', 6, 'Leite');
  mark('walk', d, '07:43');
  entry('water', d, '08:05', 500, '500 ml');
  entry('protein', d, '10:30', 22, 'Whey');
  entry('water', d, '11:40', 1000, '1 L');
  mark('lunch', d, '13:05', { rating: 4, tags: ['Proteína', 'Salada ou legume', 'Carboidrato'] });
  // o frango do almoço entra depois da nota (46 g às 12h41 e às 12h58, como no quadro)
  entry('protein', d, '13:10', 30, 'Frango');
  entry('water', d, '16:30', 1000, '1 L');
  if (isFootball(d)) mark('football', d, '18:50');
  mark('dinner', d, '19:45', { rating: 4 });
  entry('protein', d, '19:50', 10, 'Iogurte');
  mark('dishes', d, '20:10');
  // o lixo sai depois do check-in (20h36): às 20h36 são 9 feitos, e às 21h04 o dia fecha
  if (isCollection(d)) mark('trash', d, '20:50');
  if (happened(ctx, d, '20:36')) {
    checkins.push({
      id: d,
      day: d,
      mood: 4,
      energy: 3,
      good: ['Passeio com o cachorro no fim da tarde', 'Almoço caprichado'],
      screenMinutes: 108,
      youtubeMinutes: 35,
      at: at(ctx, d, '20:36'),
      updatedAt: at(ctx, d, '20:36'),
    });
  }
  mark('screensOff', d, '21:04');

  // ---------- os documentos ----------
  const ops: WriteOp[] = [{ op: 'set', col: 'profile', id: PROFILE_ID, data: profile }];
  for (const p of plan.pillars) ops.push({ op: 'set', col: 'pillars', id: p.id, data: p });
  for (const h of plan.habits) ops.push({ op: 'set', col: 'habits', id: h.id, data: h });
  for (const ph of phases) ops.push({ op: 'set', col: 'phases', id: ph.id, data: ph });
  for (const m of marks) ops.push({ op: 'set', col: 'marks', id: m.id, data: m });
  for (const e of entries) ops.push({ op: 'set', col: 'entries', id: e.id, data: e });
  for (const s of slips) ops.push({ op: 'set', col: 'slips', id: s.id, data: s });
  for (const c of checkins) ops.push({ op: 'set', col: 'checkins', id: c.id, data: c });
  for (const m of measurements) ops.push({ op: 'set', col: 'measurements', id: m.id, data: m });
  for (const r of reviews) ops.push({ op: 'set', col: 'reviews', id: r.id, data: r });
  return ops;
}
