# I · Estados e feedback · interações e animações

Esta especificação cobre os momentos fora do caminho feliz: desfazer um registro e corrigir outro dia; o menu do hábito e o primeiro dia; a espera por dados (poucos dados e carregando); a falta de internet e a pausa; a instalação, o acesso negado e a versão nova.

As regras gerais estão em [estados.md](../estados.md); aqui fica só o que é de cada tela.

Componentes novos: `PastDayBanner`, `HabitMenuSheet`, `PatternWaitCard`, `OfflineNotice`, `Skeleton` com `SkeletonRow`, `PauseCard`, `InstallGuide` e `AccessDeniedScreen`. Ações novas: `endPause` e `unskipToday` (o inverso de `skipToday`). Hooks novos: `useLongPress` e `useConnection`. Rota nova: `/entrar/sem-acesso`.

## Hoje · desfazer  (rota: `/hoje`)

**Como chega:** é o Hoje logo depois de um registro de um toque; aqui, a caminhada marcada às 7h43. Qualquer ação da tabela de toasts de [gestos-e-feedback.md](../gestos-e-feedback.md) chega aqui.
**Ao aparecer:** o toast sobe com `fadeUp` no +120 ms da coreografia de marcar ([hoje.md](hoje.md)). No mesmo toque, o convite troca a frase por "De volta hoje." em `micro`, sem o "Marcar ontem", e sai na próxima arrumação do Hoje. Nada mais anima.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `Toast` | — | Fica 5 s | O fio vai de `scaleX(1)` a `scaleX(0)` em 5.000 ms, linear, com `transform-origin: left` | — | — |
| "Desfazer" | toque | Chama o inverso que a ação devolveu | O toast sai em `micro` com `--ease-exit` (opacidade e 8 px para baixo). A linha volta pelo caminho inverso, sem celebração: o ✓ se apaga, "3 de 7" e "4 de 12" voltam em `fill`, o anel de hoje recua em `fill` e o convite volta à frase original em `micro` | `marks/{day}_{habitId}` apagado | Hábito e Progresso ao abrir. Outro aparelho: troca em `micro` |
| `Toast` | dedo pousado ou foco | O tempo para | O fio para e, ao soltar, segue de onde parou | — | — |
| `Toast` | arrastar para baixo | Dispensa; a ação fica valendo | Segue o dedo só para baixo (para cima, resistência de 0,2). Sai ao passar de 24 px ou 300 px/s; se não, volta com a mola `toque` | — | — |
| Outro controle, com o toast na tela | toque | O toast novo ocupa o lugar; a ação anterior fica valendo | Os textos trocam no lugar com opacidade em `micro`; o fio volta a 100% em `micro` e recomeça. Não há saída nem entrada | a da nova ação | — |

**Estados desta tela:** aparece um toast por vez. Com o app em segundo plano, o tempo para. Numa tela sem abas, o toast fica a 8 px da borda segura (`low`). Ao abrir uma folha, o toast sai em `micro` e a ação fica valendo. Textos deste grupo: "Caminhada marcada · 3 de 7 na semana", "Caminhada marcada na quarta", "Acordar registrado · 06h58", "Acordar não conta hoje" e "Pausa encerrada".
**Como sai:** depois de 5 s, por Desfazer, por arrasto ou quando uma folha abre.
**Acessibilidade:** o toast tem `role="status"` e o VoiceOver lê "Caminhada marcada, 3 de 7 na semana. Desfazer, botão." O toast não rouba o foco. Quem não alcança o toast pode desmarcar pelo próprio controle.
**Implementação:** `toast.custom()` do Sonner com o id fixo `'undo'`: uma chamada nova com o mesmo id troca o conteúdo no lugar. Use `duration: 5000` e `pauseWhenPageIsHidden` no `Toaster`. O fio é uma animação CSS de `transform`. Ela pausa junto com o Sonner e recomeça quando a `key` muda. Com movimento reduzido, o toast entra e sai só com opacidade. O fio continua, porque é informação. Armadilha: o botão do `toast()` da base usa a classe `.tb`, a mesma da barra de abas ([revisão](../../revisao/estados.md)).

