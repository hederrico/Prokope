# Hábito e Progresso · interações e animações

O detalhe de cada hábito e as vistas do Progresso: telas de leitura, onde o movimento só desenha o que já foi feito e onde todo dia tocado leva a um lugar para ver ou corrigir.

## Regras comuns deste grupo

**Gráficos ao aparecer.** O desenho é a entrada da tela: acontece na primeira montagem da sessão, uma vez por gráfico, com a coreografia de [movimento.md](../movimento.md). Depois disso vale o "Ao abrir" de [comunicacao.md](../comunicacao.md): o gráfico anda do último valor mostrado até o novo, ou fica parado se nada mudou.

| Peça | Como se desenha | Token | Não anima |
|---|---|---|---|
| Anel grande (constância) | `strokeDashoffset` de 0 ao valor, começando às 12h | `ring`, `--ease-out` | O número do centro: entra no valor final com o cartão |
| Barras por dia (proteína) | `scaleY` de 0 a 1 a partir da base, da esquerda para a direita, 30 ms entre barras | `fill` + `cascade` | Linha da meta, rótulos e valores |
| Anéis por dia (água) | Como o anel grande, 30 ms entre dias; o ✓ entra em `micro` depois que o anel fecha | `ring` + `cascade` | Dias futuros |
| Linha (peso, cintura) | `pathLength` de 0 a 1; os pontos do dia aparecem juntos em opacidade `base`; o ponto final e o rótulo "83,7" entram em `micro` no fim | `ring` | Eixos e grade |
| `MiniBar` (força do hábito, pilares, notas) | Largura por `scaleX` a partir da esquerda, 30 ms entre linhas | `fill` | O "%" ao lado |
| `MonthCalendar` | O cartão entra com `fadeUp`; as 31 células aparecem juntas | `base` | Células uma a uma (passaria do limite de 6 da cascata) |

- Gráfico abaixo da dobra só desenha quando 40% dele fica visível (IntersectionObserver), uma vez.
- No máximo dois gráficos desenham ao mesmo tempo. O segundo começa 120 ms depois do primeiro.
- Números nunca contam a partir de zero na entrada. Eles rolam com o `NumberFlow` só quando o valor muda.
- Mudança vinda de outro aparelho: troca em `micro`, sem desenho e sem celebração (`hasPendingWrites` falso).
- Movimento reduzido: tudo aparece no valor final com opacidade em `micro`.

**Tocar num dia.** No celular não existe hover. Em qualquer gráfico de dias, o toque num dia passado ou de hoje abre uma folha. No detalhe do hábito, abre "corrigir um dia" (só aquele hábito). No Progresso, abre "um dia" (o resumo do dia inteiro). Dia futuro não é tocável.

**Hábitos de horário (acordar, deitar e todo hábito do tipo horário).** Todo mundo acorda: o que muda é se foi no horário. Por isso nenhum texto diz "sem acordar", "com acordar" ou "acordar feito". Um dia de horário é um destes três:

| Estado | Quando | Texto |
|---|---|---|
| No horário | O horário anotado ficou até a meta mais a tolerância | "no horário" |
| Após o horário | O horário foi anotado, mas depois da meta mais a tolerância | "após o horário" |
| Sem registro | Nada anotado no dia. Não dá para dizer que passou da hora | "sem registro" (hoje: "ainda sem registro") |

Os textos saem de uma função só, `patternWords(habit)` em `src/screens/habit/text.ts`, que também monta os textos dos outros hábitos ("com caminhada" e "sem caminhada"). Quando o nome curto é um verbo (-ar → -ou, -er → -eu, -ir → -iu), a frase usa o pretérito; quando não é, usa o nome:

| Onde | Acordar | Hábito de horário com nome que não é verbo (Remédio) |
|---|---|---|
| Padrão | "Nos dias em que você acordou no horário, seu humor médio foi 4,1. Nos outros, 3,4." | "Nos dias com remédio no horário, seu humor médio foi 4,1. Nos outros, 3,4." |
| Base do padrão | "24 dias no horário · 8 após o horário" | igual |
| Rostinhos | "no horário" e "após o horário" | igual |
| Espera | "Os padrões aparecem com 7 dias no horário e 7 após o horário. Faltam 4 dias no horário." | igual |
| Quase todos no horário | "Você acordou no horário em quase todos os dias, então ainda não dá para comparar." | "O remédio ficou no horário em quase todos os dias…" |
| Faixa do calendário | "Desde 21 de setembro, você nunca acordou após o horário dois dias seguidos." | "…você nunca ficou dois dias seguidos após o horário." |
| Parecido | "Por enquanto, o humor fica parecido nos dias em que você acordou no horário e nos outros." | "…nos dias com remédio no horário e nos outros." |

