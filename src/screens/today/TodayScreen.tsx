// Provisório da casca (B1): o agente D1 troca este arquivo pela tela de verdade (docs/interacao/telas/hoje.md).
import { ScreenHeader, showUndo } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function TodayScreen() {
  return (
    <>
      <ScreenHeader context="Quinta, 22 de outubro" title="Hoje" />
      <PlaceholderNote owner="D1" />
      <PlaceholderLinks
        links={[
          { label: 'Abrir o hábito Caminhada', to: '/hoje/habito/caminhada' },
          { label: 'Folha da proteína', sheet: 'proteina' },
          { label: 'Folha da água', sheet: 'agua' },
          { label: 'Acordei às', sheet: 'acordar' },
          { label: 'Nota do almoço', sheet: 'nota', args: { refeicao: 'almoco' } },
          { label: 'Check-in da noite', sheet: 'checkin' },
          { label: 'Peso', sheet: 'peso' },
          { label: 'Deslize', sheet: 'deslize', args: { habito: 'refrigerante' } },
          { label: 'Menu do hábito', sheet: 'menu', args: { habito: 'caminhada' } },
          { label: 'Revisão da semana', to: '/revisao/2026-W43/1' },
          { label: 'Fase desbloqueada', to: '/fase/3' },
          { label: 'Corrida em andamento', to: '/corrida/1/1' },
          {
            label: 'Mostrar um Desfazer',
            onClick: () =>
              showUndo(
                { title: 'Caminhada marcada', detail: '3 de 7 na semana', pillar: 'familia', icon: 'check' },
                () => {},
              ),
          },
          { label: 'Ver outro dia (quarta)', to: '/hoje?dia=2026-10-21' },
        ]}
      />
    </>
  );
}
