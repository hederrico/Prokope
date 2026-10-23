// Os roteiros do tutorial, um arquivo por roteiro, no formato de ../types.ts
// (docs/interacao/telas/tutorial.md › Formato dos passos). O Começar está completo; os capítulos com um passo só
// são o roteiro mínimo, que confere o encadeamento, até a próxima leva escrever os passos de cada um.
import type { TourRun } from '@/stores/tour';
import type { TourScript } from '../types';
import { ajustes } from './ajustes';
import { comecar } from './comecar';
import { habito } from './habito';
import { hoje } from './hoje';
import { jornada } from './jornada';
import { progresso } from './progresso';

export const SCRIPTS: Partial<Record<TourRun, TourScript>> = { comecar, hoje, habito, progresso, jornada, ajustes };
