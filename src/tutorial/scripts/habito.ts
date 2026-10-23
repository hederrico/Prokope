// Capítulo "O hábito e os padrões", com o exemplo (docs/interacao/telas/tutorial.md). Formato em ../types.ts.
import type { TourScript } from '../types';

export const habito: TourScript = {
  run: 'habito',
  steps: [
    {
      id: 'habito',
      where: '/hoje',
      text: 'Cada hábito tem uma tela com o calendário, a força e as comparações. Toque no nome de um hábito para abrir.',
    },
  ],
};
