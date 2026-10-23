// Nomes de ícone aceitos pelo <Icon>: os do Phosphor em kebab-case (registry.ts) e a 'salsicha'.
import { phosphorIcons, type PhosphorIconName } from './registry';

export type IconName = PhosphorIconName | 'salsicha';
export type IconWeight = 'regular' | 'duotone' | 'fill' | 'bold';

/** Confere se um texto (vindo dos dados, como o ícone de um pilar) é um nome de ícone conhecido. */
export function isIconName(value: string): value is IconName {
  return value === 'salsicha' || Object.hasOwn(phosphorIcons, value);
}
