// Textos do Hoje montados a partir dos dados da pessoa (nenhum nome de hábito fixo aqui):
// nomes curtos, listas ("louça, lixo, jantar e mais 3"), concordância do particípio nos toasts
// ("Caminhada marcada", "Futebol marcado") e as legendas de horário ("até 20h30", "às 21h · em 26 min").
import type { Habit, ScheduleKey } from '@/types';
import { formatTime, timeToMinutes } from '@/data';

/** Nome curto e minúsculo para frases ("caminhada", "louça"). */
export function shortOf(habit: Pick<Habit, 'name' | 'shortName'>): string {
  const short = habit.shortName?.trim();
  // o nome curto vale quando é parte do nome ("caminhada"); um curto de grupo ("refeições" no Jantar) não
  const s =
    short && habit.name.toLocaleLowerCase('pt-BR').includes(short.toLocaleLowerCase('pt-BR')) ? short : habit.name;
  // mantém siglas e nomes próprios no meio ("Shorts e TikTok"), só baixa a primeira letra
  return s.charAt(0).toLocaleLowerCase('pt-BR') + s.slice(1);
}

/** "a, b e c" (até 3) ou "a, b, c e mais 2". */
export function listNames(names: string[], max = 3): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  if (names.length <= max) return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
  return `${names.slice(0, max).join(', ')} e mais ${names.length - max}`;
}

// substantivos em -a que são masculinos (o resto em -a, -ção, -dade, -gem é feminino)
const MASC_A = new Set([
  'dia',
  'mapa',
  'programa',
  'problema',
  'sistema',
  'tema',
  'clima',
  'planeta',
  'idioma',
  'pijama',
]);
const CONNECTORS = new Set([
  'de',
  'do',
  'da',
  'dos',
  'das',
  'com',
  'e',
  'no',
  'na',
  'nos',
  'nas',
  'a',
  'o',
  'em',
  'por',
  'para',
  'sem',
]);

type Agreement = 'f' | 'm' | 'fp' | 'mp';

function agreementOf(name: string): Agreement {
  const first = name.trim().split(/\s+/)[0]?.toLocaleLowerCase('pt-BR') ?? '';
  const plural = /[^s]s$/.test(first) && !/(ês|ás|ós|is)$/.test(first);
  const base = plural ? first.replace(/(õe|ãe)s$/, 'ão').replace(/s$/, '') : first;
  const fem = !MASC_A.has(base) && /(a|ã|ção|são|dade|gem|ice)$/.test(base);
  if (plural) return fem ? 'fp' : 'mp';
  return fem ? 'f' : 'm';
}

/** O nome já termina num particípio ("Telas desligadas"): o toast usa só o nome. */
function endsWithParticiple(name: string): boolean {
  // só com mais de uma palavra: "Caminhada" e "Corrida" são substantivos, "Telas desligadas" já diz o que houve
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return false;
  const last = words[words.length - 1]!.toLocaleLowerCase('pt-BR');
  return /(ad|id)(o|a|os|as)$/.test(last);
}

/** "Caminhada marcada", "Futebol marcado", "Telas desligadas" (o nome já diz). stem: 'marcad', 'desmarcad', 'registrad'. */
export function withParticiple(name: string, stem: string): string {
  if (stem === 'marcad' && endsWithParticiple(name)) return name;
  const end = { f: 'a', m: 'o', fp: 'as', mp: 'os' }[agreementOf(name)];
  return `${name} ${stem}${end}`;
}

/** "Tranqueiras" → "Tranqueira", "Refeições livres" → "Refeição livre" (para "Tranqueira registrada"). */
export function singular(name: string): string {
  const words = name.trim().split(/\s+/);
  let stop = false;
  return words
    .map((w, i) => {
      if (stop) return w;
      const lw = w.toLocaleLowerCase('pt-BR');
      if (i > 0 && CONNECTORS.has(lw)) {
        stop = true;
        return w;
      }
      if (w.length <= 3) return w;
      if (/ões$/i.test(w)) return w.replace(/ões$/i, 'ão');
      if (/ães$/i.test(w)) return w.replace(/ães$/i, 'ão');
      if (/ais$/i.test(w)) return w.replace(/ais$/i, 'al');
      if (/[^s]s$/i.test(w) && !/(ês|is|ós)$/i.test(w)) return w.slice(0, -1);
      return w;
    })
    .join(' ');
}

/** Horários do perfil que marcam um instante ("às 21h"); os outros são prazo ("até 20h30"). */
const AT_KEYS: ScheduleKey[] = ['screensOff', 'checkin', 'wake', 'bed'];

/**
 * Legenda do horário de um hábito de marcar: "até 20h30", "às 21h · em 26 min", "ainda dá tempo".
 * `minutes` é a hora do dia lógico agora; `done` tira o "em 26 min" e o "ainda dá tempo".
 */
export function timeCaption(habit: Habit, time: string, minutes: number, done: boolean): string {
  const key = habit.goal.timeKey ?? habit.schedule.timeKey;
  const at = !!key && AT_KEYS.includes(key);
  const t = timeToMinutes(time);
  // horários depois da meia-noite contam no mesmo dia lógico
  const target = t < 4 * 60 ? t + 1440 : t;
  const left = target - minutes;
  if (at) {
    const base = `às ${formatTime(time)}`;
    return !done && left > 0 && left <= 60 ? `${base} · em ${left} min` : base;
  }
  if (!done && left < 0) return 'ainda dá tempo';
  return `até ${formatTime(time)}`;
}
