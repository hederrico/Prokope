// As cores das placas do casco: o fill da paleta dos pilares ativos, o mesmo da classe .hued em tokens.css.
// Fica no pedaço principal, junto do controlador (index.ts), que entrega as cores prontas ao desenho: assim o
// pedaço do Zeno não importa nada do app, e o pedaço principal não se divide por causa dele.
import { PALETTE, type PaletteKey } from '@/styles/palette';
import type { Oklch } from './color';

/** Sem pilar (o Começar, antes do primeiro): as cores do plano base, as mesmas do laboratório. */
export const DEFAULT_SHELL: readonly PaletteKey[] = ['lavanda', 'salvia', 'damasco', 'rosa'];

const pct = (v: string | undefined, fallback: number) => (v ? parseFloat(v) / 100 : fallback);

/** O fill de uma cor da paleta: claro oklch(85% .075 h), escuro oklch(78% .08 h), com o ajuste fino de Damasco e Sálvia. */
export function pillarFill(key: PaletteKey, dark: boolean): Oklch {
  const p: { hue: number; fl?: string; dfl?: string } = PALETTE[key];
  return dark ? [pct(p.dfl, 0.78), 0.08, p.hue] : [pct(p.fl, 0.85), 0.075, p.hue];
}

/** As cores das placas, na ordem dos pilares ativos. Chaves desconhecidas ficam de fora; nenhuma, as do plano base. */
export function shellColors(keys: readonly string[], dark: boolean): Oklch[] {
  const valid = keys.filter((k): k is PaletteKey => Object.hasOwn(PALETTE, k));
  return (valid.length ? valid : DEFAULT_SHELL).map((k) => pillarFill(k, dark));
}
