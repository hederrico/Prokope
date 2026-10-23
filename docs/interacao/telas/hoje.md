# Hoje · interações e animações

O Hoje é a tela mais aberta do app: cedo, meio acordado, e à noite, cansado. Tudo aqui responde na hora e nada muda de lugar debaixo do dedo. Os exemplos usam a quinta, 22 de outubro, da história.

## Regras comuns às cinco telas  (rota: `/hoje`)

**Como chega:** pelo ícone (abre o Hoje se a última visita foi há mais de 30 min) ou pela aba Hoje, com a troca de aba de [navegacao.md](../navegacao.md).
**Ao aparecer:** na primeira abertura da sessão, os 6 primeiros blocos (cabeçalho, cartão da semana, rótulo e as 3 primeiras linhas) entram com `fadeUp` em `cascade`. Anéis, barras e números já aparecem no valor: nada se desenha a partir do zero. Ao voltar de outra aba, não há cascata; o que mudou fora anima a partir do último valor mostrado ([comunicacao.md](../comunicacao.md), "Ao abrir").

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `WeekCard` · "76% na semana ›" | toque | Troca para a aba Progresso, `/progresso?periodo=semana&tema=visao` | troca de aba | — | — |
| `WeekStrip` · dia passado | toque | Abre o dia, `/hoje?dia=2026-10-21` | "Ver outro dia" | — | — |
| `WeekStrip` · dia futuro | toque | Nada (não é focável) | — | — | — |
| `WeekStrip` | deslizar para o lado | Mostra a semana anterior (só uma) | `calma` | — | — |
| `HabitRow` · ícone e nome | toque | Abre `/hoje/habito/:id` | empurrar | — | — |
| `HabitRow` inteira | toque longo, 500 ms | Abre o menu do hábito, `?folha=menu&habito=:id` | fundo escurece 4% durante a espera; folha com a mola `folha` | — | — |
| `CheckButton` | toque | `markHabit(habitId, day)` ou o inverso | coreografia abaixo | `marks/{day}_{habitId}` | Hábito, Progresso, outro aparelho |
| `ValuePill` (já registrado: "6h52", "83,6 kg", "4 · Bom") | toque | Abre a folha daquele registro para corrigir | folha | na folha | — |
| `ActionPill` ("Dar nota", "Começar") | toque | Abre a folha ou a tela cheia do registro | folha ou tela cheia | na folha | — |
| `QuickAddTile` da proteína | toque | `addEntry(proteinId, { food, grams })` | ver Hoje · tarde | `entries` | Folha da proteína, Progresso › Alimentação |
| `QuickAddTile` "Mais" e o corpo do cartão | toque | Abre `?folha=proteina` | folha | — | — |
| `QuickAddButton` da água | toque | `addEntry(waterId, { ml })` | ver Hoje · manhã | `entries` | Folha da água |
| `PlusButton` (limite da semana) | toque | `useBudget(habitId, day)` | ver Hoje · manhã | `entries` | Progresso › Alimentação |
| `FoldedGroup` | toque | Abre ou recolhe no lugar | layout `calma`; o caret gira 180° em `micro` | estado `ui`, por dia | — |
| `DaysSinceTile` | toque | Abre `/hoje/habito/:id` (o deslize fica lá) | empurrar | — | — |

**Coreografia de marcar** (a caminhada, às 7h43, a partir da coreografia padrão de [movimento.md](../movimento.md)):

| Tempo | O que anima |
|---|---|
| 0 ms | `CheckButton` vai a 0,9 em `press`. Ao soltar, enche com o `fill` de Família e o ✓ se desenha (`pathLength` 0 → 1) com a mola `toque`. A bolha passa de Duotone a Fill. Vibração bônus (nível 1). |
| +60 ms | A 3ª bolinha de `WeekDots` enche (escala 0,6 → 1, `micro`). "2 de 7" rola para "3 de 7" (NumberFlow, `fill`). O título vai para `text-2` em `micro`. |
| +120 ms | "3 de 12" rola para "4 de 12" em `fill`. O anel do dia 22 vai de 25% a 33% em `fill`: é um anel de 36 px, e com `fill` tudo para em 520 ms. O toast "Caminhada marcada · 3 de 7 na semana" sobe com `fadeUp`. |
| 520 ms | Tudo parado. O toast fica 5 s com Desfazer. |

