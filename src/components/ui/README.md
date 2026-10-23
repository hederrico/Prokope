# components/ui

Componentes do design system, com os nomes e as props de docs/interacao/componentes.md. São de apresentação: recebem dados por props e não leem stores. Importe de `@/components/ui`.

- **Visual:** classes `pk-*` em `ui.css` (tradução de docs/telas/base.css, na camada `components`; utilitários do Tailwind ainda ajustam margem e largura por `className`).
- **Cor:** `pillar` aceita a chave da paleta do pilar (`pillar.color`, como `'lavanda'`) ou um tom nomeado (`'mente'`, `'alim'`, `'corpo'`, `'familia'`, `'accent'`). Sem pilar, a bolha fica neutra.
- **Hábito:** `HabitRow`, `DaysSinceTile` e `BudgetRow` recebem `habit: HabitVisual` (`{ name, icon, pillar }`), montado na tela a partir do hábito e do pilar dele.
- **Movimento:** tokens de src/motion/tokens.ts; reduzido pelo `MotionConfig` (`reducedMotion`) ou `data-motion="off"` no html. Anéis, barras e números já aparecem no valor na montagem. `FoldedGroup`, `GoalBar` (selo) e `InsightCard` usam `m.*`: precisam de um `LazyMotion` acima (o da casca).
- **Galeria:** `/dev/componentes` (src/screens/dev/ComponentGallery.tsx), com todos os estados, tema e movimento reduzido.
