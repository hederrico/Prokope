// O coração das ações: grava pela fonte ativa e devolve o desfazer (o inverso, gravado na hora).
import type { DataSource, DocCollection, WriteOp } from '@/data/source';
import { PROFILE_ID } from '@/data/source';
import { buildDomainData, type DomainData } from '@/domain/context';
import { getSource, useDataStore } from '@/stores/data';
import { nowMs, useClockStore } from '@/stores/clock';
import type { DayKey } from '@/types';

/** O desfazer de uma ação. Ações que criam algo trazem o id novo em `undo.id`. */
export type Undo = (() => Promise<void>) & { id?: string };

const noop: Undo = async () => {};

export function noUndo(): Undo {
  return noop;
}

/** O documento atual do store (antes de gravar), para montar o inverso. */
export function currentDoc(col: DocCollection, id: string): object | undefined {
  const s = useDataStore.getState();
  if (col === 'profile') return s.profile ?? undefined;
  const bucket = s[col] as Record<string, object>;
  return bucket?.[id];
}

function clone<T>(v: T): T {
  return v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T);
}

/** Grava os passos num lote e devolve o desfazer, que volta cada documento ao que era. */
export async function commit(ops: WriteOp[], source: DataSource = getSource()): Promise<Undo> {
  if (!ops.length) return noop;
  const before = new Map<string, { col: DocCollection; id: string; doc: object | undefined }>();
  for (const o of ops) {
    const key = `${o.col}/${o.id}`;
    if (!before.has(key)) before.set(key, { col: o.col, id: o.id, doc: clone(currentDoc(o.col, o.id)) });
  }
  await source.write(ops);
  const inverse: WriteOp[] = [...before.values()].map(({ col, id, doc }) =>
    doc ? { op: 'set', col, id, data: doc } : { op: 'delete', col, id },
  );
  let undone = false;
  const undo: Undo = async () => {
    if (undone) return;
    undone = true;
    await source.write(inverse);
  };
  return undo;
}

/** Junta vários desfazer em um (na ordem inversa). */
export function combineUndo(...undos: Undo[]): Undo {
  const u: Undo = async () => {
    for (const fn of [...undos].reverse()) await fn();
  };
  return u;
}

export function withId(undo: Undo, id: string): Undo {
  undo.id = id;
  return undo;
}

/** Os dados atuais organizados para o domínio (fora do React). */
export function snapshot(): DomainData {
  const s = useDataStore.getState();
  return buildDomainData(s);
}

export function today(): DayKey {
  return useClockStore.getState().today;
}

export function now(): number {
  return nowMs();
}

export function newId(): string {
  return getSource().newId();
}

export { PROFILE_ID };

export function setOp(col: DocCollection, id: string, data: object): WriteOp {
  return { op: 'set', col, id, data };
}

export function mergeOp(col: DocCollection, id: string, data: object): WriteOp {
  return { op: 'merge', col, id, data };
}

export function deleteOp(col: DocCollection, id: string): WriteOp {
  return { op: 'delete', col, id };
}

export function profileMerge(data: object): WriteOp {
  return { op: 'merge', col: 'profile', id: PROFILE_ID, data: { ...data, updatedAt: now() } };
}
