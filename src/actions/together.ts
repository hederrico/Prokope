// A dois, sem servidor: o convite é um link para compartilhar (/convite/:id), a ligação é criada por quem aceita,
// e o que cada pessoa mostra é copiado para links/{id}/share/{uid}. A única interação é mandar um carinho.
import type { DayKey, Invite, Link, LinkShare } from '@/types';
import { getSource, useDataStore } from '@/stores/data';
import { useTogetherStore } from '@/stores/together';
import { noUndo, today, type Undo } from './core';

/** Endereço do convite para a folha de compartilhar. */
export function inviteUrl(id: string): string {
  const origin = typeof location !== 'undefined' ? location.origin : '';
  return `${origin}/convite/${id}`;
}

/** Cria o convite (vale 7 dias). O desfazer cancela. */
export async function createInvite(): Promise<Undo & { invite?: Invite; url?: string }> {
  const source = getSource();
  const name = useDataStore.getState().profile?.name || 'Alguém';
  const invite = await source.together.createInvite(name);
  const undo: Undo & { invite?: Invite; url?: string } = async () => {
    await source.together.cancelInvite(invite.id);
  };
  undo.id = invite.id;
  undo.invite = invite;
  undo.url = inviteUrl(invite.id);
  return undo;
}

export async function getInvite(id: string): Promise<Invite | null> {
  return getSource().together.getInvite(id);
}

/** Cancela o convite. O desfazer reabre (no Firebase, cria um convite novo). */
export async function cancelInvite(id: string): Promise<Undo> {
  const source = getSource();
  await source.together.cancelInvite(id);
  const undo: Undo = async () => {
    try {
      await source.together.reopenInvite(id);
    } catch {
      await source.together.createInvite(useDataStore.getState().profile?.name || 'Alguém');
    }
  };
  return undo;
}

export async function declineInvite(id: string): Promise<Undo> {
  const source = getSource();
  await source.together.declineInvite(id);
  return async () => {
    try {
      await source.together.reopenInvite(id);
    } catch {
      /* recusar não avisa ninguém; o convite segue até vencer para quem convidou */
    }
  };
}

/** "Agora não" na folha do convite: guarda só que foi visto. */
export async function markInviteSeen(id: string): Promise<void> {
  await getSource().together.markInviteSeen(id);
}

/** Aceita o convite e cria a ligação. O desfazer desfaz a ligação. */
export async function acceptInvite(id: string): Promise<Undo & { link?: Link }> {
  const source = getSource();
  const name = useDataStore.getState().profile?.name || 'Alguém';
  const link = await source.together.acceptInvite(id, name);
  const undo: Undo & { link?: Link } = async () => {
    await source.together.unlink(link.id);
  };
  undo.link = link;
  undo.id = link.id;
  return undo;
}

/** Desfaz a ligação (sem confirmar). O desfazer liga de novo quando a fonte permite. */
export async function unlink(): Promise<Undo> {
  const source = getSource();
  const linkId = useDataStore.getState().profile?.linkId;
  if (!linkId) return noUndo();
  const link = useTogetherStore.getState().link;
  await source.together.unlink(linkId);
  return async () => {
    if (!link) return;
    try {
      await source.together.relink(link);
    } catch {
      /* no Firebase, uma ligação desfeita só volta com um convite novo */
    }
  };
}

/** O que esta pessoa mostra: "como estou hoje" (humor). */
export async function setSharing(share: Partial<Pick<LinkShare, 'mood'>>): Promise<Undo> {
  const source = getSource();
  const linkId = useDataStore.getState().profile?.linkId;
  if (!linkId) return noUndo();
  const prev = useTogetherStore.getState().link?.share?.[source.uid];
  const patch: Partial<LinkShare> = { ...share };
  if (share.mood) {
    const day = today();
    const c = useDataStore.getState().checkins[day];
    patch.moodToday = c ? { day, mood: c.mood } : null;
  } else if (share.mood === false) {
    patch.moodToday = null;
  }
  await source.together.setShare(linkId, patch);
  return async () => {
    await source.together.setShare(linkId, { mood: prev?.mood ?? false, moodToday: prev?.moodToday ?? null });
  };
}

/** Liga ou desliga um hábito compartilhado (vira a dois quando as duas pessoas ligam). */
export async function setSharedHabit(habitId: string, on: boolean): Promise<Undo> {
  const source = getSource();
  const linkId = useDataStore.getState().profile?.linkId;
  if (!linkId) return noUndo();
  const prev = useTogetherStore.getState().link?.share?.[source.uid]?.habits ?? [];
  const next = on ? [...new Set([...prev, habitId])] : prev.filter((h) => h !== habitId);
  await source.together.setShare(linkId, { habits: next });
  return async () => {
    await source.together.setShare(linkId, { habits: prev });
  };
}

const HUG_LIMIT_MS = 60_000;
let lastHugAt = 0;

/** Manda um carinho (no máximo um por minuto). O desfazer apaga o carinho. */
export async function sendHug(): Promise<Undo> {
  const source = getSource();
  const linkId = useDataStore.getState().profile?.linkId;
  const link = useTogetherStore.getState().link;
  if (!linkId || !link) return noUndo();
  const t = Date.now();
  if (t - lastHugAt < HUG_LIMIT_MS) return noUndo();
  lastHugAt = t;
  const to = link.members.find((m) => m !== source.uid) ?? source.uid;
  const hug = await source.together.sendHug(linkId, to, today());
  return async () => {
    await source.together.deleteHug(linkId, hug.id);
  };
}

/** Copia o humor do dia para a ligação quando a pessoa escolheu mostrar (chamado pelo saveCheckin). */
export async function shareMoodIfLinked(day: DayKey, mood: number): Promise<void> {
  try {
    const { source, profile } = useDataStore.getState();
    const linkId = profile?.linkId;
    if (!source || !linkId) return;
    const mine = useTogetherStore.getState().link?.share?.[source.uid];
    if (!mine?.mood) return;
    await source.together.setShare(linkId, { moodToday: { day, mood } });
  } catch {
    /* compartilhar é um extra: nunca atrapalha o check-in */
  }
}
