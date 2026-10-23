// Escrita recusada pelo servidor (regra de segurança, conta sem acesso): a casca mostra o toast
// "Não deu para salvar. Tente de novo em instantes." com "Tentar de novo" (src/app/WriteErrorToast.tsx).
// O valor local volta sozinho pelo onSnapshot; `retry` grava de novo o mesmo lote.
type Listener = (error: unknown, retry?: () => void) => void;

const listeners = new Set<Listener>();

export function reportWriteError(error: unknown, retry?: () => void) {
  if (!listeners.size) console.error('Escrita recusada', error);
  for (const l of listeners) l(error, retry);
}

/** Ouve as escritas recusadas. Devolve a função que para de ouvir. */
export function onWriteError(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const WRITE_ERROR_MESSAGE = 'Não deu para salvar. Tente de novo em instantes.';
