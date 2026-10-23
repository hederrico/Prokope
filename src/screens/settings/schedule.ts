// Os horários do perfil (Ajustes › Horários) e onde cada um é usado: os hábitos ligados a ele (pela meta ou pela
// agenda) e, para o fim da cafeína, a lista de passos que o cita. Também monta os alarmes sugeridos de Lembretes.
// Funções puras (testadas em __tests__/schedule.test.ts).
import { formatDayShort, timeToMinutes } from '@/data';
import type { HabitListItem } from '@/data';
import type { IconName } from '@/icons';
import type { Pillar, Profile, ScheduleKey, TimeHM } from '@/types';
import { joinList } from './habitText';

/** Nome, ícone e o que a linha conta quando o nome não diz (são horários do app, não dados da pessoa). */
export const SCHEDULE_KEYS: Record<ScheduleKey, { title: string; icon: IconName; note?: string }> = {
  wake: { title: 'Acordar', icon: 'alarm' },
  caffeine: { title: 'Fim da cafeína', icon: 'coffee' },
  chores: { title: 'Tarefas da casa', icon: 'broom' },
  checkin: { title: 'Check-in', icon: 'sparkle', note: 'A noite do Hoje começa aqui' },
  screensOff: { title: 'Telas desligadas', icon: 'device-mobile-slash', note: 'O Hoje avisa quanto falta' },
  bed: { title: 'Deitar', icon: 'moon-stars', note: 'Alarme de preparar 10 min antes' },
};

/** Minutos de preparo antes de deitar (o alarme "Preparar para deitar"). */
export const BED_PREP_MIN = 10;

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Palavras que ligam uma lista de passos a um horário ("Cafeína só até as 14h" usa o fim da cafeína). */
const KEY_WORDS: Partial<Record<ScheduleKey, string>> = { caffeine: 'cafeina' };

export function usesKey(item: HabitListItem, key: ScheduleKey): boolean {
  const h = item.habit;
  if (h.goal?.timeKey === key || h.schedule?.timeKey === key) return true;
  const word = KEY_WORDS[key];
  return !!word && h.type === 'checklist' && h.checklist.some((c) => norm(c.name).includes(word));
}

/** Minutos do dia lógico (a madrugada conta depois da noite: 0h30 = 24h30). */
export function logicalMin(t: TimeHM, dayStartHour = 4): number {
  const m = timeToMinutes(t);
  return m < dayStartHour * 60 ? m + 1440 : m;
}

export interface ScheduleRow {
  key: ScheduleKey;
  time: TimeHM;
  title: string;
  icon: IconName;
  pillar: Pillar | null;
  /** nenhum hábito ativo usa ainda: estilo off e o selo da fase */
  off: boolean;
  phase: number | null;
  subtitle: string;
  /** o horário fica depois de Deitar (ordem estranha: não bloqueia, só avisa) */
  afterBed: boolean;
  users: HabitListItem[];
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLocaleLowerCase('pt-BR') + s.slice(1);
}

/** As linhas de "Todo dia", em ordem de horário. Só entram os horários que algum hábito usa. */
export function scheduleRows(profile: Profile | null, habits: HabitListItem[]): ScheduleRow[] {
  if (!profile?.schedule) return [];
  const startHour = profile.dayStartHour ?? 4;
  const bed = profile.schedule.bed;
  const live = habits.filter((h) => h.status !== 'archived');
  const rows: ScheduleRow[] = [];
  for (const key of Object.keys(SCHEDULE_KEYS) as ScheduleKey[]) {
    const time = profile.schedule[key];
    if (!time) continue;
    const users = live.filter((h) => usesKey(h, key));
    if (!users.length) continue;
    const active = users.filter((h) => h.status === 'active' || h.status === 'paused');
    const off = active.length === 0;
    const first = (active[0] ?? users[0]) as HabitListItem;
    const meta = SCHEDULE_KEYS[key];
    let subtitle: string;
    if (off) {
      const starts = first.startsOn ? ` · começa em ${formatDayShort(first.startsOn)}` : '';
      subtitle = `${first.habit.name}${starts}`;
    } else if (key === 'wake') {
      subtitle = `${first.habit.goal.toleranceMin ?? 15} min de tolerância`;
    } else if (meta.note) {
      subtitle = meta.note;
    } else {
      subtitle = active.map((h, i) => (i ? lowerFirst(h.habit.name) : h.habit.name)).join(', ');
    }
    const afterBed =
      key !== 'bed' && key !== 'wake' && !!bed && logicalMin(time, startHour) > logicalMin(bed, startHour);
    if (afterBed && !off) subtitle = 'depois de Deitar';
    rows.push({
      key,
      time,
      title: meta.title,
      icon: meta.icon,
      pillar: first.pillar,
      off,
      phase: off ? (first.habit.phase ?? null) : null,
      subtitle,
      afterBed,
      users,
    });
  }
  return rows.sort((a, b) => logicalMin(a.time, startHour) - logicalMin(b.time, startHour));
}

export interface AlarmRowData {
  time: TimeHM;
  label: string;
  when: string;
}

function shortName(item: HabitListItem): string {
  return item.habit.shortName || lowerFirst(item.habit.name);
}

/** Os alarmes sugeridos de Lembretes: um por horário em uso (os do mesmo horário juntam), mais a revisão. */
export function suggestedAlarms(profile: Profile | null, habits: HabitListItem[]): AlarmRowData[] {
  if (!profile?.schedule) return [];
  const startHour = profile.dayStartHour ?? 4;
  const rows = scheduleRows(profile, habits).filter((r) => !r.off);
  const byTime = new Map<TimeHM, string[]>();
  const out: AlarmRowData[] = [];
  for (const r of rows) {
    // tempo de tela e YouTube vêm do próprio check-in: não pedem alarme
    const active = r.users.filter(
      (h) =>
        (h.status === 'active' || h.status === 'paused') && h.habit.role !== 'screenTime' && h.habit.role !== 'youtube',
    );
    const names =
      r.key === 'wake' || r.key === 'bed' || r.key === 'screensOff' ? [lowerFirst(r.title)] : active.map(shortName);
    if (r.key === 'bed') {
      const prep = (logicalMin(r.time, startHour) - BED_PREP_MIN + 1440) % 1440;
      const hh = String(Math.floor(prep / 60)).padStart(2, '0');
      const mm = String(prep % 60).padStart(2, '0');
      out.push({
        time: `${hh}:${mm}`,
        label: 'Preparar para deitar',
        when: `todo dia · ${BED_PREP_MIN} min antes de deitar`,
      });
      continue;
    }
    byTime.set(r.time, [...(byTime.get(r.time) ?? []), ...names]);
  }
  for (const [time, names] of byTime) {
    const unique = [...new Set(names)];
    const label = joinList(unique);
    out.push({ time, label: label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1), when: 'todo dia' });
  }
  out.sort((a, b) => logicalMin(a.time, startHour) - logicalMin(b.time, startHour));
  if (profile.weeklyReview) {
    const wd = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'][profile.weeklyReview.weekday];
    out.push({ time: profile.weeklyReview.time, label: 'Revisão da semana', when: wd });
  }
  return out;
}
