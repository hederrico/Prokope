// Store dos dados da pessoa: coleções normalizadas por id, alimentadas pelos ouvintes da fonte ativa.
// As telas não leem daqui direto: usam os hooks de '@/data' (useToday, useHabit...).
// No modo exemplo (src/data/example.ts), uma fonte em memória fica por cima: o store mostra o exemplo, e a fonte da
// pessoa fica estacionada, com os ouvintes ligados, guardando o estado dela à parte até a volta.
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
import { normalizeHabit } from '@/domain/normalize';

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
  /** o store está mostrando o modo exemplo (a fonte da pessoa está estacionada por baixo) */
  example: boolean;
}

/** O estado que vem de uma fonte (tudo menos a fonte e o modo exemplo). */
type Slice = Omit<DataState, 'source' | 'example'>;

const emptyLoaded = (): Record<DocCollection, boolean> =>
  Object.fromEntries([...COLLECTIONS, 'profile'].map((c) => [c, false])) as Record<DocCollection, boolean>;

const emptyCollections = (): Normalized => Object.fromEntries(COLLECTIONS.map((c) => [c, {}])) as unknown as Normalized;

const blankSlice = (status: DataState['status']): Slice => ({
  ...emptyCollections(),
  status,
  profile: null,
  profileLoaded: false,
  loaded: emptyLoaded(),
  lastChange: null,
  origins: {},
  pendingWrites: false,
  error: null,
});

export const useDataStore = create<DataState>(() => ({ ...blankSlice('idle'), source: null, example: false }));

/** Uma fonte ligada ao store: os ouvintes dela e, quando ela não está na tela, o estado dela guardado à parte. */
interface Connection {
  source: DataSource;
  unsubs: Unsubscribe[];
  pending: Map<DocCollection, boolean>;
  /** null: o estado desta fonte é o do store; senão, ele mora aqui (estacionada, ou carregando por baixo) */
  shelf: Slice | null;
  alive: boolean;
  /** chamado uma vez, quando a primeira leva de todas as coleções e do perfil chegou */
  onLoaded?: () => void;
}

/** a fonte da pessoa */
let main: Connection | null = null;
/** a fonte do modo exemplo, por cima da da pessoa */
let overlay: Connection | null = null;

function originOf(meta: SnapshotMeta, wasLoaded: boolean): ChangeOrigin {
  if (!wasLoaded) return 'initial';
  return meta.hasPendingWrites ? 'local' : 'remote';
}

/** O que precisa ter chegado para o app mostrar o Hoje sem esqueleto. */
const READY_COLS: DocCollection[] = ['profile', 'pillars', 'habits', 'marks', 'entries', 'phases', 'pauses'];
const ALL_COLS: DocCollection[] = ['profile', ...COLLECTIONS];

function read(conn: Connection): Slice {
  return conn.shelf ?? useDataStore.getState();
}

function write(conn: Connection, patch: Partial<Slice>) {
  if (conn.shelf) Object.assign(conn.shelf, patch);
  else useDataStore.setState(patch);
}

function updateReady(conn: Connection) {
  const s = read(conn);
  if (s.status === 'loading' && READY_COLS.every((c) => s.loaded[c])) write(conn, { status: 'ready' });
  if (conn.onLoaded && ALL_COLS.every((c) => read(conn).loaded[c])) {
    const done = conn.onLoaded;
    conn.onLoaded = undefined;
    done();
  }
}

function setPending(conn: Connection, col: DocCollection, pending: boolean) {
  conn.pending.set(col, pending);
  const any = [...conn.pending.values()].some(Boolean);
  if (any !== read(conn).pendingWrites) write(conn, { pendingWrites: any });
}

