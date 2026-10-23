// Peças de marca da entrada: o "G" colorido oficial do Google (regra de marca do Google; o Phosphor é monocromático)
// e o ícone do app (o caminho com o ponto), como no quadro Instalar no iPhone.
import clsx from 'clsx';

export function GoogleG({ className }: { className?: string }) {
  return (
    <svg className={clsx('ob-g', className)} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/** O ícone do app: 56 px (marca) ou 32 px (sm, no passo 3 do Instalar). */
export function AppMark({ small }: { small?: boolean }) {
  const size = small ? 20 : 30;
  return (
    <span className={clsx('ob-app', small && 'sm')} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path className="ob-mt" d="M7 21 C7 16.5 17 16.5 17 12 C17 7.5 7 7.5 7 3" />
        <path className="ob-md" d="M7 21 C7 16.5 17 16.5 17 12" />
        <circle className="ob-mc" cx="17" cy="12" r="2.6" />
      </svg>
    </span>
  );
}
