// QuickAddTile: um botão rápido da proteína ("Ovo +6 g"), que soma na hora. Quadro: classe .q (.q.more para "Mais").
// Um segundo toque é intenção (mais um ovo): o intervalo mínimo é de 120 ms.
import clsx from 'clsx';
import { Icon } from '@/icons';
import { useTapGuard } from './lib';
import './ui.css';

export type QuickAddTileProps = {
  name: string;
  grams: number;
  onAdd: () => void;
  /** unidade mostrada (padrão "g") e a lida por extenso (padrão "gramas") */
  unit?: string;
  unitName?: string;
  className?: string;
};

/** VoiceOver: "Somar ovo, 6 gramas. Botão." */
export function QuickAddTile({ name, grams, onAdd, unit = 'g', unitName = 'gramas', className }: QuickAddTileProps) {
  const guarded = useTapGuard(onAdd, 120);
  return (
    <button
      type="button"
      className={clsx('pk-reset pk-q pk-press', className)}
      aria-label={`Somar ${name.toLocaleLowerCase('pt-BR')}, ${grams} ${unitName}`}
      onClick={() => guarded()}
    >
      <b>{name}</b>
      <small>
        +{grams} {unit}
      </small>
    </button>
  );
}

/** O "Mais", que abre a folha com todos os alimentos. VoiceOver: "Mais alimentos. Botão." */
export function QuickAddMore({
  onClick,
  label = 'Mais alimentos',
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button type="button" className={clsx('pk-reset pk-q more pk-press', className)} aria-label={label} onClick={onClick}>
      <Icon name="dots-three" weight="bold" />
      <small>Mais</small>
    </button>
  );
}
