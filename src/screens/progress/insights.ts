// Os padrões do Progresso que o domínio ainda não calcula (habito-progresso.md › Progresso · visão geral e humor):
// - a constância do resto do dia nos dias com e sem um hábito ("acordou no horário: 84% contra 61%");
// - a meta da semana de um contador ("a proteína chegou a 80 g em 2 dos 3 dias fechados");
// - a energia do dia seguinte depois das noites com e sem um hábito da noite ("deitou até 22h30");
// - o padrão dos dias "muito bem" (fim de semana ou dias de semana).
// São funções puras sobre os dados do domínio; o lugar delas é src/domain (pedido para a base no relatório).
import type { DayKey, Habit } from '@/types';
import type { DomainData } from '@/domain/context';
import { addDays, daysBetween, isWeekend, weekDays, weekStart } from '@/domain/day';
import { formatDayMonth, formatNumber, formatTime, monthName } from '@/domain/format';
import { goalOn, habitDay, isCountable, isDoneLike, isInPlan } from '@/domain/habitState';
import { dayCount, habitTotals } from '@/domain/stats';
import { CORRELATION_NEEDED } from '@/domain/correlation';
import type { Insight } from '@/domain/views';
import { article, capitalize, pastOf, shortOf, verbOf } from '@/screens/habit/text';

