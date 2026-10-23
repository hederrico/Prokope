// Provisório da casca (B1): o agente D5 troca este arquivo pela tela de verdade (docs/interacao/telas/jornada.md › Treino feito).
import { FullScreen, useGoBack } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function RunDoneScreen() {
  const goBack = useGoBack();
  return (
    <FullScreen>
      <div style={{ padding: '48px 16px 0' }}>
        <h1 className="ttl2" style={{ margin: '0 0 12px' }}>
          Treino feito
        </h1>
        <PlaceholderNote owner="D5" />
      </div>
      <PlaceholderLinks links={[{ label: 'Ver meu dia', onClick: () => goBack('/hoje') }]} />
    </FullScreen>
  );
}
