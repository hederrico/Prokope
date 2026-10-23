# Telas do Prokopē · especificação para quem desenha

O quadro é aberto em `docs/telas/index.html`. Cada grupo de telas fica num arquivo `f-*.js` próprio, que chama `addFrame()` usando os helpers de `base.js` e as classes de `base.css`. **Não edite `base.css`, `base.js`, `index.html`, `f-hoje.js` nem o arquivo de outro grupo.** Se precisar de um estilo novo, use `addCSS()` dentro do seu arquivo, com um prefixo de classe próprio (indicado no seu grupo).

## Antes de começar

1. Leia `base.css` e `base.js` inteiros: os comentários documentam cada helper (`phone`, `sheet`, `hd`, `nb`, `gl`, `hr`, `chk`, `vpill`, `dots`, `r5`, `slots`, `chip`, `btn`, `sw`, `seg`, `fld`, `li`, `lg`, `ring`, `ringBox`, `week`, `pbar`, `heat`, `face`, `rf`, `ico`, `hueStyle`).
2. **Use os componentes da base antes de criar um seu.** Se um deles resolve, não recrie com o seu prefixo. Os helpers antigos ganharam só parâmetros opcionais, e nenhuma chamada existente quebra.

   | Componente | Helper ou classe | Substitui |
   |---|---|---|
   | Cartão da semana com o resumo do dia | `weekCard(feitos, pct, vals)` ou `week(vals, hoje, nums, head)` | `.xh-week`, cópias do Hoje antigo |
   | Momento recolhido | `fold(icons, mais, título, sub)` | `.xh-fold`, `.xh-icons` |
   | Controles à direita da linha | `doPill('Dar nota')`, `plusBtn()`, `addPill('500 ml')` | `.xh-do`, `.xh-plus`, `.xh-add`, `r5()` na linha |
   | Botões rápidos da proteína | classes `.qa` e `.q` (`.q.more` para "Mais") | `.xh-qa`, `.xb-qa` |
   | Dias sem em cartão | `semTile(p, ic, n, o quê, rec)` dentro de `.dsr` | `.xh-ds` |
   | Convite gentil na linha | classe `.nudge` com `.lk` | `.xh-nudge` |
   | Dias da semana | `days([0, 3], { p, single, label })` | `.xd-days`, `.xe-days`, `.xf-days` |
   | Horário ou data tocável | `tval('06:50', { off, raised })` | `.xf-tm`, `.xa-time`, `.xb-val` |
   | Topo de fluxo em passos | `stepTop(n, total, { back, close })` | `.xa-top`, `.xd-rvtop` |
   | Linha de adicionar | `addRow('Novo pilar')` | `.xa-add`, `.xe-new`, `.xb-q.other` |
   | Selo pequeno | `tag(texto, { p, icon, dot, up, lift })` | `.xc-tag`, `.xc-badge`, `.xc-delta`, `.xe-also`, `.xf-tag`, `.xa-sug`, `.xd-tag` |
   | Barra fina | `mbar(pct, grossa)` | `.xc-mbar`, `.xd-wbar` |
   | Limite da semana | `budget({ p, t, s, used, total })` | `budget()` local de cada arquivo |
   | Cabeçalho de cartão | `ch(título, legenda, direita)` | `.xc-ch`, `.xa-ch` |
   | Opção com rádio | classe `.opt` com `radio(on)` | `.xa-opt`, `.xb-op` |
   | Aviso com Desfazer | `toast('Caminhada marcada')` ou `toast({ p, ic, t, s, act, fio, fill, low })` | `.xs-toast` |
   | Legenda do heatmap | `heatKey([['d', 'Feito'], ['p', 'Parcial'], ...])` | `.xc-lg` do heatmap |
   | Textos de apoio | `.eyebrow`, `.lead`, `.foot` (`.foot.c` centralizada), `.gl.in` (rótulo dentro de folha) | `.xa-ey`, `.xd-eye`, `.xa-lead`, `.xf-lead`, `.xf-foot`, `.xe-hint`, `.xb-note`, `.xb-lab` |
   | Números lado a lado | classe `.stats` com `.k` e `.stat` | `.xc-3`, `.xb-nums` |
   | Perfil | classe `.profile` | `.xe-prof`, `.xf-prof` |
   | Estado vazio | classe `.empty` | `.xe-empty` |
   | Botão de atenção | `btn('Apagar tudo', { kind: 'warn' })` | `.xf-wbtn` |
   | Área de toque de 44 px | automática em `.chk`, `.xbtn`, `.ibtn`, `.chip`, `.vpill`, `.btn.sm`, `.dop`, `.addp`, `.tval` e nos botões da barra; nos seus controles, acrescente a classe `hit` | extensões próprias com `::after` |

   Para o leitor de tela, passe o nome quando o helper aceitar: `chk(false, 'Louça')`, `sw(true, 'Mente')`, `seg([...], 0, 'Período')`, `heat(estados, 'Desde 21 de setembro: 24 dias feitos')`. Na base, os ícones são decorativos (`aria-hidden`), e as folhas, abas, rostinhos e controles já saem com papel e nome.
