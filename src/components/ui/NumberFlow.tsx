// NumberFlow com os tokens do app: rola em fill (400 ms, --ease-out), em português, e troca de uma vez com movimento reduzido.
// Para números que mudam (gramas, litros, minutos, contadores). A serifa (dias sem) usa o RollingNumber.
import BaseNumberFlow, { type NumberFlowProps as BaseProps } from '@number-flow/react';
import { numberFlowTiming } from '@/motion/tokens';
import { useDelayedValue, useReduced } from './lib';

export type NumberFlowProps = Omit<BaseProps, 'locales'> & {
  /** atraso da coreografia em ms (+60 local, +120 distante). A primeira renderização não espera. */
  delay?: number;
  locales?: BaseProps['locales'];
};

export function NumberFlow({ value, delay = 0, locales = 'pt-BR', format, ...rest }: NumberFlowProps) {
  const reduced = useReduced();
  const shown = useDelayedValue(value, delay);
  return (
    <BaseNumberFlow
      {...numberFlowTiming}
      value={shown}
      locales={locales}
      format={format}
      animated={!reduced}
      willChange={false}
      {...rest}
    />
  );
}
