# F · Ajustes, rotina e conta · interações e animações

São telas de configurar, abertas poucas vezes e com calma. Por isso quase nada anima além da passagem. O cuidado fica onde algo muda o resto do app (horário, tema, pausa) e onde algo não volta (apagar tudo).

Componentes novos: `ThemePreview` (mini tela do tema), `PauseStrip` (faixa dos dias da pausa), `DateSheet` (calendário em folha), `PeerCard` (como a outra pessoa aparece, com o carinho), `AlarmRow` e `NumberedSteps`. Coleções novas, fora de `users/{uid}`: `invites` e `links` (com `share`, `hugs` e `habits` dentro). Campos novos em `profile`: `schedule`, `collectionDays`, `weekendTolerance`, `prefs` (`theme`, `motion`, `sound`, `zeno`), `linkId` e `deleting`. Ações novas: `setScheduleTime`, `setWeeklyReview`, `setWeekendTolerance`, `setCollectionDays`, `setTheme`, `setMotion`, `setSound`, `setZenoShown`, `startPause`, `updatePause`, `cancelPause`, `endPause`, `createInvite`, `cancelInvite`, `acceptInvite`, `declineInvite`, `unlink`, `setSharing`, `setSharedHabit`, `sendHug`, `exportData`, `signOut` e `deleteAllData`.

## Comum às telas deste grupo

- **Como chegam:** empurradas a partir de Ajustes, com a mola `calma` e a barra de abas visível na aba Ajustes. Voltam por "‹ Ajustes" ou pelo arrasto da borda ([navegacao.md](../navegacao.md)).
- **Ao aparecer:** sem cascata. O conteúdo chega inteiro com a passagem. O que muda enquanto a tela está aberta (outro aparelho, outra pessoa) troca com opacidade em `micro`.
- **Interruptores:** a linha inteira liga e desliga. O botão do interruptor corre em `micro`, grava na hora e não mostra toast, porque o próprio interruptor já mostra o estado e desligar é o desfazer.
- **Valores tocáveis (`TimeValue`):** um `<input type="time">` (ou `date`) transparente cobre o valor, com 44 px de altura, e abre a roda do iPhone ([gestos-e-feedback.md](../gestos-e-feedback.md)). O valor novo troca com opacidade em `micro`, sem rolar dígitos.

## Horários  (rota: `/ajustes/horarios`)

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Horário (Acordar, Deitar...) | Toque | Roda do iPhone; grava quando a roda fecha, nunca a cada giro | Valor em `micro`; toast em `base` | `setScheduleTime('bed', '22:30')` | Hoje: metas e grupo do momento do dia mudam com layout `calma`. Lembretes: a linha do alarme |
| Fim da cafeína (fase 4) | Toque | Igual. O valor fica no estilo `off` até a fase 4 começar | `micro` | `setScheduleTime('caffeine', ...)` | Nenhum até a fase 4 |
| Revisão da semana | Toque | `Sheet` "Revisão da semana" com `DayPicker` de escolha única e a roda | `folha` | `setWeeklyReview(6, '18:00')` | Hoje: o convite da revisão aparece no novo dia e hora |
| Tolerância de 1h | Toque na linha | Liga e desliga | `micro` | `setWeekendTolerance(true)` | Sábado e domingo de Acordar e Deitar |
| Dias de coleta | Toque num dia | O dia ganha fundo, contorno e check com a mola `toque` | `toque` | `setCollectionDays([0, 3])` | Hoje: se o dia de hoje mudar, a linha do lixo entra ou sai com layout `calma` |

**Toast:** "Deitar às 22h30", com a linha de baixo "Mude também o alarme do iPhone." e Desfazer por 5 s.
**Estados desta tela:**
- **Vale a partir de hoje:** os dias que passaram guardam a meta da época. Um registro já feito hoje guarda a meta de quando foi marcado (`marks.goal`), para mudar um horário nunca transformar em "fora da meta" algo que já foi feito.
- **Ordem estranha** (telas depois de deitar): não bloqueia. A linha de baixo do horário mostra "depois de Deitar" em `text-2`.
- **Nenhum dia de coleta:** vale. O rodapé troca para "Sem dia de coleta, Lixo e recicláveis não aparece no Hoje."

