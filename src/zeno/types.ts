// A API do Zeno para o resto do app. O desenho (three.js) só carrega quando ele entra em cena.
// O balão com o texto não é dele: quem conduz (o tutorial) desenha o balão perto de anchor().

/** Um elemento de verdade da tela, ou um seletor CSS ('[data-tour="pp-mark"]'). */
export type ZenoTarget = Element | string;

/** Para onde ele olha: um elemento, quem está usando, o chão, ou em volta (à toa). */
export type ZenoGaze = ZenoTarget | 'person' | 'ground' | 'around';

/** Onde ele fica na tela: embaixo (acima da barra de abas), em cima (abaixo do cabeçalho), ou longe do alvo. */
export type ZenoPlace = 'bottom' | 'top' | { awayFrom: ZenoTarget };

export interface ZenoController {
  /** pode aparecer: "Mostrar o Zeno" ligado e o aparelho desenha (WebGL). Falso: o tutorial segue só com o balão */
  readonly available: boolean;
  /** está em cena */
  readonly present: boolean;
  /** entra por cima da tela, andando até o lugar; resolve quando chegou (e com o aceno, se pedido) */
  enter(opts?: { place?: ZenoPlace; wave?: boolean }): Promise<void>;
  /** tchau e sai de cena; resolve quando saiu e o desenho parou */
  leave(): Promise<void>;
  /** anda até outro lugar da tela */
  moveTo(place: ZenoPlace): Promise<void>;
  /** os olhos vão na frente e a cabeça vem depois; holdMs mantém o olhar antes de voltar à toa */
  lookAt(target: ZenoGaze, holdMs?: number): void;
  /** olha e aponta para o alvo; resolve com o braço no lugar */
  pointAt(target: ZenoTarget): Promise<void>;
  /** baixa os braços e volta ao corpo de descanso */
  rest(): void;
  /** fala: mexe a cabeça e a boca pelo tempo de leitura do texto (o texto em si fica no balão de quem conduz) */
  talk(text: string): void;
  wave(): Promise<void>;
  nod(): Promise<void>;
  hop(): Promise<void>;
  sit(): Promise<void>;
  stand(): Promise<void>;
  /** degraus da escada de celebração (movimento.md): pequeno = aceno de cabeça; médio = pulinho e aceno */
  celebrate(level: 'small' | 'medium'): Promise<void>;
  /** dá as costas e olha por cima do ombro, para mostrar o casco com as cores dos pilares */
  showShell(): Promise<void>;
  /** o retângulo da cabeça dele na tela, para o balão se posicionar; null fora de cena */
  anchor(): DOMRect | null;
  /** avisa quando ele muda de lugar na tela ou sai (o balão acompanha); devolve o cancelamento */
  onMove(cb: () => void): () => void;
}
