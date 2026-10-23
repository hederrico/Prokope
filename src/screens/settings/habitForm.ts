// O formulário de hábito (Novo hábito · tipo e detalhes, Editar hábito): os tipos em 3 grupos, os padrões de cada
// tipo, as unidades, o passo do − e +, a escada do "Subir aos poucos" e a conversão do estado para o rascunho e para
// a ação. Funções puras (testadas em __tests__/habitForm.test.ts).
import type { HabitFormDraft } from '@/data';
import type { ChecklistItem, DayKey, DayMoment, Habit, HabitGoal, HabitType, QuickAdd, Weekday } from '@/types';
import type { IconName } from '@/icons';
import { goalAmount, TYPE_LABELS } from './habitText';

export interface TypeOption {
  type: HabitType;
  icon: IconName;
  title: string;
  example: string;
  badge?: string;
}

/** Os 9 tipos agrupados pelo que a pessoa quer: fazer, medir ou deixar algo. */
export const TYPE_GROUPS: { title: string; types: TypeOption[] }[] = [
  {
    title: 'Fazer algo',
    types: [
      { type: 'check', icon: 'check-circle', title: 'Sim ou não', example: 'Louça feita', badge: 'mais simples' },
      { type: 'weekly', icon: 'calendar-check', title: 'Vezes por semana', example: 'Academia 2×' },
      { type: 'time', icon: 'clock', title: 'Horário', example: 'Acordei às 6h52' },
      { type: 'checklist', icon: 'list-checks', title: 'Lista de passos', example: 'Ritual do sono' },
    ],
  },
  {
    title: 'Medir algo',
    types: [
      { type: 'counter', icon: 'plus-minus', title: 'Contador', example: 'Proteína: 46 de 80 g' },
      { type: 'number', icon: 'hash', title: 'Número', example: 'Peso, minutos de tela' },
      { type: 'rating', icon: 'star', title: 'Nota de 1 a 5', example: 'Almoço nota 4' },
    ],
  },
  {
    title: 'Deixar ou diminuir algo',
    types: [
      { type: 'daysSince', icon: 'calendar-slash', title: 'Dias sem', example: '12 dias sem refrigerante' },
      { type: 'budget', icon: 'gauge', title: 'Limite por semana', example: 'Até 2 refeições livres' },
    ],
  },
];

export const ALL_TYPES = TYPE_GROUPS.flatMap((g) => g.types);

export function isHabitType(v: string | null | undefined): v is HabitType {
  return !!v && ALL_TYPES.some((t) => t.type === v);
}

export const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const MOMENTS: { value: DayMoment; label: string }[] = [
  { value: 'morning', label: 'Manhã' },
  { value: 'day', label: 'Ao longo do dia' },
  { value: 'evening', label: 'Noite' },
  { value: 'free', label: 'Sem hora certa' },
];

export function momentLabel(m: DayMoment): string {
  return MOMENTS.find((x) => x.value === m)?.label ?? 'Ao longo do dia';
}

/** Unidades do contador: a guardada, a mostrada na linha e a lida por extenso. */
export const UNITS: { value: string; label: string; name: string }[] = [
  { value: 'g', label: 'gramas (g)', name: 'gramas' },
  { value: 'ml', label: 'mililitros (ml)', name: 'mililitros' },
  { value: 'L', label: 'litros (L)', name: 'litros' },
  { value: 'vezes', label: 'vezes', name: 'vezes' },
  { value: 'min', label: 'minutos', name: 'minutos' },
  { value: 'páginas', label: 'páginas', name: 'páginas' },
];

export function unitLabel(unit: string | undefined): string {
  if (!unit) return 'Nenhuma';
  return UNITS.find((u) => u.value === unit)?.label ?? unit;
}

export function unitName(unit: string | undefined): string {
  if (!unit) return '';
  return UNITS.find((u) => u.value === unit)?.name ?? unit;
}

/** O passo do − e +: g 5, ml 250, L 0,25, vezes 1, minutos 5. */
export function stepFor(unit: string | undefined): number {
  switch (unit) {
    case 'g':
      return 5;
    case 'ml':
      return 250;
    case 'L':
      return 0.25;
    case 'min':
      return 5;
    default:
      return 1;
  }
}

/** Arredonda para o passo (evita 0,30000000004). */
export function roundStep(v: number, step: number): number {
  const decimals = step < 1 ? 2 : 0;
  return Number((Math.round(v / step) * step).toFixed(decimals));
}

export interface FormState {
  type: HabitType;
  name: string;
  icon: IconName | null;
  /** a pessoa escolheu o ícone (deixa de seguir a sugestão do nome) */
  iconChosen: boolean;
  pillarId: string;
  goal: HabitGoal;
  quickAdds: QuickAdd[];
  checklist: ChecklistItem[];
  moment: DayMoment;
  days: Weekday[];
  /** quando começa: 'now', o número de uma fase ou um dia */
  start: 'now' | number | DayKey;
  /** fase (Editar hábito) */
  phase: number | null;
}

