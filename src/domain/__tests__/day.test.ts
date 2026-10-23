// @vitest-environment node
import {
  addDays,
  diffDays,
  instantAt,
  logicalDay,
  logicalMinutes,
  nextDayTurn,
  timeOf,
  weekDays,
  weekStart,
  weekdayOf,
  DEFAULT_CLOCK,
} from '@/domain/day';
import { formatDayHeader, formatMinutes, formatRange, formatTime, formatVolume, greeting } from '@/domain/format';

describe('dia lógico', () => {
  it('vira às 4h no fuso de São Paulo', () => {
    // 22 out, 3h59 em São Paulo (UTC−3) ainda é o dia 21
    expect(logicalDay(Date.UTC(2026, 9, 22, 6, 59), DEFAULT_CLOCK)).toBe('2026-10-21');
    expect(logicalDay(Date.UTC(2026, 9, 22, 7, 0), DEFAULT_CLOCK)).toBe('2026-10-22');
    // 23h50 continua no mesmo dia
    expect(logicalDay(Date.UTC(2026, 9, 23, 2, 50), DEFAULT_CLOCK)).toBe('2026-10-22');
  });

  it('a hora da virada é do perfil', () => {
    const clock = { ...DEFAULT_CLOCK, dayStartHour: 6 };
    expect(logicalDay(Date.UTC(2026, 9, 22, 8, 30), clock)).toBe('2026-10-21'); // 5h30
  });

  it('deitar à 0h30 cai na madrugada do dia civil seguinte', () => {
    const t = instantAt('2026-10-21', '00:30', DEFAULT_CLOCK);
    expect(new Date(t).toISOString()).toBe('2026-10-22T03:30:00.000Z');
    expect(logicalDay(t, DEFAULT_CLOCK)).toBe('2026-10-21');
    expect(timeOf(t, DEFAULT_CLOCK)).toBe('00:30');
    expect(logicalMinutes('00:30')).toBe(24 * 60 + 30);
  });

  it('acha a próxima virada', () => {
    const now = instantAt('2026-10-22', '21:04', DEFAULT_CLOCK);
    expect(new Date(nextDayTurn(now, DEFAULT_CLOCK)).toISOString()).toBe('2026-10-23T07:00:00.000Z');
  });
});

describe('semana', () => {
  it('começa na segunda', () => {
    expect(weekdayOf('2026-10-22')).toBe(3); // quinta
    expect(weekdayOf('2026-10-25')).toBe(6); // domingo
    expect(weekStart('2026-10-22')).toBe('2026-10-19');
    expect(weekStart('2026-10-25')).toBe('2026-10-19');
    expect(weekStart('2026-10-26')).toBe('2026-10-26');
    expect(weekDays('2026-10-22')).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
  });

  it('conta dias atravessando meses', () => {
    expect(addDays('2026-10-22', -31)).toBe('2026-09-21');
    expect(diffDays('2026-11-01', '2026-10-12')).toBe(20);
  });
});

describe('textos', () => {
  it('formata horários, volumes e datas', () => {
    expect(formatTime('06:52')).toBe('6h52');
    expect(formatTime('22:00')).toBe('22h');
    expect(formatVolume(1500)).toBe('1,5 L');
    expect(formatVolume(2000)).toBe('2 L');
    expect(formatVolume(500)).toBe('500 ml');
    expect(formatMinutes(108)).toBe('1h 48min');
    expect(formatMinutes(35)).toBe('35 min');
    expect(formatDayHeader('2026-10-22')).toBe('Quinta, 22 de outubro');
    expect(formatRange('2026-10-19', '2026-10-25')).toBe('19 – 25 de outubro');
    expect(formatRange('2026-09-21', '2026-10-11')).toBe('21 set – 11 out');
    expect(greeting(7 * 60 + 42)).toBe('Bom dia');
    expect(greeting(12 * 60 + 41)).toBe('Boa tarde');
    expect(greeting(20 * 60 + 34)).toBe('Boa noite');
    // domingo às 18h (quadro): ainda tarde; 19h40: noite
    expect(greeting(18 * 60)).toBe('Boa tarde');
    expect(greeting(18 * 60 + 59)).toBe('Boa tarde');
    expect(greeting(19 * 60 + 40)).toBe('Boa noite');
  });
});
