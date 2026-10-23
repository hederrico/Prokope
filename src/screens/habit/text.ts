// Textos do detalhe do hábito e do Progresso, montados a partir do hábito da pessoa (nada fixo por nome).
import type { DayKey, Habit } from '@/types';
import type { HabitDayState, ResolvedGoal } from '@/data';
import {
  capitalize,
  diffDays,
  formatAmount,
  formatDayMonth,
  formatTime,
  formatVolume,
  weekdayName,
  weekdayOf,
} from '@/data';

/** Nome curto para frases ("caminhada", "refrigerante"). */
export function shortOf(habit: Habit): string {
  return habit.shortName ?? habit.name.charAt(0).toLocaleLowerCase('pt-BR') + habit.name.slice(1);
}

/** Plural de um nome contável de uma palavra ("caminhada" → "caminhadas"); null quando não dá para saber. */
export function pluralNoun(short: string): string | null {
  if (/\s/.test(short.trim())) return null;
  const w = short.trim();
  if (/ção$/.test(w)) return w.replace(/ção$/, 'ções');
  if (/(ada|ida|ura|eira|ina|ola)$/.test(w)) return `${w}s`;
  return null;
}

// nomes em -ar, -er e -ir que não são verbos ("lazer", "celular"): ficam como nome nas frases
const NOT_VERBS = new Set([
  'açúcar',
  'altar',
  'celular',
  'colher',
  'familiar',
  'lazer',
  'luar',
  'lugar',
  'militar',
  'mulher',
  'pilar',
  'prazer',
  'talher',
]);

// os poucos irregulares que podem virar nome de hábito ("fazer" → "fez")
const IRREGULAR_PAST: Record<string, string> = {
  estar: 'esteve',
  fazer: 'fez',
  poder: 'pôde',
  querer: 'quis',
  saber: 'soube',
  trazer: 'trouxe',
  dizer: 'disse',
};

/** O verbo por trás do nome curto ("caminhada" → "caminhar", "acordar" → "acordar"); null quando não dá. */
export function verbOf(short: string): string | null {
  const w = short.trim().toLocaleLowerCase('pt-BR');
  if (/\s/.test(w) || NOT_VERBS.has(w)) return null;
  if (/(ar|er|ir)$/.test(w) && w.length > 3) return w;
  if (/ada$/.test(w) && w.length > 4) return w.replace(/ada$/, 'ar');
  if (/ida$/.test(w) && w.length > 4) return w.replace(/ida$/, 'er');
  return null;
}

/** O nome curto é ele mesmo um verbo ("acordar", "deitar", "jantar"), e não um nome derivado ("caminhada"). */
export function nameVerb(short: string): string | null {
  const v = verbOf(short);
  return v && v === short.trim().toLocaleLowerCase('pt-BR') ? v : null;
}

/** "você caminhou", "você acordou", "você correu" (o passado do verbo, para as frases dos padrões). */
export function pastOf(verb: string): string {
  if (IRREGULAR_PAST[verb]) return IRREGULAR_PAST[verb];
  if (verb.endsWith('ar')) return `${verb.slice(0, -2)}ou`;
  if (verb.endsWith('er')) return `${verb.slice(0, -2)}eu`;
  if (verb.endsWith('ir')) return `${verb.slice(0, -2)}iu`;
  return verb;
}

/** "24 caminhadas" ou "24 dias feitos". */
export function countNoun(n: number, short: string): string {
  const plural = pluralNoun(short);
  if (plural) return n === 1 ? short : plural;
  return n === 1 ? 'dia feito' : 'dias feitos';
}

/** Particípio que concorda com o nome ("Caminhada marcada", "Acordar marcado", "Telas desligadas marcadas"). */
export function agree(name: string, base: string): string {
  const first = name.trim().split(/\s+/)[0]?.toLocaleLowerCase('pt-BR') ?? '';
  const stem = base.replace(/o$/, '');
  if (/as$/.test(first)) return `${stem}as`;
  if (/(os|es)$/.test(first)) return `${stem}os`;
  if (/a$/.test(first)) return `${stem}a`;
  return `${stem}o`;
}

/** O artigo do nome: "a caminhada", "o acordar", "as telas desligadas". */
export function article(name: string): string {
  const first = name.trim().split(/\s+/)[0]?.toLocaleLowerCase('pt-BR') ?? '';
  if (/as$/.test(first)) return 'as';
  if (/(os|es)$/.test(first)) return 'os';
  if (/a$/.test(first)) return 'a';
  return 'o';
}

/** "na quarta", "no sábado", "hoje", "ontem" ou "em 14 de outubro". */
export function onDay(day: DayKey, today: DayKey): string {
  const d = diffDays(today, day);
  if (d === 0) return 'hoje';
  if (d > 0 && d < 7) {
    const wd = weekdayOf(day);
    return `${wd >= 5 ? 'no' : 'na'} ${weekdayName(day)}`;
  }
  return `em ${formatDayMonth(day)}`;
}

