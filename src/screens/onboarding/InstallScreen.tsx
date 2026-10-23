// Instalar no iPhone (docs/interacao/telas/estados.md › Instalar no iPhone; quadro: estados › Instalar no iPhone).
// Aparece no Safari do iPhone fora da Tela de Início. Os 3 passos são instruções (lista numerada, sem toque);
// a barra desenhada no quadro é a do próprio Safari. "Agora não" guarda a data (7 dias) e segue para Entrar.
import { m } from 'motion/react';
import { useNavigate } from 'react-router';
import { FullScreen } from '@/components/shell';
import { Button } from '@/components/ui';
import { markInstallDismissed } from '@/app/platform';
import { Icon } from '@/icons';
import { cascade, fadeUpItem } from '@/motion/tokens';
import { AppMark } from './brand';
import './onboarding.css';

function host(): string {
  return typeof window === 'undefined' ? '' : window.location.host;
}

export default function InstallScreen() {
  const navigate = useNavigate();
  return (
    <FullScreen
      footer={
        <Button
          variant="ghost"
          wide
          onClick={() => {
            markInstallDismissed();
            void navigate('/entrar');
          }}
        >
          Agora não
        </Button>
      }
    >
      <m.div className="ob-inst" variants={cascade} initial="hidden" animate="shown">
        <div className="ob-inst-brand">
          <AppMark />
          <span>
            <b>Prokopē</b>
            <small>{host()}</small>
          </span>
        </div>
        <m.h1 className="ttl2" variants={fadeUpItem}>
          Instale na Tela de Início
        </m.h1>
        <p className="lead">
          Instalado, o Prokopē abre como app, em tela cheia, e o login com Google funciona sem tropeço.
        </p>
        <ol className="ob-steps">
          <m.li variants={fadeUpItem} className="ob-step">
            <span className="ob-n" aria-hidden="true">
              1
            </span>
            <span>
              <b>Toque em Compartilhar</b>
              <small>
                Na barra do Safari, aqui embaixo. Se não aparecer, toque antes em{' '}
                <Icon name="dots-three" weight="bold" />
                <span className="ob-sr">Mais</span>.
              </small>
            </span>
            <span className="ob-ios" aria-hidden="true">
              <Icon name="export" weight="regular" />
            </span>
          </m.li>
          <m.li variants={fadeUpItem} className="ob-step">
            <span className="ob-n" aria-hidden="true">
              2
            </span>
            <span>
              <b>Adicionar à Tela de Início</b>
              <small>Role a lista, se precisar, e toque em Adicionar.</small>
            </span>
            <span className="ob-ios" aria-hidden="true">
              <Icon name="plus-square" weight="regular" />
            </span>
          </m.li>
          <m.li variants={fadeUpItem} className="ob-step">
            <span className="ob-n" aria-hidden="true">
              3
            </span>
            <span>
              <b>Abra pelo ícone novo</b>
              <small>Entre com Google por lá. Esta aba pode ser fechada.</small>
            </span>
            <AppMark small />
          </m.li>
        </ol>
      </m.div>
    </FullScreen>
  );
}