3. Leia `f-hoje.js`. Ele é a referência de estilo: densidade, tom do texto, como compor cartões, listas e o cabeçalho. As peças dele agora estão na base (tabela acima).
4. O app é para iPhone: celular de 390 × 844 (`phone({...})`). Uma tela com rolagem pode ser mostrada inteira com `tall: true`. A tela do computador usa `phone({ cls: 'desk', ... })` e `addFrame(..., { desk: true })`.
5. Altura de botão e de controle com texto se ajusta com `min-height`, nunca com `height` (a letra pode crescer). A base já usa `min-height` no `.btn`.

## A história (dados ilustrativos, iguais em todas as telas)

- Hoje é **quinta, 22 de outubro de 2026**. O usuário é o **Henrique** (a inicial "H" aparece só no cartão de perfil de Ajustes). Ele tem um dachshund: o ícone de cachorro é sempre `ico('salsicha')`. Não use o nome da esposa nem do cachorro.
- **Fases:**
  - Fase 1 · Base: 21 set – 11 out, fechou com 81%.
  - Fase 2 · Alimentação: 12 out – 1 nov. **Agora é a semana 2 de 3.**
  - Fase 3 · Movimento: a partir de 2 nov.
  - Fase 4 · Profundidade: a partir de 23 nov.
- **Pilares e cores:** Mente (`mente`, lavanda), Alimentação (`alim`, sálvia), Corpo (`corpo`, damasco), Família (`familia`, rosa). A cor primária do app é `accent`.
- **Hábitos ativos na fase 2, por pilar:**
  - **Mente:**
    - Acordar às 6h50 (hoje 06h52).
    - Telas desligadas às 21h.
    - Deitar às 22h.
    - Check-in às 20h30: humor, energia, 3 coisas boas, minutos de tela e de YouTube.
    - Sem Shorts e TikTok: 32 dias sem.
  - **Alimentação:**
    - Zero refrigerante: 12 dias sem (11 out – hoje), recorde 21 (20 set – 10 out), total 33.
    - Proteína: meta 80 g, subindo 10 g a cada 2 semanas até 110 g.
    - Água: meta 3 L.
    - Almoço e jantar com nota de 1 a 5.
    - Tranqueiras até 2 dias por semana.
    - Refeições livres até 2 por semana.
    - Peso diário e cintura semanal.
  - **Corpo:**
    - Futebol às quintas.
    - Caminhada com o cachorro, 20 min, meta 6 de 7. Quarta não rolou: 2 de 7 de manhã e 3 de 7 depois do passeio de hoje. Força do hábito em 72% e 24 caminhadas desde 21 set. O pilar principal dela é Família (a cor da linha e da tela), e ela conta também em Corpo.
  - **Família:**
    - Louça até 20h30.
    - Lixo e recicláveis nos dias de coleta (segunda e quinta), até 20h30.
    - Caminhada com o cachorro.
- **Fases futuras:**
  - Fase 3: academia do condomínio 2× por semana, corrida 2× por semana (plano de 13 semanas), YouTube até 60 min e meta de tempo de tela.
  - Fase 4: ritual do sono completo, momentos de silêncio, programa a dois e um pequeno gesto por dia.
- **Constância desta semana:** 76% no total. Família 88%, Mente 82%, Corpo 71%, Alimentação 64%.
- **Check-in típico:** humor 4 ("Bem") e energia 3 ("Ok").
- **Proteína ao longo do dia:**
  - 07h10: ovo × 3 (18 g) e leite (6 g).
  - 10h30: whey (22 g).
  - Total de 46 g às 12h41 e 86 g à noite.
- **Botões de proteína:** Ovo 6 g, Queijo 5 g, Feijão 7 g, Leite 6 g, Whey 22 g, Iogurte 10 g, Frango 30 g.
- **Água:** 1,5 L às 15h20.
- **Peso e cintura:** use só números de exemplo e diga isso na nota da tela (ex.: tendência de −1,1 kg em 3 semanas, com pesos perto de 84 kg).