- **Arrumação adiada:** a linha marcada fica onde está. Mudar de grupo, recolher um momento completo e tirar o convite acontecem na próxima vez que o Hoje aparece (uma folha fecha, a pessoa volta de outra aba ou o app volta para a frente). Assim o conteúdo nunca pula enquanto o polegar procura o próximo toque, e o Desfazer acontece no mesmo lugar do toque.
- Na volta de uma folha ou de outra aba, a arrumação usa layout `calma` (`layoutId` = id do hábito). Na volta para a frente, ela é aplicada antes da primeira pintura, sem animação.
- Desmarcar faz o caminho inverso, sem celebração: o ✓ se apaga (`pathLength` 1 → 0) e o círculo volta ao contorno, os dois em `micro`.

**Reorganização pelo horário:** o modo do Hoje é calculado só quando a tela aparece, e nunca por temporizador com a tela aberta.

| Modo | Quando | O que muda |
|---|---|---|
| Dia | até 17h59 | Manhã e Ao longo do dia abertos. A Noite fica recolhida em `FoldedGroup` |
| Fim de tarde | 18h às 20h29 | A Noite abre. No domingo, o convite da revisão ocupa o lugar do `WeekCard` |
| Noite | a partir das 20h30 | Ainda hoje (com o check-in no topo) e Feitos hoje |
| Dia fechado | depois do último hábito que se marca no dia | O anel do dia fechado |

- Uma troca de modo vista na volta de outra aba acontece com opacidade em `base`, sem deslocamento, e a rolagem volta ao topo. Vista na volta para a frente, acontece antes da primeira pintura.
- Textos relativos ("em 26 min") mudam a cada minuto, só o texto, sem animação.

**Estados desta tela:** "não conta hoje" (o `skipToday` do menu do hábito): a linha passa ao círculo pontilhado e a "não conta hoje", e o total cai de 12 para 11 em `fill`. Ela desce para o fim do grupo na próxima arrumação. Outro dia, sem internet, carregando e pausado seguem [telas/estados.md](estados.md).
**Acessibilidade:**
- Cada linha tem dois botões: o nome ("Caminhada com o cachorro. 2 de 7 na semana, meta 6. Abre o hábito") e o controle (`role="checkbox"`, com o nome do hábito).
- Na web não existem ações personalizadas do VoiceOver. Por isso cada linha tem um botão "Mais opções de Caminhada", visível só para o leitor de tela, que abre o menu.
- O total "x de 12" não é anunciado; o toast já diz o que aconteceu.
- Ordem de foco: faixa da corrida (se houver), cabeçalho, `WeekCard` (resumo, "76% na semana", dias), os momentos na ordem da tela, limites, dias sem e barra de abas.
- Com letra grande (acima de 130%), o subtítulo quebra em duas linhas, o controle continua centrado na altura da linha, os botões rápidos passam de 4 para 2 por linha e o "Marcar ontem" desce para baixo da frase do convite.

**Implementação:**
- `TodayScreen` monta `WeekCard`, os momentos (`FoldedGroup` + `HabitRow`) e os cartões.
- O agrupamento fica congelado num instantâneo (`ui.todayLayout`) e é recalculado só nos eventos de aparição: `visibilitychange`, foco da aba e folha fechando.
- As linhas ficam dentro de `LayoutGroup`; o convite e o cartão de domingo, dentro de `AnimatePresence`.
- Componentes novos: `QuickAddTile` (classe `.q`), `NudgeStrip` (`.nudge`), `CheckinCard`, `DayClosedView`, `ReviewInvite` e `RunStrip`. Ação nova: `useBudget`.
- Mudança vinda de outro aparelho (`hasPendingWrites` falso): troca em `micro`, sem layout e sem celebração.
- A área do controle ocupa os 56 px da direita, na altura toda da linha. O nome e o controle são botões irmãos, nunca aninhados.
- `-webkit-touch-callout: none` e `user-select: none` nas linhas, por causa do toque longo.
- `CheckButton` e `PlusButton` ignoram um segundo toque em 300 ms (veja os botões de somar em Hoje · tarde).
- Números na serifa (dias sem, o "11" do dia fechado) trocam com opacidade em `micro` e nunca rolam.

