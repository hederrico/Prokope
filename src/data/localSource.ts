// Modo demonstração: os dados ficam no aparelho (IndexedDB), sobrevivem a recarregar e avisam as mudanças
// como o onSnapshot do Firestore. Duas abas abertas conversam por BroadcastChannel.
import type { CollectionName, Hug, Invite, Link, LinkShare, Profile, UserCollections } from '@/types';
import {
  PROFILE_ID,
  randomId,
  type DataSource,
  type DocCollection,
  type SnapshotMeta,
  type TogetherApi,
  type Unsubscribe,
  type WriteOp,
} from './source';

type AnyDoc = Record<string, unknown>;
/** Coleções internas: as do usuário, o perfil e as do A dois. */
type LocalCol = DocCollection | 'invites' | 'links' | 'hugs';
type LocalOp =
  | { op: 'set'; col: LocalCol; id: string; data: object }
  | { op: 'merge'; col: LocalCol; id: string; data: object }
  | { op: 'delete'; col: LocalCol; id: string };
type Listener = (docs: AnyDoc[], meta: SnapshotMeta) => void;

const DB_PREFIX = 'prokope-local-';
const STORE = 'docs';

interface Row {
  path: string;
  col: LocalCol;
  id: string;
  data: AnyDoc;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Junta como o set(..., { merge: true }) do Firestore: objetos se misturam, o resto é trocado. */
export function deepMerge(base: AnyDoc | undefined, patch: AnyDoc): AnyDoc {
  const out: AnyDoc = { ...(base ?? {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k] as AnyDoc, v) : clone(v);
  }
  return out;
}

function clone<T>(v: T): T {
  return v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T);
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function openDb(name: string): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const open = indexedDB.open(name, 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'path' });
    };
    return await req(open);
  } catch {
    return null;
  }
}

export class LocalSource implements DataSource {
  readonly kind = 'demo' as const;
  readonly uid: string;
  readonly together: TogetherApi;
  private docs = new Map<LocalCol, Map<string, AnyDoc>>();
  private listeners = new Map<LocalCol, Set<Listener>>();
  private channel: BroadcastChannel | null = null;
  private closed = false;

