# Gestos e feedback

Os gestos que o app entende, como cada toque responde, quando aparece um toast, quando o app pede confirmação e como lidar com o teclado do iPhone.

## A linha do hábito

A linha mais tocada do app segue uma regra só, em todas as telas:

- **O controle da direita registra:** o círculo marca, a pílula de horário abre a folha do horário, "Dar nota" abre a folha da nota, e os botões de somar (ovo, 500 ml) somam na hora.
- **Nos contadores, a medida abre a folha:** a barra da proteína, o anel da água ou o "Mais" abrem a folha do contador, com a lista do dia e todos os botões.
- **O resto da linha abre o detalhe do hábito** (tela empurrada, com "Voltar" para a tela de origem).
- **O toque longo abre o menu do hábito** (Ver hábito, Registrar outro horário, Hoje não se aplica, Editar).
- O controle tem área de toque de pelo menos 44 × 44 e uma folga de 8 px até o texto, para o polegar não abrir o detalhe sem querer.

## Gestos

Todo gesto tem uma alternativa visível. Gesto é atalho, nunca o único caminho.

| Gesto | Onde | Faz | Alternativa visível |
|---|---|---|---|
| Toque | Em todo lugar | A ação principal do elemento | — |
| Toque longo (500 ms) | Linha de hábito no Hoje | Abre o menu do hábito | "Mais" (⋯) no topo da tela do hábito; no VoiceOver, um botão "Mais opções" na linha, invisível na tela |
| Arrastar para baixo | Folha | Fecha a folha | Toque fora ou "Fechar" |
| Arrastar da borda esquerda | Tela empurrada, só no app instalado | Volta | "Voltar" no topo |
| Deslizar para a esquerda | Item da lista de hoje (proteína, água) | Mostra "Apagar" | O botão de apagar ao lado de cada item, visível na própria lista |
| Deslizar para o lado | Semana do topo do Hoje | Mostra a semana anterior (só uma para trás), para corrigir o domingo numa segunda | Heatmap da tela do hábito; setas no computador |
| Arrastar pela alça | Ajustes › Pilares (os hábitos não se reordenam: o Hoje os organiza pelo momento do dia) | Reordena | Botões "Mover para cima" e "Mover para baixo", invisíveis na tela e alcançáveis pelo VoiceOver (o Safari não tem ações personalizadas do rotor para a web) |
| Toque na aba ativa | Barra de abas | Volta à raiz da aba ou rola ao topo | — |

O que o app não usa:

- **Puxar para atualizar:** os dados chegam sozinhos pelos ouvintes.
- **Deslizar para marcar:** o toque já é rápido, e deslizar marcaria sem querer durante a rolagem.
- **Duplo toque:** não existe em nenhum controle. `touch-action: manipulation` em tudo, para o iPhone não esperar o segundo toque.
- **Rolagem elástica da página inteira:** `overscroll-behavior: none` no `body`. A elasticidade fica só dentro das áreas que rolam, para a barra de abas nunca descolar.

## Como o toque responde

1. **Pressionado (até 100 ms):** o elemento vai a 0,97 de escala e o fundo escurece 4%, em `press`. Solto, volta com a mola `toque`.
2. **Área de toque:** pelo menos 44 × 44, mesmo quando o desenho é menor. Um pseudo-elemento transparente aumenta a área sem mudar o visual.
3. **Toques repetidos:** controles que alternam (marcar, interruptor) ignoram um segundo toque nos 300 ms seguintes, para não marcar e desmarcar sem querer. Botões de somar (proteína, água) aceitam toques seguidos com uma trava de só 120 ms, e toques no mesmo botão em até 1,5 s viram um registro só ("Ovo × 3", 18 g), com um toast só.
4. **Toque cancelado:** arrastar o dedo para fora antes de soltar cancela a ação, como no iOS.

## Camadas de feedback

Cada ação usa só as camadas de que precisa, nesta ordem:

| Camada | O que é | Quando |
|---|---|---|
| Visual imediato | O próprio controle muda (✓ desenhado, chip preenchido, rostinho em destaque) | Sempre |
| Consequência | Número rola, barra enche, anel anda | Quando a ação muda um total |
| Vibração | O truque do interruptor (veja [movimento.md](movimento.md)) | Marcar um hábito, bater uma meta, fechar o dia |
| Som | Um som curto e grave, desligado por padrão | Marcar um hábito |
| Toast | Mensagem curta embaixo | Só nos casos da lista abaixo |

