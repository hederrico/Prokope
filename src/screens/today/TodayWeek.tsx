// O cartão da semana do Hoje (WeekStrip com o resumo do dia) e o convite da revisão de domingo.
// O resumo muda com o estado: "3 de 12 feitos hoje" e "76% na semana ›", "7 de 12 feitos na quarta" (outro dia)
// ou "Primeiro dia da fase 1" e "semana 1 de 3". Deslizar para o lado mostra a semana anterior (só uma).
import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { Button, NumberFlow, WeekStrip, toWeekDays } from '@/components/ui';
import { Icon } from '@/icons';
import { useReview, useWeek, weekdayName, type WeekView } from '@/data';
import { choreography, distance, spring, tween } from '@/motion/tokens';

export type WeekHead =
  | { kind: 'today'; done: number; total: number; constancy: number | null; onProgress: () => void }
  | { kind: 'past'; day: string; done: number; total: number; constancy: number | null; onProgress: () => void }
  | { kind: 'first'; phase: number | null; weekIndex: number | null; weeks: number | null }
  | { kind: 'none' };

function Head({ head }: { head: WeekHead }) {
  if (head.kind === 'none') return null;
  if (head.kind === 'first') {
    return (
      <div className="pk-wkh">
        <span className="sum">
          <b>Primeiro dia</b> <span className="muted">{head.phase ? `da fase ${head.phase}` : 'do plano'}</span>
        </span>
        {head.weekIndex && head.weeks ? (
          <span className="cap td-wk-cap">
            semana {head.weekIndex} de {head.weeks}
          </span>
        ) : null}
      </div>
    );
  }
  const delay = choreography.distant * 1000;
  const pct = head.constancy === null ? null : Math.round(head.constancy * 100);
  const what = head.kind === 'past' ? `feitos na ${weekdayName(head.day)}` : 'feitos hoje';
  return (
    <div className="pk-wkh">
      <span className="sum">
        <b className="pk-num">
          <NumberFlow value={head.done} delay={delay} /> de <NumberFlow value={head.total} delay={delay} />
        </b>{' '}
        <span className="muted">{what}</span>
      </span>
      {pct !== null && (
        <button
          type="button"
          className="pk-reset pk-wkgo hit"
          aria-label={`${pct}% na semana. Abre o Progresso`}
          onClick={head.onProgress}
        >
          <span className="pk-num" aria-hidden="true">
            <NumberFlow value={pct} delay={delay} suffix="%" />
          </span>
          <span aria-hidden="true">na semana</span>
          <Icon name="caret-right" weight="bold" />
        </button>
      )}
    </div>
  );
}

export interface TodayWeekCardProps {
  week: WeekView;
  today: string;
  head: WeekHead;
  /** dia escolhido (outro dia) */
  selected?: string;
  onSelect: (day: string) => void;
  /** linha do ajuste da semana, no fim do cartão */
  footer?: ReactNode;
  className?: string;
}

/** A semana do topo. Deslizar para a direita mostra a semana anterior; para a esquerda, volta. */
export function TodayWeekCard({ week, today, head, selected, onSelect, footer, className }: TodayWeekCardProps) {
  const [{ prev, dir }, setView] = useState({ prev: false, dir: 0 });
  const prevWeek = useWeek(week.previous);
  const canPrev = week.isCurrent;
  const shown = prev && canPrev ? prevWeek : week;
  const drag = useRef<{ x: number; y: number; id: number; swiped: boolean } | null>(null);

  const go = (toPrev: boolean) => {
    if (!canPrev || toPrev === prev) return;
    // o passado vem da esquerda
    setView({ prev: toPrev, dir: toPrev ? -1 : 1 });
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, swiped: false };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || d.swiped) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      d.swiped = true;
      go(dx > 0);
    }
  };
  const onUp = () => {
    // o clique que vem depois de um deslize não abre o dia
    const d = drag.current;
    if (d?.swiped) window.setTimeout(() => (drag.current = null), 0);
    else drag.current = null;
  };

  const strip = (
    <WeekStrip
      bare
      days={toWeekDays(shown.days)}
      today={today}
      selected={selected}
      onSelect={(d) => {
        if (drag.current?.swiped) return;
        onSelect(d);
      }}
    />
  );

  return (
    <div className={clsx('pk-card pk-wkc td-wkc', className)}>
      <Head head={head} />
      <div
        className="td-wk-swipe"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClickCapture={(e) => {
          if (drag.current?.swiped) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <m.div
            key={shown.week}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * distance.day, opacity: 0 }),
              in: { x: 0, opacity: 1, transition: { x: spring.calma, opacity: tween.base } },
              out: (d: number) => ({ x: -d * distance.day, opacity: 0, transition: tween.exit }),
            }}
            initial="enter"
            animate="in"
            exit="out"
          >
            {strip}
          </m.div>
        </AnimatePresence>
      </div>
      {canPrev && (
        <button type="button" className="pk-reset pk-sr" onClick={() => go(!prev)}>
          {prev ? 'Voltar para esta semana' : 'Ver a semana anterior'}
        </button>
      )}
      {footer}
    </div>
  );
}

/** A linha do ajuste da semana ("Começar a desligar as telas às 20h45"), até a próxima revisão. */
export function TweakLine({ text, onOpen }: { text: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      className="pk-reset td-tweak"
      onClick={onOpen}
      aria-label={`Ajuste da semana: ${text.replace(/[.!]+$/, '')}. Abre a revisão`}
    >
      <Icon name="lightbulb" weight="regular" />
      <span>{text}</span>
    </button>
  );
}

/** O convite da revisão, no lugar do cartão da semana (domingo a partir das 18h, até 2 dias depois). */
export function ReviewInvite({
  review,
  today,
  onStart,
  onSelect,
}: {
  review: { week: string; step: number; started: boolean };
  today: string;
  onStart: () => void;
  onSelect: (day: string) => void;
}) {
  const rv = useReview(review.week);
  const week = useWeek(review.week);
  const steps = rv?.steps ?? 2;
  const phase = rv?.summary.phase ?? null;
  const end = rv?.summary.endOfPhase ?? false;
  const reviewDay = week.days[6]?.day;
  const title =
    end && phase
      ? reviewDay && reviewDay >= today
        ? `A fase ${phase} termina hoje`
        : `A fase ${phase} terminou`
      : 'Como foi a semana';
  const eyebrow = review.started ? `Revisão da semana · passo ${review.step} de ${steps}` : 'Revisão da semana';
  const lead = end
    ? 'Em 5 minutos, você vê o que deu certo e escolhe o próximo passo.'
    : 'Em 5 minutos, você vê o que deu certo e escolhe um ajuste.';
  return (
    <div className="pk-card td-rev" data-pillar="accent">
      <div className="td-rev-h">
        <span className="pk-bub td-rev-bub" aria-hidden="true">
          <Icon name="calendar-check" weight="duotone" />
        </span>
        <span>
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={eyebrow}
              className="eyebrow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: tween.micro }}
              exit={{ opacity: 0, transition: tween.micro }}
            >
              {eyebrow}
            </m.span>
          </AnimatePresence>
          <b className="td-t16">{title}</b>
        </span>
      </div>
      <WeekStrip bare days={toWeekDays(week.days)} today={today} onSelect={onSelect} />
      <p className="td-rev-lead">{lead}</p>
      <Button wide onClick={onStart}>
        {review.started ? 'Continuar revisão' : 'Começar revisão'}
      </Button>
    </div>
  );
}
