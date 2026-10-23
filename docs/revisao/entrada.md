# Revisão · Entrada e Computador

## Entrar
**O que mudou**
- Em 5 segundos não dava para saber que é um app de hábitos → nova linha "Poucos hábitos por vez, no seu ritmo." abaixo da frase principal, que ficou mais forte (18 px, cor de texto).
- A promessa de privacidade estava em 12 px cinza-claro → 13 px em `text-2`, com o cadeado. O texto continua o mesmo.

**Fica para decidir**
- No app real, o botão deve usar o "G" colorido oficial do Google (regra de marca do Google). O ícone do Phosphor é monocromático e fica só no quadro.

## Começar · 1 de 3
**O que mudou**
- A pessoa não sabia o que vinha no plano base nem que poderia tirar algo → texto "4 pilares e 7 hábitos para começar. No próximo passo, você escolhe quais ficam."
- "Fase" aparecia sem explicação → linha com pegadas: "Os hábitos chegam aos poucos, em fases de 3 semanas. Você decide quando avançar."
- Não havia saída para quem entrou com a conta errada (ou num computador dividido) → "Entrou como Henrique · Trocar de conta" embaixo do botão.

## Seus pilares · 2 de 3
**O que mudou**
- Os 7 hábitos entravam sem a pessoa nunca vê-los, e para a esposa vinha o plano de outra pessoa → cada pilar mostra os hábitos da fase 1 como chips que saem com um toque (marcado = cor do pilar e ✓; desmarcado = neutro e +).
- Um exemplo desmarcado ("Sem Shorts e TikTok") mostra o estado opcional sem mudar a contagem de 7.
- A descrição genérica do pilar virou "Depois: …", para quem decide manter um pilar que hoje tem um hábito só (Corpo, Alimentação).
- Caminhada aparece em Corpo ("também em Família") e em Família, a mesma marcação nos dois.
- Legenda do botão "7 hábitos escolhidos", que muda ao vivo. Tela com rolagem e botão fixo.
- Seta de voltar com alvo de 44 × 44 (antes 36).

**Fica para decidir**
- Peso, cintura e tempo de tela ("só medindo" na fase 1) ficaram fora do primeiro acesso. Sugiro que comecem desligados e sejam ligados em Progresso: pesar todo dia pode pesar para quem está num momento difícil. Contra: o plano do Henrique tem peso desde a fase 1, então ele precisaria ligar.
- Botão "Pular" não foi adicionado: "Continuar" já aceita os padrões com um toque, e os horários são pessoais demais para pular sem olhar.
- No caminho "Do zero", este passo abre vazio, com "Criar o primeiro pilar" (a tela Novo pilar do grupo E).

## Sua rotina · 3 de 3
**O que mudou**
- Faltavam itens que o plano base precisa: "Tarefas da casa · louça e lixo · 20:30" e "Coleta do lixo" com os dias (seg e qui ligados). Sem isso, o hábito do lixo não sabe quando aparecer.
- Revisão ganhou horário (dom 18:00), igual a Ajustes · Horários.
- Pílula de horário no mesmo estilo de Ajustes (fundo `track`, 16 px). A linha inteira é o alvo de toque.
- Texto de apoio virou ação: "Toque num horário para ajustar ao seu ritmo."
- O que acontece depois de "Começar a fase 1" ficou claro: legenda "Fase 1 · Base · 7 hábitos · começa hoje", e a nota diz que o botão abre direto o primeiro Hoje (Hoje · primeiro dia, grupo I).

**Fica para decidir**
- Se o primeiro acesso acontecer depois das 20h, a fase deveria começar amanhã e a legenda dizer "começa amanhã".

## Sua rotina · ajustar horário (nova)
**O que mudou**
- Faltava mostrar o seletor de hora → folha baixa com a mesma roda da folha Acordei às, de 5 em 5 minutos.
- Mostra "8h50 até acordar às 06:50" ao vivo e o interruptor "Telas desligadas 1h antes", que acompanha o horário de deitar.

## Computador · Hoje
**O que mudou**
- Os dados misturavam horários: "Bom dia" com a proteína das 12h41 e a água da tarde → a tela agora é às 12h41, "Boa tarde". Proteína 46 g, água 1,5 L, caminhada 2 de 7 e almoço sem nota batem com o celular nessa hora.
- Faltava o cartão de orçamentos do Hoje (refeições livres 0 de 2, tranqueiras 0 de 2) → entrou na coluna da direita.
- Faltava o aviso gentil da caminhada de ontem → faixa em Família logo abaixo da caminhada, com o mesmo texto do celular.
- O check-in aparecia duas vezes (cartão à direita e linha na Noite) e mostrava o humor de ontem no meio do dia → sai o cartão. O check-in fica na Noite e sobe para o topo às 20h30, como no celular.
- Mouse e teclado: campo "Registrar · Ctrl K" na barra lateral, linha sob o mouse com o check antecipado e seletor de conta no rodapé (trocar de conta num computador dividido).
- Colunas iguais, para os botões de proteína caberem em duas linhas. A área principal rola sozinha e a barra lateral fica fixa.

