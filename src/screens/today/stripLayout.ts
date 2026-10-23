// A faixa do dia do Resumo (hoje.md › Os três jeitos): onde cada ponto fica na largura da faixa e quais pontos
// dividem a mesma área de toque. Pontos do mesmo horário (ou quase) ficam lado a lado, centrados no horário deles,
// nunca um em cima do outro; pontos a menos de 44 px viram um alvo só, que leva às linhas de todos eles.

export interface StripInput {
  id: string;
  /** minutos do dia lógico */
  minutes: number;
}

export interface StripDot {
  id: string;
  /** centro do ponto, em px a partir da borda esquerda da faixa */
  x: number;
}

/** Uma área de toque (44 px ou mais) com os pontos que ela cobre. */
export interface StripTarget {
  ids: string[];
  dots: StripDot[];
  x0: number;
  x1: number;
}

export interface StripGeometry {
  /** trecho do dia, em minutos do dia lógico */
  start: number;
  end: number;
  /** largura da faixa em px */
  width: number;
  /** distância entre os centros de dois pontos lado a lado (ponto de 14 px + 4 px) */
  step?: number;
  /** área mínima de toque */
  hit?: number;
  /** da borda até o começo do trecho (o primeiro horário não encosta na borda) */
  pad?: number;
  /** quanto a área de toque pode passar da faixa (a margem lateral da tela) */
  overflow?: number;
}

const STEP = 18;
const HIT = 44;
const PAD = 10;
const OVERFLOW = 12;

/** A posição de um horário na faixa (px), presa ao trecho. */
export function stripX(minutes: number, g: StripGeometry): number {
  const pad = g.pad ?? PAD;
  const span = Math.max(1, g.end - g.start);
  const t = Math.min(1, Math.max(0, (minutes - g.start) / span));
  return pad + t * Math.max(0, g.width - 2 * pad);
}

interface Run {
  members: { id: string; x: number }[];
  center: number;
}

/** Os pontos e as áreas de toque da faixa, da esquerda para a direita. */
export function stripTargets(points: StripInput[], g: StripGeometry): StripTarget[] {
  const step = g.step ?? STEP;
  const hit = g.hit ?? HIT;
  const pad = g.pad ?? PAD;
  const overflow = g.overflow ?? OVERFLOW;
  const lo = pad;
  const hi = g.width - pad;
  const half = (r: Run) => ((r.members.length - 1) * step) / 2;
  const place = (r: Run) => {
    const mean = r.members.reduce((s, m) => s + m.x, 0) / r.members.length;
    const h = half(r);
    r.center = lo + h > hi - h ? (lo + hi) / 2 : Math.min(hi - h, Math.max(lo + h, mean));
  };

  // estável: no mesmo horário, fica a ordem de chegada (a da lista)
  const runs: Run[] = [...points]
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.minutes - b.p.minutes || a.i - b.i)
    .map(({ p }) => {
      const r: Run = { members: [{ id: p.id, x: stripX(p.minutes, g) }], center: 0 };
      place(r);
      return r;
    });

  // junta os grupos que se encostam, até nenhum encostar (cada junção recentra o grupo no horário médio)
  for (let merged = true; merged;) {
    merged = false;
    for (let i = 1; i < runs.length; i++) {
      const a = runs[i - 1]!;
      const b = runs[i]!;
      if (b.center - half(b) - (a.center + half(a)) < step - 0.01) {
        const r: Run = { members: [...a.members, ...b.members], center: 0 };
        place(r);
        runs.splice(i - 1, 2, r);
        merged = true;
        break;
      }
    }
  }

  const dots: StripDot[] = runs.flatMap((r) =>
    r.members.map((m, k) => ({ id: m.id, x: r.center - half(r) + k * step })),
  );

  // pontos a menos de 44 px dividem a área de toque
  const targets: StripTarget[] = [];
  for (const d of dots) {
    const t = targets[targets.length - 1];
    if (t && d.x - t.dots[t.dots.length - 1]!.x < hit) {
      t.dots.push(d);
      t.ids.push(d.id);
    } else targets.push({ ids: [d.id], dots: [d], x0: 0, x1: 0 });
  }
  for (const t of targets) {
    let x0 = Math.max(-overflow, t.dots[0]!.x - hit / 2);
    let x1 = Math.min(g.width + overflow, t.dots[t.dots.length - 1]!.x + hit / 2);
    // presa na borda, a área cresce para o outro lado e continua com 44 px
    if (x1 - x0 < hit) {
      if (x0 <= -overflow) x1 = x0 + hit;
      else x0 = x1 - hit;
    }
    t.x0 = x0;
    t.x1 = x1;
  }
  return targets;
}

/** As marcas de hora da faixa: de 3 em 3 horas (6h, 9h, 12h...), dentro do trecho. */
export function stripTicks(start: number, end: number, every = 180): number[] {
  const ticks: number[] = [];
  for (let m = Math.ceil(start / every) * every; m <= end; m += every) ticks.push(m);
  return ticks;
}
