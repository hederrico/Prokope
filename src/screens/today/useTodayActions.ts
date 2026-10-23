// O que os controles do Hoje fazem: grava pela ação (que já devolve o desfazer), toca o som do nível 1 dentro do
// gesto e mostra o toast no tempo da coreografia (+200 ms). Os textos seguem gestos-e-feedback.md › Toasts:
// "Caminhada marcada · 3 de 7 na semana", "Frango · 30 g · 76 de 80 g", "Ovo × 3 · 18 g", "Tranqueira registrada".
import { useCallback, useLayoutEffect, useRef } from 'react';
import { addEntry, markHabit, skipToday, spendBudget, unmarkHabit, unskipToday, type Undo } from '@/actions';
import { showUndo } from '@/components/shell';
import { formatAmount, formatTimePadded, isDoneLike, timeOf, weekdayName, type TodayItem } from '@/data';
import type { DayKey, QuickAdd } from '@/types';
import { choreography } from '@/motion/tokens';
import { playSoftTick } from '@/motion/sound';
import { nowMs, useClockStore } from '@/stores/clock';
import { shortOf, singular, withParticiple } from './copy';

export interface TodayActionContext {
  day: DayKey;
  today: DayKey;
  /** a conta do dia, antes do toque */
  count: { done: number; total: number };
  /** dia pausado do app: registra sem celebrar, e nenhum total anda */
  paused: boolean;
}

const MERGE_MS = 1500;

function pillarOf(item: TodayItem) {
  return item.pillar?.color;
}

/** O toast sobe no +200 ms da coreografia, contado do toque. */
function later(startedAt: number, fn: () => void) {
  const wait = Math.max(0, choreography.toast * 1000 - (performance.now() - startedAt));
  window.setTimeout(fn, wait);
}

function isWaterLike(name: string): boolean {
  return /\d/.test(name);
}

