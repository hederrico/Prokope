// O Zeno de verdade, dentro do app (/dev/zeno, em desenvolvimento e no build dos testes): um botão para cada método
// do controlador e cada cena, alvos para apontar, a troca de tema e de movimento, e os números do desenho.
// É o laboratório (docs/mascote/laboratorio.html) com o controlador do app. ?theme=dark|light serve às capturas, e
// ?ancora=1 mostra o retângulo da cabeça (anchor), que acompanha o Zeno pelo onMove.
import { useEffect, useState } from 'react';
import { setPreferences, usePreferences } from '@/app/preferences';
import { Button, SegmentedControl } from '@/components/ui';
import { useZeno, zenoStats, type ZenoScene, type ZenoTap } from '@/zeno';
import { ZENO_LINES } from '@/zeno/lines';
import './gallery.css';
import './zenolab.css';

type Theme = 'system' | 'light' | 'dark';

const SCENES: { id: ZenoScene; name: string }[] = [
  { id: 'acenar', name: 'Acenar' },
  { id: 'casco', name: 'Mostrar o casco' },
  { id: 'checkin', name: 'Check-in' },
  { id: 'obrigado', name: 'Obrigado' },
  { id: 'dia', name: 'Dia fechado' },
  { id: 'fase', name: 'Fase nova' },
  { id: 'pausa', name: 'Pausa' },
  { id: 'noite', name: 'Hora de desligar' },
  { id: 'cochilo', name: 'Cochilo' },
  { id: 'acordar', name: 'Acordar' },
  { id: 'sair', name: 'Sair de cena' },
];

function readParam(name: string): string | null {
  try {
    return new URLSearchParams(location.search).get(name);
  } catch {
    return null;
  }
}

function tapText(t: ZenoTap): string {
  if (t.type === 'body') return t.line ? `Tocaram nele: “${t.line}”` : 'Tocaram nele';
  if (t.type === 'wake') return `Acordou: “${t.line}”`;
  return `Tocaram na tela (${Math.round(t.x)}, ${Math.round(t.y)}): ele olhou`;
}

