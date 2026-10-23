// O formulário do pilar no primeiro acesso: nome, cor (paleta fechada de 12) e ícone (catálogo com busca).
// Grava só no rascunho: os pilares vão para os dados no passo 3. Abre numa folha alta por cima do passo 2
// (o formulário de Ajustes não serve aqui, porque ele grava direto nos dados).
import { useState } from 'react';
import { Sheet } from '@/components/shell';
import { Button, TextField, pillarAttrs } from '@/components/ui';
import { ICON_CATALOG, ICON_CATEGORIES, searchIcons, suggestCategory, type DraftPillar } from '@/data';
import { Icon, type IconName } from '@/icons';
import { PALETTE, PALETTE_KEYS } from '@/styles/palette';
import type { PaletteKey } from '@/types';
import { newPillarKey } from './plan';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export function PillarForm({
  open,
  pillar,
  pillars,
  onSave,
  onClose,
}: {
  open: boolean;
  /** o pilar sendo editado, ou null para um novo */
  pillar: DraftPillar | null;
  pillars: DraftPillar[];
  onSave: (p: DraftPillar) => void;
  onClose: () => void;
}) {
  const others = pillars.filter((p) => p.key !== pillar?.key);
  const [name, setName] = useState(pillar?.name ?? '');
  const [color, setColor] = useState<PaletteKey>(
    () => pillar?.color ?? PALETTE_KEYS.find((k) => !others.some((p) => p.enabled && p.color === k)) ?? PALETTE_KEYS[0],
  );
  const [icon, setIcon] = useState<IconName | null>(pillar?.icon ?? null);
  const [query, setQuery] = useState('');

  const trimmed = name.trim();
  const dup = trimmed ? others.find((p) => norm(p.name) === norm(trimmed)) : undefined;
  const category = suggestCategory(trimmed);
  const suggested = category ? ICON_CATALOG.filter((e) => e.category === category) : [];
  const shownIcon: IconName = icon ?? suggested[0]?.name ?? 'circles-four';
  const valid = !!trimmed && !dup;
  const usedBy = others.find((p) => p.enabled && p.color === color);
  const isNew = !pillar;

  function save() {
    if (!valid) return;
    onSave({
      key: pillar?.key ?? newPillarKey(),
      name: trimmed,
      color,
      icon: shownIcon,
      description: pillar?.description,
      enabled: pillar?.enabled ?? true,
    });
    onClose();
  }

  const results = query.trim() ? searchIcons(query) : null;
  const groups = results
    ? [{ key: 'busca', label: results.length ? 'Resultados' : 'Nada com esse nome', items: results }]
    : [
        ...(suggested.length ? [{ key: 'sug', label: 'Sugeridos pelo nome', items: suggested }] : []),
        ...ICON_CATEGORIES.filter((c) => c.key !== category).map((c) => ({
          key: c.key,
          label: c.label,
          items: ICON_CATALOG.filter((e) => e.category === c.key),
        })),
      ];
  const attrs = pillarAttrs(color);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      tall
      keyboardAware
      title={isNew ? 'Novo pilar' : 'Editar pilar'}
      footer={
        <Button wide disabled={!valid} onClick={save}>
          {isNew ? 'Criar' : 'Salvar'}
        </Button>
      }
    >
      <div className={`ob-pf ${attrs.className ?? ''}`} data-hue={attrs['data-hue']}>
        <div className="pk-card tint ob-pf-prev" aria-hidden="true">
          <span className="pk-bub lg">
            <Icon name={shownIcon} />
          </span>
          <span>
            <b>{trimmed || 'Novo pilar'}</b>
            <span className="cap">Prévia</span>
          </span>
        </div>
        <TextField
          label="Nome"
          value={name}
          onChange={setName}
          maxLength={40}
          error={dup ? `Já existe um pilar ${dup.name}.` : undefined}
        />
        <div>
          <div className="ob-pf-label" id="ob-pf-color">
            Cor
            <span>
              {PALETTE[color].name}
              {usedBy ? ` · também em ${usedBy.name}` : ''}
            </span>
          </div>
          <div className="ob-colors" role="radiogroup" aria-labelledby="ob-pf-color">
            {PALETTE_KEYS.map((k) => {
              const a = pillarAttrs(k);
              const owner = others.find((p) => p.enabled && p.color === k);
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={k === color}
                  aria-label={owner ? `${PALETTE[k].name}, também em ${owner.name}` : PALETTE[k].name}
                  className={`ob-color ${a.className ?? ''}`}
                  data-hue={a['data-hue']}
                  onClick={() => setColor(k)}
                >
                  {owner && <Icon name={owner.icon} weight="bold" />}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="ob-pf-label" id="ob-pf-icon">
            Ícone
          </div>
          <TextField
            label="Buscar ícone"
            hideLabel
            icon="magnifying-glass"
            placeholder="Buscar: sono, água, dinheiro…"
            value={query}
            onChange={setQuery}
            inputMode="search"
          />
          <div className="ob-icons" role="radiogroup" aria-labelledby="ob-pf-icon" style={{ marginTop: 10 }}>
            {groups.map((g) => (
              <div key={g.key} style={{ display: 'contents' }}>
                <span className="ob-icons-l">{g.label}</span>
                {g.items.map((e) => (
                  <button
                    key={`${g.key}-${e.name}`}
                    type="button"
                    role="radio"
                    aria-checked={e.name === shownIcon}
                    aria-label={e.label}
                    className="ob-ic"
                    onClick={() => setIcon(e.name)}
                  >
                    <Icon name={e.name} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
