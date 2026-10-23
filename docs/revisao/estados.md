# Revisão · I · Estados e feedback

Arquivo `docs/telas/f-estados.js`, seção `estados`: 11 telas novas. As variações do Hoje usam as peças do Hoje que agora estão na base e seguem as Regras do Hoje do SPEC. Se o Hoje mudar, estas telas precisam acompanhar.

## Hoje · desfazer
**Resolve:** marcar o hábito errado não tinha volta, e a regra "toda ação tem Desfazer por 5 s" não tinha desenho.
**Aparece:** depois de qualquer registro de um toque: marcar, somar proteína ou água, nota, deslize, "Hoje não se aplica" e encerrar a pausa.
**Some:** o fio esvazia em 5 s e o toast desce. Também some se a pessoa arrastar para baixo ou fizer outra ação: o toast novo substitui o anterior e confirma a ação de antes. Com o dedo sobre o toast, o tempo para.
**Decisões**
- No claro, o toast é escuro. No escuro, é um cinza elevado com contorno. Assim ele se destaca dos cartões brancos e não acende a tela à noite.
- O toast mostra o que foi feito ("3 de 7 na semana"). Ele fica acima da barra de abas, ao alcance do polegar.
- Quando a caminhada é marcada, o convite gentil da linha troca a frase por "De volta hoje." e sai na próxima arrumação do Hoje, como em `docs/interacao/telas/hoje.md`.

**Fica para decidir**
- Agrupar registros em sequência ("3 registros · Desfazer")? Contra: desfazer o bloco apaga também o que estava certo.

## Hoje · outro dia
**Resolve:** esquecer de marcar ontem não tinha caminho.
**Aparece:** ao tocar num dia que já passou na semana do topo. Os dias futuros não respondem.
**Some:** com "Voltar para hoje", com um toque no dia de hoje na semana ou na aba Hoje. Ao reabrir, o app volta sempre para hoje.
**Decisões**
- A faixa ocupa o lugar da saudação, então o primeiro olhar já mostra o dia. Na semana, o dia escolhido ganha fundo e contorno, e o rótulo de hoje continua na cor primária.
- A saída fica numa pílula acima das abas, ao alcance do polegar.
- O toast diz o dia ("Caminhada marcada na quarta").
- A caminhada aparece como "sem registro · dá para marcar". Ao marcar, o anel do dia, a constância e a força são recalculados, e o convite gentil de hoje some, porque ontem deixou de ser um dia sem caminhada.
- Os botões rápidos de proteína somem num dia passado: a linha mostra o total e abre a folha daquele dia. Assim ninguém soma no dia errado.

**Fica para decidir**
- Até quando dá para corrigir? Proposta: a semana atual e a anterior (arrastando a semana do topo), e o resto pelo heatmap do hábito. Contra: quem volta de uma pausa longa pode querer ir mais para trás.

## Menu do hábito
**Resolve:** não havia lugar para "Hoje não se aplica", para corrigir um horário nem para abrir o hábito sem sair do Hoje.
**Aparece:** com um toque longo (cerca de 0,5 s) numa linha do Hoje. No computador, com o clique direito ou com o "⋯" que aparece sob o mouse.
**Some:** com o X, com um toque fora, arrastando para baixo ou ao escolher uma opção.
**Decisões**
- Escolhi a folha baixa em vez do menu de contexto, por três motivos:
  - Ela fica sempre no terço de baixo, qualquer que seja a altura da linha tocada.
  - É o mesmo componente das outras folhas.
  - No Safari, o toque longo já abre a lupa e o menu de texto, que precisam ser desligados nas linhas (`-webkit-touch-callout: none`, `user-select: none`).
- Primeiro vem o que muda hoje (Registrar outro horário, Hoje não se aplica), depois o que navega (Ver hábito, Editar hábito). Só as opções que navegam têm seta.
- "Hoje não se aplica" vale na hora, sem confirmação, e tem Desfazer. A linha fica no lugar, em `text-3`, com "não conta hoje", e só vai para o fim do grupo na próxima vez que o Hoje aparece (`docs/interacao/estados.md`).
- "Registrar outro horário" só existe em hábitos de horário e abre a folha "Acordei às" direto na roda.

**Fica para decidir**
- Limitar o "Hoje não se aplica" por semana? Sem limite, ele pode esconder dias. Proposta: sem limite, e o detalhe do hábito mostra quantos dias saíram da conta. Contra: esse número pode soar como cobrança.

