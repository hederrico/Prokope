# Revisão · Jornada

## Jornada
**O que mudou**
- Quem abria a aba pela primeira vez não via a diferença para Progresso → subtítulo "Seu plano em fases, desde 21 de setembro." e, no topo, a data do dia, como no Hoje e no Progresso. O avatar saiu (fica só no Hoje).
- O cartão da fase 2 listava Zero refrigerante e Peso e cintura, que vêm da fase 1 (visão) → só os 5 hábitos que a fase 2 trouxe, mais "Os 7 hábitos da fase 1 continuam com você."
- A semana 2 aparecia sem número, mas o Hoje mostra 76% → "semana 2 · 76%".
- "A partir de 2 nov" fazia a data parecer fixa → "Pode começar em 2 nov", porque o início depende da escolha na revisão.
- Só a fase 1 tinha seta → seta também nas fases 3 e 4 (abre o que entra na fase).
- As legendas sobre o fundo tingido usavam `--text-3` (4,3:1) → `--text-2`.

**Fica para decidir**
- A cor das fases. Hoje cada fase usa a cor do pilar a que mais se dedica (fase 2 sálvia, fase 3 damasco). Com outros pilares, essa regra pode não funcionar. Proposta: a cor do pilar com mais hábitos novos na fase e, sem maioria, a primária. A auditoria transversal sugere usar a primária em tudo.
- O destino das setas: a fase concluída abre o Progresso no período da fase, e a revisão passada abre as 3 telas só para leitura. Essas telas não foram desenhadas.
- Primeiro dia (fase 1, semana 1): no lugar das revisões, "A primeira revisão é no domingo, 27 set."

## Plano de corrida
**O que mudou**
- A tela só mostrava o plano, sem nada para fazer antes da fase 3 → linha "Dias de treino · Seg e qua · 7h10". Ela alimenta o Hoje e o primeiro treino da tela Fase desbloqueada.
- "Começa na fase 3, em 2 de novembro" → "Entra no seu dia junto com a fase 3."
- A lista dizia "8×" e o treino dizia "8 ×" → "8 × (1 + 1,5)" nos dois.

**Fica para decidir**
- "Seg e qua" é um dado novo na história (antes só existia "segunda, 7h10"). Escolhi dias que alternam com a academia e ficam longe do futebol de quinta.

## Corrida em andamento
**O que mudou**
- A nota prometia vibração 5 s antes da troca, e o Safari não vibra → som curto opcional (alto-falante de 44 px no topo) e contagem 3, 2, 1 no número grande.
- "0:42 de 1:00" mostrava o tempo que passou → "0:18 faltam" em 92 px, com o anel enchendo até a troca.
- Trote e caminhada só se distinguiam por uma palavra de 18 px → palavra de 44 px com ícone, e a tela inteira muda de cor: trote em damasco cheio com texto claro (cerca de 5:1 no claro) e caminhada em tom claro. Dá para perceber de canto de olho, ao sol.
- O X no topo burlava o toque longo de Encerrar → saiu. O botão agora diz "Segure para encerrar".
- Indicador "Tela acesa" (Wake Lock). Botões de 76 → 80 px. "Próximo" em 15 px → "Depois: caminhada 1:30" em 17 px.
- O tempo total foi conferido com os blocos: 10:42 (5 min de aquecimento + 2 intervalos de 2,5 min + 0:42). O SPEC diz 9:42.

**Fica para decidir**
- A tela "Treino feito" (tempo, "treino 1 de 2 da semana", "Voltar ao dia") e a linha "Corrida · semana 1, treino 1 · Começar" no Hoje da fase 3. Ficaram de fora pelo limite de 2 telas novas.
- Encerrar no meio conta como feito? Proposta: conta a partir de 20 min. Abaixo disso, a tela pergunta "Contar como treino?", com as duas respostas no mesmo peso.
- Minimizar para usar o app durante o treino, com uma faixa no Hoje. Pesa contra: mais um estado para manter.
- Testar no iPhone: `navigator.audioSession.type = 'transient'` (Safari 17+), para o bipe abaixar a música em vez de pará-la, e o comportamento com o modo silencioso. O Wake Lock no app instalado só funciona a partir do iOS 18.4. Antes disso, o chip vira "A tela pode apagar", com a dica do Bloqueio automático.
- No escuro, o trote usa um damasco profundo (`oklch(38% .07 60)`), fora dos tokens, para não ofuscar. Pesa contra: a diferença para a caminhada fica menor que no claro.

## Corrida · de volta ao app (nova)
**O que mudou**
- Faltava o caso da tela bloqueada ou da troca de app: o PWA para de rodar e não avisa. O tempo vem do relógio (hora de início + pausas), então o treino segue certo. Na volta, um aviso diz em que parte o treino está e há quanto tempo foi a troca, e some em 5 s. A tela também mostra o estado de caminhada, para comparar com o trote.

## Revisão · 1 de 3
**O que mudou**
- "Caminhada" → "Caminhada com o cachorro", o mesmo nome do Hoje.
- O anel dizia só "constância", e a tela 3 usa o mesmo 78% para a fase → "na semana".
- Não havia volta entre os passos, e o app instalado não tem o botão voltar do navegador → ‹ nos passos 2 e 3. O X ganhou área de toque de 44.
- A nota agora diz como se chega (convite do Hoje no domingo) e o que o X faz: guarda o que foi feito, e o Hoje mostra "Continuar revisão".

