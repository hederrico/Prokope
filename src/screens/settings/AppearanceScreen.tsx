// Provisório da casca (B1): o agente D6 troca este arquivo pela tela de verdade (docs/interacao/telas/ajustes-rotina-conta.md).
// Já liga as preferências da casca (tema, animações e som), para testar o tema e o movimento reduzido.
import { NavBar } from '@/components/shell';
import { PlaceholderNote } from '@/components/shell/Placeholder';
import { setPreferences, usePreferences, type ThemePreference } from '@/app/preferences';

const THEMES: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'Sistema' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Escuro' },
];

export default function AppearanceScreen() {
  const { theme, animations, sound } = usePreferences();
  const row = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    padding: '0 16px',
    gap: 12,
  } as const;
  return (
    <>
      <NavBar title="Aparência" />
      <PlaceholderNote owner="D6" />
      <div style={{ padding: '0 16px', display: 'grid', gap: 16 }}>
        <div role="radiogroup" aria-label="Tema" style={{ display: 'flex', gap: 8 }}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={theme === t.id}
              onClick={() => setPreferences({ theme: t.id })}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                border: theme === t.id ? '2px solid var(--accent-mark)' : '1px solid var(--border-strong)',
                background: theme === t.id ? 'var(--accent-wash)' : 'var(--surface)',
                color: 'var(--text)',
                font: '600 15px/20px var(--font-ui)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ borderRadius: 20, background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
          <label style={row}>
            <span>Animações</span>
            <input
              type="checkbox"
              checked={animations}
              onChange={(e) => setPreferences({ animations: e.target.checked })}
            />
          </label>
          <label style={{ ...row, borderTop: '1px solid var(--border)' }}>
            <span>Som suave ao marcar</span>
            <input type="checkbox" checked={sound} onChange={(e) => setPreferences({ sound: e.target.checked })} />
          </label>
        </div>
      </div>
    </>
  );
}
