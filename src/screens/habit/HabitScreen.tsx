// Provisório da casca (B1): o agente D4 troca este arquivo pela tela de verdade (docs/interacao/telas/habito-progresso.md).
import { useParams } from 'react-router';
import { NavBar, useMirrorPaths, useScreenTitle } from '@/components/shell';
import { PlaceholderLinks, PlaceholderNote } from '@/components/shell/Placeholder';

export default function HabitScreen() {
  const id = useParams().id ?? '';
  const name = id === 'caminhada' ? 'Caminhada' : 'Hábito';
  const paths = useMirrorPaths();
  useScreenTitle(name);
  return (
    <>
      <NavBar title={name} />
      <PlaceholderNote owner="D4" />
      <PlaceholderLinks
        links={[
          { label: 'Corrigir quarta', sheet: 'corrigir', args: { habito: id, dia: '2026-10-21' } },
          { label: 'Menu do hábito', sheet: 'menu', args: { habito: id } },
          { label: 'Editar o hábito', to: `/ajustes/habitos/${id}/editar` },
          { label: 'Outro hábito (empurra de novo)', to: paths.habit('zero-refri') },
        ]}
      />
    </>
  );
}
