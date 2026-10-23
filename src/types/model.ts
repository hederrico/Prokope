// Modelo de dados do Prokopē. Tudo é da pessoa (users/{uid}/...), nada fica fixo no código.
// Datas de calendário são texto (DayKey 'AAAA-MM-DD', no dia lógico); instantes são milissegundos (number).
import type { IconName } from '@/icons';
import type { PaletteKey } from '@/styles/palette';

/** Dia lógico 'AAAA-MM-DD' (vira às 4h no fuso do perfil). */
export type DayKey = string;
/** Semana: o DayKey da segunda-feira. */
export type WeekKey = string;
/** Horário 'HH:mm' (24 h). */
export type TimeHM = string;
/** Dia da semana: 0 = segunda ... 6 = domingo. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
/** Instante em milissegundos desde 1970 (Date.now()). */
export type Millis = number;

export type { IconName, PaletteKey };

// ---------- Perfil ----------

/** Horários do dia que os hábitos podem usar como meta (Ajustes › Horários). */
export type ScheduleKey = 'wake' | 'bed' | 'screensOff' | 'chores' | 'checkin' | 'caffeine';

export type ThemePref = 'system' | 'light' | 'dark';

export interface ProfilePrefs {
  theme: ThemePref;
  /** animações do app (o Reduzir Movimento do iPhone sempre vence) */
  motion: boolean;
  /** som suave ao marcar */
  sound: boolean;
  /** som nas trocas da corrida */
  runSound: boolean;
  /** "Mostrar só a tendência" do peso */
  weightTrendOnly: boolean;
}

export interface ScheduleChange {
  key: ScheduleKey;
  time: TimeHM;
  /** vale a partir deste dia (inclusive) */
  since: DayKey;
}

export interface Profile {
  name: string;
  email?: string;
  /** fuso IANA, 'America/Sao_Paulo' por padrão */
  timeZone: string;
  /** hora da virada do dia lógico (4 = 4h) */
  dayStartHour: number;
  schedule: Record<ScheduleKey, TimeHM>;
  /** histórico dos horários, para cada dia guardar a meta da época */
  scheduleLog: ScheduleChange[];
  /** dia e hora da Revisão da semana (domingo 18h por padrão) */
  weeklyReview: { weekday: Weekday; time: TimeHM };
  /** dias de coleta do lixo */
  collectionDays: Weekday[];
  /** no fim de semana, até 1h de diferença conta como cumprido */
  weekendTolerance: boolean;
  prefs: ProfilePrefs;
  /** limite da sugestão de fase (0.7 = 70%); null = não sugerir */
  phaseThreshold: number | null;
  /** quando o plano foi montado no primeiro acesso; sem isso, a conta precisa do primeiro acesso */
  planSetupAt: Millis | null;
  /** ligação do A dois */
  linkId: string | null;
  /** apagando tudo (retoma a tela se o app fechar no meio) */
  deleting?: boolean;
  createdAt: Millis;
  updatedAt: Millis;
}

// ---------- Pilares ----------

export interface Pillar {
  id: string;
  name: string;
  color: PaletteKey;
  icon: IconName;
  /** frase curta do primeiro acesso ("sono, telas, silêncio, gratidão") */
  description?: string;
  order: number;
  archived: boolean;
  archivedAt?: Millis | null;
  createdAt: Millis;
  updatedAt: Millis;
}

// ---------- Hábitos ----------

export type HabitType =
  | 'check' // sim ou não
  | 'time' // horário com tolerância
  | 'counter' // contador com meta (g, ml)
  | 'rating' // nota de 1 a 5
  | 'number' // número livre (peso, cintura, minutos de tela)
  | 'weekly' // vezes por semana
  | 'budget' // limite por semana
  | 'daysSince' // dias sem
  | 'checklist'; // lista de passos

/** Momento do dia: manhã, ao longo do dia, noite ou livre (sem hora: limites e dias sem). */
export type DayMoment = 'morning' | 'day' | 'evening' | 'free';

/**
 * Papel especial que liga o hábito a uma folha ou a um dado de outra coleção.
 * Opcional: hábitos criados pela pessoa normalmente não têm papel.
 */
