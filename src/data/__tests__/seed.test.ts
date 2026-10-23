// @vitest-environment node
// A semente da demonstração precisa bater com o quadro (docs/telas/SPEC.md, "A história").
import { daysSince } from '@/domain/daysSince';
import { logicalMinutesOf } from '@/domain/day';
import { correlation } from '@/domain/correlation';
import { dayCount, habitStrength, habitTotals, pillarConstancies, weekConstancy, weekProgress } from '@/domain/stats';
import { counterView, journeyView, progressView, todayView } from '@/domain/views';
import { weightTrend } from '@/domain/weight';
import { buildDomainData } from '@/domain/context';
import { instantAt, DEFAULT_CLOCK } from '@/domain/day';
import { phaseTimeline } from '@/domain/phases';
import { buildDemoOps } from '@/data/seed';
import { opsToRaw, storyAt, testId } from './helpers';

const THU = '2026-10-22';

function byName(data: ReturnType<typeof storyAt>['data'], name: string) {
  const h = data.habits.find((x) => x.name === name);
  if (!h) throw new Error(`sem ${name}`);
  return h;
}

describe('a história, na quinta', () => {
  it('"x de 12 feitos hoje" ao longo do dia', () => {
    const at = (t: string) => {
      const { data } = storyAt(THU, t);
      const c = dayCount(data, THU, THU);
      return `${c.done} de ${c.total}`;
    };
    expect(at('07:42')).toBe('3 de 12');
    expect(at('12:41')).toBe('4 de 12');
    expect(at('15:20')).toBe('5 de 12');
    expect(at('20:34')).toBe('8 de 12');
    expect(at('21:04')).toBe('11 de 12');
  });

  it('caminhada: 2 de 7 de manhã, 3 de 7 depois do passeio, 24 dias com e 8 sem, força 72%', () => {
    const morning = storyAt(THU, '07:42').data;
    const walkM = byName(morning, 'Caminhada com o cachorro');
    expect(weekProgress(walkM, THU, morning, THU).done).toBe(2);
    const { data } = storyAt(THU, '12:41');
    const walk = byName(data, 'Caminhada com o cachorro');
    const wp = weekProgress(walk, THU, data, THU);
    expect([wp.done, wp.target]).toEqual([3, 6]);
    expect(habitTotals(walk, THU, data, THU)).toMatchObject({ withDays: 24, withoutDays: 8 });
    expect(Math.round(habitStrength(walk, THU, data, THU).value! * 100)).toBe(72);
    // o pilar principal é Família, e conta também em Corpo
    expect(data.pillarById.get(walk.pillarId)?.name).toBe('Família');
    expect(walk.alsoIn.map((p) => data.pillarById.get(p)?.name)).toEqual(['Corpo']);
  });

  it('refrigerante: 12 dias sem, recorde 21, total 33 (32 com um deslize hoje)', () => {
    const { data } = storyAt(THU, '12:41');
    const ds = daysSince(byName(data, 'Zero refrigerante'), data, THU);
    expect([ds.current, ds.record, ds.total]).toEqual([12, 21, 33]);
    expect(ds.ifSlipToday).toEqual({ current: 0, record: 21, total: 32 });
    expect(ds.periods.map((p) => p.days)).toEqual([12, 21]);
    expect(ds.periods[0].start).toBe('2026-10-11');
    const shorts = daysSince(byName(data, 'Sem Shorts e TikTok'), data, THU);
    expect([shorts.current, shorts.record]).toEqual([32, 32]);
  });

  it('constância da semana em 76% e os pilares na ordem do quadro', () => {
    const { data } = storyAt(THU, '12:41');
    expect(Math.round(weekConstancy(data, THU, THU).ratio! * 100)).toBe(76);
    const pcs = pillarConstancies(data, '2026-10-19', '2026-10-25', THU).map((p) => [
      data.pillarById.get(p.pillarId)!.name,
      Math.round(p.ratio! * 100),
    ]);
    expect(pcs.map((p) => p[0])).toEqual(['Família', 'Mente', 'Corpo', 'Alimentação']);
    expect(pcs[0][1]).toBe(88);
    expect(pcs[1][1]).toBe(82);
  });

  it('Progresso às 18h15: 76% no total, Família 88%, Mente 82%; Corpo e Alimentação pela fórmula', () => {
    const { data } = storyAt(THU, '18:15');
    expect(Math.round(weekConstancy(data, THU, THU).ratio! * 100)).toBe(76);
    const pcs = Object.fromEntries(
      pillarConstancies(data, '2026-10-19', '2026-10-25', THU).map((p) => [
        data.pillarById.get(p.pillarId)!.name,
        Math.round(p.ratio! * 100),
      ]),
    );
    // O quadro diz Corpo 71% e Alimentação 64%, números que a fórmula não alcança na quinta: o Corpo tem só a
    // caminhada (3 de 4 dias; 71% pede 5 de 7, a semana inteira) e o futebol, que fica para as 18h50; a
    // Alimentação tem 17 dias que contam (5 hábitos × 3 dias fechados + 2 de hoje), e 11 de 17 dá 65%.
    expect(pcs).toEqual({ Família: 88, Mente: 82, Corpo: 75, Alimentação: 65 });
    // água como no quadro: 3 L, 2,5 L e 3,2 L (3 L ou mais em 2 dos 3 dias fechados)
    const water = data.habits.find((h) => h.role === 'water')!;
    const byDay = ['2026-10-19', '2026-10-20', '2026-10-21'].map((d) =>
      (data.entriesByHabit.get(water.id) ?? []).filter((e) => e.day === d).reduce((n, e) => n + e.amount, 0),
    );
    expect(byDay).toEqual([3000, 2500, 3200]);
  });

  it('peso perto de 84 kg, descendo 1,1 kg em 3 semanas; cintura semanal', () => {
    const { data } = storyAt(THU, '12:41');
    const t = weightTrend(data.measurementsByKind.weight, THU);
    expect(t.title).toBe('Tendência −1,1 kg em 3 semanas');
    expect(t.last?.value).toBe(83.6);
    expect(data.measurementById.get('2026-10-21_weight')?.value).toBe(83.3);
    for (const p of t.points) expect(Math.abs(p.value - 84)).toBeLessThan(1.6);
    expect(data.measurementsByKind.waist.map((m) => m.value)).toEqual([96, 95.5, 95, 94.8]);
  });

  it('check-ins com humor e energia; caminhada e humor 4,1 contra 3,4', () => {
    const { data } = storyAt(THU, '12:41');
    // 31 dias passados, menos 3 e 17 out (sem check-in, como no Humor do quadro)
    expect(data.checkins.size).toBe(29);
    for (const c of data.checkins.values()) {
      expect(c.mood).toBeGreaterThanOrEqual(1);
      expect(c.energy).toBeGreaterThanOrEqual(1);
    }
    const cor = correlation(byName(data, 'Caminhada com o cachorro'), data, THU);
    expect(cor.ready).toBe(true);
    expect(cor.withAvg!.toFixed(1)).toBe('4.1');
    expect(cor.withoutAvg!.toFixed(1)).toBe('3.4');
    const night = storyAt(THU, '20:40').data;
    expect(night.checkins.get(THU)).toMatchObject({ mood: 4, energy: 3, screenMinutes: 108, youtubeMinutes: 35 });
  });

  it('os registros de hoje seguem a hora: proteína e água', () => {
    const protein = (t: string) => {
      const { data, now } = storyAt(THU, t);
      const h = data.habits.find((x) => x.role === 'protein')!;
      return counterView(data, h.id, THU, THU, logicalMinutesOf(now, data.clock))!;
    };
    expect(protein('07:05').total).toBe(0);
    const early = protein('07:42');
    expect(early.total).toBe(24);
    // o leite (7h11) depois dos ovos (7h10): o mais recente fica em cima, como no quadro
    expect(early.lines.map((l) => `${l.item} × ${l.count}`)).toEqual(['Leite × 1', 'Ovo × 3']);
    expect(protein('12:41').total).toBe(46);
    expect(protein('21:00').total).toBe(86);
    const water = (t: string) => {
      const { data, now } = storyAt(THU, t);
      const h = data.habits.find((x) => x.role === 'water')!;
      return counterView(data, h.id, THU, THU, logicalMinutesOf(now, data.clock))!.total;
    };
    expect(water('08:00')).toBe(0);
    expect(water('08:05')).toBe(500);
    expect(water('15:20')).toBe(1500);
    expect(water('20:34')).toBe(2500);
  });

  it('o Hoje: manhã, noite e dia fechado', () => {
    const view = (t: string) => {
      const { data, now } = storyAt(THU, t);
      return { v: todayView(data, THU, now, logicalMinutesOf(now, data.clock)), data };
    };
    const { v: m, data: md } = view('07:42');
    expect(m.greeting).toBe('Bom dia');
    expect(m.name).toBe('Henrique');
    expect(m.dateLabel).toBe('Quinta, 22 de outubro');
    expect(m.phase).toMatchObject({ number: 2, name: 'Alimentação', weekIndex: 2, weeks: 3 });
    expect(m.layout.groups.map((g) => [g.title, g.folded])).toEqual([
      ['Manhã', false],
      ['Ao longo do dia', false],
      ['Noite', true],
    ]);
    expect(m.layout.groups[2].items).toHaveLength(6);
    expect(md.habitById.get(m.nudge!.habitId)?.name).toBe('Caminhada com o cachorro');
    // os limites com mais folga primeiro, como no quadro
    expect(m.layout.limits.map((i) => `${i.habit.name} ${i.budget!.used} de ${i.budget!.limit}`)).toEqual([
      'Refeições livres 0 de 2',
      'Tranqueiras 1 de 2',
    ]);
    // a manhã: o peso, o acordar e a caminhada (quadro: "peso, acordar e caminhada")
    expect(m.layout.groups[0].items.map((i) => i.habit.name)).toEqual(['Peso', 'Acordar', 'Caminhada com o cachorro']);
    const quick = Object.values(m.quickAdds).find((q) => q.some((x) => x.name === 'Ovo'))!;
    expect(quick.map((q) => q.name)).toEqual(['Ovo', 'Leite', 'Whey']);

    const { v: n } = view('20:34');
    expect(n.layout.mode).toBe('night');
    expect(n.layout.stillToday.map((i) => i.habit.name)).toEqual([
      'Check-in do dia',
      'Lixo e recicláveis',
      'Telas desligadas',
      'Deitar',
    ]);
    expect(n.layout.doneToday).toHaveLength(8);

    const { v: c } = view('21:04');
    expect(c.layout.mode).toBe('closed');
    expect(c.count).toEqual({ done: 11, total: 12 });
  });

  it('Jornada e Progresso', () => {
    const { data, now } = storyAt(THU, '12:41');
    const j = journeyView(data, now);
    expect(j.phases.map((p) => [p.number, p.status, p.start, p.end])).toEqual([
      [1, 'done', '2026-09-21', '2026-10-11'],
      [2, 'current', '2026-10-12', '2026-11-01'],
      [3, 'future', '2026-11-02', '2026-11-22'],
      [4, 'future', '2026-11-23', null],
    ]);
    expect(j.phases[0].constancy).toBe(0.81);
    expect(j.phases[1].weekBars.map((b) => (b.ratio === null ? null : Math.round(b.ratio * 100)))).toEqual([
      74,
      76,
      null,
    ]);
    expect(j.reviews.slice(0, 2).map((r) => `${r.label} · ${r.context} · ${Math.round(r.constancy! * 100)}%`)).toEqual([
      'domingo, 18 out · semana 1 da fase 2 · 74%',
      'domingo, 11 out · fim da fase 1 · 81%',
    ]);
    const p = progressView(data, 'week', 'overview', THU, THU);
    expect(p.range.label).toBe('19 – 25 de outubro');
    expect(Math.round(p.constancy! * 100)).toBe(76);
    const walkInsight = p.insights.find((i) => data.habitById.get(i.habitId)?.name.startsWith('Caminhada'));
    expect(walkInsight?.text).toBe('Nos dias com caminhada, seu humor médio foi 4,1. Nos outros, 3,4.');
  });

  it('funciona em qualquer dia da semana', () => {
    for (const day of ['2026-10-19', '2026-10-24', '2026-10-25', '2026-11-03']) {
      const { data, now } = storyAt(day, '19:00');
      const v = todayView(data, day, now, logicalMinutesOf(now, data.clock));
      expect(v.count.total).toBeGreaterThan(8);
      expect(v.phase?.number).toBe(2);
      expect(daysSince(byName(data, 'Zero refrigerante'), data, day).current).toBe(12);
    }
  });
});

