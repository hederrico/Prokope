# Revisão · Ajustes, parte 2

Arquivo `docs/telas/f-ajustes-2.js`. Seis telas revisadas e duas novas: **Pausar · em pausa** e **A dois · convite recebido**.

## Horários
**O que mudou**
- Não ficava claro que o horário é a meta do hábito → o texto do topo diz isso, e cada linha conta onde o horário é usado quando o nome não basta (Tarefas da casa: louça, lixo e recicláveis; Check-in: a noite do Hoje começa aqui; Deitar: alarme de preparar 10 min antes; Telas: o Hoje avisa quanto falta).
- Mudar um horário não muda o alarme já criado no iPhone, e a tela não dizia isso → rodapé "Uma mudança vale a partir de amanhã. O alarme que você criou no iPhone não muda sozinho."
- A nota da tela descreve o aviso com Desfazer depois da mudança ("Deitar às 22:30 a partir de amanhã").

**Fica para decidir**
- Editar a tolerância (15 min) por horário aqui mesmo. Contra: mais um controle numa tela que hoje é só de horários; talvez caiba melhor no detalhe do hábito.

## Lembretes
**O que mudou**
- O aviso começava pelo que o app não faz → agora começa pelo que funciona: "Os lembretes ficam nos alarmes do iPhone, que tocam até no silencioso."
- A lista não dizia de onde vêm os horários → "vêm de Horários" no grupo e o rodapé "Mudou um horário em Horários? Mude o alarme no iPhone também."
- A dica do Atalhos ("Abrir App" ao parar o alarme) provavelmente não funciona com o Prokopē: a ação Abrir App só lista apps nativos, não apps de site da Tela de Início, e abrir a URL leva ao Safari, onde o login é outro (conferir no iPhone) → troquei pela Agenda de Sono do app Saúde, que junta acordar, telas às 21h (com 1h para desacelerar) e deitar.

**Fica para decidir**
- **Atalho pronto (proposta, depende de algo externo):** publicar um atalho do app Atalhos (link do iCloud) que cria os 5 alarmes com a ação Criar Alarme. Um botão "Criar os alarmes" rodaria esse atalho com os horários da pessoa (`shortcuts://run-shortcut?name=...&input=text&text=06:50 Acordar;...`). Contra: alguém precisa publicar e manter o atalho, a ação exige iOS mais novo (conferir a versão) e o iPhone pede permissão na primeira vez.
- **Botão "Abrir o Relógio" (proposta):** usar o esquema `clock-alarm://`. Contra: a Apple não documenta esse esquema, então ele pode parar de funcionar; testar no app instalado.
- Conferir no iPhone em português os nomes "Agenda de Sono" e o do modo de sono.

## Aparência
**O que mudou**
- Não estava claro o que acontece com o Reduzir Movimento ligado no iPhone → aparece um aviso azul dentro do grupo, só nesse caso: "Aqui nada se desloca: só a cor muda, devagar." O interruptor continua valendo: desligado, nem a cor anima.
- O texto de Animações era sobre o sistema → agora diz o que anima (mola do check, números rolando, brilho do dia fechado).
- Som: "Respeita o silencioso". Ao ligar o som, ele toca uma vez para a pessoa ouvir.

**Fica para decidir**
- Uma linha "Vibrar ao marcar" (o truque do interruptor nativo). Contra: o design system trata a vibração como um extra automático.

