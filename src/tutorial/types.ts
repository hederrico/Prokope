// O formato dos roteiros do tutorial (docs/interacao/telas/tutorial.md › Formato dos passos).
// Um roteiro é uma lista de passos declarativos; o condutor (conductor.ts) navega, acha o alvo, mostra o balão,
// espera a ação e grava o capítulo como visto só no fim. Os roteiros ficam em scripts/, um arquivo por roteiro.
import type { ExampleMode } from '@/data/example';
import type { TourEvent, TourRun } from '@/stores/tour';
import type { Habit, HabitType } from '@/types';
import type { ZenoController } from '@/zeno';

/**
 * O gesto do Zeno no passo. Sem o Zeno (desligado, ou sem WebGL), nada acontece e o balão segue sozinho.
 * point aponta para o alvo do passo; celebrate é o aceno de cabeça (nível pequeno) e party, o pulinho com aceno.
 */
export type ZenoMove =
  'wave' | 'point' | 'look' | 'nod' | 'hop' | 'sit' | 'stand' | 'rest' | 'celebrate' | 'party' | 'shell';

/**
 * O que faz o passo andar:
 * - 'next': passo de olhar, com o botão "Próximo";
 * - 'tap': passo de fazer, o toque no alvo (o toque segue para o alvo, que faz o que sempre faz);
 * - { event }: passo de fazer, o aviso da ação de verdade pelo canal onTour (pp-mark, pp-add, pp-rate...);
 * - 'none': só no modo acompanhar (Começar): o balão fica até a pessoa seguir pelo fluxo.
 */
export type StepWait = 'next' | 'tap' | 'none' | { event: TourEvent['type']; match?: (e: TourEvent) => boolean };

/** O que os passos e os ganchos podem usar. */
export interface TourContext {
  run: TourRun;
  /** o caminho atual (sem a busca) */
  path(): string;
  navigate(to: string): void;
  zeno: ZenoController;
  example: ExampleMode;
  /** liga e desliga o grupo Primeiros passos no Hoje (useTour().practice) */
  setPractice(on: boolean): void;
  /** os hábitos ativos (sem arquivados), para as condições ("só se o plano tiver limites") */
  habits(): Habit[];
  hasHabitType(type: HabitType): boolean;
}

/** Um alvo: o valor de data-tour ('pp-mark'), um seletor CSS ('[data-tour="ob-chips"] > :first-child') ou uma conta. */
export type StepTarget = string | ((ctx: TourContext) => Element | null);

export interface StepReply {
  /** a frase depois da ação ("Isso. Um pé depois do outro.") */
  text?: string;
  zeno?: ZenoMove | ZenoMove[];
  /** quanto tempo a resposta fica antes de o passo andar (ms). Padrão: 1.600 */
  ms?: number;
}

export interface TourStep {
  /** nome curto do passo, para os testes e o estado (__pkTour.state.stepId) */
  id: string;
  /** a rota do passo; o condutor navega se a pessoa estiver em outra. Uma conta pode devolver null (fica onde está) */
  where?: string | ((ctx: TourContext) => string | null);
  /** o alvo do anel; sem alvo, o balão fica embaixo, acima da barra de abas, e o véu cobre tudo */
  target?: StepTarget;
  /**
   * a região em volta do alvo que o balão também não cobre: um seletor de um ancestral do alvo ('.ob-pil', o pilar
   * inteiro do chip). Padrão: só o alvo
   */
  around?: string;
  /** a frase do balão, na voz do Zeno */
  text: string | ((ctx: TourContext) => string);
  /** padrão: 'next' */
  wait?: StepWait;
  /**
   * onde o balão fica, quando o Zeno não está em cena:
   * - 'near': perto do alvo, sem cobri-lo (padrão nos capítulos); sem alvo, encostado embaixo;
   * - 'top': encostado em cima, sobre o título da tela, com a ponta apontando para o alvo (padrão no Começar);
   * - 'bottom': encostado embaixo, acima da barra de abas ou do botão preso, apontando para o alvo.
   * Com o Zeno em cena, ele fica num canto e o balão fica ao lado da cabeça dele (no Começar, cobrindo o título).
   */
  place?: 'near' | 'top' | 'bottom';
  /** o que acontece depois da ação, antes de andar (o aceno de cabeça e o "Isso.") */
  reply?: string | StepReply;
  /** o gesto do Zeno ao mostrar o passo */
  zeno?: ZenoMove | ZenoMove[];
  /** condição: falso pula o passo ("Dias sem" só se o plano tiver). Avaliada no começo e de novo na hora do passo */
  when?: (ctx: TourContext) => boolean;
  /** quanto o condutor espera o alvo aparecer (ms) antes de pular o passo. Padrão: 3.000 */
  timeout?: number;
  /** o rótulo do botão do passo de olhar. Padrão: "Próximo" (no último passo, "Concluir") */
  nextLabel?: string;
  /** ganchos do passo: antes de mostrar e depois da ação */
  enter?: (ctx: TourContext) => void | Promise<void>;
  leave?: (ctx: TourContext) => void | Promise<void>;
}

/** Modo acompanhar (Começar): sem véu e sem navegar; cada passo aparece uma vez, quando a pessoa chega à rota dele. */
export interface FollowMode {
  /** o roteiro acompanha enquanto o caminho começa com isto ('/comecar/') */
  within: string;
  /** chegar aqui termina o roteiro ('/hoje'), e o "then" começa */
  end: string;
  /** o balão encostado em cima cobre este elemento por inteiro (o título do passo, '.ob-head'), sem deixar meia linha */
  cover?: string;
}

export interface TourScript {
  run: TourRun;
  steps: TourStep[];
  /** sem véu e sem navegar (o Começar) */
  follow?: FollowMode;
  /** mostra as telas com a história de exemplo. Padrão: o "example" do capítulo em CHAPTERS */
  example?: boolean;
  /**
   * onde a pessoa fica ao sair do exemplo (no fim ou no meio), antes de os dados dela voltarem: 'tab' (padrão), a
   * raiz da aba de agora; uma rota ('/progresso'); ou null, fica onde está. Uma tela do exemplo (um hábito que só
   * existe na história) mostraria "Este hábito não existe mais."
   */
  exampleHome?: 'tab' | string | null;
  /** ganchos do roteiro: no começo e na saída (reason: foi até o fim ou saiu no meio) */
  enter?: (ctx: TourContext) => void | Promise<void>;
  leave?: (ctx: TourContext, reason: 'done' | 'stop') => void | Promise<void>;
  /** ao chegar ao fim, começa outro roteiro (o Começar leva a "O dia"), com o Zeno junto */
  then?: TourRun;
}
