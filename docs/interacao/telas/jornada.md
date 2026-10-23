# D · Jornada · interações e animações

A Jornada guarda o plano (fases, treinos guiados e Revisões da semana). Quase tudo aqui é calmo e raro: uma revisão por semana, uma fase a cada três semanas. A exceção é o treino guiado (a corrida, a bicicleta), que é usado na rua, sem olhar e com o celular no braço.

Componentes novos deste grupo: `PhasePath` (caminho das fases), `RunScreen` (motor e tela do treino), `IntervalStrip` (fileira de blocos), `ChoiceCard` (as duas escolhas da Revisão 3), `Confetti` e o `TrainingPlanEditor` (o editor do plano, em [ajustes-plano.md](ajustes-plano.md)). Coleção nova: `runs`. Ações novas: `startPhase`, `stayInPhase`, `undoPhaseChoice`, `updatePhase`, `moveHabitToPhase`, `setPhaseThreshold`, `addPhase`, `saveReviewStep`, `finishReview`, `scheduleHabit`, `setRunSchedule`, `startRun`, `pauseRun`, `resumeRun`, `finishRun` e `discardRun`.

**Treino guiado** é um tipo de hábito (`type: 'guided'`): um plano em semanas, com N treinos por semana nos dias da agenda. Cada treino tem o aquecimento, os blocos da semana (repetições de esforço e descanso, uma sequência ou um bloco contínuo) e a volta à calma. O esforço e o descanso têm o nome que a pessoa escolheu ("Correr" e "Caminhar", "Pedalar" e "Pedalar leve", "Nadar" e "Descansar"), e esse nome aparece em todos os textos e anúncios. O modelo pronto é a "Corrida do zero aos 30 minutos" (13 semanas, 2 treinos por semana). A corrida de quem já usava o app (um "vezes por semana" com o papel `run`) chega como Treino guiado com esse modelo, sem perder os treinos feitos nem a semana e o treino em que a pessoa estava.

## Jornada  (rota: `/jornada`)

**Como chega:** pela aba, com troca de opacidade em `micro`. Tocar na aba ativa rola ao topo com `calma`.
**Ao aparecer:** na primeira montagem da sessão, os 4 nós do caminho entram em `cascade` (30 ms entre eles), o anel do nó 2 se desenha em `ring` e as barras das semanas enchem em `fill`. Nas outras vezes, nada anima, a não ser que um valor tenha mudado ("ao abrir" de [comunicacao.md](../comunicacao.md)). Os cartões dos treinos e as revisões nunca animam.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| "Editar fases" | Toque | Empurra Editar fases | `calma` | — | — |
| Fase 1 (concluída) | Toque | Empurra a revisão do fim da fase, só leitura (`/jornada/revisoes/2026-10-11`) | `calma` | — | — |
| Cartão da fase 2, fase 3 e fase 4 | Toque | Empurra Editar fases com a fase rolada até o topo | `calma` | — | — |
| Chips de hábito no cartão | — | Não são tocáveis (só descrevem) | — | — | — |
| Cartão de um treino guiado ("Corrida", "Bicicleta") | Toque | Empurra o plano daquele treino (`/jornada/treino/:id`) | `calma` | — | — |
| Revisão passada | Toque | Empurra a revisão só para leitura | `calma` | — | — |
| Revisão pendente (só quando há) | Toque em "Fazer" | Abre a revisão no passo guardado | tela cheia | — | — |

