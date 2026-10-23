// Cor de pilar nos componentes: um tom nomeado (data-pillar) ou uma das 12 cores da paleta (.hued + data-hue).
// Os pilares são dados de cada pessoa: a tela passa a chave da cor do pilar, e o componente só pinta.
import { PALETTE, type PaletteKey } from '@/styles/palette';

/** Tons com tokens próprios em tokens.css. 'accent' é a primária, para o que não é pilar nem hábito. */
export type PillarTone = 'mente' | 'alim' | 'corpo' | 'familia' | 'accent';
/** Cor de um pilar: a chave da paleta (o que o pilar guarda) ou um tom nomeado. */
export type PillarColor = PillarTone | PaletteKey;

const TONES: readonly string[] = ['mente', 'alim', 'corpo', 'familia', 'accent'];

export type PillarAttrs = { className?: string; 'data-pillar'?: string; 'data-hue'?: string };

/** Atributos que pintam um elemento (e os filhos) com a cor do pilar: --wash, --fill, --mark, --ink, --on. */
export function pillarAttrs(color?: PillarColor): PillarAttrs {
  if (!color) return {};
  if (TONES.includes(color)) return { 'data-pillar': color };
  if (Object.hasOwn(PALETTE, color)) return { className: 'hued', 'data-hue': color };
  return {};
}

/** Visual de um hábito para os componentes: a tela monta a partir do hábito e do pilar dele. */
export type HabitVisual = {
  /** nome do hábito, sem o horário ("Acordar") */
  name: string;
  /** nome do ícone (Phosphor em kebab-case ou 'salsicha') */
  icon: import('@/icons').IconName;
  /** cor do pilar principal */
  pillar: PillarColor;
};
