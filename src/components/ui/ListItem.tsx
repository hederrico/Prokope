// ListItem: a linha no estilo de Ajustes. Quadro: li().
// Com bolha de ícone (neutra; cor de pilar só em pilar e hábito), valor e seta, Switch, TimeValue ou de atenção.
// A linha inteira é o alvo: com onClick vira botão; com `toggle`, a linha inteira liga e desliga o Switch.
import clsx from 'clsx';
import { useId, type ReactNode } from 'react';
import { Icon, type IconName } from '@/icons';
import { PillarBubble } from './PillarBubble';
import type { PillarColor } from './pillar';
import { Switch } from './Switch';
import './ui.css';

export type ListItemProps = {
  icon?: IconName;
  pillar?: PillarColor;
  title: string;
  subtitle?: string;
  /** texto à direita ("6h50", "Sistema") */
  value?: string;
  /** seta à direita (padrão: quando há onClick) */
  chevron?: boolean;
  /** algo à direita no lugar do valor (TimeValue, Tag) */
  trailing?: ReactNode;
  /** de atenção ("Apagar todos os dados"): --warning-ink, com o texto dizendo o que faz */
  tone?: 'warn';
  onClick?: () => void;
  /** interruptor da linha; o nome dele é o título */
  toggle?: { checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean };
  className?: string;
};

export function ListItem({
  icon,
  pillar,
  title,
  subtitle,
  value,
  chevron,
  trailing,
  tone,
  onClick,
  toggle,
  className,
}: ListItemProps) {
  const id = useId();
  const cls = clsx('pk-reset pk-li', !icon && 'noic', tone === 'warn' && 'warn', className);
  const bubble = icon && <PillarBubble icon={icon} pillar={pillar} size="li" />;
  const text = (
    <span>
      <b id={`${id}-t`}>{title}</b>
      {subtitle && <small>{subtitle}</small>}
    </span>
  );
  const showChevron = chevron ?? (!!onClick && !toggle);
  const right = toggle ? (
    <Switch
      checked={toggle.checked}
      onCheckedChange={toggle.onCheckedChange}
      labelledBy={`${id}-t`}
      disabled={toggle.disabled}
    />
  ) : (
    (trailing ?? (
      <span className="rv">
        {value}
        {showChevron && <Icon name="caret-right" weight="bold" />}
      </span>
    ))
  );

  if (toggle) {
    // a linha liga e desliga; o Switch continua sendo o controle com papel e estado
    return (
      <div
        className={clsx(cls, 'pk-li-toggle')}
        onClick={(e) => {
          if (toggle.disabled) return;
          if ((e.target as HTMLElement).closest('.pk-sw')) return;
          toggle.onCheckedChange(!toggle.checked);
        }}
        style={{ cursor: toggle.disabled ? 'default' : 'pointer' }}
      >
        {bubble}
        {text}
        {right}
      </div>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {bubble}
        {text}
        {right}
      </button>
    );
  }
  return (
    <div className={cls}>
      {bubble}
      {text}
      {right}
    </div>
  );
}
