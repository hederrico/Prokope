// Provisório da casca (B1): o agente D5 troca este arquivo pela tela de verdade (docs/interacao/telas/jornada.md › Revisão de domingo).
// Fluxo em passos: StepTop com voltar e X, conteúdo com StepTransition, passos trocando a entrada (replace).
import { useNavigate, useParams } from 'react-router';
import { FullScreen, StepTop, StepTransition, useFlowStep, useGoBack } from '@/components/shell';
import { PlaceholderNote } from '@/components/shell/Placeholder';

const TITLES = ['Como foi a semana', 'O que ajudou', 'E agora?'];

export default function ReviewScreen() {
  const { semana = '' } = useParams();
  const { step, goTo } = useFlowStep();
  const goBack = useGoBack();
  const navigate = useNavigate();
  const n = Math.min(3, Math.max(1, step));
  return (
    <FullScreen
      top={<StepTop step={n} total={3} onBack={() => goTo(n - 1)} onClose={() => goBack('/hoje')} />}
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
          onClick={() => (n < 3 ? goTo(n + 1) : void navigate(`/revisao/${semana}/fim`, { replace: true }))}
        >
          Continuar
        </button>
      }
    >
      <StepTransition step={n}>
        <div style={{ padding: '16px 16px 0' }}>
          <h1 className="ttl2" style={{ margin: '0 0 12px' }}>
            {TITLES[n - 1]}
          </h1>
          <PlaceholderNote owner="D5" />
        </div>
      </StepTransition>
    </FullScreen>
  );
}