## Pausar
**O que mudou**
- "Termina sáb, 2 jan" deixava em dúvida se o dia 2 era pausado → os campos agora são "Começa" e "Volta" (dom, 3 jan), e a faixa ganhou o dia da volta como um bloco cheio com ▶ (forma diferente da hachura).
- Os dois campos de data abrem o calendário numa folha na metade de baixo da tela, ao alcance do polegar com uma mão.
- Não estava definido o que acontece com os "dias sem" → rodapé: ficam parados e seguem de onde estavam.
- "Motivo" ganhou "opcional". A legenda diz onde voltar antes: "aqui ou no Hoje".
- **Tela nova "Pausar · em pausa"** (imaginando 27 dez): selo "Em pausa · Férias", "Até sábado, 2 de janeiro.", faixa com hoje em anel e os dias passados mais claros, campo Volta para estender ou encurtar, e os botões "Voltar hoje" e "Voltar amanhã" embaixo. Nenhum dos dois pede confirmação. Uma pausa só marcada (antes do dia 24) mostra Mudar datas e Cancelar a pausa.

**Fica para decidir**
- Os "dias sem" ficam parados durante a pausa (aplicado). A alternativa é continuar contando. Contra: nas férias a pessoa não registra deslize, e a contagem ficaria sem lastro.
- Pausa sem data de volta (para doença). Não apliquei: a pessoa estende pela tela Em pausa. Contra: uma pausa sem fim pode virar abandono silencioso.
- Um registro feito durante a pausa (por exemplo, o peso) conta como extra e nunca como cobrança? Combinar com o grupo I (Hoje pausado).
- Os dois botões de volta. Para simplificar, poderia ficar só "Voltar hoje", com a regra "o que já passou do horário não conta".

## A dois
**O que mudou**
- As opções em rádio (Nada, Só humor, Hábitos) não combinavam com "Hábitos compartilhados", porque quem escolhia Nada ainda podia ligar o Programa a dois → viraram interruptores, todos desligados: "Como estou hoje" e o grupo "Hábitos a dois" (Programa a dois e "Escolher outro hábito"). Desligado continua sendo Nada.
- A privacidade era só texto → entrou uma prévia "Assim você aparece no Hoje dela": o nome, "Nada compartilhado" e o botão Carinho. Fica visível que não existe placar e que o carinho é a única interação.
- Convite: o campo pede o "E-mail Google". O convite fica preso a essa conta e aparece no Prokopē da outra pessoa, sem link para encaminhar. Um link aberto no iPhone cairia no Safari, fora do app instalado.
- Rodapés: "Um hábito vira a dois só quando os dois ligam" e "Ninguém vê número, contagem ou sequência do outro."
- **Tela nova "A dois · convite recebido"**: uma folha sobre o Hoje da outra pessoa, com os avatares, "Henrique convidou você para um espaço a dois", 3 pontos (cada um vê só o seu; tudo começa desligado; carinho sem placar), "Aceitar convite" e "Agora não". Abaixo: "Recusar não avisa ninguém."

**Fica para decidir**
- Mandar e-mail de convite precisa de Cloud Functions (ou da extensão Trigger Email). Sem isso, se a outra pessoa ainda não usa o app, alguém precisa avisá-la por fora.
- Onde o carinho aparece no Hoje de quem recebe (um cartão discreto que some no dia seguinte, sem contagem nem histórico). Precisa ser desenhado no Hoje.

## Dados e conta
**O que mudou**
- "Apagar todos os dados" ficava colado em "Sair da conta" → agora fica num grupo próprio no fim da tela.
- A confirmação era só "Cancelar" e "Apagar tudo" → agora diz o que some ("32 dias de registros, 4 pilares, 16 hábitos e as fases"), avisa que a conta Google continua igual, oferece "Exportar em JSON antes" e pede que a pessoa digite **apagar**. Só depois disso o botão acende. Tudo em tom de atenção, sem vermelho.
- O rodapé da exportação diz que o iPhone pergunta onde salvar (pela folha de compartilhar).

**Fica para decidir**
- Prazo de arrependimento: apagar em 7 dias e permitir cancelar entrando de novo. Seguiria a regra "desfazer em vez de confirmar". Contra: precisa de uma função agendada no Firebase, e quem quer apagar já teria que esperar.
- Apagar também o login (Firebase Auth), que exige um login recente, ou só os dados.

