// O gancho de teste da casca (src/app/router.tsx): só existe com navegador automatizado (navigator.webdriver).
// Uma declaração só para todos os testes; os specs usam window.__pkShell sem redeclarar.
export {};

interface ShellHookToastInput {
  title: string;
  detail?: string;
  pillar?: string;
  icon?: string;
}

interface ShellHook {
  navigate: (to: string, opts?: { state?: unknown; replace?: boolean }) => Promise<void>;
  showUndo: (input: ShellHookToastInput, undo: () => void) => string;
  showToast: (input: ShellHookToastInput & { id?: string; duration?: number }) => string;
}

declare global {
  interface Window {
    __pkShell: ShellHook;
    /** marcado pelos testes do Desfazer */
    __undone?: boolean;
  }
}