## Hoje · outro dia  (rota: `/hoje?dia=2026-10-21`)

**Como chega:** por um toque num dia passado da `WeekStrip` ou no "Marcar ontem" do convite, com a passagem "Ver outro dia" de [navegacao.md](../navegacao.md). A lista de hoje sai 12 px para a direita, com opacidade em `micro`. A lista da quarta entra pela esquerda (o passado vem da esquerda), com opacidade em `base`. O `PastDayBanner` desce 8 px no lugar do cabeçalho, em `base`. A pílula "Voltar para hoje" sobe com `fadeUp` em +60 ms. Pelo "Marcar ontem", a lista já abre rolada até a caminhada. O destaque é só a legenda em `--accent-ink`, sem pulso.
**Ao aparecer:** o dia escolhido ganha fundo `--accent-wash` e contorno, em `micro`. Os anéis já estão no valor, e não há cascata.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `CheckButton` da caminhada de quarta | toque | `markHabit(walkId, '2026-10-21')` | O ✓ entra com a mola `toque`, sem brilho e sem vibração, porque marcar no passado não celebra. Em +60 ms, a legenda vira "feito". Em +120 ms, o anel do 21 anda e "7 de 12 feitos na quarta" vira 8, em `fill`. Depois entra o toast "Caminhada marcada na quarta" | `marks/2026-10-21_{walkId}` | Hoje: o convite sai na próxima arrumação. A força e a constância são recalculadas. Hábito: a célula do 21 |
| Outro dia passado na `WeekStrip` | toque | Troca de dia | A lista anda 12 px na direção do tempo. A faixa só troca o texto, em `micro` | — | — |
| "Voltar para hoje", o 22 da semana ou a aba Hoje | toque | Volta para `/hoje` | O inverso da entrada: a lista vem da direita, e a faixa e a pílula saem em `micro` | — | — |
| `WeekStrip` | deslizar para a direita | Mostra a semana anterior (só uma) | Opacidade e 12 px na direção do tempo | — | — |
| `ValuePill` ou `ActionPill` ("71 g", "3 · Ok") | toque | Abre a folha daquele registro, naquele dia (`?dia=...&folha=proteina`) | Abertura de folha | `entries` ou `marks` com o dia da quarta | Progresso ao abrir |

**Estados desta tela:** num dia passado não há `QuickAddGrid` nem `QuickAddButton`. A proteína e a água viram `ValuePill` e abrem a folha, para ninguém somar no dia errado com um toque. Não há modo por horário: o dia aparece inteiro, com os momentos completos recolhidos. Um dia pausado abre com o `PauseCard` daquele dia.
**Como sai:** pela pílula, pelo 22 ou pela aba Hoje. O `dia` também sai da URL, sem animação, quando o app volta para a frente depois de 30 min ou na virada do dia lógico.
**Acessibilidade:** ao trocar de dia, o foco vai para a faixa, lida como "Quarta, 21 de outubro. Você está vendo um dia que passou." No código, a pílula vem logo depois da faixa, mesmo aparecendo embaixo. O dia escolhido tem `aria-pressed="true"`, e o de hoje tem `aria-current="date"`. Com letra grande, a pílula ocupa a largura toda, com margens de 16 px.
**Implementação:** `TodayScreen` lê `dia` de `useSearchParams`. A lista fica num `AnimatePresence mode="popLayout"`, com `key` no dia e `custom` com o sinal da direção (o dia novo menos o dia antigo). Abrir um dia usa `push`. "Voltar para hoje" usa `navigate(-1)` quando a entrada anterior é `/hoje`. Nos outros casos, usa `replace('/hoje')`.

## Menu do hábito  (rota: `/hoje?folha=menu&habito=:id`)

