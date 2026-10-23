// Peças das telas provisórias da casca (etapa 1): o nome da tela e links de teste para andar pelo app.
// Cada agente de telas troca o arquivo da sua tela pela tela de verdade; isto deixa de ser usado sozinho.
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { withSheet, withoutSheet } from '@/app/sheets';

export interface TestLink {
  label: string;
  /** caminho; ou uma folha: { sheet: 'agua', args: { habito: 'x' } } */
  to?: string;
  sheet?: string;
  args?: Record<string, string>;
  replace?: boolean;
  onClick?: () => void;
}

export function PlaceholderNote({ owner, children }: { owner: string; children?: ReactNode }) {
  return (
    <div style={{ padding: '0 16px 12px', display: 'grid', gap: 6 }}>
      <p className="cap" style={{ margin: 0 }}>
        Tela provisória da casca. A tela de verdade vem do agente {owner}.
      </p>
      {children}
    </div>
  );
}

export function PlaceholderLinks({ links, title = 'Links de teste' }: { links: TestLink[]; title?: string }) {
  const { pathname, search } = useLocation();
  return (
    <section aria-label={title} style={{ padding: '0 16px 24px' }}>
      <h2
        className="cap"
        style={{ margin: '12px 4px 8px', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600 }}
      >
        {title}
      </h2>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          borderRadius: 20,
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-1)',
          overflow: 'hidden',
        }}
      >
        {links.map((l, i) => {
          const style = {
            display: 'flex',
            alignItems: 'center',
            minHeight: 52,
            padding: '0 16px',
            color: 'var(--accent-ink)',
            font: '500 16px/22px var(--font-ui)',
            textDecoration: 'none',
            borderTop: i ? '1px solid var(--border)' : undefined,
            width: '100%',
            background: 'none',
            border: 0,
            textAlign: 'left' as const,
          };
          if (l.onClick) {
            return (
              <li key={l.label} style={{ borderTop: i ? '1px solid var(--border)' : undefined }}>
                <button type="button" style={{ ...style, borderTop: undefined }} onClick={l.onClick}>
                  {l.label}
                </button>
              </li>
            );
          }
          const to = l.sheet ? { pathname, search: withSheet(search, l.sheet, l.args) } : (l.to ?? '/');
          const state = l.sheet ? { sheetBase: withoutSheet(search) } : undefined;
          return (
            <li key={l.label} style={{ borderTop: i ? '1px solid var(--border)' : undefined }}>
              <Link to={to} replace={l.replace} state={state} style={{ ...style, borderTop: undefined }}>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
