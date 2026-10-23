// Mostra a folha pedida em ?folha=... sobre qualquer tela. O arquivo da folha carrega sob demanda e a folha só
// sobe quando ele chegou (a altura certa desde o primeiro quadro). Fechar volta a entrada do histórico.
import { useEffect, useState, type ComponentType } from 'react';
import { AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router';
import { SHEETS, SHEET_PARAM } from '@/app/sheets';
import { useSheetNavigation } from './navigation';
import { SheetSlot, useSheetClose } from './Sheet';
import type { SheetScreenProps } from './types';

const loaded = new Map<string, ComponentType<SheetScreenProps>>();

export function SheetHost() {
  const [params] = useSearchParams();
  const { close } = useSheetNavigation();
  const name = params.get(SHEET_PARAM);
  const def = name ? SHEETS[name] : undefined;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!name || !def || loaded.has(name)) return;
    let alive = true;
    def
      .load()
      .then((mod) => {
        loaded.set(name, mod.default);
        if (alive) setTick((t) => t + 1);
      })
      .catch((err: unknown) => console.error(`Folha "${name}" não carregou`, err));
    return () => {
      alive = false;
    };
  }, [name, def]);

  const Component = name ? loaded.get(name) : undefined;
  // a mesma folha com outros parâmetros (o menu de outro hábito) é outra folha
  const instance = name && def ? [name, ...def.args.map((a) => params.get(a) ?? '')].join('|') : null;

  return (
    <div className="sh-sheets">
      <AnimatePresence>
        {Component && instance && (
          <SheetSlot key={instance} close={close}>
            <SlotBody Component={Component} params={params} />
          </SheetSlot>
        )}
      </AnimatePresence>
    </div>
  );
}

function SlotBody({ Component, params }: { Component: ComponentType<SheetScreenProps>; params: URLSearchParams }) {
  const close = useSheetClose() ?? noop;
  return <Component params={params} close={close} />;
}

function noop() {}
