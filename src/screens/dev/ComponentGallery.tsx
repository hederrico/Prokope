// Galeria dos componentes do design system (/dev/componentes, só em desenvolvimento).
// Cada componente em todos os estados, com botões para disparar as animações, seletor de tema e de movimento.
// Os números são os da história do SPEC (quinta, 22 de outubro). ?theme=dark|light e ?motion=off servem às capturas.
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { useEffect, useState } from 'react';
import { SegmentedControl } from '@/components/ui';
import {
  ControlsSection,
  DataSection,
  DaysSinceSection,
  FacesSection,
  GoalBarSection,
  HabitRowSection,
  CheckSection,
  LimitsSection,
  NumbersSection,
  PillsSection,
  RingSection,
  StructureSection,
  TodaySection,
  WeekSection,
} from './gallerySections';
import './gallery.css';

type Theme = 'system' | 'light' | 'dark';
type Motion = 'full' | 'reduced';

const SECTIONS = [
  ['hoje', 'Hoje'],
  ['check', 'Marcar'],
  ['linha', 'Linha'],
  ['pilulas', 'Pílulas'],
  ['semana', 'Semana'],
  ['meta', 'Meta'],
  ['anel', 'Anel'],
  ['limite', 'Limite'],
  ['dias-sem', 'Dias sem'],
  ['rostos', 'Rostinhos'],
  ['controles', 'Controles'],
  ['dados', 'Dados'],
  ['estrutura', 'Estrutura'],
  ['numeros', 'Números'],
] as const;

function readParam(name: string): string | null {
  try {
    return new URLSearchParams(location.search).get(name);
  } catch {
    return null;
  }
}

export default function ComponentGallery() {
  const [theme, setTheme] = useState<Theme>(() => {
    const q = readParam('theme');
    return q === 'light' || q === 'dark' ? q : 'system';
  });
  const [motion, setMotion] = useState<Motion>(() => (readParam('motion') === 'off' ? 'reduced' : 'full'));

  // o tema e o movimento da galeria valem para a página inteira; ao sair, volta o que estava
  useEffect(() => {
    const root = document.documentElement;
    const before = { theme: root.getAttribute('data-theme'), motion: root.getAttribute('data-motion') };
    return () => {
      if (before.theme) root.setAttribute('data-theme', before.theme);
      else root.removeAttribute('data-theme');
      if (before.motion) root.setAttribute('data-motion', before.motion);
      else root.removeAttribute('data-motion');
    };
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => {
    const root = document.documentElement;
    if (motion === 'reduced') root.setAttribute('data-motion', 'off');
    else root.removeAttribute('data-motion');
  }, [motion]);

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion={motion === 'reduced' ? 'always' : 'user'}>
        <div className="gx" data-shot={readParam('shot') ? '' : undefined}>
          <header className="gx-top">
            <h1 className="ttl3">Componentes</h1>
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
                value={motion}
                onChange={setMotion}
                options={[
                  { value: 'full', label: 'Normal' },
                  { value: 'reduced', label: 'Reduzido' },
                ]}
              />
            </div>
            <nav className="gx-nav" aria-label="Seções">
              {SECTIONS.map(([id, name]) => (
                <a key={id} href={`#${id}`}>
                  {name}
                </a>
              ))}
            </nav>
          </header>
          <TodaySection />
          <CheckSection />
          <HabitRowSection />
          <PillsSection />
          <WeekSection />
          <GoalBarSection />
          <RingSection />
          <LimitsSection />
          <DaysSinceSection />
          <FacesSection />
          <ControlsSection />
          <DataSection />
          <StructureSection />
          <NumbersSection />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
