# Registros rápidos · interações e animações

As folhas de registro, que abrem sobre o Hoje (e sobre o Hábito e o Progresso) para registrar em segundos e voltar ao mesmo lugar.

## Regra das folhas

| Tipo | Folhas | Quando grava | Como fecha | Desfazer |
|---|---|---|---|---|
| Soma | Proteína, Água | Na hora, a cada toque num botão | X, arrasto ou toque no fundo. Não há o que salvar | Dentro da folha: o − da linha. Apagar a linha inteira deixa a faixa "Whey removido · Desfazer" na lista por 5 s |
| Pergunta | Deitar e acordar, Nota, Check-in, Peso, Deslize | No botão do pé, que repete a escolha ("Salvar nota 4"), e a folha fecha | O botão grava e fecha. X, arrasto e fundo fecham sem gravar | Toast na tela de origem por 5 s, logo depois que a folha fecha |

- Fechar sem salvar nunca pede confirmação. O check-in guarda rascunho no `localStorage`. As outras folhas de pergunta descartam a escolha, que leva segundos para refazer.
- O botão do pé fica desabilitado (opacidade 0,4 e `aria-disabled`) até haver a resposta mínima: uma nota, humor e energia ou um peso válido.
- Com o teclado aberto, o botão do pé fica preso logo acima dele e só o meio da folha rola.
- Toques do Hoje até gravar: Proteína e Água 2, Deitar e acordar 2, Nota 3, Check-in 3 (a partir do rostinho), Peso 6 (abrir, 8, 3, vírgula, 6, Salvar). O Deslize leva 2 toques a partir do Hábito.

## Comum a todas as folhas

**Como chega:** passagem de folha de navegacao.md: sobe com a mola `folha` e o fundo escurece em `base`. Com movimento reduzido, opacidade em `micro`. A rota ganha `?folha=...` sobre a tela de origem.
**Ao aparecer:** só a folha se move. Números, barras, anéis e listas chegam no valor atual, sem `cascade` e sem desenhar do zero, porque abrir não é uma ação com resultado.
**Como sai:** X, arrasto (fecha a 30% da altura ou a 600 px/s) ou toque no fundo: desce em `base` com `--ease-exit`. Pelo botão do pé: grava, a folha desce, e o toast entra 60 ms depois, com `fadeUp`. O foco volta para o controle que abriu a folha.
**Acessibilidade:** `Sheet` com `role="dialog"`, o título como nome e o foco preso na folha (já na base). O X se chama "Fechar" e é a alternativa ao arrasto. Com letra grande, a folha vai até o topo (56 px) e rola, e o botão do pé continua preso.
**Implementação:** `Sheet` ganha duas props: `footer` (o botão do pé, preso com `position: sticky; bottom: 0`) e `keyboardAware` (segue o `visualViewport`, veja Check-in · teclado aberto). No computador, painel de 420 px à direita (navegacao.md).

## Proteína (rota: `?folha=proteina`)

**Como chega:** pelo "Mais" (`.q.more`) do cartão da proteína no Hoje. O nome do cartão abre o hábito.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Botão rápido (`QuickAddTile`) | Toque | Soma a porção | 0 ms: escala 0,97 em `press`, volta com `toque`. +60 ms: a linha nova entra no topo da lista (`fadeUp`, altura com layout `calma`) e o trecho novo da barra enche em `fill`. +120 ms: o número grande e o "faltam" rolam com NumberFlow em `fill` | `addEntry` → `entries` (hábito, item, 6 g, hora) | Hoje: cartão da proteína, ao fechar a folha. Progresso › Alimentação: ao abrir |
| O mesmo botão em até 10 min | Toque | Junta na linha de cima: "Ovo × 4" | A linha não entra de novo. "× 3" e "18 g" rolam com NumberFlow, e o fundo da linha passa por `wash` em `base` | `addEntry` (uma entrada por toque) | Igual |
| "Outro" (`.q.more`) | Toque | Troca a grade por um campo "Gramas" e o botão "Somar 15 g" | A grade sai e o campo entra com opacidade em `base`. A altura da folha muda com layout `calma`, e o teclado numérico sobe | `addEntry` com o item "Outro" | Igual |
| − da linha (`hit`) | Toque | Tira a porção mais recente da linha | "× 3" vira "× 2" e os totais rolam em `fill`. O trecho da barra encolhe em `fill`. Na última porção, a linha vira a faixa "Whey removido · Desfazer", com o fio de 5 s, e depois recolhe em `base` com `--ease-exit` | `removeEntry` (apaga uma entrada) | Igual |
| Linha | Deslizar para a esquerda | Mostra "Apagar", que apaga a linha inteira | A linha segue o dedo. Abre o botão de 72 px se passar de 40% da largura; senão volta com `calma` | `removeEntry` de cada entrada da linha | Faixa com Desfazer, como no − |
| Faixa "Desfazer" | Toque | Devolve a linha | A linha volta pelo mesmo caminho, sem celebração | Regrava as mesmas entradas | Igual |