## Regras de texto e visual

- Português do Brasil com acentos corretos. Frases curtas e diretas, voz ativa. Nada de travessão para aparte, nada de "não X, mas Y", nada de emoji.
- Tom gentil: nada de vermelho, nada de "falhou", nada de "perdeu a sequência". Dia não feito é o trilho vazio. Deslize zera só a contagem atual, e o recorde fica guardado.
- Cor e forma juntas: nunca codifique um estado só pela cor.
- **Ícones:** só nomes que existem em `docs/telas/.ph-names.txt` (lista oficial do Phosphor 2.1.1), mais `salsicha`. Duotone nos ícones de hábito e pilar, regular ou bold em controles, fill na aba ativa.
- **Rostinhos de humor e energia:** sempre `rf()` ou `face()`, na cor primária.
- **Números que mudam** (gramas, litros, minutos, contadores) usam a fonte da interface com `num`. A serifa (classes `lt`, `ttl2`, `ttl3`, `disp`, `disp-num`) fica para títulos e números grandes parados.
- **Notas da tela** (a frase abaixo de cada celular): uma ou duas frases dizendo o que a tela resolve ou uma decisão de interação. Não descreva o que dá para ver.
- **Cor de pilar só vale para pilar e hábito.** Itens de Ajustes, fases, Jornada e revisão usam bolha neutra ou a primária (`accent`).
- **Estado com forma e cor:** feito é cheio, parcial é meio cheio (o heatmap da base já faz assim), dia marcado tem check, selecionado tem contorno e palavra em negrito.
- **Nota de 1 a 5:** `r5()` só para leitura (Progresso). Na linha do Hoje, `doPill('Dar nota')` abre a folha da nota.
- **Horário no texto:** "6h52", sem zero à esquerda. "06:50" só dentro de um seletor de horário (`tval()`).
- **Termos:** use o glossário em [`docs/revisao/transversal.md`](../revisao/transversal.md#glossário): constância, força do hábito, deslize, meta, feito, registrar, marcar, Desfazer, dias sem, limite por semana, Revisão da semana, 3 coisas boas, tempo de tela e arquivar. Nome de hábito sem o horário: "Acordar", com "meta 6h50" na linha de baixo.
- **Movimento:** os tokens de `docs/interacao/movimento.md` estão em `base.css` (`--dur-press`, `--dur-micro`, `--dur-base`, `--dur-fill`, `--dur-ring`, `--dur-glow`, `--ease-out`, `--ease-in-out`, `--ease-exit`, `--ease-spring`, `--rise`, `--press-scale`). Com movimento reduzido (o do iPhone ou "Animações" desligado, que põe `data-motion="off"` no html), eles já mudam sozinhos: use os tokens e não escreva durações à mão.

## Regras de navegação

Todo lugar tem caminho de ida e de volta, e a volta é sempre um botão visível: o app instalado no iPhone não tem o voltar do navegador.

| Tipo | Quando | Topo | Como volta | Barra de abas |
|---|---|---|---|---|
| Aba | Hoje, Progresso, Jornada, Ajustes | `hd()`: contexto + título na serifa 32, sem avatar | não volta | visível |
| Tela empurrada | detalhe de hábito, plano de corrida, páginas de Ajustes | `nb({ back: 'Origem' })` | "‹ Origem" à esquerda | visível, na aba de origem |
| Folha | registro rápido, confirmação curta | `sheet()`: alça + título na serifa 24 + X | X, arrastar para baixo ou tocar no fundo | coberta |
| Formulário modal | criar ou editar pilar e hábito | `nb({ left: 'Cancelar', act: 'Criar' })` ("Salvar" ao editar) | Cancelar | escondida |
| Tela cheia | corrida, revisão, primeiro acesso, celebração | `stepTop(n, total, { back, close })` | voltar entre passos; X sai e guarda o que foi feito | escondida |

- Com título na serifa logo abaixo, a barra da tela empurrada fica só com o voltar, sem repetir o título.
- Adicionar é uma linha tracejada `addRow()` no fim da lista. Em lista longa, o "+" na barra fica também.
- Na corrida, o X vira "Minimizar" (`caret-down`): o treino segue numa faixa no Hoje. Encerrar continua com toque longo.
- O hábito abre como tela empurrada em qualquer aba, e o voltar diz de onde veio ("‹ Hoje", "‹ Progresso").
- No PC, a folha vira um painel à direita de 420 px, e a tela empurrada ocupa a área principal com o voltar.

## Regras do Hoje

Valem para toda tela que mostra o Hoje (o fundo das folhas de B, os Estados de I e o Computador de A). Detalhes em [`docs/revisao/hoje.md`](../revisao/hoje.md).

- **Toque:** o controle à direita registra. O círculo marca, a pílula ("Dar nota") abre a folha do registro, o "+" usa um do limite, e os botões de proteína e água somam na hora, com Desfazer. O ícone ou o nome abre o hábito. O toque longo abre o menu do hábito.
- **"x de 12 feitos hoje":** contam os hábitos de marcar e os dias sem (enquanto não há deslize). Proteína, água, limites da semana e peso ficam fora. Na quinta: 7h42 = 3, 12h41 = 4, 15h20 = 5, 20h34 = 8, 20h36 = 9, 21h04 = 11.
- **Topo:** sem avatar e sem cartão da fase. `weekCard()` traz "3 de 12 feitos hoje" e "76% na semana ›", que abre o Progresso. Tocar num dia abre aquele dia.
- **Recolher:** um momento do dia ainda distante (a Noite antes das 18h) ou já completo vira uma linha `fold()`, que abre no lugar. A partir das 20h30, a tela se divide em Ainda hoje e Feitos hoje.
- **Convite gentil:** no máximo um por dia, dentro da linha do hábito que ficou sem registro ontem (`.nudge`), com "Marcar ontem". Nunca um cartão solto no topo.
- **Nota de refeição:** a linha mostra "Dar nota" (e "4 · Bom" depois) e abre a folha da nota.
- **Deitar:** é marcado na manhã seguinte, junto com o acordar, para o celular não voltar à mão depois das 21h.
- **Limite cheio:** fica neutro, com "2 de 2 · a semana recomeça amanhã", e o "+" continua disponível.
- **Ordem:** Manhã, Ao longo do dia e Noite. No fim, o que não tem hora: Limites da semana e Dias sem (`semTile()`).

## Decisões tomadas

Tomadas durante a revisão e confirmadas pelo Henrique em 22 de outubro de 2026, junto com as respostas às perguntas em aberto.

- **Fases usam a primária.** Nenhuma fase usa cor de pilar (Jornada, Revisão 3 de 3, Fase desbloqueada).
- **Toque na linha do hábito:** o controle da direita registra, o resto da linha abre o detalhe e o toque longo abre o menu do hábito.
- **Revisões passadas ficam na Jornada.** "Semana passada" no Progresso abre a mesma revisão, só para leitura.
- **Fases sai de Ajustes.** A Jornada ganha "Editar jornada" (antes "Editar fases").
- **Avatar sai de todos os cabeçalhos.** O título já diz o nome, e a conta fica no cartão de perfil de Ajustes.
- **O cartão da fase saiu do Hoje.** O cartão da semana traz "3 de 12 feitos hoje" e "76% na semana ›", que abre o Progresso.
- **Cor de pilar só vale para pilar e hábito.** Os itens de Ajustes usam bolha neutra.
- **Tudo é configurável:** meta, mínimo que conta como parcial, horários e dias de cada hábito. Uma corrida encerrada no meio conta pelo que o hábito define.
- **Deslize sai do total:** o dia do deslize não entra no total de dias sem (33 → 32 na história).
- **O dia vira às 4h**, ajustável no perfil.
- **Pausa sempre tem data de volta**, que dá para estender.
- **Peso:** número do dia e média, com "Mostrar só a tendência" em Ajustes e um "ocultar valores" rápido no cartão.
- **Medições no primeiro acesso** (peso, cintura, tempo de tela) vêm desmarcadas no passo 2.
- **Revisão da semana:** dia e hora escolhidos pela pessoa; o convite fica até dois dias depois.
- **Convite de fase:** dois caminhos com o mesmo peso.
- **Sem servidor:** o convite do A dois é um link para compartilhar, e apagar os dados acontece na hora. Tudo no plano gratuito do Firebase.
- **Carinho recebido:** cartão discreto no topo do Hoje até o fim do dia.
- **Ajuste da semana:** linha no cartão da semana até a próxima revisão, que pergunta se funcionou.
- **Primeiro acesso depois das 20h:** a fase começa no dia seguinte.

## Como conferir

1. Sintaxe: `node --check docs/telas/<seu-arquivo>.js`.
2. Ícones: todo nome usado em `ico('...')` precisa estar em `.ph-names.txt` (ou ser `salsicha`).
3. Visual: tire no máximo duas capturas (claro e escuro) só das suas seções, com o Chrome headless. Use a pasta de rascunho indicada no seu pedido. Em `only=` vão os ids das suas seções, separados por vírgula:
   ```
   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1700,2600 --virtual-time-budget=8000 --screenshot="<rascunho>\<nome>.png" "file:///C:/Users/Henrique%20Derrico/Desktop/Novo%20eu/docs/telas/index.html?only=<secoes>&theme=light&zoom=1"
   ```
   Abra a imagem e corrija o que estiver cortado, sobreposto ou ilegível. Depois disso, pare.

## Grupos

### Grupo A · `f-entrada.js` · seções `entrada` e `computador` · prefixo CSS `.xa-`

1. **Entrar** (7:02). Centro da tela:
   - uma ilustração em SVG de um caminho sinuoso, tracejado, com 4 pontos nas cores dos pilares e um trecho percorrido na cor primária;
   - "Prokopē" grande na serifa, com "προκοπή" em itálico na cor primária;
   - a frase "Um pouco de progresso, todo dia."
   
   Embaixo: o botão "Entrar com Google" (`btn` tipo `s` com o ícone `google-logo`) e a legenda "Seus registros ficam na sua conta. Ninguém mais vê."
2. **Começar · 1 de 3**:
   - barra de progresso de 3 trechos no topo;
   - título "Como você quer começar?" e a frase "Dá para mudar tudo depois, em Ajustes.";
   - duas opções em cartão, com rádio:
     - "Com o plano base" (selecionada): 4 pilares e os hábitos da fase 1, com bolinhas dos pilares;
     - "Do zero": você cria pilares e hábitos, um de cada vez;
   - botão "Continuar".
3. **Seus pilares · 2 de 3**:
   - os 4 pilares em lista, cada um com ícone, nome, uma descrição curta e um interruptor ligado:
     - Mente: sono, telas, silêncio, gratidão;
     - Alimentação: refeições, proteína, água;
     - Corpo: movimento, academia, corrida;
     - Família: casa, cachorro, tempo a dois;
   - uma linha tracejada "Criar outro pilar";
   - botão "Continuar".
4. **Sua rotina · 3 de 3**:
   - os horários: acordar 06:50, telas desligadas 21:00, deitar 22:00, check-in 20:30, revisão da semana no domingo;
   - um aviso em tom claro da primária: "No fim de semana, até 1h de diferença conta como cumprido.";
   - botão "Começar a fase 1", com a legenda "Fase 1 · Base · 7 hábitos".
5. **Computador · Hoje** (`addFrame('computador', ...)`, quadro de 1280 × 800):
   - barra lateral com a marca, as 4 seções (Hoje ativo) e a lista de pilares com bolinhas;
   - área principal com data e "Bom dia, Henrique", a semana com anéis e duas colunas:
     - à esquerda, os hábitos por momento do dia;
     - à direita, a proteína com barra e botões, a água com anel, o cartão do check-in e um insight.
   
   Na tela do computador não há barra de status nem indicador de início: monte o HTML do quadro sem `phone()`, usando uma `div` com as classes `phone desk`.

### Grupo B · `f-registros.js` · seção `registros` · prefixo `.xb-`

Todas estas telas são folhas sobre o Hoje: `phone({ body: <cabeçalho e semana do Hoje, como fundo>, overlay: sheet(...) })`.

1. **Proteína** (12:41):
   - "46 g de 80 g" em número grande e "faltam 34 g";
   - barra com os segmentos 18, 6 e 22 e a meta de 80;
   - grade de botões rápidos (os 7 alimentos e "Outro");
   - a lista de hoje: 07h10 ovo × 3 (18 g), 07h10 leite (6 g), 10h30 whey (22 g), com a legenda "Deslize para apagar".
2. **Água** (15:20):
   - anel grande com "1,5 L de 3 L";
   - dois botões grandes, "+ 500 ml" e "+ 1 L";
   - a lista de hoje (08h05 500 ml, 11h40 1 L);
   - a legenda "Meta de 3 L · editar em Ajustes".
3. **Acordei às** (6:58):
   - pergunta "Que horas você acordou?";
   - botão principal "Agora · 06h58";
   - uma roda de horário no estilo do iPhone, com horas e minutos e a faixa selecionada em 06 e 52;
   - a legenda "Meta 6h50 · até 15 min de diferença conta como cumprido";
   - botão "Usar 06h52".
4. **Nota do almoço** (13:05):
   - "Como foi o almoço?";
   - 5 opções grandes com número e palavra (1 Improvisado, 2 Fraco, 3 Ok, 4 Bom, 5 Completo), com a 4 selecionada na cor do pilar Alimentação;
   - "O prato tinha", com chips: Proteína, Salada ou legume e Carboidrato ligados, e "Sentado, sem tela" desligado;
   - botão "Salvar".
5. **Check-in** (20:36), folha alta com `top` de uns 56:
   - humor `rf('mood', 4)` e energia `rf('energy', 3)`;
   - "3 coisas boas de hoje" com 3 campos: "Passeio com o cachorro no fim da tarde", "Almoço caprichado" e um vazio "Mais uma, se quiser";
   - "Telas hoje": tempo de tela 1h 48min e YouTube 35 min, com a legenda "Copie do Tempo de Uso do iPhone";
   - botão "Salvar check-in".
6. **Registrar deslize** (16:10), folha baixa:
   - ícone do refrigerante e "Registrar um deslize?";
   - o texto "Tudo bem, acontece. A contagem recomeça amanhã e o seu recorde de 21 dias continua guardado.";
   - números: atual 12 → 0, recorde 21, total 33 → 32 (o dia do deslize sai do total);
   - botão neutro "Registrar deslize" (tipo `s`, nunca vermelho) e "Cancelar".

### Grupo C · `f-habito-progresso.js` · seções `habito` e `progresso` · prefixo `.xc-`

1. **Hábito · Caminhada com o cachorro**: tela empurrada (`nb({ back: 'Hoje', act: 'Editar' })`), em cor do pilar Família.
   - Topo: ícone grande, título na serifa, as etiquetas Família e Corpo, e "20 min ou mais · 6 de 7 dias".
   - Três números: força 72% (com barrinha), nesta semana 3 de 7 (bolinhas) e total de 24 caminhadas.
   - Heatmap das últimas 12 semanas com legenda.
   - O insight "Nos dias com caminhada, seu humor médio foi 4,1. Nos outros, 3,4.", com "24 dias com · 8 dias sem".
   - Ações em lista: "Pausar este hábito" e "Arquivar".
2. **Hábito · Zero refrigerante** (dias sem):
   - "12" grande na serifa, com "dias sem refrigerante";
   - recorde 21 dias e total de 33 dias;
   - o histórico de períodos em barras proporcionais: "21 dias · 20 set – 10 out" e "12 dias · 11 out – hoje (atual)";
   - botão `s` "Registrar deslize" e a legenda "Um deslize zera só a contagem atual."
3. **Progresso · visão geral** (aba Progresso):
   - título "Progresso", `seg(['Semana','Mês'],0)` e chips de filtro (Visão geral selecionado, Corpo, Humor, Alimentação);
   - cartão "19 – 25 de outubro" com anel grande de 76% e "constância até agora";
   - lista dos pilares com barra e porcentagem, do maior para o menor;
   - "O que os seus dados mostram", com 2 insights em frase.
4. **Progresso · corpo e peso**:
   - gráfico de peso: pontos diários claros, a linha forte da média de 7 dias e o título "Tendência −1,1 kg em 3 semanas", com dados de exemplo e SVG próprio;
   - botão "Registrar peso";
   - cintura nas últimas 4 semanas;
   - movimento da semana: caminhada com o cachorro 3 de 7 · meta 6, futebol 0 de 1 (hoje).
5. **Progresso · humor**:
   - grade do mês de outubro em células coloridas pelo humor, em tons da primária. O dia 1 é uma quinta; os dias depois do 22 ficam vazios;
   - legenda com os 5 rostinhos;
   - médias de humor 3,8 e energia 3,2;
   - 2 frases de insight.
6. **Progresso · alimentação**:
   - proteína dos últimos 7 dias em barras com a linha da meta de 80 (seg 84, ter 92, qua 71, qui 46 até agora, o resto vazio);
   - água por dia;
   - refeições livres 0 de 2 e tranqueiras 1 de 2;
   - refrigerante 12 dias;
   - média das notas: almoço 3,6 e jantar 3,9.

### Grupo D · `f-jornada.js` · seção `jornada` · prefixo `.xd-`

1. **Jornada** (aba Jornada): as 4 fases num caminho vertical.
   - Fase 1 concluída (81%, check).
   - Fase 2 agora: semana 2 de 3, com os hábitos dela em chips.
   - Fases 3 e 4 com contorno vazio e a data.
   - Depois, o cartão "Plano de corrida": começa na fase 3, 13 semanas, 2 treinos por semana.
   - Por fim, a lista "Revisões":
     - domingo, 18 out · semana 1 da fase 2 · 74%;
     - domingo, 11 out · fim da fase 1 · 81%.
   - Cada revisão abre só para leitura. "Editar jornada" fica na Jornada (Fases saiu de Ajustes). As fases usam a primária.
2. **Plano de corrida** (tela empurrada, cor Corpo), título "Do zero aos 30 minutos".
   - O treino da semana 1 em blocos proporcionais: 5 min de aquecimento caminhando, 8 × (1 min de trote + 1,5 min de caminhada) e 5 min de volta à calma.
   - A lista das 13 semanas:
     1. 8× (1 + 1,5)
     2. 8× (1 + 1)
     3. 6× (1,5 + 1,5)
     4. 5× (2 + 1,5)
     5. 4× (3 + 1,5)
     6. 3× (4 + 1,5)
     7. 3× (5 + 2)
     8. 2× (8 + 2)
     9. 2× (10 + 2)
     10. 15 + 2 + 8
     11. 20 contínuos
     12. 25 contínuos
     13. 30 contínuos
3. **Corrida em andamento** (6:21, tela cheia sem abas, cor Corpo):
   - "Semana 1 · treino 1" e um X;
   - anel grande com "Trote" e "0:42" de "1:00";
   - "Próximo: caminhada 1:30";
   - a fileira de blocos com o atual destacado;
   - "Tempo total 10:42 · intervalo 3 de 8";
   - botões de pausar e encerrar.
4. **Revisão · 1 de 3** (domingo, 1 nov, 18:30), tela cheia com progresso de 3 trechos e X.
   - "Sua semana" e "26 out – 1 nov · fim da fase 2".
   - Anel de 78% de constância.
   - "O que deu certo":
     - telas desligadas em 7 de 7 noites;
     - proteína acima de 80 g em 5 dias;
     - caminhada em 6 de 7 dias;
     - zero refrigerante a semana toda.
   - "Para olhar com carinho": "Deitar às 22h aconteceu em 3 de 7 noites."
   - Botão "Continuar".
5. **Revisão · 2 de 3**:
   - "Uma coisa para ajustar na próxima semana?", com o campo preenchido: "Começar a desligar as telas às 20h45 para deitar no horário.";
   - campo "Cintura de hoje" em cm;
   - "Programa a dois": dias da semana em chips, com sábado escolhido, e o campo "Piquenique no parque";
   - botão "Continuar".
6. **Revisão · 3 de 3**: cartão na primária (fase não usa cor de pilar).
   - "Fase 3 disponível · Movimento" e o texto "A fase 2 fechou com 78% de constância. Se fizer sentido para você, estes hábitos entram a partir de amanhã:".
   - A lista: academia 2× por semana, corrida 2× por semana, YouTube até 60 min, tempo de tela até 1h40 por dia (20% abaixo da sua média).
   - Dois botões de mesmo peso: "Começar fase 3" e "Ficar mais uma semana".
   - A legenda "As duas escolhas estão certas."
7. **Fase desbloqueada**:
   - celebração calma, com confete estático (pequenas formas nas cores dos pilares);
   - "Fase 3" e "Movimento" grande na serifa;
   - "Academia e corrida entram no seu dia a partir de amanhã, segunda, 2 de novembro.";
   - o cartão "Primeiro treino de corrida: segunda, 7h10 · 30 min";
   - botão "Ver meu dia".

### Grupo E · `f-ajustes-1.js` · seção `ajustes` · prefixo `.xe-`

1. **Ajustes** (aba Ajustes):
   - cartão de perfil: avatar H, Henrique, "Conta Google conectada";
   - grupos com ícones em bolha neutra (`li({ ic })`, sem `hue` nem `p`: cor de pilar só vale para pilar e hábito):
     - Meu plano: Pilares (4), Hábitos (16). Fases saiu de Ajustes e é editada pela Jornada ("Editar jornada");
     - Rotina: Horários, Lembretes;
     - App: Aparência (Sistema), Pausar, A dois (desligado);
     - Dados: Dados e conta.
2. **Pilares** (`nb({ back: 'Ajustes', title: 'Pilares', act: 'Editar' })`):
   - a legenda "Arraste para reordenar.";
   - os 4 pilares com alça de arrastar (`dots-six-vertical`), ícone, nome e "N hábitos";
   - a linha tracejada "Novo pilar";
   - "Arquivados", com o estado vazio "Nenhum pilar arquivado."
3. **Novo pilar** (`nb({ left: 'Cancelar', title: 'Novo pilar', act: 'Criar' })`):
   - prévia no topo em `hued` mel, com o ícone `piggy-bank` e "Finanças";
   - campo Nome;
   - "Cor": 12 bolinhas da paleta, com mel selecionado e o nome da cor;
   - "Ícone": busca, chips de categoria (Todos, Mente e sono, Alimentação, Corpo, Família e casa, Saúde, Trabalho, Dinheiro, Lazer, Relações, Deixar de lado) e uma grade de ícones começando por Dinheiro, com o cofrinho selecionado.
4. **Hábitos** (`nb({ back: 'Ajustes', title: 'Hábitos' })` com um + à direita):
   - `seg(['Ativos','Próximas fases','Arquivados'],0)`;
   - os hábitos agrupados por pilar, com ícone, nome e o tipo e a fase em texto pequeno;
   - mostre com `tall`.
5. **Novo hábito · tipo**: "Que tipo de hábito?" com 9 cartões de tipo, cada um com ícone, nome e exemplo:
   - Sim ou não ("Louça feita");
   - Horário ("Acordei às 6h52");
   - Contador ("Proteína: 46 de 80 g");
   - Nota de 1 a 5 ("Almoço nota 4");
   - Número ("Peso, minutos de tela");
   - Vezes por semana ("Academia 2×");
   - Limite por semana ("Até 2 refeições livres");
   - Dias sem ("12 dias sem refrigerante");
   - Lista de passos ("Ritual do sono").
6. **Novo hábito · detalhes** (contador de proteína, `nb({ back: 'Tipo', title: 'Contador', act: 'Salvar' })`):
   - a prévia da linha do hábito;
   - campo Nome;
   - linhas Pilar (Alimentação), Ícone, Momento do dia (ao longo do dia) e Entra na fase (2);
   - "Meta": um controle de − e + com 80 g, o interruptor "Subir aos poucos" ligado e "+10 g a cada 2 semanas, até 110 g";
   - "Botões rápidos": chips editáveis e "+ botão";
   - "Dias": chips de seg a dom, todos ligados.

### Grupo F · `f-ajustes-2.js` · seção `ajustes` · prefixo `.xf-`

1. **Horários**:
   - os horários: acordar 06:50, deitar 22:00, telas desligadas 21:00, tarefas da casa até 20:30, check-in 20:30, fim da cafeína 14:00 (com a nota "fase 4"), revisão da semana domingo 18:00;
   - "Fim de semana": o interruptor "Tolerância de 1h";
   - "Dias de coleta do lixo": chips com segunda e quinta ligadas.
2. **Lembretes**:
   - um aviso em tom claro da primária: "O Prokopē não manda notificações. Os alarmes do iPhone são mais confiáveis.";
   - a lista de alarmes sugeridos com horário e texto: 06:50 Acordar; 20:30 Louça, lixo e check-in; 21:00 Telas desligadas; 21:50 Preparar para deitar; domingo 18:00 Revisão da semana;
   - "Como criar no iPhone", em 3 passos numerados;
   - a dica de automação no app Atalhos.
3. **Aparência**:
   - 3 prévias de tema (Sistema selecionado, Claro, Escuro) desenhadas como mini telas;
   - o interruptor "Animações", com a nota de que segue o movimento reduzido do iPhone;
   - o interruptor "Som suave ao marcar", desligado.
4. **Pausar**:
   - o título na serifa "Uma pausa também faz parte.";
   - `seg(['O app inteiro','Alguns hábitos'],0)`;
   - datas de 24 dez a 2 jan;
   - motivo em chips (Férias selecionado, Doença, Viagem, Outro);
   - a legenda "Dias pausados não contam na constância nem na força dos hábitos.";
   - botão "Pausar 10 dias".
5. **A dois**:
   - ícone de coração em Família e o título "Um espaço a dois, sem placar";
   - o texto "Cada pessoa continua vendo só os próprios dados. Aqui vocês escolhem o que compartilhar.";
   - convite por e-mail com botão;
   - "O que a outra pessoa vê", em rádios: Nada (padrão, selecionado), Só como estou hoje (humor), Hábitos que escolhermos juntos;
   - "Hábitos compartilhados", com "Programa a dois · 1 por semana" e um interruptor;
   - a legenda "Sem comparação de números. A única interação é mandar um carinho."
6. **Dados e conta**:
   - perfil;
   - "Seus dados": Exportar em CSV, Exportar em JSON, e a legenda "Inclui registros, pilares e hábitos.";
   - "Conta": Sair da conta e "Apagar todos os dados", este em tom de atenção (warning), nunca vermelho, com confirmação.