**Como chega:** por um toque longo de 500 ms numa `HabitRow`. Durante a espera, a linha escurece 4%, sem escala. Aos 500 ms vem a vibração bônus, a folha abre com a mola `folha` e o fundo escurece em `base`. Se o dedo se mover mais de 10 px antes disso, o gesto vira rolagem. No computador, o menu abre com o clique direito ou com o botão "Mais opções", escondido da tela e alcançável pelo teclado e pelo VoiceOver.
**Ao aparecer:** as opções aparecem juntas, sem cascata. Atrás do fundo escuro, a linha tocada continua com o fundo de pressionada.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| "Registrar outro horário" | toque | Fecha o menu e abre `?folha=acordar`, já na roda | O menu desce em `micro` e a folha nova sobe com `folha`. O fundo escuro fica, sem piscar | Na folha: `markHabit(id, day, { time })` | Hoje: `ValuePill` com o novo horário |
| "Hoje não se aplica" | toque | `skipToday(id, day)` | O menu fecha em `base`. A linha fica no lugar e vai para `text-3`. O controle vira um círculo pontilhado com "não conta hoje", em `micro`. "3 de 12" vira "3 de 11" em `fill`. Depois entra o toast "Acordar não conta hoje" | `marks/{day}_{id}` com `skipped: true`; o inverso guarda o valor anterior | A constância e a força ignoram o dia. Hábito: célula hachurada. A linha vai para o fim do grupo na próxima arrumação |
| "Voltar a contar hoje" (no lugar da anterior, quando o dia já não conta) | toque | `unskipToday(id, day)` | O caminho inverso, sem celebração | `marks` volta ao valor anterior | As mesmas |
| "Ver hábito" | toque | Abre `/hoje/habito/:id`, como o toque no nome | O menu sai em `micro` enquanto a tela empurrada entra com `calma` | — | — |
| "Editar hábito" | toque | Abre o formulário do hábito em tela cheia, com "Cancelar · Salvar" (grupo E) | O menu sai em `micro` e a tela cheia sobe 24 px em `base` | — | — |
| X, toque no fundo ou arrasto | — | Fecha | `base` com `--ease-exit` | — | — |

**Estados desta tela:** os hábitos de sim ou não, os contadores e os limites não têm "Registrar outro horário". Os hábitos "dias sem" só têm "Ver hábito" e "Editar hábito", porque o deslize fica no detalhe do hábito.
**Como sai:** pela opção escolhida ou fechando a folha. O foco volta para a linha.
**Acessibilidade:** a folha se chama "Acordar, opções", e o foco entra no título. Cada linha do Hoje tem o botão escondido "Mais opções de Acordar". O VoiceOver lê a legenda de "Hoje não se aplica" junto com o nome.
**Implementação:** `useLongPress` começa no `pointerdown` e dispara aos 500 ms. Ele cancela em `pointerup`, `pointercancel`, na rolagem ou num movimento acima de 10 px, e ignora o `click` seguinte. A linha precisa de `-webkit-touch-callout: none` e `user-select: none`. Sem isso, o Safari abre a lupa e o menu de texto. No computador, use `onContextMenu` com `preventDefault`. `HabitMenuSheet` é um `Sheet` com dois `ListGroup`.

## Hoje · primeiro dia  (rota: `/hoje`)

**Como chega:** de "Sua rotina · 3 de 3", por "Começar a fase 1". A tela cheia desce 24 px em `micro` e o Hoje aparece com a cascata da primeira montagem ([hoje.md](hoje.md)).
**Ao aparecer:** o convite entra com `fadeUp` depois da cascata, em +180 ms. O anel de hoje começa no trilho, e nada se desenha.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Convite "Acordei às 06h58" | toque | `markHabit(wakeId, day, { time: agora })` | O convite fecha altura e opacidade em `base` (layout `calma`). O círculo vira a `ValuePill` "06h58" com a mola `toque`. Depois entra o toast "Acordar registrado · 06h58" | `marks/{day}_{wakeId}` | `WeekCard`: o anel de hoje anda |
| Qualquer outro controle | toque | Registra como de costume | O convite sai do mesmo jeito: qualquer primeiro registro serve | o do controle | — |
| "Pesar" | toque | Abre `?folha=peso` | Abertura de folha | `measurements` | Progresso › Medidas |

