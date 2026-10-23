// TimeValue: o horário ou a data que se toca para mudar ("06:50", "qui, 24 dez"). Quadro: tval().
// Por baixo é um <input type="time"> (ou date) nativo, que abre a roda do iOS. Variações: normal (--sunken),
// raised (sobre fundo --sunken, com contorno) e off (ainda não vale, contorno e --text-3).
import clsx from 'clsx';
import './ui.css';

export type TimeValueProps = {
  kind: 'time' | 'date';
  /** "06:50" ou "2026-12-24" (o formato do input nativo) */
  value: string;
  onChange: (v: string) => void;
  /** nome lido: "Acordar" (o leitor completa com o horário e "Ajustável") */
  label: string;
  off?: boolean;
  raised?: boolean;
  min?: string;
  max?: string;
  /** texto mostrado; o padrão formata o valor ("06:50", "qui, 24 dez") */
  display?: string;
  disabled?: boolean;
  className?: string;
};

/** "2026-12-24" → "qui, 24 dez". */
export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d, 12);
  const wd = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(dt).replace('.', '');
  const mo = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(dt).replace('.', '');
  return `${wd}, ${d} ${mo}`;
}

export function TimeValue({ kind, value, onChange, label, off, raised, min, max, display, disabled, className }: TimeValueProps) {
  const shown = display ?? (kind === 'date' ? formatShortDate(value) : value);
  return (
    <span className={clsx('pk-tval', off && 'off', raised && 'raised', className)}>
      <span aria-hidden="true">{shown}</span>
      <input
        type={kind}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />
    </span>
  );
}
