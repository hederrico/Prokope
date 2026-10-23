# Tutorial com o Zeno · interações e animações

O Zeno (a tartaruga de [../../mascote/README.md](../../mascote/README.md)) acompanha o primeiro acesso e depois ensina o app de verdade: onde as coisas ficam, como se marca e registra, onde se vê cada coisa e onde ficam as comparações. O tutorial é dividido em capítulos, e todos ficam em Ajustes › Tutorial para rever a qualquer momento.

## Decisões

- **O Zeno não entra na abertura.** A abertura precisa pintar no primeiro instante, e o Zeno pesa uns 150 KB do three.js. A primeira aparição dele é no passo 1 do Começar.
- **O básico agora, o resto em capítulos.** Logo depois do Começar vem "O dia" (uns 2 minutos, no Hoje). Os outros capítulos o Zeno oferece uma vez, na primeira vez que a pessoa abre cada aba.
- **Primeiros passos à parte.** Para treinar marcar, somar e dar nota sem sujar o histórico, o Hoje ganha o grupo "Primeiros passos" durante "O dia". Ele fica fora de `marks` e `entries`, e nunca entra na constância, na força nem nos padrões. Do grupo, fica uma entrada só na Jornada.
- **Exemplo marcado nas telas que pedem dados.** Uma conta nova não tem histórico. Em "O hábito e os padrões", "O progresso" e "A jornada", as telas mostram a história de exemplo da demonstração, com a faixa "Exemplo · nada aqui é seu". No fim, tudo volta para os dados da pessoa, e nada do que ela tocou no exemplo fica salvo.
- **As contas que já existiam** recebem uma oferta só: "Oi, eu sou o Zeno. Quer conhecer o app comigo?", com "Agora não".
- **Sem o Zeno** (desligado em Ajustes › Aparência, ou num aparelho que não desenha WebGL), o tutorial funciona igual, só com o balão. Nesse caso, o Zeno não oferece capítulos sozinho.

## Peças

| Peça | Onde mora | O que faz |
|---|---|---|
| Zeno | `src/zeno/` (`useZeno`, `<ZenoHost />`) | O personagem por cima da tela, carregado sob demanda. Entra, anda, olha, aponta para um elemento de verdade, fala (mexe a cabeça), comemora e sai. Não desenha texto |
| Condutor | `src/tutorial/` e `src/stores/tour.ts` | Roda os passos de um capítulo: navega, põe o anel no alvo, mostra o balão, espera a ação ou o "Próximo" e grava o progresso |
| Balão | `src/tutorial/` | O texto do passo, perto da cabeça do Zeno (ou do alvo, sem ele), com "Próximo", "Sair do tutorial" e "3 de 9" |
| Primeiros passos | Hoje, enquanto `useTour().practice` | Três linhas de treino, com os mesmos componentes e gestos das linhas de verdade |
| Modo exemplo | `src/data/example.ts` (`useExample`) | Troca as telas para uma cópia em memória da história de exemplo, e volta |
| Estado guardado | `profile.tutorial` (`tutorialOf`) | A apresentação, os capítulos vistos, os oferecidos e os Primeiros passos |

## Camadas

Por cima do app, nesta ordem: o véu do passo (z-index 60), o Zeno (70) e o balão (80). As folhas ficam abaixo (40), então o Zeno pode apontar para dentro de uma folha. Os toasts ficam acima de tudo, como hoje.

## Passos

Cada passo de um capítulo diz:

- **onde:** a rota (o condutor navega, se precisar);
- **alvo:** um elemento com `data-tour="..."` (o condutor rola até ele);
- **texto:** a frase do balão, na voz do Zeno;
- **espera:** "Próximo" (passo de olhar) ou uma ação de verdade (passo de fazer), como `pp-mark`;
- **Zeno:** o gesto do passo (apontar, acenar, sentar, comemorar).

- **Passo de olhar:** um anel no alvo e o balão com "Próximo". Um véu leve escurece o resto, e o toque fora do alvo não faz nada.
- **Passo de fazer:** o mesmo anel, e só o alvo responde. Quando a pessoa faz a ação, o Zeno reage (aceno de cabeça ou "Isso.") e o passo anda sozinho.
- **Sempre à vista:** "Sair do tutorial" no balão. Sair no meio não marca o capítulo como visto e não apaga nada.
- **Fechar o app no meio:** o capítulo não fica como visto. Na próxima vez, nada aparece sozinho, e o capítulo continua em Ajustes › Tutorial.

## Formato dos passos

Os roteiros ficam em `src/tutorial/scripts/`, um arquivo por roteiro (`hoje.ts`, `habito.ts`...), no formato de `src/tutorial/types.ts`. Escrever um capítulo é só preencher este formato: o condutor faz o resto.

