// Aparência: o tema troca ao vivo, sem salvar (as cores passam em base); Animações só reduz (com o Reduzir Movimento
// do iPhone, o interruptor fica desligado e travado, com o aviso de onde mudar); o som toca uma vez ao ligar; o jeito
// de ver o Hoje (o mesmo do botão no topo do Hoje, hoje.md › Os três jeitos de ver o dia); "Mostrar o Zeno"; e a
// Privacidade do peso (ajustes-rotina-conta.md › Aparência).
import { useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { NavBar } from '@/components/shell';
import { ListGroup, ListItem, SectionLabel } from '@/components/ui';
import { todayViewOf, usePrefs } from '@/data';
import { setMotion, setSound, setTheme, setTodayView, setWeightTrendOnly, setZenoShown } from '@/actions';
import { zenoShown } from '@/domain/tutorial';
import { Icon } from '@/icons';
import { fadeUp, tween } from '@/motion/tokens';
import { useSystemReducedMotion } from '@/motion/reducedMotion';
import { playSoftTick, unlockAudio } from '@/motion/sound';
import { TodayViewOptions } from '@/screens/today/TodayViewPicker';
import { webglSupported } from '@/zeno';
import { Foot } from './parts';
import { useSynced } from './hooks';
import { ThemePicker } from './ThemePreview';
import './settings.css';

export default function AppearanceScreen() {
  const prefs = usePrefs();
  const system = useSystemReducedMotion();
  // o interruptor anda na hora; o modo reduzido entra 150 ms depois, quando o botão já chegou
  const [motionOn, setMotionOn] = useSynced(prefs.motion);
  // o rádio anda na hora; o perfil grava logo depois (documento antigo sem o campo = Resumo)
  const [todayView, setTodayViewLocal] = useSynced(todayViewOf(prefs.todayView));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [noteId] = useState(() => `motion-note-${Math.random().toString(36).slice(2)}`);

  const toggleMotion = (on: boolean) => {
    if (system) return;
    setMotionOn(on);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void setMotion(on), 150);
  };

  const toggleSound = (on: boolean) => {
    // o iOS só libera o som dentro de um toque: o áudio começa aqui
    try {
      const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
      if (session) session.type = 'ambient';
    } catch {
      /* sem audioSession */
    }
    unlockAudio();
    void setSound(on);
    if (on) playSoftTick();
  };

  return (
    <div className="st-screen">
      <NavBar title="Aparência" />
      <SectionLabel>Tema</SectionLabel>
      <ThemePicker value={prefs.theme} onChange={(t) => void setTheme(t)} />
      <Foot>Em Sistema, o Prokopē acompanha o claro e o escuro do iPhone ao longo do dia.</Foot>

      <SectionLabel>Jeito de ver o Hoje</SectionLabel>
      <div className="st-pad">
        <TodayViewOptions
          value={todayView}
          onChange={(v) => {
            setTodayViewLocal(v);
            void setTodayView(v);
          }}
        />
      </div>
      <Foot>Dá para trocar a qualquer momento pelo botão no topo do Hoje.</Foot>

      <SectionLabel>Movimento e som</SectionLabel>
      <div className="st-pad">
        <ul className="pk-lg" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          <li className={system ? 'st-sw-dis' : undefined} aria-describedby={system ? noteId : undefined}>
            <ListItem
              icon="wave-sine"
              title="Animações"
              subtitle="O check dá uma mola, os números rolam e o dia fechado brilha."
              toggle={{ checked: system ? false : motionOn, onCheckedChange: toggleMotion, disabled: system }}
            />
            <AnimatePresence initial={false}>
              {system && (
                <m.div
                  key="sys"
                  id={noteId}
                  className="st-sys"
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  exit={{ opacity: 0, transition: tween.micro }}
                >
                  <Icon name="info" weight="regular" />
                  <span>
                    O Reduzir Movimento está ligado no iPhone, então aqui nada se desloca. Para mudar: Ajustes do iPhone
                    › Acessibilidade › Movimento.
                  </span>
                </m.div>
              )}
            </AnimatePresence>
          </li>
          <li>
            <ListItem
              icon="speaker-simple-low"
              title="Som suave ao marcar"
              subtitle="Um toque baixinho. Respeita o silencioso."
              toggle={{ checked: prefs.sound, onCheckedChange: toggleSound }}
            />
          </li>
        </ul>
      </div>

      <SectionLabel>Zeno</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <ListItem
            icon="hand-waving"
            title="Mostrar o Zeno"
            subtitle="A tartaruga que apresenta o app e aparece em alguns momentos."
            toggle={{ checked: zenoShown(prefs), onCheckedChange: (on) => void setZenoShown(on) }}
          />
        </ListGroup>
      </div>
      <Foot>
        {webglSupported()
          ? 'Sem ele, o tutorial segue igual, só com o texto.'
          : 'Este aparelho não desenha o Zeno. O tutorial segue igual, só com o texto.'}
      </Foot>

      <SectionLabel>Privacidade</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <ListItem
            icon="eye-slash"
            title="Mostrar só a tendência do peso"
            subtitle="Esconde o número de cada dia no Hoje, na folha do peso e em Medidas. Ficam a frase e a linha da média."
            toggle={{ checked: !!prefs.weightTrendOnly, onCheckedChange: (on) => void setWeightTrendOnly(on) }}
          />
        </ListGroup>
      </div>
    </div>
  );
}
