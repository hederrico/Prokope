// Peças das folhas de registro (registros.md; quadro: f-registros.js): o título com a bolha do pilar,
// a lista do dia da proteína e da água (o − tira uma porção, deslizar apaga a linha, a faixa com Desfazer),
// o botão rápido com ícone e o valor que rola com o NumberFlow.
import clsx from 'clsx';
import { AnimatePresence, animate, m, useMotionValue } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { removeEntries, removeEntry, type Undo } from '@/actions';
import { attachDrag } from '@/components/shell/drag';
import { NumberFlow, PillarBubble, pillarAttrs, useReduced, type PillarColor } from '@/components/ui';
import { useTapGuard } from '@/components/ui/lib';
import { formatTime, timeOf, useNow, type useCounter } from '@/data';
import { Icon, type IconName } from '@/icons';
import { dur, ease, rubberband, spring, tween } from '@/motion/tokens';
import { removedLabel, spokenAmount } from './lib';
import './sheets.css';

export type CounterView = NonNullable<ReturnType<typeof useCounter>>;
export type Line = CounterView['lines'][number];

/** Atributos que pintam um bloco com a cor do pilar (data-pillar ou .hued). */
export function Painted({
  pillar,
  className,
  children,
  as: Tag = 'div',
}: {
  pillar?: PillarColor;
  className?: string;
  children: ReactNode;
  as?: 'div' | 'span';
}) {
  const p = pillarAttrs(pillar);
  return (
    <Tag className={clsx(className, p.className)} data-pillar={p['data-pillar']} data-hue={p['data-hue']}>
      {children}
    </Tag>
  );
}

/** Título da folha: a bolha do pilar e o texto (quadro: ttl()). */
export function SheetTitle({ icon, pillar, children }: { icon: IconName; pillar?: PillarColor; children: ReactNode }) {
  return (
    <span className="rg-ttl">
      <PillarBubble icon={icon} pillar={pillar} size="sm" />
      {children}
    </span>
  );
}

/** O dia do registro, quando a folha grava num dia que passou (&dia=). */
export function DayNote({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <p className="rg-foot" style={{ color: 'var(--text-2)' }}>
      <Icon name="calendar-blank" weight="regular" />
      {label}
    </p>
  );
}

/** Valor com unidade que rola: "18 g", "1 L", "500 ml". */
export function Amount({ value, unit, delay }: { value: number; unit: string | undefined; delay?: number }) {
  if (unit === 'ml' && value >= 1000) {
    return (
      <>
        <NumberFlow value={value / 1000} delay={delay} format={{ maximumFractionDigits: 2 }} /> L
      </>
    );
  }
  return (
    <>
      <NumberFlow value={value} delay={delay} format={{ maximumFractionDigits: 1 }} />
      {unit ? ` ${unit}` : ''}
    </>
  );
}

/** Botão rápido da folha da proteína, com o ícone do alimento (quadro: .xb-qa .q). Trava de 120 ms. */
export function FoodTile({
  name,
  amount,
  unit,
  icon,
  onAdd,
}: {
  name: string;
  amount: number;
  unit: string | undefined;
  icon: IconName;
  onAdd: () => void;
}) {
  const guarded = useTapGuard(onAdd, 120);
  return (
    <button
      type="button"
      className="pk-reset pk-q pk-press"
      aria-label={`Somar ${name.toLocaleLowerCase('pt-BR')}, ${spokenAmount(amount, unit)}`}
      onClick={() => guarded()}
    >
      <Icon name={icon} />
      <b>{name}</b>
      <small>
        +{amount}
        {unit ? ` ${unit}` : ''}
      </small>
    </button>
  );
}

// ---------- lista do dia ----------

interface Gone {
  name: string;
  at: number;
  undo: Undo;
}

/** A chave estável da linha: a primeira entrada dela (as novas juntam por cima e a chave não muda). */
const lineKey = (l: Line) => l.entryIds[l.entryIds.length - 1] ?? l.key;

