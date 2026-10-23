// FoldedGroup: um momento do dia recolhido numa linha, distante (a Noite de manhã) ou completo ("Tudo feito",
// "Feitos hoje · 8"). Quadro: fold(icons, mais, título, sub). Até 4 ícones empilhados e "+n" quando há mais.
// Abre no lugar: o cartão cresce com a mola calma, a seta gira 180° em micro e os itens entram em cascata
// (30 ms, no máximo 6, pelo CSS: as linhas são <li> da própria lista). Recolher faz o inverso, sem cascata. Reduzido: troca de altura sem animação e opacidade em micro.
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '@/icons';
import { spring } from '@/motion/tokens';
import { nodeText, useReduced } from './lib';
import { PillarBubble } from './PillarBubble';
import type { PillarColor } from './pillar';
import './ui.css';

export type FoldedGroupProps = {
  icons: { icon: IconName; pillar: PillarColor }[];
  /** ícones que não couberam (o "+3") */
  more?: number;
  title: string;
  /** "louça, lixo, jantar e mais 3", ou com o ✓: "peso, acordar e caminhada" */
  subtitle: ReactNode;
  /** mostra o ✓ verde antes do subtítulo (momento completo) */
  complete?: boolean;
  expanded: boolean;
  onToggle: () => void;
  /** as linhas (HabitRow) que aparecem ao abrir */
  children?: ReactNode;
  className?: string;
};

export function FoldedGroup({
  icons,
  more,
  title,
  subtitle,
  complete,
  expanded,
  onToggle,
  children,
  className,
}: FoldedGroupProps) {
  const reduced = useReduced();
  const id = useId();
  // aberto já na montagem: sem cascata; a cada abertura depois disso, com cascata
  const [prevExpanded, setPrevExpanded] = useState(expanded);
  const [cascade, setCascade] = useState(false);
  if (expanded !== prevExpanded) {
    setPrevExpanded(expanded);
    if (expanded) setCascade(true);
  }
  const shown = icons.slice(0, 4);
  const extra = (more ?? 0) + Math.max(0, icons.length - 4);
  return (
    <div className={clsx('pk-card pk-foldc', className)}>
      <button
        type="button"
        className="pk-reset pk-fold"
        aria-expanded={expanded}
        aria-controls={`${id}-body`}
        aria-label={`${title}, ${nodeText(subtitle)}`}
        onClick={onToggle}
      >
        <span className="pk-ics" aria-hidden="true">
          {shown.map((ic, i) => (
            <PillarBubble key={i} icon={ic.icon} pillar={ic.pillar} size="xs" />
          ))}
          {extra > 0 && <span className="pk-bub xs more">+{extra}</span>}
        </span>
        <span aria-hidden="true">
          <b>{title}</b>
          <small>
            {complete && <Icon name="check" weight="bold" />}
            {subtitle}
          </small>
        </span>
        <span className="cv" aria-hidden="true">
          <Icon name="caret-down" weight="bold" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            key="body"
            id={`${id}-body`}
            className={clsx('pk-fold-body', cascade && 'cascade')}
            initial={{ height: 0 }}
            animate={{ height: 'auto', transition: reduced ? { duration: 0 } : spring.calma }}
            exit={{ height: 0, transition: reduced ? { duration: 0 } : spring.calma }}
          >
            <ul className="pk-lst">{children}</ul>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
