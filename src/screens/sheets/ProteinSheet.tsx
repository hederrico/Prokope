// Folha da proteína (?folha=proteina): registros.md › Proteína; quadro: f-registros.js › 1. proteína.
// Soma: cada toque num botão grava na hora e a folha fica aberta. O número grande e o "faltam" rolam (+120 ms),
// o trecho novo da barra enche em fill (+60 ms) e a linha nova entra no topo da lista. Na meta, a linha acende,
// a pílula vira "meta batida" e a vibração bônus toca (nível 2). O − de cada linha tira uma porção.
import { AnimatePresence, m } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { addEntry } from '@/actions';
import { Sheet, type SheetScreenProps } from '@/components/shell';
import { Button, GoalBar, NumberFlow, SectionLabel, TextField, useDelayedValue, useReduced } from '@/components/ui';
import { bezierTimeFor } from '@/components/ui/lib';
import { formatNumber, useCounter, useHabitByRole } from '@/data';
import { Icon } from '@/icons';
import { dur, ease, spring, tween } from '@/motion/tokens';
import { Amount, DayNote, EntryList, FoodTile, Painted, SheetTitle, type CounterView } from './parts';
import { useHabitPillar, useSheetDay, type SheetDay } from './hooks';
import { keepFocus } from './feedback';
import { foodIcon, parseWhole, spokenAmount } from './lib';

export default function ProteinSheet({ params }: SheetScreenProps) {
  const sd = useSheetDay(params);
  const habit = useHabitByRole('protein');
  const counter = useCounter(habit?.id, sd.day);
  const pillar = useHabitPillar(habit?.id);

  if (!habit || !counter) {
    return (
      <Sheet title="Proteína">
        <p className="rg-empty">Nenhum hábito de proteína no plano.</p>
      </Sheet>
    );
  }
  return <CounterSheet counter={counter} pillar={pillar} sd={sd} />;
}