## Hoje · primeiro dia
**Resolve:** no primeiro dia, o Hoje seria um painel de zeros (anel 0/12, "0 de 2", bolinhas apagadas).
**Aparece:** no primeiro dia da fase 1, logo depois do primeiro acesso.
**Some:** o convite some no primeiro registro. A semana passa a ter anel só a partir do dia de início. Quem começa numa quinta vê os dias anteriores só com o número.
**Decisões**
- O cartão da semana diz "Primeiro dia da fase 1" no lugar de "x de 12 feitos hoje".
- O convite fica dentro da linha do hábito mais provável para a hora e já traz o registro: de manhã, "Comece por aqui." com "Acordei às 06h58"; à noite, o check-in. Basta um toque.
- Os grupos ficam sem contagem, e a caminhada fica sem as bolinhas da semana.
- Os "dias sem" mostram "1 dia · contando desde ontem", porque a história começa em 20 set.

**Fica para decidir**
- O primeiro acesso (grupo A) não pergunta desde quando a pessoa está sem refrigerante ou sem Shorts. Sem essa pergunta, os "dias sem" começam no zero.

## Progresso · poucos dados
**Resolve:** sem 7 dias com o hábito e 7 sem, os padrões não existiam, e a seção sumiria ou pareceria quebrada.
**Aparece:** em "O que os seus dados mostram", enquanto nenhum padrão tem dias suficientes. A tela imagina o dia 24 de setembro, o quarto dia.
**Some:** cada padrão vira um insight normal ao chegar a 7 e 7. Quando já existe um insight pronto, o cartão tracejado sai e fica só a linha "Mais N padrões a caminho".
**Decisões**
- A constância e os pilares aparecem desde o primeiro dia. Só os padrões esperam.
- Aparece só o padrão mais perto de ficar pronto, com o texto do pedido e duas barrinhas de 7.
- O cartão tem borda tracejada, a forma de "futuro" do heatmap, e nenhuma cor de alerta.
- "Sem caminhada" fica em cinza, com "Os dias sem chegam no tempo deles. Não precisa mudar nada.", para ninguém pular um dia de propósito.

**Fica para decidir**
- Num hábito de 6 de 7, juntar 7 dias sem leva cerca de 7 semanas. Aceitar 5 e 5, com "ainda são poucos dias"? Contra: muda a regra do design system e enfraquece a comparação.

## Hoje · sem internet
**Resolve:** no passeio o sinal cai. Sem aviso, a pessoa não sabe se o toque valeu. Com um aviso alarmante, ela desconfia do app.
**Aparece:** quando a conexão cai por mais de 3 s, para não piscar num túnel.
**Some:** quando a conexão volta e o que estava pendente sobe, o aviso vira "Tudo em dia", com a nuvem e o check, por 2 s.
**Decisões**
- O aviso fica abaixo do cabeçalho e é neutro (fundo rebaixado), sem amarelo e sem ícone de alerta. Os itens não ganham marcas.
- Nada fica desabilitado, porque o Firestore com cache offline já grava no aparelho.
- O que precisa de internet (entrar, atualizar a versão, exportar) avisa no próprio lugar, na hora do toque.

**Fica para decidir**
- Depois de mais de 1 dia sem conexão, avisar que o outro aparelho (o PC) ainda não vê os registros? Contra: é mais um aviso.

## Hoje · carregando
**Resolve:** num aparelho novo, sem cache, o Hoje ficaria em branco ou com anéis vazios, que parecem "nada feito".
**Aparece:** só sem cache local (primeiro acesso no aparelho ou depois de sair da conta) e só se a espera passar de 300 ms.
**Some:** o esqueleto dá lugar ao Hoje de uma vez, com um esmaecimento curto. Depois de 8 s, aparece embaixo "Está demorando. Confira a internet.", e o esqueleto continua.
**Decisões**
- A data, a saudação e os números da semana vêm do aparelho e da conta. Só a lista espera.
- Na semana, os dias viram círculos cheios e suaves, diferentes do trilho do anel, para não parecerem dias sem nada feito.
- As formas ficam paradas, sem brilho correndo. O movimento fica para a próxima tarefa.

