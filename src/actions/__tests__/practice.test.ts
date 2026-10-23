// @vitest-environment node
// Os Primeiros passos gravam no perfil só a primeira vez de cada gesto (por mescla) e nunca escrevem em marks ou
// entries: o dia, a semana e os padrões não mudam.
import { LocalSource } from '@/data/localSource';
import { seedDemo } from '@/data/seed';
import type { WriteOp } from '@/data/source';
import { connectSource, disconnectSource, useDataStore, whenReady } from '@/stores/data';
import { setFixedNow } from '@/stores/clock';
import { DEFAULT_CLOCK, instantAt } from '@/domain/day';
import { tutorialOf } from '@/domain/tutorial';
import { firstStepsEntry } from '@/domain/firstSteps';
import { todayLayout } from '@/domain/today';
import { getDomainData } from '@/data/useDomain';
import { practiceAdd, practiceMark, practiceRate } from '@/actions';
import { commit, profileMerge } from '@/actions/core';

const THU = '2026-10-22';
let uid = 0;

async function openStory(time = '07:42') {
  const now = instantAt(THU, time, DEFAULT_CLOCK);
  setFixedNow(now);
  const source = await LocalSource.open(`pp${++uid}`);
  await seedDemo(source, now);
  connectSource(source);
  await whenReady();
  return { source, now };
}

const steps = () => tutorialOf(useDataStore.getState().profile).firstSteps;

afterEach(() => {
  disconnectSource();
  setFixedNow(null);
});

describe('Primeiros passos', () => {
  it('cada gesto grava o instante só na primeira vez', async () => {
    const { now } = await openStory();
    expect(steps()).toEqual({});

    await practiceMark();
    expect(steps()).toEqual({ markAt: now });

    // mais tarde, outra marcação de treino (rever o capítulo): nada muda
    setFixedNow(now + 5 * 60_000);
    const again = await practiceMark();
    expect(steps()).toEqual({ markAt: now });
    await again();
    expect(steps()).toEqual({ markAt: now });

    await practiceAdd();
    await practiceAdd();
    await practiceRate(4);
    await practiceRate(1);
    expect(steps()).toEqual({ markAt: now, addAt: now + 5 * 60_000, rateAt: now + 5 * 60_000, rating: 4 });
  });

  it('grava por mescla: o resto do tutorial e do perfil continua', async () => {
    const { now } = await openStory();
    await commit([profileMerge({ tutorial: { introAt: now - 1000, done: { hoje: now - 500 } } })]);
    const before = useDataStore.getState().profile!;
    await practiceRate(5);
    const after = useDataStore.getState().profile!;
    expect(after.tutorial).toEqual({
      introAt: now - 1000,
      done: { hoje: now - 500 },
      firstSteps: { rateAt: now, rating: 5 },
    });
    expect(after.name).toBe(before.name);
    expect(after.schedule).toEqual(before.schedule);
  });

  it('nada vai para marks nem entries, e o dia conta igual', async () => {
    const { source } = await openStory();
    const ops: WriteOp[] = [];
    const write = source.write.bind(source);
    source.write = async (batch) => {
      ops.push(...batch);
      return write(batch);
    };
    const s = useDataStore.getState();
    const marks = Object.keys(s.marks).length;
    const entries = Object.keys(s.entries).length;
    const layout = (d = getDomainData()) => todayLayout(d, THU, THU, 462);
    const count = (l: ReturnType<typeof layout>) =>
      l.groups
        .flatMap((g) => g.items)
        .filter((i) => i.counts)
        .map((i) => `${i.habit.id}:${i.state}`);
    const before = count(layout());

    await practiceMark();
    await practiceAdd();
    await practiceRate(3);

    expect(ops.length).toBeGreaterThan(0);
    expect(ops.every((o) => o.col === 'profile')).toBe(true);
    const t = useDataStore.getState();
    expect(Object.keys(t.marks).length).toBe(marks);
    expect(Object.keys(t.entries).length).toBe(entries);
    expect(count(layout())).toEqual(before);
  });

  it('a entrada da Jornada aparece com o primeiro gesto', async () => {
    const { now } = await openStory('21:10');
    expect(firstStepsEntry(steps())).toBeNull();
    await practiceAdd();
    const e = firstStepsEntry(steps());
    expect(e).toMatchObject({ at: now, day: THU, text: 'o primeiro registro' });
  });

  it('sem perfil, não grava', async () => {
    useDataStore.setState({ profile: null });
    const undo = await practiceMark();
    await undo();
    expect(useDataStore.getState().profile).toBeNull();
  });
});
