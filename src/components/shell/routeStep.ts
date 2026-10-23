// O contexto de um passo feito de rotas (RouteSteps): as variantes que o corpo da FullScreen usa para fazer o passo.
import { createContext } from 'react';
import type { Variants } from 'motion/react';

export interface RouteStepValue {
  variants: Variants;
  /** a direção do passo (1 para a frente, −1 voltando): a entrada lê do próprio corpo, a saída do AnimatePresence */
  dir: number;
}

/** Dentro de um passo de rota: as variantes e a direção do corpo da FullScreen (null fora de um). */
export const RouteStepContext = createContext<RouteStepValue | null>(null);
