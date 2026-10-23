# Revisão · Registros rápidos

## Regra das folhas
- **Folha que soma** (Proteína, Água): cada toque já salva e a folha fica aberta. Não tem botão Salvar. Fecha no X, arrastando para baixo ou tocando fora.
- **Folha que responde uma pergunta** (Acordar, Almoço, Check-in, Deslize, Peso): tem um único botão principal no pé, que repete o valor escolhido ("Salvar 06h52", "Salvar nota 4"), salva e fecha a folha.
- **Todas as folhas:** alça, título com a bolha do pilar e X. Depois de fechar, o Hoje mostra Desfazer por 5 s. Para corrigir um engano, cada linha da lista do dia tem um − visível.
- **Toques do Hoje até o registro salvo:** Proteína 2, Água 2, Acordar 2 (mais a rolagem, se o horário não for o de agora), Almoço 3, Check-in 4 (abrir, humor, energia e Salvar), Deslize 2, Peso 5 (abrir, 3 dígitos e Salvar).

## Proteína
**O que mudou**
- "Deslize para apagar" era um gesto escondido → cada linha ganhou um − visível que tira uma porção: "Ovo × 3" vira "× 2". Na última porção, a linha some e aparece Desfazer.
- Os botões rápidos ficavam no meio da folha → foram para o pé, no alcance do polegar. Ficam sempre no mesmo lugar, mesmo quando a lista cresce.
- Os números 18, 6 e 22 embaixo da barra repetiam a lista → saíram. Os trechos da barra continuam.
- Nome dos itens em 15 px → 16 px.

**Fica para decidir**
- À noite, a lista chega a 6 ou 8 linhas. Dá para mostrar só as 3 últimas com "ver todas". Pesa contra: corrigir um registro antigo vira um toque a mais.

## Água
**O que mudou**
- Botões no meio da folha → no pé, igual à proteína.
- As linhas mostravam só "500 ml" e "1 L" → agora "Garrafinha · 500 ml" e "Garrafa · 1 L", com os mesmos nomes dos botões e o − para corrigir.
- A legenda "Meta de 3 L · editar em Ajustes" e o "1,5 L" ao lado de "Hoje" repetiam o anel → saíram.

**Fica para decidir**
- Mostrar "faltam 1,5 L", como na proteína. As duas folhas ficariam iguais, mas o anel já mostra isso.

## Acordei às
**O que mudou**
- "Agora · 06h58" e "Usar 06h52" competiam. Na história, o "Agora" ainda gravaria 6 minutos a mais (acordou 06h52 e registrou 06h58) → ficou um botão só, "Salvar 06h52", que segue a roda. A roda abre no horário de agora, então registrar na hora continua em 2 toques.
- O botão principal ficava no topo → foi para o pé.
- A meta aparecia só como legenda → retorno ao vivo "Conta como cumprido", com ícone de check e cor de sucesso, e a regra embaixo.
- O título ocupava duas linhas → "Que horas acordou?", em uma.

**Fica para decidir**
- Roda própria ou o `<input type="time">` nativo do iOS. O nativo dá menos trabalho e é mais acessível, mas abre num balão pequeno e com outro visual.

## Nota do almoço
**O que mudou**
- "O prato tinha" não combinava com "Sentado, sem tela" → virou "Neste almoço", marcado como opcional.
- Chips de 34 px → 44 px de altura.
- "Salvar" → "Salvar nota 4", que confirma a escolha antes do toque.

**Fica para decidir**
- O toque na nota salvar e fechar sozinho (2 toques em vez de 3). Pesa contra: os detalhes do prato ficam sem lugar e a regra das folhas perde a consistência.
- O Hoje já mostra os 5 números na linha do almoço (`r5`, círculos de 28 px). Se tocar ali já salvar, o registro leva 1 toque e a folha fica só para os detalhes. Para isso, o alvo precisa crescer para 44 px.

## Check-in
**O que mudou**
- Não ficava claro que dá para salvar só humor e energia → "3 coisas boas" e "Telas hoje" agora dizem "opcional". O Salvar fica preso no pé da folha e funciona logo depois dos dois rostinhos.
- Campos em 15 px, e o iPhone dá zoom em campo menor que 16 px → todos em 16 px.
- Os minutos de tela ficavam numa pílula pequena → campos de 40 px com a unidade, que abrem o teclado numérico.
- "Copie do Tempo de Uso do iPhone" → "Copie de Ajustes › Tempo de Uso, no iPhone", com o caminho.
- Ordem mantida: primeiro os rostinhos (um toque cada, o essencial para quem está cansado), depois as 3 coisas boas, e as telas por último, porque pedem sair do app.
- Fechar sem salvar guarda um rascunho até o fim do dia (está na nota).

**Fica para decidir**
- Tirar os minutos de tela do check-in e deixá-los numa linha própria do Hoje. O check-in das 20h36 ficaria mais leve, mas o registro se separa de algo que acontece na mesma hora.

## Check-in · teclado aberto (nova)
**O que mudou**
- Tela nova. Com o teclado aberto, a folha encolhe até o topo dele e rola até o campo em uso. O Salvar sobe junto e fica logo acima do teclado e da barra do Safari (∧ ∨ OK). O "seguinte" do teclado pula para o próximo campo. Na implementação, medir o teclado com `visualViewport`.

