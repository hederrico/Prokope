// A folha que sobe de baixo (componentes.md › Sheet; quadro: sheet()). Alça, título na serifa 24, X de 32 px,
// corpo que rola e a ação principal presa no pé. Abre com a mola folha e o fundo escurece em base; fecha em base
// com --ease-exit. O arrasto para baixo segue o dedo (com resistência acima da altura natural) e fecha ao passar
// de 30% da altura ou de 600 px/s, com a mola folha levando a velocidade do dedo. Toque fora e Esc fecham.
// O foco vai para o título e fica preso na folha; ao fechar, volta para quem abriu.
//
// Dois jeitos de usar:
// - Folha de ?folha= (registrada em src/app/sheets.ts): o componente recebe { params, close } e devolve
//   <Sheet title="Água" footer={...}>...</Sheet>. A casca cuida de abrir, fechar e do histórico.
// - Folha local de uma tela: <Sheet open={open} onOpenChange={setOpen} title="...">...</Sheet>.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, animate, m, useIsPresent, usePresence, useMotionValue } from 'motion/react';
import { Icon } from '@/icons';
import { dur, ease, gesture as limits, rubberband, spring, tween } from '@/motion/tokens';
import { prefersReducedMotion } from '@/motion/reducedMotion';
import { attachDrag } from './drag';
import { trackSheetOpen } from './shellState';

export interface SheetProps {
  /** título na serifa (também é o nome do diálogo) */
  title?: ReactNode;
  /** nome do diálogo quando não há título (deslize) ou quando o título não é só texto */
  label?: string;
  /** folha alta, a 56 px do topo (check-in) */
  tall?: boolean;
  /** a ação principal, presa no pé da folha (acima do teclado) */
  footer?: ReactNode;
  /** a folha sobe junto com o teclado do iPhone (pelo visualViewport) */
  keyboardAware?: boolean;
  /** elemento que recebe o foco ao abrir (padrão: o título; sem título, a própria folha) */
  initialFocus?: RefObject<HTMLElement | null>;
  /** esconde o X (a folha traz o próprio "Cancelar") */
  hideClose?: boolean;
  className?: string;
  children?: ReactNode;
  /** só nas folhas locais (fora do ?folha=) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SlotValue {
  close: () => void;
}

const SheetSlotContext = createContext<SlotValue | null>(null);

/** Embrulho de uma folha dentro do AnimatePresence da casca. */
export function SheetSlot({ close, children }: SlotValue & { children: ReactNode }) {
  const closed = useRef(false);
  const present = useIsPresent();
  useEffect(() => {
    if (present) closed.current = false;
  }, [present]);
  const presentRef = useRef(present);
  useLayoutEffect(() => {
    presentRef.current = present;
  }, [present]);
  // fecha uma vez só, e nunca uma folha que já está saindo (o lugar dela é o antigo)
  const once = useCallback(() => {
    if (closed.current || !presentRef.current) return;
    closed.current = true;
    close();
  }, [close]);
  return <SheetSlotContext.Provider value={{ close: once }}>{children}</SheetSlotContext.Provider>;
}

/** O fechar da folha atual (dentro de uma folha da casca). */
export function useSheetClose(): (() => void) | null {
  return useContext(SheetSlotContext)?.close ?? null;
}

/** A folha. Dentro do ?folha= ela usa o fechar da casca; fora, use open e onOpenChange. */
export function Sheet(props: SheetProps) {
  const slot = useContext(SheetSlotContext);
  if (slot) return <SheetFrame {...props} close={slot.close} />;
  return <LocalSheet {...props} />;
}

function LocalSheet({ open = false, onOpenChange, ...rest }: SheetProps) {
  const host = typeof document !== 'undefined' ? (document.getElementById('sh-overlays') ?? document.body) : null;
  const close = useCallback(() => onOpenChange?.(false), [onOpenChange]);
  if (!host) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <SheetSlot key="sheet" close={close}>
          <SheetFrame {...rest} close={close} />
        </SheetSlot>
      )}
    </AnimatePresence>,
    host,
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// o último elemento tocado (no iPhone, tocar num botão não dá foco a ele)
let lastActivated: HTMLElement | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener(
    'click',
    (e) => {
      const t = e.target instanceof Element ? e.target.closest<HTMLElement>(FOCUSABLE + ', [role="button"]') : null;
      if (t) lastActivated = t;
    },
    { capture: true },
  );
}

