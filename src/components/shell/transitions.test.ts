import { describe, expect, it } from 'vitest';
import { rootTransition, tabTransition } from './transitions';

const push = { action: 'PUSH' as const, delta: 1, state: null };
const back = { action: 'POP' as const, delta: -1, state: null };
const replacePop = { action: 'REPLACE' as const, delta: 0, state: { transition: 'pop' } };

describe('tabTransition', () => {
  it('outra aba troca só a opacidade', () => {
    expect(tabTransition('/hoje', '/ajustes/pilares', push)).toBe('tab');
  });
  it('na mesma aba, mais fundo empurra e o voltar volta', () => {
    expect(tabTransition('/ajustes', '/ajustes/pilares', push)).toBe('push');
    expect(tabTransition('/ajustes/pilares', '/ajustes', back)).toBe('pop');
    expect(tabTransition('/ajustes/pilares', '/ajustes', replacePop)).toBe('pop');
    expect(tabTransition('/hoje/habito/a', '/hoje/habito/b', push)).toBe('push');
  });
  it('o voltar do navegador para frente empurra', () => {
    expect(tabTransition('/ajustes', '/ajustes/pilares', { action: 'POP', delta: 1, state: null })).toBe('push');
  });
});

describe('rootTransition', () => {
  it('tela cheia sobe e desce', () => {
    expect(rootTransition('/ajustes/pilares', '/ajustes/pilares/novo', push)).toBe('openFull');
    expect(rootTransition('/ajustes/pilares/novo', '/ajustes/pilares', back)).toBe('closeFull');
    expect(rootTransition('/revisao/2026-W43/3', '/hoje', replacePop)).toBe('closeFull');
  });
  it('entrar no app é uma troca suave', () => {
    expect(rootTransition('/entrar', '/hoje', { action: 'REPLACE', delta: 0, state: null })).toBe('fade');
    expect(rootTransition('/comecar/3', '/hoje', { action: 'REPLACE', delta: 0, state: null })).toBe('fade');
    expect(rootTransition('/entrar', '/entrar/sem-acesso', { action: 'REPLACE', delta: 0, state: null })).toBe(
      'fadeBase',
    );
  });
  it('a troca seca pedida pela tela (state.transition: none) não sobe nem desce', () => {
    const none = { action: 'REPLACE' as const, delta: 0, state: { transition: 'none' } };
    expect(rootTransition('/corrida/1/1', '/corrida/1/1/feito', none)).toBe('none');
    expect(rootTransition('/revisao/2026-10-26/3', '/fase/3', none)).toBe('none');
    expect(rootTransition('/revisao/2026-10-26/3', '/revisao/2026-10-26/fim', none)).toBe('none');
  });
  it('de uma tela cheia para outra: abre por cima, ou desce ao voltar', () => {
    expect(rootTransition('/ajustes/pilares/novo', '/ajustes/habitos/novo/tipo', push)).toBe('openFull');
    expect(rootTransition('/ajustes/habitos/novo/tipo', '/ajustes/pilares/novo', back)).toBe('closeFull');
    expect(rootTransition('/entrar', '/comecar/1', push)).toBe('openFull');
  });
});
