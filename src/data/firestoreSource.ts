// Fonte de dados do Firebase: users/{uid}/{coleção}/{id}, perfil em users/{uid}/profile/profile.
// A escrita vai para o cache do aparelho na hora (onSnapshot com hasPendingWrites) e sobe quando houver internet:
// as ações não esperam o servidor. Uma escrita recusada avisa os ouvintes de onWriteError.
// A dois: invites/{id} e links/{id} (com share/{uid}, hugs e habits), como em firestore.rules.
import {
  clearIndexedDbPersistence,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  terminate,
  Timestamp,
  updateDoc,
  waitForPendingWrites,
  where,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import type { CollectionName, Hug, Invite, Link, LinkShare, Profile, UserCollections } from '@/types';
import {
  PROFILE_ID,
  randomId,
  stripUndefined,
  type DataSource,
  type DocCollection,
  type SnapshotMeta,
  type TogetherApi,
  type Unsubscribe,
  type WriteOp,
} from './source';
import { reportWriteError } from './writeErrors';

const BATCH = 400;

function millis(v: unknown): number {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === 'number') return v;
  return Date.now();
}

export class FirestoreSource implements DataSource {
  readonly kind = 'firebase' as const;
  readonly together: TogetherApi;
  private inFlight = 0;

  constructor(
    readonly db: Firestore,
    readonly uid: string,
  ) {
    this.together = new FirestoreTogether(this);
  }

  ref(col: DocCollection, id: string): DocumentReference<DocumentData> {
    if (col === 'profile') return doc(this.db, 'users', this.uid, 'profile', PROFILE_ID);
    return doc(this.db, 'users', this.uid, col, id);
  }

  listenProfile(
    cb: (profile: Profile | null, meta: SnapshotMeta) => void,
    onError?: (e: unknown) => void,
  ): Unsubscribe {
    return onSnapshot(
      this.ref('profile', PROFILE_ID),
      (snap) => {
        cb(snap.exists() ? (snap.data() as Profile) : null, {
          hasPendingWrites: snap.metadata.hasPendingWrites,
          fromCache: snap.metadata.fromCache,
        });
      },
      (e) => onError?.(e),
    );
  }

  listen<C extends CollectionName>(
    col: C,
    cb: (docs: UserCollections[C][], meta: SnapshotMeta) => void,
    onError?: (e: unknown) => void,
  ): Unsubscribe {
    return onSnapshot(
      collection(this.db, 'users', this.uid, col),
      (snap) => {
        const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as unknown as UserCollections[C]);
        cb(docs, { hasPendingWrites: snap.metadata.hasPendingWrites, fromCache: snap.metadata.fromCache });
      },
      (e) => onError?.(e),
    );
  }

  /** Grava em lotes de até 400. Resolve quando o cache do aparelho aceitou (sem esperar o servidor). */
  async write(ops: WriteOp[]): Promise<void> {
    for (let i = 0; i < ops.length; i += BATCH) {
      const batch = writeBatch(this.db);
      for (const o of ops.slice(i, i + BATCH)) {
        const ref = this.ref(o.col, o.id);
        if (o.op === 'delete') batch.delete(ref);
        else if (o.op === 'set') batch.set(ref, stripUndefined(o.data));
        else batch.set(ref, stripUndefined(o.data), { merge: true });
      }
      this.inFlight++;
      batch
        .commit()
        .catch((e) => reportWriteError(e))
        .finally(() => {
          this.inFlight = Math.max(0, this.inFlight - 1);
        });
    }
    // o onSnapshot local dispara de forma síncrona no commit; um microtick garante a ordem
    await Promise.resolve();
  }

  newId(): string {
    return randomId();
  }

  async deleteAll(onProgress?: (done: number, total: number) => void): Promise<void> {
    const cols: CollectionName[] = [
      'marks',
      'entries',
      'slips',
      'checkins',
      'measurements',
      'pauses',
      'reviews',
      'runs',
      'habits',
      'pillars',
      'phases',
    ];
    const refs: DocumentReference[] = [];
    for (const col of cols) {
      const snap = await getDocs(collection(this.db, 'users', this.uid, col));
      for (const d of snap.docs) refs.push(d.ref);
    }
    // convites criados por esta pessoa
    const invites = await getDocs(query(collection(this.db, 'invites'), where('fromUid', '==', this.uid)));
    for (const d of invites.docs) refs.push(d.ref);
    const total = refs.length + 1;
    let done = 0;
    for (let i = 0; i < refs.length; i += BATCH) {
      const batch = writeBatch(this.db);
      for (const r of refs.slice(i, i + BATCH)) batch.delete(r);
      await batch.commit();
      done += Math.min(BATCH, refs.length - i);
      onProgress?.(done, total);
    }
    await deleteDoc(this.ref('profile', PROFILE_ID));
    onProgress?.(total, total);
  }

  pendingCount(): number {
    return this.inFlight;
  }

  waitForPendingWrites(): Promise<void> {
    return waitForPendingWrites(this.db);
  }

  async close(): Promise<void> {
    /* os ouvintes são fechados pelo store; o cache é limpo em clearCache() ao sair */
  }

  /** Ao sair da conta: encerra o Firestore e apaga o cache do aparelho (outra conta não vê nada). */
  async clearCache(): Promise<void> {
    try {
      await terminate(this.db);
      await clearIndexedDbPersistence(this.db);
    } catch {
      /* outra aba aberta segura o cache: ele some na próxima vez */
    }
  }
}

