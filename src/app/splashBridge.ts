// Ponte com a abertura do index.html (window.__pkSplash). A abertura aparece na primeira pintura, antes deste código
// chegar; o app só avisa quando a primeira tela está pronta (done) e quando precisa dela de novo numa espera (again).
// Também guarda as cores dos pilares de quem abre, para a próxima abertura acender os pontos certos no caminho.
import { PALETTE, type PaletteKey } from '@/styles/palette';

interface SplashApi {
  done(): void;
  again(): void;
  shown(): boolean;
}

declare global {
  interface Window {
    __pkSplash?: SplashApi;
  }
}

/** A primeira tela está pronta: a linha completa o caminho e a abertura sai (ou some, se nem chegou a aparecer). */
export function splashDone(): void {
  window.__pkSplash?.done();
}

/** Uma espera dentro do app (entrar na demonstração): a abertura volta, com os mesmos 300 ms antes de aparecer. */
export function splashAgain(): void {
  window.__pkSplash?.again();
}

/** A abertura chegou a aparecer nesta visita (a tela Entrar não redesenha a arte por baixo dela). */
export function splashWasShown(): boolean {
  return window.__pkSplash?.shown() ?? false;
}

const KEY = 'pk-splash';

/** Guarda [matiz, --fl, --ml, --dfl] de cada pilar, na ordem, no formato que o index.html lê. */
export function rememberPillars(colors: PaletteKey[]): void {
  const list = colors.map((key) => {
    const c: { hue: number; fl?: string; ml?: string; dfl?: string } = PALETTE[key];
    return c.fl ? [c.hue, c.fl, c.ml, c.dfl] : [c.hue];
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* sem armazenamento: a próxima abertura usa o plano base */
  }
}