```ts
const hoje: TourScript = {
  run: 'hoje',
  example: false,                         // padrão: o "example" do capítulo em CHAPTERS
  exampleHome: 'tab',                     // ao sair do exemplo: a raiz da aba (padrão), uma rota, ou null
  enter: (ctx) => ctx.setPractice(true),  // gancho do roteiro, no começo (pode ser assíncrono)
  leave: (ctx) => ctx.setPractice(false), // na saída: (ctx, 'done' | 'stop')
  then: undefined,                        // ao terminar, começa outro roteiro, com o Zeno junto
  steps: [
    {
      id: 'marcar',                       // nome curto, para os testes (__pkTour.state.stepId)
      where: '/hoje',                     // a rota; ou (ctx) => caminho
      target: 'pp-mark',                  // data-tour="pp-mark"; ou um seletor CSS; ou (ctx) => Element
      around: '[data-tour="pp-group"]',   // opcional: um ancestral do alvo que o balão também não cobre
      text: 'Toque no círculo para marcar.',
      wait: { event: 'pp-mark' },         // 'next' | 'tap' | { event, match? } | 'none'
      reply: { text: 'Isso. Um pé depois do outro.', zeno: 'nod', ms: 1600 }, // depois da ação
      zeno: 'point',                      // ou uma lista: ['wave', 'point']
      place: 'near',                      // 'near' | 'top' | 'bottom' (sem o Zeno em cena)
      when: (ctx) => true,                // falso pula o passo ("Dias sem" só se o plano tiver)
      timeout: 3000,                      // quanto espera o alvo aparecer antes de pular
      nextLabel: 'Próximo',               // só no passo de olhar; no último, o padrão é "Concluir"
      enter: (ctx) => {}, leave: (ctx) => {}, // ganchos do passo
    },
  ],
};
```

| Campo | O que faz |
|---|---|
| `where` | O condutor navega pelo router se a pessoa está em outra rota, e espera a rota chegar (até 4 s). A busca (`?periodo=mes`) vai junto na navegação, mas a comparação é só pelo caminho |
| `target` | Um nome sem pontuação vira `[data-tour="nome"]`. O condutor espera o alvo existir e ficar parado (a passagem da tela, a cascata) e rola até ele. Um alvo que não aparece em `timeout` faz o passo ser pulado e sair da conta |
| `wait: 'next'` | Passo de olhar: o balão tem "Próximo" e o véu segura todos os toques, até no alvo |
| `wait: 'tap'` | Passo de fazer: só o alvo responde. O toque segue para ele e faz o que sempre faz (abrir, navegar); o passo anda logo depois |
| `wait: { event }` | Passo de fazer: espera o aviso pelo canal `onTour` (`pp-mark`, `pp-add`, `pp-rate`, `undo` ou um `custom`). `match` filtra (`(e) => e.type === 'pp-rate' && e.rating === 5`). Sem alvo, o passo fica sem véu |
| `reply` | A resposta depois da ação: o texto troca no mesmo balão, sem botão, o Zeno faz o gesto (padrão: aceno de cabeça) e o passo anda depois de `ms` |
| `when` | Avaliada no começo (para a conta "3 de 9") e de novo na hora do passo. Use `ctx.hasHabitType('budget')`, `ctx.habits()` ou `ctx.path()` |
| `zeno` | `wave`, `point` (aponta para o alvo), `look`, `nod`, `hop`, `sit`, `stand`, `rest`, `celebrate` (aceno de cabeça), `party` (pulinho e aceno), `shell`. Sem o Zeno, nada acontece |
| `place` | Sem o Zeno em cena: `near` fica perto do alvo sem cobri-lo (sem alvo, embaixo, acima da barra de abas); `top` e `bottom` encostam na borda, com a ponta apontando para o alvo |

**O contexto** (`ctx`) traz `run`, `path()`, `navigate(to)`, `zeno` (o controlador), `example` (o modo exemplo), `setPractice(on)` (o grupo Primeiros passos no Hoje), `habits()` e `hasHabitType(type)`.

## Condutor

O condutor (`src/tutorial/conductor.ts`) roda um roteiro por vez. Quem escreve no `useTour` (`run`, `step`, `practice`) é só ele.

1. **Começo:** o gancho `enter` do roteiro, o modo exemplo (nos capítulos com exemplo) e o Zeno, que entra por baixo se estiver disponível.
2. **Cada passo:**
   1. entre um passo e outro, o balão sai e o anel some, e o véu fica;
   2. navega até `where`, espera o alvo e rola até ele, deixando lugar para o balão embaixo;
   3. roda o `enter` do passo e mostra o anel, o véu e o balão, com o foco no balão;
   4. pede o gesto ao Zeno e a fala (`talk`);
   5. espera a ação; mostra a resposta; roda o `leave`.
