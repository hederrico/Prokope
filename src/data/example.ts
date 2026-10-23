// Modo exemplo: enquanto o Zeno mostra o hábito, o Progresso e a Jornada, as telas leem a história de exemplo da
// demonstração, numa cópia em memória. Nada do que a pessoa toca ali é salvo, e os dados dela ficam intocados.
// Como funciona: uma LocalSource só na memória, semeada com a história relativa ao relógio de agora, fica por cima
// da fonte da pessoa (stores/data.ts › overlaySource). A fonte da pessoa continua aberta e em dia, estacionada, e a
// volta é instantânea. Recarregar o app sai do exemplo, porque ele nunca chega ao aparelho.
import { useMemo } from 'react';
import { clockOf } from '@/domain/day';
import { choreography } from '@/motion/tokens';
import { nowMs } from '@/stores/clock';
import { overlaySource, restoreSource, useDataStore } from '@/stores/data';
import { isolateDrafts } from '@/stores/drafts';
import type { CollectionName, Profile, UserCollections } from '@/types';
import { LocalSource } from './localSource';
import type { DataSource, SnapshotMeta, TogetherApi, Unsubscribe, WriteOp } from './source';

export interface ExampleMode {
  /** as telas estão mostrando o exemplo */
  active: boolean;
  /** troca as telas para o exemplo; resolve quando os dados do exemplo já estão na tela */
  enter(): Promise<void>;
  /** volta para os dados da pessoa; resolve quando eles já estão na tela */
  leave(): Promise<void>;
}

/** O uid da cópia do exemplo (nunca é o de uma conta). */
export const EXAMPLE_UID = 'exemplo';

/** Onde a pessoa estava ao entrar no exemplo (sessionStorage): recarregar no meio volta para lá. */
const RETURN_KEY = 'pk-exemplo-volta';

/**
 * A fonte do exemplo: grava só na cópia em memória. A exceção é o progresso do tutorial (`profile.tutorial`, por
 * mescla), que é da pessoa: um capítulo terminado no meio do exemplo fica como visto. Depois da saída, nada grava
 * (um Desfazer atrasado do exemplo não vai a lugar nenhum).
 */
class ExampleSource implements DataSource {
  readonly kind = 'demo' as const;
  readonly uid = EXAMPLE_UID;
  readonly together: TogetherApi;
  private gone = false;
  private inflight = new Set<Promise<void>>();
  private lastWriteAt = 0;

  constructor(
    private inner: LocalSource,
    private person: DataSource,
  ) {
    this.together = inner.together;
  }

  listenProfile(cb: (profile: Profile | null, meta: SnapshotMeta) => void): Unsubscribe {
    return this.inner.listenProfile(cb);
  }

  listen<C extends CollectionName>(col: C, cb: (docs: UserCollections[C][], meta: SnapshotMeta) => void): Unsubscribe {
    return this.inner.listen(col, cb);
  }

  async write(ops: WriteOp[]): Promise<void> {
    if (this.gone) return;
    this.lastWriteAt = Date.now();
    const run = (async () => {
      await this.inner.write(ops);
      const tutorial = tutorialOps(ops);
      if (tutorial.length) await this.person.write(tutorial);
    })();
    this.inflight.add(run);
    try {
      await run;
    } finally {
      this.inflight.delete(run);
    }
  }

  /**
   * Espera as escritas em andamento e o Desfazer delas (o Hoje mostra o toast `choreography.toast` depois do toque):
   * assim o toast de uma ação do exemplo aparece antes da volta, e a troca o tira da tela.
   */
  async settle(): Promise<void> {
    await Promise.allSettled([...this.inflight]);
    const wait = this.lastWriteAt + choreography.toast * 1000 + 50 - Date.now();
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, wait)));
  }

  newId(): string {
    return this.inner.newId();
  }

  async deleteAll(onProgress?: (done: number, total: number) => void): Promise<void> {
    if (!this.gone) await this.inner.deleteAll(onProgress);
  }

  pendingCount(): number {
    return 0;
  }

  async waitForPendingWrites(): Promise<void> {}

  async close(): Promise<void> {
    this.gone = true;
    await this.inner.close();
  }
}

