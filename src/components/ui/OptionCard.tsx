// OptionCard e OptionGroup: o cartão de escolha com rádio ("Com o plano base", "Do zero"). Quadro: .opt e radio().
// Grupo de rádio do Base UI, com nome. Escolhido: fundo --wash, contorno de 2 px em --mark e o rádio cheio.
// Contorno e fundo trocam em micro; o anel do rádio cresce com a curva da mola.
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { pillarAttrs, type PillarColor } from './pillar';
import { Radio } from './Radio';
import { Tag } from './Tag';
import './ui.css';

export type OptionGroupProps<T extends string> = {
  value: T | undefined;
  onChange: (v: T) => void;
  /** nome do grupo para o leitor */
  label: string;
  pillar?: PillarColor;
  children: ReactNode;
  className?: string;
};

export function OptionGroup<T extends string>({ value, onChange, label, pillar, children, className }: OptionGroupProps<T>) {
  const p = pillarAttrs(pillar);
  return (
    <RadioGroup
      value={value ?? null}
      onValueChange={(v) => onChange(v as T)}
      aria-label={label}
      className={clsx('pk-opts', p.className, className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
    >
      {children}
    </RadioGroup>
  );
}

export type OptionCardProps = {
  value: string;
  title: string;
  description?: string;
  /** selo ao lado do título ("sugerido") */
  badge?: string;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
};

/** Dentro de um OptionGroup. VoiceOver: "Com o plano base, sugerido. Botão de opção, 1 de 2, selecionado." */
export function OptionCard({ value, title, description, badge, children, disabled, className }: OptionCardProps) {
  return (
    <BaseRadio.Root
      value={value}
      disabled={disabled}
      aria-label={[title, badge, description].filter(Boolean).join(', ')}
      className={clsx('pk-opt', className)}
    >
      <span>
        <b>
          {title}
          {badge && <Tag lift>{badge}</Tag>}
        </b>
        {description && <span className="pk-opt-d">{description}</span>}
        {children}
      </span>
      <Radio />
    </BaseRadio.Root>
  );
}
