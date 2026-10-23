// ColorPalette: as 12 cores da paleta dos pilares, 6 por linha, bolinhas de 44 px. A cor já usada mostra o ícone
// do pilar dono (forma junto da cor) e não bloqueia. Grupo de rádio "Cor": "Damasco, usada em Corpo. 2 de 12".
// A escolhida ganha o anel (cresce com a mola toque) e o ✓ (entra em micro). As setas trocam de cor.
import { useRef } from 'react';
import { Icon } from '@/icons';
import { PALETTE, PALETTE_KEYS, type PaletteKey } from '@/styles/palette';
import type { Pillar } from '@/types';
import './settings.css';

export function ColorPalette({
  value,
  onChange,
  pillars,
  exceptId,
}: {
  value: PaletteKey;
  onChange: (c: PaletteKey) => void;
  /** pilares ativos (a cor usada mostra o ícone do dono) */
  pillars: Pillar[];
  /** o pilar sendo editado não conta como dono */
  exceptId?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const owner = (c: PaletteKey) => pillars.find((p) => !p.archived && p.color === c && p.id !== exceptId);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const j = (i + dir + PALETTE_KEYS.length) % PALETTE_KEYS.length;
    onChange(PALETTE_KEYS[j]);
    refs.current[j]?.focus();
  };

  return (
    <div className="st-colors" role="radiogroup" aria-label="Cor">
      {PALETTE_KEYS.map((c, i) => {
        const on = c === value;
        const used = owner(c);
        return (
          <button
            key={c}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            aria-label={`${PALETTE[c].name}${used ? `, usada em ${used.name}` : ''}`}
            className={`pk-reset st-color hued${used && !on ? ' used' : ''}`}
            data-hue={c}
            onClick={() => onChange(c)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {on ? <Icon name="check" weight="bold" /> : used ? <Icon name={used.icon} weight="bold" /> : null}
          </button>
        );
      })}
    </div>
  );
}
