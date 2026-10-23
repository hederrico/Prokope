// O topo dos fluxos em passos (componentes.md › StepTop; quadro: stepTop()): voltar a partir do passo 2, os trechos
// do progresso e o X quando o fluxo pode ser interrompido (a revisão pode; o primeiro acesso, não).
// O trecho do passo novo enche em fill, também com movimento reduzido (navegacao.md: "a barra enche igual"),
// por isso a animação é imperativa e não passa pelo MotionConfig.
import { useEffect } from 'react';
import { animate, m, useMotionValue, useTransform } from 'motion/react';
import { Icon } from '@/icons';
import { tween } from '@/motion/tokens';

export interface StepTopProps {
  step: number;
  total: number;
  onBack?: () => void;
  onClose?: () => void;
}

function Segment({ on }: { on: boolean }) {
  const fill = useMotionValue(0);
  const width = useTransform(fill, (v) => `${v}%`);
  useEffect(() => {
    const a = animate(fill, on ? 100 : 0, tween.fill);
    return () => a.stop();
  }, [on, fill]);
  return (
    <span>
      <m.i style={{ width }} />
    </span>
  );
}

export function StepTop({ step, total, onBack, onClose }: StepTopProps) {
  return (
    <div className="sh-steptop">
      {onBack && step > 1 ? (
        <button type="button" className="sh-ibtn hit" aria-label="Voltar" onClick={onBack}>
          <Icon name="caret-left" weight="bold" />
        </button>
      ) : (
        <span />
      )}
      <span
        className="sh-steps"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label={`Passo ${step} de ${total}`}
      >
        {Array.from({ length: total }, (_, i) => (
          <Segment key={i} on={i < step} />
        ))}
      </span>
      {onClose ? (
        <button type="button" className="sh-xbtn hit" aria-label="Fechar" onClick={onClose}>
          <Icon name="x" weight="bold" />
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
