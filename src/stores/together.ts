// A dois: a ligação, os convites desta pessoa e os carinhos (fora de users/{uid}).
// Os ouvintes abrem quando há fonte ativa e acompanham profile.linkId.
import { create } from 'zustand';
import type { Hug, Invite, Link } from '@/types';
import type { Unsubscribe } from '@/data/source';
import { useDataStore } from './data';

export interface TogetherState {
  link: Link | null;
  invites: Invite[];
  hugs: Hug[];
}

export const useTogetherStore = create<TogetherState>(() => ({ link: null, invites: [], hugs: [] }));

let unsubs: Unsubscribe[] = [];
let linkUnsubs: Unsubscribe[] = [];
let currentLinkId: string | null = null;
let currentSource: unknown = null;

function stopLink() {
  for (const u of linkUnsubs) u();
  linkUnsubs = [];
  currentLinkId = null;
  useTogetherStore.setState({ link: null, hugs: [] });
}

function sync() {
  const state = useDataStore.getState();
  // modo exemplo: o A dois não liga com a cópia (nem mostra o par da pessoa); volta junto com os dados dela
  const source = state.example ? null : state.source;
  const profile = state.example ? null : state.profile;
  if (source !== currentSource) {
    for (const u of unsubs) u();
    unsubs = [];
    stopLink();
    currentSource = source;
    useTogetherStore.setState({ invites: [] });
    if (source) {
      try {
        unsubs.push(source.together.listenMyInvites((invites) => useTogetherStore.setState({ invites })));
        // quem convidou descobre a ligação e grava o linkId no próprio perfil
        unsubs.push(
          source.together.listenMyLinks((ids) => {
            const p = useDataStore.getState().profile;
            if (p && !p.linkId && ids.length) {
              void source.write([{ op: 'merge', col: 'profile', id: 'profile', data: { linkId: ids[0] } }]);
            }
          }),
        );
      } catch {
        /* sem A dois nesta fonte */
      }
    }
  }
  const linkId = profile?.linkId ?? null;
  if (!source || linkId === currentLinkId) return;
  stopLink();
  if (!linkId) return;
  currentLinkId = linkId;
  linkUnsubs.push(source.together.listenLink(linkId, (link) => useTogetherStore.setState({ link })));
  linkUnsubs.push(source.together.listenHugs(linkId, (hugs) => useTogetherStore.setState({ hugs })));
}

let started = false;

/** Liga os ouvintes do A dois (chamado pelo DataProvider). */
export function startTogether(): () => void {
  if (started) return () => undefined;
  started = true;
  sync();
  const unsub = useDataStore.subscribe((s, prev) => {
    if (s.source !== prev.source || s.example !== prev.example || s.profile?.linkId !== prev.profile?.linkId) sync();
  });
  return () => {
    unsub();
    for (const u of unsubs) u();
    unsubs = [];
    stopLink();
    currentSource = null;
    started = false;
  };
}
