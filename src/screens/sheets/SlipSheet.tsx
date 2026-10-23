// Provisório da casca (B1): o agente D2 troca este arquivo pela folha de verdade (docs/interacao/telas/registros.md).
import { Sheet, showUndo, type SheetScreenProps } from '@/components/shell';

export default function SlipSheet({ params, close }: SheetScreenProps) {
  const habit = params.get('habito') ?? '';
  return (
    <Sheet
      label="Registrar um deslize"
      footer={
        <div style={{ display: 'grid', gap: 8 }}>
          <button
            type="button"
            style={{
              minHeight: 52,
              width: '100%',
              borderRadius: 999,
              border: 0,
              background: 'var(--btn-bg)',
              color: 'var(--btn-fg)',
              font: '600 17px/1.2 var(--font-ui)',
            }}
            onClick={() => {
              close();
              showUndo(
                {
                  title: 'Deslize registrado',
                  detail: 'O recorde de 21 dias continua guardado.',
                  pillar: 'alim',
                  icon: 'pint-glass',
                },
                () => {},
              );
            }}
          >
            Registrar
          </button>
          <button
            type="button"
            style={{
              ...{
                minHeight: 52,
                width: '100%',
                borderRadius: 999,
                border: 0,
                background: 'var(--btn-bg)',
                color: 'var(--btn-fg)',
                font: '600 17px/1.2 var(--font-ui)',
              },
              background: 'none',
              color: 'var(--accent-ink)',
            }}
            onClick={close}
          >
            Cancelar
          </button>
        </div>
      }
    >
      <h2 className="ttl3" style={{ margin: '8px 0 4px' }}>
        Teve um deslize hoje?
      </h2>
      <p className="cap" style={{ margin: 0 }}>
        Folha provisória da casca ({habit}). A folha de verdade vem do agente D2.
      </p>
    </Sheet>
  );
}
