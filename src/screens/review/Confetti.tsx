// Confetti: o único confete do app (laboratório › 13 Fase desbloqueada). 40 peças nas cores dos pilares caem
// devagar, uma vez, em `confetti` (1.600 ms); 18 pousam ao redor do emblema, longe do texto e do pé, e ficam paradas.
// Sem loop e sem gravidade que quica. Com movimento reduzido (ou ao reabrir), já aparece parado. Decorativo.
import { useEffect, useRef, type RefObject } from 'react';
import { dur } from '@/motion';
import { pillarAttrs, type PillarColor } from '@/components/ui';

export interface ConfettiProps {
  /** cores dos pilares da pessoa (chaves da paleta); a primária entra junto */
  colors: PillarColor[];
  /** cair agora (true) ou já parado (false) */
  play: boolean;
  /** começar depois de (ms) */
  delay?: number;
  /** emblema, textos a evitar e o pé (onde as peças não pousam) */
  emblem: RefObject<HTMLElement | null>;
  avoid: RefObject<HTMLElement | null>[];
  foot: RefObject<HTMLElement | null>;
}

interface Piece {
  k: number;
  c: number;
  stays: boolean;
  delay: number;
  dur: number;
  r0: number;
  r1: number;
  spin: number;
  sw: number;
  f: number;
  ph: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const clamp = (lo: number, hi: number, v: number) => Math.max(lo, Math.min(hi, v));

export function Confetti({ colors, play, delay = 0, emblem, avoid, foot }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const swatchRef = useRef<HTMLSpanElement>(null);
  const state = useRef<{ pieces: Piece[]; cols: string[]; W: number; H: number; running: boolean } | null>(null);

  // depois do commit inteiro: as referências do emblema, do texto e do pé (que vêm depois na árvore) já existem
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const readCols = () =>
      [...(swatchRef.current?.children ?? [])].map((el) => getComputedStyle(el).color || '#999');

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const win = host.getBoundingClientRect();
      const rel = (el: HTMLElement | null) => {
        const r = el?.getBoundingClientRect();
        return r ? { l: r.left - win.left, t: r.top - win.top, r: r.right - win.left, b: r.bottom - win.top } : null;
      };
      const emb = rel(emblem.current) ?? { l: W / 2 - 56, r: W / 2 + 56, t: 92, b: 204 };
      const cx = (emb.l + emb.r) / 2;
      const cy = (emb.t + emb.b) / 2;
      const txt = avoid.map((r) => rel(r.current)).filter((x): x is NonNullable<typeof x> => !!x);
      const footTop = rel(foot.current)?.t ?? H;
      // as peças pousam ao redor do emblema e do título, como no quadro (não no vazio acima do pé)
      const textBottom = txt.reduce((m, b) => Math.max(m, b.b), emb.b);
      const maxY = Math.min(footTop - 40, textBottom + 48);
      let seed = 11;
      const rnd = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
      const rest: [number, number][] = [];
      for (let tries = 0; rest.length < 18 && tries < 4000; tries++) {
        const x = 18 + rnd() * (W - 36);
        const y = 14 + rnd() * (maxY - 14);
        if (Math.hypot(x - cx, y - cy) < 96) continue;
        if (txt.some((b) => x > b.l - 18 && x < b.r + 18 && y > b.t - 14 && y < b.b + 14)) continue;
        if (rest.some((p) => Math.abs(p[0] - x) < 42 && Math.abs(p[1] - y) < 42)) continue;
        rest.push([x, y]);
      }
      const pieces: Piece[] = [];
      for (let i = 0; i < 40; i++) {
        const stays = i < rest.length;
        const p: Piece = {
          k: i % 4,
          c: i % 5,
          stays,
          delay: rnd() * 380,
          dur: 0,
          r0: rnd() * 360,
          r1: 0,
          spin: (rnd() - 0.5) * 540,
          sw: 5 + rnd() * 12,
          f: 1.1 + rnd(),
          ph: rnd() * 6.28,
          x0: 0,
          y0: 0,
          x1: 0,
          y1: 0,
        };
        p.dur = Math.min(dur.confetti * 1000 - p.delay, 1050 + rnd() * 400);
        if (stays) {
          p.x1 = rest[i][0];
          p.y1 = rest[i][1];
          p.x0 = p.x1 + (rnd() - 0.5) * 50;
          p.y0 = p.y1 - 170 - rnd() * 170;
          p.r1 = Math.round(rnd() * 180);
        } else {
          p.x0 = 10 + rnd() * (W - 20);
          p.y0 = -30 + rnd() * 240;
          p.x1 = p.x0 + (rnd() - 0.5) * 70;
          p.y1 = p.y0 + 260 + rnd() * 160;
        }
        pieces.push(p);
      }
      state.current = { pieces, cols: readCols(), W, H, running: false };
    };