**Estados desta tela:**
- Meta batida (nível 2 da escada): a barra encosta na linha da meta, e a linha acende de `mark` para `ink`. A pílula "faltam 34 g" troca por "meta batida" com ✓ (`ValuePill` ok) em `micro`, com a mola `toque`. A vibração bônus toca.
- Passou da meta: a barra continua, e a pílula mostra "+6 g". O selo não repete.
- Escala da barra: o maior entre meta × 1,25 e total × 1,1. Quando ela muda, todas as larguras andam juntas em `fill`.
- Lista vazia: "Nenhum registro hoje.", em `text-3`.
- Com mais de 6 linhas, a lista rola dentro da folha e a grade fica presa no pé.

**Acessibilidade:** o botão se chama "Somar ovo, 6 gramas". Depois de cada soma, `aria-live="polite"` anuncia "52 de 80 gramas". A linha se chama "7h10, ovo, 3 porções, 18 gramas", com a ação personalizada "Apagar". Com letra grande, a grade passa para 2 colunas.
**Implementação:** os botões vêm dos botões rápidos do hábito, em Ajustes. A folha mostra todos, e o Hoje mostra 3, pela hora do dia. O total é a soma das `entries` do dia, e a linha "× 3" é só agrupamento na tela (mesmo item, até 10 min de diferença). Vale a trava de 300 ms de gestos-e-feedback.md entre toques no mesmo botão.

## Água (rota: `?folha=agua`)

**Como chega:** toque no anel da linha Água no Hoje. O nome da linha abre o hábito, e as pílulas "500 ml" e "1 L" somam direto, sem abrir a folha.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| "+ 500 ml" e "+ 1 L" (`QuickAddTile`) | Toque | Soma | 0 ms: `press` e `toque`. +60 ms: a linha entra no topo da lista. +120 ms: o anel anda em `ring` e "1,5 L" rola com NumberFlow em `fill` | `addEntry` → `entries` (500 ou 1000 ml) | Hoje: anel e texto da linha Água |
| − da linha e deslizar | Como na proteína | Como na proteína | Como na proteína; o anel recua em `ring` | `removeEntry` | Igual |

**Estados desta tela:** meta batida: o anel fecha, o traço passa de `mark` para `ink`, e entra o selo "meta batida" embaixo do anel (nível 2). Passou da meta: o anel fica cheio, o centro mostra "3,5 L", e "+0,5 L" aparece no lugar de "de 3 L". Os litros usam uma casa só quando precisam ("1,5 L", "2 L").
**Acessibilidade:** os botões se chamam "Somar 500 mililitros" e "Somar 1 litro", e o anúncio é "2 litros de 3".

## Acordei às · Deitar e acordar (rota: `?folha=acordar`)

**Como chega:** pela pílula "Registrar" da linha Acordar, na manhã do Hoje. Abre com o acordar no horário de agora, arredondado ao minuto, e o deitar na meta (22:00). Se já houver registro do dia, abre com os valores salvos.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Horário (`TimeValue`) | Toque | Abre a roda nativa do iOS | O valor troca em `micro`. A linha de baixo alterna entre "conta como feito" (✓ com a mola `toque`) e "20 min depois da meta" (neutra, sem ícone), em `micro` | Nada até salvar | — |
| "Salvar 22h15 e 6h52" | Toque | Grava os dois e fecha | O rótulo acompanha os valores com troca de texto em `micro`, sem mudar a largura | `logSleep` → dois `marks`: Deitar no dia lógico de ontem (22h15) e Acordar hoje (6h52), cada um feito se estiver na tolerância | Hoje: Acordar vira feito com "6h52" ✓ (nível 1), e "2 de 12" vira "3 de 12" (+120 ms). O anel de quinta anda, e o de quarta anda sem celebração, porque é um dia passado |

