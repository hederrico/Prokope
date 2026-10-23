// Os gestos dos Primeiros passos: a linha muda em memória, o tutorial recebe o aviso de cada gesto, só a primeira
// vez vai para o perfil (as ações), e o Desfazer do toast volta a linha.
import { vi } from 'vitest';
import { usePractice, resetPractice } from '@/stores/practice';
import { onTour, type TourEvent } from '@/stores/tour';

const undoNoop = async () => {};
const actions = vi.hoisted(() => ({
  practiceMark: vi.fn(async () => undoNoop),
  practiceAdd: vi.fn(async () => undoNoop),
  practiceRate: vi.fn(async () => undoNoop),
}));
const toasts = vi.hoisted(() => [] as { input: { title: string; detail?: string }; undo: () => void }[]);

vi.mock('@/actions', () => actions);
vi.mock('@/components/shell', () => ({
  showUndo: (input: { title: string; detail?: string }, undo: () => void) => {
    toasts.push({ input, undo });
    return 't';
  },
}));
vi.mock('@/motion/sound', () => ({ playSoftTick: () => {} }));

const { practiceAddOne, practiceCheck, practiceRateWith } = await import('./practiceActions');

let events: TourEvent[] = [];
let stop: () => void = () => {};

beforeEach(() => {
  vi.useFakeTimers();
  resetPractice();
  toasts.length = 0;
  events = [];
  stop = onTour((e) => events.push(e));
  Object.values(actions).forEach((fn) => fn.mockClear());
});

afterEach(() => {
  stop();
  vi.useRealTimers();
});

describe('gestos dos Primeiros passos', () => {
  it('marcar, desfazer pelo toast e desmarcar avisam o tutorial', () => {
    practiceCheck(true);
    expect(usePractice.getState().marked).toBe(true);
    expect(actions.practiceMark).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(250);
    expect(toasts.at(-1)?.input).toMatchObject({
      title: 'Primeira marcação feita',
      detail: 'não entra nos seus números',
    });
    toasts.at(-1)!.undo();
    expect(usePractice.getState().marked).toBe(false);

    practiceCheck(true);
    practiceCheck(false);
    vi.advanceTimersByTime(250);
    expect(toasts.at(-1)?.input.title).toBe('Primeira marcação desmarcada');
    expect(events).toEqual([{ type: 'pp-mark' }, { type: 'undo' }, { type: 'pp-mark' }, { type: 'pp-unmark' }]);
  });

  it('o + soma 1 por toque até 3; toques seguidos juntam num toast, e o Desfazer volta para antes deles', () => {
    practiceAddOne();
    vi.advanceTimersByTime(300);
    practiceAddOne();
    vi.advanceTimersByTime(300);
    practiceAddOne();
    vi.advanceTimersByTime(300);
    practiceAddOne(); // já em 3: nada muda
    expect(usePractice.getState().added).toBe(3);
    expect(events).toEqual([
      { type: 'pp-add', total: 1 },
      { type: 'pp-add', total: 2 },
      { type: 'pp-add', total: 3 },
    ]);
    expect(actions.practiceAdd).toHaveBeenCalledTimes(3);
    expect(toasts.at(-1)?.input).toMatchObject({ title: 'Primeiro registro · +3', detail: '3 de 3' });
    toasts.at(-1)!.undo();
    expect(usePractice.getState().added).toBe(0);
  });

  it('a nota da folha vai para a linha e avisa com a nota', () => {
    practiceRateWith(4);
    expect(usePractice.getState().rating).toBe(4);
    expect(actions.practiceRate).toHaveBeenCalledWith(4);
    expect(events).toEqual([{ type: 'pp-rate', rating: 4 }]);
    vi.advanceTimersByTime(100);
    expect(toasts.at(-1)?.input.title).toBe('Nota 4 · Bom');
    practiceRateWith(2);
    vi.advanceTimersByTime(100);
    toasts.at(-1)!.undo();
    expect(usePractice.getState().rating).toBe(4);
  });
});
