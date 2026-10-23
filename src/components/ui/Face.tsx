// Face: um rostinho de humor ou energia, na cor primária. Quadro: face(kind, level).
// No humor muda a boca; na energia, os olhos (e a boca acompanha). Decorativo: o nome vem de quem usa.
import clsx from 'clsx';
import type { Ref } from 'react';
import './ui.css';

export type FaceKind = 'mood' | 'energy';
export type FaceLevel = 1 | 2 | 3 | 4 | 5;
export type FaceProps = {
  kind: FaceKind;
  level: FaceLevel;
  size?: number;
  selected?: boolean;
  className?: string;
  ref?: Ref<SVGSVGElement>;
};

/** As palavras de cada nível, como no quadro. */
export const FACE_WORDS: Record<FaceKind, readonly [string, string, string, string, string]> = {
  mood: ['Muito mal', 'Mal', 'Ok', 'Bem', 'Muito bem'],
  energy: ['Esgotado', 'Baixa', 'Ok', 'Boa', 'Alta'],
};

function Mouth({ d, closed }: { d: string; closed?: boolean }) {
  return <path className={closed ? 'solid' : 'ln'} d={d} />;
}

const MOOD_MOUTHS = [
  <Mouth key="1" d="M11 22.2 Q16 17.4 21 22.2" />,
  <Mouth key="2" d="M11.6 21.4 Q16 19.3 20.4 21.4" />,
  <Mouth key="3" d="M11.6 20.6 L20.4 20.6" />,
  <Mouth key="4" d="M11 19.6 Q16 23.8 21 19.6" />,
  <Mouth key="5" d="M10.6 18.8 Q16 26.2 21.4 18.8 Z" closed />,
];

const ENERGY_EYES = [
  <>
    <path className="ln" d="M9.7 14 Q11.8 15.8 13.9 14" />
    <path className="ln" d="M18.1 14 Q20.2 15.8 22.3 14" />
  </>,
  <>
    <path className="ln" d="M9.8 13.2 L13.8 13.2" />
    <path className="ln" d="M18.2 13.2 L22.2 13.2" />
    <ellipse className="dot" cx="11.8" cy="14.3" rx="1.25" ry=".75" />
    <ellipse className="dot" cx="20.2" cy="14.3" rx="1.25" ry=".75" />
  </>,
  <>
    <circle className="dot" cx="11.8" cy="13.6" r="1.25" />
    <circle className="dot" cx="20.2" cy="13.6" r="1.25" />
  </>,
  <>
    <ellipse className="dot" cx="11.8" cy="13.3" rx="1.35" ry="1.8" />
    <ellipse className="dot" cx="20.2" cy="13.3" rx="1.35" ry="1.8" />
  </>,
  <>
    <ellipse className="dot" cx="11.8" cy="13" rx="1.5" ry="2.3" />
    <ellipse className="dot" cx="20.2" cy="13" rx="1.5" ry="2.3" />
    <path className="ln" d="M27.4 4.6 L29.2 2.8" />
    <path className="ln" d="M29.4 8.6 L31.6 8.2" />
  </>,
];

const ENERGY_MOUTHS = [
  <Mouth key="1" d="M13.4 21.4 L18.6 21.4" />,
  <Mouth key="2" d="M12.6 21.2 Q16 20.4 19.4 21.2" />,
  <Mouth key="3" d="M11.8 20.6 L20.2 20.6" />,
  <Mouth key="4" d="M11.2 19.8 Q16 23.2 20.8 19.8" />,
  <Mouth key="5" d="M10.8 18.8 Q16 25.6 21.2 18.8 Z" closed />,
];

export function Face({ kind, level, size, selected, className, ref }: FaceProps) {
  const i = level - 1;
  return (
    <svg
      ref={ref}
      className={clsx('pk-face', selected && 'on', className)}
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={size ? { width: size, height: size } : undefined}
    >
      <circle className="f" cx="16" cy="16" r="13" />
      {kind === 'mood' ? (
        <>
          <circle className="dot" cx="11.8" cy="13.4" r="1.15" />
          <circle className="dot" cx="20.2" cy="13.4" r="1.15" />
          {MOOD_MOUTHS[i]}
        </>
      ) : (
        <>
          {ENERGY_EYES[i]}
          {ENERGY_MOUTHS[i]}
        </>
      )}
    </svg>
  );
}