**Estados desta tela:** o horário do convite muda a cada minuto, só o texto. O convite acompanha a hora: até as 10h fica no Acordar, depois no primeiro hábito sem registro do momento atual e, a partir das 20h30, no check-in. "Primeiro dia da fase 1" fica no `WeekCard` o dia todo. No segundo dia, voltam "x de 12 feitos hoje" e "% na semana". Os dias depois de hoje ficam vazados, como em [estados.md](../estados.md). Se a fase começar no meio da semana, os dias antes do começo ficam sem anel e não são tocáveis.
**Acessibilidade:** o convite é lido depois da linha: "Comece por aqui. Acordei às 06h58, botão."
**Implementação:** o primeiro dia é `day === phases[0].start` sem nenhuma marca. O convite é o `NudgeStrip` do Hoje com `variant="first"`.

## Progresso · poucos dados  (rota: `/progresso?periodo=semana&tema=visao`)

**Como chega:** pela aba Progresso, com a troca de aba.
**Ao aparecer:** o anel e as barras seguem [habito-progresso.md](habito-progresso.md). O `PatternWaitCard` entra com o resto, sem animação própria: as barrinhas já estão no valor.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Setas do período | toque | Nada: na primeira semana, as duas ficam desligadas | — | — | — |
| `PatternWaitCard` | toque | Abre `/progresso/habito/:id`, onde o mesmo estado aparece no lugar do insight | Tela empurrada | — | — |
| "Mais 2 padrões a caminho" | — | Não é tocável | — | — | — |

**Estados desta tela:** só o padrão mais perto de ficar pronto ganha o cartão. Quando falta só o lado "sem", a frase vira "Os padrões aparecem com 7 dias com e 7 sem. Os dias sem chegam no tempo deles.", sem contagem. Assim os dias sem não viram meta. Ao abrir num dia em que a contagem andou, o segmento novo enche em `fill` a partir do valor guardado, e "Faltam 4" rola para "Faltam 3" com o NumberFlow. A barrinha "sem" nunca anima. No dia em que o padrão chega a 7 e 7, o cartão tracejado some e o `InsightCard` entra com `fadeUp` na primeira abertura.
**Acessibilidade:** o cartão é um botão: "Caminhada e humor, em formação. Faltam 4 dias com caminhada. Com caminhada, 3 de 7. Sem caminhada, 1 de 7." As barrinhas têm `aria-hidden`.
**Implementação:** `correlationProgress(habitId)` no domínio devolve `{ withDays, withoutDays, needed: 7 }`. O cartão mostra o padrão a que falta menos.

## Hoje · sem internet  (rota: `/hoje`)

**Como chega:** é o Hoje de sempre. O aviso entra quando a conexão cai por mais de 3 s.
**Ao aparecer:** o `OfflineNotice` abre espaço abaixo do cabeçalho com layout `calma` e desce 8 px com opacidade em `base`. A lista desce junto, sem pular. Se o Hoje já abre sem internet, o aviso está lá, parado.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Controles do Hoje | toque | Funcionam igual, com o mesmo toast | A animação de sempre | Fila do Firestore | — |
| A conexão volta | — | Espera `waitForPendingWrites` | O ícone `cloud-slash` vira `cloud-check` e o texto vira "Tudo em dia", com opacidade em `micro`. Depois de 2 s, o aviso sobe e fecha a altura em `micro` | Sobe o que estava na fila | Outro aparelho: troca em `micro` |
| `OfflineNotice` | toque | Nada: o aviso não é botão | — | — | — |