## Hoje · pausado
**Resolve:** com a lista inteira à vista, a pausa cobraria o que a pessoa decidiu não fazer.
**Aparece:** em todos os dias de uma pausa do app inteiro.
- A tela imagina o domingo, 27 de dezembro. O pedido dizia "domingo, 28", mas o dia 28 cai numa segunda (24 dez de 2026 é uma quinta).
- O grupo F também usou o dia 27.

**Some:** no dia da volta (domingo, 3 jan), o Hoje normal retorna sozinho. "Encerrar a pausa" encerra na hora e tem Desfazer. Os dias que já passaram continuam fora da conta.
**Decisões**
- A semana hachura os dias pausados, como no heatmap, e o dia de hoje ganha contorno na cor primária.
- O centro é calmo: "Pausa até 2 de janeiro", o motivo num selo, o que a pausa protege e quando tudo volta, incluindo a revisão da semana.
- "Registrar algo, se quiser" fica recolhido perto do polegar e abre a lista do dia sem metas nem contagens.
  - O registro fica no histórico, e o dia continua fora da conta.
  - Isso responde à pergunta do grupo F.
- "Encerrar a pausa" é um botão de texto: é uma ação rara e não deve competir com o registro.
- Os "dias sem" ficam parados, como o grupo F decidiu, e não aparecem aqui.

## Instalar no iPhone
**Resolve:** no Safari, o app não abre em tela cheia e o login com Google não funciona tão bem quanto no app instalado. Além disso, o app instalado guarda o login separado do Safari.
**Aparece:** no lugar da tela de entrada, quando o Prokopē abre no Safari do iPhone fora da Tela de Início (`navigator.standalone` falso).
**Some:** ao abrir pelo ícone, ela nunca aparece. "Agora não" leva à tela de entrada, e a tela só volta depois de 7 dias.
**Decisões**
- A barra do Safari está desenhada embaixo, com um anel no botão de compartilhar. O passo 1 diz "aqui embaixo" e lembra do ⋯, onde o iOS mais novo pode esconder o Compartilhar.
- O passo 3 avisa que a aba pode ser fechada.
- O domínio prokope.web.app é só ilustrativo.

**Fica para decidir**
- Conferir num iPhone com o iOS atual os nomes exatos dos botões e se existe o interruptor "Abrir como App Web".

## Conta sem acesso
**Resolve:** uma conta Google fora da lista cairia num erro de permissão do Firebase ou num Hoje vazio.
**Aparece:** depois do login com Google, quando o e-mail não está na lista de contas liberadas.
**Some:** "Entrar com outra conta" sai da conta e abre o seletor do Google. Quando o dono libera o e-mail, o próximo login leva ao primeiro acesso.
**Decisões**
- O tom é de boas-vindas: mão acenando, sem cadeado e sem vermelho.
- O e-mail fica à vista, porque o caso mais comum é ter escolhido a conta errada.
- "Copiar o e-mail" ajuda a pedir acesso por mensagem. O `mailto:` é instável no app instalado.
- "Nada desta conta foi guardado." responde à dúvida sobre privacidade.

**Fica para decidir**
- Onde fica a lista de contas liberadas: num documento do Firestore que o dono edita ou numa configuração do deploy. Contra a primeira opção: exige uma tela de administração para duas contas.

## Nova versão pronta
**Resolve:** sem aviso, o PWA pode passar dias numa versão velha. Recarregar sozinho poderia perder o que a pessoa estava digitando.
**Aparece:** quando a versão nova está pronta e o Hoje está parado: sem folha aberta, sem campo em edição e pelo menos 5 s depois do último toque.
**Some:** "Atualizar" recarrega na mesma tela. Ignorado, o toast fica até a pessoa arrastar para baixo, e a versão nova entra na próxima vez que o app abrir do zero.
**Decisões**
- É o mesmo toast do Desfazer, sem fio e com o botão cheio, porque é a única ação.
- Nunca aparece junto com um Desfazer: o Desfazer tem prioridade, e o aviso espera.

## Pedidos para a base
- **Botão do `toast()`:** ele usa a classe `.tb`, a mesma da barra de abas, e herda o fundo e o fio de cima (o Desfazer fica claro sobre claro). Trocar a classe na base para `.tact` ou acrescentar `.toast .tb { background: transparent; border-top: 0; z-index: auto; }`. Por enquanto, corrigi no meu arquivo.
- **`week()`** deveria aceitar um estado por dia: escolhido, sem anel, pausado (hachura) e carregando. Por enquanto, estes estados estão em `wk()`, no meu arquivo.
- **Bloco de esqueleto comum**, em `var(--track)` e sem animação, para as outras telas que carregam (Progresso, Jornada).

