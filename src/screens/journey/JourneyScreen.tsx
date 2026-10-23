// Provisório da casca (B1): o agente D5 troca este arquivo pela tela de verdade (docs/interacao/telas/jornada.md).
import { ScreenHeader } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function JourneyScreen() {
  return (
    <>
      <ScreenHeader context="Fase 2 de 4" title="Jornada" />
      <PlaceholderNote owner="D5" />
      <PlaceholderLinks
        links={[
          { label: 'Plano de corrida', to: '/jornada/corrida' },
          { label: 'Editar fases', to: '/jornada/fases' },
          { label: 'Revisão da semana passada', to: '/jornada/revisoes/2026-W42' },
          { label: 'Revisão de domingo', to: '/revisao/2026-W43/1' },
        ]}
      />
    </>
  );
}