export interface EntryListProps {
  lines: Line[];
  unit: string | undefined;
  nameOf: (line: Line) => string;
  iconOf: (line: Line) => IconName;
  /** depois de tirar uma porção ou apagar (o anúncio do total) */
  onChanged?: () => void;
  /** texto da lista vazia */
  empty?: string;
}

/** A lista de hoje, a mais recente no topo. Cada linha tem o − visível; a última porção vira a faixa com Desfazer. */
export function EntryList({ lines, unit, nameOf, iconOf, onChanged, empty = 'Nenhum registro hoje.' }: EntryListProps) {
  const reduced = useReduced();
  const { clock } = useNow();
  const [gone, setGone] = useState<Record<string, Gone>>({});
  const [open, setOpen] = useState<string | null>(null);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => clearTimeout(id));
  }, []);

  function drop(key: string) {
    const id = timers.current.get(key);
    if (id) clearTimeout(id);
    timers.current.delete(key);
    setGone((g) => {
      if (!g[key]) return g;
      const next = { ...g };
      delete next[key];
      return next;
    });
  }

  function markGone(key: string, name: string, at: number, undo: Undo) {
    setGone((g) => ({ ...g, [key]: { name, at, undo } }));
    const old = timers.current.get(key);
    if (old) clearTimeout(old);
    timers.current.set(
      key,
      window.setTimeout(() => drop(key), 5000),
    );
  }

  async function removeOne(line: Line) {
    const key = lineKey(line);
    const last = line.count <= 1;
    const undo = await removeEntry(line.entryIds[0]!, { portions: 1 });
    if (last) markGone(key, nameOf(line), line.at, undo);
    onChanged?.();
  }

  async function removeLine(line: Line) {
    const key = lineKey(line);
    setOpen(null);
    const undo = await removeEntries(line.entryIds);
    markGone(key, nameOf(line), line.at, undo);
    onChanged?.();
  }

  async function restore(key: string) {
    const g = gone[key];
    if (!g) return;
    await g.undo();
    drop(key);
    onChanged?.();
  }

  // as linhas dos dados, e as faixas de quem saiu, no lugar de onde saíram
  type Row = { key: string; line?: Line; gone?: Gone };
  const keys = new Set(lines.map(lineKey));
  const rows: Row[] = lines.map((l) => ({ key: lineKey(l), line: l }));
  for (const [key, g] of Object.entries(gone)) {
    if (keys.has(key)) continue;
    const i = rows.findIndex((r) => (r.line?.at ?? r.gone?.at ?? 0) < g.at);
    rows.splice(i < 0 ? rows.length : i, 0, { key, gone: g });
  }

  if (!rows.length) return <p className="rg-empty">{empty}</p>;

  const enter = reduced
    ? { height: { duration: 0 }, opacity: tween.micro }
    : { height: spring.calma, opacity: tween.base };
  const leave = reduced
    ? { height: { duration: 0, delay: dur.micro }, opacity: tween.micro }
    : { height: { duration: dur.base, ease: ease.exit }, opacity: { duration: dur.micro, ease: ease.exit } };

  return (
    <div className="rg-list" role="list" aria-label="Registros de hoje">
      <AnimatePresence initial={false}>
        {rows.map((r) => (
          <m.div
            key={r.key}
            role="listitem"
            className="rg-row"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: enter }}
            exit={{ height: 0, opacity: 0, transition: leave }}
          >
            {r.line ? (
              <LineRow
                line={r.line}
                name={nameOf(r.line)}
                icon={iconOf(r.line)}
                unit={unit}
                time={formatTime(timeOf(r.line.at, clock))}
                open={open === r.key}
                onOpen={(v) => setOpen(v ? r.key : null)}
                onRemoveOne={() => void removeOne(r.line!)}
                onDelete={() => void removeLine(r.line!)}
              />
            ) : (
              <div className="rg-strip" role="status">
                <span>{removedLabel(r.gone!.name)}</span>
                <button type="button" className="pk-reset pk-press" onClick={() => void restore(r.key)}>
                  Desfazer
                </button>
                <span className="rg-fio" aria-hidden="true">
                  <i />
                </span>
              </div>
            )}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const OPEN_X = -72;

function LineRow({
  line,
  name,
  icon,
  unit,
  time,
  open,
  onOpen,
  onRemoveOne,
  onDelete,
}: {
  line: Line;
  name: string;
  icon: IconName;
  unit: string | undefined;
  time: string;
  open: boolean;
  onOpen: (open: boolean) => void;
  onRemoveOne: () => void;
  onDelete: () => void;
}) {
  const reduced = useReduced();
  const x = useMotionValue(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLSpanElement>(null);
  const dragged = useRef(false);
  const handlers = useRef({ onOpen, onDelete, reduced });
  useLayoutEffect(() => {
    handlers.current = { onOpen, onDelete, reduced };
  });

  // a mesma linha ganhou uma porção: o fundo passa por wash em base
  const prevCount = useRef(line.count);
  useEffect(() => {
    const grew = line.count > prevCount.current;
    prevCount.current = line.count;
    const el = flashRef.current;
    if (!grew || !el || reduced || typeof el.animate !== 'function') return;
    el.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: dur.base * 2000, easing: 'ease-out' });
  }, [line.count, reduced]);

  // aberta ou fechada por fora (outra linha abriu, toque na linha)
  useEffect(() => {
    const target = open ? OPEN_X : 0;
    if (Math.abs(x.get() - target) < 0.5) return;
    if (handlers.current.reduced) x.set(target);
    else animate(x, target, spring.calma);
  }, [open, x]);

  // deslizar para a esquerda: a linha segue o dedo; passou de 40% da largura, apaga; senão abre o "Apagar" ou volta
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    let x0 = 0;
    return attachDrag(el, {
      axis: 'x',
      begin: () => {
        x.stop();
        x0 = x.get();
        dragged.current = true;
      },
      move: (dx) => {
        let v = x0 + dx;
        if (v > 0) v = rubberband(v, 80);
        x.set(Math.max(v, -el.offsetWidth));
      },
      end: (_dx, _dy, vx) => {
        const v = x.get();
        const w = el.offsetWidth || 1;
        const h = handlers.current;
        if (-v > w * 0.4) {
          void Promise.resolve(animate(x, -w, { duration: dur.base, ease: ease.exit })).then(() => h.onDelete());
        } else if (-v > -OPEN_X / 2 || vx < -400) {
          animate(x, OPEN_X, { ...spring.calma, velocity: vx });
          h.onOpen(true);
        } else {
          animate(x, 0, { ...spring.calma, velocity: vx });
          h.onOpen(false);
        }
      },
    });
  }, [x]);

  const lower = name.toLocaleLowerCase('pt-BR');
  const label = [
    time,
    lower,
    line.count > 1 ? `${line.count} porções` : null,
    spokenAmount(line.amount, unit),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="rg-swipe" role="group" aria-label={label}>
      <button
        type="button"
        className="pk-reset rg-del"
        tabIndex={open ? 0 : -1}
        aria-label={`Apagar ${lower}`}
        onClick={onDelete}
      >
        Apagar
      </button>
      <m.div
        ref={rowRef}
        className="rg-it"
        style={{ x }}
        onClick={(e) => {
          // o clique que vem logo depois de um arrasto não fecha a linha
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          if (open && !(e.target as HTMLElement).closest('button')) onOpen(false);
        }}
        onPointerDown={() => {
          dragged.current = false;
        }}
      >
        <span ref={flashRef} className="rg-flash" aria-hidden="true" />
        <time aria-hidden="true">{time}</time>
        <span className="rg-xs" aria-hidden="true">
          <Icon name={icon} />
        </span>
        <b aria-hidden="true">
          {name}
          {line.count > 1 && (
            <>
              {' × '}
              <NumberFlow value={line.count} />
            </>
          )}
        </b>
        <span className="v" aria-hidden="true">
          <Amount value={line.amount} unit={unit} />
        </span>
        <button
          type="button"
          className="pk-reset pk-press rg-min hit"
          aria-label={`Tirar uma porção de ${lower}`}
          onClick={onRemoveOne}
        >
          <Icon name="minus" weight="bold" />
        </button>
      </m.div>
    </div>
  );
}
