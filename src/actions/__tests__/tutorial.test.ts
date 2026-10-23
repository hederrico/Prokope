// @vitest-environment node
// As ações do tutorial (actions/tutorial.ts): gravam por mescla em profile.tutorial, uma vez só cada, sem apagar
// o que já estava lá (outro aparelho, os Primeiros passos).
import { LocalSource } from '@/data/localSource';
import { seedDemo } from '@/data/seed';
import { connectSource, disconnectSource, useDataStore, whenReady } from '@/stores/data';
import { setFixedNow } from '@/stores/clock';
import { instantAt, DEFAULT_CLOCK } from '@/domain/day';
import { tutorialOf } from '@/domain/tutorial';
import { PROFILE_ID } from '@/data/source';
import { markChapterDone, markIntro, markOffered } from '@/actions';

const THU = '2026-10-22';
let uid = 0;

async function openStory(time = '12:41') {
  const now = instantAt(THU, time, DEFAULT_CLOCK);
  setFixedNow(now);
  const source = await LocalSource.open(`tutorial-${++uid}`);
  await seedDemo(source, now);
  connectSource(source);
  await whenReady();
  return { source, now };
}

const tutorial = () => tutorialOf(useDataStore.getState().profile);

afterEach(() => {
  disconnectSource();
  setFixedNow(null);
});

describe('ações do tutorial', () => {
  it('a demonstração começa sem o tutorial no perfil (documento antigo)', async () => {
    await openStory();
    expect(useDataStore.getState().profile?.tutorial).toBeUndefined();
    expect(tutorial()).toEqual({ introAt: 0, done: {}, offered: {}, firstSteps: {} });
  });

  it('markIntro grava a apresentação uma vez só, e o desfazer volta', async () => {
    const { now } = await openStory();
    const undo = await markIntro();
    expect(tutorial().introAt).toBe(now);
    setFixedNow(now + 60_000);
    await markIntro();
    expect(tutorial().introAt).toBe(now);
    await undo();
    expect(tutorial().introAt).toBe(0);
  });

  it('markChapterDone guarda a primeira vez de cada capítulo, por mescla', async () => {
    const { now } = await openStory();
    await markIntro();
    await markChapterDone('hoje');
    setFixedNow(now + 60_000);
    await markChapterDone('progresso');
    // rever não muda a data da primeira vez
    setFixedNow(now + 120_000);
    await markChapterDone('hoje');
    expect(tutorial().done).toEqual({ hoje: now, progresso: now + 60_000 });
    expect(tutorial().introAt).toBe(now);
  });

  it('markOffered grava a oferta uma vez, sem mexer nos vistos nem nos Primeiros passos', async () => {
    const { source, now } = await openStory();
    // o que outro aparelho (ou os Primeiros passos) já gravou fica
    await source.write([
      {
        op: 'merge',
        col: 'profile',
        id: PROFILE_ID,
        data: { tutorial: { firstSteps: { markAt: 5 }, done: { hoje: 7 } } },
      },
    ]);
    await markOffered('jornada');
    setFixedNow(now + 60_000);
    await markOffered('jornada');
    await markOffered('ajustes');
    expect(tutorial()).toMatchObject({
      offered: { jornada: now, ajustes: now + 60_000 },
      done: { hoje: 7 },
      firstSteps: { markAt: 5 },
    });
    // o resto do perfil continua igual
    expect(useDataStore.getState().profile?.planSetupAt).toBeTruthy();
  });

  it('sem perfil, não grava nada', async () => {
    await openStory();
    useDataStore.setState({ profile: null });
    const undo = await markIntro();
    await undo();
    expect(useDataStore.getState().profile).toBeNull();
  });
});