class FirestoreTogether implements TogetherApi {
  constructor(private src: FirestoreSource) {}

  private get db() {
    return this.src.db;
  }

  private toInvite(id: string, d: DocumentData): Invite {
    return {
      id,
      fromUid: d.fromUid,
      fromName: d.fromName,
      status: d.status,
      createdAt: millis(d.createdAt),
      expiresAt: millis(d.expiresAt),
      toUid: d.toUid ?? null,
      seenAt: d.seenAt ? millis(d.seenAt) : null,
    };
  }

  async createInvite(fromName: string): Promise<Invite> {
    const id = randomId(28);
    const expires = Timestamp.fromMillis(Date.now() + 7 * 86_400_000);
    await setDoc(doc(this.db, 'invites', id), {
      fromUid: this.src.uid,
      fromName,
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: expires,
    });
    return {
      id,
      fromUid: this.src.uid,
      fromName,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: expires.toMillis(),
      toUid: null,
      seenAt: null,
    };
  }

  async getInvite(id: string): Promise<Invite | null> {
    const snap = await getDoc(doc(this.db, 'invites', id));
    return snap.exists() ? this.toInvite(id, snap.data()) : null;
  }

  async cancelInvite(id: string): Promise<void> {
    await updateDoc(doc(this.db, 'invites', id), { status: 'cancelled' });
  }

  async reopenInvite(_id: string): Promise<void> {
    // as regras não deixam um convite voltar a pendente: o desfazer cria outro convite (veja a ação)
    throw new Error('reopen-not-allowed');
  }

  async declineInvite(id: string): Promise<void> {
    await updateDoc(doc(this.db, 'invites', id), {
      status: 'declined',
      toUid: this.src.uid,
      respondedAt: serverTimestamp(),
    });
  }

  async markInviteSeen(id: string): Promise<void> {
    await updateDoc(doc(this.db, 'invites', id), { seenAt: serverTimestamp() });
  }