## Pedidos para a base
- `base.css`: `.phone p, .phone h1, ... { margin: 0 }` vence as classes dos grupos (um `<p class="xx">` perde a margem). Sugestão: `:where(.phone) :where(p, h1, h2, h3, h4) { margin: 0; }`.
- Estado desabilitado comum: `.btn.off { opacity: .45; pointer-events: none; }` e `.sw.off { opacity: .45; }`. Salvar só depois de preencher e Apagar só depois da palavra precisam disso.
- Um helper de rodapé de grupo, como nos Ajustes do iPhone: `.gfoot { padding: 8px 20px 0; font: 400 13px/18px var(--font-ui); color: var(--text-3); }`. Hoje cada grupo faz o seu (`.xf-foot`, `.xe-hint`).
- Um helper `toast(texto, acao)` para o aviso com Desfazer, acima da barra de abas, já que "toda ação tem Desfazer por 5 segundos" aparece em várias notas.

## Depois da auditoria
- Base: `.xf-days` → `days([0, 3], { p: 'familia' })`; `.xf-tm` → `tval()`; `.xf-tag` → `tag('fase 4')`, neutro; `.xf-lead` e `.xf-hero p` → `.lead`; `.xf-foot` → `.foot`; `.xf-mp` → `mbar()` (a mini tela define `--track` e `--mark`); `.xf-prof` → `.profile`; `.xf-wbtn` → `btn(..., { kind: 'warn' })`; `.xf-add` → `addRow()`.
- Área de toque: os controles pequenos são `tval`, `chip` e `btn.sm`, que já têm 44 px na base, e cada interruptor é ligado pela linha inteira. Não precisei de `hit`, que no `.sw` brigaria com o `::after` do botão do interruptor.
- Pausar, Pausar · em pausa e A dois: a barra ficou só com "‹ Ajustes", sem repetir o título da serifa.
- Em pausa: "Voltar hoje" e "Voltar amanhã" viraram um botão só, "Encerrar a pausa" (secundário), com o mesmo nome do Hoje pausado. Quem quer voltar amanhã muda a data de volta. Isso resolve o "Fica para decidir" dos dois botões.
- Registro durante a pausa: fica no histórico e o dia continua fora da conta, como no Hoje pausado do grupo I. Isso resolve a pergunta deixada em Pausar.
- Glossário: "contam como cumprido" → "contam como feito"; "22:30" na nota → "22h30". A lista de alarmes de Lembretes manteve "06:50", porque reproduz o Relógio do iPhone, onde a pessoa digita.
- Cor de pilar: a Dica de Lembretes, os itens de Aparência e de Dados e conta e a Revisão da semana passaram para a bolha neutra. Em A dois, o coração, o botão Carinho e o convite passaram para a primária. A cor do pilar ficou só no que é hábito: Acordar, Check-in, Telas, Deitar, Fim da cafeína, Tarefas da casa (louça e lixo), os dias de coleta (lixo) e Programa a dois.
- Aparência: com o Reduzir Movimento do iPhone ligado, o interruptor Animações aparece desligado e travado, e o aviso diz onde mudar. Isso segue movimento.md, onde o interruptor do app só reduz.
- Horários: "Uma mudança vale a partir de amanhã" → "Vale a partir de hoje, e os dias que passaram ficam como estavam", como em comunicacao.md (o Hoje reagrupa na hora). Um registro já feito hoje guarda a meta que valia quando foi feito.
- Revisão da semana: dia e hora num só `tval('dom, 18:00')`, que abre uma folha com o dia e a roda. Assim o título não quebra linha.
- Dados e conta: Apagar é uma tela própria, como em gestos-e-feedback.md. O quadro mostra o conteúdo dela aberto sob a linha, que agora tem a seta (chevron).
- Leitor de tela: nomes nos interruptores, no controle segmentado, na faixa de dias da pausa, nas prévias de tema (grupo de rádio) e na folha do convite.
