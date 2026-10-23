// IconPicker: a biblioteca de 154 ícones em 10 categorias, com busca sem acento (Novo pilar e o lápis do Novo hábito).
// Sem busca, a grade mostra as categorias (a sugerida pelo nome no topo, com "sugerido pelo nome"); os chips rolam
// a grade até a categoria. Com texto, vira "Resultados · 6", e a contagem é anunciada ("6 ícones").
// O ícone escolhido tem o fundo cheio da cor do pilar (--fill), que entra com a mola toque.
import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { animate } from 'motion/react';
import { Chip, ChipRow, EmptyState, TextField } from '@/components/ui';
import { Icon, type IconName } from '@/icons';
import { spring } from '@/motion/tokens';
import { usePrefersReducedMotion } from '@/motion/reducedMotion';
import { ICON_CHIPS, iconCountLabel, iconSections, searchIcons, type IconEntry } from './iconLibrary';
import './settings.css';

export function IconPicker({
  value,
  onChange,
  suggested,
  className,
}: {
  value: IconName;
  onChange: (icon: IconName) => void;
  /** categoria sugerida pelo nome (sobe para o topo) */
  suggested: string | null;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState('todos');
  const gridRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const uid = useId();
  const q = query.trim();
  const results = q ? searchIcons(q) : null;
  const sections = iconSections(suggested);

  // a grade troca com opacidade em micro, sem cascata
  const gridKey = q ? 'q' : 'all';
  useEffect(() => {
    const el = gridRef.current;
    if (!el || reduced) return;
    animate(el, { opacity: [0.4, 1] }, { duration: 0.15 });
  }, [gridKey, reduced]);

  const pickChip = (key: string) => {
    setChip(key);
    if (q) setQuery('');
    requestAnimationFrame(() => {
      const target =
        key === 'todos' ? gridRef.current : gridRef.current?.querySelector<HTMLElement>(`[data-cat="${key}"]`);
      target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  };

  const cell = (e: IconEntry) => (
    <IconCell key={e.name} entry={e} on={e.name === value} onPick={() => onChange(e.name)} reduced={reduced} />
  );

  return (
    <div className={clsx('st-icons-area', className)}>
      <div
        ref={searchRef}
        onFocusCapture={() =>
          searchRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
        }
      >
        <TextField
          label="Buscar ícone"
          hideLabel
          value={query}
          onChange={setQuery}
          placeholder="Buscar: sono, água, dinheiro…"
          inputMode="search"
          icon="magnifying-glass"
          enterKeyHint="search"
        />
      </div>
      <ChipRow nowrap className="st-cats" label="Categorias">
        {ICON_CHIPS.map((c) => (
          <Chip key={c.key} selected={q ? c.key === 'todos' : chip === c.key} onPressedChange={() => pickChip(c.key)}>
            {c.label}
          </Chip>
        ))}
      </ChipRow>
      <div ref={gridRef} className="st-icg" role="radiogroup" aria-label="Ícone" aria-describedby={`${uid}-count`}>
        {results ? (
          results.length ? (
            <>
              <h3 className="pk-gl in">Resultados · {results.length}</h3>
              {results.map(cell)}
            </>
          ) : (
            <EmptyState title={`Nenhum ícone para “${q}”. Tente “casa” ou “livro”.`} />
          )
        ) : (
          sections.map((s) => (
            <IconSectionBlock key={s.key} id={s.key} label={s.label} suggested={s.suggested}>
              {s.icons.map(cell)}
            </IconSectionBlock>
          ))
        )}
      </div>
      <span id={`${uid}-count`} className="pk-sr" aria-live="polite">
        {results ? iconCountLabel(results.length) : ''}
      </span>
    </div>
  );
}

function IconSectionBlock({
  id,
  label,
  suggested,
  children,
}: {
  id: string;
  label: string;
  suggested: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <h3 className="pk-gl in" data-cat={id}>
        {label}
        {suggested && <span>sugerido pelo nome</span>}
      </h3>
      {children}
    </>
  );
}

function IconCell({
  entry,
  on,
  onPick,
  reduced,
}: {
  entry: IconEntry;
  on: boolean;
  onPick: () => void;
  reduced: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={entry.label}
      title={entry.label}
      className="pk-reset st-ic"
      onClick={() => {
        onPick();
        if (!reduced && ref.current) animate(ref.current, { scale: [0.9, 1] }, spring.toque);
      }}
    >
      <Icon name={entry.name} />
    </button>
  );
}
