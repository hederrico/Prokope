# stores

Stores do Zustand. As telas não leem daqui direto: usam os hooks de `@/data` (a API inteira está em `src/data/README.md`).

| Arquivo | O que guarda |
|---|---|
| `data.ts` | Os dados da pessoa normalizados por id (alimentados pelos ouvintes da fonte ativa), a origem da última mudança (`local` ou `remote`, para a celebração) e as escritas pendentes |
| `clock.ts` | A hora do app e o dia lógico (vira às 4h; troca também ao voltar para a frente). `?agora=20:34` fixa a hora para capturas |
| `together.ts` | A dois: a ligação, os convites e os carinhos (fora de `users/{uid}`) |
| `drafts.ts` | Rascunhos no `localStorage` (check-in, revisão, primeiro acesso, formulário de hábito) e o brilho do dia fechado |
| `tour.ts` | O tutorial em andamento (`useTour`: `run`, `step`, `practice`, escrito só pelo condutor em `src/tutorial`), o canal de avisos `emitTour`/`onTour` e `tourAuto` (as ofertas sozinhas; nos testes, a chave `pk-tour-auto` liga) |
