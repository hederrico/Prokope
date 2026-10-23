# Entrada e Computador · interações e animações

O primeiro contato com o app (entrar e montar o plano em 3 passos) e o mesmo Hoje no computador, com mouse e teclado. Os atalhos de teclado do app inteiro estão no fim deste arquivo.

## Entrar  (rota: `/entrar`)

**Como chega:** é a primeira tela de quem não tem sessão, direto ou depois de Instalar no iPhone (grupo I, `/instalar`). Não há passagem: a tela pinta pronta, no tema da cópia local do perfil.
**Ao aparecer:** só na primeira montagem, o trecho percorrido do caminho se desenha do início até o ponto "você está aqui" em `ring` (600 ms, `--ease-out`), e o ponto entra com opacidade em `micro` no fim. Título, frases e botão não animam. Ao voltar de um login cancelado, nada anima.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Entrar com Google | Toque | `signIn()`: abre o Google pelo redirecionamento. O botão fica desabilitado com "Abrindo o Google…" | `press`; o texto troca em `micro` | — | — |
| Volta do Google | — | Com plano: `/hoje`. Sem plano: `/comecar/1` (ou o passo salvo). Conta fora da lista: Conta sem acesso (grupo I) | Tela cheia: sobe 24 px com opacidade em `base` | `profile` no primeiro login (nome, fuso, virada às 4h) | — |

**Estados desta tela:** enquanto o redirecionamento volta, o botão mostra "Entrando…", desabilitado, sem girador. Login cancelado ou com falha: "O login não terminou. Tente de novo." entra acima do botão com `fadeUp` (estados.md).
**Como sai:** primeiro acesso (tela cheia), Hoje (troca de aba em `micro`) ou Conta sem acesso.
**Acessibilidade:** ordem: "Prokopē" (h1), "προκοπή" com `lang="el"`, as duas frases, o botão, a legenda do cadeado. A ilustração é decorativa. Com letra grande, a ilustração encolhe até 40% da altura da tela e some nos tamanhos de acessibilidade; o botão cresce pela `min-height`.
**Implementação:** `SignInArt` (componente novo): SVG com o trecho percorrido animado pelo `pathLength` do Motion. Login com `signInWithRedirect` no mesmo domínio do Hosting (visao.md). No app, o botão usa o "G" colorido oficial do Google.

## Começar · 1 de 3  (rota: `/comecar/1`)

**Como chega:** do Entrar, como tela cheia. Ao reabrir o app no meio do primeiro acesso, abre direto no passo salvo, sem animação.
**Ao aparecer:** o primeiro trecho da `StepTop` enche em `fill`. As duas opções entram em `cascade` (2 itens). O plano base já vem escolhido.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `OptionCard` | Toque no cartão inteiro | Escolhe a opção | Fundo e contorno em `micro`; o `Radio` enche com a mola `toque` | Rascunho local | Muda o conteúdo do passo 2 |
| Continuar | Toque | Vai ao passo 2 | Passo de fluxo (navegacao.md) | — | — |
| Trocar de conta | Toque | `switchAccount()`: sai e reabre o Google com a escolha de conta | A tela cheia sai em `micro` | Apaga o rascunho desta conta | — |

**Estados desta tela:** sem X, porque o primeiro acesso não pode ser interrompido (`StepTop` em componentes.md). Fechar o app guarda o passo.
**Como sai:** "Com o plano base" leva ao passo 2 com os pilares e hábitos do modelo. "Do zero" leva ao passo 2 vazio, com o `EmptyState` e "Criar o primeiro pilar" (`AddRow`).
**Acessibilidade:** `radiogroup` "Como começar"; cada cartão é um `radio` com o texto inteiro: "Com o plano base, sugerido. 4 pilares e 7 hábitos para começar. Selecionado." A cada passo, o foco vai para o título.
**Implementação:** o rascunho fica num slice `onboarding` do Zustand, salvo no `localStorage` por conta (`pk-comecar:{uid}`). Nada vai ao Firestore antes do passo 3. Os passos trocam a entrada do histórico (`replace`).

## Seus pilares · 2 de 3  (rota: `/comecar/2`)