3. **Fim:** grava o capítulo como visto (`markChapterDone`, só a primeira vez e só se algum passo apareceu), roda o `leave` do roteiro, sai do exemplo, desliga o `practice` e manda o Zeno embora. Com `then`, o próximo roteiro começa com o Zeno em cena.
4. **Sair** (`stopTour`, o botão "Sair do tutorial", `Esc` com o foco no balão, ou começar outro capítulo): a tela fica limpa na hora (véu, anel, balão e `practice`). Depois sai do exemplo e manda o Zeno embora. Nada é gravado. Começar outro capítulo espera o de antes sair, e só então começa. Vale também para um capítulo que acabou de terminar e ainda está saindo: o último passo de "Os ajustes" abre a lista dos capítulos, e a pessoa pode tocar noutro na hora. O novo espera os dados da pessoa voltarem (o exemplo sair), mas não o Zeno ir embora. Sem essa espera, a saída de antes levaria junto o exemplo do capítulo novo.
5. **Sair do exemplo** (no fim ou no meio): antes de os dados da pessoa voltarem, o condutor leva a pessoa para a raiz da aba de agora (`exampleHome: 'tab'`, o padrão), para uma rota (`exampleHome: '/progresso'`) ou a deixa onde está (`exampleHome: null`). Uma tela do exemplo, como um hábito que só existe na história, mostraria "Este hábito não existe mais."

**Modo acompanhar** (`follow`, o Começar): sem véu e sem navegar. Cada passo aparece uma vez, quando a pessoa chega à rota dele, e o balão se recolhe quando ela toca na tela, abre uma folha ou o alvo some. Chegar a `follow.end` termina o roteiro e começa o `then`; sair de `follow.within` por outro caminho (trocar de conta) termina sem seguir. O foco fica com o título do passo, e o balão não tem "Sair do tutorial": ele não segura nada.

**O balão** fica perto da cabeça do Zeno (`zeno.anchor()`) quando ele está em cena; sem ele, perto do alvo, sem cobri-lo. Ele fica dentro da área segura, fora da barra de abas, do pé preso de uma tela cheia e do teclado, e acompanha a rolagem, o giro, o teclado e as mudanças de tamanho do alvo. A conta da posição é pura (`src/tutorial/placement.ts`, com testes).

**O desenho** (`TourScene`) carrega sob demanda, na primeira vez que o tutorial aparece. A camada (`TourLayer`) fica uma vez só no `RootLayout` e liga o condutor ao router, ao Zeno e ao modo exemplo.

**Para quem escreve os roteiros:**

- Ponha `data-tour` nos alvos (um nome curto, `pg-semana`), em vez de seletores de classe. O roteiro mínimo de "O dia" ainda usa um seletor provisório: `[data-flip="week"] .pk-card` (a semana do Hoje).
- Um invólucro com a margem da tela (o `st-pad` de um grupo de Ajustes, o `hb-pad` do hábito) deixaria o anel encostado nas bordas e com canto reto. Nesse caso, o alvo é o filho: `'[data-tour="ajustes-plano"] > *'`, e o anel acompanha o canto do cartão.
- Um passo de fazer que depende do que a tela fez (um dia aberto, o período trocado) espera um aviso `custom` da tela, em vez do toque: `emitTour({ type: 'custom', name: 'habito-dia' })`. Assim, um toque num dia por vir não anda o passo.
- Depois de um passo de fazer que empurra outra tela (o cartão do treino), o passo seguinte fica sem `where`: o toque já navega, e o condutor não navega de novo enquanto a rota chega. O foco fica com o título da tela nova, e o balão é anunciado.
- Um alvo grande (um cartão inteiro) é melhor que um pequeno demais: o anel cresce 6 px em volta e o balão precisa de lugar embaixo ou em cima.
- Um passo dentro de uma folha funciona (a folha fica abaixo do véu), mas a folha prende o foco: confira o foco do balão com o teclado nesse caso.
- Os alvos dos Primeiros passos: `pp-group`, `pp-mark`, `pp-add`, `pp-rate` e `pp-journey`, e, dentro da folha de nota de treino (`primeira-nota`), `pp-rate-options` e `pp-rate-save`.
- A camada fica dentro de `.sh-app`, no mesmo contexto de empilhamento das folhas e do palco do Zeno: é isso que faz a ordem véu 60, Zeno 70 e balão 80 valer.

## Voz

