// Primeiro acesso: o Zeno conversa uma vez por passo, sem véu, e vai junto para o Hoje, onde começa "O dia".
// Formato em ../types.ts (docs/interacao/telas/tutorial.md › Formato dos passos).
import { markIntro } from '@/actions/tutorial';
import type { TourScript } from '../types';

/** Primeiro acesso: o Zeno conversa uma vez por passo, sem véu, e vai junto para o Hoje, onde começa "O dia". */
export const comecar: TourScript = {
  run: 'comecar',
  // o balão fica sobre o título do passo e nunca cobre os controles nem o Continuar
  follow: { within: '/comecar/', end: '/hoje', cover: '.ob-head' },
  then: 'hoje',
  steps: [
    {
      id: 'oi',
      where: '/comecar/1',
      target: 'ob-opcoes',
      text: 'Oi, eu sou o Zeno. Vou com você nos primeiros passos.',
      wait: 'next',
      // no passo 1 sobra espaço embaixo das opções: o balão fica ali, e o título continua à vista
      place: 'bottom',
      zeno: 'wave',
      // a apresentação fica gravada aqui: depois do Começar, ninguém oferece de novo
      enter: () => void markIntro(),
    },
    {
      id: 'como',
      where: '/comecar/1',
      target: 'ob-opcoes',
      text: 'Dá para começar com o plano base, que já vem com fases, ou do zero.',
      place: 'bottom',
      zeno: 'point',
    },
    {
      id: 'pilares',
      where: '/comecar/2',
      // o primeiro chip do plano base; do zero, ele não existe e o passo seguinte entra
      target: '[data-tour="ob-chips"] > :first-child',
      text: 'Cada pilar é uma parte da sua vida. Toque num hábito para tirar ou pôr de volta.',
      zeno: 'point',
      timeout: 1200,
    },
    {
      id: 'primeiro-pilar',
      where: '/comecar/2',
      target: 'ob-novo-pilar',
      text: 'Crie o primeiro pilar. Dá para mudar tudo depois.',
      zeno: 'point',
      timeout: 1200,
    },
    {
      id: 'rotina',
      where: '/comecar/3',
      target: 'ob-horario',
      text: 'Seus horários guiam o dia. Dá para mudar depois em Ajustes › Horários.',
      zeno: 'point',
      timeout: 1500,
    },
  ],
  // no primeiro login com Google, o perfil pode chegar depois do passo 1: grava de novo ao terminar (uma vez só)
  leave: (_ctx, reason) => {
    if (reason === 'done') void markIntro();
  },
};
