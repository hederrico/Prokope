# Revisão de usabilidade, UI e UX

Revisão das telas do quadro ([../telas/index.html](../telas/index.html)), feita em 22 de outubro de 2026. Sete revisores cuidaram de um grupo de telas cada, um auditor olhou o conjunto e um designer desenhou os estados que faltavam. Os relatórios de cada grupo trazem o que mudou em cada tela, com o motivo.

O quadro foi de **39 para 66 telas**, e a base ganhou os componentes que os grupos estavam reinventando cada um no seu arquivo.

## Relatórios

| Relatório | Telas |
|---|---|
| [transversal.md](transversal.md) | O conjunto: caminhos, consistência, contraste, acessibilidade e o glossário |
| [hoje.md](hoje.md) | Hoje (manhã, tarde, noite, dia fechado, domingo) e as regras que valem para todo Hoje |
| [registros.md](registros.md) | As folhas de registro e a regra de quando cada uma salva |
| [habito-progresso.md](habito-progresso.md) | O detalhe do hábito e o Progresso |
| [jornada.md](jornada.md) | Fases, corrida e revisão da semana |
| [ajustes-1.md](ajustes-1.md) | Ajustes, pilares e hábitos |
| [ajustes-2.md](ajustes-2.md) | Horários, lembretes, aparência, pausa, a dois, dados e conta |
| [entrada.md](entrada.md) | Entrar, primeiro acesso e o computador |
| [estados.md](estados.md) | As 11 telas novas de estados e feedback |

## O que mais mudou

1. **Caminhos que não existiam.** Agora existe um caminho para cada uma destas tarefas:
   - marcar um dia que passou (tocar no dia da semana ou "Marcar ontem");
   - chegar à revisão da semana (o Hoje de domingo convida);
   - registrar o peso (linha na manhã e folha própria);
   - abrir o hábito a partir do Hoje e do Progresso;
   - corrigir um dia pelo calendário do hábito;
   - terminar um treino ("Treino feito");
   - editar as fases.
2. **Uma regra para a linha do hábito.** O controle da direita registra, o resto da linha abre o hábito e o toque longo abre o menu. As notas de almoço e jantar saíram da linha (círculos de 28 px) e viraram "Dar nota", que abre a folha.
3. **Um Hoje mais calmo.**
   - O que está longe no tempo ou já foi feito recolhe numa linha.
   - O convite gentil fica dentro da linha do hábito, no máximo um por dia.
   - O avatar e o cartão da fase saíram do topo.
   - O deitar passa a ser marcado na manhã seguinte, para o celular não voltar à mão depois das 21h.
4. **Registrar mais rápido.**
   - Proteína e água somam com um toque e mostram um − visível em cada linha para corrigir.
   - As outras folhas têm um botão só no pé.
   - O check-in abre com o rostinho já tocado.
   - Os botões de somar têm 48 px e ficam no terço de baixo.
5. **Progresso de cada pessoa.** Os filtros são Visão geral, Humor, Medidas e um chip por pilar, na ordem da pessoa. Assim o Progresso funciona com qualquer configuração. O peso foi para Medidas, com título neutro.
6. **Corrida feita para a rua.**
   - Contagem 3, 2, 1 e som nas trocas, porque o Safari não vibra.
   - Tela acesa.
   - Retomada quando a pessoa volta ao app.
   - "Minimizar" no lugar do X que furava o "Encerrar".
7. **Acessibilidade.**
   - Contraste corrigido nos tokens: os reprovados caíram de 44 para 4, e os que sobraram são intencionais.
   - Área de toque de 44 px em todos os controles.
   - Estados com forma além de cor (no calendário, "parcial" é meio quadrado).
   - Papéis e nomes para o VoiceOver nos helpers.
8. **Consistência.**
   - Cor de pilar só para pilar e hábito: as fases usam a primária.
   - Termos unificados num glossário.
   - Números iguais em todas as telas.

## Decisões confirmadas

Tomadas durante a revisão e confirmadas pelo Henrique em 22 de outubro de 2026.

| Decisão | Por quê |
|---|---|
| Fases usam a cor primária, e nunca a de um pilar | Outra pessoa terá outros pilares, e uma fase não pertence a um pilar só |
| Fases sai de Ajustes e vira "Editar fases" na Jornada | Evita dois lugares para a mesma coisa |
| Revisões passadas ficam na Jornada; o Progresso abre a mesma tela | As revisões contam a história das fases |
| O avatar sai de todos os cabeçalhos | O título já diz o nome, e a conta fica em Ajustes |
| Proteína e água ficam fora do "x de 12 feitos hoje" | Elas têm barra própria e passariam o dia "pela metade" |
| O dia vira às 4h, ajustável no perfil | Deitar à 0h30 conta na noite certa |
| O deitar é marcado na manhã seguinte | Pegar o celular para marcar o deitar quebraria as telas desligadas |
| A Noite abre às 18h fixas | Simples por enquanto; pode virar ajuste |
| A água continua visível à noite, sem convite para beber | Esconder confundiria; convidar atrapalharia o sono |
| No computador, as folhas viram um painel à direita | O Hoje continua visível enquanto você registra |
| Só os pilares se reordenam | Os hábitos seguem o momento do dia |
| Confete só ao desbloquear uma fase pela revisão | Começar a fase 1 no primeiro acesso fica calmo |

## Respostas às perguntas em aberto

| Pergunta | Resposta |
|---|---|
| Corrida encerrada no meio conta? | **Tudo é configurável.** Meta, mínimo que conta como parcial, horários e dias são da pessoa. A corrida conta pelo que o hábito define: a partir da meta é feito, a partir do mínimo é parcial. O estado parcial vale para qualquer meta com duração ou quantidade, como a caminhada. Virou o princípio 6 de [visao.md](../visao.md) |
| Deslize de hoje sai do total? | Sai. O total conta só dias inteiros sem (33 vira 32 na história) |
| Pausa sem data de volta? | Não. Sempre com data, que dá para estender |
| Como o peso aparece? | Número do dia e média, com "Mostrar só a tendência" em Ajustes › Aparência › Privacidade e um "ocultar valores" rápido no cartão |
| Medições no primeiro acesso? | Desmarcadas no passo 2; liga quem quiser |
| Até quando a revisão fica aberta? | O dia e a hora são da pessoa (Ajustes › Horários). O convite fica até dois dias depois |
| Terceiro caminho no convite de fase? | Não. Dois caminhos com o mesmo peso; "Editar fases" cobre o resto |
| Cloud Functions (plano Blaze)? | Não. Tudo sem servidor e no plano gratuito: o convite do A dois é um link para compartilhar, e apagar os dados acontece na hora |
| Onde aparece o carinho recebido? | Cartão discreto no topo do Hoje até o fim do dia |
| Onde aparece o ajuste da semana? | Uma linha no cartão da semana até a próxima revisão, que pergunta se funcionou |
| Primeiro acesso depois das 20h? | A fase começa no dia seguinte |

Fica para depois da etapa 0: publicar um atalho pronto do app Atalhos para criar os alarmes ([ajustes-2.md](ajustes-2.md)).

## O que ainda não foi desenhado

- As vistas de Mente e Família no Progresso. Elas seguem a regra de montagem por tipo de hábito, descrita em [../interacao/telas/habito-progresso.md](../interacao/telas/habito-progresso.md).
- A tela própria de "Apagar todos os dados". A especificação já descreve o fluxo.
- O carinho recebido e a linha do ajuste da semana no Hoje. As duas estão descritas em [../interacao/telas/hoje.md](../interacao/telas/hoje.md).
