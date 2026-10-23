// Entrar (docs/interacao/telas/entrada.md › Entrar; quadro: entrada › Entrar).
// A ilustração do caminho, "Prokopē" com "προκοπή", a frase, "Entrar com Google" e o caminho da demonstração
// ("Explorar com dados de exemplo"). Sem Firebase configurado, o botão do Google explica com calma que o login
// ainda não está ligado. A tela pinta pronta; só a ilustração anima, uma vez.
import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useLocation } from 'react-router';
import { FullScreen } from '@/components/shell';
import { Button } from '@/components/ui';
import { SIGN_IN_FAILED, useSession } from '@/data';
import { Icon } from '@/icons';
import { fadeUp, tween } from '@/motion/tokens';
import { AccessDeniedView } from './AccessDeniedScreen';
import { GoogleG } from './brand';
import { SignInArt } from './SignInArt';
import './onboarding.css';

const GOOGLE_OFF = 'O login com Google ainda não está ligado nesta versão. Explore com os dados de exemplo.';
const DEMO_FAILED = 'A demonstração não abriu agora. Tente de novo.';

export default function SignInScreen() {
  const session = useSession();
  const { search } = useLocation();
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // só em desenvolvimento: /entrar?sem-acesso=e-mail mostra a Conta sem acesso (a sessão sem Firebase não chega lá)
  const deniedPreview = import.meta.env.DEV ? new URLSearchParams(search).get('sem-acesso') : null;

  const message = notice ?? session.error;
  // a volta do Google: o botão fica desabilitado, sem girador
  const returning = session.status === 'loading' && session.mode === 'firebase';
  const label = returning ? 'Entrando…' : opening ? 'Abrindo o Google…' : 'Entrar com Google';

  async function google() {
    if (!session.firebaseAvailable) {
      setNotice(GOOGLE_OFF);
      return;
    }
    setNotice(null);
    setOpening(true);
    try {
      await session.signIn();
    } catch {
      setOpening(false);
      setNotice(SIGN_IN_FAILED);
    }
  }

  async function demo() {
    setNotice(null);
    try {
      await session.enterDemo();
    } catch {
      setNotice(DEMO_FAILED);
    }
  }

  if (deniedPreview !== null) return <AccessDeniedView email={deniedPreview || 'pessoa.exemplo@gmail.com'} />;

  return (
    <FullScreen
      footer={
        <div className="ob-signin-foot">
          <AnimatePresence initial={false}>
            {message && (
              <m.p key={message} className="ob-notice" role="status" {...fadeUp}>
                <Icon name="info" weight="regular" />
                {message}
              </m.p>
            )}
          </AnimatePresence>
          <Button variant="secondary" wide disabled={opening || returning} onClick={() => void google()}>
            <GoogleG />
            <AnimatePresence initial={false} mode="wait">
              <m.span
                key={label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: tween.micro }}
                exit={{ opacity: 0, transition: tween.exit }}
              >
                {label}
              </m.span>
            </AnimatePresence>
          </Button>
          <Button
            variant="ghost"
            wide
            aria-label="Explorar com dados de exemplo, modo demonstração"
            onClick={() => void demo()}
          >
            Explorar com dados de exemplo
          </Button>
          <p className="ob-legal">
            <Icon name="lock-simple" weight="regular" />
            Seus registros ficam na sua conta. Ninguém mais vê.
          </p>
        </div>
      }
    >
      <div className="ob-hero">
        <SignInArt />
        <h1 className="ob-brand">Prokopē</h1>
        <p className="ob-greek" lang="el">
          προκοπή
        </p>
        <p className="ob-tagline">Um pouco de progresso, todo dia.</p>
        <p className="ob-what">Poucos hábitos por vez, no seu ritmo.</p>
      </div>
    </FullScreen>
  );
}
