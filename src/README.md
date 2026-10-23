# src

Código do app. Nomes em inglês; textos da interface e rotas em português (veja docs/desenvolvimento.md).

| Pasta | O que tem |
|---|---|
| `app/` | Casca, rotas, provedores (MotionConfig, Toaster, tema). Hoje: o placeholder da etapa 0 e o aviso de versão nova (`PwaUpdate`) |
| `screens/<area>/` | Uma pasta por área: `today`, `progress`, `journey`, `settings`, `onboarding`, `run`, `review` |
| `components/ui/` | Design system (`HabitRow`, `CheckButton`, `Sheet`, `GoalBar`, `Ring`...), como em docs/interacao/componentes.md |
| `components/shell/` | Abas, barras, folhas, toasts e passagens |
| `motion/` | `tokens.ts` (durações, curvas, molas `calma`, `toque`, `folha`, `festa`), variantes e transições |
| `data/` | Fontes de dados: `firebaseConfig.ts` (sem SDK), `firebase.ts` (Auth e Firestore), ouvintes, conversores, modo demonstração |
| `stores/` | Zustand: dados normalizados e estado de interface |
| `domain/` | Funções puras com testes: dia lógico, constância, força, dias sem, correlações, fases |
| `actions/` | `markHabit`, `addEntry`, `rate`... cada uma devolve o seu desfazer |
| `icons/` | `Icon` (Phosphor pelo nome em kebab-case) e a `Salsicha` |
| `styles/` | `tokens.css` (tokens e `@theme` do Tailwind), `fonts.css`, `global.css` (base e utilitários do quadro), `palette.ts` |
| `types/` | Tipos compartilhados e do ambiente (`env.d.ts`) |

Importe pelo alias `@/` (por exemplo `@/icons`, `@/motion/tokens`).