**Como chega:** passo de fluxo vindo do passo 1 (24 px pela direita); o segundo trecho enche em `fill`. Voltar faz o inverso.
**Ao aparecer:** `cascade` dos 4 pilares. Chips e interruptores já chegam no estado do rascunho, sem animação.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `Switch` do pilar | Toque | Põe ou tira o pilar do plano | Interruptor em `micro`; os chips recolhem ou abrem com layout `calma`; o nome passa a `text-2` | Rascunho | Pilar fora do plano nasce arquivado |
| `Chip` de hábito | Toque | Liga ou desliga o hábito | Fundo do pilar com ✓ troca para neutro com +: ícone com a mola `toque`, cor em `micro` | Rascunho | "7 hábitos escolhidos" rola com NumberFlow (`fill`) |
| Chip da caminhada | Toque em Corpo ou em Família | É o mesmo hábito nos dois pilares | Os dois chips trocam juntos | Rascunho | — |
| Nome ou ícone do pilar | Toque | Abre o formulário do pilar (grupo E), com Salvar | Tela cheia por cima | Rascunho | A cor nova pinta o pilar em `base` |
| Criar outro pilar | Toque | Abre Novo pilar (grupo E) | Tela cheia por cima | Rascunho | O pilar novo entra no fim da lista com `fadeUp` |
| Continuar | Toque | Vai ao passo 3 | Passo de fluxo | — | — |

**Estados desta tela:** pilar com todos os chips desligados continua no plano, com "Sem hábito agora" no lugar dos chips. Sem nenhum pilar no plano, "Continuar" fica desabilitado e a legenda diz "Escolha pelo menos um pilar". Do zero: lista vazia e "Criar o primeiro pilar".
**Como sai:** Continuar para o passo 3; o voltar da `StepTop` para o passo 1, com o rascunho guardado.
**Acessibilidade:** interruptor "Mente no plano"; chips com `aria-pressed`: "Acordar e deitar, no plano". A legenda do botão é `aria-live="polite"`. Com letra grande, os chips quebram em mais linhas e o botão continua preso embaixo.
**Implementação:** o plano base é um modelo no código, com pilares, hábitos das 4 fases e horários. As frases "Depois: …" vêm dos hábitos das fases 2 a 4 do modelo, então mudam sozinhas se o modelo mudar. O botão fica preso embaixo com `position: sticky`, acima da área segura.

## Sua rotina · 3 de 3  (rota: `/comecar/3`)

**Como chega:** passo de fluxo; o terceiro trecho enche em `fill`.
**Ao aparecer:** nada além do trecho. A lista é curta e entra parada.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Linha com `TimeValue` | Toque na linha ou no valor | Abre a roda do iPhone presa ao valor (próxima seção) | A do sistema | Rascunho | — |
| `DayPicker` da coleta | Toque | Liga ou desliga o dia | ✓ com a mola `toque`, fundo em `micro` | Rascunho | — |
| Revisão da semana | Toque no valor | Abre a escolha nativa de dia e horário | A do sistema | Rascunho | — |
| Começar a fase 1 | Toque | `setupPlan(rascunho)` e vai ao Hoje | A tela cheia desce 24 px em `micro`; o Hoje · primeiro dia (grupo I) entra com `cascade` | `profile` (horários, coleta), `pillars`, `habits`, `phases` (fase 1 a partir de hoje) | Hoje, Jornada e Ajustes já nascem com o plano |

**Estados desta tela:** depois das 20h, a legenda vira "Fase 1 · Base · 7 hábitos · começa amanhã", e a fase 1 começa no dia seguinte. O primeiro Hoje mostra "Seu plano começa amanhã" e, se a pessoa quiser, só o check-in de hoje. Sem dia de coleta, a linha diz "O lixo não entra no Hoje".
**Como sai:** `/hoje` com `replace`, para o voltar não reabrir o primeiro acesso. Sem confete: começar a fase 1 não é uma fase desbloqueada. A primeira celebração é o primeiro hábito marcado (nível 1 da escada).
**Acessibilidade:** cada valor anuncia "Acordar, 6 horas e 50 minutos. Ajustável." (componentes.md). Os dias são `checkbox` com o nome inteiro ("segunda").
**Implementação:** `setupPlan` (ação nova) grava tudo num `writeBatch` de uns 20 documentos e não espera o servidor. Se a escrita for recusada, aparece o toast de escrita recusada e a pessoa fica no passo 3, com o rascunho.

## Sua rotina · ajustar horário  (rota: `/comecar/3`, sem parâmetro)

**Como chega:** toque num `TimeValue`. Por baixo é um `<input type="time">`, e o iOS abre a roda presa ao valor. Não há folha, rota nem botão de salvar.
**Ao aparecer:** o valor tocado ganha o contorno da primária em `micro` enquanto a roda está aberta. A roda é desenhada pelo sistema.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Roda | Girar | O valor muda a cada parada | O texto do valor troca em `micro` | Rascunho | "8h50 até acordar" se recalcula; Telas desligadas acompanha o deitar |
| Fora da roda | Toque | Fecha a roda e mantém o valor | Contorno sai em `micro` | — | — |

