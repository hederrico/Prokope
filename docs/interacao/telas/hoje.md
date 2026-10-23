# Hoje · interações e animações

O Hoje é a tela mais aberta do app: cedo, meio acordado, e à noite, cansado. Tudo aqui responde na hora e nada muda de lugar debaixo do dedo. Os exemplos usam a quinta, 22 de outubro, da história.

## Regras comuns às cinco telas  (rota: `/hoje`)

**Como chega:** pelo ícone (abre o Hoje se a última visita foi há mais de 30 min) ou pela aba Hoje, com a troca de aba de [navegacao.md](../navegacao.md).
**Ao aparecer:** na primeira abertura da sessão, os 6 primeiros blocos (cabeçalho, cartão da semana, rótulo e as 3 primeiras linhas) entram com `fadeUp` em `cascade`. Anéis, barras e números já aparecem no valor: nada se desenha a partir do zero. Ao voltar de outra aba, não há cascata; o que mudou fora anima a partir do último valor mostrado ([comunicacao.md](../comunicacao.md), "Ao abrir").

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Botão do jeito ("Resumo ⌄", no topo, à direita da data) | toque | Abre a folha "Ver o dia", `?folha=jeito` | folha | — | — |
| Ponto da faixa do dia (só no Resumo) | toque | Leva até a linha do hábito (abaixo) | rolagem suave e destaque de cor | — | — |
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
- Ordem de foco: faixa da corrida (se houver), cabeçalho (com o botão do jeito de ver o dia), `WeekCard` (resumo, "76% na semana", dias), a faixa do dia (no Resumo), os momentos na ordem da tela, limites, dias sem e barra de abas.
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

## Os três jeitos de ver o dia

O mesmo dia pode ser visto de três jeitos, e a pessoa troca quando quiser. Os três usam as mesmas linhas (`HabitRow`, `ValuePill`, os controles de cada tipo), os mesmos toques (marcar, abrir a folha, menu do hábito pelo toque longo, Desfazer) e a mesma arrumação adiada: a lista e a ordem vêm do instantâneo congelado e o estado de cada linha vem ao vivo, então marcar nunca tira nada do lugar. Limites da semana, Dias sem e A dois ficam no fim nos três.

| Jeito | O que mostra |
|---|---|
| **Resumo** (o padrão) | O Hoje descrito nas seções abaixo (Manhã, Ao longo do dia e Noite; a Noite recolhida até as 18h; momento completo em "Tudo feito"; Ainda hoje e Feitos hoje a partir das 20h30), com a **faixa do dia** logo abaixo do cartão da semana (à noite, logo abaixo do cabeçalho) |
| **Lista completa** | Os mesmos momentos, todos abertos o dia todo: sem "Tudo feito", sem a Noite recolhida e sem a divisão Ainda hoje e Feitos hoje. Cada linha com horário começa a legenda pelo horário em destaque ("até **20h30** · coleta hoje", "às **21h** · em 26 min", "**20h30** · ainda dá tempo"). O cartão da semana fica também à noite. Proteína e água viram o cartão das metas a partir das 20h30, como no Resumo |
| **Linha do tempo** | Todos os hábitos do dia em ordem de horário, com a marca de cada horário à esquerda ("6h50", "20h30") num trilho vertical, e a linha do agora. Os do mesmo horário ficam juntos num cartão. Os sem horário entram pelo momento: **Manhã** logo depois do acordar (7h, ou o minuto seguinte ao horário de acordar, se for mais tarde), **Ao longo do dia** (proteína, água, almoço) no meio do dia, às 12h, e **Noite** (o jantar) às 19h. A bolinha do trilho fica cheia nos horários que já passaram |

**A faixa do dia (Resumo):** das 6h às 23h (alargada em horas cheias quando algum horário passa disso), com marcas de 3 em 3 horas. Um ponto por hábito com horário, na cor do pilar: feito é cheio, parcial é meio cheio de baixo para cima (como o círculo de marcar), por fazer é só o contorno, "não conta hoje" é o contorno pontilhado. O trecho que já passou fica um pouco mais escuro, e a marca do agora é um traço na primária com a hora embaixo ("7h42").

- Pontos do mesmo horário, ou quase, ficam lado a lado (14 px, 4 px entre eles), centrados no horário médio, nunca um em cima do outro. A marca do agora passa no vão entre o último que já foi e o primeiro que ainda vem.
- Pontos a menos de 44 px dividem uma área de toque só (no mínimo 44 × 44 px). Na quinta, check-in, louça, lixo, telas e deitar são um alvo só, das 20h30 às 22h.
- **Tocar num ponto** leva até a linha: se ela está num momento recolhido (a Noite de manhã, "Tudo feito", "Feitos hoje"), ele abre no lugar com layout `calma`; a lista rola suave até a linha (no meio da tela) e a linha ganha o fundo do pilar, que entra em `base`, fica um instante e sai em `fill`. Num alvo com vários pontos, a lista rola até o primeiro e todos ganham o destaque. Nada muda de lugar.
- Quando um hábito é marcado, o ponto troca de cor em `micro`, no lugar. A marca do agora anda com o relógio, sem animação.
- Num dia que passou, a faixa mostra os pontos daquele dia, sem a marca do agora.