export default function ZenoLab() {
  const zeno = useZeno();
  const [theme, setTheme] = useState<Theme>(() => {
    const q = readParam('theme');
    return q === 'light' || q === 'dark' ? q : 'system';
  });
  const animations = usePreferences((s) => s.animations);
  const [stats, setStats] = useState(() => zenoStats());
  const [line, setLine] = useState<string | null>(null);
  const [tap, setTap] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  // ?ancora=1 desenha o retângulo de anchor(), que o balão usa para se posicionar
  const [showAnchor] = useState(() => readParam('ancora') === '1');

  // o tema e o movimento valem para a página inteira; ao sair, volta o que estava
  useEffect(() => {
    const root = document.documentElement;
    const before = root.getAttribute('data-theme');
    const anim = usePreferences.getState().animations;
    return () => {
      if (before) root.setAttribute('data-theme', before);
      else root.removeAttribute('data-theme');
      setPreferences({ animations: anim });
    };
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const id = setInterval(() => setStats(zenoStats()), 250);
    return () => clearInterval(id);
  }, []);
  useEffect(() => zeno.onTap((t) => setTap(tapText(t))), [zeno]);
  useEffect(() => zeno.onMove(() => setAnchor(zeno.anchor())), [zeno]);
  // sair da tela com ele em cena: ele sai junto
  useEffect(() => () => void zeno.leave(), [zeno]);

  // os alvos pelo seletor, como o tutorial faz com data-tour
  const el = (n: number) => `[data-zl-alvo="${n}"]`;
  const say = (text: string | null) => {
    setLine(text);
    if (text) zeno.talk(text);
  };
  const scene = (id: ZenoScene) => {
    setLine(ZENO_LINES[id]);
    void zeno.scene(id);
  };

  const groups: { title: string; buttons: [string, () => unknown][] }[] = [
    {
      title: 'Entrar e sair',
      buttons: [
        ['Entrar', () => zeno.enter()],
        ['Entrar acenando', () => zeno.enter({ wave: true })],
        ['Entrar em cima', () => zeno.enter({ place: 'top' })],
        ['Sair', () => zeno.leave()],
        ['Ir para baixo', () => zeno.moveTo('bottom')],
        ['Ir para cima', () => zeno.moveTo('top')],
        ['Longe do alvo 1', () => zeno.moveTo({ awayFrom: el(1) })],
      ],
    },
    {
      title: 'Gestos',
      buttons: [
        ['Acenar', () => zeno.wave()],
        ['Concordar', () => zeno.nod()],
        ['Pulinho', () => zeno.hop()],
        ['Sentar', () => zeno.sit()],
        ['Levantar', () => zeno.stand()],
        ['Comemorar pouco', () => zeno.celebrate('small')],
        ['Comemorar médio', () => zeno.celebrate('medium')],
        ['Mostrar o casco', () => zeno.showShell()],
        ['Baixar os braços', () => zeno.rest()],
        ['Falar', () => say('Quando fizer um hábito, toque aqui.')],
      ],
    },
    {
      title: 'Olhar',
      buttons: [
        ['Olhar para quem usa', () => zeno.lookAt('person', 2000)],
        ['Olhar o chão', () => zeno.lookAt('ground', 2000)],
        ['Olhar em volta', () => zeno.lookAt('around')],
        ['Olhar o alvo 2', () => zeno.lookAt(el(2), 2000)],
      ],
    },
  ];

  return (
    <div className="gx zx" data-zeno-available={String(zeno.available)} data-zeno-present={String(zeno.present)}>
      <header className="gx-top">
        <h1 className="ttl3">Zeno</h1>
        <div className="gx-tools">
          <SegmentedControl
            label="Tema"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'system', label: 'Sistema' },
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Escuro' },
            ]}
          />
          <SegmentedControl
            label="Movimento"
            value={animations ? 'full' : 'reduced'}
            onChange={(v) => setPreferences({ animations: v === 'full' })}
            options={[
              { value: 'full', label: 'Normal' },
              { value: 'reduced', label: 'Reduzido' },
            ]}
          />
        </div>
        <dl className="zx-stat" aria-label="Desenho">
          <dt>Agora</dt>
          <dd data-testid="zeno-state">
            {!zeno.available ? 'Indisponível' : !zeno.present ? 'Fora de cena' : (stats?.state ?? '…')}
          </dd>
          <dt>Quadros</dt>
          <dd>{stats?.drawing ? `${stats.fps || '…'} por segundo` : 'nenhum'}</dd>
          <dt>Pixels</dt>
          <dd>{stats?.pixels ?? 'nenhum'}</dd>
        </dl>
      </header>

      {groups.map((g) => (
        <section key={g.title} className="gx-sec">
          <header>
            <h2>{g.title}</h2>
          </header>
          <div className="gx-pad gx-row">
            {g.buttons.map(([name, fn]) => (
              <Button key={name} variant="secondary" size="sm" onClick={() => void fn()}>
                {name}
              </Button>
            ))}
          </div>
        </section>
      ))}

      <section className="gx-sec">
        <header>
          <h2>Apontar</h2>
          <p>Toque num alvo para ele apontar. O centro do botão vira um ponto no espaço dele.</p>
        </header>
        <div className="gx-pad">
          <div className="zx-field">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={`zx-alvo zx-a${n}`}
                data-zl-alvo={n}
                onClick={(e) => void zeno.pointAt(e.currentTarget)}
              >
                Alvo {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="gx-sec">
        <header>
          <h2>Cenas</h2>
          <p>Os momentos ao longo do uso. A fala vai para o balão de quem conduz; aqui ela aparece embaixo.</p>
        </header>
        <div className="gx-pad gx-row">
          {SCENES.map((s) => (
            <Button key={s.id} variant="secondary" size="sm" onClick={() => scene(s.id)}>
              {`Cena: ${s.name}`}
            </Button>
          ))}
        </div>
      </section>

      <section className="gx-sec">
        <header>
          <h2>Fala e toques</h2>
        </header>
        <div className="gx-log" aria-live="polite">
          {line ? `“${line}”` : 'Nenhuma fala.'}
        </div>
        <div className="gx-log">{tap ?? 'Toque na tela para ele olhar; toque nele para um oi.'}</div>
      </section>

      {anchor && showAnchor && (
        <div
          className="zx-anchor"
          aria-hidden="true"
          style={{ left: anchor.left, top: anchor.top, width: anchor.width, height: anchor.height }}
        />
      )}
    </div>
  );
}
