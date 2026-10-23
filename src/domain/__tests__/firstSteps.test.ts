// A entrada dos Primeiros passos na Jornada: o texto (só o que existe), a data do primeiro gesto e o lugar no caminho.
import { DEFAULT_CLOCK, instantAt } from '@/domain/day';
import { FIRST_STEPS_TITLE, firstStepsEntry, firstStepsIndex } from '@/domain/firstSteps';

const at = (day: string, time: string) => instantAt(day, time, DEFAULT_CLOCK);

describe('Primeiros passos na Jornada', () => {
  it('sem nenhum gesto, não há entrada (documentos antigos e campos que não são instantes)', () => {
    expect(firstStepsEntry(undefined)).toBeNull();
    expect(firstStepsEntry({})).toBeNull();
    expect(firstStepsEntry({ markAt: 0, rating: 4 })).toBeNull();
    expect(firstStepsEntry({ markAt: 'ontem' as unknown as number })).toBeNull();
  });

  it('o texto diz só o que existe, na ordem das linhas', () => {
    expect(FIRST_STEPS_TITLE).toBe('Primeiros passos com o Zeno');
    const t = at('2026-10-22', '07:45');
    expect(firstStepsEntry({ markAt: t })?.text).toBe('a primeira marcação');
    expect(firstStepsEntry({ markAt: t, rateAt: t + 60_000, rating: 4 })?.text).toBe(
      'a primeira marcação e a primeira nota',
    );
    expect(firstStepsEntry({ rateAt: t, addAt: t + 1, markAt: t + 2, rating: 5 })?.text).toBe(
      'a primeira marcação, o primeiro registro e a primeira nota',
    );
    expect(firstStepsEntry({ addAt: t })?.kinds).toEqual(['add']);
  });

  it('a data é a do primeiro gesto, no dia lógico (antes das 4h conta no dia anterior)', () => {
    const e = firstStepsEntry({ markAt: at('2026-10-23', '21:10'), addAt: at('2026-10-22', '20:40') });
    expect(e?.at).toBe(at('2026-10-22', '20:40'));
    expect(e?.day).toBe('2026-10-22');
    // 1h30 da madrugada de sexta ainda é a quinta
    const lateNight = Date.UTC(2026, 9, 23, 4, 30); // 23 out, 1h30 em São Paulo
    expect(firstStepsEntry({ markAt: lateNight })?.day).toBe('2026-10-22');
  });

  it('no caminho: antes da primeira fase que não tinha começado no dia (numa conta nova, o começo)', () => {
    // conta nova: a fase 1 começa hoje (ou amanhã, depois das 20h)
    expect(firstStepsIndex([{ start: '2026-10-22' }, { start: '2026-11-12' }], '2026-10-22')).toBe(0);
    expect(firstStepsIndex([{ start: '2026-10-23' }], '2026-10-22')).toBe(0);
    // a demonstração: fase 1 concluída, fase 2 em curso desde 15 out, 3 e 4 previstas
    const story = [{ start: '2026-09-21' }, { start: '2026-10-15' }, { start: '2026-11-05' }, { start: null }];
    expect(firstStepsIndex(story, '2026-10-22')).toBe(2);
    // a fase que começou antes do dia, sem nenhuma depois: o fim do caminho
    expect(firstStepsIndex([{ start: '2026-09-21' }], '2026-10-22')).toBe(1);
    expect(firstStepsIndex([], '2026-10-22')).toBe(0);
  });
});