export interface ExtraInsight {
  key: string;
  habitId: string | null;
  text: string;
  basis: string;
  icon: Habit['icon'] | null;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const one = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dias = (n: number) => (n === 1 ? 'dia' : 'dias');

/** "24 dias com · 8 dias sem": a história do hábito desde o começo (a mesma conta do Total no hábito). */
export function totalsBasis(habit: Habit, data: DomainData, today: DayKey): string {
  const t = habitTotals(habit, today, data, today);
  return `${t.withDays} ${dias(t.withDays)} com · ${t.withoutDays} ${dias(t.withoutDays)} sem`;
}

/** O hábito que mais puxa o resto do dia: a constância dos outros hábitos nos dias com e sem ele. */
export function restOfDayInsight(data: DomainData, today: DayKey): ExtraInsight | null {
  let best: { h: Habit; w: number; wo: number; wn: number; won: number } | null = null;
  for (const h of data.habits) {
    if (!isInPlan(h, today, data) || !h.startDay || h.startDay >= today) continue;
    if (h.type !== 'time' && h.type !== 'check') continue;
    if (h.role === 'checkin' || h.role === 'bed') continue;
    let ws = 0;
    let wn = 0;
    let wos = 0;
    let won = 0;
    for (const d of daysBetween(h.startDay, addDays(today, -1))) {
      const hd = habitDay(h, d, data, today);
      if (!isCountable(hd.state)) continue;
      const rest = dayCount(data, d, today, (x) => x.id !== h.id);
      if (!rest.total) continue;
      if (isDoneLike(hd.state)) {
        ws += rest.ratio;
        wn++;
      } else {
        wos += rest.ratio;
        won++;
      }
    }
    if (wn < CORRELATION_NEEDED || won < CORRELATION_NEEDED) continue;
    const w = ws / wn;
    const wo = wos / won;
    if (w - wo < 0.05) continue;
    // um horário (acordar) puxa o dia inteiro: ele vem antes dos outros quando também ajuda
    const better =
      !best ||
      (h.type === 'time' && best.h.type !== 'time') ||
      (h.type === best.h.type && w - wo > best.w - best.wo);
    if (better) best = { h, w, wo, wn, won };
  }
  if (!best) return null;
  const { h, w, wo, wn, won } = best;
  const short = shortOf(h);
  const verb = verbOf(short);
  const when =
    h.type === 'time'
      ? verb
        ? `Nos dias em que você ${pastOf(verb)} no horário`
        : `Nos dias com ${short} no horário`
      : verb
        ? `Nos dias em que você ${pastOf(verb)}`
        : `Nos dias com ${short}`;
  return {
    key: `resto:${h.id}`,
    habitId: h.id,
    icon: h.icon,
    text: `${when}, a constância do resto do dia foi ${pct(w)}. Nos outros, ${pct(wo)}.`,
    basis: `${wn} ${dias(wn)} com · ${won} sem · desde ${formatDayMonth(h.startDay!)}`,
  };
}

/** A meta da semana de um contador, comparada com a semana passada (só na semana atual). */
export function counterWeekInsight(data: DomainData, today: DayKey, preferPillar?: string | null): ExtraInsight | null {
  const counters = data.habits.filter(
    (h) => isInPlan(h, today, data) && h.startDay && h.startDay < today && h.type === 'counter' && h.goal.value !== undefined,
  );
  if (!counters.length) return null;
  counters.sort((a, b) => Number(b.pillarId === preferPillar) - Number(a.pillarId === preferPillar));
  const count = (h: Habit, days: DayKey[]) => {
    let closed = 0;
    let hit = 0;
    for (const d of days) {
      if (d >= today || d < h.startDay!) continue;
      const hd = habitDay(h, d, data, today);
      if (hd.state === 'paused' || hd.state === 'inactive' || hd.state === 'skipped') continue;
      closed++;
      if (hd.state === 'done') hit++;
    }
    return { closed, hit };
  };
  for (const h of counters) {
    const now = count(h, weekDays(today));
    if (!now.closed) continue;
    const prev = count(h, weekDays(addDays(weekStart(today), -7)));
    const g = goalOn(h, today, data);
    const goal = g.unit === 'ml' ? `${formatNumber((g.value ?? 0) / 1000, 2)} L` : `${formatNumber(g.value ?? 0)} ${g.unit ?? ''}`.trim();
    const short = shortOf(h);
    let text = `${capitalize(article(short))} ${short} chegou a ${goal} em ${now.hit} ${
      now.closed === 1 ? 'do dia fechado' : `dos ${now.closed} dias fechados`
    } desta semana.`;
    if (prev.closed) text += ` Na semana passada, isso aconteceu em ${prev.hit} de ${prev.closed}.`;
    const phase = h.phase ? data.phases.find((p) => p.number === h.phase) : null;
    const pillar = data.pillarById.get(h.pillarId);
    return {
      key: `meta:${h.id}`,
      habitId: h.id,
      icon: h.icon,
      text,
      basis: phase ? `Fase ${phase.number} · ${phase.name}` : (pillar?.name ?? ''),
    };
  }
  return null;
}

/** A energia do dia seguinte depois das noites com e sem um hábito da noite. */
export function nextDayEnergyInsight(data: DomainData, today: DayKey): ExtraInsight | null {
  let best: { h: Habit; w: number; wo: number; wn: number; won: number } | null = null;
  for (const h of data.habits) {
    if (!isInPlan(h, today, data) || !h.startDay || h.role === 'checkin') continue;
    if (h.type !== 'time' && h.type !== 'check') continue;
    if (h.schedule.moment !== 'evening' && h.role !== 'bed') continue;
    let ws = 0;
    let wn = 0;
    let wos = 0;
    let won = 0;
    for (const d of daysBetween(h.startDay, addDays(today, -1))) {
      const energy = data.checkins.get(addDays(d, 1))?.energy;
      if (!energy) continue;
      const hd = habitDay(h, d, data, today);
      if (isDoneLike(hd.state)) {
        ws += energy;
        wn++;
      } else if (hd.state === 'notDone') {
        wos += energy;
        won++;
      }
    }
    if (wn < CORRELATION_NEEDED || won < CORRELATION_NEEDED) continue;
    const w = ws / wn;
    const wo = wos / won;
    if (w - wo < 0.2) continue;
    // o deitar (horário) vem antes dos outros hábitos da noite quando também ajuda
    const better =
      !best ||
      (h.type === 'time' && best.h.type !== 'time') ||
      (h.type === best.h.type && w - wo > best.w - best.wo);
    if (better) best = { h, w, wo, wn, won };
  }
  if (!best) return null;
  const { h, w, wo, wn, won } = best;
  const short = shortOf(h);
  const verb = verbOf(short);
  const time = h.type === 'time' ? goalOn(h, today, data).time : undefined;
  const when = verb
    ? `Nas noites em que você ${pastOf(verb)}${time ? ` até ${formatTime(time)}` : ''}`
    : `Nas noites com ${short}${time ? ` até ${formatTime(time)}` : ''}`;
  return {
    key: `energia:${h.id}`,
    habitId: h.id,
    icon: h.icon,
    text: `${when}, a energia do dia seguinte foi ${one(w)}. Nas outras, ${one(wo)}.`,
    basis: `${wn} ${wn === 1 ? 'noite' : 'noites'} com · ${won} sem`,
  };
}

/** "Os 3 dias em que você se sentiu muito bem caíram no fim de semana." (no período mostrado) */
export function bestDaysInsight(days: { day: DayKey; mood: number | null }[]): ExtraInsight | null {
  const best = days.filter((d) => d.mood === 5).map((d) => d.day);
  if (best.length < 2) return null;
  const weekend = best.filter(isWeekend).length;
  let where: string;
  if (weekend === best.length) where = 'caíram no fim de semana';
  else if (weekend === 0) where = 'caíram em dias de semana';
  else return null;
  const dates = best.map((d) => Number(d.slice(8, 10)));
  const months = new Set(best.map((d) => d.slice(5, 7)));
  const list =
    months.size === 1
      ? `${dates.slice(0, -1).join(', ')} e ${dates[dates.length - 1]} de ${monthName(Number(best[0].slice(5, 7)))}`
      : best.map(formatDayMonth).join(', ');
  return {
    key: 'melhores',
    habitId: null,
    icon: 'sun',
    text: `Os ${best.length} dias em que você se sentiu muito bem ${where}.`,
    basis: list,
  };
}

// ---------- as listas de cada vista (cache por versão dos dados) ----------

const caches = new WeakMap<DomainData, Map<string, ExtraInsight[]>>();
function cachedList(data: DomainData, key: string, fn: () => ExtraInsight[]): ExtraInsight[] {
  let m = caches.get(data);
  if (!m) caches.set(data, (m = new Map()));
  const hit = m.get(key);
  if (hit) return hit;
  const v = fn();
  m.set(key, v);
  return v;
}

function fromCorrelations(list: ExtraInsight[], insights: Insight[], data: DomainData, today: DayKey, prefix: string) {
  for (const ins of insights) {
    const h = data.habitById.get(ins.habitId);
    if (!h || list.some((x) => x.habitId === ins.habitId)) continue;
    list.push({ key: `${prefix}:${h.id}`, habitId: h.id, icon: h.icon, text: ins.text, basis: totalsBasis(h, data, today) });
  }
}

/** Visão geral: até 3 padrões sem repetir hábito (o resto do dia, a meta da semana e as correlações com o humor). */
export function overviewInsights(
  data: DomainData,
  today: DayKey,
  opts: { currentWeek: boolean; focusPillar: string | null; insights: Insight[] },
): ExtraInsight[] {
  const key = `visao:${today}:${opts.currentWeek}:${opts.focusPillar}:${opts.insights.map((i) => i.habitId).join(',')}`;
  return cachedList(data, key, () => {
    const list: ExtraInsight[] = [];
    const rest = restOfDayInsight(data, today);
    if (rest) list.push(rest);
    if (opts.currentWeek) {
      const meta = counterWeekInsight(data, today, opts.focusPillar);
      if (meta) list.push(meta);
    }
    fromCorrelations(list, opts.insights, data, today, 'humor');
    return list.slice(0, 3);
  });
}

/** Humor: dois padrões de hábitos diferentes (a energia do dia seguinte, os dias "muito bem", as correlações). */
export function moodInsights(
  data: DomainData,
  today: DayKey,
  days: { day: DayKey; mood: number | null }[],
  insights: Insight[],
): ExtraInsight[] {
  const key = `humor:${today}:${days[0]?.day ?? ''}:${days.length}:${insights.map((i) => i.habitId).join(',')}`;
  return cachedList(data, key, () => {
    const list: ExtraInsight[] = [];
    const energy = nextDayEnergyInsight(data, today);
    if (energy) list.push(energy);
    const best = bestDaysInsight(days);
    if (best) list.push(best);
    fromCorrelations(list, insights, data, today, 'corr');
    return list.slice(0, 2);
  });
}
