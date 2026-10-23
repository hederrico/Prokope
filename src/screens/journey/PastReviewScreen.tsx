// Provisório da casca (B1): o agente D5 troca este arquivo pela tela de verdade (docs/interacao/telas/jornada.md).
import { useParams } from 'react-router';
import { NavBar, useMirrorPaths } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function PastReviewScreen() {
  const semana = useParams().semana ?? '';
  const paths = useMirrorPaths();
  return (
    <>
      <NavBar title={`Semana ${semana}`} />
      <PlaceholderNote owner="D5" />
      <PlaceholderLinks links={[{ label: 'Abrir o hábito Caminhada', to: paths.habit('caminhada') }]} />
    </>
  );
}
