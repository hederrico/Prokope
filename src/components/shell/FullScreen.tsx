// Moldura de uma tela cheia (entrada, corrida, revisão, fase, formulários): o topo (NavBar, StepTop ou nada),
// o conteúdo e o pé preso embaixo, com as áreas seguras. A barra de abas não aparece.
import type { ReactNode } from 'react';

export interface FullScreenProps {
  /** <NavBar cancel ... />, <StepTop ... /> ou nada */
  top?: ReactNode;
  /** botão principal preso no pé ("Continuar", "Ver meu dia") */
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function FullScreen({ top, footer, className, children }: FullScreenProps) {
  return (
    <div
      className={className ? `sh-full ${className}` : 'sh-full'}
      style={top ? undefined : { paddingTop: 'var(--safe-top)' }}
    >
      {top}
      <main className="sh-full-body">{children}</main>
      {footer != null && <div className="sh-full-foot">{footer}</div>}
    </div>
  );
}
