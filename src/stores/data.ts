// Store dos dados da pessoa: coleções normalizadas por id, alimentadas pelos ouvintes da fonte ativa.
// As telas não leem daqui direto: usam os hooks de '@/data' (useToday, useHabit...).
import { create } from 'zustand';
import {
  COLLECTIONS,
  type Checkin,
  type CollectionName,
  type Entry,
  type Habit,
  type Mark,
  type Measurement,
  type Pause,
  type Phase,
  type Pillar,
  type Profile,
  type Review,
  type Run,
  type Slip,
  type UserCollections,
} from '@/types';
import type { DataSource, DocCollection, SnapshotMeta, Unsubscribe } from '@/data/source';

/** De onde veio a última mudança: deste aparelho, de outro aparelho, ou a carga inicial. */
export type ChangeOrigin = 'local' | 'remote' | 'initial';

export interface LastChange {
  origin: ChangeOrigin;
  col: DocCollection;
  at: number;
}

type Normalized = { [C in CollectionName]: Record<string, UserCollections[C]> };

export interface DataState extends Normalized {
  source: DataSource | null;
  status: 'idle' | 'loading' | 'ready';
  profile: Profile | null;
  profileLoaded: boolean;
  loaded: Record<DocCollection, boolean>;
  /** a última mudança e a de cada coleção (regra da celebração: só 'local' celebra) */
  lastChange: LastChange | null;
  origins: Partial<Record<DocCollection, ChangeOrigin>>;
  /** alguma coleção tem escrita esperando subir */
  pendingWrites: boolean;
  error: unknown;
}

const emptyLoaded = (): Record<DocCollection, boolean> =>
  Object.fromEntries([...COLLECTIONS, 'profile'].map((c) => [c, false])) as Record<DocCollection, boolean>;

const emptyCollections = (): Normalized => Object.fromEntries(COLLECTIONS.map((c) => [c, {}])) as unknown as Normalized;

export const useDataStore = create<DataState>(() => ({
  ...emptyCollections(),
  source: null,
  status: 'idle',
  profile: null,
  profileLoaded: false,
  loaded: emptyLoaded(),
  lastChange: null,
  origins: {},
  pendingWrites: false,
  error: null,
}));

let unsubs: Unsubscribe[] = [];
const pendingByCol = new Map<DocCollection, boolean>();

function originOf(meta: SnapshotMeta, wasLoaded: boolean): ChangeOrigin {
  if (!wasLoaded) return 'initial';
  return meta.hasPendingWrites ? 'local' : 'remote';
}

/** O que precisa ter chegado para o app mostrar o Hoje sem esqueleto. */
const READY_COLS: DocCollection[] = ['profile', 'pillars', 'habits', 'marks', 'entries', 'phases', 'pauses'];

function updateReady() {
  const s = useDataStore.getState();
  if (s.status === 'loading' && READY_COLS.every((c) => s.loaded[c])) useDataStore.setState({ status: 'ready' });
}

function setPending(col: DocCollection, pending: boolean) {
  pendingByCol.set(col, pending);
  const any = [...pendingByCol.values()].some(Boolean);
  if (any !== useDataStore.getState().pendingWrites) useDataStore.setState({ pendingWrites: any });
}

/** Liga o store a uma fonte: abre um ouvinte por coleção. */
export function connectSource(source: DataSource) {
  disconnectSource();
  useDataStore.setState({
    ...emptyCollections(),
    source,
    status: 'loading',
    profile: null,
    profileLoaded: false,
    loaded: emptyLoaded(),
    lastChange: null,
    origins: {},
    pendingWrites: false,
    error: null,
  });
  const onError = (error: unknown) => useDataStore.setState({ error });

  unsubs.push(
    source.listenProfile((profile, meta) => {
      const s = useDataStore.getState();
      if (s.source !== source) return;
      const origin = originOf(meta, s.loaded.profile);
      setPending('profile', meta.hasPendingWrites);
      useDataStore.setState({
        profile,
        profileLoaded: true,
        loaded: { ...s.loaded, profile: true },
        lastChange: { origin, col: 'profile', at: Date.now() },
        origins: { ...s.origins, profile: origin },
      });
      updateReady();
    }, onError),
  );

  for (const col of COLLECTIONS) {
    unsubs.push(
      source.listen(
        col,
        (docs, meta) => {
          const s = useDataStore.getState();
          if (s.source !== source) return;
          const origin = originOf(meta, s.loaded[col]);
          const byId: Record<string, unknown> = {};
          for (const d of docs) byId[(d as { id: string }).id] = d;
          setPending(col, meta.hasPendingWrites);
          useDataStore.setState({
            [col]: byId,
            loaded: { ...s.loaded, [col]: true },
            lastChange: { origin, col, at: Date.now() },
            origins: { ...s.origins, [col]: origin },
          } as Partial<DataState>);
          updateReady();
        },
        onError,
      ),
    );
  }
}

/** Fecha os ouvintes e esvazia o store (sair da conta). */
export function disconnectSource() {
  for (const u of unsubs) u();
  unsubs = [];
  pendingByCol.clear();
  useDataStore.setState({
    ...emptyCollections(),
    source: null,
    status: 'idle',
    profile: null,
    profileLoaded: false,
    loaded: emptyLoaded(),
    lastChange: null,
    origins: {},
    pendingWrites: false,
    error: null,
  });
}

/** A fonte ativa (as ações gravam por ela). */
export function getSource(): DataSource {
  const source = useDataStore.getState().source;
  if (!source) throw new Error('Nenhuma fonte de dados ativa: entre no app primeiro.');
  return source;
}

/** Espera até o store ficar pronto (testes e ações que precisam dos dados). */
export function whenReady(): Promise<void> {
  if (useDataStore.getState().status === 'ready') return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = useDataStore.subscribe((s) => {
      if (s.status === 'ready') {
        unsub();
        resolve();
      }
    });
  });
}

// Atalhos tipados para as ações (leitura do estado atual, fora do React)
export const current = {
  profile: (): Profile | null => useDataStore.getState().profile,
  pillars: (): Record<string, Pillar> => useDataStore.getState().pillars,
  habits: (): Record<string, Habit> => useDataStore.getState().habits,
  marks: (): Record<string, Mark> => useDataStore.getState().marks,
  entries: (): Record<string, Entry> => useDataStore.getState().entries,
  slips: (): Record<string, Slip> => useDataStore.getState().slips,
  checkins: (): Record<string, Checkin> => useDataStore.getState().checkins,
  measurements: (): Record<string, Measurement> => useDataStore.getState().measurements,
  pauses: (): Record<string, Pause> => useDataStore.getState().pauses,
  phases: (): Record<string, Phase> => useDataStore.getState().phases,
  reviews: (): Record<string, Review> => useDataStore.getState().reviews,
  runs: (): Record<string, Run> => useDataStore.getState().runs,
};
