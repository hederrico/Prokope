// Capítulo "O hábito e os padrões", com o exemplo (docs/interacao/telas/tutorial.md › Capítulo O hábito).
// Abre a caminhada da história de exemplo, que tem semanas de dados e conta em dois pilares, e mostra o topo, a
// força, o calendário (com um dia corrigido de verdade, no exemplo), as comparações "com e sem", o menu e o pausar.
// Formato em ../types.ts.
import type { TourEvent } from '@/stores/tour';
import type { Habit } from '@/types';
import type { TourContext, TourScript } from '../types';

type HabitTab = 'hoje' | 'progresso' | 'ajustes';

/** A tela de um hábito em cada aba, e de onde ela se abre (a raiz da aba ou a lista de Ajustes › Hábitos). */
const SCREEN: Record<HabitTab, { base: string; parent: string }> = {
  hoje: { base: '/hoje/habito/', parent: '/hoje' },
  progresso: { base: '/progresso/habito/', parent: '/progresso' },
  ajustes: { base: '/ajustes/habitos/', parent: '/ajustes/habitos' },
};

/** A tela de um hábito em que a pessoa está (a oferta "O hábito" aparece ali), ou null. */
function habitTabAt(path: string): HabitTab | null {
  if (/^\/hoje\/habito\/[^/]+$/.test(path)) return 'hoje';
  if (/^\/progresso\/habito\/[^/]+$/.test(path)) return 'progresso';
  if (/^\/ajustes\/habitos\/[^/]+$/.test(path) && path !== '/ajustes/habitos/novo') return 'ajustes';
  return null;
}

// a aba do capítulo: a do hábito em que a pessoa estava, ou o Hoje (Ajustes › Tutorial, a API)
let tab: HabitTab = 'hoje';

/** O hábito do exemplo: a caminhada (sim ou não, com "Também conta em" e semanas de história). */
function exampleHabit(ctx: TourContext): Habit | null {
  const started = ctx.habits().filter((h) => h.startDay);
  return (
    started.find((h) => h.type === 'check' && h.alsoIn.length > 0) ?? started.find((h) => h.type === 'check') ?? null
  );
}

/** A tela do hábito do exemplo, na aba do capítulo. */
function habitScreen(ctx: TourContext): string | null {
  const h = exampleHabit(ctx);
  return h ? SCREEN[tab].base + encodeURIComponent(h.id) : null;
}

/** Espera o caminho chegar e a tela que sai terminar a passagem (até 1,5 s). */
async function settleAt(ctx: TourContext, path: string): Promise<void> {
  const start = performance.now();
  while (performance.now() - start < 1500) {
    const leaving = document.querySelector('[data-screen][aria-hidden="true"], [aria-hidden="true"] [data-screen]');
    if (ctx.path() === path && !leaving) return;
    await new Promise((r) => setTimeout(r, 50));
  }
}

export const habito: TourScript = {
  run: 'habito',
  example: true,
  // na saída (no fim ou no meio), a raiz da aba: a tela do hábito do exemplo não existe nos dados da pessoa
  exampleHome: 'tab',
  enter: async (ctx) => {
    const here = habitTabAt(ctx.path());
    tab = here ?? 'hoje';
    // a oferta aparece na tela de um hábito da pessoa: antes do exemplo, volta para a lista, para a tela dela não
    // virar "Este hábito não existe mais."; o primeiro passo abre a caminhada do exemplo a partir dali
    if (here) {
      ctx.navigate(SCREEN[here].parent);
      await settleAt(ctx, SCREEN[here].parent);
    }
  },
  steps: [
    {
      id: 'topo',
      where: habitScreen,
      target: 'habito-topo',
      text: 'Cada hábito tem uma tela assim. As etiquetas são os pilares: o dele e os de "Também conta em".',
      zeno: ['wave', 'point'],
    },
    {
      id: 'forca',
      where: habitScreen,
      target: 'habito-numeros',
      text: 'A força do hábito cresce com a constância e cai devagar. Um dia sem não zera nada. Ao lado, a semana e o total.',
      zeno: 'point',
    },
    {
      id: 'calendario',
      where: habitScreen,
      target: 'habito-calendario',
      text: 'No calendário, cheio é feito, meio cheio é parcial e pontilhado é fora da agenda. A legenda fica embaixo.',
      zeno: 'point',
    },
    {
      id: 'dia',
      where: habitScreen,
      target: 'habito-calendario',
      text: 'Toque num dia que passou para corrigir. Aqui é exemplo: pode tocar à vontade.',
      // anda quando um dia abre (um dia por vir não abre nada)
      wait: { event: 'custom', match: (e: TourEvent) => e.type === 'custom' && e.name === 'habito-dia' },
      zeno: 'point',
    },
    {
      id: 'corrigir',
      target: 'habito-corrigir',
      text: 'Escolha como foi esse dia. Dá para desfazer no aviso que aparece embaixo.',
      wait: 'tap',
      reply: { text: 'Isso. É assim que se corrige um dia.', zeno: 'nod' },
      zeno: 'point',
      timeout: 2000,
    },
    {
      id: 'padroes',
      where: habitScreen,
      // o cartão do padrão (o anel acompanha o canto dele)
      target: '[data-tour="habito-padroes"] > *',
      text: 'Aqui o app compara os dias com e sem este hábito. Nos de horário, como o Acordar, compara os dias no horário com os outros.',
      zeno: 'point',
    },
    {
      id: 'menu',
      where: habitScreen,
      target: 'habito-menu',
      text: () =>
        tab === 'ajustes'
          ? 'Em Editar você muda o nome, a meta, a agenda e os pilares.'
          : 'No ⋯ fica o menu: editar o hábito ou tirar só de hoje.',
      zeno: 'point',
    },
    {
      id: 'pausar',
      where: habitScreen,
      target: '[data-tour="habito-pausar"] > *',
      text: 'No fim da tela, você pausa o hábito por uns dias ou arquiva. O histórico fica guardado.',
      zeno: 'point',
    },
  ],
};
