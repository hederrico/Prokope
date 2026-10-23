// Escrita recusada pelo servidor (estados.md, gestos-e-feedback.md › Toasts): o toast
// "Não deu para salvar. Tente de novo em instantes." com "Tentar de novo", até a pessoa dispensar.
// Um toast só (o mesmo id troca no lugar), mesmo que várias escritas falhem juntas: "Tentar de novo" grava todas.
import { useEffect } from 'react';
import { onWriteError, WRITE_ERROR_MESSAGE } from '@/data/writeErrors';
import { dismissToast, showToast } from '@/components/shell/toast';

const ID = 'write-error';
const [TITLE, ...REST] = WRITE_ERROR_MESSAGE.split('. ');
const DETAIL = REST.join('. ');

// as escritas recusadas desde o último toque em "Tentar de novo" (ou desde que a pessoa dispensou)
let pending: (() => void)[] = [];

function retryAll() {
  const list = pending;
  pending = [];
  dismissToast(ID);
  for (const r of list) r();
}

/** Mostra o toast da escrita recusada. `retry` grava de novo o que falhou. */
export function showWriteError(retry?: () => void): string {
  if (retry) pending.push(retry);
  return showToast({
    id: ID,
    title: `${TITLE}.`,
    detail: DETAIL,
    pillar: 'accent',
    duration: Infinity,
    action: pending.length ? { label: 'Tentar de novo', onClick: retryAll } : undefined,
    onDismiss: () => {
      pending = [];
    },
  });
}

/** Ouve as escritas recusadas da fonte de dados (vai na raiz do app). */
export function WriteErrorToast() {
  useEffect(
    () =>
      onWriteError((error, retry) => {
        console.error('Escrita recusada', error);
        showWriteError(retry);
      }),
    [],
  );
  return null;
}
