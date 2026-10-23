// O laço de desenho do Zeno: só roda enquanto há o que mostrar. Nas ações, a 60 quadros por segundo; à toa ou
// dormindo, a 30, que basta para respirar, piscar e mudar o olhar. Para quando ele sai de cena e assenta, e quando
// o app vai para o fundo (visibilitychange). O tempo da cena vem do relógio de verdade, não do carimbo do quadro:
// há navegadores que entregam quadros fora do ritmo, e um aparelho lento mostra a cena mais devagar sem pular pedaços.

export interface LoopHooks {
  /** um quadro: anda dt segundos de cena e desenha */
  frame(dt: number): void;
  /** ainda há o que desenhar */
  busy(): boolean;
  /** só respiração, piscadas e olhares: basta a 30 quadros por segundo */
  calm(): boolean;
  /** pode desenhar (o palco está montado) */
  ready(): boolean;
  /** começou ou parou de desenhar */
  changed?(drawing: boolean): void;
}

/** O maior passo de um quadro (s): depois de uma pausa longa, a cena continua de onde estava. */
const MAX_DT = 0.05;

export class FrameLoop {
  private raf = 0;
  private nap: ReturnType<typeof setTimeout> | 0 = 0;
  private last = 0;
  private fpsN = 0;
  private fpsT = 0;
  private stopped: (() => void)[] = [];
  /** quadros desenhados desde o começo (os testes contam por aqui) */
  frames = 0;
  /** quadros por segundo, medidos a cada meio segundo */
  fps = 0;
  /** só para capturas: segura o tempo da cena */
  frozen = false;

  constructor(private readonly hooks: LoopHooks) {
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  get drawing(): boolean {
    return this.raf !== 0 || this.nap !== 0;
  }

  /** o ritmo agora: 60, 30 ou 0 (parado) */
  get rate(): 0 | 30 | 60 {
    if (!this.drawing) return 0;
    return this.nap || this.hooks.calm() ? 30 : 60;
  }

  wake(): void {
    if (document.hidden || !this.hooks.ready()) return;
    if (this.nap) {
      clearTimeout(this.nap);
      this.nap = 0;
      this.raf = requestAnimationFrame(this.tick);
      return;
    }
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
      this.hooks.changed?.(true);
    }
  }

  /** resolve quando o laço para (na hora, se já está parado) */
  whenStopped(): Promise<void> {
    if (!this.drawing) return Promise.resolve();
    return new Promise((res) => this.stopped.push(res));
  }

  stop(): void {
    const was = this.drawing;
    cancelAnimationFrame(this.raf);
    if (this.nap) clearTimeout(this.nap);
    this.raf = 0;
    this.nap = 0;
    if (was) this.settle();
  }

  dispose(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  private settle() {
    this.fps = 0;
    this.hooks.changed?.(false);
    for (const res of this.stopped.splice(0)) res();
  }

  private readonly onVisibility = () => {
    if (!document.hidden) {
      this.wake();
      return;
    }
    // no fundo, nada desenha; quem espera o laço parar segue em frente
    const was = this.drawing;
    cancelAnimationFrame(this.raf);
    if (this.nap) clearTimeout(this.nap);
    this.raf = 0;
    this.nap = 0;
    if (was) this.settle();
  };

  private readonly tick = () => {
    this.frames++;
    const now = performance.now();
    const real = Math.min(MAX_DT, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.hooks.frame(this.frozen ? 0 : real);
    this.fpsN++;
    if (now - this.fpsT > 500) {
      this.fps = Math.round((this.fpsN * 1000) / (now - this.fpsT));
      this.fpsN = 0;
      this.fpsT = now;
    }
    if (!this.hooks.busy()) {
      this.raf = 0;
      this.settle();
    } else if (this.hooks.calm()) {
      this.raf = 0;
      this.nap = setTimeout(
        () => {
          this.nap = 0;
          this.raf = requestAnimationFrame(this.tick);
        },
        1000 / 30 - 6,
      );
    } else this.raf = requestAnimationFrame(this.tick);
  };
}