    const shape = (p: Piece, x: number, y: number, rot: number, a: number) => {
      const s = state.current!;
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x, y);
      ctx.rotate((rot * Math.PI) / 180);
      const col = s.cols[p.c % s.cols.length] ?? '#999';
      ctx.fillStyle = col;
      ctx.strokeStyle = col;
      if (p.k === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 3.4, 0, 6.2832);
        ctx.fill();
      } else if (p.k === 1) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-2, -5.5, 4, 11, 2);
        else ctx.rect(-2, -5.5, 4, 11);
        ctx.fill();
      } else if (p.k === 2) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -4.6);
        ctx.lineTo(4.2, 3.1);
        ctx.lineTo(-4.2, 3.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.lineCap = 'round';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6.5, 0);
        ctx.quadraticCurveTo(-3.25, -3.6, 0, 0);
        ctx.quadraticCurveTo(3.25, 3.6, 6.5, 0);
        ctx.stroke();
      }
      ctx.restore();
    };

    const still = () => {
      const s = state.current!;
      ctx.clearRect(0, 0, s.W, s.H);
      for (const p of s.pieces) if (p.stays) shape(p, p.x1, p.y1, p.r1, 1);
    };

    const frame = (t: number) => {
      const s = state.current!;
      ctx.clearRect(0, 0, s.W, s.H);
      for (const p of s.pieces) {
        const u = clamp(0, 1, (t - p.delay) / p.dur);
        if (u <= 0) continue;
        const sway = Math.sin(p.f * 6.2832 * (t / 1000) + p.ph) * p.sw;
        if (p.stays) {
          const e = 1 - Math.pow(1 - u, 3);
          shape(p, p.x0 + (p.x1 - p.x0) * e + sway * (1 - e), p.y0 + (p.y1 - p.y0) * e, p.r0 + (p.r1 - p.r0) * e, Math.min(1, u * 8));
        } else {
          shape(
            p,
            p.x0 + (p.x1 - p.x0) * u + sway,
            p.y0 + (p.y1 - p.y0) * u,
            p.r0 + p.spin * u,
            Math.min(1, u * 8) * (u < 0.55 ? 1 : (1 - u) / 0.45),
          );
        }
      }
    };

    setup();
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (play) {
      ctx.clearRect(0, 0, state.current!.W, state.current!.H);
      timer = setTimeout(() => {
        const t0 = performance.now();
        state.current!.running = true;
        const loop = () => {
          const t = performance.now() - t0;
          if (t >= dur.confetti * 1000) {
            state.current!.running = false;
            still();
            return;
          }
          frame(t);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      }, delay);
    } else still();

    // tema trocado: as peças paradas trocam de cor junto
    const recolor = () =>
      requestAnimationFrame(() => {
        if (!state.current) return;
        state.current.cols = readCols();
        if (!state.current.running) still();
      });
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', recolor);
    const mo = new MutationObserver(recolor);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      mq.removeEventListener('change', recolor);
      mo.disconnect();
    };
    // a queda acontece uma vez, na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.current) state.current.cols = [...(swatchRef.current?.children ?? [])].map((el) => getComputedStyle(el).color);
  }, [colors]);

  return (
    <>
      <canvas ref={canvasRef} className="rv-conf" aria-hidden="true" />
      <span ref={swatchRef} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        {[...colors, 'accent' as PillarColor].map((c, i) => {
          const a = pillarAttrs(c);
          return <i key={`${c}-${i}`} className={a.className} data-pillar={a['data-pillar']} data-hue={a['data-hue']} style={{ color: 'var(--mark)' }} />;
        })}
      </span>
    </>
  );
}
