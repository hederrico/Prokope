// O modo exemplo (data/example.ts): entrar e sair mantém os dados da pessoa, as escritas do exemplo ficam na cópia,
// e o que é da pessoa (efeitos da sessão, preferências, abertura, A dois, rascunhos, exportar) não se mistura.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { DataProvider, useSession } from '@/data/session';
import { useToday } from '@/data/hooks';
import { EXAMPLE_UID, enterExample, leaveExample, takeExampleReturn, useExample } from '@/data/example';
import { LocalSource } from '@/data/localSource';
import { PROFILE_ID } from '@/data/source';
import { createInvite, exportData, markHabit, setTheme, setTodayView, updateProfile } from '@/actions';
import { setFixedNow } from '@/stores/clock';
import { baseSource, baseState, getSource, useDataStore } from '@/stores/data';
import { markDayCelebrated, useDrafts, wasDayCelebrated } from '@/stores/drafts';
import { useTogetherStore } from '@/stores/together';
import { usePreferences } from '@/app/preferences';
import { rememberPillars } from '@/app/splashBridge';
import { instantAt, DEFAULT_CLOCK } from '@/domain/day';

const DAY = '2026-10-22';
const wrapper = ({ children }: { children: ReactNode }) => <DataProvider>{children}</DataProvider>;

function useAll() {
  return { session: useSession(), today: useToday(), example: useExample() };
}

/** O id do hábito com esse nome na fonte que está na tela (os ids do exemplo são outros). */
function habitId(name: string): string {
  const h = Object.values(useDataStore.getState().habits).find((x) => x.name.startsWith(name));
  if (!h) throw new Error(`sem o hábito ${name}`);
  return h.id;
}

const marked = (marks: Record<string, { habitId: string; day: string }>, id: string) =>
  Object.values(marks).some((m) => m.habitId === id && m.day === DAY);

async function openDemo(opts: { empty?: boolean } = {}) {
  const hook = renderHook(useAll, { wrapper });
  await waitFor(() => expect(hook.result.current.session.status).toBe('signedOut'));
  await act(() => hook.result.current.session.enterDemo(opts));
  await waitFor(() => expect(hook.result.current.session.status).toBe('ready'));
  return hook;
}

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  await LocalSource.destroy('demo');
  setFixedNow(instantAt(DAY, '07:42', DEFAULT_CLOCK));
});

afterEach(async () => {
  await leaveExample();
  setFixedNow(null);
});

it('entrar e sair: o exemplo é outra cópia, e a marca da pessoa continua', async () => {
  const { result, unmount } = await openDemo();
  const personWalk = habitId('Caminhada');
  await act(async () => {
    await markHabit(personWalk, DAY);
  });
  expect(result.current.today.count).toEqual({ done: 4, total: 12 });
  const personSource = getSource();

  await act(() => result.current.example.enter());
  expect(result.current.example.active).toBe(true);
  expect(window.__pkExample.active).toBe(true);
  // a história de novo, sem a marca da pessoa, e a fonte da pessoa continua aberta por baixo
  expect(result.current.today.count).toEqual({ done: 3, total: 12 });
  expect(getSource().uid).toBe(EXAMPLE_UID);
  expect(baseSource()).toBe(personSource);
  const exampleWalk = habitId('Caminhada');
  expect(exampleWalk).not.toBe(personWalk);

  // marcar no exemplo: fica na cópia
  const exampleDishes = habitId('Louça');
  await act(async () => {
    await markHabit(exampleDishes, DAY);
  });
  expect(result.current.today.count.done).toBe(4);
  expect(marked(baseState().marks, personWalk)).toBe(true);
  expect(Object.values(baseState().marks).some((m) => m.habitId === exampleDishes)).toBe(false);
  // escritas pendentes: nenhuma
  expect(getSource().pendingCount()).toBe(0);
  await waitFor(() => expect(useDataStore.getState().pendingWrites).toBe(false));

  await act(() => result.current.example.leave());
  expect(result.current.example.active).toBe(false);
  expect(getSource()).toBe(personSource);
  expect(result.current.today.count).toEqual({ done: 4, total: 12 });
  expect(marked(useDataStore.getState().marks, personWalk)).toBe(true);
  expect(Object.values(useDataStore.getState().marks).some((m) => m.habitId === exampleDishes)).toBe(false);
  unmount();

  // o que ficou no aparelho é só o da pessoa
  const stored = await LocalSource.open('demo');
  const marks = stored.getAll('marks') as { habitId: string; day: string }[];
  expect(marks.some((m) => m.habitId === personWalk && m.day === DAY)).toBe(true);
  expect(marks.some((m) => m.habitId === exampleDishes)).toBe(false);
  await stored.close();
});

it('o perfil do exemplo leva o nome e a aparência da pessoa, e as mudanças nele não voltam', async () => {
  const { result, unmount } = await openDemo();
  await act(async () => {
    await updateProfile({ name: 'Ana' });
    await setTodayView('timeline');
    await setTheme('dark');
  });
  expect(usePreferences.getState().theme).toBe('dark');

  await act(() => enterExample());
  const p = useDataStore.getState().profile!;
  expect(p.name).toBe('Ana');
  expect(p.prefs.todayView).toBe('timeline');
  expect(p.prefs.theme).toBe('dark');
  expect(p.planSetupAt).toBeTruthy();
  expect(result.current.session.user?.name).toBe('Ana');

  // trocar o tema dentro do exemplo vale só ali; na volta, a casca fica com o da pessoa
  await act(async () => {
    await setTheme('light');
  });
  expect(baseState().profile?.prefs.theme).toBe('dark');
  await act(() => leaveExample());
  expect(useDataStore.getState().profile?.prefs.theme).toBe('dark');
  await waitFor(() => expect(usePreferences.getState().theme).toBe('dark'));
  unmount();
});

