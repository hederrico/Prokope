// Switch: o interruptor (Switch do Base UI, role="switch"). Quadro: sw().
// Desligado com trilho --track; ligado com --success-fill. O botão branco muda de lado (forma) e o trilho muda de cor.
// O botão desliza com a mola (curva --ease-spring em 250 ms) e o trilho troca de cor em micro. Reduzido: o botão pula.
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import clsx from 'clsx';
import './ui.css';

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** nome lido: "Tolerância de 1h" (numa linha de lista, use o título da linha) */
  label?: string;
  /** id do texto que nomeia o interruptor (quando o nome já está escrito ao lado) */
  labelledBy?: string;
  disabled?: boolean;
  className?: string;
};

export function Switch({ checked, onCheckedChange, label, labelledBy, disabled, className }: SwitchProps) {
  return (
    <BaseSwitch.Root
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(v)}
      disabled={disabled}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className={clsx('pk-sw', className)}
    >
      <BaseSwitch.Thumb className="pk-sw-thumb" />
    </BaseSwitch.Root>
  );
}
