// Moldura de uma tela cheia (entrada, corrida, revisão, fase, formulários): o topo (NavBar, StepTop ou nada),
// o conteúdo e o pé preso embaixo, com as áreas seguras. A barra de abas não aparece.
// Num passo feito de rotas (RouteSteps: Novo hábito · tipo → detalhes), só o conteúdo faz o passo; o topo fica parado.
import { useContext, type ReactNode } from 'react';
import { m } from 'motion/react';
import { RouteStepContext } from './routeStep';

export interface FullScreenProps {
  /** <NavBar cancel ... />, <StepTop ... /> ou nada */
  top?: ReactNode;
  /** botão principal preso no pé ("Continuar", "Ver meu dia") */
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function FullScreen({ top, footer, className, children }: FullScreenProps) {
  const step = useContext(RouteStepContext);
  return (
    <div
      className={className ? `sh-full ${className}` : 'sh-full'}
      style={top ? undefined : { paddingTop: 'var(--safe-top)' }}
    >
      {top}
      {step ? (
        <m.main className="sh-full-body" variants={step.variants} custom={step.dir}>
          {children}
        </m.main>
      ) : (
        <main className="sh-full-body">{children}</main>
      )}
      {footer != null && <div className="sh-full-foot">{footer}</div>}
    </div>
  );
}
