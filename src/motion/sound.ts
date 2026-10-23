// Som curto e grave da Web Audio (movimento.md › Vibração e som). Desligado por padrão: só toca com
// "Som suave ao marcar" ligado em Aparência, no nível 1 da escada. Nunca toca no modo silencioso (o Safari já respeita).
// A corrida usa playChime({ force: true }), porque lá o som das trocas fica ligado por padrão, com interruptor próprio.
import { getPreferences } from '@/app/preferences';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(from: number, to: number, seconds: number, peak: number) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.005;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + seconds * 0.8);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

/** O som suave ao marcar um hábito (só com a preferência ligada). Chame dentro do toque da pessoa. */
export function playSoftTick(): void {
  if (!getPreferences().sound) return;
  try {
    tone(330, 220, 0.16, 0.16);
  } catch {
    /* sem áudio: tudo segue igual */
  }
}

/** Som da troca de intervalo na corrida. force ignora a preferência geral (a corrida tem interruptor próprio). */
export function playChime(options: { force?: boolean } = {}): void {
  if (!options.force && !getPreferences().sound) return;
  try {
    tone(523, 392, 0.32, 0.22);
  } catch {
    /* sem áudio */
  }
}

/** Destrava o áudio no primeiro toque (o Safari só deixa tocar depois de um gesto). */
export function unlockAudio(): void {
  try {
    audio();
  } catch {
    /* sem áudio */
  }
}
