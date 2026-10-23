// O plano base de docs/visao.md: um modelo para o primeiro acesso, nunca dados fixos.
// 4 pilares e os hábitos das 4 fases. As medições (peso, cintura, tempo de tela) vêm desmarcadas.
import type {
  ChecklistItem,
  DayKey,
  DayMoment,
  Habit,
  HabitGoal,
  HabitRole,
  HabitScheduleConfig,
  HabitType,
  IconName,
  PaletteKey,
  Phase,
  Pillar,
  Profile,
  QuickAdd,
  ScheduleKey,
  TimeHM,
  TrainingPlan,
  Weekday,
} from '@/types';
import { addDays, instantAt, logicalDay, logicalMinutesOf, type Clock } from './day';
import { clonePlan, RUN_TEMPLATE } from './runPlan';

export const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const DEFAULT_SCHEDULE: Record<ScheduleKey, TimeHM> = {
  wake: '06:50',
  bed: '22:00',
  screensOff: '21:00',
  chores: '20:30',
  checkin: '20:30',
  caffeine: '14:00',
};

export const DEFAULT_PREFS: Profile['prefs'] = {
  theme: 'system',
  motion: true,
  sound: false,
  runSound: true,
  weightTrendOnly: false,
};

export interface TemplatePillar {
  key: string;
  name: string;
  color: PaletteKey;
  icon: IconName;
  description: string;
}

export interface TemplateHabit {
  key: string;
  name: string;
  /** nome curto para "Depois: ..." e para os chips */
  short: string;
  type: HabitType;
  icon: IconName;
  pillar: string;
  alsoIn?: string[];
  phase: number;
  role?: HabitRole;
  description?: string;
  goal?: HabitGoal;
  schedule?: Partial<HabitScheduleConfig>;
  quickAdds?: Omit<QuickAdd, 'id'>[];
  checklist?: string[];
  /** o plano do Treino guiado (type 'guided') */
  training?: TrainingPlan;
  /** chip do passo 2 (hábitos com o mesmo chip ligam e desligam juntos: "Acordar e deitar") */
  chip?: string;
  /** rótulo do chip, quando diferente do nome */
  chipLabel?: string;
  /** medição (desmarcada no primeiro acesso) */
  measurement?: boolean;
  /** vem desligado no primeiro acesso */
  defaultOff?: boolean;
}

export interface TemplatePhase {
  number: number;
  name: string;
  weeks: number | null;
  /** o que entra (docs/visao.md › Fases), curto como no quadro da Jornada */
  description: string;
}

export const TEMPLATE_PILLARS: TemplatePillar[] = [
  { key: 'mente', name: 'Mente', color: 'lavanda', icon: 'moon-stars', description: 'sono, telas, silêncio, gratidão' },
  { key: 'alim', name: 'Alimentação', color: 'salvia', icon: 'bowl-food', description: 'refeições, proteína, água' },
  {
    key: 'corpo',
    name: 'Corpo',
    color: 'damasco',
    icon: 'person-simple-run',
    description: 'movimento, academia, corrida',
  },
  { key: 'familia', name: 'Família', color: 'rosa', icon: 'heart', description: 'casa, cachorro, tempo a dois' },
];

export const TEMPLATE_PHASES: TemplatePhase[] = [
  { number: 1, name: 'Base', weeks: 3, description: 'Sono, telas, cachorro e a casa em dia' },
  { number: 2, name: 'Alimentação', weeks: 3, description: 'Proteína, água e refeições' },
  { number: 3, name: 'Movimento', weeks: 3, description: 'Academia, corrida e menos tela' },
  { number: 4, name: 'Profundidade', weeks: null, description: 'Sono, silêncio e tempo a dois' },
];

const SLEEP_RITUAL = [
  'Cafeína só até as 14h',
  'Luz do sol pela manhã',
  'Jantar 2 a 3h antes de deitar',
  'Tarefas do dia concluídas até as 20h30',
  'Luzes baixas e quentes à noite',
  'Leitura antes de dormir',
  'Nada de conteúdo que estimule o cérebro',
  'Desacelerar',
];

const SILENCE = ['Tarefas de casa', 'Trajetos e direção', 'Refeições', 'Banho', 'Rotina pessoal'];

