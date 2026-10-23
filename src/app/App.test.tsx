// O app abre na entrada (sem sessão) com o nome e o grego, e o modo demonstração leva ao Hoje, com as quatro abas.
// (Substitui o teste do placeholder da etapa 0, que vivia em src/icons/Icon.test.tsx.)
import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  beforeAll(() => {
    // o jsdom não tem matchMedia
    window.matchMedia ??= ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  });

  it('abre na entrada com o nome e o grego, e a demonstração leva ao Hoje', async () => {
    localStorage.clear();
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Prokopē' }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('προκοπή')).toHaveAttribute('lang', 'el');

    const demo = await screen.findByRole('button', { name: /demonstra/i });
    await act(async () => {
      fireEvent.click(demo);
    });
    expect(await screen.findByRole('tablist', { name: 'Seções' }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: 'Hoje' })).toHaveAttribute('aria-selected', 'true');
  });
});