export type HabitRole =
  | 'wake' // Acordar (folha "Acordei às")
  | 'bed' // Deitar (marcado na manhã seguinte, junto com o acordar)
  | 'checkin' // Check-in do dia (feito quando checkins/{day} tem humor e energia)
  | 'weight' // Peso (measurements, kind 'weight')
  | 'waist' // Cintura (measurements, kind 'waist')
  | 'screenTime' // minutos de tela (vem do check-in)
  | 'youtube' // minutos de YouTube (vem do check-in)
  | 'protein' // folha da proteína
  | 'water' // folha da água
  | 'lunch' // nota do almoço
  | 'dinner' // nota do jantar
  | 'trash' // lixo: dias vêm de profile.collectionDays
  | 'run' // corrida (plano de 13 semanas)
  | 'together'; // programa a dois

export interface GoalRamp {
  /** degrau (10 g) */
  step: number;
  /** a cada quantas semanas */
  everyWeeks: number;
  /** teto (110 g) */
  max: number;
  /** a Revisão da semana pergunta antes de cada subida */
  ask: boolean;
  /** a escada conta a partir deste dia */
  since: DayKey;
}

export interface HabitGoal {
  /** meta do dia: 80 (g), 3000 (ml), 20 (min de caminhada), 60 (min de YouTube), 30 (min de um treino) */
  value?: number;
  /** unidade mostrada: 'g', 'ml', 'L', 'min', 'vezes', 'páginas', 'kg', 'cm'... */
  unit?: string;
  /** mínimo que conta como parcial (caminhada de 10 min com meta de 20) */
  partialMin?: number;
  /** 'atMost' para metas de teto (YouTube até 60 min); 'atLeast' é o padrão */
  direction?: 'atLeast' | 'atMost';
  /** "subir aos poucos" (só contador) */
  ramp?: GoalRamp | null;
  /** vezes por semana ('weekly'), limite por semana ('budget') ou meta da semana de um hábito de todo dia ("6 de 7") */
  perWeek?: number;
  /** horário da meta para 'time' (quando não usa um horário do perfil) */
  time?: TimeHM;
  /** usa um horário do perfil como meta (Acordar = 'wake') */
  timeKey?: ScheduleKey;
  /** tolerância em minutos para 'time' (15) */
  toleranceMin?: number;
  /** só medindo, sem meta (tempo de tela nas 2 primeiras semanas) */
  measuring?: boolean;
}

export interface HabitScheduleConfig {
  /** dias da agenda; os 7 = todo dia */
  days: Weekday[];
  /** usa os dias de coleta do perfil no lugar de `days` (lixo) */
  useCollectionDays?: boolean;
  moment: DayMoment;
  /** horário do lembrete ou do treino ('07:10'); texto da linha ("até 20h30") */
  time?: TimeHM;
  /** usa um horário do perfil ('chores' = 20h30) */
  timeKey?: ScheduleKey;
}

export type QuickAddSlot = 'morning' | 'midday' | 'evening';

export interface QuickAdd {
  id: string;
  name: string;
  /** quantidade somada por toque, na unidade da meta (6 g, 500 ml) */
  amount: number;
  /** em que horas o botão aparece no Hoje: até 11h, das 11h às 17h, depois das 17h (vazio = só na folha) */
  hours?: QuickAddSlot[];
}

export interface ChecklistItem {
  id: string;
  name: string;
}