  private constructor(
    uid: string,
    private db: IDBDatabase | null,
  ) {
    this.uid = uid;
    this.together = new LocalTogether(this);
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(DB_PREFIX + uid);
      this.channel.onmessage = (ev: MessageEvent<{ ops: LocalOp[] }>) => {
        if (this.closed || !ev.data?.ops) return;
        this.applyInMemory(ev.data.ops, { hasPendingWrites: false, fromCache: true });
      };
    }
  }

  /** Abre (ou cria) a base do aparelho e carrega tudo na memória. */
  static async open(uid = 'demo'): Promise<LocalSource> {
    const db = await openDb(DB_PREFIX + uid);
    const source = new LocalSource(uid, db);
    if (db) {
      const rows = await req(db.transaction(STORE, 'readonly').objectStore(STORE).getAll() as IDBRequest<Row[]>);
      for (const row of rows) source.bucket(row.col).set(row.id, row.data);
    }
    return source;
  }

  /** Apaga a base de um usuário do aparelho sem abrir uma fonte. */
  static async destroy(uid = 'demo'): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    await new Promise<void>((resolve) => {
      const r = indexedDB.deleteDatabase(DB_PREFIX + uid);
      r.onsuccess = r.onerror = r.onblocked = () => resolve();
    });
  }

  /** Há dados guardados para este usuário? */
  hasData(): boolean {
    return (this.docs.get('profile')?.size ?? 0) > 0;
  }

  private bucket(col: LocalCol): Map<string, AnyDoc> {
    let b = this.docs.get(col);
    if (!b) {
      b = new Map();
      this.docs.set(col, b);
    }
    return b;
  }

  /** Lê um documento da memória (cópia). */
  get(col: LocalCol, id: string): AnyDoc | undefined {
    const doc = this.docs.get(col)?.get(id);
    return doc ? clone(doc) : undefined;
  }

  /** Lê uma coleção da memória (cópias). */
  getAll(col: LocalCol): AnyDoc[] {
    return [...(this.docs.get(col)?.values() ?? [])].map((d) => clone(d));
  }

  private emit(col: LocalCol, meta: SnapshotMeta) {
    const set = this.listeners.get(col);
    if (!set?.size) return;
    const docs = this.getAll(col);
    for (const l of [...set]) l(docs, meta);
  }

  private subscribe(col: LocalCol, cb: Listener): Unsubscribe {
    let set = this.listeners.get(col);
    if (!set) {
      set = new Set();
      this.listeners.set(col, set);
    }
    set.add(cb);
    let active = true;
    queueMicrotask(() => {
      if (active && !this.closed) cb(this.getAll(col), { hasPendingWrites: false, fromCache: true });
    });
    return () => {
      active = false;
      set.delete(cb);
    };
  }

  listenProfile(cb: (profile: Profile | null, meta: SnapshotMeta) => void): Unsubscribe {
    return this.subscribe('profile', (docs, meta) => {
      const p = docs.find((d) => d.id === PROFILE_ID);
      cb(p ? (stripId(p) as unknown as Profile) : null, meta);
    });
  }

  listen<C extends CollectionName>(col: C, cb: (docs: UserCollections[C][], meta: SnapshotMeta) => void): Unsubscribe {
    return this.subscribe(col, (docs, meta) => cb(docs as unknown as UserCollections[C][], meta));
  }

  /** Listener de uma coleção interna (A dois). */
  listenLocal(col: LocalCol, cb: Listener): Unsubscribe {
    return this.subscribe(col, cb);
  }

  private applyInMemory(ops: LocalOp[], meta: SnapshotMeta): Set<LocalCol> {
    const touched = new Set<LocalCol>();
    for (const o of ops) {
      const b = this.bucket(o.col);
      if (o.op === 'delete') b.delete(o.id);
      else if (o.op === 'set') b.set(o.id, withId(o.col, o.id, clone(o.data as AnyDoc)));
      else b.set(o.id, withId(o.col, o.id, deepMerge(b.get(o.id), o.data as AnyDoc)));
      touched.add(o.col);
    }
    for (const col of touched) this.emit(col, meta);
    return touched;
  }

  async write(ops: WriteOp[]): Promise<void> {
    await this.writeLocal(ops);
  }

  async writeLocal(ops: LocalOp[]): Promise<void> {
    if (this.closed) throw new Error('A fonte de dados foi fechada.');
    if (!ops.length) return;
    // memória primeiro (a tela responde na hora), depois o aparelho
    this.applyInMemory(ops, { hasPendingWrites: true, fromCache: true });
    if (this.db) {
      const tx = this.db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const paths = new Set(ops.map((o) => `${o.col}/${o.id}`));
      for (const path of paths) {
        const [first, ...rest] = path.split('/');
        const col = first as LocalCol;
        const id = rest.join('/');
        const data = this.docs.get(col)?.get(id);
        if (data) store.put({ path, col, id, data } satisfies Row);
        else store.delete(path);
      }
      await txDone(tx);
    }
    this.channel?.postMessage({ ops });
  }

  newId(): string {
    return randomId();
  }

  async deleteAll(onProgress?: (done: number, total: number) => void): Promise<void> {
    const cols = [...this.docs.keys()].filter((c) => c !== 'invites' && c !== 'links' && c !== 'hugs');
    const ops: LocalOp[] = [];
    for (const col of cols) for (const id of this.docs.get(col)?.keys() ?? []) ops.push({ op: 'delete', col, id });
    const total = ops.length;
    for (let i = 0; i < ops.length; i += 400) {
      await this.writeLocal(ops.slice(i, i + 400));
      onProgress?.(Math.min(total, i + 400), total);
    }
    if (!total) onProgress?.(0, 0);
  }

  pendingCount(): number {
    return 0;
  }

  async waitForPendingWrites(): Promise<void> {}

  async close(): Promise<void> {
    this.closed = true;
    this.listeners.clear();
    this.channel?.close();
    this.db?.close();
  }
}

function withId(_col: LocalCol, id: string, data: AnyDoc): AnyDoc {
  return { ...data, id };
}

function stripId(doc: AnyDoc): AnyDoc {
  const { id: _id, ...rest } = doc;
  void _id;
  return rest;
}

// ---------- A dois no aparelho (só para o modo demonstração funcionar de ponta a ponta) ----------

class LocalTogether implements TogetherApi {
  constructor(private src: LocalSource) {}

  async createInvite(fromName: string): Promise<Invite> {
    const now = Date.now();
    const invite: Invite = {
      id: randomId(28),
      fromUid: this.src.uid,
      fromName,
      status: 'pending',
      createdAt: now,
      expiresAt: now + 7 * 86_400_000,
      toUid: null,
      seenAt: null,
    };
    await this.src.writeLocal([{ op: 'set', col: 'invites', id: invite.id, data: invite }]);
    return invite;
  }