**Estados desta tela:** Telas desligadas segue o deitar (1h antes) até a pessoa mudar o horário das telas. Daí em diante os dois ficam independentes, e a legenda vira "às 21h". Deitar depois da meia-noite conta na noite anterior (dia lógico às 4h), e a duração até acordar atravessa a virada.
**Acessibilidade:** o campo nativo já é anunciado; o nome vem do `label` do `TimeValue`. A frase "8h50 até acordar" é `aria-live="polite"`.
**Implementação:** no computador, o mesmo campo aceita digitar ("2230") e as setas. O quadro desenhava antes uma folha com roda própria; ela saiu porque gestos-e-feedback.md pede a roda nativa.

## Computador · Hoje  (rota: `/hoje`, com 1024 px ou mais de largura)

**Como chega:** pelo endereço no navegador ou pelo app instalado no PC. Pela barra lateral, as áreas trocam como abas: opacidade em `micro`, sem deslocamento.
**Ao aparecer:** como o Hoje do celular (telas/hoje.md): `cascade` só na primeira montagem, em ordem de leitura (cartão da semana, Manhã, Ao longo do dia, Noite, Limites, Dias sem), e os anéis da semana em `ring`, uma vez. O que chega do iPhone troca em `micro`, sem celebração.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Registrar | Clique ou `Ctrl K` | Abre a busca de registro (próxima seção) | Veja abaixo | — | — |
| Seção da barra lateral | Clique ou `G` e a letra | Troca de área | Opacidade em `micro`; o ícone passa a Fill com a mola `toque` | Último caminho da aba (`ui`) | — |
| Pilares da barra lateral | — | Só leitura, sem hover nem foco | — | — | — |
| `WeekCard` | Clique em "76% na semana" ou num dia | Progresso, ou aquele dia | Troca de aba, ou troca de dia (navegacao.md) | — | — |
| `FoldedGroup` | Clique, `Enter` ou `Espaço` | Abre no lugar | Altura com layout `calma`; o caret gira 180° em `micro` | — | — |
| Botão da proteína (`QuickAddGrid`) | Clique | `addEntry` | Segmento novo enche em `fill`, total com NumberFlow, toast | `entries` | iPhone em cerca de 1 s |
| Mais (proteína) | Clique | Abre o painel da proteína | Painel (abaixo) | — | — |
| `QuickAddButton` da água | Clique | `addEntry` | O anel anda em `ring` | `entries` | — |
| `ActionPill` "Dar nota" | Clique; ou `1` a `5` com a linha em foco | Abre o painel da nota; o número avalia direto | A pílula vira "4 · Bom" em `micro` | `marks` (`rate`) | Progresso › Alimentação |
| `CheckButton` | Clique ou `Espaço` | `markHabit` | Coreografia de movimento.md | `marks` | "5 de 12 feitos hoje" |
| `PlusButton` do limite | Clique ou `Espaço` | `addEntry` no limite | O espaço enche em `micro`; "1 de 2" rola | `entries` | Progresso › Alimentação |
| Nome da linha, `DaysSinceTile`, `InsightCard` | Clique ou `Enter` | Abre o hábito na área principal, com "‹ Hoje" | Opacidade em `base`, sem deslizar | — | — |
| Passar o mouse | — | Fundo `surface-2`; o `CheckButton` mostra o ✓ a 40% | `micro` | — | — |

**Estados desta tela:** a partir das 20h30 vale a regra do celular: Ainda hoje e Feitos hoje, com o check-in no topo da coluna da esquerda. Abaixo de 1024 px, o layout é o do celular, com a barra de abas.
**Painel (a folha no computador):** 420 px à direita, por cima da coluna da direita. A coluna do dia continua visível, então a proteína sobe enquanto se registra. Entra com opacidade e 16 px em `base` e sai em `micro`; o resto fica `inert`. `Esc`, clique fora ou o X fecham, e o foco volta para quem abriu.
**Como sai:** barra lateral (aba), linha (tela empurrada na área principal), painel (folha).
**Acessibilidade:** link "Ir para o conteúdo"; barra lateral em `nav`, com `aria-current="page"` na área ativa; o título é o h1. As linhas de hábito são uma lista com foco itinerante: as setas andam entre linhas e o `Tab` sai da lista. O toast fica embaixo, no centro da área principal.
**Implementação:** `DesktopShell` e `SideNav` (componentes novos) envolvem as mesmas telas do celular; a consulta `(min-width: 1024px)` troca a casca, nunca a tela. Hover só dentro de `@media (hover: hover)`. Acima de 1440 px, o conteúdo para em 1100 px e centraliza.