**Estados desta tela:**
- **Revisão pendente:** do dia e da hora escolhidos (domingo às 18h por padrão) até dois dias depois, o convite fica no Hoje. Depois disso, se a revisão não foi feita, ela aparece no topo de Revisões da semana como "Domingo, 1 nov · Fazer", até a revisão do domingo seguinte tomar o lugar.
- **Fase trocada:** na primeira vez que a Jornada abre depois de `startPhase`, o anel do nó 2 vira check com a mola `toque`, e o cartão "Agora" passa para a fase 3 com layout `calma`. O caminho não se move.
- **Primeiro dia:** só a fase 1 em "Agora". Em Revisões da semana entra o `EmptyState` "A primeira Revisão da semana é no domingo, 27 set."
- **Pausa do app:** o cartão "Agora" mostra "Pausado até 2 jan" no lugar de "semana 2 de 3", e a barra da semana fica hachurada.
- **Treinos guiados:** um cartão por Treino guiado ativo ou à espera da fase dele, na ordem dos hábitos, empilhados com 12 px entre eles (no lugar do cartão fixo "Plano de corrida"). Cada cartão tem o ícone e o nome do hábito, a descrição (ou "Pedalar e pedalar leve", sem descrição), uma barrinha por semana (a altura é o tempo de esforço; a semana de agora em destaque, ou a última, antes de começar) e "Semana 3 · treino 1 de 2 · 13 semanas" ou "Entra com a fase 3 · 13 semanas · 2 treinos por semana". Arquivado ou parado (a fase em que ele para já passou), o cartão sai; os treinos feitos continuam no histórico. Sem nenhum treino guiado, não há cartão.

**Como sai:** pelas telas empurradas da tabela, ou por outra aba.
**Acessibilidade:** `PhasePath` é uma lista. Cada fase é um item com o nome completo: "Fase 2, Alimentação, agora, semana 2 de 3, 76% na semana, 5 hábitos novos". A linha do caminho e as barras das semanas são decorativas. Cada cartão de treino é um botão lido inteiro: "Bicicleta, plano de treino. Pedalar e pedalar leve. Semana 1, treino 1 de 3, 2 semanas, 3 treinos por semana". Ordem de foco: Editar fases, título, fases, treinos, revisões. Com letra grande, os chips do cartão quebram linha e as barras das semanas viram texto ("semana 1 · 74%") empilhado.
**Implementação:** `PhasePath` lê `phases` e a constância calculada no domínio. A porcentagem da semana em curso é a mesma do `WeekCard` do Hoje (um seletor só). Não guarde datas de início das fases futuras: elas são previsões calculadas a partir do fim da fase atual e da duração de cada uma.

## Editar fases  (rota: `/jornada/fases`)

**Como chega:** empurrada a partir da Jornada (`calma`). Com `#fase-3`, rola até a fase sem animação antes da primeira pintura.
**Ao aparecer:** nada anima além da passagem.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Sugerir a próxima fase | Toque | Folha com `OptionCard`: 60%, 70%, 80%, "Não sugerir" | `folha` | `setPhaseThreshold(0.7)` | Revisão 3: ordem das opções e texto |
| "Termina em 1 nov" (fase atual) | Toque | `<input type="date">` nativo, a partir de amanhã | — | `updatePhase(2, { end })` | Datas previstas das fases 3 e 4 trocam com opacidade em `micro`; o domingo da revisão de fim de fase muda |
| "Duração" (fases futuras) | Toque | Folha com − e + (1 a 8 semanas) e "Sem fim" | `folha` | `updatePhase(n, { weeks })` | Datas das fases seguintes |
| Chip de hábito | Toque | Folha "Mover para" com as fases em `OptionCard` | `folha` | `moveHabitToPhase(habitId, n)` | O chip sai de um cartão e entra no outro com layout `calma`; toast "Proteína movida para a fase 3" com Desfazer |
| "Nova fase" | Toque | Formulário modal com o nome e a duração | tela cheia | `addPhase({ name, weeks })` | Novo nó no fim do caminho da Jornada |

**Estados desta tela:** a fase concluída não tem datas nem chips tocáveis (o passado não muda). Mover um hábito para a fase atual faz ele entrar no Hoje no mesmo dia, com o selo "novo". Mover para uma fase futura tira o hábito do Hoje a partir de amanhã, e os registros ficam.
**Acessibilidade:** cada cartão é um grupo com o nome da fase. Os chips dizem "Proteína, na fase 2. Toque para mudar de fase". O valor de cada `TimeValue` é lido com a ação ("Termina em 1 de novembro, alterar").
**Implementação:** os chips usam `layoutId` por hábito dentro de um `LayoutGroup`, para atravessar de um cartão para o outro. A data mínima do campo é amanhã, e nenhuma data passada fica editável.