/** As mesclas do perfil que levam o tutorial (só esse campo segue para a fonte da pessoa). */
function tutorialOps(ops: WriteOp[]): WriteOp[] {
  const out: WriteOp[] = [];
  for (const o of ops) {
    if (o.col !== 'profile' || o.op !== 'merge') continue;
    const tutorial = (o.data as { tutorial?: unknown }).tutorial;
    if (tutorial !== undefined) out.push({ op: 'merge', col: 'profile', id: o.id, data: { tutorial } });
  }
  return out;
}

/** O perfil da história com o nome da pessoa, as preferências dela (tema, movimento, som, jeito do Hoje, o Zeno) e o tutorial. */
function exampleProfile(story: Profile, person: Profile | null): Profile {
  if (!person) return story;
  return {
    ...story,
    name: person.name || 'Você',
    prefs: { ...story.prefs, ...person.prefs },
    ...(person.tutorial ? { tutorial: person.tutorial } : {}),
  };
}

// ---------- entrar e sair ----------

let shown: ExampleSource | null = null;
// entrar e sair andam em fila: um leave() no meio de um enter() espera a troca e volta
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

function rememberReturn() {
  try {
    sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search);
  } catch {
    /* sem armazenamento: recarregar volta para a rota atual */
  }
}

function forgetReturn() {
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    /* sem armazenamento */
  }
}

let watching = false;

/**
 * O que acompanha o modo, venha a saída de onde vier (leave, sair da conta, o login que caiu): os rascunhos trocam
 * junto com os dados, na mesma atualização, e a cópia do exemplo é descartada na saída.
 */
function watch() {
  if (watching) return;
  watching = true;
  useDataStore.subscribe((s, prev) => {
    if (s.example === prev.example) return;
    isolateDrafts(s.example);
    if (s.example) return;
    forgetReturn();
    const gone = shown;
    shown = null;
    void gone?.close();
  });
}

/** Troca as telas para o exemplo. Sem sessão pronta (ou já no exemplo), não faz nada. */
export function enterExample(): Promise<void> {
  return enqueue(async () => {
    const s = useDataStore.getState();
    const person = s.source;
    if (s.example || !person || s.status !== 'ready') return;
    watch();
    const inner = LocalSource.memory(EXAMPLE_UID);
    const { buildDemoOps } = await import('./seed');
    const ops = buildDemoOps(nowMs(), () => inner.newId(), clockOf(s.profile)).map((o) =>
      o.col === 'profile' && o.op === 'set' ? { ...o, data: exampleProfile(o.data as Profile, s.profile) } : o,
    );
    await inner.write(ops);
    // a pessoa saiu da conta enquanto a semente era montada
    if (useDataStore.getState().source !== person) return void inner.close();
    const source = new ExampleSource(inner, person);
    shown = source;
    rememberReturn();
    await overlaySource(source);
    if (useDataStore.getState().source !== source) {
      if (shown === source) shown = null;
      forgetReturn();
      await source.close();
    }
  });
}

/** Volta para os dados da pessoa (que estavam guardados e em dia). Fora do exemplo, não faz nada. */
export function leaveExample(): Promise<void> {
  return enqueue(async () => {
    if (!useDataStore.getState().example) return;
    await shown?.settle();
    restoreSource();
  });
}

/** O modo exemplo está na tela (fora do React). */
export function isExampleActive(): boolean {
  return useDataStore.getState().example;
}

/**
 * Recarregar no meio do exemplo sai dele: devolve onde a pessoa estava ao entrar (e esquece), para o roteador abrir
 * lá. As telas do exemplo levam ids que não existem nos dados dela.
 */
export function takeExampleReturn(): string | null {
  try {
    const path = sessionStorage.getItem(RETURN_KEY);
    if (path) sessionStorage.removeItem(RETURN_KEY);
    return path;
  } catch {
    return null;
  }
}

const actions = { enter: enterExample, leave: leaveExample };

export function useExample(): ExampleMode {
  const active = useDataStore((s) => s.example);
  return useMemo(() => ({ active, ...actions }), [active]);
}

// gancho de teste, sempre ligado (os e2e usam window.__pkExample sem redeclarar): o exemplo só existe na memória e
// não toca nos dados da pessoa
declare global {
  interface Window {
    __pkExample: { enter(): Promise<void>; leave(): Promise<void>; readonly active: boolean };
  }
}

if (typeof window !== 'undefined') {
  window.__pkExample = {
    enter: enterExample,
    leave: leaveExample,
    get active() {
      return isExampleActive();
    },
  };
}
