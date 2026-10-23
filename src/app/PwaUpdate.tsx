// Aviso de versão nova do app (vite-plugin-pwa em modo "prompt"): a versão nova só entra quando a pessoa toca em Atualizar.
// Também registra o service worker e procura atualização a cada hora, porque o app instalado no iPhone fica aberto por dias.
// Provisório da etapa 0: na etapa 1 este aviso pode virar um Toast do design system.
import { useRegisterSW } from 'virtual:pwa-register/react';

const HOUR = 60 * 60 * 1000;

export function PwaUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        if (navigator.onLine) void registration.update();
      }, HOUR);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(var(--safe-bottom)+16px)] z-50 mx-auto flex w-[calc(100%-24px)] max-w-[456px] items-center gap-2 rounded-[18px] bg-toast py-2 pr-1.5 pl-4 text-toast-fg shadow-float"
    >
      <p className="min-w-0 flex-1 text-left text-[15px] leading-5 font-semibold">Tem uma versão nova do app.</p>
      <button
        type="button"
        className="min-h-11 rounded-[12px] px-3 text-[16px] font-semibold text-toast-2"
        onClick={() => setNeedRefresh(false)}
      >
        Depois
      </button>
      <button
        type="button"
        className="min-h-11 rounded-[12px] bg-toast-act px-4 text-[16px] font-semibold text-toast"
        onClick={() => void updateServiceWorker(true)}
      >
        Atualizar
      </button>
    </div>
  );
}
