# Revisão · C · Hábito e Progresso

## Hábito · Caminhada com o cachorro
**O que mudou**
- Heatmap com células de 20 px, sem o número do dia e pequeno demais para tocar → calendário do mês (outubro, com setas para setembro). É o mesmo componente do Humor: células de 48 px com o dia, ✓ no feito, metade cheia no parcial, trilho no "sem", contorno no "por vir" e anel no hoje.
- Não havia como corrigir um dia passado → o calendário diz "toque para corrigir" e abre a folha nova "corrigir um dia".
- "Força" sozinho não se explicava → o rótulo virou "Força do hábito" (o termo do design system), com uma frase no rodapé do cartão: sobe a cada caminhada, desce devagar e nunca zera.
- Nada reforçava o "nunca dois dias seguidos" → faixa "Desde 21 de setembro, você nunca ficou dois dias seguidos sem caminhar." A frase vale para os dados ilustrativos, com o parcial contado como "sem".
- "20 min ou mais · 6 de 7 dias" competia com o "3 de 7" da semana → "meta 6 de 7 dias".
- "Sai do Hoje, e o histórico fica guardado" → "Sai do Hoje. O histórico fica guardado."

**Fica para decidir**
- Uma faixa compacta "últimas 12 semanas" (no estilo do Loop) acima do calendário, para ver o hábito inteiro de uma vez. O que pesa contra: é mais uma peça na tela, e com 5 semanas de história ela ainda diz pouco.
- Texto do insight quando faltam dias "sem" porque a pessoa faz o hábito quase todo dia: "Você caminhou em quase todos os dias, então ainda não dá para comparar." Nunca um texto que pareça pedir para faltar. O estado "poucos dados" é do grupo I.

## Hábito · corrigir um dia (nova)
**O que mudou**
- Tela nova: uma folha com a data no título ("Quarta, 21 de outubro"), o hábito e três opções grandes (Feito, Parcial, Sem caminhada), com a atual marcada. Escolher já salva e mostra Desfazer, sem botão de confirmar. A força e a semana se recalculam na hora.

**Fica para decidir**
- Nos hábitos de sim ou não, o toque na célula poderia alternar o estado direto, sem folha (1 toque a menos). O que pesa contra: as células ficam juntas, e um toque errado mudaria um dia sem a pessoa perceber. A folha confirma a data.

## Hábito · Zero refrigerante
**O que mudou**
- Um deslize registrado por engano só podia ser desfeito nos 5 segundos do Desfazer → os períodos ganharam seta, e tocar num período corrige a data do deslize.
- O período atual ganhou o selo "agora" (antes, "(atual)" no meio do texto), e o total passou a dizer "33 dias sem".

**Fica para decidir**
- A folha "Registrar deslize" (grupo B) poderia perguntar "Quando? Hoje · Ontem", para quem lembra na manhã seguinte.

## Progresso · visão geral
**O que mudou**
- Dois níveis de filtro confundiam: o Semana|Mês não mudava o gráfico de peso nem o da cintura, e o Humor só fazia sentido em Mês → ficou um nível só. Os chips escolhem o que ver, e o período virou um seletor em pílula no topo ("‹ 19 – 25 de outubro ›", "esta semana"). Cada vista usa o período natural dela (semana na visão geral e nos pilares, mês no humor), e as setas voltam no tempo, o que o Semana|Mês não fazia.
- Chips fixos por tema (Corpo, Humor, Alimentação) deixavam Mente e Família de fora e não funcionariam para a esposa → Visão geral, Humor e Medidas ficam fixos, e depois vem um chip por pilar da própria pessoa, na ordem de Ajustes › Pilares e com a bolinha da cor. A fileira rola na horizontal.
- Regra para montar a vista de um pilar, a partir do tipo de cada hábito: contador em barras, limite em bolinhas, dias sem em contagem, nota em média, e sim ou não e vezes por semana numa lista com "x de 7". A mesma regra serve para qualquer configuração de pilares.
- Pilares, "Semana passada" e "Fase 1" ganharam seta. O pilar abre a vista dele, e a semana passada abre a revisão daquele domingo (grupo D).
- Alimentação, que aparece por último, ganhou a legenda "foco da fase 2": o número mais baixo está onde estão os hábitos novos.
- O título do cartão repetia o período → "Constância da semana".
- O insight do acordar dizia "até 6h55", o que não bate com a tolerância de 15 min → "acordou no horário". Ganhou também a contagem "20 dias com · 12 sem", como o design system pede.
- O avatar saiu do cabeçalho, como propôs a auditoria transversal (avatar só no Hoje).

