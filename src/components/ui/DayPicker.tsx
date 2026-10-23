// DayPicker: os dias da semana (agenda de um hábito, coleta do lixo, revisão). Quadro: days(sel, { p, single, label }).
// Vários dias (caixas de seleção) ou um só (single, grupo de rádio do Base UI, com setas).
// Marcado: fundo --wash, contorno de 1,5 px em --mark, texto em --ink e ✓ embaixo do nome. Fundo e ✓ em micro.
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import clsx from 'clsx';
import { Icon } from '@/icons';
import { pillarAttrs, type PillarColor } from './pillar';
import './ui.css';

export type DayPickerProps = {
  /** dias marcados: 0 = segunda ... 6 = domingo */
  value: number[];
  onChange: (v: number[]) => void;
  single?: boolean;
  pillar?: PillarColor;
  /** nome do grupo: "Dias de coleta" */
  label: string;
  className?: string;
};

const SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const FULL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export function DayPicker({ value, onChange, single, pillar, label, className }: DayPickerProps) {
  const p = pillarAttrs(pillar);
  const attrs = { 'data-pillar': p['data-pillar'], 'data-hue': p['data-hue'] };
  if (single) {
    return (
      <RadioGroup
        value={value[0] ?? null}
        onValueChange={(v) => onChange([v as number])}
        aria-label={label}
        className={clsx('pk-days', p.className, className)}
        {...attrs}
      >
        {SHORT.map((d, i) => (
          <Radio.Root key={i} value={i} aria-label={FULL[i]} className="pk-day pk-press">
            {d}
            <Icon name="check" weight="bold" />
          </Radio.Root>
        ))}
      </RadioGroup>
    );
  }
  const toggle = (i: number) =>
    onChange(value.includes(i) ? value.filter((x) => x !== i) : [...value, i].sort((a, b) => a - b));
  return (
    <div role="group" aria-label={label} className={clsx('pk-days', p.className, className)} {...attrs}>
      {SHORT.map((d, i) => (
        <button
          key={i}
          type="button"
          role="checkbox"
          aria-checked={value.includes(i)}
          aria-label={FULL[i]}
          className="pk-reset pk-day pk-press"
          onClick={() => toggle(i)}
        >
          {d}
          <Icon name="check" weight="bold" />
        </button>
      ))}
    </div>
  );
}
