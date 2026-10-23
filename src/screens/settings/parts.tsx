// Peças comuns das telas de Ajustes: a linha com subtítulo rico (selo, aviso), o valor tocável que abre uma folha,
// a folha de escolha única e o repetir ao segurar dos botões − e +.
import clsx from 'clsx';
import { useEffect, useRef, type ReactNode } from 'react';
import { Sheet } from '@/components/shell';
import { PillarBubble, pillarAttrs, type PillarColor } from '@/components/ui';
import { Icon, type IconName } from '@/icons';
import './settings.css';

export type RowProps = {
  icon?: IconName;
  pillar?: PillarColor;
  title: ReactNode;
  /** selo ao lado do título ("fase 4") */
  titleTag?: ReactNode;
  subtitle?: ReactNode;
  /** selo numa linha própria, abaixo do subtítulo ("principal em Família") */
  badge?: ReactNode;
  value?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  tone?: 'warn';
  /** hábitos de um pilar arquivado: texto em --text-2 */
  muted?: boolean;
  onClick?: () => void;
  /** nome lido do botão, quando o texto visível não basta */
  label?: string;
  className?: string;
};

/** A linha de Ajustes (pk-li), com subtítulo e selo que o ListItem da base não tem. */
export function Row({
  icon,
  pillar,
  title,
  titleTag,
  subtitle,
  badge,
  value,
  trailing,
  chevron,
  tone,
  muted,
  onClick,
  label,
  className,
}: RowProps) {
  const showChevron = chevron ?? !!onClick;
  const cls = clsx('pk-reset pk-li st-row', !icon && 'noic', tone === 'warn' && 'warn', muted && 'st-muted', className);
  const body = (
    <>
      {icon && <PillarBubble icon={icon} pillar={pillar} size="li" />}
      <span className="st-row-t">
        <b>
          {title}
          {titleTag}
        </b>
        {subtitle && <small>{subtitle}</small>}
        {badge && <span className="st-row-badge">{badge}</span>}
      </span>
      {trailing ?? (
        <span className="rv">
          {value}
          {showChevron && <Icon name="caret-right" weight="bold" />}
        </span>
      )}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} aria-label={label}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

/** O valor tocável que abre uma folha ("dom, 18:00", "qui, 24 dez"), no desenho do TimeValue. */
export function ValueButton({
  children,
  onClick,
  label,
  off,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  off?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={clsx('pk-reset pk-tval st-vbtn hit', off && 'off', className)}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Rodapé de grupo (quadro: .foot), com ícone opcional. */
export function Foot({
  children,
  icon,
  center,
  className,
}: {
  children: ReactNode;
  icon?: IconName;
  center?: boolean;
  className?: string;
}) {
  return (
    <p className={clsx('foot st-foot', center && 'st-foot-c', className)}>
      {icon && <Icon name={icon} weight="regular" />}
      {children}
    </p>
  );
}

export interface Choice<T extends string> {
  value: T;
  label: string;
  detail?: string;
  icon?: IconName;
  pillar?: PillarColor;
}

/** Folha de escolha única (pilar, momento do dia, unidade): o toque escolhe e a folha fecha sozinha. */
export function ChoiceSheet<T extends string>({
  open,
  onOpenChange,
  title,
  options,
  value,
  onChange,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: Choice<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
  footer?: ReactNode;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} footer={footer}>
      <div className="pk-lg st-choices" role="radiogroup" aria-label={title}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              className={clsx('pk-reset pk-li st-choice', !o.icon && !o.pillar && 'noic')}
              onClick={() => {
                onChange(o.value);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => onOpenChange(false), 200);
              }}
            >
              {o.icon ? (
                <PillarBubble icon={o.icon} pillar={o.pillar} size="li" />
              ) : o.pillar ? (
                <Dot color={o.pillar} />
              ) : null}
              <span className="st-row-t">
                <b>{o.label}</b>
                {o.detail && <small>{o.detail}</small>}
              </span>
              <span className={clsx('st-choice-check', on && 'on')} aria-hidden="true">
                <Icon name="check" weight="bold" />
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

/** A bolinha da cor do pilar (linha Pilar do formulário). */
export function Dot({ color }: { color: PillarColor }) {
  const p = pillarAttrs(color);
  return (
    <span
      className={clsx('st-dot', p.className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      aria-hidden="true"
    />
  );
}