**Estados desta tela:** uma queda de menos de 3 s não mostra nada. Se a conexão cair de novo durante o "Tudo em dia", o texto volta a "Sem internet" em `micro` e o aviso fica. Só o Hoje mostra o aviso. Ajustes › Dados e conta mostra quantos registros esperam para subir.
**Acessibilidade:** o aviso tem `role="status"` e é lido como "Sem internet. Tudo continua salvo aqui." e depois "Tudo em dia." Ele nunca recebe o foco.
**Implementação:** `useConnection()` junta os eventos `online` e `offline` com `onSnapshot(profileRef, { includeMetadataChanges: true })`. O app está sem conexão quando `navigator.onLine` é falso ou quando `fromCache` fica verdadeiro por mais de 3 s.

## Hoje · carregando  (rota: `/hoje`)

**Como chega:** logo depois do login ou do primeiro acesso, num aparelho sem cache.
**Ao aparecer:** o cabeçalho, os dias da semana e a barra de abas pintam na hora, porque vêm do aparelho e da conta. O resto espera 300 ms; se os dados chegarem antes, o esqueleto nunca aparece. Depois disso, os blocos aparecem juntos com opacidade em `micro` e respiram todos na mesma fase, de 1 a 0,7 de opacidade a cada 1,6 s, sem onda.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Os dados chegam | — | Mostra o Hoje | O esqueleto sai e o conteúdo entra com opacidade em `base`, no mesmo lugar, sem cascata | — | — |
| 8 s sem dados | — | Embaixo, aparece "Está demorando. Confira a internet." | `fadeUp` | — | — |
| Barra de abas | toque | Troca de aba normalmente | Troca de aba | — | — |

**Acessibilidade:** a área principal tem `aria-busy="true"` e um só anúncio: "Carregando o seu dia." Os blocos têm `aria-hidden`.
**Implementação:** `SkeletonRow` tem a altura da `HabitRow` (62 px), e o esqueleto do `WeekCard` tem a altura do cartão. Assim nada pula quando o conteúdo chega. O Hoje está pronto no primeiro `onSnapshot` de `habits` e das `marks` do dia. Com movimento reduzido, os blocos não respiram.

## Hoje · pausado  (rota: `/hoje`)

**Como chega:** na virada do dia lógico em que a pausa começa, ou logo depois de `startPause` em Ajustes › Pausar, com troca de opacidade em `base` ([comunicacao.md](../comunicacao.md)).
**Ao aparecer:** nada anima. Não há anel andando nem convite.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `WeekStrip`, dia pausado que já passou | toque | Abre o dia, com a faixa e o `PauseCard` daquele dia | "Ver outro dia" | — | — |
| "Encerrar a pausa" | toque | `endPause(pauseId, day)` | O `PauseCard` e o grupo recolhido saem com opacidade em `base`, e o Hoje do dia entra em `base`, sem cascata. Depois entra o toast "Pausa encerrada" | `pauses/{id}.end` = ontem | Ajustes › Pausar fica sem pausa. Progresso e Hábito: hoje volta a contar |
| `FoldedGroup` "Registrar algo, se quiser" | toque | Abre no lugar a lista do dia, sem metas | Layout `calma`; a seta gira 180° em `micro`; as linhas entram em cascata, no máximo 6 | `ui`, por dia | — |
| `CheckButton` dentro dele | toque | `markHabit` | O ✓ entra com a mola `toque`, sem vibração, e nenhum total anda. Depois entra o toast "Caminhada registrada" | `marks`; o dia continua fora da conta | Hábito: a célula mostra feito sobre a hachura |

**Estados desta tela:** quando a pausa é encerrada hoje, vale a regra de Ajustes › Pausar · em pausa: o que já passou do horário não conta. No dia da volta (3 jan), o convite é "Bem-vindo de volta. Comece por um hábito." ([estados.md](../estados.md)). Os dias sem ficam parados. No domingo da pausa, o convite da revisão não aparece.
**Acessibilidade:** o `PauseCard` tem o `h2` "Pausa até 2 de janeiro". O motivo é texto, e o VoiceOver lê "Encerrar a pausa, botão."
**Implementação:** `activePause(day)` vem do domínio. `endPause` devolve o inverso, que restaura a data de fim.

