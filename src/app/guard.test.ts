import { describe, expect, it } from 'vitest';
import { guardRedirect, type GuardInput } from './guard';

const base: GuardInput = { status: 'ready', needsOnboarding: false, suggestInstall: false, pending: null };

describe('guardRedirect', () => {
  it('não mexe enquanto a sessão carrega', () => {
    expect(guardRedirect('/hoje', { ...base, status: 'loading' })).toBeNull();
  });

  it('sem sessão vai para Entrar, ou para Instalar no Safari do iPhone', () => {
    expect(guardRedirect('/hoje', { ...base, status: 'signedOut' })).toBe('/entrar');
    expect(guardRedirect('/hoje', { ...base, status: 'signedOut', suggestInstall: true })).toBe('/instalar');
    expect(guardRedirect('/entrar', { ...base, status: 'signedOut' })).toBeNull();
    expect(guardRedirect('/instalar', { ...base, status: 'signedOut' })).toBeNull();
  });

  it('o convite pelo link abre sem sessão', () => {
    expect(guardRedirect('/convite/abc', { ...base, status: 'signedOut' })).toBeNull();
  });

  it('conta sem acesso só vê a tela dela', () => {
    expect(guardRedirect('/hoje', { ...base, status: 'denied' })).toBe('/entrar/sem-acesso');
    expect(guardRedirect('/entrar/sem-acesso', { ...base, status: 'denied' })).toBeNull();
  });

  it('primeiro acesso vai para Começar 1 de 3', () => {
    expect(guardRedirect('/hoje', { ...base, needsOnboarding: true })).toBe('/comecar/1');
    expect(guardRedirect('/comecar/2', { ...base, needsOnboarding: true })).toBeNull();
  });

  it('com sessão, a entrada leva ao Hoje (ou ao link que a pessoa abriu antes de entrar)', () => {
    expect(guardRedirect('/entrar', base)).toBe('/hoje');
    expect(guardRedirect('/comecar/3', base)).toBe('/hoje');
    expect(guardRedirect('/entrar', { ...base, pending: '/progresso?periodo=mes' })).toBe('/progresso?periodo=mes');
    expect(guardRedirect('/ajustes/pilares', base)).toBeNull();
  });
});
