// Aviso de versão nova (vite-plugin-pwa em modo "prompt"): o toast "Nova versão do Prokopē" com "Atualizar".
// Ele espera não haver folha nem tela cheia nem Desfazer na tela, e a pessoa passar 5 s sem tocar
// (telas/estados.md › Nova versão pronta). Arrastar para baixo dispensa até a próxima abertura do app.
// Também registra o service worker e procura atualização a cada hora e ao voltar para a frente,
// porque o app instalado no iPhone fica aberto por dias.
import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { dismissToast, showToast } from '@/components/shell/toast';
import { useShellState } from '@/components/shell/shellState';
import { onForeground } from '@/motion/useForeground';

const HOUR = 60 * 60 * 1000;
const IDLE = 5000;
const ID = 'update';

export function PwaUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) void registration.update();
      };
      setInterval(check, HOUR);
      onForeground(check);
    },
  });
  const sheetOpen = useShellState((s) => s.sheetOpen);
  const fullScreen = useShellState((s) => s.fullScreen);
  const undoVisible = useShellState((s) => s.undoVisible);
  const lastTouch = useShellState((s) => s.lastTouch);
  // o último toque que já completou 5 s parado
  const [idleSince, setIdleSince] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const showing = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => setIdleSince(lastTouch), IDLE);
    return () => window.clearTimeout(t);
  }, [lastTouch]);

  const idle = idleSince === lastTouch;
  const canShow = needRefresh && !dismissed && !sheetOpen && !fullScreen && !undoVisible;

  useEffect(() => {
    if (!canShow) {
      if (showing.current) {
        showing.current = false;
        dismissToast(ID);
      }
      return;
    }
    if (!idle || showing.current) return;
    showing.current = true;
    const show = (updating: boolean) =>
      showToast({
        id: ID,
        title: 'Nova versão do Prokopē',
        detail: 'Leva um segundo e nada se perde',
        icon: 'sparkle',
        pillar: 'accent',
        duration: Infinity,
        action: {
          label: updating ? 'Atualizando' : 'Atualizar',
          filled: true,
          keepOpen: true,
          onClick: () => {
            if (updating) return;
            show(true);
            void updateServiceWorker(true);
          },
        },
        onDismiss: () => {
          // dispensado pela pessoa (arrastar), e não tirado para dar lugar a um Desfazer ou a uma folha
          const s = useShellState.getState();
          if (showing.current && !s.undoVisible && !s.sheetOpen && !s.fullScreen) setDismissed(true);
          showing.current = false;
        },
      });
    show(false);
  }, [canShow, idle, updateServiceWorker]);

  return null;
}
