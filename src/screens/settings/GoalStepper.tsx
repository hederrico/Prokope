// GoalStepper: a meta com − e + (Novo hábito · detalhes). Um passo por toque (g 5, ml 250, L 0,25, vezes 1, min 5);
// segurar repete a cada 120 ms depois de 400 ms; o − desabilita no passo mínimo. O número rola com NumberFlow em fill
// e, tocado, vira campo no lugar (inputmode decimal). Leitor de tela: "Meta, 80 gramas por dia. Ajustável."
import { useState } from 'react';
import { NumberFlow } from '@/components/ui';
import { formatNumber } from '@/data';
import { Icon } from '@/icons';
import { useHoldRepeat } from './hooks';
import { roundStep, unitName } from './habitForm';
import './settings.css';

export function GoalStepper({
  value,
  onChange,
  step,
  min,
  max = 100000,
  unit,
  caption,
  label = 'Meta',
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  /** o menor valor (padrão: um passo) */
  min?: number;
  max?: number;
  /** unidade mostrada depois do número ("g") */
  unit?: string;
  /** "por dia", "por semana" */
  caption?: string;
  label?: string;
}) {
  const floor = min ?? step;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const set = (v: number) => onChange(Math.min(max, Math.max(floor, roundStep(v, step))));
  const atMin = value <= floor;
  const atMax = value >= max;
  const dec = useHoldRepeat(() => set(value - step), atMin);
  const inc = useHoldRepeat(() => set(value + step), atMax);
  const spoken = `${label}, ${formatNumber(value, 2)} ${unitName(unit)} ${caption ?? ''}`.replace(/\s+/g, ' ').trim();

  const commit = () => {
    const n = Number(text.replace(',', '.'));
    if (Number.isFinite(n) && n > 0) onChange(Math.min(max, Math.max(floor, n)));
    setEditing(false);
  };

  return (
    <div className="st-step">
      <button
        type="button"
        className="pk-reset st-sb"
        aria-label={`Diminuir ${label.toLocaleLowerCase('pt-BR')}`}
        aria-disabled={atMin || undefined}
        {...dec}
      >
        <Icon name="minus" weight="bold" />
      </button>
      <span className="st-sv">
        {editing ? (
          <input
            className="st-sv-input"
            inputMode="decimal"
            enterKeyHint="done"
            aria-label={label}
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <span
            className="st-sv-num"
            role="spinbutton"
            tabIndex={0}
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={floor}
            aria-valuemax={max}
            aria-valuetext={spoken}
            onClick={() => {
              setText(formatNumber(value, 2));
              setEditing(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                e.preventDefault();
                if (!atMax) set(value + step);
              } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                e.preventDefault();
                if (!atMin) set(value - step);
              } else if (e.key === 'Enter') {
                setText(formatNumber(value, 2));
                setEditing(true);
              }
            }}
          >
            <NumberFlow value={value} format={{ maximumFractionDigits: 2 }} suffix={unit ? ` ${unit}` : undefined} />
          </span>
        )}
        {caption && <span className="cap">{caption}</span>}
      </span>
      <button
        type="button"
        className="pk-reset st-sb"
        aria-label={`Aumentar ${label.toLocaleLowerCase('pt-BR')}`}
        aria-disabled={atMax || undefined}
        {...inc}
      >
        <Icon name="plus" weight="bold" />
      </button>
    </div>
  );
}