A do README do Zeno: frases curtas, no presente, tratando por "você". Nunca "falhou", "esqueceu", "de novo" ou "ainda não", e nunca conta o que faltou. A nota 1 e a nota 5 recebem o mesmo "Obrigado por contar." Na revisão, os textos seguem o tom de [../../visao.md](../../visao.md).

## Começar (primeiro acesso)

O Zeno conversa uma vez por passo e depois fica à toa num canto, sem véu: a pessoa usa a tela normalmente.

| Passo | O Zeno | Texto |
|---|---|---|
| 1 · Como começar | Entra por baixo, acena e aponta para as opções | "Oi, eu sou o Zeno. Vou com você nos primeiros passos." Depois: "Dá para começar com o plano base, que já vem com fases, ou do zero." |
| 2 · Seus pilares | Aponta para o primeiro chip (plano base) ou para "Criar o primeiro pilar" (do zero) | "Cada pilar é uma parte da sua vida. Toque num hábito para tirar ou pôr de volta." / "Crie o primeiro pilar. Dá para mudar tudo depois." |
| 3 · Sua rotina | Aponta para o primeiro horário | "Seus horários guiam o dia. Dá para mudar depois em Ajustes › Horários." |
| Começar a fase 1 | Vai junto para o Hoje | Começa "O dia" |

`tutorial.introAt` é gravado no passo 1 (e de novo no fim, uma vez só, para o primeiro login com Google, em que o perfil pode chegar depois).

- **O roteiro:** `comecar` em `scripts/comecar.ts`, no modo acompanhar. A tela do Começar começa o roteiro ao montar, e chegar ao Hoje começa "O dia" pelo condutor.
- **Onde fica o balão:** no passo 1, embaixo, no espaço vazio acima do Continuar, apontando para as opções. Nos passos 2 e 3, em cima, cobrindo por inteiro o título do passo (`.ob-head`), com a ponta apontando para o alvo. Assim ele nunca cobre os chips, os horários nem o Continuar.
- **Alvos:** `ob-opcoes` (as duas opções), `ob-chips` (os chips do primeiro pilar com hábitos), `ob-novo-pilar` ("Criar o primeiro pilar", do zero) e `ob-horario` (o primeiro horário).
- **Recolher:** o primeiro toque fora do balão, uma folha aberta (o formulário do pilar) ou o alvo sumindo recolhem o balão. Com o Zeno, ele fica à toa (`rest`). Voltar a um passo já visto não repete o balão.
- **Sem o Zeno:** tudo igual, só com o balão.

## Capítulo "O dia" (`hoje`)

No Hoje. O grupo Primeiros passos entra no topo da lista com `fadeUp` e sai no fim com opacidade.

1. **O dia:** aponta para o primeiro grupo. "Este é o seu dia. Os hábitos ficam em Manhã, Ao longo do dia e Noite."
2. **Primeiros passos:** aponta para o grupo. "Separei três primeiros passos para treinar. Eles não contam nos seus números."
3. **Marcar** (fazer, `pp-mark`): "Toque no círculo para marcar." Depois: aceno de cabeça e "Isso. Um pé depois do outro."
4. **Desfazer:** aponta para o toast. "Marcou sem querer? O Desfazer fica aqui embaixo por alguns segundos."
5. **Somar** (fazer, `pp-add`): "Alguns hábitos somam, como a água. Toque no +."
6. **Dar nota** (fazer, `pp-rate`): "As refeições recebem uma nota de 1 a 5. Dê uma nota." Depois: "Obrigado por contar."
7. **O hábito:** aponta para o nome de uma linha de verdade. "Toque no nome para ver o calendário do hábito. Segure a linha para o menu: pausar ou tirar só de hoje."
8. **A semana:** aponta para o cartão da semana. "Aqui fica a sua semana. Toque num dia que passou para corrigir."
9. **Jeitos de ver:** aponta para o botão do topo. "Este botão troca o jeito de ver o dia: resumo, lista completa ou linha do tempo."
10. **O check-in:** "À noite, a partir das 20h30, aparece o check-in: como foi o dia, em poucos toques." (o horário é o da pessoa).
11. **Fim:** pulinho e aceno. "Pronto. Os Primeiros passos ficaram guardados na sua Jornada. Para rever, é em Ajustes › Tutorial." O Zeno sai.

Passos condicionais: "Dias sem" e os limites (refeições livres, tranqueiras) entram só se o plano tiver. O capítulo funciona também no estado da noite, no dia fechado e em "Seu plano começa amanhã".

## Capítulo "O hábito e os padrões" (`habito`, com exemplo)

