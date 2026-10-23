// RatingFaces: os 5 rostinhos de humor ou energia, com as palavras. Quadro: rf(kind, sel).
// Grupo de rádio do Base UI (setas trocam a opção). O escolhido vai a cerca de 1,08 e volta com a mola toque,
// e o fundo passa ao tom claro da primária em micro. Reduzido: só o fundo.
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { spring } from '@/motion/tokens';
import { Face, FACE_WORDS, type FaceKind, type FaceLevel } from './Face';
import { usePrevious, useReduced } from './lib';
import './ui.css';

export type RatingFacesProps = {
  kind: FaceKind;
  value?: FaceLevel;
  onChange: (v: FaceLevel) => void;
  /** nome do grupo; o padrão é "Humor" ou "Energia" */
  label?: string;
  className?: string;
};

const LEVELS: FaceLevel[] = [1, 2, 3, 4, 5];

export function RatingFaces({ kind, value, onChange, label, className }: RatingFacesProps) {
  const reduced = useReduced();
  const faces = useRef<(SVGSVGElement | null)[]>([]);
  const prev = usePrevious(value);
  useEffect(() => {
    if (reduced || value == null || prev === undefined || prev === value) return;
    const el = faces.current[value - 1];
    // começa em 1 com velocidade: a mola sobe até perto de 1,08 e assenta
    if (el) animate(el, { scale: 1 }, { ...spring.toque, velocity: 2.4 });
  }, [value, prev, reduced]);

  return (
    <RadioGroup
      value={value ?? null}
      onValueChange={(v) => onChange(v as FaceLevel)}
      aria-label={label ?? (kind === 'mood' ? 'Humor' : 'Energia')}
      className={clsx('pk-rf', className)}
    >
      {LEVELS.map((l) => (
        <Radio.Root key={l} value={l} aria-label={`${FACE_WORDS[kind][l - 1]}, ${l} de 5`} className="pk-rf-opt pk-press">
          <Face kind={kind} level={l} ref={(el) => void (faces.current[l - 1] = el)} />
          <span aria-hidden="true">{FACE_WORDS[kind][l - 1]}</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
