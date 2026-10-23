// Provisório da casca (B1): o agente D6 troca este arquivo pela folha de verdade (docs/interacao/telas/ajustes-rotina-conta.md).
import { Sheet, type SheetScreenProps } from '@/components/shell';

export default function InviteSheet({ params, close }: SheetScreenProps) {
  return (
    <Sheet
      title={'Convite para um espaço a dois'}
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
        Folha provisória da casca ({params.get('folha')}). A folha de verdade vem do agente D6.
      </p>
    </Sheet>
  );
}