## Plano do treino  (rota: `/jornada/treino/:id`)

**Como chega:** empurrada a partir do cartão do treino na Jornada (`calma`). A rota antiga `/jornada/corrida` leva ao plano do primeiro treino guiado (troca a rota, sem passagem), para os links de antes continuarem valendo.
**Ao aparecer:** nada anima. As barras de `MiniBar` já chegam cheias, porque são o plano e não um progresso.

O topo tem o ícone e o nome do hábito ("Bicicleta") e a frase "Do zero aos 30 minutos. 13 semanas, 2 treinos por semana. Dá para repetir uma semana quando quiser." (a descrição, quando há; antes de começar, "Entra no seu dia junto com a fase 3.").

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Dias de treino | Toque | Folha com `DayPicker` e `TimeValue` | `folha` | `setRunSchedule({ days: [0, 2], time: '07:10' }, habitId)` | Hoje dos dias escolhidos ganha a linha "Bicicleta · semana 1, treino 1" com "Começar"; cartão da Fase desbloqueada |
| Editar o plano · 13 semanas | Toque | Abre Editar plano | tela cheia | — | — |
| Linha de uma semana | Toque | O cartão "Semana N · o treino" mostra aquela semana | troca de opacidade em `micro`; a fileira e a legenda trocam juntas | — | — |
| "Começar treino" (só com o plano em curso, fixo no rodapé) | Toque | Abre o Treino em andamento (`/treino/:id/:semana/:treino`) | tela cheia | `startRun({ week, session, habitId })` | Hoje: `RunStrip` se a pessoa minimizar |

**Estados desta tela:** antes da fase do hábito, não há botão no rodapé, e a semana 1 diz "a partir de 2 nov". Com o plano em curso, a semana atual ganha `BudgetSlots` (os treinos por semana do hábito) e um `Tag` "agora". Depois dos treinos da semana, a linha seguinte vira a atual; depois da última semana, ela se repete. Tocando numa semana que já passou, o botão vira "Repetir a semana N". Arquivado: a frase diz "Arquivado. Os treinos feitos ficam no histórico." e não há botão. O rótulo da coluna é o tempo de esforço com o nome do plano ("tempo correndo", "tempo pedalando"), e a legenda usa os nomes ("Pedalar 5 × 2 min", "Pedalar leve 5 × 1 min"). Num bloco de aquecimento curto (menos de 4 min), a medida embaixo da fileira mostra só o número.
**Acessibilidade:** cada semana é lida como "Semana 3: 6 vezes correr 1 minuto e meio e caminhar 1 minuto e meio. 9 minutos correndo no total." (com os nomes do plano: "4 vezes pedalar 3 minutos e pedalar leve 2 minutos. 12 minutos pedalando no total."). A fileira de blocos é decorativa, e a legenda do treino diz a mesma coisa em texto.

## Editar plano  (rota: `/jornada/treino/:id/plano`)

**Como chega:** pela linha "Editar o plano" do plano do treino, como tela cheia (formulário).
**Topo:** `NavBar` com Cancelar · Plano · Salvar. Salvar acende quando algo mudou, grava `updateHabit(id, { training })` e volta ao plano; Cancelar sai sem gravar e sem perguntar.
**Conteúdo:** o mesmo editor do formulário do hábito ([ajustes-plano.md › Plano do treino](ajustes-plano.md)): o resumo, Em todo treino (aquecimento e volta à calma), as semanas, Adicionar semana e Começar de um modelo.
**Estados:** os treinos feitos não mudam. O progresso continua pela contagem dos treinos feitos: com menos semanas, a pessoa fica na última; com mais, segue para a próxima.

## Treino em andamento  (rota: `/treino/:habito/:semana/:treino`)