**A linha do agora (Linha do tempo):** um traço de 2 px na primária, com a bolinha no trilho e a hora ("7h42"), no espaço entre o último horário que já chegou e o próximo. Esse espaço existe entre todos os horários, então quando a linha passa de um para o outro nada é empurrado. Num dia que passou, não há linha do agora.

**A troca:** o botão no topo do Hoje (no `ScreenHeader`, à direita da data) mostra o ícone e o nome do jeito atual e abre a folha "Ver o dia" (`?folha=jeito`), com os três jeitos num `OptionGroup` (Resumo com o selo "padrão"). A escolha vale na hora e a folha fecha sozinha 200 ms depois, para a pessoa ver o rádio escolhido. A mesma escolha aparece em Ajustes › Aparência, em "Jeito de ver o Hoje".

| Tempo | O que anima |
|---|---|
| 0 ms | O rádio escolhido enche com a mola `toque` |
| 0 a 240 ms | Atrás do fundo da folha, o jeito que sai some em `base` (`--ease-exit`) no lugar dele, enquanto o novo aparece em `base` no mesmo lugar. Nada desliza nem pula: o cabeçalho e o cartão da semana ficam onde estavam |
| 200 ms | A folha desce em `base` |

- A troca não mexe na rolagem nem no que está aberto ou recolhido (os momentos abertos continuam abertos ao voltar para o Resumo).
- Com movimento reduzido, a troca continua por opacidade; a rolagem da faixa vira um salto; o destaque continua (é só cor).

**Dado gravado:** `profile.prefs.todayView` (`'summary' | 'full' | 'timeline'`), pela ação `setTodayView`. Vale para a pessoa em todos os aparelhos, como o tema e o som. Um documento antigo sem o campo, ou com um valor desconhecido, vale o Resumo (`todayViewOf`).

**Estados nos três jeitos:** manhã, tarde, noite, domingo com a revisão, primeiro dia, convite gentil e "Marcar ontem", outro dia e carregando funcionam igual nos três (o esqueleto é o mesmo). Num dia que passou, a faixa "Você está vendo um dia que passou" ocupa o topo e o botão do jeito não aparece; o dia continua no jeito escolhido. Pausado mostra o cartão da pausa nos três. No dia fechado, o anel e a celebração são os mesmos; "Ver o dia" abre os Feitos hoje no Resumo, a lista inteira na Lista completa e a linha do tempo inteira na Linha do tempo.

**Acessibilidade:**
- O botão do topo diz o jeito atual: "Jeito de ver o dia: Resumo. Trocar" (`aria-haspopup="dialog"`). A folha é um grupo de rádio ("Linha do tempo, Tudo em ordem de horário, com a linha do agora. Botão de opção, 3 de 3").
- A faixa é um grupo, "Faixa do dia", com uma descrição: "6 hábitos com horário, das 6h50 às 22h; 1 feito. O próximo é check-in, às 20h30. Toque num ponto para ir até o hábito." Cada alvo é um botão: "Acordar, 6h50, feito. Mostrar na lista" ou "Das 20h30 às 22h: Check-in do dia, Louça, Lixo e recicláveis, Telas desligadas e Deitar; nenhum feito. Mostrar na lista". As marcas de hora e a do agora ficam fora do leitor.
- Na Linha do tempo, cada horário é uma região com o título (h2: "6h50", "Manhã"). A linha do agora fica fora do leitor e nunca é anunciada, nem quando muda o minuto.
- Na troca, o jeito que sai fica fora do leitor e do foco (`inert`) enquanto some.

**Implementação:**
- `TodayViewPicker.tsx` (o botão e as opções, usadas também em Ajustes › Aparência), `TodayViewSheet.tsx` (a folha), `DayStrip.tsx` e `stripLayout.ts` (onde cada ponto fica e as áreas de toque, com teste), `TodayViews.tsx` (Lista completa e Linha do tempo) e `reveal.ts` (os momentos recolhidos e o "levar até a linha").
- O horário de cada hábito vem do domínio (`habitTime`, já no `TodayItem.time`): a meta de horário vence a agenda, e um horário do perfil (`timeKey`) vale o da época. A ordem da Linha do tempo é `dayTimeline` e o trecho da faixa é `dayStripRange` (`src/domain/today.ts`, com teste); os minutos contam no dia lógico (`logicalMinutes`: 0h30 = 1470).
- O corpo do dia fica dentro de um `AnimatePresence mode="popLayout"` com a chave do jeito; o que sai ganha `data-leaving`, e a arrumação (`useFlip`) e o "levar até a linha" ignoram o que está saindo.
- A cascata da primeira abertura vale só na primeira aparição: um jeito novo entra só com opacidade.

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
