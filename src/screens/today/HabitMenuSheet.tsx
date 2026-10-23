// Provisório da casca (B1): o agente D1 troca este arquivo pela folha de verdade (docs/interacao/telas/estados.md › Menu do hábito).
import { useNavigate } from 'react-router';
import { Sheet, habitPath, useCurrentTab, type SheetScreenProps } from '@/components/shell';

export default function HabitMenuSheet({ params, close }: SheetScreenProps) {
  const habit = params.get('habito') ?? '';
  const navigate = useNavigate();
  const tab = useCurrentTab();
  const item = {
    display: 'flex',
    alignItems: 'center',
    minHeight: 52,
    width: '100%',
    padding: '0 4px',
    border: 0,
    background: 'none',
    color: 'var(--text)',
    font: '500 17px/22px var(--font-ui)',
    textAlign: 'left' as const,
  };
  return (
    <Sheet title={habit === 'caminhada' ? 'Caminhada' : 'Hábito'}>
      <div style={{ display: 'grid' }}>
        <button type="button" style={item} onClick={() => void navigate(habitPath(habit, tab), { replace: true })}>
          Ver hábito
        </button>
        <button type="button" style={item} onClick={close}>
          Hoje não se aplica
        </button>
      </div>
      <p className="cap" style={{ margin: '8px 0 0' }}>
        Folha provisória da casca. A folha de verdade vem do agente D1.
      </p>
    </Sheet>
  );
}