**Acessibilidade:** cada horário é lido como "Deitar, 22h30, alarme de preparar 10 min antes, botão". O VoiceOver nunca lê "22:30". Os dias da coleta são um grupo de caixas de marcar ("segunda, marcado"). Com letra grande, o `TimeValue` desce para baixo do nome.
**Implementação:** guarde a hora como texto `HH:mm` em `profile.schedule`, mais `profile.scheduleLog` com `{ chave, hora, desde }`, para o domínio saber a meta de cada dia. O seletor de horário do Hoje e o dos alarmes leem do mesmo lugar.

## Lembretes  (rota: `/ajustes/lembretes`)

**Ao aparecer:** nada anima. A tela é só leitura: as linhas, os passos e a dica não são tocáveis.
**Estados desta tela:** a lista vem de `profile.schedule`, em ordem de horário, e se um horário mudar com a tela aberta, a linha troca em `micro`. O horário aparece como "06:50" porque reproduz o Relógio, onde a pessoa vai digitar.
**Acessibilidade:** cada `AlarmRow` é lido como "6h50, Acordar, todo dia". `NumberedSteps` é uma lista ordenada.
**Implementação:** nenhum botão abre o Relógio, o app Saúde ou o Atalhos. Os esquemas de URL não são documentados, e um link do Atalhos abriria o Safari em vez do app instalado ([navegacao.md](../navegacao.md)). Se um atalho pronto for publicado um dia, ele entra como um `Button` acima dos passos.

## Aparência  (rota: `/ajustes/aparencia`)

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| `ThemePreview` (Sistema, Claro, Escuro) | Toque | O tema troca ao vivo, sem salvar | Cores em `base` (abaixo); anel da prévia e `Radio` em `micro` | `setTheme('dark')` | O app todo e a cor da barra de status |
| Animações | Toque na linha | Liga e desliga o movimento do app | Botão em `micro`; o modo reduzido entra 150 ms depois | `setMotion(false)` | O app todo: `data-motion="off"` no `html` |
| Som suave ao marcar | Toque na linha | Liga, e o som toca uma vez para a pessoa ouvir | `micro` | `setSound(true)` | Nível 1 da escada de celebração |
| Jeito de ver o Hoje (Resumo, Lista completa, Linha do tempo) | Toque num cartão | O Hoje passa a abrir naquele jeito ([hoje.md](hoje.md) › Os três jeitos de ver o dia) | rádio em `micro` | `profile.prefs.todayView` (`setTodayView`) | Hoje (o botão do topo mostra o mesmo jeito) |
| Mostrar o Zeno (grupo Zeno) | Toque na linha | Liga e desliga o Zeno no app (abaixo) | `micro` | `profile.prefs.zeno` (`setZenoShown`) | O tutorial e os momentos com o Zeno; sem ele, só o balão |
| Mostrar só a tendência do peso (grupo Privacidade) | Toque na linha | Esconde o número de cada dia no Hoje, na folha do peso e em Medidas; ficam a frase e a linha da média | `micro` | `profile.prefs.weightTrendOnly` | Hoje (a linha Peso mostra só o ✓), Progresso › Medidas |

