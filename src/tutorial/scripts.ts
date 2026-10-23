// Os roteiros do tutorial, no formato de types.ts (docs/interacao/telas/tutorial.md › Formato dos passos).
// O Começar está completo. Os capítulos têm, por enquanto, um roteiro mínimo de um passo, que confere o encadeamento
// (navegar, achar o alvo, o balão, gravar no fim); a próxima leva escreve os passos de cada um sobre este formato.
import { markIntro } from '@/actions/tutorial';
import type { TourRun } from '@/stores/tour';
import type { TourScript } from './types';

/** Primeiro acesso: o Zeno conversa uma vez por passo, sem véu, e vai junto para o Hoje, onde começa "O dia". */
const comecar: TourScript = {
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

/** O dia (mínimo): o encadeamento depois do Começar e de Ajustes › Tutorial. Os 11 passos vêm na próxima leva. */
const hoje: TourScript = {
  run: 'hoje',
  // o grupo Primeiros passos aparece no Hoje enquanto o capítulo roda
  enter: (ctx) => ctx.setPractice(true),
  leave: (ctx) => ctx.setPractice(false),
  steps: [
    {
      id: 'semana',
      where: '/hoje',
      target: '[data-flip="week"] .pk-card',
      text: 'Aqui fica a sua semana. Toque num dia que passou para corrigir.',
      zeno: 'point',
    },
  ],
};

const habito: TourScript = {
  run: 'habito',
  steps: [
    {
      id: 'habito',
      where: '/hoje',
      text: 'Cada hábito tem uma tela com o calendário, a força e as comparações. Toque no nome de um hábito para abrir.',
    },
  ],
};

const progresso: TourScript = {
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

const jornada: TourScript = {
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

const ajustes: TourScript = {
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

export const SCRIPTS: Partial<Record<TourRun, TourScript>> = { comecar, hoje, habito, progresso, jornada, ajustes };