**Como chega:** pelo "Começar" da linha do Hoje ou do plano do treino, como tela cheia (sobe 24 px com opacidade em `base`). O toque em "Começar" também libera o áudio e pede o Wake Lock, porque o iPhone só permite isso depois de um gesto. O primeiro bloco (o aquecimento, ou o primeiro esforço num plano sem aquecimento) começa na hora, sem contagem. A rota antiga `/corrida/:semana/:treino` continua abrindo o treino do primeiro treino guiado (e termina em `/corrida/:semana/:treino/feito`). Um treino de cada vez: se já há um em andamento (deste ou de outro treino guiado), é ele que abre.
**Os nomes:** os blocos de esforço e de descanso usam os nomes do plano em tudo: a palavra grande ("Pedalar"), "Depois: pedalar leve 1:00", a faixa do Hoje, a folha de encerrar e os anúncios. O ícone do esforço é o do hábito; o do descanso é o de caminhar quando o nome é caminhar (senão, um respiro), e é o mesmo do aquecimento e da volta à calma.
**Ao aparecer:** o anel se desenha em `ring` uma vez. Depois disso, ele avança continuamente e não usa o token.

### O motor

- `startRun` grava em `runs` { habitId, week, session, `startedAt`, `pauses: [{ from, to }]`, `status` }, com cópia no `localStorage` para retomar antes de o Firestore responder.
- O tempo nunca é contado por tique. A cada quadro (`requestAnimationFrame`, com a tela atualizando 4 vezes por segundo), calcule `decorrido = agora − startedAt − soma das pausas`. A partir daí, o bloco atual sai de uma busca nos blocos acumulados. Assim, a tela bloqueada, a troca de app ou um recarregamento não desviam o tempo.
- **Wake Lock:** `navigator.wakeLock.request('screen')` no começar e de novo a cada `visibilitychange` visível. Com o treino pausado por mais de 10 min, a trava é solta. Sem suporte ou com recusa, o selo "Tela acesa" vira "A tela pode apagar", que abre uma folha com o caminho do Bloqueio automático do iPhone. O Wake Lock no app instalado depende do iOS 18.4 ou mais novo.

### A troca de bloco

| Tempo | O que acontece |
|---|---|
| −3 s, −2 s, −1 s | O número grande mostra só "3", "2", "1" (troca de opacidade em `micro`, sem escala). A pílula "Depois" passa de 14% para 24% de fundo. Com o som ligado, toca um tique curto (660 Hz, 60 ms) por segundo |
| 0 | O fundo troca de cor (esforço em cor cheia, descanso em tom claro) em `fill` com `--ease-in-out`. A palavra e o ícone saem com opacidade em `micro` e entram com `fadeUp`. O anel volta ao zero sem animar para trás. O contorno do bloco atual anda na fileira com layout `calma` |
| 0 | Som: para o esforço, dois bipes de 880 Hz (120 ms, com 80 ms entre eles); para o descanso (e a volta à calma), um tom de 523 Hz de 300 ms. A região viva anuncia o bloco novo |
| 0 | Vibração pelo truque do interruptor, se funcionar sem gesto. Testar: se não vibrar, nada quebra |

O fim do último bloco leva à tela Treino feito (substitui a rota).

### Som

O som vem do Web Audio, com um `OscillatorNode` e um envelope de 10 ms de ataque e 150 ms de saída, em volume 0,6. Use `navigator.audioSession.type = 'transient'` quando existir, para o bipe abaixar a música em vez de pará-la. O botão de alto-falante do topo liga e desliga só o som das trocas, e a escolha fica no `profile`.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Minimizar (`caret-down`) | Toque | Volta para a tela de origem com o treino seguindo | saída da tela cheia (desce 24 px, `micro`) | — | `RunStrip` no topo do Hoje (definida em [hoje.md](hoje.md)) |
| Som nas trocas | Toque | Liga ou desliga; o ícone troca para `speaker-slash` | `micro` | `profile.runSound` | — |
| Pausar | Toque | O relógio para, "faltam" vira "pausado", e o botão vira "Continuar" (`play`) | `micro` no ícone | `pauseRun` (abre uma pausa) | `RunStrip` mostra "Pausado" |
| Continuar | Toque | Fecha a pausa e o tempo segue | `micro` | `resumeRun` | — |
| Encerrar | Toque longo de 800 ms | Um anel enche em volta do botão enquanto o dedo segura (linear). Soltar antes cancela. No fim, abre a folha "Encerrar o treino?" com "Salvar o que fiz" (principal) e "Descartar treino" | anel em 800 ms; `folha` | `finishRun` ou `discardRun` | Treino feito, ou o Hoje com o toast "Treino descartado" e Desfazer |
| Encerrar (toque curto) | Toque | A legenda "Segure para encerrar" fica em negrito por 1,5 s | `micro` | — | — |

