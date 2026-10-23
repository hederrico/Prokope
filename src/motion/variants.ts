// Variantes prontas do Motion: fadeUp (entrada de um elemento) e a cascata, que só acontece na primeira montagem
// da tela na sessão (nunca quando os dados atualizam nem ao voltar de outra aba). Tokens em ./tokens.
import { useEffect, useState } from 'react';
import type { Variants } from 'motion/react';
import { cascade, distance, fadeUp, tween } from './tokens';

export { cascade, cascadeDelay, fadeUp, fadeUpItem } from './tokens';

/** Saída de um elemento: some em micro com --ease-exit (a saída dura cerca de 70% da entrada). */
export const fadeOut = { opacity: 0, transition: tween.exit } as const;

/** Item que entra e sai com a cascata: igual ao fadeUpItem, com saída. */
export const fadeUpPresence: Variants = {
  hidden: { opacity: 0, y: distance.rise },
  shown: { opacity: 1, y: 0, transition: tween.base },
  exit: { opacity: 0, transition: tween.exit },
};

const seen = new Set<string>();

/** true na primeira montagem desta tela (`id`) na sessão. */
export function useFirstMount(id: string): boolean {
  const [first] = useState(() => !seen.has(id));
  useEffect(() => {
    seen.add(id);
  }, [id]);
  return first;
}

/** Props da cascata para o pai: <m.ul {...useCascadeOnce('hoje')}> com filhos <m.li variants={fadeUpItem}>.
 *  Na primeira vez que a tela aparece, os itens entram em cascata; depois, entram parados. */
export function useCascadeOnce(id: string) {
  const first = useFirstMount(id);
  return { variants: cascade, initial: first ? 'hidden' : false, animate: 'shown' } as const;
}

/** fadeUp só na primeira montagem: <m.div {...useFadeUpOnce('progresso.grafico')} />. */
export function useFadeUpOnce(id: string) {
  const first = useFirstMount(id);
  return first ? fadeUp : { initial: false as const, animate: fadeUp.animate, exit: fadeUp.exit };
}