## Para outros grupos acompanharem
- **Hoje:**
  - O convite gentil sai quando a caminhada é marcada e some se ontem for corrigido.
  - As linhas precisam aceitar o toque longo e ter o estado "não conta hoje".
  - Um toque num dia passado da semana abre o Outro dia.
- **Ajustes 2 (F):** o "Pausar · em pausa" usa "Voltar hoje". No Hoje, esse texto se confunde com o "Voltar para hoje" do Outro dia. Sugiro "Encerrar a pausa" lá também.
- **Entrada (A):** a tela de entrada ganha duas vizinhas: Instalar no iPhone (antes dela, no Safari) e Conta sem acesso (depois do Google).
- **Registros (B):** o Desfazer depois das folhas é o toast deste grupo, por exemplo "Whey +22 g" com "46 de 80 g". O "Registrar outro horário" abre a folha Acordei às já na roda.
- **Hábito e Progresso (C):** o insight do detalhe do hábito precisa do mesmo estado de poucos dados.

## Depois da auditoria
- As cópias do Hoje viraram `morning()` e `afternoon()` com `weekCard`, `fold`, `doPill`, `plusBtn`, `addPill`, `semTile` e as classes `.qa`, `.q`, `.nudge` e `.dsr` da base, sem avatar e sem cartão da fase.
- "Dar nota" entrou no lugar do `r5()`. No Outro dia, a nota dada aparece na pílula ("3 · Ok", "4 · Bom").
- De manhã, a Noite fica recolhida e a água marca 0 de 3 L às 7h42. Os limites da semana e os dias sem foram para o fim.
- Contagens pela regra do Hoje: 3 de 12 no Menu do hábito (7h42), 4 de 12 no Desfazer, no Sem internet e na Nova versão, e "7 de 12 feitos na quarta" no Outro dia.
- O convite gentil fica dentro da linha da caminhada (Menu do hábito). No Desfazer, ele mostra "De volta hoje." e sai na próxima arrumação, como no Hoje.
- O toast é o `toast()` da base, e a extensão `.xs-toast` saiu. A colisão da classe `.tb` está corrigida no meu arquivo (veja Pedidos para a base).
- Botões com altura fixa de 44 px agora usam `min-height` (Voltar para hoje, barra do Safari).
- Menu do hábito: "Ver hábito" fica como segundo caminho, e a nota diz isso.
- Pausado: a data continua domingo, 27 de dezembro. "Registrar algo, se quiser" virou um `fold()`, e o selo "Férias" virou `tag()`.
- Primeiro dia: o cartão solto do convite saiu. O convite foi para a linha do Acordar, o cartão da semana diz "Primeiro dia da fase 1" e os dias sem usam `semTile` ("1 dia sem").
- Progresso · poucos dados: o cabeçalho segue o novo Progresso (setas de período e chips com os pilares) e usa `ch()` e `mbar()` da base.
- Sem internet: o aviso desceu para baixo do cabeçalho, com o texto de `docs/interacao/estados.md`. A volta da conexão diz "Tudo em dia".
- Carregando: a espera antes de mostrar o esqueleto é de 300 ms. A tela ficou sem avatar e com o cabeçalho do cartão da semana em esqueleto.
- Instalar: "Continuar no navegador" virou "Agora não", e a tela volta só depois de 7 dias.
- Nova versão: o toast fica até ser dispensado, como em `gestos-e-feedback.md`. Antes, ele sumia em 8 s.
- Conta sem acesso: a inicial do e-mail não usa mais `.avatar`.
- Primeiro dia: os dias seguintes da semana voltaram a ser vazados, como em `docs/interacao/estados.md`. Só os dias antes do começo ficam sem anel.
- Progresso · poucos dados: o topo copia o atual de `f-habito-progresso.js` (seletor "‹ período ›", com as duas setas desligadas na primeira semana, e chips Visão geral, Humor, Medidas e um por pilar).
- "Hoje não se aplica": o estado da linha se chama "não conta hoje". A linha fica no lugar e só vai para o fim do grupo na próxima vez que o Hoje aparece.
