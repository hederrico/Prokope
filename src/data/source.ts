// A fonte de dados ativa: LocalSource (modo demonstração, no aparelho) ou FirestoreSource (users/{uid}/...).
// As duas têm a mesma interface: ouvintes por coleção, escrita em lote e o A dois.
import type { CollectionName, Hug, Invite, Link, LinkShare, Profile, UserCollections } from '@/types';

export type Unsubscribe = () => void;

export interface SnapshotMeta {
  /** a mudança ainda não subiu (escrita deste aparelho) */
  hasPendingWrites: boolean;
  /** veio do cache do aparelho */
  fromCache: boolean;
  /** só os metadados mudaram (a escrita local terminou de subir): os documentos são os mesmos da última vez */
  metadataOnly?: boolean;
}

/** Coleção mais o documento único do perfil. */
export type DocCollection = CollectionName | 'profile';

export type DocOf<C extends DocCollection> = C extends CollectionName ? UserCollections[C] : Profile;

export type WriteOp =
  | { op: 'set'; col: DocCollection; id: string; data: object }
  /** junta campos no documento (cria se não existir) */
  | { op: 'merge'; col: DocCollection; id: string; data: object }
  | { op: 'delete'; col: DocCollection; id: string };

export const PROFILE_ID = 'profile';

export interface TogetherApi {
  createInvite(fromName: string): Promise<Invite>;
  getInvite(id: string): Promise<Invite | null>;
  cancelInvite(id: string): Promise<void>;
  /** volta um convite cancelado ou recusado para pendente (desfazer) */
  reopenInvite(id: string): Promise<void>;
  declineInvite(id: string): Promise<void>;
  markInviteSeen(id: string): Promise<void>;
  /** aceita o convite e cria a ligação (grava linkId nos dois perfis, quando der) */
  acceptInvite(id: string, myName: string): Promise<Link>;
  /** os convites que esta pessoa criou */
  listenMyInvites(cb: (invites: Invite[]) => void): Unsubscribe;
  listenLink(linkId: string, cb: (link: Link | null) => void): Unsubscribe;
  /** as ligações em que esta pessoa está (quem convidou descobre que o convite foi aceito) */
  listenMyLinks(cb: (linkIds: string[]) => void): Unsubscribe;
  setShare(linkId: string, share: Partial<LinkShare>): Promise<void>;
  sendHug(linkId: string, to: string, day: string): Promise<Hug>;
  deleteHug(linkId: string, hugId: string): Promise<void>;
  listenHugs(linkId: string, cb: (hugs: Hug[]) => void): Unsubscribe;
  unlink(linkId: string): Promise<void>;
  /** refaz uma ligação desfeita (desfazer do "Desfazer a ligação") */
  relink(link: Link): Promise<void>;
}

export interface DataSource {
  readonly kind: 'demo' | 'firebase';
  readonly uid: string;
  listenProfile(
    cb: (profile: Profile | null, meta: SnapshotMeta) => void,
    onError?: (error: unknown) => void,
  ): Unsubscribe;
  listen<C extends CollectionName>(
    col: C,
    cb: (docs: UserCollections[C][], meta: SnapshotMeta) => void,
    onError?: (error: unknown) => void,
  ): Unsubscribe;
  /** grava num lote só (atômico quando a fonte permite) */
  write(ops: WriteOp[]): Promise<void>;
  /** id novo para uma coleção */
  newId(): string;
  /** apaga tudo da pessoa, em lotes */
  deleteAll(onProgress?: (done: number, total: number) => void): Promise<void>;
  /** escritas esperando internet (0 no modo demonstração) */
  pendingCount(): number;
  waitForPendingWrites(): Promise<void>;
  /** fecha ouvintes e conexões */
  close(): Promise<void>;
  readonly together: TogetherApi;
}

/** Id aleatório de 20 caracteres, como os do Firestore. */
export function randomId(length = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

/** Tira os campos undefined (o Firestore recusa undefined). */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => stripUndefined(v)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}