## Registrar deslize
**O que mudou**
- A folha não tinha X e usava "Cancelar" → ganhou o mesmo cabeçalho das outras (bolha do refrigerante, "Registrar um deslize?" e X) e um botão só, neutro.
- O texto não dizia de qual hábito era → "A contagem de dias sem refrigerante recomeça amanhã…".
- Tom mantido: nada de vermelho, e o recorde aparece com cadeado. Depois de registrar, o Hoje mostra Desfazer por 5 s (está na nota; o componente é do grupo de Estados).

**Fica para decidir**
- O SPEC pede "total 31" nesta folha e no hábito, mas a história soma 21 + 12 = 33. Mantive 33, igual ao arquivo do Hábito. Proposta: corrigir o SPEC para 33.
- Definir se um deslize registrado hoje tira o dia de hoje do total (33 → 32). A regra precisa ser a mesma no Hábito e no Progresso.

## Registrar peso (nova)
**O que mudou**
- Tela nova: o Progresso tinha o botão, mas a folha não existia. A folha já abre com o teclado numérico, e a vírgula entra sozinha (8, 3, 6 vira 83,6), sempre com uma casa decimal. Mostra a última pesagem como referência ("ontem, 83,3 kg"), a dica "Melhor de manhã, antes do café." e o botão "Salvar 83,6 kg" logo acima do teclado.
- Os pesos são de exemplo e batem com o gráfico do Progresso (21 out 83,3 e 22 out 83,6). A folha não mostra a diferença para ontem em cor, porque o peso de um dia oscila. A leitura certa é a média de 7 dias, no Progresso.

**Fica para decidir**
- Cor do pilar: usei Alimentação, como em `visao.md` e no SPEC. O Progresso pinta o peso com a cor de Corpo. Um dos dois precisa mudar.
- Uma linha "Peso" na manhã do Hoje abriria esta folha em 1 toque às 7h. Hoje, só o Progresso abre a folha.

## Pedidos para a base
- `.xbtn` tem 32 px. Dá para chegar a 44 px de área de toque sem mudar o visual: `.xbtn { position: relative } .xbtn::after { content: ""; position: absolute; inset: -6px }`.
- `.chip` tem 34 px de altura: usar `.chip { position: relative } .chip::after { content: ""; position: absolute; inset: -5px 0 }`. `.r5 span` tem 28 px: subir para 36 px com `gap: 8px` e a mesma área invisível.
- `sheet()` poderia aceitar `{ cls, kb: 'text' | 'num' }`, para encostar a folha no teclado e desenhar o teclado do iPhone com um `kbd()` comum. Assim, todas as telas com campo (Revisão 2 de 3, Novo pilar, Pausar) mostram o mesmo teclado. Hoje eu faço isso com `replace('class="sheet"', …)` e o CSS `.xb-kb*` no meu arquivo, que pode ir para a base.
- `sheet()` poderia aceitar `{ foot }`: um pé fixo (`.sh-f`) para o botão principal, que sobe junto com o teclado.

## Depois da auditoria
- `.xb-val` → `tval()` nos minutos do tempo de tela e nas horas de deitar e acordar.
- `.xb-op` → `.opt` com `radio()` na nota do almoço. O número fica dentro da opção.
- `.xb-lab` e o rótulo próprio do check-in → `.gl.in` em todas as folhas.
- `.xb-note` → `.foot` (`.foot.c` na última pesagem). `.xb-nums` → `.stats` no deslize.
- `.xb-qa` e `.xb-q` → `.qa` e `.q` da base, maiores na folha. "Outro" usa `.q.more`. Os botões da água também usam `.q`.
- Linhas do tempo de tela → `li()` dentro de `lg()`. O − das listas usa a classe `hit` no lugar do `::after` próprio.
- Letras do teclado numérico: 10 px → 11 px.
- Fundo das folhas: o Hoje novo (`weekCard`, `fold`, `doPill`), sem avatar e sem cartão da fase. Feitos hoje: 6h58 = 2, 7h04 = 3, 12h41 e 13h05 = 4, 15h20 e 16h10 = 5. À noite, o fundo é o Hoje da noite, com o check-in no topo.
- Acordei às: a folha virou "Deitar e acordar". Pergunta o deitar de ontem (22h15) e o acordar de hoje (6h52), e cada linha mostra se conta como feito. Um botão só: "Salvar 22h15 e 6h52".
- Acordei às: a roda própria saiu. Cada horário é um `tval()` que abre o `<input type="time">` nativo, como pede gestos-e-feedback.md. O ponto da roda em "Fica para decidir" está resolvido.
- Check-in: abre pelo rostinho tocado no cartão do Hoje, com o humor já marcado (está na nota). São 3 toques até salvar: rosto, energia e Salvar.
- Glossário: "conta como cumprido" → "conta como feito"; "lançar" → "registrar"; "Telas hoje" → "Tempo de tela"; horários das listas e dos botões em "7h10", "6h52".
- Peso: a folha usa o pilar Alimentação (sálvia), e o teclado é o decimal, com a vírgula (gestos-e-feedback.md). A vírgula automática saiu. Abre pela linha Peso da manhã ou pelo Progresso. São 6 toques: abrir, 8, 3, vírgula, 6 e Salvar.
- Teclado aberto (Check-in e Peso): o botão principal fica preso acima do teclado, e o meio da folha rola.
- Listas do dia (proteína e água): o registro mais recente fica no topo, como em comunicacao.md.