**Troca de tema ao vivo:** `setTheme` grava em `profile.prefs.theme` e na cópia do `localStorage`. Depois põe a classe `theme-fade` no `html` por 240 ms, com `transition: background-color, color, border-color, fill, stroke, box-shadow` em `--dur-base` e `--ease-in-out`, e troca o `data-theme`. Atualiza também `<meta name="theme-color">` e `color-scheme`. As prévias não mudam, porque têm as cores fixas de cada tema. Em Sistema, o mesmo efeito acontece quando o iPhone troca sozinho de claro para escuro com o app aberto (`matchMedia(...).addEventListener('change')`).
**Mostrar o Zeno:** a linha diz "A tartaruga que apresenta o app e aparece em alguns momentos.", e o rodapé, "Sem ele, o tutorial segue igual, só com o texto." Num aparelho que não desenha WebGL, o rodapé troca para "Este aparelho não desenha o Zeno. O tutorial segue igual, só com o texto."
- Documentos antigos não têm o campo, e vale mostrar: leia com `zenoShown(prefs)` (`src/domain/tutorial.ts`). Gravar põe `prefs.zeno` por mescla, e a ação devolve o desfazer, como as outras preferências. Como nos outros interruptores, não há toast.
- Desligar com o Zeno em cena (no capítulo "Os ajustes", por exemplo) faz ele dar tchau e sair. Desligado, `useZeno().available` fica falso, nada dele carrega, e o Zeno não oferece capítulos sozinho ([tutorial.md](tutorial.md)).
- A escolha vale para a pessoa, em todos os aparelhos. O movimento reduzido é outra coisa: com ele, o Zeno aparece, mas troca de pose por opacidade ([movimento.md](../movimento.md) › A exceção do Zeno).

**Animações e o Reduzir Movimento do iPhone** (regra de [movimento.md](../movimento.md): o interruptor só reduz):

| iPhone | Interruptor do app | O que vale | O que a tela mostra |
|---|---|---|---|
| Sem Reduzir Movimento | Ligado (padrão) | Movimento completo | Interruptor ligado, sem aviso |
| Sem Reduzir Movimento | Desligado | Reduzido (`data-motion="off"`, `reducedMotion="always"`) | Interruptor desligado |
| Com Reduzir Movimento | Qualquer | Reduzido | Interruptor desligado e travado (`aria-disabled`), com o aviso de onde mudar. A escolha guardada não é apagada |

Se o iPhone mudar com o app aberto, o aviso entra com `fadeUp` ou sai em `micro`, e o interruptor volta à escolha guardada. No modo reduzido, os tokens de `base.css` já trocam sozinhos: deslocamento vira opacidade e o tema continua trocando com cor, em 150 ms.
**Acessibilidade:** as prévias são um grupo de rádio ("Tema Escuro, 3 de 3"). O interruptor travado é lido como "Animações, desligado, indisponível", seguido do aviso (`aria-describedby`).
**Implementação:** crie ou retome o `AudioContext` dentro do toque do interruptor, porque o iOS só libera o som dentro de um gesto. Use `navigator.audioSession.type = 'ambient'` quando existir, para respeitar o silencioso.

## Pausar  (rota: `/ajustes/pausar`; folha de data: `?folha=data&campo=inicio` ou `campo=volta`)

**Ao aparecer:** se houver pausa ativa ou marcada, a rota mostra Pausar · em pausa. Senão, mostra o formulário com Começa hoje e Volta em 7 dias. A partir do Hábito ("Pausar este hábito"), chega com `?habito=:id`, "Alguns hábitos" escolhido e o hábito marcado.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| O app inteiro / Alguns hábitos | Toque | "Alguns hábitos" abre a lista dos hábitos ativos, com caixas de marcar, entre o controle e as datas | Lista entra com layout `calma` e `fadeUp` | — | — |
| Começa / Volta | Toque | Abre a `DateSheet` | `folha` | — | — |
| Dia na `DateSheet` | Toque | O dia enche na primária com check (mola `toque`). A folha fecha sozinha 200 ms depois | `toque`, depois `base` | — | — |
| `PauseStrip` | — | Refaz a faixa; a contagem e o botão rolam | Células com layout `calma`; "10 dias" e "Pausar 10 dias" com NumberFlow em `fill` | — | — |
| Motivo | Toque | Um chip por vez; tocar no escolhido desmarca | `toque` | — | Hoje pausado: o selo do motivo |
| Pausar 10 dias | Toque | Grava e troca a tela para o estado em pausa ou marcada | Opacidade em `base` | `startPause({ start, end, reason, habitIds })` em `pauses` | Hoje (abaixo); Progresso, Hábito e Jornada: dias hachurados, "ao abrir" |