Um nome derivado ("caminhada") não vira verbo num hábito de horário: fica "Nos dias com caminhada no horário". Os dias sem registro nunca são contados como "após o horário": a base mostra os dois à parte ("24 dias no horário · 6 após o horário · 2 sem registro"), e, se houve algum, os rostinhos e a espera dizem "nos outros dias" no lugar de "após o horário". No calendário, os dois têm o mesmo desenho (o trilho), e a legenda diz o que aparece no mês: "Após o horário", "Sem registro" ou "Após o horário ou sem registro". Hoje, com o horário já anotado depois da meta, a célula já é o trilho ("após o horário"), e não o contorno de por vir.

**Vista de um pilar.** Cada chip de pilar monta a vista a partir do tipo de cada hábito do pilar, nesta ordem. Seção sem hábito não aparece. Um hábito de dois pilares (caminhada) aparece nos dois.

| Tipo do hábito | Seção | Peça | Título do cartão |
|---|---|---|---|
| Contador | no topo, um cartão por hábito | Barras por dia com a linha da meta (unidade em g); anéis por dia (unidade em L ou ml) | "80 g ou mais em 2 dos 3 dias fechados" |
| Sim ou não, vezes por semana, horário, lista de passos | Hábitos | `HabitRow` com `WeekDots` e "3 de 7 · meta 6" (horário: "no horário em 4 de 4 dias") | — |
| Limite por semana | Limites da semana | `BudgetRow` | — |
| Dias sem | Dias sem | `HabitRow` com `ValuePill` "12 dias" | — |
| Nota de 1 a 5 | Notas | Bloco com a média, `Stat` e `MiniBar` | — |
| Número | Não entra. Fica em Medidas, que reúne todo hábito do tipo número de qualquer pilar | — | — |

Toda linha e todo bloco de hábito abre `/progresso/habito/:id`. Pilar sem hábito mostra o `EmptyState` "Nenhum hábito neste pilar." com "Criar hábito". "Um hábito de dois pilares" é o que tem pilares em "Também conta em" (`alsoIn`, escolhidos no formulário do hábito, [ajustes-plano.md](ajustes-plano.md)): ele entra na vista, na constância e na barra de cada um, sempre na cor do principal.

## Hábito · Caminhada com o cachorro  (rota: `/hoje/habito/:id` ou `/progresso/habito/:id`)

**Como chega:** do nome ou do ícone da linha no Hoje, ou de uma linha do Progresso. Tela empurrada com a mola `calma`. O voltar diz a origem ("‹ Hoje", "‹ Progresso").
**Ao aparecer:** cascata de 30 ms em hero, números, calendário e insight (4 itens). A `MiniBar` da força enche em `fill`. Ícone, etiquetas e calendário não se mexem.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| "‹ Hoje" | Toque, ou arrasto da borda | Volta | `calma` | — | — |
| Mais (⋯) | Toque | Menu do hábito, sem "Ver hábito" (`?folha=menu&habito=:id`) | `folha` | — | — |
| Dia passado ou hoje no calendário | Toque | Abre "corrigir um dia" | Célula a 0,97 em `press`; anel `sel` em `micro` | — | — |
| Dia futuro | Toque | Nada | — | — | — |
| Setas do mês | Toque | Mês anterior ou seguinte | Grade troca com 12 px na direção do tempo e opacidade em `base` | — | — |
| Pausar este hábito | Toque | Aba Ajustes, em Pausar, com "Alguns hábitos" e a caminhada marcada | Troca de aba em `micro` | — | — |
| Arquivar | Toque | Arquiva e volta para a origem; toast "Caminhada arquivada" com Desfazer | Volta com `calma`; a linha recolhe no Hoje em `base` | `archiveHabit` em `habits` | Sai do Hoje e das vistas de Família e Corpo |

