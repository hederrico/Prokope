// Utilitários dos testes: aplica os documentos de uma semente num RawData em memória.
import type { WriteOp } from '@/data/source';
import { buildDomainData, emptyRawData, type DomainData, type RawData } from '@/domain/context';
import { instantAt, DEFAULT_CLOCK } from '@/domain/day';
import { buildDemoOps } from '@/data/seed';

export function opsToRaw(ops: WriteOp[]): RawData {
  const raw = emptyRawData() as unknown as Record<string, unknown>;
  const cols: Record<string, Record<string, unknown>> = {};
  for (const o of ops) {
    if (o.col === 'profile') {
      if (o.op !== 'delete') raw.profile = { ...(raw.profile as object), ...o.data };
      continue;
    }
    cols[o.col] ??= {};
    if (o.op === 'delete') delete cols[o.col][o.id];
    else cols[o.col][o.id] = { ...(o.op === 'merge' ? (cols[o.col][o.id] as object) : {}), ...o.data, id: o.id };
  }
  for (const [k, v] of Object.entries(cols)) raw[k] = v;
  return raw as unknown as RawData;
}

let counter = 0;
export const testId = () => `id${++counter}`;

/** A história da demonstração vista num dia e numa hora ('2026-10-22', '12:41'). */
export function storyAt(day: string, time: string): { data: DomainData; now: number } {
  const now = instantAt(day, time, DEFAULT_CLOCK);
  const data = buildDomainData(opsToRaw(buildDemoOps(now, testId)));
  return { data, now };
}