/** Meta, unidade e botões padrão de cada tipo (voltam ao padrão só quando o tipo muda). */
export function typeDefaults(type: HabitType): Pick<FormState, 'goal' | 'quickAdds' | 'checklist' | 'moment'> {
  switch (type) {
    case 'counter':
      return { goal: { value: 5, unit: 'vezes' }, quickAdds: [], checklist: [], moment: 'day' };
    case 'weekly':
      return { goal: { perWeek: 2 }, quickAdds: [], checklist: [], moment: 'day' };
    case 'time':
      return { goal: { time: '07:00', toleranceMin: 15 }, quickAdds: [], checklist: [], moment: 'morning' };
    case 'budget':
      return { goal: { perWeek: 2 }, quickAdds: [], checklist: [], moment: 'free' };
    case 'daysSince':
      return { goal: {}, quickAdds: [], checklist: [], moment: 'free' };
    case 'number':
      return { goal: { measuring: true }, quickAdds: [], checklist: [], moment: 'morning' };
    case 'checklist':
      return { goal: {}, quickAdds: [], checklist: [], moment: 'evening' };
    default:
      return { goal: {}, quickAdds: [], checklist: [], moment: 'day' };
  }
}

/** Um formulário novo do tipo, com o que já estava no rascunho (nome, pilar, ícone, momento, dias e início). */
export function newForm(
  type: HabitType,
  keep: Partial<FormState>,
  pillarId: string,
  start: FormState['start'],
): FormState {
  const sameType = keep.type === type;
  const d = typeDefaults(type);
  return {
    type,
    name: keep.name ?? '',
    icon: keep.icon ?? null,
    iconChosen: keep.iconChosen ?? false,
    pillarId: keep.pillarId || pillarId,
    goal: sameType && keep.goal ? keep.goal : d.goal,
    quickAdds: sameType && keep.quickAdds ? keep.quickAdds : d.quickAdds,
    checklist: sameType && keep.checklist ? keep.checklist : d.checklist,
    moment: keep.moment ?? d.moment,
    days: keep.days ?? [...ALL_WEEKDAYS],
    start: keep.start ?? start,
    phase: null,
  };
}

/** O estado de Editar hábito, a partir do hábito salvo. */
export function formFromHabit(h: Habit): FormState {
  return {
    type: h.type,
    name: h.name,
    icon: h.icon,
    iconChosen: true,
    pillarId: h.pillarId,
    goal: { ...h.goal },
    quickAdds: h.quickAdds.map((q) => ({ ...q })),
    checklist: h.checklist.map((c) => ({ ...c })),
    moment: h.schedule.moment,
    days: [...h.schedule.days],
    start: 'now',
    phase: h.phase,
  };
}

/** Rascunho do store (sobrevive a fechar sem querer) ↔ estado do formulário. */
export function formToDraft(f: FormState): HabitFormDraft {
  return {
    type: f.type,
    name: f.name,
    // só o ícone escolhido vai para o rascunho; o sugerido pelo nome volta a ser calculado
    icon: f.iconChosen && f.icon ? f.icon : undefined,
    pillarId: f.pillarId,
    goal: f.goal,
    quickAdds: f.quickAdds,
    checklist: f.checklist,
    schedule: { days: f.days, moment: f.moment },
    start: f.start,
  };
}

export function draftToForm(d: HabitFormDraft): Partial<FormState> {
  return {
    type: d.type,
    name: d.name ?? '',
    icon: (d.icon as IconName | undefined) ?? null,
    iconChosen: !!d.icon,
    pillarId: d.pillarId ?? '',
    goal: d.goal,
    quickAdds: d.quickAdds,
    checklist: d.checklist,
    moment: d.schedule?.moment,
    days: d.schedule?.days,
    start: d.start,
  };
}

/** A escada da meta: 80, 90, 100, 110 g, com o rótulo de quando chega cada degrau. No máximo 6 degraus. */
export function rampSteps(value: number, ramp: { step: number; everyWeeks: number; max: number }) {
  const out: { value: number; when: string }[] = [];
  if (ramp.step <= 0) return [{ value, when: 'agora' }];
  for (let v = value, i = 0; v <= ramp.max + 1e-9 && i < 6; v = Number((v + ramp.step).toFixed(2)), i++) {
    out.push({ value: v, when: i === 0 ? 'agora' : `em ${i * ramp.everyWeeks} sem` });
  }
  return out;
}

/** "+10 g a cada 2 semanas, até 110 g". */
export function rampText(ramp: { step: number; everyWeeks: number; max: number }, unit?: string): string {
  const weeks = ramp.everyWeeks === 1 ? 'toda semana' : `a cada ${ramp.everyWeeks} semanas`;
  return `+${goalAmount(ramp.step, unit)} ${weeks}, até ${goalAmount(ramp.max, unit)}`;
}

/** "Sobe 10 gramas a cada 2 semanas: 80, 90, 100 e 110." (a frase do leitor de tela). */
export function rampSentence(value: number, ramp: { step: number; everyWeeks: number; max: number }, unit?: string) {
  const steps = rampSteps(value, ramp).map((s) => goalAmount(s.value).replace(/\s.*$/, ''));
  const weeks = ramp.everyWeeks === 1 ? 'toda semana' : `a cada ${ramp.everyWeeks} semanas`;
  const list = steps.length > 1 ? `${steps.slice(0, -1).join(', ')} e ${steps[steps.length - 1]}` : steps[0];
  return `Sobe ${goalAmount(ramp.step).replace(/\s.*$/, '')} ${unitName(unit)} ${weeks}: ${list}.`;
}

/** O rótulo da prévia: o tipo ("Contador"). */
export function previewLabel(form: Pick<FormState, 'type'>): string {
  return TYPE_LABELS[form.type];
}
