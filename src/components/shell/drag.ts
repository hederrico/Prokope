// Arrasto com ponteiro, igual ao do laboratório (docs/interacao/laboratorio/lab.js › drag):
// o movimento é ouvido na janela desde o toque, mas o ponteiro só é capturado depois de 5 px na direção certa,
// para os toques nos filhos continuarem funcionando. A velocidade é medida nos últimos 80 ms; se o dedo parou
// antes de soltar, ela é zero.
import { gesture } from '@/motion/tokens';

export interface DragOptions {
  axis: 'x' | 'y';
  /** decide se este toque pode virar arrasto */
  filter?: (e: PointerEvent) => boolean;
  /** o arrasto começou (passou da folga de 5 px) */
  begin?: (e: PointerEvent) => void;
  /** dx e dy desde o toque */
  move: (dx: number, dy: number, e: PointerEvent) => void;
  /** soltou: deslocamento e velocidade (px/s) */
  end: (dx: number, dy: number, vx: number, vy: number) => void;
  /** soltou sem arrastar (um toque) */
  tap?: (e: PointerEvent) => void;
  /** desistiu: o dedo foi para o outro eixo antes de começar */
  abandon?: () => void;
}

type Point = [t: number, x: number, y: number];

export function attachDrag(el: HTMLElement, o: DragOptions): () => void {
  let a: { id: number; x0: number; y0: number; pts: Point[]; on: boolean } | null = null;

  function stop() {
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onEnd, true);
    window.removeEventListener('pointercancel', onEnd, true);
  }

  function onDown(e: PointerEvent) {
    if (a) stop();
    a = null;
    if (e.button !== 0) return;
    if (o.filter && !o.filter(e)) return;
    a = { id: e.pointerId, x0: e.clientX, y0: e.clientY, pts: [[e.timeStamp, e.clientX, e.clientY]], on: false };
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onEnd, true);
    window.addEventListener('pointercancel', onEnd, true);
  }

  function onMove(e: PointerEvent) {
    if (!a || e.pointerId !== a.id) return;
    const dx = e.clientX - a.x0;
    const dy = e.clientY - a.y0;
    if (!a.on) {
      const main = o.axis === 'x' ? dx : dy;
      const cross = o.axis === 'x' ? dy : dx;
      if (Math.abs(main) < gesture.slop) {
        if (Math.abs(cross) > 10) {
          a = null;
          stop();
          o.abandon?.();
        }
        return;
      }
      a.on = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* o navegador já soltou o ponteiro */
      }
      o.begin?.(e);
    }
    a.pts.push([e.timeStamp, e.clientX, e.clientY]);
    while (a.pts.length > 2 && e.timeStamp - a.pts[0][0] > 100) a.pts.shift();
    o.move(dx, dy, e);
  }

  function onEnd(e: PointerEvent) {
    if (!a || e.pointerId !== a.id) return;
    const w = a;
    a = null;
    stop();
    if (!w.on) {
      if (e.type === 'pointerup') o.tap?.(e);
      return;
    }
    const lastPt = w.pts[w.pts.length - 1];
    // cancelado pelo navegador: solta no último ponto conhecido, sem velocidade
    if (e.type === 'pointercancel') {
      o.end(lastPt[1] - w.x0, lastPt[2] - w.y0, 0, 0);
      return;
    }
    let first = w.pts[0];
    for (const p of w.pts) {
      if (e.timeStamp - p[0] <= 80) {
        first = p;
        break;
      }
    }
    const dt = (e.timeStamp - first[0]) / 1000;
    let vx = 0;
    let vy = 0;
    if (dt > 0.008 && e.timeStamp - lastPt[0] < 80) {
      vx = (e.clientX - first[1]) / dt;
      vy = (e.clientY - first[2]) / dt;
    }
    o.end(e.clientX - w.x0, e.clientY - w.y0, vx, vy);
  }

  el.addEventListener('pointerdown', onDown);
  return () => {
    el.removeEventListener('pointerdown', onDown);
    stop();
  };
}