/** "ontem", "hoje", "anteontem" ou "quarta, 14 out". */
export function relativeDay(day: DayKey, today: DayKey): string {
  const d = diffDays(today, day);
  if (d === 0) return 'hoje';
  if (d === 1) return 'ontem';
  if (d === 2) return 'anteontem';
  return weekdayName(day);
}

/** Meta do dia em texto curto: "20 min ou mais", "80 g", "3 L", "6h50". */
export function goalText(habit: Habit, goal: ResolvedGoal): string | null {
  if (goal.time) return formatTime(goal.time);
  if (goal.value === undefined) return null;
  const v = goal.unit === 'ml' ? formatVolume(goal.value) : formatAmount(goal.value, goal.unit);
  if (habit.type === 'counter' || habit.type === 'number') return goal.direction === 'atMost' ? `até ${v}` : v;
  return goal.direction === 'atMost' ? `até ${v}` : `${v} ou mais`;
}

/** A linha de baixo do título do hábito: "20 min ou mais · meta 6 de 7 dias". */
export function habitSubtitle(habit: Habit, goal: ResolvedGoal): string {
  const parts: string[] = [];
  const g = goalText(habit, goal);
  switch (habit.type) {
    case 'time':
      if (habit.description) parts.push(habit.description);
      if (g) parts.push(`meta ${g}`);
      parts.push(`até ${goal.toleranceMin} min depois conta`);
      break;
    case 'counter':
      if (habit.description) parts.push(habit.description);
      if (g) parts.push(`meta ${g} por dia`);
      break;
    case 'budget': {
      const n = goal.perWeek ?? 0;
      parts.push(`até ${n}${goal.unit === 'dias' ? ' dias' : ''} por semana`);
      if (habit.description) parts.push(habit.description);
      break;
    }
    case 'weekly':
      parts.push(`${goal.perWeek ?? 1} ${goal.perWeek === 1 ? 'vez' : 'vezes'} por semana`);
      if (habit.description) parts.push(habit.description);
      break;
    case 'number':
      if (habit.description) parts.push(habit.description);
      parts.push(goal.measuring ? 'só medindo' : g ? `meta ${g}` : '');
      break;
    case 'checklist':
      parts.push(habit.description ?? `${habit.checklist.length} passos`);
      break;
    default: {
      const desc = habit.description ?? (g && habit.type === 'check' ? g : null);
      if (desc) parts.push(desc);
      if (goal.perWeek) parts.push(`meta ${goal.perWeek} de 7 dias`);
    }
  }
  return parts.filter(Boolean).join(' · ');
}

/**
 * Como o dia é lido pelo leitor de tela e na legenda: "caminhada feita", "sem caminhada". Num hábito de horário
 * (acordar, deitar), todo mundo acorda: o que muda é o horário. "no horário", "após o horário" (anotou depois da
 * meta mais a tolerância) ou "sem registro" (nada anotado: não dá para dizer que passou da hora).
 */
export function dayStateWords(
  state: HabitDayState,
  habit: Habit,
  opts: { partialText?: string; registered?: boolean } = {},
): string {
  const short = shortOf(habit);
  if (habit.type === 'time' && state === 'done') return 'no horário';
  if (habit.type === 'time' && state === 'notDone') return opts.registered ? 'após o horário' : 'sem registro';
  switch (state) {
    case 'done':
      return `${short} ${agree(short, 'feito')}`;
    case 'partial':
      return opts.partialText ? `parcial, ${opts.partialText}` : 'parcial';
    case 'notDone':
      return `sem ${short}`;
    case 'skipped':
      return 'não contou neste dia';
    case 'paused':
      return 'dia pausado';
    case 'offSchedule':
      return 'fora da agenda';
    case 'future':
      return 'por vir';
    default:
      return 'antes do começo';
  }
}

/** "menos de 20 min" (o parcial). */
export function partialText(goal: ResolvedGoal): string | null {
  if (goal.value === undefined || goal.partialMin === undefined) return null;
  return `menos de ${formatAmount(goal.value, goal.unit)}`;
}

// ---------- os padrões: os dias com e sem o hábito (ou no horário e após o horário) ----------

export interface PatternWords {
  /** depois de "Nos": "dias em que você acordou no horário", "dias com almoço no horário", "dias com caminhada" */
  days: string;
  /** os dois lados, nos rostinhos e nas barrinhas: "no horário" e "após o horário"; "com caminhada" e "sem caminhada" */
  withLabel: string;
  withoutLabel: string;
  /** "Os padrões aparecem com 7 dias no horário e 7 após o horário." */
  rule: (needed: number) => string;
  /** "Faltam 4 dias no horário." ou "Faltam 4 dias com caminhada." */
  missing: (n: number) => string;
  /** "Os outros dias chegam no tempo deles." ou "Os dias sem chegam no tempo deles." */
  othersLater: string;
  /** "Você acordou no horário em quase todos os dias" (quando faltam só os outros) */
  almostAll: string;
  /** "você nunca acordou após o horário dois dias seguidos" (depois de "Desde 21 de setembro, ") */
  neverTwo: string;
  /** "Nos dias em que você acordou no horário, seu humor médio foi 4,1. Nos outros, 3,4." */
  sentence: (metric: 'mood' | 'energy', withAvg: number, withoutAvg: number) => string;
  /** "Por enquanto, o humor fica parecido nos dias em que você acordou no horário e nos outros." */
  similar: (metric: 'mood' | 'energy') => string;
  /**
   * A base: "24 dias no horário · 8 após o horário" ou "24 dias com · 8 dias sem". No horário, os dias sem registro
   * (parte dos dias sem) aparecem à parte: "24 dias no horário · 6 após o horário · 2 sem registro".
   */
  basis: (counts: { withDays: number; withoutDays: number; noRecord?: number }, unit?: 'dia' | 'noite') => string;
}