## Computador · registrar pelo teclado  (sem rota; abre sobre qualquer tela)

**Como chega:** `Ctrl K` (`⌘K` no Mac) ou o campo "Registrar" da barra lateral. O fundo escurece em `base`, e a busca entra no centro da área principal com opacidade e escala de 0,98 para 1 em `base`.
**Ao aparecer:** o foco vai para o campo. A lista "Para agora" aparece de uma vez, sem `cascade`.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Campo | Digitar | Filtra hábitos, alimentos e telas, sem acento ("agua" acha "Água"). "agua 700" ou "proteina 25" registram esse valor | A lista troca sem animação | — | — |
| Item | `↑` `↓` ou mouse | Seleciona | Fundo da primária em `micro` | — | — |
| Item | `Enter` ou clique | Registra e fecha | A busca sai em `micro`; entra o toast com Desfazer | `marks` ou `entries` | O Hoje atrás anda pela coreografia |
| Nota do almoço | `1` a `5` | Avalia e fecha | Igual | `marks` | — |
| Item que pede formulário (outro valor, check-in) | `Enter` | Fecha a busca e abre o painel | Painel em `base` | — | — |
| Fora da busca | `Esc` ou clique | Fecha sem registrar; o foco volta para quem abriu | `micro` | — | — |

**Para agora:** até 5 itens, pela hora e pelo que falta: a refeição sem nota na janela dela, os 3 botões de proteína da hora, a água abaixo da meta e os hábitos de marcar do momento atual. O que já foi feito não aparece.
**Por que não é o painel de 420 px:** a busca é um lançador de segundos, sem campos para preencher. Ela não entra no histórico nem na URL, e fecha sozinha ao registrar. O que pede formulário abre o painel padrão de navegacao.md.
**Acessibilidade:** `dialog` com `combobox` e `listbox` (`aria-activedescendant`). O item escolhido é anunciado com o valor: "Frango, mais 30 gramas". O campo da barra lateral tem `aria-keyshortcuts="Control+K"`.
**Implementação:** `CommandPalette` e `Kbd` (componentes novos), sobre o `Dialog` do Base UI. As sugestões vêm de um seletor puro em `src/domain/`, testado com Vitest.

## Atalhos de teclado no computador

As teclas básicas (`Tab`, setas, `Enter`, `Espaço`, `Esc`, menu do hábito) estão em acessibilidade.md. Os atalhos abaixo valem com o foco fora de campo de texto. Letras funcionam sem modificador, e nenhum atalho troca um do navegador (`Ctrl L`, `Ctrl T`, `Ctrl 1` a `8`, `Alt ←`). No Mac, `Ctrl` vira `⌘`. A tecla `?` abre esta lista num painel.

| Onde | Tecla | Faz |
|---|---|---|
| Qualquer tela | `Ctrl K` | Abre "Registrar" |
| | `?` | Mostra os atalhos |
| | `G` e depois `H`, `P`, `J` ou `A` | Vai para Hoje, Progresso, Jornada ou Ajustes (até 1 s entre as teclas) |
| | `Ctrl Z` | Desfaz o último registro enquanto o toast está na tela (5 s). Num campo de texto, desfaz o texto |
| | `Esc` | Fecha busca, painel, diálogo ou tela cheia; o foco volta para quem abriu |
| Hoje | `↑` `↓` ou `J` `K` | Anda entre as linhas de hábito |
| | `Espaço` | Marca ou desmarca a linha em foco; no limite, usa um |
| | `Enter` | Abre o hábito da linha em foco |
| | `1` a `5` | Dá a nota na linha de refeição em foco |
| | `[` e `]` | Dia anterior e dia seguinte, até a semana passada |
| | `T` | Volta para hoje |
| | `C` | Abre o check-in |
| Registrar | `↑` `↓`, `Enter`, `1` a `5`, `Esc` | Escolhe, registra, avalia e fecha |
| Painel | `Enter` | Aciona a ação principal (Salvar); num campo de várias linhas, `Ctrl Enter` |
| Fluxo em passos | `Enter` | Continuar, com o foco fora de campo |

**Implementação:** um hook `useHotkeys` com pilha de escopos (busca, depois painel, depois tela): só o escopo do topo ouve. Ignore `event.isComposing` e, nos atalhos de marcar, `event.repeat`. Letras comparam `event.key` em minúscula e exigem que `Ctrl`, `Alt` e `Meta` estejam soltos. Cada controle com atalho declara `aria-keyshortcuts`. Num iPad com teclado, os mesmos atalhos valem.
