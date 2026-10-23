// Radio: o desenho do botão de opção (anel grosso quando escolhido). Quadro: radio(on).
// Decorativo: o papel e o estado ficam no Radio do Base UI (OptionCard). O anel cresce com a curva da mola.
import clsx from 'clsx';
import './ui.css';

export function Radio({ checked, className }: { checked?: boolean; className?: string }) {
  return <span className={clsx('pk-radio', checked && 'on', className)} aria-hidden="true" />;
}
