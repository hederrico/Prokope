// Salsicha: o dachshund próprio do Prokopē, no lugar do "dog" do Phosphor (design-system.md › Ícones).
// Mesma grade de 256 do Phosphor, traço de 16 (24 no Bold), pontas redondas, orelha caída sólida e olho de raio 8.
// Desenho de docs/design-system.html (.pk-salsicha). Funciona como qualquer ícone do Phosphor: size, color, weight, mirrored.
import { forwardRef, useId, useMemo, type ReactElement } from 'react';
import { IconBase, type IconProps, type IconWeight } from '@phosphor-icons/react';

/** Contorno do corpo, da cabeça e das patas. */
const BODY =
  'M56 116 L166 116 C174 116 178 112 180 104 L184 84 C188 68 198 60 212 60 C222 60 228 66 232 74 L240 90 C244 100 238 108 228 108 L212 108 C204 108 200 114 200 122 L200 138 C200 152 196 160 188 164 L188 186 Q188 194 180 194 L176 194 Q168 194 168 186 L168 166 L76 166 L76 186 Q76 194 68 194 L64 194 Q56 194 56 186 L56 164 C40 162 32 152 32 140 C32 126 42 116 56 116 Z';
/** Rabo. */
const TAIL = 'M39 122 C30 114 27 102 27 88';
/** Orelha caída. */
const EAR = 'M196 66 C184 70 180 96 186 112 C190 122 202 120 204 110 C208 94 206 72 196 66 Z';
const EYE = { cx: 222, cy: 84 };

function strokes(width: number) {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d={BODY} />
      <path d={TAIL} />
    </g>
  );
}

function buildWeights(maskId: string): Map<IconWeight, ReactElement> {
  const regular = (
    <>
      {strokes(16)}
      <path d={EAR} />
      <circle cx={EYE.cx} cy={EYE.cy} r={8} />
    </>
  );
  const bold = (
    <>
      {strokes(24)}
      <path d={EAR} stroke="currentColor" strokeWidth={4} strokeLinejoin="round" />
      <circle cx={EYE.cx} cy={EYE.cy} r={10.5} />
    </>
  );
  const duotone = (
    <>
      <path d={BODY} opacity={0.2} />
      {regular}
    </>
  );
  // Fill: silhueta cheia; o olho e o contorno da orelha ficam vazados (como os detalhes do Phosphor Fill)
  const fill = (
    <>
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256">
        <g fill="#fff" stroke="#fff" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round">
          <path d={BODY} />
          <path d={TAIL} fill="none" />
        </g>
        <path d={EAR} fill="none" stroke="#000" strokeWidth={9} strokeLinejoin="round" />
        <path d={EAR} fill="#fff" />
        <circle cx={EYE.cx} cy={EYE.cy} r={8} fill="#000" />
      </mask>
      <rect width="256" height="256" mask={`url(#${maskId})`} />
    </>
  );
  return new Map<IconWeight, ReactElement>([
    ['thin', regular],
    ['light', regular],
    ['regular', regular],
    ['bold', bold],
    ['duotone', duotone],
    ['fill', fill],
  ]);
}

export const Salsicha = forwardRef<SVGSVGElement, IconProps>(function Salsicha(props, ref) {
  const id = useId();
  // o id da máscara do Fill precisa ser único por ícone na página
  const weights = useMemo(() => buildWeights(`pk-salsicha-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`), [id]);
  return <IconBase ref={ref} {...props} weights={weights} />;
});
Salsicha.displayName = 'Salsicha';

/** Mesmo nome no padrão dos ícones do Phosphor 2.1 (SunIcon, EggIcon...). */
export const SalsichaIcon = Salsicha;
