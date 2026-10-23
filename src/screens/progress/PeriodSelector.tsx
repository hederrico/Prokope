// PeriodSelector: "‹ período ›" no topo do Progresso (quadro: progHead()). Anda por semana, mês ou fase,
// voltando no tempo; a seta da frente fica desligada no período atual. É um grupo "Período".
import { Icon } from '@/icons';

export interface PeriodSelectorProps {
  label: string;
  sublabel?: string | null;
  onPrev?: (() => void) | null;
  onNext?: (() => void) | null;
}

export function PeriodSelector({ label, sublabel, onPrev, onNext }: PeriodSelectorProps) {
  return (
    <div className="pg-pn" role="group" aria-label="Período">
      <button
        type="button"
        className="pk-reset pg-ar"
        aria-label="Período anterior"
        aria-disabled={!onPrev || undefined}
        onClick={() => onPrev?.()}
      >
        <Icon name="caret-left" weight="bold" />
      </button>
      <span className="pg-pl" aria-live="polite">
        <b>{label}</b>
        {sublabel && <small>{sublabel}</small>}
      </span>
      <button
        type="button"
        className="pk-reset pg-ar"
        aria-label="Próximo período"
        aria-disabled={!onNext || undefined}
        onClick={() => onNext?.()}
      >
        <Icon name="caret-right" weight="bold" />
      </button>
    </div>
  );
}
