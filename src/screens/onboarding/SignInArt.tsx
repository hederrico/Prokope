// SignInArt: a ilustração da entrada (quadro: f-entrada.js › art). Um caminho sinuoso tracejado com um ponto por pilar
// do plano base e o trecho percorrido na primária, até o "você está aqui". Decorativa (aria-hidden).
// Só na primeira montagem do app: o trecho se desenha em ring (pathLength) e o ponto entra em micro no fim.
// Ao voltar de um login cancelado, nada anima. Depois da abertura (index.html), também não: a arte já estava na tela.
import { useEffect, useState } from 'react';
import { m } from 'motion/react';
import { TEMPLATE_PILLARS } from '@/data';
import { pillarAttrs, useReduced } from '@/components/ui';
import { dur, tween } from '@/motion/tokens';
import { splashWasShown } from '@/app/splashBridge';

const TRAIL =
  'M120 222 C86 222 46 206 46 184 C46 158 194 158 194 132 C194 110 70 110 70 88 C70 71 166 71 166 54 C166 40 146 30 124 30';
const WALKED = 'M120 222 C86 222 46 206 46 184 C46 158 194 158 194 132 C194 125.4 182.8 120.8 167.2 117';
/** Os pontos ao longo do caminho, na ordem dos pilares do modelo. */
const POINTS: [number, number][] = [
  [46, 184],
  [194, 132],
  [70, 88],
  [166, 54],
];
const HERE: [number, number] = [167.2, 117];

// a ilustração anima uma vez por abertura do app
let drawn = false;

export function SignInArt() {
  const reduced = useReduced();
  const [animateNow] = useState(() => !drawn && !reduced && !splashWasShown());
  useEffect(() => {
    drawn = true;
  }, []);
  return (
    <div className="ob-art" aria-hidden="true">
      <svg viewBox="0 0 240 236" preserveAspectRatio="xMidYMid meet">
        <path className="ob-trail" d={TRAIL} />
        <m.path
          className="ob-walked"
          d={WALKED}
          initial={animateNow ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={tween.ring}
        />
        <circle className="ob-start" cx="120" cy="222" r="4.5" />
        <circle className="ob-end" cx="124" cy="30" r="4" />
        {TEMPLATE_PILLARS.slice(0, POINTS.length).map((p, i) => {
          const a = pillarAttrs(p.color);
          return (
            <circle
              key={p.key}
              className={`ob-pt ${a.className ?? ''}`}
              data-hue={a['data-hue']}
              data-pillar={a['data-pillar']}
              cx={POINTS[i][0]}
              cy={POINTS[i][1]}
              r="9"
            />
          );
        })}
        <m.g
          initial={animateNow ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ ...tween.micro, delay: animateNow ? dur.ring : 0 }}
        >
          <circle className="ob-halo" cx={HERE[0]} cy={HERE[1]} r="11.5" />
          <circle className="ob-here" cx={HERE[0]} cy={HERE[1]} r="5.5" />
        </m.g>
      </svg>
    </div>
  );
}
