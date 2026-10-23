// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-plano.md › Novo pilar).
// Mostra o formulário em tela cheia: Cancelar · título · Criar (ou Salvar), desabilitada até o nome ser preenchido.
import { useState } from 'react';
import { useParams } from 'react-router';
import { FullScreen, NavBar, useGoBack } from '@/components/shell';
import { PlaceholderNote } from '@/components/shell/Placeholder';

export default function PillarFormScreen() {
  const { id } = useParams();
  const goBack = useGoBack();
  const [name, setName] = useState('');
  const editing = !!id;
  return (
    <FullScreen
      top={
        <NavBar
          cancel
          title={editing ? 'Editar pilar' : 'Novo pilar'}
          action={{ label: editing ? 'Salvar' : 'Criar', disabled: !name.trim(), onClick: () => goBack() }}
        />
      }
    >
      <div style={{ padding: '16px', display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span className="cap">Nome do pilar</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            enterKeyHint="done"
            style={{
              minHeight: 48,
              padding: '0 14px',
              borderRadius: 14,
              border: '1px solid var(--border-strong)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
        </label>
        <PlaceholderNote owner="D6" />
      </div>
    </FullScreen>
  );
}
