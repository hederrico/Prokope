// Textos da revisão a partir do resumo do domínio: a frase de cada linha vira título e legenda
// ("Telas desligadas" · "7 de 7 noites"), e cada hábito da próxima fase ganha o que ele pede.
import type { Habit } from '@/types';
import type { ReviewLine } from '@/data';
import { formatAmount } from '@/data';

/** "Telas desligadas em 7 de 7 noites" → { title: "Telas desligadas", sub: "7 de 7 noites" }. */
export function splitLine(l: ReviewLine, h: Habit | undefined): { title: string; sub: string } {
  const t = l.text;
  const name = h?.name ?? '';
  if (name && t === `${name} a semana toda`) return { title: name, sub: 'a semana toda' };
  if (name && t.startsWith(`${name}: `)) return { title: name, sub: t.slice(name.length + 2) };
  const i = t.lastIndexOf(' em ');
  if (i > 0) {
    const title = t.slice(0, i).replace(/ aconteceu$/, '');
    const rest = t.slice(i + 4);
    return { title, sub: /^\d+ de \d+/.test(rest) ? rest : `em ${rest}` };
  }
  return { title: t, sub: '' };
}

/** As bolinhas da linha: quantas e quantas cheias (no máximo 7). */
export function lineDots(l: ReviewLine): { total: number; on: number } {
  const total = Math.max(1, Math.min(7, l.of));
  return { total, on: Math.min(total, l.done) };
}

/** Um hábito que entra com a fase: "YouTube até 60 min" · "por dia · fora do trabalho". */
export function offerRow(h: Habit): { title: string; sub: string } {
  const g = h.goal;
  const desc = h.description?.trim();
  let title = h.name;
  let main: string;
  if (h.type === 'weekly' || h.type === 'budget') main = g.perWeek ? `${g.perWeek}× por semana` : 'na semana';
  else if (g.direction === 'atMost' && g.value != null) {
    title = `${h.name} até ${formatAmount(g.value, g.unit)}`;
    main = 'por dia';
  } else if (g.value != null && g.unit && !g.measuring) main = `${formatAmount(g.value, g.unit)} por dia`;
  else if (h.type === 'checklist') main = `${h.checklist.length} passos`;
  else main = 'todo dia';
  return { title, sub: [main, desc].filter(Boolean).join(' · ') };
}
