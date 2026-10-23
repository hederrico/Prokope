// Capítulo "A jornada", com o exemplo (docs/interacao/telas/tutorial.md › Capítulo A jornada). O caminho das fases,
// a fase de agora, a sugestão de avançar, Editar jornada, a entrada dos Primeiros passos (se houver), o treino guiado
// com o plano em semanas e as revisões. Formato em ../types.ts.
import { firstStepsEntry } from '@/domain/firstSteps';
import { tutorialOf } from '@/domain/tutorial';
import { useDataStore } from '@/stores/data';
import type { TourScript } from '../types';

export const jornada: TourScript = {
  run: 'jornada',
  example: true,
  exampleHome: 'tab',
  steps: [
    {
      id: 'caminho',
      where: '/jornada',
      target: 'jornada-caminho',
      text: 'Este é o caminho das fases: a concluída, a de agora e as próximas.',
      zeno: ['wave', 'point'],
    },
    {
      id: 'agora',
      where: '/jornada',
      target: 'jornada-agora',
      text: 'A fase de agora mostra as semanas e os hábitos novos. Os das fases anteriores continuam com você.',
      zeno: 'point',
    },
    {
      id: 'proxima',
      where: '/jornada',
      target: 'jornada-proxima',
      text: 'A próxima fase tem uma data prevista. No fim da fase, a revisão sugere avançar. Você decide.',
      zeno: 'point',
    },
    {
      id: 'editar',
      where: '/jornada',
      target: 'jornada-editar',
      text: 'Em Editar jornada você muda as datas, os hábitos de cada fase e quando sugerir a próxima.',
      zeno: 'point',
    },
    {
      id: 'primeiros-passos',
      where: '/jornada',
      target: 'pp-journey',
      text: 'Os seus Primeiros passos ficaram aqui, no dia em que aconteceram.',
      zeno: 'point',
      // só quando a pessoa já fez o primeiro gesto de "O dia" (o exemplo mostra o tutorial dela)
      when: () => !!firstStepsEntry(tutorialOf(useDataStore.getState().profile).firstSteps),
    },
    {
      id: 'treino',
      where: '/jornada',
      target: 'jornada-treino',
      text: 'Este é um treino guiado: um plano em semanas, como a corrida do zero. Toque nele.',
      wait: 'tap',
      zeno: 'point',
    },
    {
      id: 'plano',
      // o toque no cartão já abre o plano; sem "where", o condutor não navega de novo enquanto a rota chega
      target: 'treino-semana',
      text: 'Este é o treino da semana, bloco a bloco. Embaixo ficam todas as semanas do plano: toque numa para ver o treino dela.',
      zeno: 'point',
    },
    {
      id: 'revisoes',
      where: '/jornada',
      target: '[data-tour="jornada-revisoes"] > *',
      text: 'No domingo, a revisão da semana aparece no Hoje. As que passaram ficam aqui, só para ler.',
      zeno: 'point',
    },
  ],
};