**Ajuste da semana:** o ajuste escrito na revisão ("Começar a desligar as telas às 20h45") aparece como uma linha pequena no fim do `WeekCard`, com o ícone `lightbulb`, até a próxima revisão. A linha não anima e não tem controle; tocar nela abre a revisão em que ele foi escrito.

**Carinho recebido (A dois):** um `HugCard` discreto entra no topo com `fadeUp` na primeira aparição do Hoje depois do carinho e fica até o fim do dia lógico. Vários carinhos viram um cartão só, sem contagem e sem histórico.

## Hoje · manhã  (7h42)

**Ao aparecer:** como nas regras comuns. O convite gentil não anima ao entrar: ele já está lá, parado.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Convite · "Marcar ontem" | toque | Abre `/hoje?dia=2026-10-21` com a caminhada em destaque | "Ver outro dia" | na quarta, `marks/2026-10-21_{id}` | Na volta, o convite sai com layout `calma` (ontem deixou de ser um dia sem caminhada) |
| `CheckButton` da caminhada | toque | Marca hoje | coreografia de marcar | `marks` | O convite troca a frase por "De volta hoje." em `micro` e sai na próxima arrumação. Com Desfazer, a frase volta |
| `QuickAddButton` "500 ml" | toque | Soma 500 ml | o anel de 40 px vai de 0 a 17% em `ring`; "0 de 3 L" rola para "0,5 de 3 L" em `fill`; toast "Água · 500 ml" | `entries` | Folha da água |
| `PlusButton` · Tranqueiras | toque | Usa um do limite | o 2º espaço enche (escala 0,6 → 1, mola `toque`); "1 de 2" rola para "2 de 2"; toast "Tranqueira registrada · 2 de 2 na semana" | `entries` | Progresso › Alimentação |
| `FoldedGroup` · Noite | toque | Mostra as 6 linhas da noite | o cartão cresce com layout `calma`; as linhas entram com opacidade em `base`, todas juntas | `ui` | — |
| `ActionPill` do Peso (antes de pesar) | toque | Abre `?folha=peso` | folha | `logMeasurement` na folha | Progresso › Corpo |

- Limite cheio ou passado ("3 de 2") não anima nada além do número, não vibra e não muda de cor ([estados.md](../estados.md), Metas).
- O convite aparece em no máximo um hábito por dia: o mais firme entre os que ficaram sem registro ontem.

## Hoje · tarde  (12h41)

**Ao aparecer:** depois da manhã completa, a Manhã já vem recolhida em "Tudo feito", sem animação. Se a pessoa estava no Hoje quando o último hábito da manhã foi marcado, o grupo recolhe na próxima arrumação (nível 3 da escada).

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `QuickAddTile` "Frango +30 g" | toque | Soma 30 g | escala 0,97 em `press`; "46 g" rola para "76 g" em `fill`; o segmento novo da `GoalBar` cresce da largura 0 em `fill`; toast "Frango · 30 g" com "76 de 80 g" | `entries` | Folha da proteína |
| Mesmo botão, toques seguidos | toque | Junta os toques de até 1,5 s num registro só ("Ovo × 3 · 18 g", como às 7h10) | o toast troca o texto no lugar e o fio recomeça | um item em `entries` | — |
| `ActionPill` "Dar nota" | toque | Abre `?folha=nota&refeicao=almoco` | folha | `rate(habitId, day, 4)` na folha | — |
| Volta da folha da nota | — | A pílula vira `ValuePill` "4 · Bom" | troca de fundo e texto em `micro` com a mola `toque`; +60 ms título em `text-2`; +120 ms "4 de 12" rola para "5 de 12"; toast "Almoço · nota 4" | — | Progresso › Alimentação (média das notas) |
| `FoldedGroup` · "Tudo feito" | toque | Mostra peso, acordar e caminhada para corrigir | layout `calma` | `ui` | — |

