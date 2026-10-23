// Números da história do SPEC (dados ilustrativos): quinta, 22 de outubro de 2026, semana 2 da fase 2.
import type { HabitVisual, HeatState, WeekDay } from '@/components/ui';

export const TODAY = '2026-10-22';

export const HABITS = {
  peso: { name: 'Peso', icon: 'scales', pillar: 'alim' },
  acordar: { name: 'Acordar', icon: 'alarm', pillar: 'mente' },
  caminhada: { name: 'Caminhada com o cachorro', icon: 'salsicha', pillar: 'familia' },
  almoco: { name: 'Almoço', icon: 'fork-knife', pillar: 'alim' },
  futebol: { name: 'Futebol', icon: 'soccer-ball', pillar: 'corpo' },
  telas: { name: 'Telas desligadas', icon: 'device-mobile-slash', pillar: 'mente' },
  deitar: { name: 'Deitar', icon: 'moon-stars', pillar: 'mente' },
  louca: { name: 'Louça', icon: 'broom', pillar: 'familia' },
  lixo: { name: 'Lixo e recicláveis', icon: 'trash', pillar: 'familia' },
  jantar: { name: 'Jantar', icon: 'bowl-food', pillar: 'alim' },
  agua: { name: 'Água', icon: 'drop', pillar: 'alim' },
  livres: { name: 'Refeições livres', icon: 'pizza', pillar: 'alim' },
  tranqueiras: { name: 'Tranqueiras', icon: 'cookie', pillar: 'alim' },
  refri: { name: 'Zero refrigerante', icon: 'pint-glass', pillar: 'alim' },
  shorts: { name: 'Sem Shorts e TikTok', icon: 'video-camera-slash', pillar: 'mente' },
  proteina: { name: 'Proteína', icon: 'egg', pillar: 'alim' },
} satisfies Record<string, HabitVisual>;

const WEEK_DATES = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'];

/** A semana do topo: [0,83, 0,75, 0,6, feitos/12, 0, 0, 0]. */
export function weekDays(doneToday: number, opts: { pausedTue?: boolean } = {}): WeekDay[] {
  const vals = [0.83, 0.75, 0.6, doneToday / 12];
  return WEEK_DATES.map((date, i) => ({
    date,
    value: vals[i] ?? 0,
    state: i > 3 ? 'future' : opts.pausedTue && i === 1 ? 'paused' : vals[i]! > 0 ? 'done' : 'empty',
  }));
}

/** A caminhada desde 21 de setembro: cinco semanas, com hoje (22) feito e a quarta (21) sem caminhada. */
export function walkHeatmap(): { date: string; state: HeatState }[] {
  const out: { date: string; state: HeatState }[] = [];
  const none = new Set(['2026-09-24', '2026-09-27', '2026-10-01', '2026-10-04', '2026-10-08', '2026-10-13', '2026-10-21']);
  const start = new Date(2026, 8, 21, 12);
  for (let i = 0; i < 35; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let state: HeatState = 'done';
    if (iso > TODAY) state = 'future';
    else if (none.has(iso)) state = 'none';
    else if (iso === '2026-10-16') state = 'partial';
    else if (iso === '2026-10-06') state = 'paused';
    out.push({ date: iso, state });
  }
  return out;
}

export const MORNING_FOODS = [
  { id: 'ovo', name: 'Ovo', grams: 6 },
  { id: 'leite', name: 'Leite', grams: 6 },
  { id: 'whey', name: 'Whey', grams: 22 },
];
export const LUNCH_FOODS = [
  { id: 'frango', name: 'Frango', grams: 30 },
  { id: 'feijao', name: 'Feijão', grams: 7 },
  { id: 'queijo', name: 'Queijo', grams: 5 },
];
export const ALL_FOODS = [...MORNING_FOODS, ...LUNCH_FOODS, { id: 'iogurte', name: 'Iogurte', grams: 10 }];