it('o progresso do tutorial gravado no exemplo é da pessoa (só o campo tutorial)', async () => {
  const { unmount } = await openDemo();
  await act(() => enterExample());
  await act(async () => {
    await getSource().write([
      {
        op: 'merge',
        col: 'profile',
        id: PROFILE_ID,
        data: { tutorial: { done: { progresso: 123 } }, name: 'Exemplo' },
      },
    ]);
  });
  expect(useDataStore.getState().profile?.tutorial?.done?.progresso).toBe(123);
  await waitFor(() => expect(baseState().profile?.tutorial?.done?.progresso).toBe(123));
  expect(baseState().profile?.name).toBe('Henrique');
  await act(() => leaveExample());
  expect(useDataStore.getState().profile?.tutorial?.done?.progresso).toBe(123);
  unmount();
});

it('os efeitos da sessão não agem sobre o exemplo: primeiro acesso e o perfil novo da demonstração', async () => {
  const { result, unmount } = await openDemo({ empty: true });
  expect(result.current.session.needsOnboarding).toBe(true);

  await act(() => enterExample());
  expect(result.current.example.active).toBe(true);
  // o exemplo tem plano, mas o primeiro acesso continua o da pessoa
  expect(result.current.session.needsOnboarding).toBe(true);

  // um exemplo sem perfil não ganha o perfil novo da demonstração (blankDemoProfile)
  await act(async () => {
    await getSource().write([{ op: 'delete', col: 'profile', id: PROFILE_ID }]);
  });
  await act(() => new Promise((r) => setTimeout(r, 30)));
  expect(useDataStore.getState().profile).toBeNull();
  expect(result.current.session.needsOnboarding).toBe(true);

  await act(() => leaveExample());
  const own = useDataStore.getState().profile;
  expect(own?.planSetupAt).toBeFalsy();
  expect(Object.keys(useDataStore.getState().phases)).toHaveLength(0);
  unmount();
});

it('rascunhos, abertura, A dois e exportar ficam com a pessoa', async () => {
  const { unmount } = await openDemo();
  const personWalk = habitId('Caminhada');
  await act(async () => {
    await markHabit(personWalk, DAY);
    await createInvite();
  });
  await waitFor(() => expect(useTogetherStore.getState().invites).toHaveLength(1));
  useDrafts.getState().setCheckinDraft(DAY, { mood: 4 });
  const savedDrafts = localStorage.getItem('pk-drafts');
  localStorage.removeItem('pk-splash');

  await act(() => enterExample());
  // o A dois não liga com o exemplo
  expect(useTogetherStore.getState().invites).toHaveLength(0);
  expect(useTogetherStore.getState().link).toBeNull();
  // os rascunhos do exemplo começam vazios e não vão para o localStorage
  expect(useDrafts.getState().checkins[DAY]).toBeUndefined();
  useDrafts.getState().setCheckinDraft(DAY, { mood: 2 });
  expect(localStorage.getItem('pk-drafts')).toBe(savedDrafts);
  // o brilho do dia fechado no exemplo não gasta o da pessoa
  markDayCelebrated(DAY);
  expect(wasDayCelebrated(DAY)).toBe(true);
  // a abertura não guarda os pilares do exemplo
  rememberPillars(['lavanda']);
  expect(localStorage.getItem('pk-splash')).toBeNull();
  // exportar leva os dados da pessoa
  const file = await exportData('json');
  const payload = JSON.parse(file.content) as { marks: { habitId: string }[]; profile: { name: string } };
  expect(payload.marks.some((m) => m.habitId === personWalk)).toBe(true);
  expect(payload.marks.some((m) => m.habitId === habitId('Caminhada'))).toBe(false);

  await act(() => leaveExample());
  expect(useDrafts.getState().checkins[DAY]?.mood).toBe(4);
  expect(wasDayCelebrated(DAY)).toBe(false);
  await waitFor(() => expect(useTogetherStore.getState().invites).toHaveLength(1));
  unmount();
});

it('sair da conta com o exemplo ativo sai do exemplo antes, e recarregar volta para onde a pessoa estava', async () => {
  window.history.replaceState(null, '', '/progresso');
  const { result, unmount } = await openDemo();
  const personWalk = habitId('Caminhada');
  await act(async () => {
    await markHabit(personWalk, DAY);
  });
  await act(() => enterExample());
  expect(sessionStorage.getItem('pk-exemplo-volta')).toBe('/progresso');

  await act(() => result.current.session.signOut());
  expect(result.current.session.status).toBe('signedOut');
  expect(useDataStore.getState().example).toBe(false);
  expect(useDataStore.getState().source).toBeNull();
  // saiu do exemplo: recarregar não tem para onde voltar
  expect(takeExampleReturn()).toBeNull();

  await act(() => result.current.session.enterDemo());
  await waitFor(() => expect(result.current.today.count).toEqual({ done: 4, total: 12 }));

  // recarregar no meio do exemplo: o roteador lê onde a pessoa estava, uma vez
  await act(() => enterExample());
  expect(takeExampleReturn()).toBe('/progresso');
  expect(takeExampleReturn()).toBeNull();
  unmount();
  window.history.replaceState(null, '', '/');
});