export const TEMPLATE_HABITS: TemplateHabit[] = [
  // Mente
  {
    key: 'wake',
    name: 'Acordar',
    short: 'acordar',
    type: 'time',
    icon: 'alarm',
    pillar: 'mente',
    phase: 1,
    role: 'wake',
    goal: { timeKey: 'wake', toleranceMin: 15 },
    schedule: { moment: 'morning', timeKey: 'wake' },
    chip: 'sleep',
    chipLabel: 'Acordar e deitar',
  },
  {
    key: 'bed',
    name: 'Deitar',
    short: 'deitar',
    type: 'time',
    icon: 'moon-stars',
    pillar: 'mente',
    phase: 1,
    role: 'bed',
    goal: { timeKey: 'bed', toleranceMin: 15 },
    schedule: { moment: 'evening', timeKey: 'bed' },
    chip: 'sleep',
    chipLabel: 'Acordar e deitar',
  },
  {
    key: 'screensOff',
    name: 'Telas desligadas',
    short: 'telas desligadas',
    type: 'check',
    icon: 'device-mobile-slash',
    pillar: 'mente',
    phase: 1,
    schedule: { moment: 'evening', timeKey: 'screensOff' },
    chipLabel: 'Telas às 21h',
  },
  {
    key: 'checkin',
    name: 'Check-in do dia',
    short: 'check-in',
    type: 'check',
    icon: 'sparkle',
    pillar: 'mente',
    phase: 1,
    role: 'checkin',
    description: 'humor, energia e 3 coisas boas',
    schedule: { moment: 'evening', timeKey: 'checkin' },
    chipLabel: 'Check-in',
  },
  {
    key: 'shorts',
    name: 'Sem Shorts e TikTok',
    short: 'Shorts e TikTok',
    type: 'daysSince',
    icon: 'video-camera-slash',
    pillar: 'mente',
    phase: 1,
    description: 'TikTok apagado; Shorts com timer de 0 min',
    schedule: { moment: 'free' },
    defaultOff: true,
  },
  {
    key: 'screenTime',
    name: 'Tempo de tela',
    short: 'tempo de tela',
    type: 'number',
    icon: 'device-mobile',
    pillar: 'mente',
    phase: 1,
    role: 'screenTime',
    description: 'fora do trabalho, do Tempo de Uso do iPhone',
    goal: { unit: 'min', direction: 'atMost', measuring: true },
    schedule: { moment: 'evening', timeKey: 'checkin' },
    measurement: true,
  },
  {
    key: 'youtube',
    name: 'YouTube',
    short: 'limite do YouTube',
    type: 'number',
    icon: 'youtube-logo',
    pillar: 'mente',
    phase: 3,
    role: 'youtube',
    description: 'fora do trabalho',
    goal: { value: 60, unit: 'min', direction: 'atMost' },
    schedule: { moment: 'evening', timeKey: 'checkin' },
  },
  {
    key: 'sleepRitual',
    name: 'Ritual do sono',
    short: 'ritual do sono',
    type: 'checklist',
    icon: 'moon',
    pillar: 'mente',
    phase: 4,
    checklist: SLEEP_RITUAL,
    schedule: { moment: 'evening' },
  },
  {
    key: 'silence',
    name: 'Momentos de silêncio',
    short: 'silêncio',
    type: 'checklist',
    icon: 'ear-slash',
    pillar: 'mente',
    phase: 4,
    description: 'sem celular, fone ou música',
    checklist: SILENCE,
    schedule: { moment: 'day' },
  },
  // Alimentação
  {
    key: 'soda',
    name: 'Zero refrigerante',
    short: 'refrigerante',
    type: 'daysSince',
    icon: 'pint-glass',
    pillar: 'alim',
    phase: 1,
    description: 'inclusive nas refeições livres',
    schedule: { moment: 'free' },
  },
  {
    key: 'protein',
    name: 'Proteína',
    short: 'proteína',
    type: 'counter',
    icon: 'egg',
    pillar: 'alim',
    phase: 2,
    role: 'protein',
    goal: { value: 80, unit: 'g' },
    schedule: { moment: 'day' },
    quickAdds: [
      { name: 'Ovo', amount: 6, hours: ['morning', 'evening'] },
      { name: 'Queijo', amount: 5, hours: ['midday'] },
      { name: 'Feijão', amount: 7, hours: ['midday', 'evening'] },
      { name: 'Leite', amount: 6, hours: ['morning'] },
      { name: 'Whey', amount: 22, hours: ['morning'] },
      { name: 'Iogurte', amount: 10, hours: [] },
      { name: 'Frango', amount: 30, hours: ['midday', 'evening'] },
    ],
  },
  {
    key: 'water',
    name: 'Água',
    short: 'água',
    type: 'counter',
    icon: 'drop',
    pillar: 'alim',
    phase: 2,
    role: 'water',
    goal: { value: 3000, unit: 'ml' },
    schedule: { moment: 'day' },
    quickAdds: [
      { name: '500 ml', amount: 500, hours: ['morning', 'midday', 'evening'] },
      { name: '1 L', amount: 1000, hours: ['morning', 'midday', 'evening'] },
    ],
  },
  {
    key: 'lunch',
    name: 'Almoço',
    short: 'refeições',
    type: 'rating',
    icon: 'fork-knife',
    pillar: 'alim',
    phase: 2,
    role: 'lunch',
    description: 'nota de 1 a 5',
    schedule: { moment: 'day' },
  },
  {
    key: 'dinner',
    name: 'Jantar',
    short: 'refeições',
    type: 'rating',
    icon: 'bowl-food',
    pillar: 'alim',
    phase: 2,
    role: 'dinner',
    description: 'nota de 1 a 5',
    schedule: { moment: 'evening' },
  },
  {
    key: 'junk',
    name: 'Tranqueiras',
    short: 'tranqueiras',
    type: 'budget',
    icon: 'cookie',
    pillar: 'alim',
    phase: 2,
    description: 'fora das refeições livres',
    goal: { perWeek: 2, unit: 'dias' },
    schedule: { moment: 'free' },
  },
  {
    key: 'freeMeals',
    name: 'Refeições livres',
    short: 'refeições livres',
    type: 'budget',
    icon: 'pizza',
    pillar: 'alim',
    phase: 2,
    description: 'em dias flexíveis',
    goal: { perWeek: 2 },
    schedule: { moment: 'free' },
  },
  {
    key: 'weight',
    name: 'Peso',
    short: 'peso',
    type: 'number',
    icon: 'scales',
    pillar: 'alim',
    phase: 1,
    role: 'weight',
    description: 'média de 7 dias no Progresso',
    goal: { unit: 'kg', measuring: true },
    schedule: { moment: 'morning' },
    measurement: true,
  },
  {
    key: 'waist',
    name: 'Cintura',
    short: 'cintura',
    type: 'number',
    icon: 't-shirt',
    pillar: 'alim',
    phase: 1,
    role: 'waist',
    description: 'na Revisão da semana',
    goal: { unit: 'cm', measuring: true },
    schedule: { moment: 'free', days: [6] },
    measurement: true,
  },
  // Corpo
  {
    key: 'football',
    name: 'Futebol',
    short: 'futebol',
    type: 'weekly',
    icon: 'soccer-ball',
    pillar: 'corpo',
    phase: 1,
    goal: { perWeek: 1 },
    schedule: { moment: 'day', days: [3] },
    defaultOff: true,
  },
  {
    key: 'gym',
    name: 'Academia',
    short: 'academia',
    type: 'weekly',
    icon: 'barbell',
    pillar: 'corpo',
    phase: 3,
    description: 'do condomínio',
    goal: { perWeek: 2 },
    schedule: { moment: 'day' },
  },
  {
    // Treino guiado com o modelo pronto "Corrida do zero aos 30 minutos" (13 semanas, correr e caminhar)
    key: 'run',
    name: 'Corrida',
    short: 'corrida',
    type: 'guided',
    icon: 'person-simple-run',
    pillar: 'corpo',
    phase: 3,
    role: 'run',
    description: 'do zero aos 30 minutos',
    goal: { perWeek: RUN_TEMPLATE.perWeek },
    schedule: { moment: 'morning', days: [0, 2], time: '07:10' },
    training: RUN_TEMPLATE.plan,
  },
  // Família
  {
    key: 'dishes',
    name: 'Louça',
    short: 'louça',
    type: 'check',
    icon: 'broom',
    pillar: 'familia',
    phase: 1,
    schedule: { moment: 'evening', timeKey: 'chores' },
  },
  {
    key: 'trash',
    name: 'Lixo e recicláveis',
    short: 'lixo',
    type: 'check',
    icon: 'trash',
    pillar: 'familia',
    phase: 1,
    role: 'trash',
    description: 'nos dias de coleta',
    schedule: { moment: 'evening', timeKey: 'chores', useCollectionDays: true },
  },
  {
    key: 'walk',
    name: 'Caminhada com o cachorro',
    short: 'caminhada',
    type: 'check',
    icon: 'salsicha',
    pillar: 'familia',
    alsoIn: ['corpo'],
    phase: 1,
    description: '20 min ou mais',
    goal: { value: 20, unit: 'min', partialMin: 10, perWeek: 6 },
    schedule: { moment: 'morning' },
    chipLabel: 'Caminhada com o cachorro',
  },
  {
    key: 'together',
    name: 'Programa a dois',
    short: 'programa a dois',
    type: 'weekly',
    icon: 'heart',
    pillar: 'familia',
    phase: 4,
    role: 'together',
    description: 'em dia livre',
    goal: { perWeek: 1 },
    schedule: { moment: 'free' },
  },
  {
    key: 'gesture',
    name: 'Pequeno gesto',
    short: 'pequeno gesto',
    type: 'check',
    icon: 'hand-heart',
    pillar: 'familia',
    phase: 4,
    schedule: { moment: 'day' },
  },
];

