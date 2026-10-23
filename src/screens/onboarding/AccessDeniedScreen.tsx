// Conta sem acesso (docs/interacao/telas/estados.md › Conta sem acesso; quadro: estados › Conta sem acesso).
// Depois do Google, quando o e-mail não está na lista. O e-mail fica à vista (é texto) para a pessoa conferir;
// "Copiar o e-mail" vira "E-mail copiado" por 2 s, sem toast. O bloco central entra inteiro com fadeUp; a mão não acena.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { FullScreen } from '@/components/shell';
import { Button, PillarBubble } from '@/components/ui';
import { useSession } from '@/data';
import { Icon } from '@/icons';
import { fadeUp, tween } from '@/motion/tokens';
import { GoogleG } from './brand';
import './onboarding.css';

export default function AccessDeniedScreen() {
  const session = useSession();
  const email = session.user?.email ?? '';
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  async function otherAccount() {
    await session.signOut();
    // abre o seletor de contas do Google (prompt: 'select_account'); cancelado, a pessoa fica em Entrar
    if (session.firebaseAvailable) await session.signIn().catch(() => undefined);
  }

  return (
    <FullScreen
      footer={
        <div className="ob-denied-foot">
          <Button variant="secondary" wide onClick={() => void otherAccount()}>
            <GoogleG />
            Entrar com outra conta
          </Button>
          {email && (
            <Button variant="ghost" wide className="ob-copy" onClick={() => void copy()}>
              <AnimatePresence initial={false} mode="wait">
                <m.span
                  key={copied ? 'ok' : 'copy'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: tween.micro }}
                  exit={{ opacity: 0, transition: tween.exit }}
                >
                  <Icon name={copied ? 'check' : 'copy'} weight={copied ? 'bold' : 'regular'} />
                  {copied ? 'E-mail copiado' : 'Copiar o e-mail'}
                </m.span>
              </AnimatePresence>
            </Button>
          )}
          <p className="ob-legal">
            <Icon name="lock-simple" weight="regular" />
            Nada desta conta foi guardado.
          </p>
        </div>
      }
    >
      <m.div className="ob-center" {...fadeUp}>
        <PillarBubble icon="hand-waving" pillar="accent" size="lg" raised className="ob-hand" />
        <h1 ref={titleRef} className="ttl2" tabIndex={-1}>
          Esta conta ainda não tem acesso
        </h1>
        {email && (
          <span className="ob-who">
            <span className="ob-ini" aria-hidden="true">
              {email.charAt(0).toUpperCase()}
            </span>
            {email}
          </span>
        )}
        <p>
          O Prokopē está aberto só para algumas contas. Peça ao dono do app para liberar este e-mail e depois entre de
          novo.
        </p>
      </m.div>
    </FullScreen>
  );
}