describe('primeiro dia da fase 3 (segunda, 2 nov)', () => {
  it('a semana e a fase ficam sem número até algo ser feito (os dias sem sozinhos não dão 100%)', () => {
    const now = instantAt(THU, '21:00', DEFAULT_CLOCK);
    const raw = opsToRaw(buildDemoOps(now, testId)) as unknown as {
      phases: Record<string, Record<string, unknown>>;
      habits: Record<string, { phase: number; startDay: string | null }>;
    };
    const NOV2 = '2026-11-02';
    raw.phases['2'] = { ...raw.phases['2'], end: '2026-11-01', closedAt: now, closingConstancy: 0.8 };
    raw.phases['3'] = { ...raw.phases['3'], start: NOV2, end: '2026-11-22' };
    for (const h of Object.values(raw.habits)) if (h.phase === 3) h.startDay = NOV2;
    const data = buildDomainData(raw as unknown as Parameters<typeof buildDomainData>[0]);
    expect(weekConstancy(data, NOV2, NOV2).ratio).toBeNull();
    const phase3 = phaseTimeline(data, NOV2).find((p) => p.number === 3)!;
    expect(phase3.status).toBe('current');
    expect(phase3.constancy).toBeNull();
    expect(phase3.weekBars[0].ratio).toBeNull();
    // o dia conta os dias sem como feitos (2 de 12), como no Hoje
    expect(dayCount(data, NOV2, NOV2).done).toBe(2);
  });
});

