// A sessão no modo demonstração e os hooks de leitura, dentro do React.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { DataProvider, useSession } from '@/data/session';
import { useHabitStats, useJourney, useProgress, useToday, useWeek } from '@/data/hooks';
import { markHabit } from '@/actions';
import { setFixedNow } from '@/stores/clock';
import { instantAt, DEFAULT_CLOCK } from '@/domain/day';
import { LocalSource } from '@/data/localSource';

const wrapper = ({ children }: { children: ReactNode }) => <DataProvider>{children}</DataProvider>;

function useAll() {
  const session = useSession();
  const today = useToday();
  const week = useWeek();
  const progress = useProgress('semana', 'visao');
  const journey = useJourney();
  const walkId = today.layout.groups.flatMap((g) => g.items).find((i) => i.habit.name.startsWith('Caminhada'))
    ?.habit.id;
  const stats = useHabitStats(walkId);
  return { session, today, week, progress, journey, stats, walkId };
}

beforeEach(async () => {
  localStorage.clear();
  await LocalSource.destroy('demo');
});

afterEach(() => setFixedNow(null));

it('entra no modo demonstração, mostra a história e atualiza depois de marcar', async () => {
  setFixedNow(instantAt('2026-10-22', '07:42', DEFAULT_CLOCK));
  const { result } = renderHook(useAll, { wrapper });
  await waitFor(() => expect(result.current.session.status).toBe('signedOut'));
  expect(result.current.session.firebaseAvailable).toBe(false);
  await expect(result.current.session.signIn()).rejects.toThrow(/modo demonstração/);

  await act(() => result.current.session.enterDemo());
  await waitFor(() => expect(result.current.session.status).toBe('ready'));
  expect(result.current.session.mode).toBe('demo');
  expect(result.current.session.user?.name).toBe('Henrique');
  expect(result.current.session.needsOnboarding).toBe(false);
  expect(result.current.today.count).toEqual({ done: 3, total: 12 });
  expect(result.current.today.greeting).toBe('Bom dia');
  expect(result.current.week.days.map((d) => d.weekday)).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']);
  expect(result.current.journey.current?.number).toBe(2);
  expect(result.current.stats?.week.done).toBe(2);

  await act(async () => {
    await markHabit(result.current.walkId!, '2026-10-22');
  });
  expect(result.current.today.count).toEqual({ done: 4, total: 12 });
  expect(result.current.stats?.week.done).toBe(3);
  expect(Math.round(result.current.progress.constancy! * 100)).toBe(76);

  // reabrir o app: a demonstração continua no aparelho, com a marca feita
  await act(() => result.current.session.signOut());
  expect(result.current.session.status).toBe('signedOut');
  await act(() => result.current.session.enterDemo());
  await waitFor(() => expect(result.current.today.count).toEqual({ done: 4, total: 12 }));

  // começar de novo: apaga e semeia
  await act(() => result.current.session.resetDemo());
  await waitFor(() => expect(result.current.today.count).toEqual({ done: 3, total: 12 }));
});