Abre a caminhada da história de exemplo (sim ou não, com "Também conta em" e semanas de dados) na tela do hábito. Oito passos, um de olhar por vez e dois de fazer, no calendário. O roteiro está em `scripts/habito.ts`.

| Passo | Alvo | Espera | Texto |
|---|---|---|---|
| 1 · `topo` | `habito-topo` (o topo, com as etiquetas dos pilares) | Próximo | "Cada hábito tem uma tela assim. As etiquetas são os pilares: o dele e os de "Também conta em"." |
| 2 · `forca` | `habito-numeros` (força, nesta semana e total) | Próximo | "A força do hábito cresce com a constância e cai devagar. Um dia sem não zera nada. Ao lado, a semana e o total." |
| 3 · `calendario` | `habito-calendario` | Próximo | "No calendário, cheio é feito, meio cheio é parcial e pontilhado é fora da agenda. A legenda fica embaixo." |
| 4 · `dia` | `habito-calendario` | aviso `custom` `habito-dia` (um dia abriu) | "Toque num dia que passou para corrigir. Aqui é exemplo: pode tocar à vontade." |
| 5 · `corrigir` | `habito-corrigir` (as opções da folha) | toque | "Escolha como foi esse dia. Dá para desfazer no aviso que aparece embaixo." Depois: "Isso. É assim que se corrige um dia." |
| 6 · `padroes` | `[data-tour="habito-padroes"] > *` (o cartão do padrão) | Próximo | "Aqui o app compara os dias com e sem este hábito. Nos de horário, como o Acordar, compara os dias no horário com os outros." |
| 7 · `menu` | `habito-menu` (o ⋯; em Ajustes, o Editar) | Próximo | "No ⋯ fica o menu: editar o hábito ou tirar só de hoje." Em Ajustes: "Em Editar você muda o nome, a meta, a agenda e os pilares." |
| 8 · `pausar` | `[data-tour="habito-pausar"] > *` (Pausar e Arquivar) | Concluir | "No fim da tela, você pausa o hábito por uns dias ou arquiva. O histórico fica guardado." |

- **A aba:** o capítulo acontece na aba em que a pessoa está, quando ela está na tela de um hábito (a oferta "O hábito" aparece ali): `/hoje/habito/:id`, `/progresso/habito/:id` ou `/ajustes/habitos/:id`. Por Ajustes › Tutorial, é o Hoje.
- **O começo, pela oferta:** a tela é de um hábito da pessoa, que não existe no exemplo. Antes do exemplo, o gancho `enter` volta para a lista (a raiz da aba, ou Ajustes › Hábitos) e espera a passagem acabar; o primeiro passo abre a caminhada do exemplo dali. A tela dela nunca mostra "Este hábito não existe mais.".
- **A saída** (no fim ou no meio, até com a folha de corrigir aberta): a raiz da aba, com os dados da pessoa. O dia corrigido no exemplo não fica.
- **O que existe para os hábitos de horário** fica no texto do passo 6, porque a caminhada é de sim ou não.

## Capítulo "O progresso" (`progresso`, com exemplo)

Nove passos no Progresso, quatro deles de fazer: o período (trocar e voltar) e os chips Humor e Medidas. O roteiro está em `scripts/progresso.ts`.

| Passo | Alvo | Espera | Texto |
|---|---|---|---|
| 1 · `semana` | `progresso-semana` (o cartão da constância) | Próximo | "No anel, a constância da semana. Ao lado, a semana passada e a fase. Tocar na semana passada abre a revisão dela." |
| 2 · `periodo` | `progresso-periodo` (o seletor) | aviso `custom` `progresso-periodo` (o período trocou) | "Para ver a semana anterior, toque na seta ‹ do período." Depois: "Isso. A tela toda acompanha o período." |
| 3 · `voltar` | `progresso-agora` ("Voltar para esta semana") | toque | "Para voltar, toque em "Voltar para esta semana"." |
| 4 · `pilares` | `progresso-pilares` | Próximo | "Os pilares ficam do maior para o menor. Toque num para ver só ele." |
| 5 · `dados` | `progresso-dados` (as comparações) | Próximo | "Em "O que os seus dados mostram", o app compara os dias com e sem um hábito. Cada comparação aparece com 7 dias de cada lado." |
| 6 · `aba-humor` | `progresso-aba-humor` (o chip) | toque | "Estes botões trocam o que ver: o humor, as medidas e cada pilar. Toque em Humor." |
| 7 · `humor` | `progresso-humor` (o calendário do humor) | Próximo | "Cada dia mostra o humor do check-in da noite. Toque num dia para ver o resumo dele." |
| 8 · `aba-medidas` | `progresso-aba-medidas` | toque | "Agora toque em Medidas." |
| 9 · `medidas` | `progresso-peso` (o cartão do peso) | Concluir | "Aqui ficam o peso e a média de 7 dias. Para ver só a tendência, é em Ajustes › Aparência." |