const one = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const plural = (n: number, unit: 'dia' | 'noite') => (n === 1 ? unit : `${unit}s`);

/**
 * Os textos dos padrões de um hábito. Nos de horário, "no horário" e "após o horário" (nunca "sem acordar"):
 * o pretérito do nome curto quando ele é um verbo ("Nos dias em que você acordou no horário"); senão, "Nos dias com
 * almoço no horário". `noRecord`: quantos dos dias sem ficaram sem registro; com algum, o lado de lá deixa de ser
 * "após o horário" e vira "nos outros dias", porque não dá para dizer que passou da hora.
 */
export function patternWords(habit: Habit, opts: { noRecord?: number } = {}): PatternWords {
  const short = shortOf(habit);
  const fmtMetric = (metric: 'mood' | 'energy') => (metric === 'mood' ? 'seu humor médio foi' : 'sua energia média foi');
  const staysSimilar = (metric: 'mood' | 'energy') =>
    metric === 'mood' ? 'o humor fica parecido' : 'a energia fica parecida';
  if (habit.type !== 'time') {
    const verb = verbOf(short);
    return {
      days: `dias com ${short}`,
      withLabel: `com ${short}`,
      withoutLabel: `sem ${short}`,
      rule: (n) => `Os padrões aparecem com ${n} dias com e ${n} sem.`,
      missing: (n) => `Faltam ${n} ${plural(n, 'dia')} com ${short}.`,
      othersLater: 'Os dias sem chegam no tempo deles.',
      almostAll: verb ? `Você ${pastOf(verb)} em quase todos os dias` : `Você fez ${short} em quase todos os dias`,
      neverTwo: `você nunca ficou dois dias seguidos sem ${verb ?? short}`,
      sentence: (m, w, wo) => `Nos dias com ${short}, ${fmtMetric(m)} ${one(w)}. Nos outros, ${one(wo)}.`,
      similar: (m) => `Por enquanto, ${staysSimilar(m)} nos dias com e sem ${short}.`,
      basis: ({ withDays: w, withoutDays: wo }, unit = 'dia') => `${w} ${plural(w, unit)} com · ${wo} ${plural(wo, unit)} sem`,
    };
  }
  const verb = nameVerb(short);
  const past = verb ? pastOf(verb) : null;
  const days = past ? `dias em que você ${past} no horário` : `dias com ${short} no horário`;
  const mixed = (opts.noRecord ?? 0) > 0;
  return {
    days,
    withLabel: 'no horário',
    withoutLabel: mixed ? 'nos outros dias' : 'após o horário',
    rule: (n) => `Os padrões aparecem com ${n} dias no horário e ${n} ${mixed ? 'nos outros' : 'após o horário'}.`,
    missing: (n) => `Faltam ${n} ${plural(n, 'dia')} no horário.`,
    othersLater: 'Os outros dias chegam no tempo deles.',
    almostAll: past
      ? `Você ${past} no horário em quase todos os dias`
      : `${capitalize(article(short))} ${short} ficou no horário em quase todos os dias`,
    neverTwo: past
      ? `você nunca ${past} após o horário dois dias seguidos`
      : `você nunca ficou dois dias seguidos após o horário`,
    sentence: (m, w, wo) => `Nos ${days}, ${fmtMetric(m)} ${one(w)}. Nos outros, ${one(wo)}.`,
    similar: (m) => `Por enquanto, ${staysSimilar(m)} nos ${days} e nos outros.`,
    basis: ({ withDays: w, withoutDays: wo, noRecord = 0 }, unit = 'dia') => {
      const late = Math.max(0, wo - noRecord);
      const parts = [`${w} ${plural(w, unit)} no horário`, `${late} após o horário`];
      if (noRecord > 0) parts.push(`${noRecord} sem registro`);
      return parts.join(' · ');
    },
  };
}

/** Frase do insight do hábito quando ainda não dá para comparar (estados.md › Poucos dados). */
export function waitingSentence(missingWith: number, missingWithout: number, words: PatternWords, needed = 7): string {
  const rule = words.rule(needed);
  if (missingWith > 0) return `${rule} ${words.missing(missingWith)}`;
  if (missingWithout > 0) return `${rule} ${words.othersLater}`;
  return '';
}

export { capitalize };
