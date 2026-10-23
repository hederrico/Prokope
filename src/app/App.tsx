// Placeholder da etapa 0: confere fontes, tokens e os dois temas. A casca de verdade (AppShell, abas, rotas) vem na etapa 1.
import { Icon, type IconName } from '@/icons';
import { isFirebaseConfigured } from '@/data/firebaseConfig';

const PILLARS: { pillar: 'mente' | 'alim' | 'corpo' | 'familia'; icon: IconName; label: string }[] = [
  { pillar: 'mente', icon: 'moon-stars', label: 'Mente' },
  { pillar: 'alim', icon: 'egg', label: 'Alimentação' },
  { pillar: 'corpo', icon: 'person-simple-walk', label: 'Corpo' },
  { pillar: 'familia', icon: 'salsicha', label: 'Família' },
];

export function App() {
  return (
    <main className="flex min-h-dvh flex-col px-8 pt-[var(--safe-top)] pb-[calc(var(--safe-bottom)+24px)] text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="font-display text-[58px] leading-none font-[430] tracking-[-0.025em] [font-variation-settings:var(--display-vs)]">
          Prokopē
        </h1>
        <p lang="el" className="font-display mt-2.5 text-[22px] leading-7 tracking-[0.02em] text-accent-ink italic">
          προκοπή
        </p>
        <p className="mt-5.5 text-[18px] leading-6 font-medium text-text">Um pouco de progresso, todo dia.</p>
        <p className="mt-1.5 text-body text-text-2">Poucos hábitos por vez, no seu ritmo.</p>

        <ul className="mt-8 flex gap-3" aria-label="Pilares do plano base">
          {PILLARS.map((p) => (
            <li
              key={p.pillar}
              data-pillar={p.pillar}
              className="grid size-10 place-items-center rounded-[13px] bg-wash text-[22px] text-ink"
              title={p.label}
            >
              <Icon name={p.icon} weight="duotone" />
              <span className="sr-only">{p.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="cap">
        {isFirebaseConfigured ? 'Firebase configurado.' : 'Modo demonstração: os dados ficam neste aparelho.'}
      </p>
    </main>
  );
}