### Volta ao app (tela "Corrida · de volta ao app")

- No `visibilitychange` visível: recalcule o tempo, peça o Wake Lock de novo e retome o áudio.
- Se uma troca passou com o app escondido, entra o aviso no topo com `fadeUp` em `base` ("O treino seguiu com a tela bloqueada" e "Agora: caminhar, há 40 s. Os avisos voltaram."). Ele sai sozinho depois de 5 s, com opacidade em `micro`. Nenhum som toca pelas trocas perdidas.
- Se o treino terminou com o app escondido, a rota vai direto para Treino feito, com o fim na hora prevista.
- Um treino com `status: 'running'` e começado há menos de 2 h sobrevive ao fechamento do app: ao abrir, o Hoje mostra a `RunStrip`.

### Treino minimizado

A faixa `RunStrip` é do Hoje ([hoje.md](hoje.md)). Daqui ela recebe o estado do motor: o bloco, o tempo que falta (atualizado a cada segundo, sem NumberFlow) e o intervalo. Na troca de bloco, a cor da faixa muda em `fill` e o som toca igual, porque o app continua aberto. Se o treino termina minimizado, a faixa vira "Treino completo · ver resumo" e abre Treino feito.

**Estados desta tela:** treino pausado (relógio parado, fundo igual), aviso de volta, selo da tela que pode apagar.
**Acessibilidade:**
- Uma região viva (`aria-live="polite"`) anuncia só os momentos: "Caminhar, 1 minuto e 30 segundos. Intervalo 3 de 8.", "Pausado", "Continuando", "O treino seguiu com a tela bloqueada. Agora: caminhar, faltam 40 segundos." (com os nomes do plano: "Pedalar leve, 1 minuto."). A contagem 3, 2, 1 não é anunciada.
- O relógio tem `role="timer"` e `aria-live="off"`. Tocar nele lê o estado completo.
- Rótulos: "Minimizar treino", "Som nas trocas, ligado", "Pausar treino", "Encerrar treino, segure". No VoiceOver, tocar duas vezes e segurar encerra, e um botão "Encerrar treino", invisível na tela, abre a mesma folha (a web não tem ações personalizadas do rotor).
- Com letra grande, o relógio fica em 92 px (já é grande), a palavra do estado sobe até 56 px, e a fileira de blocos sai.
- Com movimento reduzido, a cor de fundo troca em 150 ms, sem `fadeUp`.

**Implementação:** os blocos vêm do plano do hábito do treino (`run.habitId`): o motor (`engine.ts`) e `useRunLive` montam a semana com `weekOfHabit` (sem hábito, o modelo da corrida). A troca de cor usa a variável `--xd-bg` com `transition: background-color var(--dur-fill) var(--ease-in-out)`. No escuro, o esforço usa um tom profundo da cor do pilar (`oklch(38% .07 60)` no damasco), para não ofuscar. Anime só `opacity` e `transform`, mais a cor de fundo uma vez por troca. Teste no Modo de Pouca Energia e com a tela a 20% de brilho ao sol.

## Treino feito  (rota: `/treino/:habito/:semana/:treino/feito`)