  async getInvite(id: string): Promise<Invite | null> {
    return (this.src.get('invites', id) as unknown as Invite) ?? null;
  }

  async cancelInvite(id: string): Promise<void> {
    await this.src.writeLocal([{ op: 'merge', col: 'invites', id, data: { status: 'cancelled' } }]);
  }

  async reopenInvite(id: string): Promise<void> {
    await this.src.writeLocal([{ op: 'merge', col: 'invites', id, data: { status: 'pending' } }]);
  }

  async declineInvite(id: string): Promise<void> {
    await this.src.writeLocal([{ op: 'merge', col: 'invites', id, data: { status: 'declined', toUid: this.src.uid } }]);
  }

  async markInviteSeen(id: string): Promise<void> {
    await this.src.writeLocal([{ op: 'merge', col: 'invites', id, data: { seenAt: Date.now() } }]);
  }

  async acceptInvite(id: string, myName: string): Promise<Link> {
    const invite = await this.getInvite(id);
    if (!invite || invite.status !== 'pending' || invite.expiresAt < Date.now()) {
      throw new Error('Este convite não vale mais.');
    }
    const me = invite.fromUid === this.src.uid ? `${this.src.uid}-par` : this.src.uid;
    const link: Link = {
      id,
      members: [invite.fromUid, me],
      names: { [invite.fromUid]: invite.fromName, [me]: myName },
      share: {
        [invite.fromUid]: { mood: false, moodToday: null, habits: [] },
        [me]: { mood: false, moodToday: null, habits: [] },
      },
      createdAt: Date.now(),
    };
    await this.src.writeLocal([
      { op: 'merge', col: 'invites', id, data: { status: 'accepted', toUid: me } },
      { op: 'set', col: 'links', id, data: link },
      { op: 'merge', col: 'profile', id: PROFILE_ID, data: { linkId: id } },
    ]);
    return link;
  }

  listenMyInvites(cb: (invites: Invite[]) => void): Unsubscribe {
    return this.src.listenLocal('invites', (docs) =>
      cb((docs as unknown as Invite[]).filter((i) => i.fromUid === this.src.uid)),
    );
  }

  listenLink(linkId: string, cb: (link: Link | null) => void): Unsubscribe {
    return this.src.listenLocal('links', (docs) => cb((docs.find((d) => d.id === linkId) as unknown as Link) ?? null));
  }

  listenMyLinks(cb: (linkIds: string[]) => void): Unsubscribe {
    return this.src.listenLocal('links', (docs) =>
      cb((docs as unknown as Link[]).filter((l) => l.members?.includes(this.src.uid)).map((l) => l.id)),
    );
  }

  async setShare(linkId: string, share: Partial<LinkShare>): Promise<void> {
    await this.src.writeLocal([{ op: 'merge', col: 'links', id: linkId, data: { share: { [this.src.uid]: share } } }]);
  }

  async sendHug(linkId: string, to: string, day: string): Promise<Hug> {
    const hug: Hug = { id: `${linkId}_${randomId(12)}`, from: this.src.uid, to, at: Date.now(), day };
    await this.src.writeLocal([{ op: 'set', col: 'hugs', id: hug.id, data: hug }]);
    return hug;
  }

  async deleteHug(_linkId: string, hugId: string): Promise<void> {
    await this.src.writeLocal([{ op: 'delete', col: 'hugs', id: hugId }]);
  }

  listenHugs(linkId: string, cb: (hugs: Hug[]) => void): Unsubscribe {
    return this.src.listenLocal('hugs', (docs) =>
      cb((docs as unknown as Hug[]).filter((h) => h.id.startsWith(`${linkId}_`))),
    );
  }

  async unlink(linkId: string): Promise<void> {
    await this.src.writeLocal([
      { op: 'delete', col: 'links', id: linkId },
      { op: 'merge', col: 'profile', id: PROFILE_ID, data: { linkId: null } },
    ]);
  }

  async relink(link: Link): Promise<void> {
    await this.src.writeLocal([
      { op: 'set', col: 'links', id: link.id, data: link },
      { op: 'merge', col: 'profile', id: PROFILE_ID, data: { linkId: link.id } },
    ]);
  }
}
