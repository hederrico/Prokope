// Provisório da casca (B1): o agente D5 troca este arquivo pela tela de verdade (docs/interacao/telas/jornada.md › Corrida em andamento).
import { useNavigate, useParams } from 'react-router';
import { FullScreen, NavBar, useGoBack } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function RunScreen() {
  const { semana = '1', treino = '1' } = useParams();
  const goBack = useGoBack();
  const navigate = useNavigate();
  return (
    <FullScreen top={<NavBar cancel="Minimizar" onBack={() => goBack()} title="Corrida" />}>
      <PlaceholderNote owner="D5" />
      <PlaceholderLinks
        links={[
          {
            label: 'Treino feito',
            onClick: () => void navigate(`/corrida/${semana}/${treino}/feito`, { replace: true }),
          },
        ]}
      />
    </FullScreen>
  );
}
