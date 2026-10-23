// A cascata de cada passo do primeiro acesso, só na primeira vez em que ele aparece.
import { useEffect, useState } from 'react';

// cada passo entra em cascade só na primeira vez em que aparece (voltar não repete a cascata)
const seenSteps = new Set<number>();

/** true na primeira montagem do passo nesta abertura do app. */
export function useFirstShow(step: number): boolean {
  const [first] = useState(() => !seenSteps.has(step));
  useEffect(() => {
    seenSteps.add(step);
  }, [step]);
  return first;
}
