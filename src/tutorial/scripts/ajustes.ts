// Capítulo "Os ajustes" (docs/interacao/telas/tutorial.md › Capítulo Os ajustes). Nos dados da pessoa, só
// apontando: o plano e o Novo hábito, pausar, a rotina, a aparência, a dois, os dados e a conta. O último passo é de
// fazer: tocar em Tutorial, que abre a lista dos capítulos. Formato em ../types.ts.
import type { TourScript } from '../types';

export const ajustes: TourScript = {
  run: 'ajustes',
  steps: [
    {
      id: 'plano',
      where: '/ajustes',
      target: '[data-tour="ajustes-plano"] > *',
      text: 'Em Meu plano ficam os seus hábitos e pilares. Um hábito pode contar em mais de um pilar: é o "Também conta em", no formulário dele.',
      zeno: ['wave', 'point'],
    },
    {
      id: 'novo-habito',
      where: '/ajustes/habitos',
      target: 'ajustes-novo-habito',
      text: 'No + você cria um hábito. Um dos tipos é o Treino guiado: um plano em semanas, como a corrida do zero.',
      zeno: 'point',
    },
    {
      id: 'pausar',
      where: '/ajustes',
      target: 'ajustes-pausar',
      text: 'Em Pausar, você pausa o app ou alguns hábitos, nas férias ou numa gripe. Os dias pausados não contam.',
      zeno: 'point',
    },
    {
      id: 'rotina',
      where: '/ajustes',
      target: '[data-tour="ajustes-rotina"] > *',
      text: 'Em Horários ficam as horas que guiam o seu dia. Em Lembretes, os alarmes para criar no iPhone.',
      zeno: 'point',
    },
    {
      id: 'aparencia',
      where: '/ajustes',
      target: 'ajustes-aparencia',
      text: 'Em Aparência ficam o tema, o jeito de ver o Hoje e "Mostrar o Zeno". Sem mim, o tutorial segue só com o texto.',
      zeno: 'point',
    },
    {
      id: 'a-dois',
      where: '/ajustes',
      target: 'ajustes-a-dois',
      text: 'Em A dois, você liga o app com outra pessoa e escolhe o que mostrar. Sem placar.',
      zeno: 'point',
    },
    {
      id: 'conta',
      where: '/ajustes',
      target: '[data-tour="ajustes-conta"] > *',
      text: 'No seu nome ficam os dados e a conta: exportar, sair e apagar.',
      zeno: 'point',
    },
    {
      id: 'tutorial',
      where: '/ajustes',
      target: 'ajustes-tutorial',
      text: 'E em Tutorial ficam todos os capítulos, para rever quando quiser. Toque nele.',
      wait: 'tap',
      zeno: 'point',
    },
  ],
};
