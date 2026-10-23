// Provisório da casca (B1): o agente D3 troca este arquivo pela tela de verdade (docs/interacao/telas/entrada.md › Começar).
// Mostra o fluxo em passos da casca: StepTop parado, o conteúdo trocando com StepTransition e os passos com replace.
import { useNavigate } from 'react-router';
import { FullScreen, StepTop, StepTransition, useFlowStep } from '@/components/shell';
import { PlaceholderNote } from '@/components/shell/Placeholder';

const TITLES = ['Como você quer começar?', 'Seus pilares', 'Sua rotina'];

export default function OnboardingScreen() {
  const { step, goTo } = useFlowStep();
  const navigate = useNavigate();
  const n = Math.min(3, Math.max(1, step));
  return (
    <FullScreen
      top={<StepTop step={n} total={3} onBack={() => goTo(n - 1)} />}
      footer={
        <button
          type="button"
          style={{
            minHeight: 52,
            width: '100%',
            borderRadius: 999,
            border: 0,
            background: 'var(--btn-bg)',
            color: 'var(--btn-fg)',
            font: '600 17px/1.2 var(--font-ui)',
          }}
          onClick={() => (n < 3 ? goTo(n + 1) : void navigate('/hoje', { replace: true }))}
        >
          {n < 3 ? 'Continuar' : 'Começar'}
        </button>
      }
    >
      <StepTransition step={n}>
        <div style={{ padding: '16px 16px 0' }}>
          <h1 className="ttl2" style={{ margin: '0 0 12px' }}>
            {TITLES[n - 1]}
          </h1>
          <PlaceholderNote owner="D3" />
        </div>
      </StepTransition>
    </FullScreen>
  );
}