**Estados desta tela:**
- Tolerância de 15 min, ou de 1h no fim de semana.
- Fora da tolerância, o horário grava sem ✓, e a frase diz a diferença sem cor.
- Deitar depois da meia-noite (0h30) conta na noite anterior, pelo dia lógico que vira às 4h.
- Toast: "Deitar e acordar registrados", com Desfazer, que volta as duas marcas.

**Acessibilidade:** o horário se chama "Deitei ontem às 22h15. Conta como feito. Alterar horário". A ordem de foco é título, frase, deitar, acordar e botão.
**Implementação:** um `<input type="time" step="60">` fica sobre o `TimeValue`, com opacidade 0 e 44 px de altura, e o toque abre a roda sem código extra (gestos-e-feedback.md). Leia o valor no `change`: a roda do iOS dispara `input` a cada giro.

## Nota do almoço (rota: `?folha=nota&refeicao=almoco`)

**Como chega:** pela pílula "Dar nota" (ou "4 · Bom") da linha Almoço. O jantar usa a mesma folha, com `refeicao=jantar`.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Opção (`OptionCard`) | Toque | Escolhe a nota | O `Radio` enche com a mola `toque`, e o fundo e o contorno mudam em `micro`. A opção anterior apaga em `micro`. O botão troca para "Salvar nota 4" | Nada até salvar | — |
| Chip | Toque | Liga ou desliga | O fundo e o ícone (+ vira ✓) trocam em `micro`, com a mola `toque` | Nada até salvar | — |
| "Salvar nota 4" | Toque | Grava e fecha | — | `rate(habitId, dia, 4, { tags })` → `marks` | Hoje: "Dar nota" vira "4 · Bom" em `micro`, a linha fica feita (nível 1) e "4 de 12" vira "5 de 12". Progresso › Alimentação: média das notas, ao abrir |

**Estados desta tela:** sem nota, o botão diz "Escolha uma nota" e fica desabilitado. Ao reabrir, a nota e os chips voltam marcados. Toast: "Almoço · nota 4", com Desfazer.
**Acessibilidade:** as opções formam um `radiogroup` chamado "Nota do almoço", e cada uma se chama "4, Bom". Os chips usam `aria-pressed`.

## Check-in (rota: `?folha=checkin`)

**Como chega:** pelo rostinho tocado no cartão "Check-in do dia", no Hoje da noite. O rosto faz a mola `toque` no cartão, o humor vai para o rascunho e, 120 ms depois, a folha sobe com o humor já marcado, sem repetir a mola. O título do cartão abre a folha sem humor.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Rostinho (`RatingFaces`) | Toque | Escolhe | Mola `toque` no rosto. O fundo `accent-wash` e a palavra em negrito entram em `micro` | Rascunho | — |
| 3 coisas boas (`TextField`) | Toque | Abre o teclado | Veja Check-in · teclado aberto | Rascunho, 500 ms depois de parar de digitar | — |
| Tempo de tela (`TimeValue`) | Toque | Vira um campo em minutos (`inputmode="numeric"`) e mostra "1h 48min" fora do foco | Troca de texto em `micro` | Rascunho | — |
| "Salvar check-in" | Toque | Grava, apaga o rascunho e fecha | — | `saveCheckin` → `checkins/{dia}` | Hoje: o cartão vira um resumo com os dois rostinhos (layout `calma`), e "8 de 12" vira "9 de 12". Progresso › Humor e correlações: ao abrir |

**Estados desta tela:**
- Sem energia, o botão diz "Falta a energia" e fica desabilitado.
- Com rascunho, o cartão do Hoje mostra o rosto já escolhido e "Continuar", e a folha reabre com tudo.
- Na virada do dia (4h), um rascunho com humor e energia vira check-in salvo. Sem os dois, ele é descartado.
- Toast: "Check-in salvo", com Desfazer. O Desfazer devolve tudo ao rascunho.

**Acessibilidade:** a ordem de foco é humor, energia, 3 coisas boas, tempo de tela e Salvar. Cada rosto se chama "Bem, 4 de 5". "opcional" faz parte do nome do grupo.