## Instalar no iPhone  (rota: `/instalar`)

**Como chega:** é a primeira tela, sem passagem. Antes da primeira pintura, `/` leva para `/instalar` quando o app abre no Safari do iPhone ou do iPad, `navigator.standalone` é falso e "Agora não" não foi tocado nos últimos 7 dias.
**Ao aparecer:** o título e os 3 passos entram em `cascade` com `fadeUp`. A barra desenhada no quadro é a do próprio Safari: a página não desenha nada sobre ela, e nada pisca para chamar atenção.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| "Agora não" | toque | Guarda a data e vai para `/entrar` | Abertura de tela cheia: a nova sobe 24 px com opacidade em `base` | `localStorage` `pk-install-dismissed` | — |
| Passos | — | Não são tocáveis; são instruções | — | — | — |

**Estados desta tela:** a tela não existe fora do Safari do iPhone (Chrome, Android, computador) nem no app instalado.
**Acessibilidade:** os passos ficam numa `<ol>`. O ⋯ do passo 1 tem o texto escondido "Mais" para o VoiceOver.
**Implementação:** iPhone ou iPad: `/iPad|iPhone/` no `userAgent`, ou `MacIntel` com `maxTouchPoints > 1`. `CriOS`, `FxiOS` e `EdgiOS` ficam de fora, porque não são o Safari. Instalado: `navigator.standalone` ou `matchMedia('(display-mode: standalone)')`.

## Conta sem acesso  (rota: `/entrar/sem-acesso`)

**Como chega:** depois do Google, quando o e-mail não está na lista de contas liberadas (a leitura do perfil devolve `permission-denied`). Sai da tela de entrada com troca de opacidade em `base`, sem deslocamento.
**Ao aparecer:** o bloco central entra inteiro com `fadeUp`. A mão não acena.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| "Entrar com outra conta" | toque | `signOut()` e abre o seletor do Google (`prompt: 'select_account'`) | Botão em `press` | — | — |
| "Copiar o e-mail" | toque | Copia o e-mail | O rótulo vira "E-mail copiado", com ✓, em `micro`, e volta depois de 2 s. Sem toast | — | — |

**Estados desta tela:** se o login for cancelado no seletor, a pessoa volta para `/entrar` com "O login não terminou. Tente de novo." Uma conta liberada depois vai para `/comecar/1` no login seguinte.
**Acessibilidade:** o foco vai para o título, e o e-mail é texto.
**Implementação:** nenhum documento é criado antes de a conta passar pela lista. A cópia usa `navigator.clipboard.writeText`.

## Nova versão pronta  (rota: qualquer aba; aqui, `/hoje`)

**Como chega:** o `vite-plugin-pwa` avisa com `onNeedRefresh`. O toast espera até não haver folha nem tela cheia aberta nem Desfazer na tela, e a pessoa passar 5 s sem tocar.
**Ao aparecer:** `fadeUp` em `base`. O toast não tem fio e fica até ser dispensado.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| "Atualizar" | toque | `updateServiceWorker(true)` recarrega na mesma rota | O rótulo vira "Atualizando" em `micro` e a página recarrega | — | Os rascunhos ficam no `localStorage` |
| `Toast` | arrastar para baixo | Dispensa até a próxima abertura do app | Como no Desfazer | — | — |
| Uma ação com Desfazer | toque em outro controle | O aviso dá lugar ao Desfazer | O aviso sai em `micro` e, depois do Desfazer, volta com `fadeUp` | — | — |

**Acessibilidade:** o toast tem `role="status"` e é lido como "Nova versão do Prokopē. Leva um segundo e nada se perde. Atualizar, botão."
**Implementação:** `useRegisterSW` de `virtual:pwa-register/react`, com `registerType: 'prompt'`. O toast usa `toast.custom` com `id: 'update'` e `duration: Infinity`. Se a pessoa ignorar o aviso, a versão nova entra na próxima vez que o app abrir do zero.
