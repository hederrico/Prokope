// Os dados do store organizados para o domínio, montados uma vez por mudança e divididos por todos os hooks.
import { useShallow } from 'zustand/react/shallow';
import { buildDomainData, type DomainData } from '@/domain/context';
import { useDataStore, type DataState } from '@/stores/data';
import { useClockStore } from '@/stores/clock';

type Slices = Pick<
  DataState,
  | 'profile'
  | 'pillars'
  | 'habits'
  | 'marks'
  | 'entries'
  | 'slips'
  | 'checkins'
  | 'measurements'
  | 'pauses'
  | 'phases'
  | 'reviews'
  | 'runs'
>;

const KEYS: (keyof Slices)[] = [
  'profile',
  'pillars',
  'habits',
  'marks',
  'entries',
  'slips',
  'checkins',
  'measurements',
  'pauses',
  'phases',
  'reviews',
  'runs',
];

let lastSlices: Slices | null = null;
let lastData: DomainData | null = null;

/** Monta (ou reaproveita) os dados do domínio para o estado atual do store. */
export function getDomainData(state: Slices = useDataStore.getState()): DomainData {
  if (lastSlices && lastData && KEYS.every((k) => lastSlices![k] === state[k])) return lastData;
  lastSlices = Object.fromEntries(KEYS.map((k) => [k, state[k]])) as unknown as Slices;
  lastData = buildDomainData(state);
  return lastData;
}

const select = (s: DataState): Slices => ({
  profile: s.profile,
  pillars: s.pillars,
  habits: s.habits,
  marks: s.marks,
  entries: s.entries,
  slips: s.slips,
  checkins: s.checkins,
  measurements: s.measurements,
  pauses: s.pauses,
  phases: s.phases,
  reviews: s.reviews,
  runs: s.runs,
});

/** Os dados do domínio, atualizados a cada mudança. */
export function useDomain(): DomainData {
  const slices = useDataStore(useShallow(select));
  return getDomainData(slices);
}

/** Cache por versão dos dados: o mesmo cálculo pedido por várias telas é feito uma vez. */
const caches = new WeakMap<DomainData, Map<string, unknown>>();

export function cached<T>(data: DomainData, key: string, fn: () => T): T {
  let m = caches.get(data);
  if (!m) {
    m = new Map();
    caches.set(data, m);
  }
  if (m.has(key)) return m.get(key) as T;
  const v = fn();
  m.set(key, v);
  return v;
}

/** Hora atual do app (minuto a minuto). */
export function useNow() {
  return useClockStore(
    useShallow((s) => ({ now: s.now, today: s.today, minutes: s.minutes, clock: s.clock, fixed: s.fixed })),
  );
}