## Toasts

O app usa o Sonner, com um toast por vez.

- **Posição:** no celular, embaixo, 8 px acima da barra de abas (ou da borda segura, quando não há barra). No computador, embaixo e no centro da área principal.
- **Arrastar para baixo** dispensa o toast.
- **Leitor de tela:** os toasts são anunciados com `aria-live="polite"`.

| Situação | Texto | Ação | Duração |
|---|---|---|---|
| Marcar, somar, avaliar | "Caminhada marcada", "Ovo · 6 g" | Desfazer | 5 s, com o fio esvaziando. Dentro das folhas de proteína e água não há toast, para não cobrir os botões: o − da linha nova desfaz |
| Registrar um deslize | "Deslize registrado. O recorde de 21 dias continua guardado." | Desfazer | 5 s |
| Arquivar hábito ou pilar | "Caminhada arquivada" | Desfazer | 5 s |
| Ajuste que muda o dia (horário, pausa, A dois) | "Deitar às 22h30", "Pausa marcada", "Pausa encerrada", "Convite cancelado", "Ligação desfeita" | Desfazer | 5 s |
| Ficou sem internet | Sem toast; aparece o aviso no topo do Hoje | — | — |
| Escrita recusada | "Não deu para salvar. Tente de novo em instantes." | Tentar de novo | Até a pessoa dispensar |
| Versão nova | "Nova versão do Prokopē" | Atualizar | Até a pessoa dispensar |
| Carinho recebido (A dois) | Sem toast: um cartão discreto (`HugCard`) no topo do Hoje até o fim do dia | — | — |

Não há toast para confirmar o que já se vê na tela. Se o ✓ apareceu, ninguém precisa ler "Hábito marcado com sucesso".

Padrão de texto: o nome da coisa e o que aconteceu, no particípio ("Caminhada marcada", "Peso registrado"). Sem ponto de exclamação.

## Desfazer em vez de confirmar

Quase tudo se desfaz, então quase nada pede confirmação.

| Ação | Proteção |
|---|---|
| Marcar, somar, avaliar, registrar deslize, arquivar | Desfazer por 5 s |
| Apagar um item de contador | Desfazer por 5 s |
| Fechar uma folha ou a revisão com texto digitado | Nenhuma: o rascunho fica salvo |
| Encerrar a corrida no meio | Segurar o botão por 800 ms (um anel enche em volta), depois folha com "Salvar o que fiz" (principal) e "Descartar treino" |
| Apagar um pilar vazio | Desfazer por 5 s |
| Apagar um pilar com hábitos | Folha explicando o que acontece com os hábitos, com "Arquivar" como saída recomendada |
| Sair da conta com escritas sem internet | Confirmação: "Ainda há registros esperando internet para subir." |
| Apagar todos os dados | Tela própria: baixar os dados antes, digitar "apagar" para liberar o botão, e o botão em tom de atenção (nunca vermelho) |

## Teclado do iPhone

- **Folhas com campo de texto:** a folha sobe junto com o teclado (pelo `visualViewport`), e o campo com foco fica sempre visível acima dele.
- **Ordem dos campos:** o campo principal fica no alto da folha, longe do teclado.
- **Tipos de teclado:** `inputmode="decimal"` para peso e cintura (vírgula como separador), `inputmode="numeric"` para minutos, `enterkeyhint="next"` entre campos e `enterkeyhint="done"` no último.
- **Horário:** `<input type="time">` nativo, que abre a roda do iOS. É mais confiável e acessível que uma roda própria.
- **Tamanho:** todo campo tem 16 px ou mais, para o iPhone não dar zoom ao focar.
- **Fechar o teclado:** tocar fora do campo fecha o teclado sem fechar a folha.

## Computador

- **Passar o mouse:** linhas e botões ganham o fundo `surface-2` em `micro`. Nada de importante aparece só no hover.
- **Foco do teclado:** anel de 2 px na cor primária, com 2 px de afastamento, só com `:focus-visible`.
- **Teclas:** `Tab` percorre na ordem visual, `Espaço` e `Enter` acionam, `Esc` fecha folha e diálogo. Os atalhos estão em [telas/entrada.md](telas/entrada.md).
- **Arrastar para reordenar** (pilares) funciona com o mouse pela alça, e as setas do teclado movem o item com foco.
