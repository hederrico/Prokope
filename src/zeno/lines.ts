// As falas das cenas prontas, as mesmas do laboratório (docs/mascote/laboratorio.html). O Zeno não desenha texto:
// a cena mexe a boca pelo tempo da fala, e quem conduz põe a mesma frase no balão.
import type { ZenoScene } from './types';

export const ZENO_LINES: Record<ZenoScene, string | null> = {
  acenar: 'Oi!',
  casco: 'Cada cor é um pilar seu.',
  checkin: 'Como foi hoje?',
  obrigado: 'Obrigado por contar.',
  dia: 'Dia fechado.',
  fase: 'Fase nova!',
  pausa: 'Pausa ligada. Bom descanso.',
  noite: 'Daqui a pouco é hora de desligar as telas.',
  cochilo: null,
  acordar: 'Opa, cochilei.',
  sair: 'Até amanhã.',
};

/** O "oi" de quando tocam nele, sorteado. */
export const BOOP_LINES = ['Oi!', 'Hehe.', 'Tô aqui.'] as const;

/** Quanto tempo a boca mexe para uma fala (s): o mesmo do laboratório, no máximo 2,2 s. */
export function talkSeconds(text: string): number {
  return Math.min(2.2, 0.35 + text.length * 0.045);
}
