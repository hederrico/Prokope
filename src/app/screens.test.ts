import { describe, expect, it } from 'vitest';
import { findScreen, parentPath, rootKey, tabOf } from './screens';
import { withSheet, withoutSheet } from './sheets';

describe('tabela das telas', () => {
  it('acha a tela e a aba pelo primeiro trecho da rota', () => {
    expect(findScreen('/hoje/habito/caminhada')?.def.kind).toBe('push');
    expect(tabOf('/progresso/habito/caminhada')).toBe('progresso');
    expect(tabOf('/ajustes/habitos/caminhada')).toBe('ajustes');
    expect(tabOf('/ajustes/pilares/novo')).toBeNull();
  });

  it('rotas fixas ganham das com parâmetro', () => {
    expect(findScreen('/ajustes/pilares/novo')?.def.kind).toBe('full');
    expect(findScreen('/ajustes/pilares/mente')?.def.kind).toBe('push');
    expect(findScreen('/revisao/2026-W43/fim')?.def.title).toBe('Revisão');
    expect(findScreen('/revisao/2026-W43/fim')?.def.kind).toBe('full');
    expect(findScreen('/revisao/2026-W43/2')?.def.kind).toBe('flow');
  });

  it('a tela de cima de um link direto', () => {
    expect(parentPath('/hoje/habito/caminhada')).toBe('/hoje');
    expect(parentPath('/ajustes/pilares/mente')).toBe('/ajustes/pilares');
    expect(parentPath('/ajustes/dados/apagar')).toBe('/ajustes/dados');
    expect(parentPath('/progresso/revisoes/2026-W42')).toBe('/progresso');
  });

  it('a camada de cima: as abas dividem uma; um fluxo mantém a mesma entre os passos', () => {
    expect(rootKey('/hoje')).toBe('tabs');
    expect(rootKey('/ajustes/pilares/mente')).toBe('tabs');
    expect(rootKey('/revisao/2026-W43/1')).toBe(rootKey('/revisao/2026-W43/3'));
    expect(rootKey('/comecar/1')).toBe('/comecar');
    expect(rootKey('/fase/3')).toBe('/fase/3');
    // Novo hábito: tipo e detalhes são passos de rotas diferentes na mesma camada
    expect(rootKey('/ajustes/habitos/novo/tipo')).toBe(rootKey('/ajustes/habitos/novo/detalhes'));
    expect(findScreen('/ajustes/habitos/novo/detalhes')?.def.step).toBe(2);
    expect(findScreen('/ajustes/habitos/caminhada/editar')?.def.kind).toBe('full');
  });
});

describe('folhas na URL', () => {
  it('abre e fecha uma folha sem perder os outros parâmetros', () => {
    expect(withSheet('?dia=2026-10-21', 'proteina')).toBe('?dia=2026-10-21&folha=proteina');
    expect(withoutSheet('?dia=2026-10-21&folha=proteina')).toBe('?dia=2026-10-21');
    expect(withoutSheet('?folha=menu&habito=caminhada')).toBe('');
    expect(withSheet('?folha=menu&habito=a', 'deslize', { habito: 'b' })).toBe('?folha=deslize&habito=b');
    // o deslize tocado num período sai junto com a folha
    expect(withoutSheet('?folha=deslize&habito=a&deslize=s1')).toBe('');
  });
});
