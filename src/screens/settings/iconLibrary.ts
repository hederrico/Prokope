// Biblioteca de ícones do Novo pilar e do lápis do Novo hábito (docs/design-system.html › biblioteca de ícones).
// Os 154 ícones, com nome e palavras-chave em português e as 10 categorias, já estão portados em src/data/icons.ts
// (o catálogo é dado do app, usado também pelo primeiro acesso). Aqui fica só o que é do seletor: os rótulos curtos
// dos chips do quadro, a montagem da grade por categoria e a busca com a contagem para o leitor de tela.
import { ICON_CATALOG, ICON_CATEGORIES, searchIcons, suggestCategory, suggestIcon, iconLabel } from '@/data';
import type { IconEntry } from '@/data';
import type { IconName } from '@/icons';

export { ICON_CATALOG, ICON_CATEGORIES, searchIcons, suggestCategory, suggestIcon, iconLabel };
export type { IconEntry };

/** Rótulos curtos dos chips (quadro: "Corpo", "Trabalho", "Lazer", "Relações"); a grade usa o nome inteiro. */
const CHIP_LABELS: Record<string, string> = {
  mente: 'Mente e sono',
  alim: 'Alimentação',
  corpo: 'Corpo',
  familia: 'Família e casa',
  saude: 'Saúde',
  trabalho: 'Trabalho',
  dinheiro: 'Dinheiro',
  lazer: 'Lazer',
  relacoes: 'Relações',
  parar: 'Deixar de lado',
};

export interface IconChip {
  key: string;
  label: string;
}

/** Todos e as 10 categorias, na ordem da biblioteca. */
export const ICON_CHIPS: IconChip[] = [
  { key: 'todos', label: 'Todos' },
  ...ICON_CATEGORIES.map((c) => ({ key: c.key, label: CHIP_LABELS[c.key] ?? c.label })),
];

export interface IconSection {
  key: string;
  label: string;
  icons: IconEntry[];
  /** a categoria que combina com o nome ("sugerido pelo nome") */
  suggested: boolean;
}

/** A grade sem busca: as categorias, com a sugerida pelo nome no topo. */
export function iconSections(suggested: string | null): IconSection[] {
  const sections = ICON_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    icons: ICON_CATALOG.filter((e) => e.category === c.key),
    suggested: c.key === suggested,
  }));
  if (!suggested) return sections;
  const i = sections.findIndex((s) => s.key === suggested);
  if (i <= 0) return sections;
  const [first] = sections.splice(i, 1);
  return [first, ...sections];
}

/** "6 ícones", "1 ícone" (anunciado pelo aria-live da busca). */
export function iconCountLabel(n: number): string {
  return n === 1 ? '1 ícone' : `${n} ícones`;
}

/** O ícone que o nome sugere: pelo nome ("Leitura" → livro) ou o primeiro da categoria ("Finanças" → Dinheiro). */
export function iconForName(name: string): IconName | null {
  const byName = suggestIcon(name);
  if (byName) return byName;
  const cat = suggestCategory(name);
  return cat ? (ICON_CATALOG.find((e) => e.category === cat)?.name ?? null) : null;
}
