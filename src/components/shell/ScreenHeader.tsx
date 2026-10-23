// O cabeçalho de aba (componentes.md › ScreenHeader; quadro: hd()): o contexto (data ou "Desde 21 de setembro")
// e o título na serifa 32, com um espaço à direita (Semana · Mês no Progresso). O título é o h1 da tela.
import type { ReactNode } from 'react';

export interface ScreenHeaderProps {
  context?: string;
  title: string;
  trailing?: ReactNode;
  className?: string;
}

export function ScreenHeader({ context, title, trailing, className }: ScreenHeaderProps) {
  return (
    <header className={className ? `sh-hd ${className}` : 'sh-hd'}>
      <div className="sh-hd-row">
        <span className="sh-hd-ctx">{context}</span>
        {trailing}
      </div>
      <h1 tabIndex={-1}>{title}</h1>
    </header>
  );
}
