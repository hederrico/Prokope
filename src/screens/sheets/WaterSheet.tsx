// Folha da água (?folha=agua): registros.md › Água; quadro: f-registros.js › 2. água.
// Soma como a proteína: "+ 500 ml" e "+ 1 L" gravam na hora e a folha fica aberta. O anel anda em ring e o total
// rola (+120 ms); na meta, o traço passa de mark para ink e entra o selo "meta batida" embaixo do anel (nível 2).
import { AnimatePresence, m } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { addEntry } from '@/actions';
import { Sheet, type SheetScreenProps } from '@/components/shell';
import { NumberFlow, Ring, SectionLabel, useReduced } from '@/components/ui';
import { bezierTimeFor } from '@/components/ui/lib';
import { formatNumber, formatVolume, useCounter, useHabitByRole } from '@/data';
import { Icon } from '@/icons';
import { haptic } from '@/motion/haptics';
import { dur, ease, spring, tween } from '@/motion/tokens';
import { capitalizeFirst, containerWord, isVolumeName, spokenAmount } from './lib';
import { DayNote, EntryList, Painted, SheetTitle, type CounterView, type Line } from './parts';
import { useHabitPillar, useSheetDay, type SheetDay } from './hooks';

export default function WaterSheet({ params }: SheetScreenProps) {
  const sd = useSheetDay(params);
  const habit = useHabitByRole('water');
  const counter = useCounter(habit?.id, sd.day);
  const pillar = useHabitPillar(habit?.id);
  if (!habit || !counter) {
    return (
      <Sheet title="Água">
        <p className="rg-empty">Nenhum hábito de água no plano.</p>
      </Sheet>
    );
  }
  return <WaterBody counter={counter} pillar={pillar} sd={sd} />;
}

/** "1,5 L" no centro do anel: litros sempre, com uma casa só quando precisa. */
function liters(ml: number) {
  return formatNumber(ml / 1000, 2);
}

function WaterBody({
  counter,
  pillar,
  sd,
}: {
  counter: CounterView;
  pillar: ReturnType<typeof useHabitPillar>;
  sd: SheetDay;
}) {
  const { habit, total, lines } = counter;
  const goal = counter.goal ?? 0;
  const unit = habit.goal.unit ?? 'ml';
  const isMl = unit === 'ml';
  const reduced = useReduced();
  const [spoken, setSpoken] = useState(false);

  // o anel fecha (e o selo entra) quando o traço chega ao fim, 120 ms depois do toque
  const hit = goal > 0 && total >= goal;
  const [lit, setLit] = useState(hit);
  const prevTotal = useRef(total);
  useEffect(() => {
    const before = prevTotal.current;
    prevTotal.current = total;
    if (hit === lit) return;
    const instant = reduced || before === total;
    const b = Math.min(1, before / goal);
    const a = Math.min(1, total / goal);
    const p = hit ? (1 - b) / (a - b || 1) : 0;
    const ms = instant || !hit ? 0 : 120 + bezierTimeFor(ease.out, Math.max(0, Math.min(1, p))) * dur.ring * 1000;
    const id = window.setTimeout(() => {
      setLit(hit);
      // nível 2 da escada, só no dia de hoje
      if (hit && !instant && !sd.isPast) haptic();
    }, ms);
    return () => clearTimeout(id);
  }, [total, hit, lit, goal, reduced, sd.isPast]);

  const over = Math.max(0, total - goal);
  const ringLabel = isMl
    ? `${habit.name}, ${liters(total)} de ${liters(goal)} litros`
    : `${habit.name}, ${formatNumber(total)} de ${formatNumber(goal)} ${unit}`;

  function add(amount: number, item: string, quickAddId: string) {
    setSpoken(true);
    void addEntry(habit.id, { amount, item, quickAddId }, sd.day);
  }

  const nameOf = (l: Line) =>
    !l.item || isVolumeName(l.item) ? capitalizeFirst(containerWord(l.amount / Math.max(1, l.count))) : l.item;

  const footer = (
    <Painted pillar={pillar} className="rg-two">
      {counter.quickAdds.map((q) => {
        const volume = isMl && isVolumeName(q.name);
        const title = volume ? formatVolume(q.amount) : q.name;
        const sub = volume ? containerWord(q.amount) : isMl ? formatVolume(q.amount) : `${q.amount} ${unit}`;
        return (
          <button
            key={q.id}
            type="button"
            className="pk-reset pk-q pk-press"
            aria-label={`Somar ${volume ? spokenAmount(q.amount, unit) : q.name.toLocaleLowerCase('pt-BR')}`}
            onClick={() => add(q.amount, q.name, q.id)}
          >
            <b>
              <Icon name="plus" weight="bold" />
              {title}
            </b>
            <small>{sub}</small>
          </button>
        );
      })}
    </Painted>
  );

  return (
    <Sheet
      title={
        <SheetTitle icon={habit.icon} pillar={pillar}>
          {habit.name}
        </SheetTitle>
      }
      label={habit.name}
      className="rg-sheet"
      footer={footer}
    >
      <Painted pillar={pillar} className="rg-stack">
        <DayNote label={sd.label} />
        <div className="rg-ring">
          <Ring
            size={184}
            stroke={16}
            value={goal > 0 ? total / goal : 0}
            color={lit ? 'var(--ink)' : 'var(--mark)'}
            track="var(--wash)"
            label={ringLabel}
            delay={120}
          >
            <Icon name={habit.icon} />
            <b>
              {isMl ? (
                <>
                  <NumberFlow value={total / 1000} delay={120} format={{ maximumFractionDigits: 2 }} /> L
                </>
              ) : (
                <>
                  <NumberFlow value={total} delay={120} /> {unit}
                </>
              )}
            </b>
            <span className="cap">
              {lit && over > 0
                ? `+${isMl ? `${liters(over)} L` : `${formatNumber(over)} ${unit}`}`
                : `de ${isMl ? `${liters(goal)} L` : `${formatNumber(goal)} ${unit}`}`}
            </span>
          </Ring>
          <AnimatePresence initial={false}>
            {lit && (
              <m.div
                key="seal"
                className="rg-seal"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                  transition: reduced ? tween.micro : { height: tween.base, opacity: tween.base },
                }}
                exit={{ height: 0, opacity: 0, transition: tween.exit }}
              >
                <div>
                  <m.span
                    className="pk-vpill ok"
                    initial={{ scale: reduced ? 1 : 0.9, y: reduced ? 0 : 8 }}
                    animate={{ scale: 1, y: 0, transition: { scale: spring.toque, y: tween.base } }}
                  >
                    <Icon name="check" weight="bold" />
                    meta batida
                  </m.span>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        <div>
          <SectionLabel inset level={3} trailing="− tira uma porção">
            {sd.isPast ? 'Neste dia' : 'Hoje'}
          </SectionLabel>
          <EntryList
            lines={lines}
            unit={unit}
            nameOf={nameOf}
            iconOf={() => habit.icon}
            onChanged={() => setSpoken(true)}
            empty={sd.isPast ? 'Nenhum registro neste dia.' : undefined}
          />
        </div>
        <p className="pk-sr" aria-live="polite">
          {spoken
            ? isMl
              ? `${liters(total)} ${total === 1000 ? 'litro' : 'litros'} de ${liters(goal)}`
              : `${formatNumber(total)} de ${formatNumber(goal)} ${unit}`
            : ''}
        </p>
      </Painted>
    </Sheet>
  );
}