function CounterSheet({
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
  const unit = habit.goal.unit ?? 'g';
  const reduced = useReduced();
  const [other, setOther] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [spoken, setSpoken] = useState(false);

  // a barra: um trecho por linha, do mais antigo para o mais novo; enche 60 ms depois do toque
  const segments = useMemo(() => [...lines].reverse().map((l) => l.amount), [lines]);
  const shownSegments = useDelayedValue(segments, 60);

  // a pílula troca quando a barra encosta na linha da meta (não no fim da animação)
  const hit = goal > 0 && total >= goal;
  const [lit, setLit] = useState(hit);
  const prevTotal = useRef(total);
  useEffect(() => {
    const before = prevTotal.current;
    prevTotal.current = total;
    if (hit === lit) return;
    const instant = reduced || before === total;
    const p = hit ? (goal - before) / (total - before) : (before - goal) / (before - total);
    const ms = instant ? 0 : 60 + bezierTimeFor(ease.out, Math.max(0, Math.min(1, p))) * dur.fill * 1000;
    const id = window.setTimeout(() => setLit(hit), ms);
    return () => clearTimeout(id);
  }, [total, hit, lit, goal, reduced]);

  const over = Math.max(0, total - goal);
  const left = Math.max(0, goal - total);

  function add(amount: number, item: string, quickAddId?: string) {
    setSpoken(true);
    void addEntry(habit.id, { amount, item, quickAddId }, sd.day);
  }

  const otherAmount = parseWhole(otherText);
  const otherOk = otherAmount !== null && otherAmount > 0 && otherAmount <= 500;
  function addOther() {
    if (!otherOk) return;
    add(otherAmount, 'Outro');
    setOtherText('');
    closeOther();
  }

  // ao voltar para a grade, o foco volta para o "Outro" (o campo e o botão somem, e o Esc continua na folha)
  const refocus = useRef(false);
  function closeOther() {
    refocus.current = true;
    setOther(false);
  }

  const footer = (
    <AnimatePresence mode="wait" initial={false}>
      {other ? (
        <m.div
          key="other"
          className="rg-other"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: reduced ? tween.micro : tween.base }}
          exit={{ opacity: 0, transition: tween.exit }}
        >
          <TextField
            label="Gramas"
            value={otherText}
            onChange={(v) => setOtherText(v.replace(/\D/g, '').slice(0, 3))}
            inputMode="numeric"
            unit={unit}
            enterKeyHint="done"
            autoFocus
          />
          <div className="rg-other-row">
            <Button variant="secondary" onClick={closeOther}>
              Voltar
            </Button>
            <Button aria-disabled={!otherOk} onPointerDown={keepFocus} onClick={addOther}>
              {otherOk ? `Somar ${formatNumber(otherAmount)} ${unit}` : 'Digite os gramas'}
            </Button>
          </div>
        </m.div>
      ) : (
        <m.div
          key="grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: reduced ? tween.micro : tween.base }}
          exit={{ opacity: 0, transition: tween.exit }}
        >
          <Painted pillar={pillar} className="rg-qa">
            {counter.quickAdds.map((q) => (
              <FoodTile
                key={q.id}
                name={q.name}
                amount={q.amount}
                unit={unit}
                icon={foodIcon(q.name, habit.icon)}
                onAdd={() => add(q.amount, q.name, q.id)}
              />
            ))}
            <button
              type="button"
              className="pk-reset pk-q more pk-press"
              aria-label="Outro alimento, digitar os gramas"
              ref={(el) => {
                if (el && refocus.current) {
                  refocus.current = false;
                  el.focus({ preventScroll: true });
                }
              }}
              onClick={() => setOther(true)}
            >
              <Icon name="plus" weight="bold" />
              <b>Outro</b>
              <small>digitar</small>
            </button>
          </Painted>
        </m.div>
      )}
    </AnimatePresence>
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
      keyboardAware
      footer={footer}
    >
      <Painted pillar={pillar} className="rg-stack">
        <DayNote label={sd.label} />
        <div className="rg-sum">
          <span>
            <span className="rg-big">
              <NumberFlow value={total} delay={120} />
              <small>{unit}</small>
            </span>
            {goal > 0 && (
              <span className="of">
                de {formatNumber(goal)} {unit}
              </span>
            )}
          </span>
          {goal > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AnimatePresence initial={false}>
                {lit && over > 0 && (
                  <m.span
                    key="over"
                    className="pk-pb-over"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { ...tween.base, delay: 0.06 } }}
                    exit={{ opacity: 0, transition: tween.exit }}
                  >
                    +<Amount value={over} unit={unit} delay={120} />
                  </m.span>
                )}
              </AnimatePresence>
              <AnimatePresence mode="popLayout" initial={false}>
                {lit ? (
                  <m.span
                    key="ok"
                    className="pk-vpill ok"
                    initial={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
                    animate={{ opacity: 1, scale: 1, transition: { opacity: tween.micro, scale: spring.toque } }}
                    exit={{ opacity: 0, transition: tween.exit }}
                  >
                    <Icon name="check" weight="bold" />
                    meta batida
                  </m.span>
                ) : (
                  <m.span
                    key="left"
                    className="pk-vpill"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: tween.micro }}
                    exit={{ opacity: 0, transition: tween.exit }}
                  >
                    <span>
                      faltam <Amount value={left} unit={unit} delay={120} />
                    </span>
                  </m.span>
                )}
              </AnimatePresence>
            </span>
          )}
        </div>
        {goal > 0 && (
          <GoalBar
            segments={shownSegments}
            goal={goal}
            scale={counter.scale}
            unit={unit}
            unitName={unit === 'g' ? 'gramas' : unit}
            status={false}
            label={`${formatNumber(total)} de ${spokenAmount(goal, unit)}`}
          />
        )}
        <div>
          <SectionLabel inset level={3} trailing="− tira uma porção">
            {sd.isPast ? 'Neste dia' : 'Hoje'}
          </SectionLabel>
          <EntryList
            lines={lines}
            unit={unit}
            nameOf={(l) => l.item ?? 'Outro'}
            iconOf={(l) => (l.item && l.item !== 'Outro' ? foodIcon(l.item, habit.icon) : 'bowl-food')}
            onChanged={() => setSpoken(true)}
            empty={sd.isPast ? 'Nenhum registro neste dia.' : undefined}
          />
        </div>
        <p className="pk-sr" aria-live="polite">
          {spoken ? `${formatNumber(total)} de ${spokenAmount(goal, unit)}` : ''}
        </p>
      </Painted>
    </Sheet>
  );
}