- **Meta batida** (o iogurte à noite leva a proteína de 76 para 86 g): a barra passa da linha dos 80 g, a linha acende (de `mark` para `ink`) e o selo "meta batida" entra com `fadeUp`. Vibração bônus (nível 2). O que passou da meta aparece como "+6 g" e não repete o selo.
- Os botões rápidos seguem a hora: ovo, leite e whey até as 10h; frango, feijão e queijo das 11h às 15h; frango, feijão e ovo depois das 17h. A troca acontece só na arrumação, nunca debaixo do dedo.
- **Botões de somar:** num botão de somar, um segundo toque é intenção (mais um ovo). Por isso o intervalo mínimo cai de 300 ms para 120 ms, só para descartar o toque duplo acidental.

## Hoje · noite  (20h34)

**Como chega:** a primeira aparição depois das 20h30 troca para o modo noite (regras comuns). O cartão do check-in entra com `fadeUp`; o resto troca com opacidade em `base`.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `RatingFaces` do check-in | toque num rosto | Abre `?folha=checkin&humor=4` com o humor já escolhido | o rosto fica selecionado com a mola `toque`; a folha começa a subir 150 ms depois, para a pessoa ver a escolha | rascunho no aparelho; `saveCheckin` só no Salvar | — |
| Volta do check-in salvo | — | O cartão vira o resumo com os dois rostinhos ("Bem", "Ok") | altura com layout `calma`, conteúdo em `base`; +120 ms "9 de 12" rola para "10 de 12" | `checkins/{day}` | Progresso › Humor |
| `CheckButton` · Lixo | toque | Marca (20h35) | coreografia de marcar; "8 de 12" vira "9 de 12" | `marks` | — |
| `FoldedGroup` · "Feitos hoje · 8" | toque | Mostra os 8 feitos, cada um com o controle cheio | layout `calma` | `ui` | — |
| Controle cheio dentro de Feitos | toque | Desmarca | caminho inverso de marcar; "Feitos hoje · 8" rola para 7 e "Ainda hoje" para 5; toast "Louça desmarcada" com Desfazer | `marks` (apaga) | Hábito, Progresso |
| Proteína ou água no cartão das metas | toque | Abre a folha | folha | — | — |

- A linha marcada só passa de Ainda hoje para Feitos na próxima arrumação, com layout `calma`.
- A água fica à vista, sem `QuickAddButton` depois das 20h30 e sem nenhum texto que convide a beber. Somar continua possível pela folha.
- "Deitar" não tem controle à noite. Ele é marcado na manhã seguinte, na folha "Acordei às".

## Hoje · dia fechado  (21h04)

**Como chega:** ao marcar "Telas desligadas", o último hábito que se marca no dia (o deitar fica para a manhã). O nível 4 da escada acontece uma vez por dia.

| Tempo | O que anima |
|---|---|
| 0 a 500 ms | Coreografia de marcar normal; "10 de 12" rola para "11 de 12" |
| +500 ms | A lista sai com opacidade em `base` (`--ease-exit`). O anel de 196 px entra já em 10 de 12 e anda até 11 de 12 em `ring`. O "11" troca com opacidade (serifa) |
| +1.100 ms | O brilho acende e assenta em `glow` (sombra de 0 a 1 e de volta a 0,6). Vibração bônus. "Dia fechado" e a frase entram com `fadeUp` |
| +1.250 ms | "Ver o dia" e "Amanhã cedo" entram com `fadeUp`, em `cascade` |
| 2.000 ms | Parado. O toast "Telas desligadas" continua com Desfazer até completar 5 s |

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Desfazer do toast | toque | Desmarca as telas | o anel recua em `fill` e a lista volta com opacidade em `base`, sem animação de perda | `marks` (apaga) | — |
| "Ver o dia" | toque | Abre "Feitos hoje · 11" abaixo do anel, para corrigir algo | layout `calma`, rolagem até a lista com `calma` | `ui` | — |
| "Amanhã cedo" | toque no nome | Abre o hábito | empurrar | — | — |

