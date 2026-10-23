// Primeiros passos (hoje.md › Primeiros passos; tutorial.md › Capítulo "O dia"): o grupo de treino no topo da lista,
// enquanto o tutorial pede (useTour().practice). Três linhas com os mesmos componentes e gestos das de verdade:
// o CheckButton com a coreografia e o Desfazer, o + que soma com o anel de 40 px e a nota de 1 a 5 numa folha.
// Nada vai para marks ou entries: o grupo não entra no "x de 12", na semana, no dia fechado nem nos padrões.
// Entra com fadeUp (o espaço abre em calma, para a lista de baixo descer sem pular) e sai com opacidade.
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import {
  ActionPill,
  CheckButton,
  HabitList,
  HabitRow,
  NumberFlow,
  QuickAddButton,
  Ring,
  SectionLabel,
  ValuePill,
  useReduced,
} from '@/components/ui';
import { Icon } from '@/icons';
import { mealWord } from '@/data';
import { distance, dur, spring, tween } from '@/motion/tokens';
import { PRACTICE_GOAL, usePractice } from '@/stores/practice';
import { useTour } from '@/stores/tour';
import { useTodayCtx } from './context';
import { practiceAddOne, practiceCheck } from './practiceActions';

/** A folha da nota de treino (registro de folhas, src/app/sheets.ts). */
export const PRACTICE_RATING_SHEET = 'primeira-nota';

const OUTSIDE = 'Só para treinar, não entra nos seus números';

/** O grupo, quando o tutorial pede e o dia mostrado é hoje. `top`: no dia fechado, sem o cabeçalho acima. */
export function PracticeSlot({ top }: { top?: boolean }) {
  const ctx = useTodayCtx();
  const on = useTour((s) => s.practice) && !ctx.isPast;
  return <AnimatePresence>{on && <PracticeGroup key="pp" top={top} />}</AnimatePresence>;
}

function PracticeGroup({ top }: { top?: boolean }) {
  const reduced = useReduced();
  // entra com fadeUp uma vez por capítulo; o mesmo grupo num outro jeito de ver (ou no dia fechado) já está lá
  const [enter] = useState(() => !usePractice.getState().entered);
  useEffect(() => usePractice.setState({ entered: true }), []);
  // a altura anima com o conteúdo cortado; parada, a sombra do cartão aparece inteira
  const [moving, setMoving] = useState(enter);
  const height = reduced ? { duration: 0 } : spring.calma;
  return (
    <m.section
      className={clsx('td-pp', top && 'td-pp-top', moving && 'td-pp-clip')}
      aria-label="Primeiros passos"
      data-tour="pp-group"
      data-flip="pp"
      initial={enter ? { height: 0, opacity: 0 } : false}
      animate={{ height: 'auto', opacity: 1, transition: { height, opacity: tween.base } }}
      exit={{
        height: 0,
        opacity: 0,
        transition: { opacity: tween.exit, height: { ...height, delay: dur.micro } },
      }}
      onAnimationStart={() => setMoving(true)}
      onAnimationComplete={() => setMoving(false)}
    >
      <m.div initial={enter && !reduced ? { y: distance.rise } : false} animate={{ y: 0, transition: tween.base }}>
        <SectionLabel trailing="não entram nos seus números">Primeiros passos</SectionLabel>
        <div className="td-pad">
          <HabitList label="Primeiros passos">
            <MarkRow />
            <AddRow />
            <RateRow />
          </HabitList>
        </div>
      </m.div>
    </m.section>
  );
}

/** "Primeira marcação no app": o círculo de marcar, com a coreografia e o toast com Desfazer. */
function MarkRow() {
  const marked = usePractice((s) => s.marked);
  const name = 'Primeira marcação no app';
  return (
    <HabitRow
      habit={{ name, icon: 'footprints', pillar: 'accent' }}
      subtitle={<span className="td-sub">toque no círculo</span>}
      done={marked}
      a11yLabel={`${name}. ${OUTSIDE}`}
      className="td-pp-row"
      control={
        <span className="td-pp-t" data-tour="pp-mark">
          <CheckButton checked={marked} label={name} pillar="accent" onCheckedChange={practiceCheck} />
        </span>
      }
    />
  );
}

/** "Primeiro registro · 0 de 3": o + soma 1 por toque; o anel anda e o número rola, como na água. */
function AddRow() {
  const added = usePractice((s) => s.added);
  const name = 'Primeiro registro';
  const full = added >= PRACTICE_GOAL;
  return (
    <HabitRow
      habit={{ name, icon: 'drop', pillar: 'accent' }}
      leading={
        <Ring size={40} stroke={5} value={added / PRACTICE_GOAL} color="var(--mark)" track="var(--wash)" timing="ring">
          <Icon name="drop" weight="duotone" />
        </Ring>
      }
      subtitle={
        <span className="pk-num">
          <NumberFlow value={added} /> de {PRACTICE_GOAL}
        </span>
      }
      done={full}
      a11yLabel={`${name}, ${added} de ${PRACTICE_GOAL}. ${OUTSIDE}`}
      className="td-pp-row"
      control={
        <span className="td-pp-t" data-tour="pp-add">
          {full ? (
            <ValuePill value="pronto" pillar="accent" label={`${name}, ${PRACTICE_GOAL} de ${PRACTICE_GOAL}, pronto`} />
          ) : (
            <QuickAddButton
              amount="1"
              pillar="accent"
              label={`${name}, ${added} de ${PRACTICE_GOAL}. Somar 1`}
              onClick={practiceAddOne}
            />
          )}
        </span>
      }
    />
  );
}

/** "Primeira nota": "Dar nota" abre a folha de treino; com nota, a pílula "4 · Bom" abre de novo para mudar. */
function RateRow() {
  const ctx = useTodayCtx();
  const rating = usePractice((s) => s.rating);
  const name = 'Primeira nota';
  const open = () => ctx.openSheet(PRACTICE_RATING_SHEET);
  return (
    <HabitRow
      habit={{ name, icon: 'star', pillar: 'accent' }}
      subtitle={<span className="td-sub">nota de 1 a 5</span>}
      done={!!rating}
      a11yLabel={`${name}${rating ? `, nota ${rating}, ${mealWord(rating)}` : ''}. ${OUTSIDE}`}
      className="td-pp-row"
      control={
        <span className="td-pp-t" data-tour="pp-rate">
          {rating ? (
            <ValuePill
              value={`${rating} · ${mealWord(rating)}`}
              icon={null}
              pillar="accent"
              label={`${name}, nota ${rating}, ${mealWord(rating)}. Mudar a nota`}
              onClick={open}
            />
          ) : (
            <ActionPill label={`${name}, sem nota. Dar nota`} onClick={open}>
              Dar nota
            </ActionPill>
          )}
        </span>
      }
    />
  );
}