  async acceptInvite(id: string, myName: string): Promise<Link> {
    const inviteRef = doc(this.db, 'invites', id);
    const linkRef = doc(this.db, 'links', id);
    const link = await runTransaction(this.db, async (tx) => {
      const snap = await tx.get(inviteRef);
      if (!snap.exists()) throw new Error('Este convite não vale mais.');
      const inv = this.toInvite(id, snap.data());
      if (inv.status !== 'pending' || inv.expiresAt < Date.now()) throw new Error('Este convite não vale mais.');
      tx.update(inviteRef, { status: 'accepted', toUid: this.src.uid, toName: myName, respondedAt: serverTimestamp() });
      const names = { [inv.fromUid]: inv.fromName, [this.src.uid]: myName };
      tx.set(linkRef, { members: [inv.fromUid, this.src.uid], names, createdAt: serverTimestamp() });
      return { id, members: [inv.fromUid, this.src.uid], names, share: {}, createdAt: Date.now() } satisfies Link;
    });
    await setDoc(this.src.ref('profile', PROFILE_ID), { linkId: id }, { merge: true });
    return link;
  }

  listenMyInvites(cb: (invites: Invite[]) => void): Unsubscribe {
    return onSnapshot(query(collection(this.db, 'invites'), where('fromUid', '==', this.src.uid)), (snap) =>
      cb(snap.docs.map((d) => this.toInvite(d.id, d.data()))),
    );
  }

  listenLink(linkId: string, cb: (link: Link | null) => void): Unsubscribe {
    let base: Link | null = null;
    let share: Record<string, LinkShare> = {};
    const emit = () => cb(base ? { ...base, share } : null);
    const u1 = onSnapshot(
      doc(this.db, 'links', linkId),
      (snap) => {
        base = snap.exists()
          ? {
              id: linkId,
              members: snap.data().members ?? [],
              names: snap.data().names ?? {},
              share: {},
              createdAt: millis(snap.data().createdAt),
            }
          : null;
        emit();
      },
      () => cb(null),
    );
    const u2 = onSnapshot(
      collection(this.db, 'links', linkId, 'share'),
      (snap) => {
        share = Object.fromEntries(snap.docs.map((d) => [d.id, d.data() as LinkShare]));
        emit();
      },
      () => undefined,
    );
    return () => {
      u1();
      u2();
    };
  }

  listenMyLinks(cb: (linkIds: string[]) => void): Unsubscribe {
    return onSnapshot(
      query(collection(this.db, 'links'), where('members', 'array-contains', this.src.uid)),
      (snap) => cb(snap.docs.map((d) => d.id)),
      () => cb([]),
    );
  }

  async setShare(linkId: string, share: Partial<LinkShare>): Promise<void> {
    await setDoc(doc(this.db, 'links', linkId, 'share', this.src.uid), stripUndefined(share), { merge: true });
  }

  async sendHug(linkId: string, to: string, day: string): Promise<Hug> {
    const id = randomId();
    await setDoc(doc(this.db, 'links', linkId, 'hugs', id), {
      fromUid: this.src.uid,
      toUid: to,
      day,
      createdAt: serverTimestamp(),
    });
    return { id, from: this.src.uid, to, day, at: Date.now() };
  }

  async deleteHug(linkId: string, hugId: string): Promise<void> {
    await deleteDoc(doc(this.db, 'links', linkId, 'hugs', hugId));
  }

  listenHugs(linkId: string, cb: (hugs: Hug[]) => void): Unsubscribe {
    return onSnapshot(
      collection(this.db, 'links', linkId, 'hugs'),
      (snap) =>
        cb(
          snap.docs.map((d) => ({
            id: d.id,
            from: d.data().fromUid,
            to: d.data().toUid,
            day: d.data().day,
            at: millis(d.data().createdAt),
          })),
        ),
      () => cb([]),
    );
  }

  async unlink(linkId: string): Promise<void> {
    for (const sub of ['share', 'hugs', 'habits']) {
      const snap = await getDocs(collection(this.db, 'links', linkId, sub));
      for (const d of snap.docs) await deleteDoc(d.ref);
    }
    await deleteDoc(doc(this.db, 'links', linkId));
    await setDoc(this.src.ref('profile', PROFILE_ID), { linkId: null }, { merge: true });
  }

  async relink(_link: Link): Promise<void> {
    // uma ligação desfeita só volta com um convite novo (as regras exigem o convite pendente)
    throw new Error('relink-not-allowed');
  }
}
