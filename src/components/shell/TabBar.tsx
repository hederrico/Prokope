// As quatro abas (componentes.md › TabBar; quadro: tb()). Ativa com ícone Fill e texto em --accent-ink;
// inativa com Regular e --text-3. O ícone novo passa a Fill com a mola toque. Rótulos de 11 px, fixos.
// Cada aba volta ao último caminho dela; tocar na aba ativa volta à raiz ou rola ao topo (quem decide é onSelect).
import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { m } from 'motion/react';
import { Icon } from '@/icons';
import { TABS, type TabId } from '@/app/screens';
import { spring } from '@/motion/tokens';

export interface TabBarProps {
  active: TabId;
  /** toque numa aba (a ativa ou outra) */
  onSelect?: (tab: TabId) => void;
  /** endereço de cada aba (o último caminho dela) */
  hrefFor?: (tab: TabId) => string;
}

export function TabBar({ active, onSelect, hrefFor }: TabBarProps) {
  const listRef = useRef<HTMLElement>(null);
  // a mola só toca quando a aba ativa muda (não na primeira pintura)
  const [shown, setShown] = useState({ active, changes: 0 });
  if (shown.active !== active) setShown({ active, changes: shown.changes + 1 });
  const changes = shown.active !== active ? shown.changes + 1 : shown.changes;

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    // setas andam entre as abas (computador)
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    const tabs = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
    const i = tabs.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    e.preventDefault();
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? tabs.length - 1
          : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next]?.focus();
  }

  return (
    <nav ref={listRef} className="sh-tb" role="tablist" aria-label="Seções" onKeyDown={onKeyDown}>
      {TABS.map((t) => {
        const on = t.id === active;
        const select = (e: MouseEvent | KeyboardEvent) => {
          e.preventDefault();
          onSelect?.(t.id);
        };
        return (
          <a
            key={t.id}
            href={hrefFor?.(t.id) ?? t.path}
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              select(e);
            }}
            onKeyDown={(e) => {
              if (e.key === ' ') select(e);
            }}
          >
            <span className="sh-tb-ic">
              {on ? (
                <m.span
                  key={changes}
                  initial={changes ? { scale: 0.8 } : false}
                  animate={{ scale: 1 }}
                  transition={spring.toque}
                  style={{ display: 'grid' }}
                >
                  <Icon name={t.icon} weight="fill" />
                </m.span>
              ) : (
                <Icon name={t.icon} weight="regular" />
              )}
            </span>
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