**Fica para decidir**
- Em telas de 1440 px ou mais, limitar o conteúdo a uns 1100 px ou abrir uma terceira coluna para a Noite.
- Os pilares da barra lateral podem virar atalhos para Progresso com o filtro do pilar.

## Computador · registrar pelo teclado (nova)
**O que mudou**
- O PC não tinha vantagem própria → Ctrl K abre uma busca com os registros mais prováveis para a hora: nota do almoço com as teclas 1 a 5, frango +30 g, água +500 ml e marcar a caminhada.
- Atalhos que valem: Ctrl K (⌘K no Mac), ↑ ↓ e Espaço na lista de hábitos, 1 a 5 na nota em foco, Ctrl Z para desfazer, Esc e ? para a lista de atalhos.

## Pedidos para a base
- `.ibtn` (36 px), `.xbtn` (32 px) e `.chip` (34 px) ficam abaixo de 44 px. Sugestão: `.ibtn, .xbtn, .chip { position: relative; } .ibtn::after, .xbtn::after, .chip::after { content: ""; position: absolute; inset: -6px; }` para aumentar a área de toque sem mudar o desenho.
- A pílula de horário existe em dois arquivos (`.xa-time`, `.xf-tm`). Sugestão: `.tm { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 8px; background: var(--track); color: var(--text); font: 500 16px/20px var(--font-ui); font-variant-numeric: tabular-nums; white-space: nowrap; }` e `function tm(t) { return '<span class="tm">' + t + '</span>'; }`.
- A roda de horário existe em dois arquivos (`.xb-wheel`, `.xa-wheel`). Sugestão: um helper `wheel(horas, minutos, selH, selM)` na base.
- A barra de progresso de 3 trechos se repete no primeiro acesso e na revisão de domingo. Sugestão: `.steps` com `i.on` e `i.half` na base.
- Para o computador: `.kbd` (tecla) na base, para os atalhos aparecerem iguais em qualquer tela.

## Depois da auditoria
- Topo dos 3 passos: `.xa-top` e `.xa-steps` → `stepTop(n, 3, { back: true })`, sem X (antes do plano não há para onde sair; a saída do passo 1 é "Trocar de conta").
- Textos de apoio: `.xa-ey` → `.eyebrow`, `.xa-lead` → `.lead`, `.xa-hint` e as legendas → `.foot` / `.foot.c`.
- Opções do passo 1: `.xa-opt` → `.opt` com `radio()`; "Sugerido" → `tag()`; bolinhas dos pilares → `tag(..., { dot: true })`.
- "Criar outro pilar" → `addRow()`; horários → `tval()`; dias de coleta → `days([0, 3])`; revisão num valor só, "dom, 18:00", para o título não quebrar.
- Área de toque: "Trocar de conta" com `hit`; a base já cobre `tval`, `chip`, `chk`, `dop` e `addp`. A tecla (`.xa-kbd`) e o desenho da roda do iPhone ficam no meu arquivo.
- Computador · Hoje refeito pelas regras do Hoje: sem avatar e sem cartão da fase na barra lateral, `weekCard(4, 76, ...)` com "4 de 12 feitos hoje", "Boa tarde, Henrique".
- Manhã recolhida em `fold()` "Tudo feito · peso, acordar e caminhada" e Noite recolhida em "6 hábitos", como no Hoje · tarde.
- Convite gentil: não aparece às 12h41, porque a caminhada já foi feita de manhã (4 de 12 conta com ela). Seguir o Hoje · tarde venceu o pedido de pôr o convite na linha; ele usa `.nudge` só enquanto a linha está sem registro.
- Almoço com `doPill('Dar nota')`; água com `addPill()`; proteína com os botões `.qa` da hora (frango, feijão, queijo, Mais).
- Coluna da direita = o que não tem hora: Limites da semana com `plusBtn()` (tranqueiras 1 de 2, como no Hoje) e Dias sem com `semTile()`.
- Insight: "24 dias com · 8 dias sem".
- Ícone de "Sem Shorts e TikTok": `video-camera-slash`.
- Registrar pelo teclado: fundo atualizado com o Hoje novo; a sugestão "marcar a caminhada" virou "Futebol", porque a caminhada já foi feita.
- Ctrl K continua como busca central e não como painel de 420 px. A diferença está explicada em `docs/interacao/telas/entrada.md`.
- Glossário: "conta como cumprido" → "conta como feito" (aviso e nota da Rotina); "Desligar um pilar" → "Pilar fora do plano fica arquivado, com os hábitos guardados"; horário no texto como "6h50" e "21h", com "06:50" só nos seletores. A descrição de Mente não usa "gratidão".
- Barra lateral do PC: o seletor de conta saiu com o avatar, e "Atalhos do teclado" (?) ocupa o rodapé.
- "Sua rotina · ajustar horário": a folha com roda própria saiu. Tocar num horário abre a roda do próprio iPhone, presa ao valor (`TimeValue` com o campo nativo, como pedem `componentes.md` e `gestos-e-feedback.md`), sem "Pronto". As telas desligadas acompanham o deitar.
