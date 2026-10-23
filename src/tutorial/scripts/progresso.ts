// Capítulo "O progresso", com o exemplo (docs/interacao/telas/tutorial.md). Formato em ../types.ts.
import type { TourScript } from '../types';

export const progresso: TourScript = {
  run: 'progresso',
  steps: [
    {
      id: 'progresso',
      where: '/progresso',
      target: 'header.sh-hd',
      text: 'Aqui fica o seu progresso: a semana, os pilares, o humor e as medidas.',
      zeno: 'point',
    },
  ],
};
