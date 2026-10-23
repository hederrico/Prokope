# domain

Funções puras, sem React nem Firestore, testadas no Vitest (`__tests__`). As telas usam por meio dos hooks de `@/data` (veja `src/data/README.md`).

| Arquivo | O que calcula |
|---|---|
| `day.ts` | dia lógico (virada às 4h no fuso do perfil), semana na segunda, horários e instantes |
| `format.ts` | textos em português: "6h52", "1,5 L", "Quinta, 22 de outubro" |
| `context.ts` | os dados organizados para as contas (`buildDomainData`) |
| `habitState.ts` | estado do hábito num dia, meta do dia (horários do perfil, fim de semana, escada), o que conta |
| `stats.ts` | a conta do dia, constância (semana, pilar, período), força do hábito, a semana do hábito |
| `daysSince.ts` | dias sem: atual, recorde, total e os períodos |
| `budget.ts` | limites da semana |
| `correlation.ts` | humor e energia com e sem o hábito (7 e 7) |
| `weight.ts` | média de 7 dias e a frase da tendência |
| `phases.ts` | linha do tempo das fases, progresso e sugestão aos 70% |
| `review.ts` | janela da revisão e o resumo da semana |
| `runPlan.ts` | o plano de corrida de 13 semanas e o motor do treino |
| `today.ts` | regras do Hoje: grupos, modo pelo horário, dia fechado, convite gentil, botões da hora |
| `pillars.ts` | o destino dos hábitos ao arquivar ou apagar um pilar |
| `planTemplate.ts` | o plano base de docs/visao.md para o primeiro acesso |
| `views.ts` | as leituras prontas para cada tela |