function SheetFrame({
  title,
  label,
  tall,
  footer,
  keyboardAware,
  initialFocus,
  hideClose,
  className,
  children,
  close,
}: SheetProps & { close: () => void }) {
  const [isPresent, safeToRemove] = usePresence();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [reducedAtOpen] = useState(prefersReducedMotion);
  const y = useMotionValue(reducedAtOpen ? 0 : 4000);
  const opacity = useMotionValue(reducedAtOpen ? 0 : 1);
  const dim = useMotionValue(0);
  const height = useRef(0);
  const dismissing = useRef<Promise<unknown> | null>(null);
  const untrack = useRef<(() => void) | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeRef = useRef(close);
  const presentRef = useRef(isPresent);
  useLayoutEffect(() => {
    closeRef.current = close;
    presentRef.current = isPresent;
  }, [close, isPresent]);

  const dimFor = (v: number) => Math.min(1, Math.max(0, 1 - Math.max(0, v) / (height.current || 1)));

  // abrir
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && active !== document.body ? active : lastActivated;
    untrack.current = trackSheetOpen();
    height.current = panel.offsetHeight;
    if (reducedAtOpen) {
      animate(opacity, 1, tween.micro);
      animate(dim, 1, tween.micro);
    } else {
      y.set(height.current + 24);
      animate(y, 0, spring.folha);
      animate(dim, 1, tween.base);
    }
    const target = initialFocus?.current ?? titleRef.current ?? panel;
    target.focus({ preventScroll: true });
    return () => {
      untrack.current?.();
      const back = opener.current;
      if (back?.isConnected && !back.closest('[inert]')) back.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fechar (a casca tirou a folha da URL, ou a folha local fechou)
  const wasAbsent = useRef(false);
  useEffect(() => {
    if (isPresent) {
      // reaberta antes de terminar de fechar: volta ao lugar
      if (wasAbsent.current) {
        wasAbsent.current = false;
        dismissing.current = null;
        untrack.current = trackSheetOpen();
        animate(opacity, 1, tween.micro);
        animate(y, 0, spring.folha);
        animate(dim, 1, tween.base);
      }
      return;
    }
    wasAbsent.current = true;
    untrack.current?.();
    const finish = () => safeToRemove?.();
    if (dismissing.current) {
      void dismissing.current.then(finish, finish);
      return;
    }
    if (prefersReducedMotion()) {
      void Promise.all([animate(opacity, 0, tween.micro), animate(dim, 0, tween.micro)]).then(finish, finish);
      return;
    }
    const exit = { duration: dur.base, ease: ease.exit };
    void Promise.all([animate(y, height.current + 24, exit), animate(dim, 0, exit)]).then(finish, finish);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  // arrastar para baixo fecha
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    let y0 = 0;
    let unlink: (() => void) | null = null;
    const linkDim = () => {
      unlink?.();
      unlink = y.on('change', (v) => dim.set(dimFor(v)));
    };
    const detach = attachDrag(panel, {
      axis: 'y',
      filter: (e) => {
        if (!presentRef.current || dismissing.current) return false;
        const t = e.target as HTMLElement;
        if (t.closest('input, textarea, select, [contenteditable="true"], [data-no-drag]')) return false;
        const body = bodyRef.current;
        // corpo que rola: arrasta pela alça, pelo título e pelo pé, ou pelo corpo quando ele está no topo
        if (body && body.contains(t) && body.scrollHeight > body.clientHeight + 1 && body.scrollTop > 0) return false;
        return true;
      },
      begin: () => {
        height.current = panel.offsetHeight;
        y.stop();
        dim.stop();
        y0 = y.get();
        if (prefersReducedMotion()) opacity.set(1);
        linkDim();
      },
      move: (_dx, dy) => {
        let v = y0 + dy;
        if (v < 0) v = -rubberband(-v, height.current);
        y.set(v);
      },
      end: (_dx, _dy, _vx, vy) => {
        const v = y.get();
        const H = height.current;
        if (v > limits.sheetDistance * H || vy > limits.sheetVelocity) {
          dismissing.current = prefersReducedMotion()
            ? Promise.all([animate(opacity, 0, tween.micro), animate(dim, 0, tween.micro)])
            : Promise.resolve(animate(y, H + 24, { ...spring.folha, velocity: vy }));
          void dismissing.current.finally(() => unlink?.());
          closeRef.current();
        } else {
          void Promise.resolve(animate(y, 0, { ...spring.folha, velocity: vy })).finally(() => {
            unlink?.();
            unlink = null;
          });
        }
      },
    });
    return () => {
      detach();
      unlink?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // o corpo que não rola também arrasta; o que rola deixa o dedo rolar
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const update = () => {
      body.style.touchAction = body.scrollHeight > body.clientHeight + 1 ? 'pan-y' : 'none';
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(body);
    if (body.firstElementChild) ro.observe(body.firstElementChild);
    return () => ro.disconnect();
  }, []);

  // teclado do iPhone: a folha sobe junto, e o campo com foco fica visível
  useEffect(() => {
    const panel = panelRef.current;
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!keyboardAware || !panel || !vv) return;
    const update = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      panel.style.setProperty('--sh-kb', `${inset}px`);
      panel.dataset.kb = inset > 80 ? 'true' : 'false';
    };
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (t.matches('input, textarea, select')) window.setTimeout(() => t.scrollIntoView({ block: 'nearest' }), 60);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    panel.addEventListener('focusin', onFocus);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      panel.removeEventListener('focusin', onFocus);
    };
  }, [keyboardAware]);

  // Esc fecha; Tab fica dentro da folha
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeRef.current();
      return;
    }
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (!items.length) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const name = label ?? (typeof title === 'string' ? title : undefined);

  return (
    <div className="sh-sheet-root">
      <m.div className="sh-dim" style={{ opacity: dim }} onClick={() => closeRef.current()} aria-hidden="true" />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title && !label ? titleId : undefined}
        aria-label={name && (label || typeof title !== 'string') ? name : undefined}
        tabIndex={-1}
        className={className ? `sh-sheet ${className}` : 'sh-sheet'}
        data-tall={tall || undefined}
        style={{ y, opacity }}
        onKeyDown={onKeyDown}
      >
        <span className="sh-grab" aria-hidden="true" />
        {title != null && (
          <div className="sh-sheet-head">
            <h2 id={titleId} ref={titleRef} tabIndex={-1}>
              {title}
            </h2>
            {!hideClose && (
              <button type="button" className="sh-xbtn hit" aria-label="Fechar" onClick={() => closeRef.current()}>
                <Icon name="x" weight="bold" />
              </button>
            )}
          </div>
        )}
        <div ref={bodyRef} className="sh-sheet-body">
          {children}
        </div>
        {footer != null && <div className="sh-sheet-foot">{footer}</div>}
      </m.div>
    </div>
  );
}