**`DateSheet`:** título "Começa" ou "Volta"; um mês em grade de 7 colunas, com células de 44 × 44; setas de mês ‹ › de 44 px e o arrasto de lado como atalho; hoje com anel. Os dias da pausa aparecem hachurados, como na faixa. Dias antes de hoje (em Começa) e até o dia de começar (em Volta) ficam em `text-3` e não são tocáveis. A folha ocupa a metade de baixo da tela, ao alcance do polegar, e não tem botão de confirmar: o toque no dia já escolhe.
**`PauseStrip`:** até 21 dias, uma célula por dia, mais a célula vazada da volta com ▶. Acima disso, vira uma barra hachurada com a data de começo e a de volta nas pontas.
**Toast:** "Pausa marcada · 24 dez a 2 jan" ou "Pausa começou · até 2 jan", com Desfazer por 5 s. Desfazer apaga a pausa e volta ao formulário pelo mesmo caminho.
**No Hoje ao pausar:** se começa hoje, o Hoje já está no estado pausado quando a pessoa chegar, com troca de opacidade em `base` se estiver visível ([comunicacao.md](../comunicacao.md)). Se começa depois, nada muda até a virada do dia (4h) do dia de começar. Hábito pausado sozinho: a linha sai do Hoje com altura e opacidade em `base`.
**Estados desta tela:** sem nenhum hábito marcado em "Alguns hábitos", o botão fica desabilitado, e a lista diz "Escolha pelo menos um hábito." em `text-2`. Uma pausa de mais de 30 dias não é bloqueada.
**Acessibilidade:** a faixa é uma imagem com nome ("Pausa de 24 de dezembro a 2 de janeiro, volta no dia 3"). Na `DateSheet`, cada dia é lido como "quinta, 24 de dezembro, começo da pausa". As setas do teclado andam pelos dias.
**Implementação:** `pauses.end` é o último dia pausado, incluído; a volta é `end + 1`. Os dias sem não contam dentro da pausa: o domínio pula os dias pausados ao contar e retoma do número em que parou.

## Pausar · em pausa  (mesma rota)

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Volta | Toque | `DateSheet` em Volta, para estender ou encurtar | `folha` | `updatePause(id, { end })` | Hoje pausado: "Pausa até ..." troca em `micro` |
| Encerrar a pausa | Toque | Encerra sem confirmar, com toast "Pausa encerrada" e Desfazer | Tela volta ao formulário com opacidade em `base` | `endPause(id)`: `end` passa a ser ontem | Hoje (abaixo) |
| Cancelar a pausa (pausa só marcada) | Toque | Igual, antes de começar | `base` | `cancelPause(id)` | — |

**No Hoje ao encerrar** (daqui ou do Hoje pausado): a lista volta com opacidade em `base`. No lugar do convite gentil entra "Bem-vindo de volta. Comece por um hábito." ([estados.md](../estados.md)). Os hábitos com horário que já passou saem da conta de hoje, como em "hoje não se aplica". Os dias sem voltam a contar. O dia não celebra a volta.
**Estados desta tela:** a pausa marcada para o futuro usa o mesmo desenho, com o selo "Pausa marcada" e "Cancelar a pausa". No dia da volta (4h), a pausa termina sozinha e a rota volta ao formulário.

