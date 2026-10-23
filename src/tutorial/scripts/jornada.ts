// Capítulo "A jornada", com o exemplo (docs/interacao/telas/tutorial.md). Formato em ../types.ts.
import type { TourScript } from '../types';

export const jornada: TourScript = {
  run: 'jornada',
  steps: [
    {
      id: 'jornada',
      where: '/jornada',
      target: 'header.sh-hd',
      text: 'Aqui fica a sua jornada: as fases, o treino guiado e a revisão de domingo.',
      zeno: 'point',
    },
  ],
};
