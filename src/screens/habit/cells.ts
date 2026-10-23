// As células do MonthCalendar a partir do mês do hábito (useHabitStats(id, mês).month), e a folha que cada dia abre.
import type { DayKey, Habit } from '@/types';
import { addDays, formatNumber, monthName, type CalendarCell } from '@/data';
import type { CalCell } from './MonthCalendar';
import { dayStateWords, partialText } from './text';

export function habitCells(weeks: CalendarCell[][], habit: Habit, today: DayKey): CalCell[][] {
  return weeks.map((week) =>
    week.map((c) => {
      const [, m, d] = c.day.split('-').map(Number);
      const date = d;
      if (!c.inMonth) return { day: c.day, date, state: 'e', label: '', tappable: false } satisfies CalCell;
      let state: CalCell['state'];
      let doneOver = false;
      switch (c.state) {
        case 'done':
          state = 'd';
          break;
        case 'partial':
          state = 'p';
          break;
        case 'notDone':
          state = c.day === today ? 'f' : 'n';
          break;
        case 'paused':
        case 'skipped':
          state = 'x';
          doneOver = c.mark?.status === 'done' && !c.mark?.skipped;
          break;
        case 'offSchedule':
          state = 'u';
          break;
        case 'future':
          state = 'f';
          break;
        default:
          state = 'i';
      }
      let words = dayStateWords(c.state, habit, { partialText: partialText(c.goal) ?? undefined });
      if (habit.type === 'budget') words = c.state === 'done' ? 'usou' : c.state === 'notDone' ? 'não usou' : words;
      if (habit.type === 'number' && c.value !== null && c.state !== 'future')
        words = `${formatNumber(c.value)}${habit.goal.unit ? ` ${habit.goal.unit}` : ''}`;
      if (habit.type === 'rating' && c.value) words = `nota ${c.value}`;
      if (c.state === 'notDone' && c.day === today) words = 'ainda sem registro';
      const tappable = c.state !== 'future' && c.state !== 'inactive' && c.day <= today;
      return {
        day: c.day,
        date,
        state,
        doneOver,
        isToday: c.isToday,
        label: `${date} de ${monthName(m)}${c.isToday ? ', hoje' : ''}, ${words}`,
        tappable,
      } satisfies CalCell;
    }),
  );
}

/** A folha que um dia do calendário abre: o registro do próprio hábito, ou "corrigir um dia". */
export function sheetForDay(habit: Habit, day: DayKey): { name: string; args: Record<string, string> } {
  switch (habit.role) {
    case 'wake':
      return { name: 'acordar', args: { dia: day } };
    case 'bed':
      return { name: 'acordar', args: { dia: addDays(day, 1) } };
    case 'lunch':
      return { name: 'nota', args: { refeicao: 'almoco', dia: day } };
    case 'dinner':
      return { name: 'nota', args: { refeicao: 'jantar', dia: day } };
    case 'protein':
      return { name: 'proteina', args: { dia: day } };
    case 'water':
      return { name: 'agua', args: { dia: day } };
    case 'weight':
      return { name: 'peso', args: { dia: day } };
    case 'checkin':
      return { name: 'checkin', args: { dia: day } };
    default:
  }
  switch (habit.type) {
    case 'check':
    case 'weekly':
    case 'guided':
    case 'checklist':
    case 'time':
      return { name: 'corrigir', args: { habito: habit.id, dia: day } };
    default:
      return { name: 'dia', args: { dia: day } };
  }
}