**Estados desta tela:** com menos de 7 dias com e 7 sem, o insight vira a espera de [estados.md](../estados.md). Quando faltam dias "sem" porque a pessoa fez quase todos, a frase é "Você caminhou em quase todos os dias, então ainda não dá para comparar.". A faixa "nunca dois dias seguidos sem caminhar" só aparece enquanto for verdade. Ela sai em silêncio, sem animação de perda. Num hábito de horário (o Acordar), os textos são os de "Hábitos de horário", acima: a legenda diz "No horário" e "Após o horário", a força "sobe a cada dia no horário e desce devagar nos outros", e o padrão compara os dias no horário com os outros.
**Acessibilidade:** cada dia se lê "21 de outubro, sem caminhada, botão". No horário: "21 de outubro, após o horário, botão", "19 de outubro, sem registro, botão" ou "22 de outubro, hoje, no horário, botão". A grade é uma lista de 7 colunas, e a ordem de foco vai por semana. Com letra grande, o calendário mantém 7 colunas e os números ficam até 15 px; a frase da força quebra linha.
**Implementação:** `ScreenHeader` não entra (é `NavBar`). Os componentes são `StatGroup` com `Stat`, `MiniBar`, `MonthCalendar` (`variant="habit"`), `HeatmapKey`, `InsightCard` e `ListGroup`. A força do hábito vem de `habitStrength()` em `src/domain/`, e o `NumberFlow` faz 72 → 74 em `fill`.

## Hábito · corrigir um dia  (rota: `?folha=corrigir&habito=:id&dia=2026-10-21`)

**Como chega:** toque num dia do `MonthCalendar`. É uma folha com a mola `folha` e o fundo escurecendo em `base`. A data fica no título.
**Ao aparecer:** nada além da folha. O rádio do estado atual já vem marcado.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Feito, Parcial, Sem caminhada | Toque | Grava, segura 200 ms e fecha | O rádio troca com a mola `toque`; a folha desce em `base` | `setMark(habitId, dia, 'done' \| 'partial' \| 'none')` em `marks/{day}_{habitId}` ('none' apaga o documento) | Calendário, força do hábito, "3 de 7", anel do dia na semana do Hoje, constância e pilares no Progresso |
| Opção já marcada | Toque | Só fecha | `base` | — | — |
| X, arrasto para baixo, toque fora | — | Fecha sem gravar | `base` | — | — |
| Toast "Caminhada marcada na quarta" | Desfazer | Volta o estado anterior | Célula, força e bolinhas voltam pelo mesmo caminho | O documento anterior | O mesmo |

Depois de fechar, segue a coreografia de [movimento.md](../movimento.md). A célula troca a cor em `micro` e o ✓ se desenha. Com +60 ms, a força rola no `NumberFlow` e a `MiniBar` anda em `fill`. Com +120 ms, as bolinhas da semana mudam. Dia passado não celebra: sem vibração, sem brilho e sem dia fechado.
**Estados desta tela:** num dia pausado, a primeira linha diz "Dia pausado · Férias" e as opções continuam valendo. Marcar feito tira aquele dia da pausa, só para este hábito. Para outros tipos de hábito, o toque no dia abre a folha do próprio registro com `&dia=`: horário (`acordar`), nota (`nota`) ou contador (`proteina`, `agua`). Um hábito de horário sem folha própria (fora acordar e deitar) usa esta folha com "No horário" (com a meta embaixo) e "Sem registro"; quando o horário anotado ficou depois da meta, entra também "Após o horário", marcado como o estado atual. Escolher "No horário" grava o dia como feito; "Sem registro" apaga o horário anotado. O toast diz "Remédio no horário na quarta".
**Acessibilidade:** as três opções formam um `radiogroup` chamado "Como foi a caminhada", e o foco entra no título com a data. O toast é anunciado com `aria-live`.
**Implementação:** os componentes são `Sheet`, `ListGroup` com `ListItem` e `Radio`, e `Toast`. A ação grava antes de fechar, porque o app pode ser fechado a qualquer momento. Um segundo toque em 300 ms é ignorado.

## Hábito · Zero refrigerante  (rota: `/hoje/habito/:id` ou `/progresso/habito/:id`)

**Como chega:** do `DaysSinceTile` no Hoje ou da linha em Progresso › Alimentação, empurrada com `calma`.
**Ao aparecer:** o "12" na serifa fica parado. As barras dos períodos enchem em `fill` (30 ms entre elas), e o marcador do período atual entra em `micro` no fim.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Registrar deslize | Toque | Folha do deslize (`?folha=deslize&habito=:id`, grupo B) | `folha` | `logSlip` em `slips` | Hoje (`DaysSinceTile`), Progresso › Alimentação |
| Depois do deslize | — | O 12 desce até 0; entra o período "0 dias · hoje" no topo, e "agora" passa para ele | `NumberFlow` em `fill`; a linha nova entra com `fadeUp`; a barra do período fechado assenta em `fill` | — | — |
| Um período | Toque | A folha do deslize em modo edição, com a data do deslize que limita o período e "Apagar este deslize" | `folha` | `editSlip(slipId, dia)` ou `deleteSlip(slipId)`, com Desfazer | Contagem atual, recorde e total |
| Mais (⋯) | Toque | Menu do hábito | `folha` | — | — |