## A dois  (rota: `/ajustes/a-dois`)

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Compartilhar convite | Toque | Gera o link e abre a folha de compartilhar do iPhone (Web Share API), para mandar pelo WhatsApp ou como preferir. No computador, copia o link, com o toast "Link copiado". O cartão vira "Convite pronto · vale até 29 out", com "Cancelar convite" | Layout `calma` | `createInvite()` em `invites` | Quem abrir o link: a folha do convite |
| Cancelar convite | Toque | O link deixa de valer, com toast "Convite cancelado" e Desfazer | `calma` | `cancelInvite(id)` | Quem abrir o link vê "Este convite não vale mais" |
| Como estou hoje | Toque na linha | No `PeerCard` da prévia, "Nada compartilhado" troca pelo rostinho do humor | `Face` entra com a mola `toque` | `setSharing({ mood: true })` | Hoje da outra pessoa: o rostinho no `PeerCard` |
| Programa a dois | Toque na linha | Fica "esperando a outra pessoa" até os dois ligarem | `micro` | `setSharedHabit(id, true)` | Com os dois ligados: o hábito vira a dois nos dois Hojes |
| Escolher outro hábito | Toque | Folha com os hábitos ativos | `folha` | — | — |
| Carinho (na prévia) | — | É só desenho: não envia e não recebe foco | — | — | — |

**Depois de ligados:** o cartão do convite vira "Ligado a ..." com "Desfazer a ligação", que funciona sem confirmar e mostra o toast "Ligação desfeita" com Desfazer. O botão Carinho de verdade fica no `PeerCard` do Hoje: o coração enche com a mola `toque` e o texto vira "Enviado" por 60 s, que também é o limite de um carinho por minuto (`sendHug()` em `links/{id}/hugs`). Quem recebe vê um cartão discreto no topo do Hoje (`HugCard`) até o fim do dia ([hoje.md](hoje.md)). Vários carinhos viram um cartão só. Nada conta carinhos.
**Estados desta tela:** sem internet, "Compartilhar convite" fica apagado, com "Precisa de internet para criar o convite". Convite vencido: "O convite venceu", com "Criar outro". Quem abriu o link e escolheu "Agora não" encontra o convite em Ajustes › A dois, que mostra "1 convite".
**Implementação:** `invites/{id}` guarda `fromUid`, `fromName`, `status`, `createdAt` e `expiresAt` (7 dias). O id é um código aleatório longo, que vai no link `/convite/:id`. As regras deixam ler um convite pelo id (sem listar) a quem está logado, e aceitar só se ele estiver pendente e no prazo. Tudo roda sem servidor, no plano gratuito do Firebase. Com a ligação, nenhuma regra abre `users/{uid}` para a outra pessoa: o que é compartilhado é copiado para `links/{id}/share/{uid}` (por exemplo `moodToday`) quando o check-in é salvo e apagado quando o interruptor desliga.

## A dois · convite recebido  (folha sobre o Hoje: `?folha=convite&id=:inviteId`)

**Como chega:** a pessoa abre o link `/convite/:id` que recebeu (pelo WhatsApp, por exemplo). Se não estiver logada, entra com Google antes. O Hoje abre e a folha sobe com a mola `folha` 600 ms depois da primeira pintura. Se ela escolher "Agora não", o convite fica em Ajustes › A dois até vencer.
**Ao aparecer:** só a passagem da folha. Os avatares não se mexem.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Aceitar convite | Toque | O conteúdo troca por "Pronto. Vocês estão ligados.", com "Escolher o que mostrar" (empurra A dois na aba Ajustes) e "Fechar" | Layout `calma` | `acceptInvite(id)`, numa transação que cria `links/{id}` e grava `linkId` nos dois perfis | Quem convidou: o cartão vira "Ligado a ..." em `micro`. Os dois Hojes: o `PeerCard` entra com `fadeUp` |
| Agora não | Toque, arrasto ou X | Fecha sem gravar nada além de `seenAt` | `base` | — | Ajustes: "1 convite" |
| Recusar (em Ajustes › A dois) | Toque | Toast "Convite recusado" com Desfazer | `calma` | `declineInvite(id)` | Quem convidou continua vendo "Convite pronto" até vencer, porque recusar não avisa ninguém |

