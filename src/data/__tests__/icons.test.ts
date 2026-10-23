// @vitest-environment node
import { ICON_CATALOG, ICON_CATEGORIES, iconLabel, searchIcons, suggestCategory, suggestIcon } from '@/data/icons';
import { isIconName } from '@/icons';

it('catálogo de ícones: 154 nomes válidos, busca sem acento e sugestão pelo nome', () => {
  expect(ICON_CATALOG).toHaveLength(154);
  for (const e of ICON_CATALOG) expect(isIconName(e.name)).toBe(true);
  expect(ICON_CATEGORIES.map((c) => c.label)).toContain('Deixar de lado');
  expect(searchIcons('agua')[0].name).toBe('drop');
  expect(searchIcons('poupar')[0].name).toBe('piggy-bank');
  expect(iconLabel('piggy-bank')).toBe('Cofrinho');
  expect(suggestCategory('Finanças')).toBe('dinheiro');
  expect(suggestIcon('Leitura')).toBe('book-open');
});
