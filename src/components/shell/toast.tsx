// Toasts (componentes.md › Toast; gestos-e-feedback.md › Toasts; quadro: toast()). Sonner com o conteúdo do quadro:
// um por vez, 8 px acima da barra de abas (ou da borda segura numa tela sem abas), arrastar para baixo dispensa,
// anunciado com aria-live="polite" sem roubar o foco. O Desfazer dura 5 s, com o fio esvaziando; o tempo para
// enquanto o toast tem foco ou o dedo está sobre ele.
//
//   showUndo({ title: 'Caminhada marcada', detail: '3 de 7 na semana', pillar: 'familia', icon: 'check' }, undo)
//   showToast({ title: 'Não deu para salvar.', detail: 'Tente de novo em instantes.', action: { label: 'Tentar de novo', onClick } , duration: Infinity })
import { useState } from 'react';
import { Toaster, toast as sonner } from 'sonner';
import { Icon, type IconName } from '@/icons';
import { PALETTE } from '@/styles/palette';
import { setShellState } from './shellState';
import type { PillarColor } from './types';

export interface ToastAction {
  label: string;
  icon?: IconName;
  onClick: () => void;
  /** ação cheia ("Atualizar", na versão nova) */
  filled?: boolean;
  /** o toast continua na tela depois do toque */
  keepOpen?: boolean;
}

export interface ToastInput {
  /** o mesmo id troca o conteúdo do toast no lugar */
  id?: string;
  title: string;
  detail?: string;
  icon?: IconName;
  pillar?: PillarColor;
  action?: ToastAction;
  /** em ms; Infinity fica até a pessoa dispensar. Padrão: 5 s com ação (com o fio), 4 s sem */
  duration?: number;
  onDismiss?: () => void;
}

export interface UndoInput {
  title: string;
  detail?: string;
  pillar?: PillarColor;
  icon?: IconName;
}

const UNDO_MS = 5000;
const TONES = new Set(['mente', 'alim', 'corpo', 'familia', 'accent']);
let counter = 0;
let current: string | null = null;
let currentIsUndo = false;

function colorAttrs(color: PillarColor | undefined) {
  if (!color || TONES.has(color)) return { 'data-pillar': color ?? 'accent' };
  if (Object.hasOwn(PALETTE, color)) return { className: 'sh-toast hued', 'data-hue': color };
  return { 'data-pillar': 'accent' };
}

function ToastCard({ id, input, fioMs }: { id: string | number; input: ToastInput; fioMs: number }) {
  const [hold, setHold] = useState(false);
  const { action, icon } = input;
  const attrs = colorAttrs(input.pillar);
  return (
    <div
      className="sh-toast"
      {...attrs}
      data-noic={!icon || undefined}
      data-noact={!action || undefined}
      data-hold={hold || undefined}
      onPointerDown={() => setHold(true)}
      onPointerUp={() => setHold(false)}
      onPointerCancel={() => setHold(false)}
      onPointerLeave={() => setHold(false)}
    >
      {icon && (
        <span className="sh-toast-ic" aria-hidden="true">
          <Icon name={icon} weight="bold" />
        </span>
      )}
      <span className="sh-toast-tt">
        <b>{input.title}</b>
        {input.detail && <small>{input.detail}</small>}
      </span>
      {action && (
        <button
          type="button"
          className="sh-toast-act"
          data-filled={action.filled || undefined}
          onClick={() => {
            action.onClick();
            if (!action.keepOpen) sonner.dismiss(id);
          }}
        >
          {action.icon && <Icon name={action.icon} weight="bold" />}
          {action.label}
        </button>
      )}
      {fioMs > 0 && (
        <span className="sh-toast-fio" aria-hidden="true">
          <i style={{ animationDuration: `${fioMs}ms` }} onAnimationEnd={() => sonner.dismiss(id)} />
        </span>
      )}
    </div>
  );
}

function forget(id: string) {
  if (current !== id) return;
  current = null;
  if (currentIsUndo) setShellState({ undoVisible: false });
  currentIsUndo = false;
}

function show(input: ToastInput, isUndo: boolean): string {
  const id = input.id ?? `toast-${++counter}`;
  // um por vez: o anterior sai em micro enquanto o novo sobe em base
  if (current && current !== id) sonner.dismiss(current);
  const duration = input.duration ?? (input.action ? UNDO_MS : 4000);
  const withFio = !!input.action && Number.isFinite(duration) && duration > 0;
  current = id;
  currentIsUndo = isUndo;
  setShellState({ undoVisible: isUndo });
  sonner.custom((tid) => <ToastCard id={tid} input={input} fioMs={withFio ? duration : 0} />, {
    id,
    // com o fio, quem fecha é o fim do fio (que para com foco e com o dedo)
    duration: withFio ? Infinity : duration,
    onDismiss: () => {
      forget(id);
      input.onDismiss?.();
    },
    onAutoClose: () => {
      forget(id);
      input.onDismiss?.();
    },
  });
  return id;
}

/** Mostra um aviso curto. Devolve o id (para trocar ou dispensar). */
export function showToast(input: ToastInput): string {
  return show(input, false);
}

/** O toast com Desfazer (5 s, com o fio). `undo` grava o inverso da ação. */
export function showUndo(input: UndoInput, undo: () => void): string {
  return show(
    {
      ...input,
      action: { label: 'Desfazer', icon: 'arrow-counter-clockwise', onClick: undo },
      duration: UNDO_MS,
    },
    true,
  );
}

/** Dispensa um toast (ou o atual). */
export function dismissToast(id?: string): void {
  const target = id ?? current;
  if (target) sonner.dismiss(target);
}

/** O lugar dos toasts. Vai dentro da coluna do app (usa --sh-tabbar-h da barra de abas). */
export function AppToaster() {
  return (
    <Toaster
      className="sh-toaster"
      position="bottom-center"
      visibleToasts={1}
      gap={8}
      swipeDirections={['bottom']}
      containerAriaLabel="Avisos"
      style={{ ['--sh-toast-bottom' as string]: 'calc(max(var(--sh-tabbar-h), var(--safe-bottom)) + 8px)' }}
      toastOptions={{ unstyled: true }}
    />
  );
}
