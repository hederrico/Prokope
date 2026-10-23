// O balão do Zeno (componentes.md › TourBalloon): o texto do passo, "3 de 9", "Próximo" e "Sair do tutorial".
// É um cartão flutuante (--raised, raio de cartão, sombra das folhas) com uma ponta que aponta para a cabeça do Zeno
// ou para o alvo. Entra com fadeUp em base e sai em micro; com movimento reduzido, só a opacidade.
import { forwardRef, type KeyboardEvent } from 'react';
import { m } from 'motion/react';
import { Button } from '@/components/ui';
import { distance, tween } from '@/motion/tokens';

export interface BalloonAction {
  label: string;
  onClick: () => void;
}

export interface BalloonProps {
  id: string;
  text: string;
  counter?: string | null;
  /** botão principal: "Próximo", "Concluir", "Vamos", "Mostrar" */
  primary?: BalloonAction | null;
  /** botão de texto: "Agora não" */
  secondary?: BalloonAction | null;
  /** "Sair do tutorial" */
  onExit?: (() => void) | null;
  /** onde fica a ponta, em px a partir da borda esquerda (em cima e embaixo) ou do topo (dos lados); null sem ponta */
  tail: number | null;
  /**
   * o balão está embaixo da âncora (a ponta fica em cima), em cima (a ponta fica embaixo), ou à esquerda e à direita
   * da cabeça do Zeno (a ponta fica na borda do lado dele)
   */
  side: 'above' | 'below' | 'dock' | 'left' | 'right';
  width: number;
  /** altura mínima (encostado em cima, cobre o título do passo por inteiro) */
  minHeight?: number;
}

export const Balloon = forwardRef<HTMLElement, BalloonProps>(function Balloon(
  { id, text, counter, primary, secondary, onExit, tail, side, width, minHeight },
  ref,
) {
  const onKeyDown = (e: KeyboardEvent) => {
    // no computador, Esc sai do tutorial (com o foco no balão)
    if (e.key === 'Escape' && onExit) {
      e.stopPropagation();
      onExit();
    }
  };
  const hasFoot = !!(counter || primary || secondary || onExit);
  return (
    <m.section
      ref={ref}
      className="tt-balloon"
      style={{ width, minHeight: minHeight || undefined }}
      tabIndex={-1}
      aria-labelledby={`${id}-who`}
      onKeyDown={onKeyDown}
      initial={{ opacity: 0, y: side === 'above' ? -distance.rise : distance.rise }}
      animate={{ opacity: 1, y: 0, transition: tween.base }}
      exit={{ opacity: 0, transition: tween.exit }}
    >
      <span className="tt-who" id={`${id}-who`}>
        Zeno
      </span>
      <p className="tt-text">{text}</p>
      {hasFoot && (
        <div className="tt-foot">
          {counter && <span className="tt-count">{counter}</span>}
          <span className="tt-acts">
            {onExit && (
              <Button variant="ghost" size="sm" className="tt-exit" onClick={onExit}>
                Sair do tutorial
              </Button>
            )}
            {secondary && (
              <Button variant="ghost" size="sm" onClick={secondary.onClick}>
                {secondary.label}
              </Button>
            )}
            {primary && (
              <Button size="sm" onClick={primary.onClick}>
                {primary.label}
              </Button>
            )}
          </span>
        </div>
      )}
      {tail !== null && side !== 'dock' && (
        <span
          className="tt-tail"
          data-side={side}
          style={side === 'left' || side === 'right' ? { top: tail } : { left: tail }}
          aria-hidden="true"
        />
      )}
    </m.section>
  );
});
