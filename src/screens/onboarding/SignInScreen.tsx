// Provisório da casca (B1): o agente D3 troca este arquivo pela tela de verdade (docs/interacao/telas/entrada.md).
import { useState } from 'react';
import { FullScreen } from '@/components/shell';
import { useSession } from '@/data/session';

export default function SignInScreen() {
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const button = {
    minHeight: 52,
    width: '100%',
    borderRadius: 999,
    border: 0,
    font: '600 17px/1.2 var(--font-ui)',
  } as const;
  return (
    <FullScreen
      footer={
        <div style={{ display: 'grid', gap: 10 }}>
          {error && (
            <p className="cap" role="status" style={{ margin: 0, textAlign: 'center' }}>
              {error}
            </p>
          )}
          {session.firebaseAvailable && (
            <button
              type="button"
              style={{
                ...button,
                background: 'var(--surface)',
                color: 'var(--text)',
                boxShadow: 'inset 0 0 0 1px var(--border-strong)',
              }}
              onClick={() =>
                session
                  .signIn()
                  .catch((e: unknown) =>
                    setError(e instanceof Error ? e.message : 'O login não terminou. Tente de novo.'),
                  )
              }
            >
              Entrar com Google
            </button>
          )}
          <button
            type="button"
            style={{ ...button, background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}
            onClick={() => void session.enterDemo()}
          >
            Usar o modo demonstração
          </button>
        </div>
      }
    >
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: '48px 32px' }}>
        <div>
          <h1
            className="t-hero"
            style={{ margin: 0, fontSize: 58, lineHeight: 1, fontWeight: 430, letterSpacing: '-0.025em' }}
          >
            Prokopē
          </h1>
          <p
            lang="el"
            className="font-display"
            style={{
              margin: '10px 0 0',
              fontSize: 22,
              lineHeight: '28px',
              fontStyle: 'italic',
              color: 'var(--accent-ink)',
            }}
          >
            προκοπή
          </p>
          <p style={{ margin: '22px 0 0', font: '500 18px/24px var(--font-ui)' }}>Um pouco de progresso, todo dia.</p>
          <p className="lead" style={{ margin: '6px 0 0' }}>
            Poucos hábitos por vez, no seu ritmo.
          </p>
          <p className="cap" style={{ margin: '24px 0 0' }}>
            Tela provisória da casca. A tela de verdade vem do agente D3.
          </p>
        </div>
      </div>
    </FullScreen>
  );
}