**Fica para decidir**
- Vista Mês para os pilares (proteína em 30 barras, constância por semana). O que pesa contra: é mais um controle, e as setas já respondem "como foi a semana passada".
- Mente e Família não têm tela desenhada. As duas seguem a regra de montagem acima.

## Progresso · humor
**O que mudou**
- Semana|Mês → seletor "‹ Outubro ›", com "este mês".
- O título virou "Humor de cada dia", com "toque num dia para ver" (no celular não existe hover).
- O número dos dias sem check-in passou de `--text-3` para `--text-2` sobre o trilho (de 3,9:1 para 5,5:1), como apontou a auditoria.

**Fica para decidir**
- Alternar Humor|Energia dentro do calendário, já que a energia não tem vista diária.

## Progresso · um dia (nova)
**O que mudou**
- Tela nova: tocar num dia em qualquer gráfico (célula do humor, barra da proteína, anel da água, ponto do peso) abre a mesma folha. Ela mostra humor e energia, as 3 coisas boas, hábitos (7 de 12), proteína, água e o botão "Editar este dia", que leva ao Hoje daquela data. É o caminho para o "esqueci de marcar ontem".

**Fica para decidir**
- Arrastar a folha para os lados para trocar de dia.

## Progresso · medidas (antes "corpo e peso")
**O que mudou**
- O peso aparecia em Corpo, mas na história e em Ajustes ele é do pilar Alimentação → chip fixo "Medidas", com todo hábito do tipo número (peso, cintura, tempo de tela), cada um na cor do seu pilar. A caminhada e o futebol ficam na vista de Corpo. Foi a proposta da auditoria transversal, e ela não mexe na história.
- "Tendência −1,1 kg em 3 semanas" não era uma frase → "A média desceu 1,1 kg em 3 semanas". O texto é calculado dos dados e troca para "subiu" ou "ficou estável", sem elogio nem cobrança.
- O eixo de 83 a 85,2 kg aumentava a oscilação → eixo com folga (82,6 a 85,4). A linha fica calma, e um dia mais alto não parece drama.
- Cintura: o selo "−1,5 cm" repetia o gráfico → título "1,5 cm a menos em 3 semanas".
- Para ler um valor, tocar ou arrastar no gráfico mostra uma etiqueta com a data, o peso do dia e a média. O detalhe vai na tarefa de interações.

**Fica para decidir**
- "Mostrar só a tendência" em Ajustes, que esconde o peso de cada dia e os números absolutos para quem se incomoda com eles, e um "ocultar valores" rápido no cartão para quando alguém está olhando a tela. O que pesa contra: é mais uma opção. A favor: o peso é o dado mais sensível do app.
- Os hábitos do tipo número aparecem só em Medidas. A alternativa é uma linha compacta "Peso · ver em Medidas" também na vista do pilar.
- A linha do peso ficou sálvia (a cor de Alimentação). Se o verde descendo soar como "bom", vale usar um tom neutro só em Medidas.

