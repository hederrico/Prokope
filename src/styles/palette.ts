// Paleta fechada de 12 cores dos pilares (design-system.md › Pilares personalizáveis).
// Todas usam a mesma fórmula da classe .hued (tokens.css) e só mudam o matiz; Damasco e Sálvia têm ajuste fino.
import type { CSSProperties } from 'react';

export const PALETTE = {
  coral: { name: 'Coral', hue: 25 },
  damasco: { name: 'Damasco', hue: 60, fl: '81.5%', ml: '61%', il: '46.5%', dfl: '73%' },
  mel: { name: 'Mel', hue: 90 },
  oliva: { name: 'Oliva', hue: 120 },
  salvia: { name: 'Sálvia', hue: 150, fl: '90.5%', ml: '64.5%', il: '45.5%', dfl: '82%' },
  menta: { name: 'Menta', hue: 175 },
  agua: { name: 'Água', hue: 205 },
  ceu: { name: 'Céu', hue: 235 },
  indigo: { name: 'Índigo', hue: 262 },
  lavanda: { name: 'Lavanda', hue: 285 },
  ameixa: { name: 'Ameixa', hue: 320 },
  rosa: { name: 'Rosa', hue: 355 },
} as const satisfies Record<string, PaletteEntry>;

type PaletteEntry = { name: string; hue: number; fl?: string; ml?: string; il?: string; dfl?: string };

export type PaletteKey = keyof typeof PALETTE;
export const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[];

/** Estilo para um elemento com className="hued": <div className="hued" style={hueStyle('mel')}>. */
export function hueStyle(key: PaletteKey): CSSProperties {
  const p: PaletteEntry = PALETTE[key];
  return {
    '--h': p.hue,
    '--fl': p.fl ?? '85%',
    '--ml': p.ml ?? '64%',
    '--il': p.il ?? '47.5%',
    '--dfl': p.dfl ?? '78%',
  } as CSSProperties;
}
