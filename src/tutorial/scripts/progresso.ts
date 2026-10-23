// Capítulo "O progresso", com o exemplo (docs/interacao/telas/tutorial.md › Capítulo O progresso). A semana e o que
// comparar, o período (trocar e voltar), os pilares, o que os dados mostram, o humor e as medidas. Os chips e o
// período são passos de fazer: no exemplo, a pessoa toca à vontade. Formato em ../types.ts.
import type { TourEvent } from '@/stores/tour';
import type { TourScript } from '../types';

const isCustom = (name: string) => (e: TourEvent) => e.type === 'custom' && e.name === name;

export const progresso: TourScript = {
  run: 'progresso',
  example: true,
  exampleHome: 'tab',
  // na saída, a visão geral desta semana (a pessoa pode ter parado em Medidas ou noutra semana)
  leave: (ctx) => {
    if (ctx.path() === '/progresso') ctx.navigate('/progresso');
  },
  steps: [
    {
      id: 'semana',
      where: '/progresso',
      target: 'progresso-semana',
      text: 'No anel, a constância da semana. Ao lado, a semana passada e a fase. Tocar na semana passada abre a revisão dela.',
      zeno: ['wave', 'point'],
    },
    {
      id: 'periodo',
      where: '/progresso',
      target: 'progresso-periodo',
      text: 'Para ver a semana anterior, toque na seta ‹ do período.',
      wait: { event: 'custom', match: isCustom('progresso-periodo') },
      reply: { text: 'Isso. A tela toda acompanha o período.', zeno: 'nod' },
      zeno: 'point',
    },
    {
      id: 'voltar',
      where: '/progresso',
      target: 'progresso-agora',
      text: 'Para voltar, toque em "Voltar para esta semana".',
      wait: 'tap',
      zeno: 'point',
      timeout: 1500,
    },
    {
      id: 'pilares',
      where: '/progresso',
      target: 'progresso-pilares',
      text: 'Os pilares ficam do maior para o menor. Toque num para ver só ele.',
      zeno: 'point',
    },
    {
      id: 'dados',
      where: '/progresso',
      target: 'progresso-dados',
      text: 'Em "O que os seus dados mostram", o app compara os dias com e sem um hábito. Cada comparação aparece com 7 dias de cada lado.',
      zeno: 'point',
    },
    {
      id: 'aba-humor',
      where: '/progresso',
      target: 'progresso-aba-humor',
      text: 'Estes botões trocam o que ver: o humor, as medidas e cada pilar. Toque em Humor.',
      wait: 'tap',
      zeno: 'point',
    },
    {
      id: 'humor',
      where: '/progresso',
      target: 'progresso-humor',
      text: 'Cada dia mostra o humor do check-in da noite. Toque num dia para ver o resumo dele.',
      zeno: 'point',
    },
    {
      id: 'aba-medidas',
      where: '/progresso',
      target: 'progresso-aba-medidas',
      text: 'Agora toque em Medidas.',
      wait: 'tap',
      zeno: 'point',
    },
    {
      id: 'medidas',
      where: '/progresso',
      target: 'progresso-peso',
      text: 'Aqui ficam o peso e a média de 7 dias. Para ver só a tendência, é em Ajustes\u00a0› Aparência.',
      zeno: 'point',
    },
  ],
};
