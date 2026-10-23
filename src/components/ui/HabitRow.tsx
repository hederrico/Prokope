// HabitRow: a linha de hábito, a peça mais tocada do app. Quadro: hr().
// Dois alvos irmãos (nunca um botão dentro do outro): a linha abre o hábito e o controle à direita registra.
// O toque longo de 500 ms chama onLongPress (menu do hábito); a alternativa é o botão escondido "Mais opções".
import clsx from 'clsx';
import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { nodeText } from './lib';
import { PillarBubble } from './PillarBubble';
import { pillarAttrs, type HabitVisual } from './pillar';
import './ui.css';

export type HabitRowProps = {
  habit: HabitVisual;
  /** "meta 6h50", ou WeekDots + "2 de 7 · meta 6" */
  subtitle?: ReactNode;
  /** no lugar da bolha do ícone (o anel de 40 px da água) */
  leading?: ReactNode;
  /** CheckButton, ValuePill, ActionPill, PlusButton, QuickAddButton... Sem controle: deitar à noite, "Amanhã cedo" */
  control?: ReactNode;
  done?: boolean;
  /** pausado ou "não conta hoje": título em text-3 */
  muted?: boolean;
  /** convite gentil, um por dia */
  nudge?: { text: string; action: string; onAction: () => void };
  /** abre o hábito (tela empurrada) */
  onOpen?: () => void;
  /** menu do hábito (toque longo, Shift+F10 ou o botão escondido) */
  onLongPress?: () => void;
  /** nome lido pelo VoiceOver; o padrão junta o nome e o subtítulo */
  a11yLabel?: string;
  className?: string;
};

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 10;

export function HabitRow({
  habit,
  subtitle,
  leading,
  control,
  done,
  muted,
  nudge,
  onOpen,
  onLongPress,
  a11yLabel,
  className,
}: HabitRowProps) {
  const rowRef = useRef<HTMLLIElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
    rowRef.current?.removeAttribute('data-pressed');
  };
  useEffect(() => clear, []);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    fired.current = false;
    start.current = { x: e.clientX, y: e.clientY };
    rowRef.current?.setAttribute('data-pressed', '');
    if (!onLongPress) return;
    timer.current = setTimeout(() => {
      fired.current = true;
      clear();
      onLongPress();
    }, LONG_PRESS_MS);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE) clear();
  };
  const onClick = () => {
    // o toque longo já abriu o menu: o clique que vem junto com o soltar não abre o hábito
    if (fired.current) {
      fired.current = false;
      return;
    }
    onOpen?.();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (onLongPress && (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) {
      e.preventDefault();
      onLongPress();
    }
  };

  const sub = nodeText(subtitle);
  const label = a11yLabel ?? [habit.name, sub].filter(Boolean).join(', ');
  const p = pillarAttrs(habit.pillar);

  return (
    <li
      ref={rowRef}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      className={clsx('pk-hr', done && 'done', muted && 'muted', !control && 'noctl', p.className, className)}
    >
      <button
        type="button"
        className="pk-reset pk-hr-main"
        aria-label={label}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={clear}
        onPointerCancel={clear}
        onPointerLeave={clear}
        onContextMenu={(e) => {
          if (!onLongPress) return;
          e.preventDefault();
          if (!fired.current) {
            fired.current = true;
            clear();
            onLongPress();
          }
        }}
        onKeyDown={onKeyDown}
      >
        {leading ?? <PillarBubble icon={habit.icon} pillar={habit.pillar} weight={done ? 'fill' : 'duotone'} />}
        <span className="pk-ht">
          <b>{habit.name}</b>
          {subtitle != null && subtitle !== '' && <small>{subtitle}</small>}
        </span>
      </button>
      {control && <div className="pk-hr-ctl">{control}</div>}
      {onLongPress && (
        <button type="button" className="pk-reset pk-hr-more" onClick={onLongPress}>
          Mais opções de {habit.name}
        </button>
      )}
      {nudge && (
        <div className="pk-nudge">
          <span>{nudge.text}</span>
          <button type="button" className="pk-reset lk" onClick={nudge.onAction}>
            {nudge.action}
          </button>
        </div>
      )}
    </li>
  );
}

/** A lista que recebe as linhas de hábito, num cartão com divisórias. Quadro: .card.lst. */
export function HabitList({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <ul className={clsx('pk-card pk-lst', className)} aria-label={label}>
      {children}
    </ul>
  );
}
