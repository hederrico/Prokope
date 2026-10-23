// Preferências e rotina do perfil: tema, animações, som, privacidade do peso, horários, revisão,
// coleta do lixo, tolerância do fim de semana.
import { setPreferences } from '@/app/preferences';
import type { Profile, ScheduleKey, ThemePref, TimeHM, TodayViewPref, Weekday } from '@/types';
import { useDataStore } from '@/stores/data';
import { commit, noUndo, profileMerge, today, type Undo } from './core';

/**
 * As preferências de aparência também vivem na cópia local da casca (src/app/preferences.ts: pk-theme, pk-motion,
 * pk-sound), que pinta a primeira tela no tema certo e troca o tema ao vivo. As ações gravam nos dois lugares.
 */
function applyLocal(key: keyof Profile['prefs'], value: unknown) {
  if (key === 'theme') setPreferences({ theme: value as ThemePref });
  else if (key === 'motion') setPreferences({ animations: !!value });
  else if (key === 'sound') setPreferences({ sound: !!value });
}

async function setPref<K extends keyof Profile['prefs']>(key: K, value: Profile['prefs'][K]): Promise<Undo> {
  if (!useDataStore.getState().profile) return noUndo();
  const prev = useDataStore.getState().profile?.prefs?.[key];
  applyLocal(key, value);
  const undo = await commit([profileMerge({ prefs: { [key]: value } })]);
  const wrapped: Undo = async () => {
    if (prev !== undefined) applyLocal(key, prev);
    await undo();
  };
  return wrapped;
}

export const setTheme = (theme: ThemePref) => setPref('theme', theme);
export const setMotion = (on: boolean) => setPref('motion', on);
export const setSound = (on: boolean) => setPref('sound', on);
export const setRunSound = (on: boolean) => setPref('runSound', on);
export const setWeightTrendOnly = (on: boolean) => setPref('weightTrendOnly', on);
/** Jeito de ver o Hoje (o botão no topo do Hoje e Ajustes › Aparência); vale para a pessoa, em todos os aparelhos. */
export const setTodayView = (view: TodayViewPref) => setPref('todayView', view);

/**
 * Muda um horário a partir de hoje. Os dias que passaram guardam a meta da época (scheduleLog),
 * e um registro já feito hoje guarda a meta de quando foi marcado.
 */
export async function setScheduleTime(key: ScheduleKey, time: TimeHM): Promise<Undo> {
  const p = useDataStore.getState().profile;
  if (!p) return noUndo();
  const d = today();
  const log = [...(p.scheduleLog ?? []).filter((c) => !(c.key === key && c.since === d)), { key, time, since: d }];
  return commit([profileMerge({ schedule: { ...p.schedule, [key]: time }, scheduleLog: log })]);
}

export async function setWeeklyReview(weekday: Weekday, time: TimeHM): Promise<Undo> {
  return commit([profileMerge({ weeklyReview: { weekday, time } })]);
}

export async function setWeekendTolerance(on: boolean): Promise<Undo> {
  return commit([profileMerge({ weekendTolerance: on })]);
}

export async function setCollectionDays(days: Weekday[]): Promise<Undo> {
  return commit([profileMerge({ collectionDays: [...new Set(days)].sort() })]);
}

/** Nome e outros campos simples do perfil. */
export async function updateProfile(
  patch: Partial<Pick<Profile, 'name' | 'timeZone' | 'dayStartHour'>>,
): Promise<Undo> {
  return commit([profileMerge(patch)]);
}