- **A saída:** o gancho `leave` volta para a visão geral desta semana (`/progresso`, sem a busca) antes de os dados da pessoa voltarem, porque o capítulo termina em Medidas.
- O período troca em Humor (o mês da semana escolhida), como sempre: o passo 9 mostra as medidas do mês.

## Capítulo "A jornada" (`jornada`, com exemplo)

Sete passos (oito com os Primeiros passos) na Jornada e no plano do treino. O roteiro está em `scripts/jornada.ts`.

| Passo | Alvo | Espera | Texto |
|---|---|---|---|
| 1 · `caminho` | `jornada-caminho` (a lista das fases) | Próximo | "Este é o caminho das fases: a concluída, a de agora e as próximas." |
| 2 · `agora` | `jornada-agora` (o cartão "Agora") | Próximo | "A fase de agora mostra as semanas e os hábitos novos. Os das fases anteriores continuam com você." |
| 3 · `proxima` | `jornada-proxima` (a primeira fase que não começou) | Próximo | "A próxima fase tem uma data prevista. No fim da fase, a revisão sugere avançar. Você decide." |
| 4 · `editar` | `jornada-editar` | Próximo | "Em Editar jornada você muda as datas, os hábitos de cada fase e quando sugerir a próxima." |
| 5 · `primeiros-passos` | `pp-journey` | Próximo | "Os seus Primeiros passos ficaram aqui, no dia em que aconteceram." Só quando a pessoa já fez o primeiro gesto de "O dia" (o exemplo mostra o tutorial dela) |
| 6 · `treino` | `jornada-treino` (o primeiro cartão de treino guiado) | toque | "Este é um treino guiado: um plano em semanas, como a corrida do zero. Toque nele." |
| 7 · `plano` | `treino-semana` (o treino da semana, no plano) | Próximo | "Este é o treino da semana, bloco a bloco. Embaixo ficam todas as semanas do plano: toque numa para ver o treino dela." |
| 8 · `revisoes` | `[data-tour="jornada-revisoes"] > *` (a lista das revisões) | Concluir | "No domingo, a revisão da semana aparece no Hoje. As que passaram ficam aqui, só para ler." |

- O passo 7 fica sem `where`: o toque no cartão já abre o plano. O passo 8 volta para a Jornada.
- **A saída no meio**, até no plano do treino do exemplo: a Jornada, com os dados da pessoa.

## Capítulo "Os ajustes" (`ajustes`)

Oito passos nos dados da pessoa, só apontando: nada muda, e nenhuma tela de formulário abre. O último é de fazer: tocar em Tutorial, que abre a lista dos capítulos já com "Visto". O roteiro está em `scripts/ajustes.ts`.

| Passo | Onde | Alvo | Texto |
|---|---|---|---|
| 1 · `plano` | `/ajustes` | `[data-tour="ajustes-plano"] > *` (Hábitos, Pilares e Pausar) | "Em Meu plano ficam os seus hábitos e pilares. Um hábito pode contar em mais de um pilar: é o "Também conta em", no formulário dele." |
| 2 · `novo-habito` | `/ajustes/habitos` | `ajustes-novo-habito` (o +) | "No + você cria um hábito. Um dos tipos é o Treino guiado: um plano em semanas, como a corrida do zero." |
| 3 · `pausar` | `/ajustes` | `ajustes-pausar` | "Em Pausar, você pausa o app ou alguns hábitos, nas férias ou numa gripe. Os dias pausados não contam." |
| 4 · `rotina` | `/ajustes` | `[data-tour="ajustes-rotina"] > *` (Horários e Lembretes) | "Em Horários ficam as horas que guiam o seu dia. Em Lembretes, os alarmes para criar no iPhone." |
| 5 · `aparencia` | `/ajustes` | `ajustes-aparencia` | "Em Aparência ficam o tema, o jeito de ver o Hoje e "Mostrar o Zeno". Sem mim, o tutorial segue só com o texto." |
| 6 · `a-dois` | `/ajustes` | `ajustes-a-dois` | "Em A dois, você liga o app com outra pessoa e escolhe o que mostrar. Sem placar." |
| 7 · `conta` | `/ajustes` | `[data-tour="ajustes-conta"] > *` (o cartão com o nome) | "No seu nome ficam os dados e a conta: exportar, sair e apagar." |
| 8 · `tutorial` | `/ajustes` | `ajustes-tutorial` (toque) | "E em Tutorial ficam todos os capítulos, para rever quando quiser. Toque nele." |

