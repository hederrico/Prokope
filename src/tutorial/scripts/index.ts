// Os roteiros do tutorial, um arquivo por roteiro, no formato de ../types.ts
// (docs/interacao/telas/tutorial.md › Formato dos passos). O Começar, "O hábito e os padrões", "O progresso",
// "A jornada" e "Os ajustes" estão completos; um capítulo com um passo só é o roteiro mínimo, que confere o
// encadeamento, até a leva dele escrever os passos.
import type { TourRun } from '@/stores/tour';
import type { TourScript } from '../types';
import { ajustes } from './ajustes';
import { comecar } from './comecar';
import { habito } from './habito';
import { hoje } from './hoje';
import { jornada } from './jornada';
import { progresso } from './progresso';

export const SCRIPTS: Partial<Record<TourRun, TourScript>> = { comecar, hoje, habito, progresso, jornada, ajustes };