**Como chega:** ao fim do último bloco ou por "Salvar o que fiz". A rota é substituída e a tela troca com opacidade em `base`.
**Ao aparecer:** o anel fecha do último valor até o fim em `ring` (ou até a parte feita, num treino encerrado antes), e o check se desenha com a mola `toque`. Há uma vibração bônus (nível 1 da escada). Sem confete e sem brilho. Os números já chegam no valor final.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| (ao chegar) | — | — | — | `finishRun` (status `done`, `endedAt`, intervalos feitos) e a marca do hábito no dia (`run: { week, session, seconds }`) | Hoje: a linha do treino feita e "x de 12" anda; Plano: 1 de 2 na semana; cartão da Jornada; Progresso › Corpo |
| Próximo treino | Toque | Folha "Dias de treino" | `folha` | `setRunSchedule(…, habitId)` | Hoje dos dias novos |
| Voltar ao dia | Toque | Hoje | saída da tela cheia | — | — |

**Estados desta tela:** os números são Intervalos, o tempo de esforço e o de descanso, com os nomes do plano ("Pedalar 10 min", "Pedalar leve 5 min"). O treino encerrado antes mostra o que foi feito ("18 min", "5 de 8") e conta pelo plano: o treino inteiro é feito, a partir da metade é parcial, e abaixo da metade fica registrado sem contar. Nenhuma palavra sobre o que faltou. Para desfazer, a pessoa desmarca o treino no Hoje, como qualquer hábito.
**Acessibilidade:** o foco vai para o título "Treino feito", que é lido junto com "30 minutos, 8 de 8 intervalos".

## Revisão da semana · 1, 2 e 3  (rota: `/revisao/:semana/1` a `/3`)

**Como chega:** pelo cartão "Revisão da semana" do Hoje, no domingo a partir das 18h ("Começar revisão", ou "Continuar revisão" quando ficou pela metade), ou pela linha pendente da Jornada. É uma tela cheia que sobe 24 px com opacidade em `base`. "Continuar revisão" abre no passo guardado em `reviews/{week}.step`.
**Passos:** é o fluxo em passos de [navegacao.md](../navegacao.md). O conteúdo novo entra 24 px pela direita, o trecho do `StepTop` enche em `fill`, e a rota troca com `replace`. O ‹ do `StepTop` volta um passo. O X fecha, guarda o passo e o rascunho e não pergunta nada.
**Ao aparecer (passo 1):** o anel de 78% se desenha em `ring` 120 ms depois da entrada. As 4 linhas de "O que deu certo" entram em `cascade`. O cartão "Para olhar com carinho" entra por último, com `fadeUp`, 150 ms depois da cascata, para o feito chegar antes. Se a revisão anterior teve um ajuste, o passo 1 pergunta "O ajuste funcionou?", com Sim, Em parte e Não, os três do mesmo tamanho.

| Passo | Elemento | Gesto | Resposta | Dado gravado | Reflexo |
|---|---|---|---|---|---|
| 1 | Continuar | Toque | Passo 2 | `saveReviewStep(week, 1)` | — |
| 2 | Ajuste da semana | Digitar | Rascunho no `localStorage` a cada 300 ms | `reviews/{week}.tweak` ao continuar | Hoje: uma linha no `WeekCard` até a próxima revisão, que pergunta se o ajuste funcionou |
| 2 | Cintura | Digitar (`inputmode="decimal"`, `enterkeyhint="done"`) | — | `logMeasurement('waist', 94.5, day)` ao continuar | Progresso › Medidas: ponto novo |
| 2 | Dia do programa a dois | Toque (`DayPicker` de escolha única) | O dia marca com a mola `toque` | `scheduleHabit(habitId, '2026-11-07', note)` | Hoje de sábado: a linha com a nota |
| 2 | Continuar | Toque | Passo 3, mesmo com tudo vazio (pular) | `saveReviewStep(week, 2)` | — |
| 3 | "Começar a fase 3" | Toque | Fase desbloqueada | `startPhase(3)` e `finishReview` | Jornada, Hoje de amanhã, Ajustes (tabela de comunicacao.md) |
| 3 | "Ficar mais uma semana" | Toque | Revisão · mais uma semana | `stayInPhase(2)` e `finishReview` | Fase 2 até 8 nov; datas previstas das fases 3 e 4 |

