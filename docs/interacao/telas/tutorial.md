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

`tutorial.introAt` é gravado no passo 1.

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

Abre um hábito com algumas semanas de história. O calendário: cheio é feito, meio cheio é parcial, pontilhado é fora da agenda. A força: cresce com a constância e cai devagar, e um dia sem não zera nada. Os padrões: "Aqui o app compara os dias com e sem este hábito." Corrigir um dia pelo calendário.

## Capítulo "O progresso" (`progresso`, com exemplo)

A visão geral da semana, o período, um pilar, o humor do check-in, as medidas (com "Mostrar só a tendência") e as revisões passadas.

## Capítulo "A jornada" (`jornada`, com exemplo)

O caminho das fases, a sugestão de avançar ("você decide"), Editar jornada, o cartão do treino guiado e o plano em semanas, e a revisão de domingo.

## Capítulo "Os ajustes" (`ajustes`)

Nos dados da pessoa, só apontando: pilares e hábitos (com "Também conta em"), horários e lembretes, aparência (o jeito do Hoje, o tema e "Mostrar o Zeno"), pausar, a dois, dados e conta, e o próprio Tutorial.

## Ofertas

- **Conta que já existia** (com plano e sem `introAt`), no Hoje: o Zeno entra e acena. "Oi, eu sou o Zeno. Vou andar com você por aqui. Quer conhecer o app comigo?" "Vamos" começa "O dia"; "Agora não" responde "Tudo bem. Fica em Ajustes › Tutorial." e ele sai. As duas gravam `introAt`.
- **Capítulo ao abrir uma aba** (Progresso, Jornada, Ajustes; e "O hábito" ao abrir um hábito): uma vez por capítulo, se ele não foi visto, se o Zeno já se apresentou e se nenhum tutorial está rodando. "Quer que eu mostre o Progresso?", com "Mostrar" e "Agora não". As duas gravam `offered`.
- Nada é oferecido com o Zeno desligado, nos testes (`VITE_TOUR_AUTO=off`) ou no meio de uma folha aberta.

## Primeiros passos

| Linha | Gesto | Como as de verdade |
|---|---|---|
| Primeira marcação no app | Toque no círculo (`data-tour="pp-mark"`) | `CheckButton`, com a coreografia e o toast com Desfazer |
| Primeiro registro · 0 de 3 | Toque no + (`data-tour="pp-add"`) | Soma 1, o anel anda e o número rola |
| Primeira nota | Escolher de 1 a 5 (`data-tour="pp-rate"`) | O mesmo jeito de dar nota das refeições |

- O grupo inteiro tem `data-tour="pp-group"`.
- **Na primeira vez**, cada gesto grava o instante em `tutorial.firstSteps` (`markAt`, `addAt`, `rateAt`, mais a `rating`). Rever o capítulo usa as mesmas linhas, sem gravar de novo.
- **Na Jornada**, uma entrada só, "Primeiros passos com o Zeno", com a data, assim que houver o primeiro.

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

- **Ajustes › Tutorial** (`/ajustes/tutorial`): os capítulos, na ordem de `CHAPTERS`, cada um com a frase e "Visto" quando foi até o fim. Tocar começa o capítulo na aba dele.
- **Ajustes › Aparência:** o interruptor "Mostrar o Zeno" (`prefs.zeno`).

## Acessibilidade

- O balão é texto de verdade, anunciado com `aria-live="polite"`. Ao abrir, o foco vai para ele.
- O desenho do Zeno fica escondido do leitor de tela (`aria-hidden`).
- No passo de fazer, o alvo continua com o nome e o papel dele, e o balão diz o que fazer.
- Com movimento reduzido, o Zeno troca de pose por opacidade, e o balão e o anel entram sem deslocamento.

## Testes

- `window.__pkTour` (como o `window.__pkShell`): `start(capítulo)`, `stop()` e o estado atual.
- Nos e2e, o Zeno não se oferece sozinho. Os testes ligam o tutorial pela API ou por Ajustes › Tutorial.