/** Dia marcado para um hábito de vez na semana (programa a dois no sábado, com nota). */
export interface HabitPlannedDay {
  day: DayKey;
  note?: string;
}

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  icon: IconName;
  /** pilar principal (cor da linha e da tela) */
  pillarId: string;
  /** pilares extras: a caminhada conta também em Corpo */
  alsoIn: string[];
  /** fase em que entra (null = sem fase) */
  phase: number | null;
  /** primeiro dia que conta (posto quando a fase começa); null = ainda não começou */
  startDay: DayKey | null;
  /**
   * fase em que sai do dia a dia ("o peso diário para na fase 3"): vale da fase `phase` até antes desta.
   * null (ou sem o campo, nos documentos antigos) = segue em todas as fases seguintes
   */
  untilPhase?: number | null;
  /**
   * primeiro dia fora, quando a parada foi escolhida com a fase de parada já em curso (hoje); sem ele, a parada
   * vale a partir do começo da fase `untilPhase`, quando ela começar
   */
  untilDay?: DayKey | null;
  role?: HabitRole | null;
  /** texto curto da linha de baixo ("20 min ou mais") */
  description?: string;
  /** nome curto para frases ("Nos dias com caminhada, ...") */
  shortName?: string;
  goal: HabitGoal;
  schedule: HabitScheduleConfig;
  quickAdds: QuickAdd[];
  checklist: ChecklistItem[];
  /** dias planejados (scheduleHabit) */
  planned?: HabitPlannedDay[];
  /** ordem dentro do momento do dia */
  order: number;
  archived: boolean;
  archivedAt?: Millis | null;
  /** dia em que saiu (os registros ficam) */
  archivedDay?: DayKey | null;
  /** arquivado junto com este pilar (restaurar o pilar traz de volta) */
  archivedWith?: string | null;
  /** o pilar principal de antes, quando ele foi arquivado e o extra assumiu */
  primaryFrom?: string | null;
  createdAt: Millis;
  updatedAt: Millis;
}

// ---------- Registros ----------

/** Estado gravado numa marca. 'logged' = registrado sem contar (fora da tolerância, corrida abaixo do mínimo). */
export type MarkStatus = 'done' | 'partial' | 'logged';

export interface Mark {
  /** `${day}_${habitId}` */
  id: string;
  day: DayKey;
  habitId: string;
  status: MarkStatus;
  /** "hoje não se aplica" (sai da conta do dia, da constância e da força) */
  skipped?: boolean;
  /** horário registrado ('06:52'); para 'bed' pode passar da meia-noite ('00:30') */
  time?: TimeHM;
  /** valor: minutos, número livre, nota */
  value?: number;
  /** nota de 1 a 5 */
  rating?: number;
  /** chips da nota ("Proteína", "Salada ou legume") */
  tags?: string[];
  /** passos feitos de uma lista */
  items?: string[];
  /** meta da época (um horário mudado depois não muda este registro) */
  goal?: { value?: number; time?: TimeHM; toleranceMin?: number };
  note?: string;
  /** treino de corrida */
  run?: { week: number; session: number; seconds: number; runId?: string };
  /** instante do registro */
  at: Millis;
  updatedAt: Millis;
}

/** Uma soma de contador ou um uso de limite: ovo × 3 (18 g) às 7h10, 500 ml às 8h05. */
export interface Entry {
  id: string;
  habitId: string;
  day: DayKey;
  at: Millis;
  /** total desta entrada, na unidade da meta (18 g) */
  amount: number;
  /** porções (3 ovos) */
  count: number;
  /** nome do botão rápido ("Ovo") ou "Outro" */
  item?: string;
  quickAddId?: string;
}

export interface Slip {
  id: string;
  habitId: string;
  day: DayKey;
  at: Millis;
  note?: string;
}

export interface Checkin {
  /** = day */
  id: DayKey;
  day: DayKey;
  mood: number;
  energy: number;
  /** 3 coisas boas */
  good: string[];
  screenMinutes?: number | null;
  youtubeMinutes?: number | null;
  at: Millis;
  updatedAt: Millis;
}

export type MeasurementKind = 'weight' | 'waist';

export interface Measurement {
  /** `${day}_${kind}`: uma segunda pesagem no mesmo dia substitui a primeira */
  id: string;
  kind: MeasurementKind;
  day: DayKey;
  value: number;
  unit: 'kg' | 'cm';
  at: Millis;
}

export type PauseReason = 'vacation' | 'sick' | 'travel' | 'other';

export interface Pause {
  id: string;
  /** primeiro dia pausado */
  start: DayKey;
  /** último dia pausado (inclusive); a volta é end + 1 */
  end: DayKey;
  reason: PauseReason | null;
  /** null = o app inteiro */
  habitIds: string[] | null;
  createdAt: Millis;
  updatedAt: Millis;
}