- O Novo hábito não abre: a tela de tipos limpa o rascunho de um hábito em andamento, e o + basta para dizer onde fica.

## Ofertas

- **Conta que já existia** (com plano e sem `introAt`), no Hoje: o Zeno entra e acena. "Oi, eu sou o Zeno. Vou andar com você por aqui. Quer conhecer o app comigo?" "Vamos" começa "O dia"; "Agora não" responde "Tudo bem. Fica em Ajustes › Tutorial." e ele sai. As duas gravam `introAt`.
- **Capítulo ao abrir uma aba** (Progresso, Jornada, Ajustes; e "O hábito" ao abrir um hábito): uma vez por capítulo, se ele não foi visto, se o Zeno já se apresentou e se nenhum tutorial está rodando. "Quer que eu mostre o Progresso?", com "Mostrar" e "Agora não". As duas gravam `offered`.
- Nada é oferecido com o Zeno desligado, nos testes (`VITE_TOUR_AUTO=off`) ou no meio de uma folha aberta.
- **Quando:** a oferta espera a tela assentar (900 ms). Ela fica embaixo, acima da barra de abas (ou perto da cabeça do Zeno), sem véu, e a pessoa pode seguir usando a tela. A apresentação é o `run` `'intro'` enquanto está na tela.
- **Sem resposta:** sair da tela ou abrir uma folha tira a oferta sem gravar. Ela não volta nesta abertura do app, só na próxima.
- **Onde:** a raiz de Progresso, Jornada e Ajustes; "O hábito" em `/hoje/habito/:id`, `/progresso/habito/:id` e `/ajustes/habitos/:id`. A conta é pura (`offerFor`, em `src/tutorial/offerStore.ts`, com testes).
- **Sem WebGL:** por enquanto, a oferta olha só "Mostrar o Zeno" (`zenoShown`). Não oferecer capítulos num aparelho que não desenha WebGL (`zeno.available` falso) fica para quando o Zeno de verdade entrar, porque o provisório nunca está disponível.
- **Chave de teste:** `localStorage['pk-tour-auto'] = 'on'` liga as ofertas mesmo com `VITE_TOUR_AUTO=off`. Ela é lida junto com `tourAuto` e só liga: no app de verdade as ofertas já estão ligadas, então a chave não muda nada.

## Primeiros passos

| Linha | Gesto | Como as de verdade |
|---|---|---|
| Primeira marcação no app | Toque no círculo (`data-tour="pp-mark"`) | `CheckButton`, com a coreografia e o toast com Desfazer |
| Primeiro registro · 0 de 3 | Toque no + (`data-tour="pp-add"`) | Soma 1, o anel anda e o número rola |
| Primeira nota | Escolher de 1 a 5 (`data-tour="pp-rate"`) | O mesmo jeito de dar nota das refeições |

- O grupo inteiro tem `data-tour="pp-group"`. Na folha da nota, as opções têm `pp-rate-options` e o "Salvar nota" tem `pp-rate-save`.
- **Na primeira vez**, cada gesto grava o instante em `tutorial.firstSteps` (`markAt`, `addAt`, `rateAt`, mais a `rating`), pelas ações `practiceMark`, `practiceAdd` e `practiceRate`. Rever o capítulo usa as mesmas linhas, sem gravar de novo.
- **O estado das linhas** fica em memória (`src/stores/practice.ts`) e zera quando o grupo aparece (`practice` passa a verdadeiro). O condutor só liga e desliga `useTour().practice`.
- **O Desfazer** do toast volta só a linha de treino e avisa `undo`. O instante guardado fica, porque o gesto aconteceu: quem desfaz a marcação no passo 4 continua com "a primeira marcação" na Jornada.
- **Os avisos:** `pp-mark` e `pp-unmark` no círculo, `pp-add` com o total a cada toque no + (até 3), `pp-rate` com a nota ao salvar a folha e `undo` no Desfazer da marcação.
- **Na Jornada**, uma entrada só, "Primeiros passos com o Zeno", com a data do primeiro gesto e o que foi feito, assim que houver o primeiro. Ela fica no caminho das fases, no ponto do tempo em que aconteceu ([jornada.md](jornada.md)).
- **Sem o condutor** (testes e capturas): `window.__pkPractice.show(true)` liga o grupo.
- O desenho, os toasts e onde o grupo aparece em cada estado do Hoje estão em [hoje.md](hoje.md) › Primeiros passos.

## Modo exemplo