// ---------- rascunho do primeiro acesso ----------

export interface DraftPillar {
  /** chave do modelo ou id local de um pilar criado no primeiro acesso */
  key: string;
  name: string;
  color: PaletteKey;
  icon: IconName;
  description?: string;
  enabled: boolean;
}

export interface PlanDraft {
  mode: 'template' | 'empty';
  pillars: DraftPillar[];
  /** chaves dos hábitos do modelo ligados no passo 2 (fase 1 e medições) */
  habits: string[];
  schedule: Record<ScheduleKey, TimeHM>;
  /** Telas desligadas segue o deitar (1h antes) até a pessoa mudar */
  screensFollowBed: boolean;
  collectionDays: Weekday[];
  weeklyReview: { weekday: Weekday; time: TimeHM };
  weekendTolerance: boolean;
}

/** O rascunho inicial do primeiro acesso. */
export function defaultPlanDraft(mode: PlanDraft['mode'] = 'template'): PlanDraft {
  if (mode === 'empty') {
    return {
      mode,
      pillars: [],
      habits: [],
      schedule: { ...DEFAULT_SCHEDULE },
      screensFollowBed: true,
      collectionDays: [0, 3],
      weeklyReview: { weekday: 6, time: '18:00' },
      weekendTolerance: true,
    };
  }
  return {
    mode,
    pillars: TEMPLATE_PILLARS.map((p) => ({ ...p, enabled: true })),
    habits: TEMPLATE_HABITS.filter((h) => h.phase === 1 && !h.measurement && !h.defaultOff).map((h) => h.key),
    schedule: { ...DEFAULT_SCHEDULE },
    screensFollowBed: true,
    collectionDays: [0, 3],
    weeklyReview: { weekday: 6, time: '18:00' },
    weekendTolerance: true,
  };
}

