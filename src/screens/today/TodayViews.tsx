// Lista completa e Linha do tempo (hoje.md › Os três jeitos de ver o dia). As mesmas linhas e os mesmos toques do
// Resumo; muda só a arrumação. Lista completa: os momentos do dia, todos abertos o dia todo, sem "Tudo feito", com
// o horário na frente da legenda. Linha do tempo: os hábitos em ordem de horário, com a marca de cada horário e a
// linha do agora (os sem horário entram pelo momento: a manhã depois do acordar, o "ao longo do dia" no meio do dia
// e a noite às 19h). A arrumação continua adiada: a lista e a ordem vêm do instantâneo congelado e o estado de cada
// linha vem ao vivo, então marcar não tira nada do lugar. A linha do agora não ocupa lugar (o espaço entre dois
// horários é sempre o mesmo), então andar com o relógio não empurra nada, e ela não é anunciada.
import { Fragment, useMemo, type ReactNode } from 'react';
import clsx from 'clsx';
import { HabitList, SectionLabel } from '@/components/ui';
import {
  dayTimeline,
  formatTime,
  GROUP_TITLES,
  type TimelineSlot,
  type TodayItem,
  type TodayLayout,
  type TodayView,
} from '@/data';
import { useTodayCtx } from './context';
import { CounterCard, ItemRow, NightGoals, WaterRow } from './rows';

interface ViewBlocksProps {
  layout: TodayLayout;
  quick: TodayView['quickAdds'];
  liveOf: (i: TodayItem) => TodayItem;
  /** classe da cascata da primeira abertura (vazia quando não há cascata) */
  next: () => string;
  nudgeFor: (item: TodayItem) => ReactNode;
}

/** Contadores que viram a linha da água (anel e "+ 500 ml"), e não o cartão com a barra. */
function isWaterLike(item: TodayItem): boolean {
  return item.habit.role === 'water' || item.goal.unit === 'ml' || item.goal.unit === 'L';
}

/** "Não conta hoje" desce para o fim do grupo na arrumação (o estado congelado decide). */
function skippedLast(a: TodayItem, b: TodayItem): number {
  return Number(a.state === 'skipped') - Number(b.state === 'skipped');
}

/** Proteína e água: os cartões com os botões de somar; à noite (e no fim do dia), o cartão das metas, sem botões. */
function Counters({
  items,
  quick,
  liveOf,
  next,
}: Pick<ViewBlocksProps, 'quick' | 'liveOf' | 'next'> & { items: TodayItem[] }) {
  const ctx = useTodayCtx();
  if (!items.length) return null;
  if (ctx.night) {
    return (
      <div className={next()}>
        <NightGoals items={items.map(liveOf)} />
      </div>
    );
  }
  return (
    <>
      {items.map((fi) => {
        const item = liveOf(fi);
        const q = (quick[item.habit.id] ?? []).map((x) => ({ id: x.id, name: x.name, amount: x.amount }));
        return (
          <div key={item.habit.id} className={next()}>
            {isWaterLike(item) ? <WaterRow item={item} quick={q} /> : <CounterCard item={item} quick={q} />}
          </div>
        );
      })}
    </>
  );
}

function Rows({
  label,
  items,
  liveOf,
  nudgeFor,
  next,
  withTime,
}: Pick<ViewBlocksProps, 'liveOf' | 'nudgeFor' | 'next'> & { label: string; items: TodayItem[]; withTime?: boolean }) {
  const classes = [next(), next(), next()];
  return (
    <HabitList className={classes[0]} label={label}>
      {items.map((fi, i) => {
        const item = liveOf(fi);
        return [
          <ItemRow key={item.habit.id} item={item} withTime={withTime} className={i > 0 ? classes[i] : undefined} />,
          nudgeFor(item),
        ];
      })}
    </HabitList>
  );
}

/** Num dia que passou não há botões de somar: proteína e água viram linhas com o valor. */
function splitCounters(items: TodayItem[], isPast: boolean): [TodayItem[], TodayItem[]] {
  const asCard = (i: TodayItem) => i.habit.type === 'counter' && !isPast;
  return [items.filter(asCard), items.filter((i) => !asCard(i)).sort(skippedLast)];
}

// ---------- Lista completa ----------

export function FullBlocks({ layout, quick, liveOf, next, nudgeFor }: ViewBlocksProps) {
  const ctx = useTodayCtx();
  return (
    <>
      {layout.groups.map((g) => {
        const [counters, rows] = splitCounters(g.items, ctx.isPast);
        return (
          <section key={g.key} aria-label={g.title} data-flip={`g-${g.key}`}>
            <SectionLabel className={next()}>{g.title}</SectionLabel>
            <div className="td-pad td-stack" data-flip={`g-${g.key}-open`}>
              <Counters items={counters} quick={quick} liveOf={liveOf} next={next} />
              {rows.length > 0 && (
                <Rows label={g.title} items={rows} liveOf={liveOf} nudgeFor={nudgeFor} next={next} withTime />
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

// ---------- Linha do tempo ----------

function slotTitle(slot: TimelineSlot): string {
  return slot.kind === 'time' ? formatTime(slot.time) : GROUP_TITLES[slot.moment];
}

/** "agora", com a hora: um traço na cor da primária, sem ocupar lugar (fica no espaço entre dois horários). */
function NowLine({ minutes }: { minutes: number }) {
  const m = minutes % 1440;
  const label = formatTime(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  return (
    <span className="td-tl-now" aria-hidden="true">
      <i />
      <b className="pk-num">{label}</b>
      <span />
    </span>
  );
}

export function TimelineBlocks({
  layout,
  quick,
  liveOf,
  next,
  nudgeFor,
  dayStartHour,
}: ViewBlocksProps & { dayStartHour: number }) {
  const ctx = useTodayCtx();
  const slots = useMemo(
    () =>
      dayTimeline(
        layout.groups.flatMap((g) => g.items),
        dayStartHour,
      ),
    [layout, dayStartHour],
  );
  // o espaço antes do primeiro horário que ainda não chegou (num dia que passou, não há agora)
  const nowAt = ctx.isPast ? -1 : slots.filter((s) => s.minutes <= ctx.minutes).length;
  return (
    <section className="td-tl" aria-label="Linha do tempo" data-flip="timeline">
      {slots.map((s, i) => {
        const [counters, rows] = splitCounters(s.items, ctx.isPast);
        const title = slotTitle(s);
        const past = ctx.isPast || s.minutes <= ctx.minutes;
        return (
          <Fragment key={s.key}>
            <div className={clsx('td-tl-gap', i === 0 && 'first')} aria-hidden="true">
              {nowAt === i && <NowLine minutes={ctx.minutes} />}
            </div>
            <section
              className={clsx('td-tl-slot', past && 'past', s.kind === 'moment' && 'moment')}
              aria-label={title}
              data-flip={`tl-${s.key}`}
            >
              <h2 className={clsx('td-tl-h', next())}>
                <i className="td-tl-dot" aria-hidden="true" />
                {title}
              </h2>
              <div className="td-stack">
                <Counters items={counters} quick={quick} liveOf={liveOf} next={next} />
                {rows.length > 0 && <Rows label={title} items={rows} liveOf={liveOf} nudgeFor={nudgeFor} next={next} />}
              </div>
            </section>
          </Fragment>
        );
      })}
      <div className="td-tl-gap last" aria-hidden="true">
        {nowAt === slots.length && <NowLine minutes={ctx.minutes} />}
      </div>
    </section>
  );
}