// ---------- Fases, revisões e corrida ----------

export interface Phase {
  /** = String(number) */
  id: string;
  number: number;
  name: string;
  /** o que entra, em poucas palavras ("Academia, corrida e menos tela"); sem ela, a tela resume pelos hábitos */
  description?: string | null;
  /** duração em semanas; null = sem fim */
  weeks: number | null;
  /** começo, gravado quando a fase começa (as futuras são previsões) */
  start: DayKey | null;
  /** fim planejado da fase atual (inclusive), ou o fim de uma fase concluída */
  end: DayKey | null;
  /** constância de fechamento (0..1) */
  closingConstancy?: number | null;
  closedAt?: Millis | null;
  /** a celebração da fase desbloqueada já aconteceu */
  celebratedAt?: Millis | null;
}

export type ReviewDecision = 'advance' | 'stay';

export interface Review {
  /** = week (segunda da semana revista) */
  id: WeekKey;
  week: WeekKey;
  /** passo guardado (1 a 3) */
  step: number;
  status: 'draft' | 'done';
  /** constância da semana no fechamento (0..1) */
  constancy?: number | null;
  /** fase em curso na semana */
  phase?: number | null;
  endOfPhase?: boolean;
  /** "O ajuste funcionou?" da revisão anterior */
  tweakWorked?: 'yes' | 'partly' | 'no' | null;
  /** ajuste para a próxima semana */
  tweak?: string | null;
  waist?: number | null;
  together?: { habitId: string; day: DayKey; note?: string } | null;
  decision?: ReviewDecision | null;
  /** o que deu certo e o que olhar com carinho, guardados no fechamento */
  highlights?: string[];
  gentle?: string[];
  doneAt?: Millis | null;
  updatedAt: Millis;
}

export type RunStatus = 'running' | 'paused' | 'done' | 'discarded';

export interface Run {
  id: string;
  habitId: string;
  day: DayKey;
  /** semana do plano (1 a 13) e treino da semana (1 ou 2) */
  week: number;
  session: number;
  startedAt: Millis;
  pauses: { from: Millis; to: Millis | null }[];
  status: RunStatus;
  endedAt?: Millis | null;
  /** segundos feitos e intervalos de trote completos, no fim */
  seconds?: number | null;
  intervalsDone?: number | null;
}

// ---------- A dois (fora de users/{uid}) ----------

export type InviteStatus = 'pending' | 'accepted' | 'cancelled' | 'declined';

export interface Invite {
  /** código aleatório longo (vai no link /convite/:id) */
  id: string;
  fromUid: string;
  fromName: string;
  status: InviteStatus;
  createdAt: Millis;
  /** vale 7 dias */
  expiresAt: Millis;
  toUid?: string | null;
  seenAt?: Millis | null;
}

export interface LinkShare {
  /** compartilha "como estou hoje" */
  mood: boolean;
  /** humor do dia, copiado quando o check-in é salvo */
  moodToday?: { day: DayKey; mood: number } | null;
  /** hábitos que esta pessoa ligou como compartilhados (role 'together' etc.) */
  habits: string[];
}

export interface Link {
  id: string;
  members: string[];
  names: Record<string, string>;
  share: Record<string, LinkShare>;
  createdAt: Millis;
}

export interface Hug {
  id: string;
  from: string;
  to: string;
  at: Millis;
  day: DayKey;
}

// ---------- Coleções ----------

/** Coleções em users/{uid}/... */
export interface UserCollections {
  pillars: Pillar;
  habits: Habit;
  marks: Mark;
  entries: Entry;
  slips: Slip;
  checkins: Checkin;
  measurements: Measurement;
  pauses: Pause;
  phases: Phase;
  reviews: Review;
  runs: Run;
}

export type CollectionName = keyof UserCollections;

export const COLLECTIONS: readonly CollectionName[] = [
  'pillars',
  'habits',
  'marks',
  'entries',
  'slips',
  'checkins',
  'measurements',
  'pauses',
  'phases',
  'reviews',
  'runs',
] as const;
