// A faixa do modo exemplo (telas/tutorial.md › Modo exemplo): "Exemplo · nada aqui é seu", fixa no topo, logo abaixo
// da área segura, enquanto as telas mostram a história de exemplo. Ela empurra o conteúdo: com a faixa, a área segura
// de cima (--safe-top) soma a altura dela (shell.css › .sh-app[data-example]), e todas as barras do topo já descem por
// esse token, então nenhum cabeçalho fica por baixo. Entra e sai com opacidade em base. A faixa é um role="status":
// o leitor de tela a lê quando ela aparece (e ela só existe enquanto o modo dura, para não sobrar um status vazio).
import { AnimatePresence, m } from 'motion/react';
import { dur, ease, tween } from '@/motion/tokens';
import { useDataStore } from '@/stores/data';
import { dismissToast } from './toast';

// na troca, o toast da hora sai: o Desfazer de um lado (a pessoa ou o exemplo) não vale do outro
if (typeof window !== 'undefined') {
  useDataStore.subscribe((s, prev) => {
    if (s.example !== prev.example) dismissToast();
  });
}

export function ExampleBanner({ active }: { active: boolean }) {
  return (
    <div className="sh-example-slot">
      <AnimatePresence>
        {active && (
          <m.div
            key="exemplo"
            className="sh-example"
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: tween.base }}
            exit={{ opacity: 0, transition: { duration: dur.base, ease: ease.exit } }}
          >
            Exemplo · nada aqui é seu
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
