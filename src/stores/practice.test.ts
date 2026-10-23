// As linhas dos Primeiros passos ficam em memória e zeram cada vez que o grupo aparece (o começo do capítulo).
import { installPracticeHook, usePractice } from './practice';
import { useTour } from './tour';

afterEach(() => useTour.setState({ practice: false }));

describe('Primeiros passos em memória', () => {
  it('zera quando o grupo aparece, e não quando ele sai', () => {
    useTour.setState({ practice: true });
    usePractice.setState({ marked: true, added: 2, rating: 4, entered: true });
    useTour.setState({ practice: false });
    expect(usePractice.getState()).toMatchObject({ marked: true, added: 2, rating: 4 });
    useTour.setState({ practice: true });
    expect(usePractice.getState()).toEqual({ marked: false, added: 0, rating: null, entered: false });
  });

  it('window.__pkPractice.show liga e desliga o grupo', () => {
    installPracticeHook();
    const hook = (window as unknown as { __pkPractice: { show: (on: boolean) => void } }).__pkPractice;
    hook.show(true);
    expect(useTour.getState().practice).toBe(true);
    hook.show(false);
    expect(useTour.getState().practice).toBe(false);
  });
});