export interface PlanChip {
  /** chave do chip (o mesmo para "Acordar e deitar") */
  chip: string;
  label: string;
  /** hábitos do modelo que o chip liga */
  habitKeys: string[];
  on: boolean;
  measurement: boolean;
  /** "também em Família" quando aparece no pilar extra */
  alsoLabel?: string;
}

/** Os chips do passo 2, por pilar (a caminhada aparece em Família e em Corpo, ligada junto). */
export function planChips(draft: PlanDraft, pillarKey: string): PlanChip[] {
  const out: PlanChip[] = [];
  const seen = new Set<string>();
  const pillarName = (key: string) => draft.pillars.find((p) => p.key === key)?.name ?? key;
  for (const h of TEMPLATE_HABITS) {
    if (h.phase !== 1) continue;
    const inPillar = h.pillar === pillarKey || h.alsoIn?.includes(pillarKey);
    if (!inPillar) continue;
    const chip = h.chip ?? h.key;
    if (seen.has(chip)) continue;
    seen.add(chip);
    const keys = TEMPLATE_HABITS.filter((t) => (t.chip ?? t.key) === chip).map((t) => t.key);
    out.push({
      chip,
      label: h.pillar === pillarKey ? (h.chipLabel ?? h.name) : h.short.charAt(0).toUpperCase() + h.short.slice(1),
      habitKeys: keys,
      on: keys.every((k) => draft.habits.includes(k)),
      measurement: !!h.measurement,
      alsoLabel: h.pillar === pillarKey ? undefined : `também em ${pillarName(h.pillar)}`,
    });
  }
  return out;
}