- A celebração grava `pk-dia-fechado-2026-10-22` no `localStorage` ao acender o brilho. Reabrir o app ou desmarcar e marcar de novo mostra o estado fechado parado, com o brilho já assentado.
- "Amanhã cedo" não tem controles: nada de amanhã se marca hoje.
- Com movimento reduzido, o anel vai direto ao valor com opacidade e o brilho fica parado.

## Hoje · domingo  (18h)

**Como chega:** a primeira aparição do Hoje no domingo depois das 18h troca o `WeekCard` pelo convite (`ReviewInvite`). Se a troca é vista, ela acontece com opacidade em `base` e altura com layout `calma`. Se o app volta para a frente, ela acontece antes da primeira pintura.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| "Começar revisão" | toque | Abre `/revisao/:semana/1` | tela cheia (sobe 24 px com opacidade em `base`) | — | — |
| X na revisão, no passo 2 | toque | Volta ao Hoje e guarda o rascunho | saída da tela cheia | rascunho no `localStorage`; o passo vai para `reviews/{week}` | O botão vira "Continuar revisão" e o rótulo vira "Revisão da semana · passo 2 de 3", com troca em `micro` |
| "Continuar revisão" | toque | Abre `/revisao/:semana/2` | tela cheia | — | — |
| `WeekStrip` do convite | toque num dia | Abre o dia, como no `WeekCard` | "Ver outro dia" | — | — |

- Depois da revisão, o convite sai com layout `calma`. Se a fase 3 foi aceita, entra o cartão "Amanhã começa a fase 3" (da Jornada) com `fadeUp`. Se a pessoa escolheu "Ficar mais uma semana", volta o `WeekCard`.
- O dia e a hora da revisão são da pessoa (Ajustes › Horários; domingo às 18h por padrão). Sem revisão feita, o convite fica até dois dias depois do dia escolhido e sai em silêncio na virada do dia lógico seguinte. A revisão continua na Jornada.
- O convite não tem "Agora não" nem selo de pendência, e nada nele pulsa.

## Corrida no Hoje, a partir da fase 3  (sem tela no quadro)

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `HabitRow` "Corrida · semana 1, treino 1", com `ActionPill` "Começar" | toque em "Começar" | Abre `/corrida/1/1` (a contagem 3, 2, 1 é da Jornada) | tela cheia | o treino, ao terminar | Plano de corrida |
| Mesma linha | toque no nome | Abre o hábito Corrida | empurrar | — | — |
| `RunStrip` (corrida minimizada) | toque | Volta para `/corrida/1/1` | tela cheia | — | — |

- A linha aparece só nos dias de treino do plano (segunda e quarta, 7h10), no momento do horário escolhido, e conta no "x de 12" como o futebol. Na volta de "Treino feito", ela já está como `ValuePill` "30 min": a celebração aconteceu no fim do treino e não se repete no Hoje.
- **`RunStrip`:** fica fixa no topo do Hoje, abaixo da área segura, na cor de Corpo. Mostra a fase ("Trote"), o tempo que falta ("0:18") e "intervalo 3 de 8". Ao minimizar, a tela cheia desce em `micro` e a faixa desce de −100% a 0 em `base`, empurrando o conteúdo com layout `calma`.
- Os dígitos do relógio trocam a cada segundo sem animação (`tabular-nums`). A troca entre trote e caminhada muda o texto e o fundo em `micro`.
- Quando o treino termina minimizado, a faixa vira "Treino completo · ver resumo" e espera o toque, sem sumir sozinha. O toque abre `/corrida/1/1/feito`.
- Para o leitor de tela, a faixa é um botão ("Corrida em andamento, trote, faltam 18 segundos, intervalo 3 de 8. Abrir"). O relógio não é anunciado; a troca de fase é anunciada com `aria-live="polite"`.
