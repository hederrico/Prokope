// Ajudantes do primeiro acesso: contagem dos hábitos, linhas da rotina, telas acompanhando o deitar e a troca de modo.
import { describe, expect, it } from 'vitest';
import { defaultPlanDraft, toggleChip } from '@/data';
import {
  collectionHabit,
  countChosen,
  formatSpan,
  routineRows,
  sleepSpan,
  withMode,
  withPillar,
  withTime,
} from './plan';

describe('primeiro acesso', () => {
  it('o plano base começa com 7 hábitos (medições e opcionais desligados)', () => {
    const d = defaultPlanDraft('template');
    expect(countChosen(d)).toBe(7);
    // medição ligada não muda a conta
    expect(countChosen(toggleChip(d, 'weight', true))).toBe(7);
    expect(countChosen(toggleChip(d, 'shorts', true))).toBe(8);
  });

  it('a caminhada conta pelo pilar extra quando o principal sai do plano', () => {
    const d = defaultPlanDraft('template');
    const noFamily = { ...d, pillars: d.pillars.map((p) => (p.key === 'familia' ? { ...p, enabled: false } : p)) };
    // louça e lixo saem; a caminhada fica em Corpo
    expect(countChosen(noFamily)).toBe(5);
  });

  it('as linhas da rotina seguem os hábitos escolhidos, na ordem do quadro', () => {
    const d = defaultPlanDraft('template');
    const rows = routineRows(d);
    expect(rows.map((r) => r.title)).toEqual(['Acordar', 'Tarefas da casa', 'Check-in', 'Telas desligadas', 'Deitar']);
    expect(rows.map((r) => r.subtitle)).toEqual([
      'até 15 min de diferença conta',
      'louça e lixo',
      'humor, energia e 3 coisas boas',
      '1h antes de deitar',
      '8h50 até acordar',
    ]);
    expect(collectionHabit(d)?.habit.short).toBe('lixo');
    // sem o check-in, a linha some
    expect(routineRows(toggleChip(d, 'checkin', false)).map((r) => r.key)).not.toContain('checkin');
  });

  it('telas desligadas acompanham o deitar até a pessoa mudar as telas', () => {
    let d = withTime(defaultPlanDraft('template'), 'bed', '22:30');
    expect(d.schedule.screensOff).toBe('21:30');
    d = withTime(d, 'screensOff', '21:00');
    expect(d.screensFollowBed).toBe(false);
    d = withTime(d, 'bed', '23:00');
    expect(d.schedule.screensOff).toBe('21:00');
    expect(routineRows(d).find((r) => r.key === 'screensOff')?.subtitle).toBe('às 21h');
    // deitar à meia-noite: as telas às 23h
    expect(withTime(defaultPlanDraft('template'), 'bed', '00:15').schedule.screensOff).toBe('23:15');
  });

  it('a duração até acordar atravessa a meia-noite', () => {
    expect(formatSpan(sleepSpan('22:00', '06:50'))).toBe('8h50');
    expect(formatSpan(sleepSpan('00:30', '07:00'))).toBe('6h30');
    expect(formatSpan(sleepSpan('23:00', '07:00'))).toBe('8h');
  });

  it('trocar de modo guarda os horários e os pilares criados', () => {
    let d = withTime(defaultPlanDraft('template'), 'wake', '07:10');
    d = withPillar(d, { key: 'novo-1', name: 'Finanças', color: 'mel', icon: 'wallet', enabled: true });
    const zero = withMode(d, 'empty');
    expect(zero.pillars.map((p) => p.name)).toEqual(['Finanças']);
    expect(zero.schedule.wake).toBe('07:10');
    expect(countChosen(zero)).toBe(0);
    const back = withMode(zero, 'template');
    expect(back.pillars.map((p) => p.name)).toEqual(['Mente', 'Alimentação', 'Corpo', 'Família', 'Finanças']);
  });
});
