// RollingNumber: inteiro na serifa que rola algarismo por algarismo, com a largura de cada um animada.
// A Fraunces não tem algarismos tabulares: cada coluna mede a largura do próprio algarismo (demonstração 12 do laboratório).
// Subindo, as colunas rolam para cima; descendo (deslize), para baixo e devagar (fill, --ease-in-out).
// Colunas novas entram abrindo a largura; as que sobram saem fechando. Na montagem e no reduzido, troca de uma vez.
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { dur, ease } from '@/motion/tokens';
import { chanSet, chanStop, chanTo, makeChan, type Chan } from './channel';
import { useReduced } from './lib';
import './ui.css';

export type RollingNumberProps = {
  value: number;
  className?: string;
  /** texto para o leitor de tela; sem ele, o número fica escondido (quem usa já dá o nome) */
  srLabel?: string;
};

type Part = { key: string; d: number };
type Col = Part & { exiting?: boolean };
type Entry = { pos: Chan; width: Chan; op: Chan; d: number; exiting: boolean };

const mod10 = (n: number) => ((n % 10) + 10) % 10;
const order = (key: string) => Number(key.slice(1));

export function numberParts(value: number): Part[] {
  const s = String(Math.max(0, Math.round(value)));
  return s.split('').map((ch, k) => ({ key: `i${s.length - 1 - k}`, d: Number(ch) }));
}

function merge(prev: Col[], next: Part[]): Col[] {
  const keys = new Set(next.map((p) => p.key));
  const out: Col[] = next.map((p) => ({ ...p }));
  for (const c of prev) if (!keys.has(c.key)) out.push({ ...c, exiting: true });
  return out.sort((a, b) => order(b.key) - order(a.key));
}

export function RollingNumber({ value, className, srLabel }: RollingNumberProps) {
  const reduced = useReduced();
  const [cols, setCols] = useState<Col[]>(() => numberParts(value));
  const [shown, setShown] = useState({ value, dir: 0 });
  // estado derivado: a troca de valor recalcula as colunas na mesma renderização
  if (value !== shown.value) {
    setShown({ value, dir: value > shown.value ? 1 : -1 });
    setCols((prev) => merge(prev, numberParts(value)));
  }
  const dir = shown.dir;

  const rootRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const boxes = useRef(new Map<string, HTMLSpanElement>());
  const strips = useRef(new Map<string, HTMLSpanElement>());
  const entries = useRef(new Map<string, Entry>());
  const widths = useRef<number[]>([]);
  const first = useRef(true);

  const measure = () => {
    const m = measureRef.current;
    if (!m) return;
    const w: number[] = [];
    for (let d = 0; d < 10; d++) {
      m.textContent = String(d);
      w[d] = m.getBoundingClientRect().width;
    }
    m.textContent = '';
    widths.current = w;
  };
  const wOf = (d: number) => widths.current[d] ?? 0;

  useLayoutEffect(() => {
    if (first.current) measure();
    const isFirst = first.current;
    first.current = false;
    const slow = dir < 0;
    const fillT = { duration: dur.fill, ease: slow ? ease.inOut : ease.out };
    for (const c of cols) {
      const box = boxes.current.get(c.key);
      const strip = strips.current.get(c.key);
      if (!box || !strip) continue;
      let e = entries.current.get(c.key);
      if (!e) {
        const entering = !isFirst && !reduced && !c.exiting;
        const startPos = 10 + c.d - (entering ? dir : 0);
        e = {
          pos: makeChan(startPos, (v) => (strip.style.transform = `translateY(${-v}em)`)),
          width: makeChan(entering ? 0 : wOf(c.d), (v) => (box.style.width = `${v}px`)),
          op: makeChan(entering ? 0 : 1, (v) => (box.style.opacity = String(v))),
          d: c.d,
          exiting: false,
        };
        entries.current.set(c.key, e);
        if (entering) {
          chanTo(e.pos, 10 + c.d, fillT);
          chanTo(e.width, wOf(c.d), fillT);
          chanTo(e.op, 1, fillT);
        }
        continue;
      }
      if (c.exiting) {
        if (e.exiting) continue;
        e.exiting = true;
        const key = c.key;
        const done = () => {
          entries.current.delete(key);
          setCols((prev) => prev.filter((x) => !(x.key === key && x.exiting)));
        };
        if (reduced) {
          done();
          continue;
        }
        chanTo(e.op, 0, { duration: dur.fill * 0.6, ease: ease.exit });
        chanTo(e.width, 0, fillT).then((ok) => ok && e.exiting && done());
        continue;
      }
      if (e.exiting) {
        // voltou antes de sair
        e.exiting = false;
        chanTo(e.op, 1, fillT);
      }
      if (e.d !== c.d || Math.abs(e.width.v - wOf(c.d)) > 0.1) {
        e.d = c.d;
        if (reduced) {
          chanSet(e.pos, 10 + c.d);
          chanSet(e.width, wOf(c.d));
          chanSet(e.op, 1);
          continue;
        }
        // gira na direção do tempo até o algarismo novo, partindo de onde a coluna está
        const pn = mod10(e.pos.v - 10) + 10;
        chanSet(e.pos, pn);
        let t: number;
        if (dir > 0) {
          t = Math.ceil(pn - 1e-3);
          while (mod10(t) !== c.d) t++;
        } else if (dir < 0) {
          t = Math.floor(pn + 1e-3);
          while (mod10(t) !== c.d) t--;
        } else t = 10 + c.d;
        const target = t;
        const entry = e;
        chanTo(entry.pos, target, fillT).then((ok) => {
          if (ok) chanSet(entry.pos, mod10(target) + 10);
        });
        chanTo(e.width, wOf(c.d), fillT);
      }
    }
  }, [cols, reduced, dir]);

  // a Fraunces pode chegar depois: mede de novo e acerta as larguras, sem animar
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      measure();
      entries.current.forEach((e) => {
        if (!e.exiting) chanSet(e.width, wOf(e.d));
      });
    });
    const all = entries.current;
    return () => {
      alive = false;
      all.forEach((e) => [e.pos, e.width, e.op].forEach(chanStop));
    };
  }, []);

  return (
    <span ref={rootRef} className={clsx('pk-roll', className)}>
      <span aria-hidden="true" style={{ display: 'inline-flex' }}>
        {cols.map((c) => (
          <span
            key={c.key}
            className="pk-roll-c"
            ref={(el) => {
              if (el) boxes.current.set(c.key, el);
              else boxes.current.delete(c.key);
            }}
          >
            <span
              className="pk-roll-s"
              ref={(el) => {
                if (el) strips.current.set(c.key, el);
                else strips.current.delete(c.key);
              }}
            >
              {Array.from({ length: 30 }, (_, k) => (
                <span key={k}>{k % 10}</span>
              ))}
            </span>
          </span>
        ))}
      </span>
      <span ref={measureRef} className="pk-roll-m" aria-hidden="true" />
      {srLabel != null && <span className="pk-sr">{srLabel}</span>}
    </span>
  );
}