- **Faixa fixa no topo:** "Exemplo · nada aqui é seu". Ela fica enquanto o modo durar, logo abaixo da área segura, e empurra o conteúdo (a área segura de cima soma a altura dela), então nenhum cabeçalho fica por baixo. O desenho e as camadas estão em [../estados.md](../estados.md) › Modo exemplo.
- **Dados:** uma cópia em memória da história de exemplo, com o nome da pessoa, contada a partir da hora de agora. As escritas vão para a cópia e somem na saída. Recarregar o app sai do exemplo e abre onde a pessoa estava antes dele.
- **A troca:** `useExample().enter()` e `leave()` (`src/data/example.ts`) resolvem com os dados novos já na tela. A fonte da pessoa não fecha: fica guardada por baixo, em dia, e a volta é instantânea. O conteúdo troca de uma vez, sem esqueleto e sem celebrar, e o toast da hora sai.
- **Fica de fora:** o tema e a aparência da pessoa continuam os dela. A abertura não guarda os pilares do exemplo. O A dois não liga. Os rascunhos (check-in, revisão, hábito) e o brilho do dia fechado do exemplo ficam só na memória. Exportar e apagar agem sobre a pessoa, e sair da conta sai do exemplo antes.
- **O tutorial é da pessoa:** o perfil do exemplo começa com o `tutorial` dela, e gravar o progresso do tutorial no exemplo (por mescla) grava também na pessoa. Um capítulo que termina dentro do exemplo fica como visto.
- **Para o condutor:** antes de `leave()`, volte para uma tela sem id do exemplo (a raiz da aba). Um hábito do exemplo aberto na volta mostra "Este hábito não existe mais.".
- **Na demonstração**, o exemplo também é uma cópia, e a história da demonstração não muda.
- **Nos testes:** `window.__pkExample` (`enter()`, `leave()` e `active`), sempre ligado, como em `tests/e2e/exemplo.spec.ts`.

## Ajustes

- **Ajustes › Tutorial** (`/ajustes/tutorial`): os capítulos, na ordem de `CHAPTERS`, cada um com a frase e "Visto" quando foi até o fim. Tocar começa o capítulo na aba dele. A linha "Tutorial" fica no fim do grupo App, em Ajustes ([ajustes-rotina-conta.md › Tutorial](ajustes-rotina-conta.md)).
- **Capítulos sem roteiro completo:** por enquanto, "O dia" tem um roteiro mínimo de um passo. "O hábito e os padrões", "O progresso", "A jornada" e "Os ajustes" estão completos (acima).
- **Ajustes › Aparência:** o interruptor "Mostrar o Zeno" (`prefs.zeno`).

## Acessibilidade

- O balão é texto de verdade, anunciado com `aria-live="polite"`. Ao abrir, o foco vai para ele, e no fim volta para quem estava com ele quando o tutorial começou. No Começar e nas ofertas, o foco fica onde está (o título do passo, a tela), e o texto é só anunciado.
- O balão é uma região com o nome "Zeno". `Esc`, com o foco nele, sai do tutorial.
- O véu e o anel ficam escondidos do leitor de tela. Com o teclado, a pessoa continua andando pela tela toda.
- O desenho do Zeno fica escondido do leitor de tela (`aria-hidden`).
- No passo de fazer, o alvo continua com o nome e o papel dele, e o balão diz o que fazer.
- Com movimento reduzido, o Zeno troca de pose por opacidade, e o balão e o anel entram sem deslocamento.

## Testes

- `window.__pkTour`, sempre ligado (como o `window.__pkShell`):
  - `start(run)`: um capítulo, `'comecar'` ou `'intro'` (a oferta de apresentação);
  - `stop()`: o mesmo que "Sair do tutorial";
  - `state`: `run`, `step`, `practice`, `stepId`, `text`, `counter`, `veil` (`none`, `look`, `do`), `collapsed`, `offer` e `offerReply`.
- Nos e2e, o Zeno não se oferece sozinho. Os testes ligam o tutorial pela API, por Ajustes › Tutorial ou pela chave `pk-tour-auto`.
- Vitest: o condutor com dependências de mentira (`src/tutorial/__tests__/conductor.test.ts`), a posição do balão e o véu (`placement.test.ts`), as ofertas (`offers.test.ts`) e as ações (`src/actions/__tests__/tutorial.test.ts`).
- E2e: `tests/e2e/tutorial.spec.ts` e, para os capítulos do hábito, do Progresso, da Jornada e de Ajustes, `tests/e2e/tutorial-capitulos.spec.ts`: cada um do começo ao fim, a saída no meio, a marca da pessoa que continua e o dia corrigido no exemplo que não fica, o "Visto", as ofertas de cada aba e o axe com o balão aberto. Ele roda com "Mostrar o Zeno" desligado, a não ser nas ofertas, que precisam dele.