**Estados desta tela:** quando a contagem atual passa o recorde, entra o nível 5 da escada. O selo "recorde" sai do período antigo e entra no atual com a mola `festa`, uma vez. O deslize não usa cor de alerta.
**Acessibilidade:** o hero se lê "12 dias sem refrigerante. Recorde de 21 dias." Cada período é um botão: "21 dias, de 20 de setembro a 10 de outubro, recorde".
**Implementação:** o `NumberFlow` usa a Fraunces só aqui, com `fill`. O recorde e o total vêm de `daysSince()`.

## Progresso · visão geral  (rota: `/progresso?periodo=semana&tema=visao`)

**Como chega:** pela aba (troca em `micro`) ou pelo "76% na semana ›" do Hoje. A Jornada abre esta vista com `?periodo=fase&fase=1`.
**Ao aparecer:** cascata no cartão da semana, na lista de pilares e nos insights. O anel desenha em `ring`. Com +120 ms, as quatro `MiniBar` enchem em `fill`.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `PeriodSelector` ‹ › | Toque | Semana anterior ou seguinte; › fica desabilitada no período atual | Conteúdo troca com 12 px na direção do tempo e opacidade em `base`; anel e barras andam do valor velho ao novo em `fill` | URL `periodo` | — |
| "Voltar para esta semana" | Toque | Aparece ao lado do seletor fora do período atual e volta para ele | `fadeUp` ao aparecer | URL | — |
| Chip de tema | Toque | Troca a vista e mantém o período | O chip escolhido com a mola `toque`; a fileira rola até ele com `calma`; o conteúdo troca em opacidade `micro`, sem deslocamento | URL `tema` | — |
| Linha de pilar | Toque | Seleciona o chip do pilar | Igual ao chip | URL | — |
| Semana passada › | Toque | Revisão passada, só leitura (`/jornada/revisoes/:semana`) | Empurrada, `calma` | — | — |
| Fase 1 · Base › | Toque | A mesma tela com `?periodo=fase&fase=1`: o seletor mostra "Fase 1 · Base / 21 set – 11 out", e a seta anda entre fases | Como o seletor | URL | — |
| Insight | — | Nenhum | — | — | — |

**Estados desta tela:** no período de uma fase, o anel mostra a constância de fechamento (81%), e a linha "Semana passada" vira "Fase anterior". Com poucos dados, vale a tela "Progresso · poucos dados" do grupo I.
**Acessibilidade:** o seletor é um grupo "Período" com "Período anterior" e "Próximo período" (desabilitado). Os chips usam `aria-pressed`, e o anel se lê "Constância da semana, 76% até agora".
**Implementação:** os componentes são `PeriodSelector`, `Chip` em fileira com rolagem horizontal, `Ring`, `CardHeader`, `MiniBar` e `InsightCard`. As correlações vêm de `correlation()`, que exige 7 dias com e 7 sem. O seletor só aceita `semana`, `mes` e `fase`. A frase e a base de cada padrão são montadas em `src/screens/progress/insights.ts` com `patternWords` (e não com o texto do domínio): no Acordar, "Nos dias em que você acordou no horário, a constância do resto do dia foi 84%. Nos outros, 61%." com "19 dias no horário · 12 após o horário · desde 21 de setembro"; no Deitar, em Humor, "14 noites no horário · 14 após o horário".

## Progresso · humor  (rota: `/progresso?periodo=mes&tema=humor`)

**Como chega:** pelo chip Humor. O período vira o mês que contém a semana escolhida.
**Ao aparecer:** o cartão do calendário entra com `fadeUp`, e as médias e os insights vêm na cascata. Células e rostinhos não animam.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Dia com ou sem check-in | Toque | Abre "Progresso · um dia" | Anel `sel` em `micro` | — | — |
| Dia futuro | Toque | Nada | — | — | — |
| `PeriodSelector` | Toque | Mês anterior ou seguinte | Como na visão geral | URL | — |

**Acessibilidade:** cada dia se lê "4 de outubro, humor Muito bem". A legenda dos rostinhos fica escondida do leitor de tela, porque cada dia já diz a palavra.
**Implementação:** `MonthCalendar` (`variant="mood"`) recebe os `checkins` do mês. No período de uma fase, mostra as semanas da fase seguidas, mesmo atravessando dois meses.

## Progresso · um dia  (rota: `?folha=dia&dia=2026-10-21`)

