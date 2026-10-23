// Ponto de entrada do Zeno: useZeno() devolve o controlador e <ZenoHost /> fica uma vez só na raiz do app.
// Versão provisória (contrato da rodada do Zeno): ele nunca está disponível, e o tutorial segue só com o balão.
// O agente do Zeno troca por esta mesma API com o desenho de verdade, carregado sob demanda.
import type { ZenoController } from './types';

export type { ZenoController, ZenoGaze, ZenoPlace, ZenoTarget } from './types';

const done = () => Promise.resolve();

const absent: ZenoController = {
  available: false,
  present: false,
  enter: done,
  leave: done,
  moveTo: done,
  lookAt: () => undefined,
  pointAt: done,
  rest: () => undefined,
  talk: () => undefined,
  wave: done,
  nod: done,
  hop: done,
  sit: done,
  stand: done,
  celebrate: done,
  showShell: done,
  anchor: () => null,
  onMove: () => () => undefined,
};

export function useZeno(): ZenoController {
  return absent;
}

/** O palco do Zeno, por cima da tela. Provisório: não desenha nada. */
export function ZenoHost(): null {
  return null;
}
