// Escrita recusada: a fonte avisa (reportWriteError) e a casca mostra o toast com "Tentar de novo", que grava de novo.
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AppToaster } from '@/components/shell/toast';
import { reportWriteError } from '@/data/writeErrors';
import { WriteErrorToast } from './WriteErrorToast';

describe('WriteErrorToast', () => {
  beforeAll(() => {
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

  it('mostra "Não deu para salvar" e "Tentar de novo" grava as escritas recusadas', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <>
        <AppToaster />
        <WriteErrorToast />
      </>,
    );
    const first = vi.fn();
    const second = vi.fn();
    act(() => {
      reportWriteError(new Error('permission-denied'), first);
      reportWriteError(new Error('permission-denied'), second);
    });
    expect(await screen.findByText('Não deu para salvar.')).toBeInTheDocument();
    expect(screen.getByText('Tente de novo em instantes.')).toBeInTheDocument();
    // um toast só, mesmo com duas escritas recusadas
    expect(screen.getAllByText('Não deu para salvar.')).toHaveLength(1);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Tentar de novo/ }));
    });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