**Como chega:** pelo toque num dia: célula do humor, barra da proteína, anel da água ou rótulo do ponto do peso. É uma folha com a mola `folha`.
**Ao aparecer:** só a folha. Os rostinhos já vêm no estado escolhido.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Editar este dia | Toque | Fecha a folha e abre `/hoje?dia=2026-10-21` (Hoje · outro dia, grupo I) | Folha desce em `base`; troca de aba em `micro`; a faixa do outro dia desce em `base` | — | — |
| X, arrasto, toque fora | — | Fecha | `base` | — | — |

**Estados desta tela:** num dia sem check-in, os rostinhos dão lugar a "Sem check-in neste dia" e "Fazer o check-in deste dia" (`?folha=checkin&dia=`). Num dia pausado, entra a linha "Dia pausado · Férias". Números sem registro somem da faixa.
**Acessibilidade:** o foco entra no título com a data, e os três números se leem como "Hábitos, 7 de 12".
**Implementação:** o componente novo `DaySheet` lê `checkins`, `marks` e `entries` do dia e não grava nada.

## Progresso · medidas  (rota: `/progresso?periodo=semana&tema=medidas`)

**Como chega:** pelo chip Medidas, pelo "Peso" do Hoje ou pela folha do peso.
**Ao aparecer:** o gráfico do peso desenha em `ring`, e com +120 ms a linha da cintura desenha (se estiver visível). A frase do título entra parada.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Gráfico do peso | Arrastar na horizontal ou tocar | Fio vertical no dia mais perto, ponto em destaque e rótulo "Qua, 21 out · 83,3 kg · média 83,7" | Salta de dia em dia em `micro`, sem interpolar | — | — |
| Rótulo do dia | Toque | Abre "Progresso · um dia" | `folha` | — | — |
| Toque fora do gráfico | — | Some o fio e o rótulo | `micro` | — | — |
| Registrar peso | Toque | Folha do peso (`?folha=peso`, grupo B) | `folha` | `logMeasurement` em `measurements` | Hoje (linha Peso) |
| Depois de registrar | — | Ponto novo, média nova e frase nova | O ponto entra com escala de 0 a 1 e a mola `toque`; a linha redesenha em `fill`; a frase troca em `micro` | — | — |
| Ponto da cintura | Toque | O mesmo rótulo, sem fio | `micro` | — | — |
| Tempo de tela | Toque | `/progresso/habito/:id` | `calma` | — | — |
| Olho no cartão do peso | Toque | Oculta e mostra os valores do cartão (os números viram •••). Vale até sair da tela | `micro` | — | — |

**Estados desta tela:** com menos de 3 pesagens, entra a frase de espera de [estados.md](../estados.md) no lugar da linha. O título é sempre neutro ("desceu", "subiu" ou "ficou estável") e nunca muda de cor. Com "Mostrar só a tendência" ligado (Ajustes › Aparência › Privacidade), o gráfico mostra só a linha da média e a frase, sem os pontos de cada dia nem os números; o número de um dia aparece com um toque no gráfico.
**Acessibilidade:** o gráfico tem `role="img"` com a frase da tendência. Ao lado dele, uma lista escondida com cada pesagem permite ler dia a dia, e as setas do teclado movem o fio no computador.
**Implementação:** `WeightChart`, com d3-shape e d3-scale. O eixo tem 0,4 kg de folga acima e abaixo dos extremos. Use `touch-action: pan-y` e comece o arrasto só depois de 8 px na horizontal, para a rolagem vertical continuar livre.

## Progresso · alimentação  (rota: `/progresso?periodo=semana&tema=:pilarId`)

**Como chega:** pelo chip do pilar ou pela linha do pilar na visão geral.
**Ao aparecer:** as barras da proteína sobem com a cascata. Com +120 ms, os anéis da água desenham. Os blocos de notas enchem quando ficam visíveis.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Barra da proteína, anel da água | Toque | Abre "Progresso · um dia" | Barra a 0,8 de opacidade em `press` | — | — |
| Limite, dias sem, nota | Toque | `/progresso/habito/:id` | `calma` | — | — |
| Proteína somada noutra tela | — | A barra de hoje sobe do valor velho ao novo | `fill`; o número abaixo no `NumberFlow` | — | — |

**Estados desta tela:** a barra de hoje fica listrada até a virada do dia lógico (4h). No dia seguinte, ela aparece sólida, sem animação. Ao bater a meta, a barra encosta na linha, sem o selo da escada, que fica no Hoje e na folha.
**Implementação:** `DailyBarsChart` e `DayRings` (componentes novos). O listrado é um `pattern` de SVG com id de `useId()`, porque dois gráficos na mesma página com o mesmo id quebram o listrado.