/** Abre um ouvinte por coleção. Com `shelf`, o estado vai para lá em vez do store. */
function attach(source: DataSource, shelf: Slice | null): Connection {
  const conn: Connection = { source, unsubs: [], pending: new Map(), shelf, alive: true };
  const onError = (error: unknown) => {
    if (conn.alive) write(conn, { error });
  };

  conn.unsubs.push(
    source.listenProfile((profile, meta) => {
      if (!conn.alive) return;
      const s = read(conn);
      // a escrita terminou de subir: só o "esperando" muda
      if (meta.metadataOnly && s.loaded.profile) return setPending(conn, 'profile', meta.hasPendingWrites);
      const origin = originOf(meta, s.loaded.profile);
      setPending(conn, 'profile', meta.hasPendingWrites);
      write(conn, {
        profile,
        profileLoaded: true,
        loaded: { ...s.loaded, profile: true },
        lastChange: { origin, col: 'profile', at: Date.now() },
        origins: { ...s.origins, profile: origin },
      });
      updateReady(conn);
    }, onError),
  );

  for (const col of COLLECTIONS) {
    conn.unsubs.push(
      source.listen(
        col,
        (docs, meta) => {
          if (!conn.alive) return;
          const s = read(conn);
          if (meta.metadataOnly && s.loaded[col]) return setPending(conn, col, meta.hasPendingWrites);
          const origin = originOf(meta, s.loaded[col]);
          const byId: Record<string, unknown> = {};
          // migração na leitura: os hábitos antigos chegam no formato de hoje (domain/normalize.ts)
          for (const d of docs) byId[(d as { id: string }).id] = col === 'habits' ? normalizeHabit(d as Habit) : d;
          setPending(conn, col, meta.hasPendingWrites);
          write(conn, {
            [col]: byId,
            loaded: { ...s.loaded, [col]: true },
            lastChange: { origin, col, at: Date.now() },
            origins: { ...s.origins, [col]: origin },
          } as Partial<Slice>);
          updateReady(conn);
        },
        onError,
      ),
    );
  }
  return conn;
}

function detach(conn: Connection | null) {
  if (!conn) return;
  conn.alive = false;
  for (const u of conn.unsubs) u();
  conn.unsubs = [];
  conn.pending.clear();
  // quem esperava a primeira leva não fica esperando para sempre
  const done = conn.onLoaded;
  conn.onLoaded = undefined;
  done?.();
}

/** Tira do store o estado que veio da fonte (para estacionar). */
function sliceOf(s: DataState): Slice {
  const { source: _source, example: _example, ...slice } = s;
  void _source;
  void _example;
  return slice;
}

/** Na troca entre a pessoa e o exemplo, nada conta como mudança deste aparelho (nada celebra na troca). */
const swapped = (): Pick<Slice, 'lastChange' | 'origins'> => ({
  lastChange: { origin: 'initial', col: 'profile', at: Date.now() },
  origins: {},
});

/** Liga o store a uma fonte: abre um ouvinte por coleção. */
export function connectSource(source: DataSource) {
  disconnectSource();
  useDataStore.setState({ ...blankSlice('loading'), source, example: false });
  main = attach(source, null);
}

/** Fecha os ouvintes (da pessoa e do exemplo) e esvazia o store (sair da conta). */
export function disconnectSource() {
  detach(overlay);
  detach(main);
  overlay = null;
  main = null;
  useDataStore.setState({ ...blankSlice('idle'), source: null, example: false });
}

/**
 * Modo exemplo: o store passa a mostrar `source`, sem fechar a fonte da pessoa. Os ouvintes da pessoa continuam
 * ligados, com o estado guardado à parte (o que chegar de outro aparelho entra lá). A troca acontece de uma vez,
 * quando todas as coleções do exemplo chegaram: a tela nunca passa por um store vazio. Resolve depois da troca.
 */
export function overlaySource(source: DataSource): Promise<void> {
  const base = main;
  if (!base) return Promise.reject(new Error('Nenhuma fonte de dados ativa: entre no app primeiro.'));
  restoreSource();
  return new Promise<void>((resolve) => {
    const conn = attach(source, blankSlice('loading'));
    overlay = conn;
    conn.onLoaded = () => {
      if (overlay === conn && main === base && conn.alive && conn.shelf) {
        base.shelf = sliceOf(useDataStore.getState());
        const slice = conn.shelf;
        conn.shelf = null;
        useDataStore.setState({ ...slice, ...swapped(), source, example: true });
      }
      resolve();
    };
    updateReady(conn);
  });
}

/**
 * Sai do modo exemplo: o store volta para o estado da pessoa (guardado e em dia), de uma vez, e os ouvintes do
 * exemplo fecham. Devolve a fonte do exemplo (quem abriu fecha), ou null se não havia exemplo.
 */
export function restoreSource(): DataSource | null {
  const conn = overlay;
  if (!conn) return null;
  overlay = null;
  const wasShown = !conn.shelf;
  detach(conn);
  const base = main;
  if (base?.shelf) {
    const slice = base.shelf;
    base.shelf = null;
    useDataStore.setState({ ...slice, ...swapped(), source: base.source, example: false });
  } else if (wasShown) useDataStore.setState({ example: false });
  return conn.source;
}

/** A fonte da pessoa, mesmo no modo exemplo (as ações gravam pela ativa: use getSource). */
export function baseSource(): DataSource | null {
  return main?.source ?? null;
}

/** O estado da pessoa, mesmo no modo exemplo (exportar). */
export function baseState(): Slice {
  return main?.shelf ?? useDataStore.getState();
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
