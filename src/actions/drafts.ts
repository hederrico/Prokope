// Na virada do dia (4h), um rascunho de check-in com humor e energia vira check-in salvo; sem os dois, é descartado.
// No modo exemplo, nada vira check-in: os rascunhos da pessoa esperam a volta, e os do exemplo somem com ele.
import { useClockStore } from '@/stores/clock';
import { useDataStore } from '@/stores/data';
import { useDrafts } from '@/stores/drafts';
import { saveCheckin } from './records';

async function flush() {
  const today = useClockStore.getState().today;
  const { source, status, checkins, example } = useDataStore.getState();
  if (!source || status !== 'ready' || example) return;
  const drafts = useDrafts.getState();
  for (const d of Object.values(drafts.checkins)) {
    if (useDataStore.getState().source !== source) return;
    if (d.day >= today) continue;
    if (d.mood && d.energy && !checkins[d.day]) {
      try {
        await saveCheckin(d.day, {
          mood: d.mood,
          energy: d.energy,
          good: d.good,
          screenMinutes: d.screenMinutes,
          youtubeMinutes: d.youtubeMinutes,
        });
      } catch {
        continue;
      }
    }
    drafts.clearCheckinDraft(d.day);
  }
}

/** Liga a conferência dos rascunhos (chamado pelo DataProvider). */
export function startDraftWatcher(): () => void {
  const u1 = useClockStore.subscribe((s, prev) => {
    if (s.today !== prev.today) void flush();
  });
  const u2 = useDataStore.subscribe((s, prev) => {
    if (s.status === 'ready' && prev.status !== 'ready') void flush();
    // de volta do exemplo: depois que os rascunhos da pessoa voltarem (na mesma atualização, logo em seguida)
    else if (prev.example && !s.example) queueMicrotask(() => void flush());
  });
  void flush();
  return () => {
    u1();
    u2();
  };
}
