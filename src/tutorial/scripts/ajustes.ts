// Capítulo "Os ajustes" (docs/interacao/telas/tutorial.md). Formato em ../types.ts.
import type { TourScript } from '../types';

export const ajustes: TourScript = {
  run: 'ajustes',
  steps: [
    {
      id: 'tutorial',
      where: '/ajustes',
      target: 'ajustes-tutorial',
      text: 'Toque em Tutorial. Os capítulos ficam ali, para rever quando quiser.',
      wait: 'tap',
      zeno: 'point',
    },
  ],
};
