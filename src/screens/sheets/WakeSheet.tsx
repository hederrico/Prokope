// Provisório da casca (B1): o agente D2 troca este arquivo pela folha de verdade (docs/interacao/telas/registros.md).
import { Sheet, type SheetScreenProps } from '@/components/shell';

export default function WakeSheet({ params, close }: SheetScreenProps) {
  return (
    <Sheet
      title={'Acordei às'}
      keyboardAware
      footer={
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
          onClick={close}
        >
          Pronto
        </button>
      }
    >
      <p className="cap" style={{ margin: 0 }}>
        Folha provisória da casca ({params.get('folha')}). A folha de verdade vem do agente D2.
      </p>
      <label style={{ display: 'grid', gap: 6, marginTop: 12 }}>
        <span className="cap">Acordei às</span>
        <input
          type="time"
          defaultValue="06:52"
          style={{
            minHeight: 48,
            width: '100%',
            padding: '0 14px',
            borderRadius: 14,
            border: '1px solid var(--border-strong)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        />
      </label>
    </Sheet>
  );
}
