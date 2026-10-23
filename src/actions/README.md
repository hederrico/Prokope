# actions

O que a interface chama para mudar dados. Cada ação grava na hora pela fonte ativa e devolve `Promise<Undo>`, o desfazer (que grava o inverso).
A lista completa, com exemplos, está em `src/data/README.md`, "Ações e o desfazer".

| Arquivo | Ações |
|---|---|
| `records.ts` | marcar, horário, sono, nota, lista, somas, limites, deslizes, check-in, medidas, "hoje não se aplica", arquivar |
| `plan.ts` | pilares, hábitos, fases dos hábitos, pausas |
| `journey.ts` | fases, Revisão da semana, corrida |
| `profile.ts` | tema, animações, som, horários, revisão, coleta, tolerância |
| `data.ts` | primeiro acesso (`setupPlan`), exportar, apagar tudo |
| `together.ts` | A dois: convite, ligação, o que mostrar, carinho |
| `drafts.ts` | o rascunho do check-in vira check-in na virada do dia |
| `core.ts` | `commit` (grava e monta o desfazer) |
