// Primeiro acesso (setupPlan), exportar (CSV e JSON) e apagar todos os dados.
import type { WriteOp } from '@/data/source';
import { PROFILE_ID } from '@/data/source';
import { buildPlan, newProfile, type PlanDraft } from '@/domain/planTemplate';
import { formatNumber } from '@/domain/format';
import { logicalDay } from '@/domain/day';
import { buildDomainData } from '@/domain/context';
import { baseState, getSource, useDataStore } from '@/stores/data';
import { leaveExample } from '@/data/example';
import { commit, now, setOp, snapshot, type Undo } from './core';
import { PREFERENCE_KEYS } from '@/app/preferences';

/**
 * Grava o plano escolhido no primeiro acesso num lote só: perfil (horários, coleta, revisão), pilares,
 * hábitos e fases (a fase 1 começa hoje, ou amanhã depois das 20h). Não espera o servidor.
 */
export async function setupPlan(draft: PlanDraft, opts: { name?: string } = {}): Promise<Undo> {
  const source = getSource();
  const data = snapshot();
  const t = now();
  const plan = buildPlan(draft, { now: t, clock: data.clock, newId: () => source.newId() });
  const base = useDataStore.getState().profile ?? newProfile(opts.name ?? 'Você', t, data.clock);
  const profile = {
    ...base,
    ...plan.profile,
    ...(opts.name ? { name: opts.name } : {}),
    planSetupAt: t,
    deleting: false,
    updatedAt: t,
  };
  const ops: WriteOp[] = [setOp('profile', PROFILE_ID, profile)];
  for (const p of plan.pillars) ops.push(setOp('pillars', p.id, p));
  for (const h of plan.habits) ops.push(setOp('habits', h.id, h));
  for (const ph of plan.phases) ops.push(setOp('phases', ph.id, ph));
  return commit(ops, source);
}

// ---------- exportar ----------

export interface ExportFile {
  filename: string;
  mime: string;
  content: string;
  /** o arquivo pronto para a folha de compartilhar (navigator.share({ files: [file.toFile()] })) */
  toFile(): File;
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Gera o arquivo dos dados que já estão na memória (funciona sem internet). Sempre os da pessoa: no modo exemplo,
 * os dela estão guardados por baixo da cópia.
 */
export async function exportData(format: 'csv' | 'json'): Promise<ExportFile> {
  const s = baseState();
  const data = buildDomainData(s);
  const day = logicalDay(now(), data.clock);
  if (format === 'json') {
    const payload = {
      app: 'Prokopē',
      exportedAt: new Date(now()).toISOString(),
      profile: s.profile,
      pillars: Object.values(s.pillars),
      habits: Object.values(s.habits),
      marks: Object.values(s.marks),
      entries: Object.values(s.entries),
      slips: Object.values(s.slips),
      checkins: Object.values(s.checkins),
      measurements: Object.values(s.measurements),
      pauses: Object.values(s.pauses),
      phases: Object.values(s.phases),
      reviews: Object.values(s.reviews),
      runs: Object.values(s.runs),
    };
    const content = JSON.stringify(payload, null, 2);
    const filename = `prokope-${day}.json`;
    return {
      filename,
      mime: 'application/json',
      content,
      toFile: () => new File([content], filename, { type: 'application/json' }),
    };
  }
  const rows: unknown[][] = [['dia', 'pilar', 'hábito', 'tipo', 'valor', 'unidade', 'fase']];
  const habitInfo = (id: string) => {
    const h = data.habitById.get(id);
    return {
      name: h?.name ?? id,
      pillar: h ? (data.pillarById.get(h.pillarId)?.name ?? '') : '',
      type: h?.type ?? '',
      unit: h?.goal.unit ?? '',
      phase: h?.phase ?? '',
    };
  };
  for (const m of Object.values(s.marks).sort((a, b) => (a.day < b.day ? -1 : 1))) {
    const h = habitInfo(m.habitId);
    const value = m.skipped
      ? 'não conta'
      : (m.rating ??
        m.time ??
        m.value ??
        (m.status === 'done' ? 'feito' : m.status === 'partial' ? 'parcial' : 'registrado'));
    rows.push([m.day, h.pillar, h.name, h.type, value, m.time ? 'horário' : m.rating ? 'nota' : h.unit, h.phase]);
  }
  for (const e of Object.values(s.entries).sort((a, b) => a.at - b.at)) {
    const h = habitInfo(e.habitId);
    rows.push([
      e.day,
      h.pillar,
      e.item ? `${h.name} · ${e.item}` : h.name,
      h.type,
      formatNumber(e.amount, 2),
      h.unit,
      h.phase,
    ]);
  }
  for (const sl of Object.values(s.slips)) {
    const h = habitInfo(sl.habitId);
    rows.push([sl.day, h.pillar, h.name, 'deslize', 1, '', h.phase]);
  }
  for (const c of Object.values(s.checkins).sort((a, b) => (a.day < b.day ? -1 : 1))) {
    rows.push([c.day, '', 'Check-in · humor', 'checkin', c.mood, '1 a 5', '']);
    rows.push([c.day, '', 'Check-in · energia', 'checkin', c.energy, '1 a 5', '']);
    if (c.screenMinutes != null) rows.push([c.day, '', 'Tempo de tela', 'checkin', c.screenMinutes, 'min', '']);
    if (c.youtubeMinutes != null) rows.push([c.day, '', 'YouTube', 'checkin', c.youtubeMinutes, 'min', '']);
    c.good.forEach((g, i) => rows.push([c.day, '', `Coisa boa ${i + 1}`, 'checkin', g, '', '']));
  }
  for (const m of Object.values(s.measurements).sort((a, b) => (a.day < b.day ? -1 : 1))) {
    rows.push([m.day, '', m.kind === 'weight' ? 'Peso' : 'Cintura', 'medida', formatNumber(m.value, 1), m.unit, '']);
  }
  const content = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\n');
  const filename = `prokope-${day}.csv`;
  return { filename, mime: 'text/csv', content, toFile: () => new File([content], filename, { type: 'text/csv' }) };
}

// ---------- apagar tudo ----------

/**
 * Apaga todos os dados, sem desfazer (a palavra "apagar" é a proteção): marca o perfil como apagando,
 * desfaz o A dois, apaga as coleções em lotes e o perfil, e limpa o localStorage (fica só a cópia do tema).
 * Depois disso a sessão pede o primeiro acesso. No modo exemplo, sai dele antes: apagar age sobre os dados da pessoa.
 */
export async function deleteAllData(onProgress?: (done: number, total: number) => void): Promise<void> {
  await leaveExample();
  const source = getSource();
  const profile = useDataStore.getState().profile;
  if (profile) await source.write([{ op: 'merge', col: 'profile', id: PROFILE_ID, data: { deleting: true } }]);
  if (profile?.linkId) {
    try {
      await source.together.unlink(profile.linkId);
    } catch {
      /* segue apagando */
    }
  }
  await source.deleteAll(onProgress);
  try {
    const keep = new Set<string>([...Object.values(PREFERENCE_KEYS), 'pk.session.mode']);
    for (const k of Object.keys(localStorage))
      if ((k.startsWith('pk') || k.startsWith('prokope')) && !keep.has(k)) localStorage.removeItem(k);
  } catch {
    /* sem armazenamento */
  }
}
