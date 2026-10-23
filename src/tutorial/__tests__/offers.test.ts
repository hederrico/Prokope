// Quando o Zeno se oferece (offerStore.ts): a apresentação no Hoje e um capítulo por aba, uma vez só.
import { tutorialOf } from '@/domain/tutorial';
import { chapterAt, offerFor } from '../offerStore';

const fresh = tutorialOf(null);
const met = tutorialOf({ tutorial: { introAt: 1 } });

describe('chapterAt', () => {
  it('a raiz das abas e a tela de um hábito', () => {
    expect(chapterAt('/progresso')).toBe('progresso');
    expect(chapterAt('/jornada')).toBe('jornada');
    expect(chapterAt('/ajustes')).toBe('ajustes');
    expect(chapterAt('/hoje/habito/caminhada')).toBe('habito');
    expect(chapterAt('/progresso/habito/caminhada')).toBe('habito');
    expect(chapterAt('/ajustes/habitos/caminhada')).toBe('habito');
    expect(chapterAt('/ajustes/habitos/novo')).toBeNull();
    expect(chapterAt('/ajustes/habitos')).toBeNull();
    expect(chapterAt('/hoje')).toBeNull();
    expect(chapterAt('/jornada/fases')).toBeNull();
  });
});

describe('offerFor', () => {
  it('a apresentação: conta com plano, no Hoje, antes de o Zeno se apresentar', () => {
    expect(offerFor({ path: '/hoje', search: '', hasPlan: true, tutorial: fresh })).toBe('intro');
    expect(offerFor({ path: '/hoje', search: '?dia=2026-10-21', hasPlan: true, tutorial: fresh })).toBeNull();
    expect(offerFor({ path: '/hoje', search: '?folha=agua', hasPlan: true, tutorial: fresh })).toBeNull();
    expect(offerFor({ path: '/progresso', search: '', hasPlan: true, tutorial: fresh })).toBeNull();
    // sem plano é o Começar, onde o Zeno já conversa
    expect(offerFor({ path: '/hoje', search: '', hasPlan: false, tutorial: fresh })).toBeNull();
  });

  it('um capítulo: depois da apresentação, se não foi visto nem oferecido', () => {
    expect(offerFor({ path: '/progresso', search: '?periodo=semana', hasPlan: true, tutorial: met })).toBe('progresso');
    expect(offerFor({ path: '/hoje', search: '', hasPlan: true, tutorial: met })).toBeNull();
    const offered = tutorialOf({ tutorial: { introAt: 1, offered: { progresso: 2 } } });
    expect(offerFor({ path: '/progresso', search: '', hasPlan: true, tutorial: offered })).toBeNull();
    const seen = tutorialOf({ tutorial: { introAt: 1, done: { jornada: 2 } } });
    expect(offerFor({ path: '/jornada', search: '', hasPlan: true, tutorial: seen })).toBeNull();
    expect(offerFor({ path: '/ajustes', search: '', hasPlan: true, tutorial: seen })).toBe('ajustes');
  });
});
