// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-plano.md).
import { ScreenHeader } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function SettingsScreen() {
  return (
    <>
      <ScreenHeader context="" title="Ajustes" />
      <PlaceholderNote owner="D6" />
      <PlaceholderLinks
        links={[
          { label: 'Pilares', to: '/ajustes/pilares' },
          { label: 'Hábitos', to: '/ajustes/habitos' },
          { label: 'Horários', to: '/ajustes/horarios' },
          { label: 'Lembretes', to: '/ajustes/lembretes' },
          { label: 'Aparência', to: '/ajustes/aparencia' },
          { label: 'Pausar', to: '/ajustes/pausar' },
          { label: 'A dois', to: '/ajustes/a-dois' },
          { label: 'Dados e conta', to: '/ajustes/dados' },
          { label: 'Novo pilar', to: '/ajustes/pilares/novo' },
          { label: 'Novo hábito', to: '/ajustes/habitos/novo/tipo' },
        ]}
      />
    </>
  );
}