## Progresso · alimentação
**O que mudou**
- Os títulos viraram frases sobre o que foi feito ("80 g ou mais em 2 dos 3 dias fechados", "3 L ou mais em 2 dos 3 dias fechados"), e o selo que repetia isso saiu.
- O rótulo "80 g" agora fica na ponta da linha da meta, e a legenda ficou só com "hoje, até agora".
- Zero refrigerante estava dentro de "Limites da semana" → passou para um grupo próprio, "Dias sem", com seta.
- As linhas com seta abrem o detalhe do hábito empurrado dentro da aba Progresso, com voltar "Progresso".

## Pedidos para a base
- `cal(cell)`: calendário do mês, hoje feito com `.xc-calh`, `.xc-calg` e `.xc-c` (cabeçalho S T Q Q S S D, casas vazias antes do dia 1, células de 48 px com o dia e uma marca). Serve ao hábito, ao humor e à revisão. Os estados seriam `.c.d` (fill + ✓), `.c.p` (`linear-gradient(to top, var(--fill) 50%, var(--track) 50%)`), `.c.n` (trilho com o número em `--text-2`), `.c.f` (contorno), `.c.t` (anel) e `.c.sel` (anel de 2,5 px em `--accent-mark`).
- `.chips.scroll`: fileira com rolagem horizontal, 16 px de respiro nas pontas e um degradê de 24 px na borda. Substitui o `.chips.nowrap`, que corta chips sem avisar.
- `periodNav(label, sub, canNext)`: o seletor "‹ período ›" em pílula `--sunken`, com setas de 44 px e a seta da frente apagada no período atual.
- O `--on` sobre `--fill` nos dias feitos dá cerca de 4,2:1 em Família, num número de 11 px. Ajustar o token, como na proposta B1 da auditoria.
- Apoio os pedidos da auditoria que tocam o grupo C (`tag()`, `mbar()`, `ch()`, `heatKey()` e `.stat` de 28 px). Troco as classes `.xc-` quando eles existirem.

## Depois da auditoria
- Selos `.xc-tag` e `.xc-badge` → `tag()` (Família e Corpo com `dot`, "recorde" com troféu, "agora"); o `.xc-delta` já tinha saído.
- Barras `.xc-mbar` → `mbar()` (força do hábito, notas dos pratos) e `mbar(pct, true)` na lista de pilares.
- Números lado a lado `.xc-3` → `.stats` com `.k` e `.stat` de 28 px (caminhada e refrigerante). Médias de humor e notas dos pratos também viraram `.stat`.
- Cabeçalhos `.xc-ch` → `ch()` em todos os cartões.
- Legendas `.xc-lg` e `.xc-sw` → `heatKey()`. As legendas de gráfico (ponto, linha, listrado) passam classes `.xc-k*` para o mesmo `heatKey()`.
- `budget()` local → `budget({ p, t, s, used, total })` da base.
- Ficam comigo, sem par na base: o calendário do mês (`MonthCalendar`, agora com as letras de estado do heatmap: d, p, n, x, u, f, t, sel) e o seletor de período (`PeriodSelector`, que aceita semana, mês e fase).
- Contraste: o número dos dias "sem" (trilho) usa `--text-2` no calendário do hábito e no do humor.
- Caminhos: as linhas de hábito do Progresso abrem `/progresso/habito/:id`. "Semana passada ›" abre `/jornada/revisoes/:semana` só para leitura. "Fase 1 · Base ›" troca o seletor para o período da fase (`?periodo=fase&fase=1`), o mesmo que a Jornada abre.
- Glossário: "Força do hábito" com o nome inteiro também nas frases (rodapé, Pausar, folha de correção); nenhum "3/6" restou; horários no texto sem zero à esquerda.
- Avatar: já tinha saído do Progresso; o "Editar" do topo do hábito virou "Mais" (⋯), que abre o menu do hábito, como pede gestos-e-feedback.md.
- Acessibilidade no quadro: dias do calendário com `role="button"` e rótulo ("21 de outubro, sem caminhada"), opções da folha de correção em `radiogroup`, setas com nome.