describe('a história nos detalhes do quadro', () => {
  it('proteína às 12h58, o lixo depois do check-in, outubro no Humor e a fase 1 com 7 hábitos', () => {
    const at = (t: string) => storyAt(THU, t);
    const protein = (t: string) => {
      const { data, now } = at(t);
      const h = data.habits.find((x) => x.role === 'protein')!;
      return counterView(data, h.id, THU, THU, logicalMinutesOf(now, data.clock))!.total;
    };
    // o frango do almoço entra depois da nota (13h05)
    expect(protein('12:58')).toBe(46);
    // às 20h36, com o check-in feito, são 9 (o lixo sai depois)
    const n = at('20:36').data;
    expect(dayCount(n, THU, THU).done).toBe(9);

    const { data } = at('20:44');
    const oct = [...data.checkins.values()].filter((c) => c.day >= '2026-10-01');
    expect(oct).toHaveLength(20);
    const avg = (k: 'mood' | 'energy') => Math.round((oct.reduce((n, c) => n + c[k], 0) / oct.length) * 10) / 10;
    expect([avg('mood'), avg('energy')]).toEqual([3.8, 3.2]);
    // os 3 dias "muito bem" de outubro caem no fim de semana (4, 10 e 18)
    expect(oct.filter((c) => c.mood === 5).map((c) => c.day)).toEqual(['2026-10-04', '2026-10-10', '2026-10-18']);

    const walk = byName(data, 'Caminhada com o cachorro');
    const octWalks = [...data.marks.values()].filter((m) => m.habitId === walk.id && m.day >= '2026-10-01');
    expect(octWalks).toHaveLength(17);
    const wake = data.habits.find((h) => h.role === 'wake')!;
    expect(habitTotals(wake, THU, data, THU)).toMatchObject({ withDays: 20, withoutDays: 12 });

    // fase 1: os 7 hábitos da história (acordar e deitar contam como um; sem medições); Shorts e futebol já eram ativos
    const phases = phaseTimeline(data, THU);
    expect(phases[0].habits.map((h) => h.name).sort()).toEqual(
      ['Acordar', 'Caminhada com o cachorro', 'Check-in do dia', 'Lixo e recicláveis', 'Louça', 'Telas desligadas', 'Zero refrigerante'].sort(),
    );
    expect(byName(data, 'Futebol').phase).toBeNull();
    expect(byName(data, 'Sem Shorts e TikTok').phase).toBeNull();
    expect(phases.map((p) => p.phase.description)).toEqual([
      'Sono, telas, cachorro e a casa em dia',
      'Proteína, água e refeições',
      'Academia, corrida e menos tela',
      'Sono, silêncio e tempo a dois',
    ]);
  });
});