export function useTodayActions(ctx: TodayActionContext) {
  const ref = useRef(ctx);
  useLayoutEffect(() => {
    ref.current = ctx;
  });
  const merge = useRef<{ key: string; entryId?: string; first: Undo; count: number; at: number } | null>(null);

  /** O CheckButton (e o círculo de horário sem registro, que marca com a hora de agora). */
  const check = useCallback((item: TodayItem, on: boolean) => {
    const { day, today, count, paused } = ref.current;
    const t0 = performance.now();
    const past = day !== today;
    const celebrate = on && !past && !paused;
    // nível 1 da escada: o som (a vibração vem do próprio CheckButton)
    if (celebrate) playSoftTick();
    // o nome curto nas frases: "Caminhada marcada", "Lixo marcado", "Telas desligadas"
    const name = toastName(item);
    const isTime = item.habit.type === 'time';
    const time = isTime ? timeOf(nowMs(), useClockStore.getState().clock) : undefined;
    void (async () => {
      const undo = on
        ? await markHabit(item.habit.id, day, time ? { time } : {})
        : await unmarkHabit(item.habit.id, day);
      const doUndo = () => void undo();
      later(t0, () => {
        if (!on) {
          showUndo(
            { title: withParticiple(name, 'desmarcad'), pillar: pillarOf(item), icon: 'arrow-counter-clockwise' },
            doUndo,
          );
          return;
        }
        if (paused) {
          showUndo({ title: withParticiple(name, 'registrad'), pillar: pillarOf(item), icon: 'check' }, doUndo);
          return;
        }
        if (past) {
          showUndo(
            {
              title: `${withParticiple(name, 'marcad')} ${day < today ? `na ${weekdayName(day)}` : ''}`.trim(),
              pillar: pillarOf(item),
              icon: 'check',
            },
            doUndo,
          );
          return;
        }
        if (isTime && time) {
          showUndo(
            {
              title: withParticiple(name, 'registrad'),
              detail: formatTimePadded(time),
              pillar: pillarOf(item),
              icon: 'check',
            },
            doUndo,
          );
          return;
        }
        const detail = item.week
          ? `${item.week.done + 1} de ${weekLen(item)} na semana`
          : item.counts
            ? `${Math.min(count.total, count.done + 1)} de ${count.total} feitos hoje`
            : undefined;
        showUndo({ title: withParticiple(name, 'marcad'), detail, pillar: pillarOf(item), icon: 'check' }, doUndo);
      });
    })();
  }, []);

  /** Um botão rápido do contador (proteína, água). Toques no mesmo botão em até 1,5 s viram "Ovo × 3". */
  const add = useCallback((item: TodayItem, q: Pick<QuickAdd, 'name' | 'amount'> & { id?: string }) => {
    const { day } = ref.current;
    const t0 = performance.now();
    const unit = item.goal.unit;
    const key = `${item.habit.id}|${q.id ?? q.name}|${q.amount}|${day}`;
    const before = item.value ?? 0;
    void (async () => {
      const undo = await addEntry(item.habit.id, { amount: q.amount, item: q.name, quickAddId: q.id }, day);
      let m = merge.current;
      if (m && m.key === key && t0 - m.at <= MERGE_MS && (!undo.id || undo.id === m.entryId)) {
        m.count += 1;
        m.at = t0;
      } else {
        m = merge.current = { key, entryId: undo.id, first: undo, count: 1, at: t0 };
      }
      const chain = m;
      const total = before + q.amount;
      const amount = formatAmount(q.amount * chain.count, unit);
      const title = isWaterLike(q.name)
        ? `${item.habit.name} · ${amount}`
        : chain.count > 1
          ? `${q.name} × ${chain.count} · ${amount}`
          : `${q.name} · ${amount}`;
      const goal = item.goal.value;
      const detail = goal ? `${formatAmount(total, unit)} de ${formatAmount(goal, unit)}` : undefined;
      later(t0, () =>
        showUndo({ title, detail, pillar: pillarOf(item), icon: 'plus' }, () => {
          if (merge.current === chain) merge.current = null;
          void chain.first();
        }),
      );
    })();
  }, []);

  /** O "+" do limite da semana. */
  const spend = useCallback((item: TodayItem) => {
    const { day } = ref.current;
    const t0 = performance.now();
    const b = item.budget;
    void (async () => {
      const undo = await spendBudget(item.habit.id, day);
      later(t0, () =>
        showUndo(
          {
            title: withParticiple(singular(toastName(item)), 'registrad'),
            detail: b ? `${b.used + 1} de ${b.limit} na semana` : undefined,
            pillar: pillarOf(item),
            icon: 'plus',
          },
          () => void undo(),
        ),
      );
    })();
  }, []);

  /** "Hoje não se aplica" e o inverso (menu do hábito). */
  const skip = useCallback(async (habitId: string, name: string, pillar: string | undefined, on: boolean) => {
    const { day } = ref.current;
    if (!on) {
      await unskipToday(habitId, day);
      return;
    }
    const undo = await skipToday(habitId, day);
    window.setTimeout(
      () =>
        showUndo(
          {
            title: `${name} não conta ${day === ref.current.today ? 'hoje' : 'neste dia'}`,
            pillar: pillar as never,
            icon: 'calendar-minus',
          },
          () => void undo(),
        ),
      240,
    );
  }, []);

  return { check, add, spend, skip };
}

/** O nome do hábito nos toasts: o curto, com maiúscula ("Caminhada", "Lixo", "Telas desligadas"). */
export function toastName(item: Pick<TodayItem, 'habit'>): string {
  const s = shortOf(item.habit);
  return s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1);
}

/** Dias da semana do hábito ("2 de 7"): os da agenda, ou 7. */
export function weekLen(item: TodayItem): number {
  return item.week?.days.length || 7;
}

/** O item está feito (ou parcial) no dia. */
export function isDone(item: TodayItem): boolean {
  return isDoneLike(item.state);
}