/** Liga ou desliga um chip no rascunho. */
export function toggleChip(draft: PlanDraft, chip: string, on: boolean): PlanDraft {
  const keys = TEMPLATE_HABITS.filter((t) => (t.chip ?? t.key) === chip).map((t) => t.key);
  const set = new Set(draft.habits);
  for (const k of keys) {
    if (on) set.add(k);
    else set.delete(k);
  }
  return { ...draft, habits: [...set] };
}

/** "Depois: ritual do sono e silêncio" (hábitos das fases 2 a 4 do modelo, no pilar). */
export function laterSummary(pillarKey: string): string {
  const names: string[] = [];
  for (const h of TEMPLATE_HABITS) {
    if (h.phase < 2 || h.pillar !== pillarKey) continue;
    if (!names.includes(h.short)) names.push(h.short);
  }
  if (!names.length) return '';
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
  return `Depois: ${list}`;
}

/**
 * Quantos chips de hábito (sem medições) estão ligados: "7 hábitos escolhidos". Um hábito com pilar extra
 * (a caminhada, em Família e Corpo) conta quando qualquer um dos dois pilares fica no plano.
 */
export function chosenCount(draft: PlanDraft): number {
  if (draft.mode !== 'template') return 0;
  const pillarOn = (key: string) => draft.pillars.find((p) => p.key === key)?.enabled ?? false;
  const chips = new Set<string>();
  for (const h of TEMPLATE_HABITS) {
    if (h.phase !== 1 || h.measurement || !draft.habits.includes(h.key)) continue;
    if (!pillarOn(h.pillar) && !(h.alsoIn ?? []).some(pillarOn)) continue;
    chips.add(h.chip ?? h.key);
  }
  return chips.size;
}

/** O plano começa amanhã quando o primeiro acesso termina depois das 20h. */
export function planStartDay(now: number, clock: Clock): DayKey {
  const today = logicalDay(now, clock);
  return logicalMinutesOf(now, clock) >= 20 * 60 ? addDays(today, 1) : today;
}

// ---------- montar os documentos ----------

export interface BuiltPlan {
  profile: Pick<
    Profile,
    'schedule' | 'scheduleLog' | 'collectionDays' | 'weeklyReview' | 'weekendTolerance' | 'phaseThreshold'
  >;
  pillars: Pillar[];
  habits: Habit[];
  phases: Phase[];
  startDay: DayKey;
  /** a chave do modelo de cada hábito criado (id → 'walk') */
  templateKeys: Record<string, string>;
}

export interface BuildPlanOptions {
  now: number;
  clock: Clock;
  newId: () => string;
  /** força o dia de começo (semente da demonstração) */
  startDay?: DayKey;
}

function checklistItems(names: string[] | undefined, newId: () => string): ChecklistItem[] {
  return (names ?? []).map((name) => ({ id: newId(), name }));
}

function momentOf(h: TemplateHabit): DayMoment {
  return h.schedule?.moment ?? 'day';
}

