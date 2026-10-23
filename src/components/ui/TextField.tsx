// TextField: o campo de texto com rótulo sempre visível acima. Quadro: fld().
// 48 px de altura mínima, texto de 16 px (o iPhone não dá zoom), fundo --sunken; com foco, contorno de 2 px em --accent-mark.
// Variações: texto curto, longo (cresce até 4 linhas), número (inputmode decimal, unidade à direita) e busca (lupa).
// Erro: frase abaixo em --text-2 com ícone, nunca vermelho. O exemplo (placeholder) nunca substitui o rótulo.
import clsx from 'clsx';
import { useId, type InputHTMLAttributes } from 'react';
import { Icon, type IconName } from '@/icons';
import './ui.css';

export type TextFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'search';
  /** unidade à direita ("kg", "cm") */
  unit?: string;
  /** ícone à esquerda (lupa na busca) */
  icon?: IconName;
  /** frase de ajuda quando algo não fecha (tom gentil, nunca vermelho) */
  error?: string;
  /** rótulo só para o leitor (a busca, por exemplo); o padrão é visível */
  hideLabel?: boolean;
  enterKeyHint?: InputHTMLAttributes<HTMLInputElement>['enterKeyHint'];
  autoFocus?: boolean;
  maxLength?: number;
  name?: string;
  className?: string;
};

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  inputMode = 'text',
  unit,
  icon,
  error,
  hideLabel,
  enterKeyHint,
  autoFocus,
  maxLength,
  name,
  className,
}: TextFieldProps) {
  const id = useId();
  const errId = `${id}-err`;
  const common = {
    id,
    name,
    value,
    placeholder,
    autoFocus,
    maxLength,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errId : undefined,
  };
  return (
    <div className={clsx('pk-field', className)}>
      <label htmlFor={id} className={clsx('pk-flabel', hideLabel && 'pk-sr')}>
        {label}
      </label>
      <div className="pk-fld">
        {icon && <Icon name={icon} weight="regular" />}
        {multiline ? (
          <textarea {...common} rows={1} enterKeyHint={enterKeyHint} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input
            {...common}
            type={inputMode === 'search' ? 'search' : 'text'}
            inputMode={inputMode}
            enterKeyHint={enterKeyHint}
            autoComplete="off"
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {unit && (
          <span className="unit" aria-hidden="true">
            {unit}
          </span>
        )}
      </div>
      {error && (
        <p id={errId} className="pk-ferr">
          <Icon name="info" weight="regular" />
          {error}
        </p>
      )}
    </div>
  );
}
