// Capítulo "O dia" (docs/interacao/telas/tutorial.md › Capítulo O dia). Formato em ../types.ts.
import type { TourScript } from '../types';

/** O dia (mínimo): o encadeamento depois do Começar e de Ajustes › Tutorial. Os 11 passos vêm na próxima leva. */
export const hoje: TourScript = {
  run: 'hoje',
  // o grupo Primeiros passos aparece no Hoje enquanto o capítulo roda
  enter: (ctx) => ctx.setPractice(true),
  leave: (ctx) => ctx.setPractice(false),
  steps: [
    {
      id: 'semana',
      where: '/hoje',
      target: '[data-flip="week"] .pk-card',
      text: 'Aqui fica a sua semana. Toque num dia que passou para corrigir.',
      zeno: 'point',
    },
  ],
};
