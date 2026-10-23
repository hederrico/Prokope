// Provisório da casca (B1): o agente D4 troca este arquivo pela tela de verdade (docs/interacao/telas/habito-progresso.md).
import { ScreenHeader } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function ProgressScreen() {
  return (
    <>
      <ScreenHeader context="Semana 2 de 3 · fase 2" title="Progresso" />
      <PlaceholderNote owner="D4" />
      <PlaceholderLinks
        links={[
          { label: 'Abrir o hábito Caminhada (rota espelho)', to: '/progresso/habito/caminhada' },
          { label: 'Revisão da semana passada (rota espelho)', to: '/progresso/revisoes/2026-W42' },
          { label: 'Resumo de quarta', sheet: 'dia', args: { dia: '2026-10-21' } },
          { label: 'Folha da água', sheet: 'agua' },
        ]}
      />
    </>
  );
}