**Acessibilidade:** o foco entra no título da folha. A ordem é título, os três pontos, Aceitar, Agora não. Com letra grande, os três pontos empilham ícone e texto.

## Dados e conta  (rota: `/ajustes/dados`)

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Exportar em CSV ou JSON | Toque | Gera o arquivo e abre a folha de compartilhar do iPhone (no PC, baixa) | Nenhuma até 300 ms (abaixo) | `exportData('csv')`, sem gravar nada | — |
| Sair da conta | Toque | Sai sem confirmar e abre Entrar | Tela cheia em `base` | `signOut()` | — |
| Apagar todos os dados | Toque | Empurra Apagar todos os dados | `calma` | — | — |

**Exportar, enquanto o arquivo é gerado:** o arquivo sai dos stores, que já estão na memória, e quase sempre fica pronto antes de 300 ms. Nesse caso, a folha de compartilhar abre direto e nada mais aparece. Se passar de 300 ms, a linha de baixo vira "Preparando o arquivo…" com uma `MiniBar` que enche por coleção em `fill`, sem girador. Quando termina, a linha vira "Pronto · toque para salvar", e o segundo toque abre a folha de compartilhar, porque o iPhone só abre essa folha dentro de um toque recente. Não há toast no fim. Os nomes são `prokope-2026-10-22.csv` (registros em formato longo: dia, pilar, hábito, tipo, valor, unidade, fase) e `prokope-2026-10-22.json` (tudo). Funciona sem internet, a partir do cache.
**Estados desta tela:** sem internet e com escritas na fila, o perfil mostra "3 registros esperando internet" ([estados.md](../estados.md)). Nesse caso, Sair pede confirmação numa folha: "Ainda há registros esperando internet para subir.", com "Esperar" (principal) e "Sair mesmo assim".
**Implementação:** ao sair, chame `terminate` e `clearIndexedDbPersistence`, para outra conta no mesmo aparelho não ver o cache. Do `localStorage`, só a cópia do tema fica.

## Apagar todos os dados  (rota: `/ajustes/dados/apagar`; o quadro mostra o conteúdo aberto sob a linha)

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Exportar em JSON antes | Toque | Igual ao exportar. Depois, vira "Cópia exportada", com check | `micro` | — | — |
| Campo "apagar" | Digitar | Compara sem caixa, acento ou espaço. Quando a palavra bate, o botão acende | O botão passa de contorno a cheio em `micro`. Sem mola e sem tremida | — | — |
| Apagar tudo | Toque (só aceso e com internet) | O texto vira "Apagando…", com uma `MiniBar` por lote, e tudo trava, inclusive o voltar | `fill` por lote | `deleteAllData()` | Todas: o app vai para `/comecar/1` |

**O fluxo:** 1. `profile.deleting = true`. 2. Desfaz a ligação A dois e apaga os convites. 3. Apaga as coleções em lotes de 400 (`writeBatch`). 4. Apaga o `profile`. 5. `clearIndexedDbPersistence` e limpa o `localStorage`. 6. `replace` para `/comecar/1` (tela cheia, sobe 24 px em `base`), com a frase "Seus dados foram apagados. Quando quiser, é só começar de novo." Não há Desfazer: a palavra é a proteção ([gestos-e-feedback.md](../gestos-e-feedback.md)).
**Estados desta tela:** sem internet, o botão fica apagado, com "Precisa de internet para apagar." embaixo. Se o app fechar no meio, a próxima abertura encontra `deleting` e retoma esta tela, com a barra, antes de mostrar qualquer outra.
**Acessibilidade:** o botão travado é lido como "Apagar tudo, indisponível. Digite apagar para liberar." O campo tem `autocapitalize="none"`, `autocorrect="off"` e `enterkeyhint="done"`. Com o teclado aberto, a tela rola para o botão ficar 12 px acima do teclado (`visualViewport`).