## Check-in · teclado aberto (mesma rota)

**Como chega:** foco num campo da folha do check-in.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Campo | Foco | O teclado sobe | O pé da folha acompanha o topo do teclado a cada quadro, sem animação própria. O meio rola até o campo ficar 16 px acima do botão, com `calma` | — | — |
| "seguinte" do teclado | Toque | Vai ao próximo campo (`enterkeyhint="next"`, e "done" no último) | Rolagem com `calma` | Rascunho | — |
| Fora do campo | Toque | Fecha o teclado, e a folha fica | O pé desce com o teclado | — | — |
| "Salvar check-in" | Toque | Fecha o teclado e a folha juntos e grava | Como no Check-in | Como no Check-in | Como no Check-in |

**Implementação:**
- O iOS não aceita `interactive-widget` no viewport. Use os eventos `resize` e `scroll` do `visualViewport` e posicione o pé com `bottom = innerHeight − (vv.height + vv.offsetTop)`.
- Trave a rolagem do `body` enquanto a folha está aberta; senão o iOS rola a página por baixo ao focar um campo.
- A barra ∧ ∨ OK do Safari ocupa 44 px e não some.

## Registrar deslize (rota: `/hoje/habito/:id?folha=deslize&habito=:id`)

**Como chega:** pelo botão "Registrar deslize" na tela do Hábito (dias sem). O deslize não tem controle no Hoje, longe de um toque acidental.
**Ao aparecer:** "12 → 0" fica parado, porque é uma prévia.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| "Registrar deslize" | Toque | Grava e fecha | Na tela do Hábito, depois que a folha desce: o "12" desce até 0 com NumberFlow, devagar, em `fill`, sem tremida. O recorde 21 ganha destaque em `micro`, e o novo período entra no histórico com `fadeUp` | `logSlip(habitId, hora)` → `slips` | Hoje: o cartão de dias sem vai a 0 em `fill`, e "x de 12" perde um. Progresso: ao abrir |

**Estados desta tela:**
- Sem vibração, sem som e sem cor de alerta.
- Toast: "Deslize registrado. O recorde de 21 dias continua guardado.", com Desfazer. O Desfazer sobe o número de volta a 12 em `fill`, sem celebração.

**Acessibilidade:** o botão se chama "Registrar deslize. A contagem atual vai de 12 para 0. O recorde de 21 dias continua guardado".

## Registrar peso (rota: `?folha=peso`)

**Como chega:** pela pílula "Registrar" da linha Peso, na manhã do Hoje, ou por "Registrar peso" no Progresso › Medidas. A folha sobe já com o teclado decimal.
**Ao aparecer:** o campo vem vazio, com o último peso (83,3) como placeholder em `text-3`. O botão diz "Digite o peso" e fica desabilitado.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Campo (`DecimalField`) | Digitar | Mostra o número com uma casa e "kg" | Nenhuma: é texto digitado. O botão repete o valor | — | — |
| "Salvar 83,6 kg" | Toque | Grava e fecha | O teclado e a folha descem juntos | `logMeasurement('weight', dia, 83.6)` → `measurements` | Hoje: a linha Peso vira "83,6 kg" ✓, com a mola `toque` (fora da conta de feitos). Progresso › Medidas: o ponto entra com escala, a média de 7 dias se redesenha em `fill` e a frase da tendência troca em `micro` |

**Estados desta tela:**
- Aceita de 20,0 a 300,0, com no máximo uma casa. Fora disso, o botão fica desabilitado e a linha de baixo diz "Confira o número", em `text-2`.
- Uma segunda pesagem no mesmo dia substitui a primeira: a folha abre com o valor de hoje.
- Sem comparação colorida com ontem.
- Toast: "Peso registrado", com Desfazer.

**Acessibilidade:** o campo se chama "Peso de hoje, em quilos. Última pesagem: ontem, 83,3".
**Implementação:**
- `inputmode="decimal"` e `enterkeyhint="done"`. Aceite vírgula e ponto, e grave um número.
- O iOS só abre o teclado se o `focus()` acontecer dentro do toque. Monte o campo e chame `focus()` no mesmo handler do toque que abre a folha. Se não der, foque um campo escondido no toque e passe o foco depois de montar.