**Estados desta tela:**
- **Abaixo do limite** (70% em Editar fases): no passo 3, "Ficar mais uma semana" vem primeiro, e o texto sugere firmar a fase. As duas opções continuam com o mesmo peso.
- **Semana do meio da fase:** são 2 passos, sem convite. O passo 2 termina em "Concluir", que volta ao Hoje com o toast "Revisão da semana feita".
- **Sem programa a dois ativo, ou sem cintura medida nesta conta:** o bloco correspondente não aparece.
- **Mudar de ideia:** até o fim do domingo, o cartão "Amanhã começa a fase 3" do Hoje tem "Mudar de ideia", que chama `undoPhaseChoice`.
- **Revisão passada** (`/jornada/revisoes/:semana`): é uma tela empurrada com os 3 passos um abaixo do outro, em texto, sem campos e sem botões.

**Acessibilidade:** o `StepTop` é lido como "Passo 2 de 3". A cada passo, o foco vai para o título. As duas `ChoiceCard` são botões com o nome e a consequência ("Começar a fase 3. Os 4 hábitos entram amanhã, 2 de novembro"). Com letra grande, a lista de "O que deu certo" vem antes do anel.
**Implementação:** o rascunho é a fonte enquanto a revisão está aberta. Ao continuar, ele vai para `reviews/{week}`. Fechar o app no meio não perde nada (navegacao.md, "Fluxos interrompidos").

## Fase desbloqueada  (rota: `/fase/:numero`)

**Como chega:** depois de `startPhase`. A rota é substituída e a tela troca com opacidade em `base`, sem subir.
**Ao aparecer (nível 6 da escada, uma vez por fase, marcado em `phases/{n}.celebratedAt`):**

| Tempo | O que anima |
|---|---|
| 0 ms | O emblema vai de 0,8 a 1 de escala com a mola `festa` |
| +120 ms | O `Confetti` cai uma vez em `confetti` (1.600 ms). São 18 peças, cada uma começando 40 a 80 px acima do lugar final, com opacidade de 0 a 1 nos primeiros 200 ms e rotação de até 40°, e terminando parada onde o quadro mostra. Sem loop e sem gravidade que quica |
| +200 ms | "Fase 3" e "Movimento" sobem 12 px com a mola `festa` |
| +400 ms | A frase entra com `fadeUp` |
| +600 ms | O cartão do primeiro treino e "Ver meu dia" entram com `fadeUp` |

Reabrir a rota mostra tudo parado. Com movimento reduzido, o confete já está desenhado e o resto entra com opacidade em 150 ms. Sem som e sem vibração.

| Elemento | Gesto | Resposta | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|
| Primeiro treino de corrida (o primeiro treino guiado que entra com a fase, com o nome curto dele) | Toque | Folha com `TimeValue` e `DayPicker` | `setRunSchedule` | Hoje de segunda |
| Ver meu dia | Toque | Hoje de domingo, com o cartão "Amanhã começa a fase 3" | — | Na segunda, os hábitos novos entram no Hoje com o selo "novo", em `cascade` |

**Acessibilidade:** o confete é decorativo (`aria-hidden`). O foco vai para "Fase 3, Movimento" e lê a frase em seguida.

## Revisão · mais uma semana  (rota: `/revisao/:semana/fim`)

**Como chega:** depois de `stayInPhase`, com troca de opacidade em `base`.
**Ao aparecer:** o emblema e o título entram com `fadeUp`, a lista e o botão 150 ms depois. Sem confete, sem `festa` e sem vibração: o mesmo cuidado, num nível mais calmo.
**Dado gravado:** `phases/2.end` = 8 nov e `reviews/{week}.decision = 'stay'`. As datas das fases 3 e 4 são recalculadas.
**Como sai:** "Ver meu dia" leva ao Hoje. No domingo seguinte, o convite da Revisão 3 volta.
**Acessibilidade:** o foco vai para "Mais uma semana". A frase lê a nova data por extenso.
