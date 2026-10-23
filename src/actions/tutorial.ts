// O tutorial com o Zeno no perfil (docs/interacao/telas/tutorial.md): a apresentação, os capítulos vistos e os
// oferecidos. Cada uma grava uma vez só (a primeira vez vale), por mescla em profile.tutorial, campo a campo, para um
// aparelho não apagar o que o outro gravou. Sem perfil ainda (o primeiro login antes de o perfil chegar), não grava.
import { tutorialOf } from '@/domain/tutorial';
import { useDataStore } from '@/stores/data';
import type { TutorialChapter } from '@/types';
import { commit, noUndo, now, profileMerge, type Undo } from './core';

function tutorialNow() {
  const profile = useDataStore.getState().profile;
  return profile ? tutorialOf(profile) : null;
}

/** O Zeno se apresentou (passo 1 do Começar, ou a oferta às contas que já existiam). */
export async function markIntro(): Promise<Undo> {
  const t = tutorialNow();
  if (!t || t.introAt) return noUndo();
  return commit([profileMerge({ tutorial: { introAt: now() } })]);
}

/** O capítulo foi visto até o fim (fica a data da primeira vez; rever não muda nada). */
export async function markChapterDone(chapter: TutorialChapter): Promise<Undo> {
  const t = tutorialNow();
  if (!t || t.done[chapter]) return noUndo();
  return commit([profileMerge({ tutorial: { done: { [chapter]: now() } } })]);
}

/** O Zeno ofereceu o capítulo ao abrir a aba (com "Mostrar" ou "Agora não"): ele não oferece de novo. */
export async function markOffered(chapter: TutorialChapter): Promise<Undo> {
  const t = tutorialNow();
  if (!t || t.offered[chapter]) return noUndo();
  return commit([profileMerge({ tutorial: { offered: { [chapter]: now() } } })]);
}