/** Monta pilares, hábitos e fases a partir do rascunho (a ação setupPlan grava tudo num lote). */
export function buildPlan(draft: PlanDraft, opts: BuildPlanOptions): BuiltPlan {
  const { now, newId } = opts;
  const startDay = opts.startDay ?? planStartDay(now, opts.clock);
  const pillarIds = new Map<string, string>();
  const pillars: Pillar[] = draft.pillars.map((p, i) => {
    const id = newId();
    pillarIds.set(p.key, id);
    return {
      id,
      name: p.name.trim() || 'Pilar',
      color: p.color,
      icon: p.icon,
      description: p.description,
      order: i,
      archived: !p.enabled,
      archivedAt: p.enabled ? null : now,
      createdAt: now,
      updatedAt: now,
    };
  });
  const enabledPillar = (key: string) => draft.pillars.find((p) => p.key === key)?.enabled ?? false;

  const habits: Habit[] = [];
  const phases: Phase[] = [];
  const templateKeys: Record<string, string> = {};
  if (draft.mode === 'template') {
    const order = new Map<DayMoment, number>();
    for (const t of TEMPLATE_HABITS) {
      const pillarId = pillarIds.get(t.pillar);
      if (!pillarId) continue;
      // da fase 1, só o que ficou ligado; das fases seguintes, tudo (entra quando a fase começar)
      if (t.phase === 1 && !draft.habits.includes(t.key)) continue;
      const alsoIn = (t.alsoIn ?? []).map((k) => pillarIds.get(k)).filter((x): x is string => !!x);
      const primaryOn = enabledPillar(t.pillar);
      const extraOn = (t.alsoIn ?? []).find((k) => enabledPillar(k) && pillarIds.has(k));
      // pilar principal fora do plano: o hábito passa para o pilar extra ligado; sem nenhum, nasce arquivado
      const finalPillar = primaryOn ? pillarId : extraOn ? pillarIds.get(extraOn)! : pillarId;
      const archived = !primaryOn && !extraOn;
      const moment = momentOf(t);
      const ord = order.get(moment) ?? 0;
      order.set(moment, ord + 1);
      const habitId = newId();
      templateKeys[habitId] = t.key;
      habits.push({
        id: habitId,
        name: t.name,
        type: t.type,
        icon: t.icon,
        pillarId: finalPillar,
        alsoIn: alsoIn.filter((id) => id !== finalPillar),
        phase: t.phase,
        startDay: t.phase === 1 && !archived ? startDay : null,
        role: t.role ?? null,
        description: t.description,
        shortName: t.short,
        goal: { ...(t.goal ?? {}) },
        schedule: { days: [...ALL_DAYS], moment, ...t.schedule } as HabitScheduleConfig,
        quickAdds: (t.quickAdds ?? []).map((q) => ({ ...q, id: newId() })),
        checklist: checklistItems(t.checklist, newId),
        ...(t.training ? { training: clonePlan(t.training) } : {}),
        order: ord,
        archived,
        archivedAt: archived ? now : null,
        archivedDay: archived ? startDay : null,
        archivedWith: archived ? pillarId : null,
        createdAt: now,
        updatedAt: now,
      });
    }
    // a escada da proteína conta do dia em que a fase dela começar
    for (const h of habits) {
      if (h.role === 'protein' && h.goal.value) {
        h.goal.ramp = { step: 10, everyWeeks: 2, max: 110, ask: true, since: startDay };
      }
    }
    for (const p of TEMPLATE_PHASES) {
      const isFirst = p.number === 1;
      phases.push({
        id: String(p.number),
        number: p.number,
        name: p.name,
        description: p.description,
        weeks: p.weeks,
        start: isFirst ? startDay : null,
        end: isFirst && p.weeks ? addDays(startDay, p.weeks * 7 - 1) : null,
        closingConstancy: null,
        closedAt: null,
        celebratedAt: null,
      });
    }
  } else {
    // do zero: uma fase só, sem fim, a partir do começo do plano. A pessoa dá nome, duração e as próximas
    // fases em Editar fases (sem ela, a Jornada e a revisão ficam sem fase atual)
    const first = TEMPLATE_PHASES[0];
    phases.push({
      id: '1',
      number: 1,
      name: first?.name ?? 'Base',
      weeks: null,
      start: startDay,
      end: null,
      closingConstancy: null,
      closedAt: null,
      celebratedAt: null,
    });
  }

  const schedule = { ...draft.schedule };
  return {
    profile: {
      schedule,
      scheduleLog: (Object.keys(schedule) as ScheduleKey[]).map((key) => ({
        key,
        time: schedule[key],
        since: startDay,
      })),
      collectionDays: [...draft.collectionDays],
      weeklyReview: { ...draft.weeklyReview },
      weekendTolerance: draft.weekendTolerance,
      phaseThreshold: 0.7,
    },
    pillars,
    habits,
    phases,
    startDay,
    templateKeys,
  };
}

/** Perfil novo (primeiro login), ainda sem plano. */
export function newProfile(name: string, now: number, clock: Clock, email?: string): Profile {
  const today = logicalDay(now, clock);
  return {
    name,
    email,
    timeZone: clock.timeZone,
    dayStartHour: clock.dayStartHour,
    schedule: { ...DEFAULT_SCHEDULE },
    scheduleLog: (Object.keys(DEFAULT_SCHEDULE) as ScheduleKey[]).map((key) => ({
      key,
      time: DEFAULT_SCHEDULE[key],
      since: today,
    })),
    weeklyReview: { weekday: 6, time: '18:00' },
    collectionDays: [0, 3],
    weekendTolerance: true,
    prefs: { ...DEFAULT_PREFS },
    phaseThreshold: 0.7,
    planSetupAt: null,
    linkId: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Instante de um horário do dia (útil para a semente e os testes). */
export function at(day: DayKey, time: TimeHM, clock: Clock): number {
  return instantAt(day, time, clock);
}