**Fica para decidir**
- Até quando a revisão fica aberta. Proposta: até terça. Depois disso, o convite some sem aviso e a fase segue como está.
- Nas semanas do meio da fase (como 25 out) não há convite. A revisão tem 2 passos e termina com "Boa semana".

## Revisão · 2 de 3
**O que mudou**
- Não dava para pular → "Tudo nesta tela é opcional." abaixo do botão. Continuar com os campos vazios funciona como pular.
- O ajuste não dizia para onde ia → "Aparece no Hoje como lembrete durante a semana."
- Os dias do programa a dois não tinham data → "Sáb 7", com 52 px de altura.

**Fica para decidir**
- O programa a dois é um hábito da fase 4, mas a visão põe o planejamento dele na revisão. Proposta: o bloco só aparece com o hábito ativo. A mesma regra vale para a cintura em outra conta.

## Revisão · 3 de 3
**O que mudou**
- Eram dois botões de contorno iguais que não diziam o que acontece → duas opções do mesmo tamanho e estilo, cada uma com a consequência: "Os 4 hábitos entram amanhã, 2 nov." e "A fase 2 segue até 8 nov."
- Abaixo de 70% de constância, "Ficar mais uma semana" vem primeiro e o texto sugere firmar a fase (está na nota).

**Fica para decidir**
- Um terceiro caminho, "Escolher quais entram" (por exemplo, só a corrida). Combina com "poucos hábitos por vez". Pesa contra: quebra o peso igual entre as duas opções e acrescenta uma decisão ao domingo.

## Fase desbloqueada
**O que mudou**
- 30 confetes espalhados pela tela pesavam → 18, menores e mais espaçados.
- O texto só falava do que vem → começa pelo que foi feito ("A fase 2 fechou com 78%.") e cita os 4 hábitos novos.
- A nota diz o que acontece depois: "Ver meu dia" volta ao Hoje de domingo, que ganha o cartão "Amanhã começa a fase 3".

**Fica para decidir**
- O app não manda notificação, então o treino de segunda às 7h10 depende de um alarme. Proposta: o cartão do treino ganha "Criar alarme", que abre o guia de Lembretes já com 7h10 (grupo F).

## Revisão · mais uma semana (nova)
**O que mudou**
- A escolha "Ficar" não tinha final. Agora tem um, com o mesmo cuidado da celebração e sem confete: mostra a nova data da fase 2 (8 nov), o ajuste da semana e quando o convite volta.

## Pedidos para a base
- `.xbtn` com área de toque de 44 sem mudar o desenho: `.xbtn { position: relative; } .xbtn::after { content: ""; position: absolute; inset: -6px; }`. Por enquanto está só em `.xd-rvtop`.
- Um helper `stepTop(step, total, { back, close })` para as telas cheias com passos (revisão e primeiro acesso), com ‹, barras e X. Hoje cada grupo faz o seu.
- `--on` sobre `--fill` dá 3,9:1 em Corpo (número da semana no plano, dias marcados). Seguir o ajuste de tokens proposto na auditoria transversal.

## Depois da auditoria
- Componentes da base no lugar dos próprios: `days()`, `stepTop()`, `.eyebrow`, `.foot`, `mbar()` e `tag()`. Saíram `.xd-days`, `.xd-rvtop`, `.xd-steps`, `.xd-eye`, `.xd-hint`, `.xd-fn`, `.xd-wbar`, `.xd-tag` e a área de toque própria do X.
- Fases na primária: o caminho da Jornada, o cartão da Revisão 3, a Fase desbloqueada e o Mais uma semana. Os hábitos listados dentro mantêm a cor do pilar, e o confete continua com as cores dos pilares.
- Ícone das fases: `path` (o mesmo da aba Jornada) no lugar de `sneaker-move`, que é de hábito.
- Corrida: "Minimizar" (`caret-down`) à esquerda do topo. O treino segue numa faixa no topo do Hoje, e Encerrar continua com toque longo.
- Tela nova "Treino feito": anel fechado com 30 min, intervalos, trote, caminhada, próximo treino e "Voltar ao dia".
- Tela nova "Editar fases" (`/jornada/fases`): sugestão aos 70%, as 4 fases com datas, hábitos e duração, e "Nova fase". A Jornada ganhou "Editar fases" no topo.
- Revisões passadas: a legenda "Cada revisão abre só para leitura." fica abaixo da lista.
- Cintura na Revisão 2: 94,5 cm hoje (exemplo) e "Semana passada: 94,8 cm", na série do Progresso.
- Glossário: "Revisões" → "Revisões da semana"; "Caminhada com o cachorro" e "7h10" já estavam.
- Entrada da revisão: as notas citam o cartão "Revisão da semana" do Hoje (domingo, a partir das 18h) e o "Continuar revisão". A proposta "até terça" deu lugar à regra do Hoje: o cartão fica até segunda à noite e depois a revisão segue na Jornada.
- Revisão 2: `days()` não mostra a data em cada dia, então ela foi para a legenda ("2 a 8 nov · 1 por semana").
