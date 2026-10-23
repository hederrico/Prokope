// ThemePreview: a mini tela de cada tema (Sistema, Claro, Escuro), com as cores fixas de cada um, para a prévia
// não mudar quando o tema do app troca. Grupo de rádio "Tema" ("Tema Escuro, 3 de 3"). Quadro: .xf-th e .xf-mini.
import { useRef } from 'react';
import { Radio } from '@/components/ui';
import type { ThemePref } from '@/types';
import './settings.css';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

function MiniScreen({ tone, half }: { tone: 'l' | 'd'; half?: boolean }) {
  const rows: [string, boolean, number][] = [
    ['--pm', true, 70],
    ['--pf', true, 82],
    ['--pa', false, 58],
    ['--pc', false, 74],
  ];
  return (
    <div className={`st-scr ${tone}${half ? ' half' : ''}`}>
      <i className="st-isl" />
      <i className="st-ln" style={{ width: '42%' }} />
      <i className="st-tt" />
      <div className="st-mwk">
        {[1, 1, 1, 1, 0, 0, 0].map((on, i) => (
          <i key={i} className={on ? 'on' : undefined} />
        ))}
      </div>
      <div className="st-mc">
        {rows.map(([c, on, w]) => (
          <span key={c} className="st-mr" style={{ ['--c' as string]: `var(${c})` }}>
            <b />
            <i className="st-ln" style={{ width: `${w}%` }} />
            <u className={on ? 'on' : undefined} />
          </span>
        ))}
      </div>
      <div className="st-mc">
        <i className="st-ln" style={{ width: '46%' }} />
        <span className="st-mbar">
          <i style={{ width: '58%' }} />
        </span>
      </div>
      <div className="st-mtb">
        <i className="on" />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export function ThemePicker({ value, onChange }: { value: ThemePref; onChange: (t: ThemePref) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const j = (i + dir + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[j].value);
    refs.current[j]?.focus();
  };
  return (
    <div className="st-themes" role="radiogroup" aria-label="Tema">
      {OPTIONS.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`Tema ${o.label}`}
            tabIndex={on ? 0 : -1}
            className="pk-reset st-th"
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="st-mini" aria-hidden="true">
              {o.value === 'system' ? (
                <>
                  <MiniScreen tone="l" />
                  <MiniScreen tone="d" half />
                </>
              ) : (
                <MiniScreen tone={o.value === 'light' ? 'l' : 'd'} />
              )}
            </span>
            <b aria-hidden="true">{o.label}</b>
            <Radio checked={on} />
          </button>
        );
      })}
    </div>
  );
}
