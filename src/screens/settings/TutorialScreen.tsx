// Ajustes › Tutorial (ajustes-rotina-conta.md › Tutorial; tutorial.md › Ajustes): os capítulos do tutorial com o
// Zeno, na ordem de CHAPTERS, cada um com a frase e o selo "Visto" quando foi até o fim. Tocar abre a aba do
// capítulo e começa ali. É um menu parado, como o resto de Ajustes: nada anima ao aparecer.
import { NavBar } from '@/components/shell';
import { ListGroup, SectionLabel, Tag } from '@/components/ui';
import { CHAPTERS, tutorialOf, useProfile, type ChapterInfo } from '@/data';
import type { IconName } from '@/icons';
import { startTour } from '@/tutorial';
import { Foot, Row } from './parts';
import './settings.css';

/** O ícone de cada capítulo é o da aba onde ele acontece (o hábito, o calendário). */
const ICONS: Record<ChapterInfo['id'], IconName> = {
  hoje: 'sun',
  habito: 'calendar-check',
  progresso: 'chart-line-up',
  jornada: 'path',
  ajustes: 'gear-six',
};

export default function TutorialScreen() {
  const tutorial = tutorialOf(useProfile());
  return (
    <div className="st-screen">
      <NavBar title="Tutorial" />
      <SectionLabel>Capítulos</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          {CHAPTERS.map((c) => (
            <Row
              key={c.id}
              icon={ICONS[c.id]}
              title={c.title}
              subtitle={c.summary}
              value={tutorial.done[c.id] ? <Tag icon="check">Visto</Tag> : undefined}
              onClick={() => startTour(c.id)}
            />
          ))}
        </ListGroup>
      </div>
      <Foot>Cada capítulo leva poucos minutos. Sair no meio não apaga nada, e dá para ver de novo quando quiser.</Foot>
    </div>
  );
}
