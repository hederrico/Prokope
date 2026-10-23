# Zeno, o mascote

O Zeno é uma tartaruga e é o mascote do Prokopē. Ele aparece em momentos combinados para apresentar o app, fazer perguntas e comemorar, sempre como companheiro de caminho, nunca como treinador.

O [laboratório](laboratorio.html) mostra o Zeno funcionando, com as cenas, os dois temas, o movimento reduzido e o casco nas cores dos pilares. Ele abre direto no navegador, mas precisa de internet para baixar o three.js.

## Por que uma tartaruga chamada Zeno

- **"Devagar e sempre"** é o primeiro princípio do app: constância, não perfeição.
- **O nome tem duas referências gregas:**
  - Zenão de Cítio fundou o estoicismo, de onde vem o *prokoptōn*: quem ainda não é perfeito, mas está no caminho.
  - Zenão de Eleia criou o paradoxo de Aquiles e a tartaruga. Nele, a tartaruga avança um pouco de cada vez e nunca é alcançada.
- **O bordão é "Um pé depois do outro."** O "pē" de Prokopē soa como "pé".

## Como ele é

- **De pé, com o corpo de três quartos** para o casco aparecer e o rosto virado para quem vê: cabeça grande, barriga clara com as linhas do plastrão, braços e pernas curtos.
- **Também senta:** no check-in, para conversar, e na hora de ler.
- **As cores do corpo são fixas** e não mudam com o tema nem com a pessoa:
  - pele verde-oliva clara;
  - bochechas rosadas;
  - olhos e boca na cor da tinta;
  - cachecol listrado no azul-petróleo do destaque.
- **O casco carrega os pilares de quem usa.** As placas de cima alternam as cores dos pilares, no papel *fill* da paleta de 12 cores. A fileira de baixo, a margem, é sempre da mesma cor. Quando a pessoa muda um pilar, as placas trocam de cor em 240 ms, e o Zeno dá as costas e olha por cima do ombro para mostrar o casco.
- **Perto do horário de telas desligadas**, ele põe a touca, avisa que falta pouco, boceja, senta e lê. O horário é o da pessoa, de Ajustes › Horários (21h no plano base). No laboratório, a cena acontece às 20h50.
- **Estilo: argila**, com sombreamento suave e sem contorno. O laboratório ainda mostra a versão "papel", de três tons com contorno de tinta, para comparar.

## Personalidade e voz

- **É um parceiro que guia:** amigável e sem cobrança. Não é treinador e não faz chantagem emocional.
- **É "ele"**, e trata a pessoa por "você".
- **Fala em frases curtas, no presente e no tom de conversa.** Por exemplo: "Quando fizer um hábito, toque aqui.", "Como foi hoje?", "Daqui a pouco é hora de desligar as telas.", "Opa, cochilei."
- **Nunca usa "falhou", "esqueceu", "de novo" ou "ainda não"**, nem conta o que faltou.
- O humor dele nunca depende dos números da pessoa. A nota 1 e a nota 5 do check-in recebem o mesmo "Obrigado por contar."
- Não aparece no deslize.
- A comemoração segue a escada de celebração de [movimento.md](../interacao/movimento.md): um aceno no dia fechado e a dancinha só na fase nova.
- Fala pouco, em balões curtos. O texto do balão é texto de verdade na tela, lido pelo VoiceOver, e o desenho fica escondido do leitor de tela.
- Pode ser escondido em Ajustes › Aparência, no interruptor "Mostrar o Zeno".

## Onde ele aparece

O Zeno entra **por cima da tela**, como no laboratório. Ele **conduz o tutorial do primeiro uso** e vai **aparecer em alguns momentos ao longo do uso**. O tutorial está em [tutorial.md](../interacao/telas/tutorial.md); a parte técnica dele no app está em [No app](#no-app), abaixo.

| Momento | O que ele faz |
|---|---|
| Primeiro acesso (o Começar) | Entra andando até o canto de cima, à direita, ao lado do título de cada passo, e acena: "Oi, eu sou o Zeno." Aponta para as opções, o primeiro chip e o primeiro horário. Fica à toa no canto enquanto a pessoa usa a tela, e vai junto para o Hoje |
| "O dia" (o primeiro Hoje) | Num canto longe do que mostra, com o balão ao lado da cabeça: aponta para os momentos, os Primeiros passos, a semana, o botão do jeito e o check-in. Quando a pessoa marca, soma ou dá nota no treino, comemora com um aceno de cabeça ("Isso. Um pé depois do outro.", "Obrigado por contar."). No fim, pulinho e aceno, e sai |
| Apresentação (contas que já existiam) | No Hoje, entra no canto de baixo e acena: "Oi, eu sou o Zeno. Vou andar com você por aqui. Quer conhecer o app comigo?" "Vamos" começa "O dia"; "Agora não", aceno de cabeça e "Tudo bem. Fica em Ajustes › Tutorial.", e ele sai |
| Oferta de um capítulo | Na primeira vez numa aba (Progresso, Jornada, Ajustes, um hábito), entra no canto de baixo e pergunta: "Quer que eu mostre o Progresso?" |
| Tocar nele, no tutorial | A fala dele aparece no balão por um instante: "Oi!", "Hehe.", "Tô aqui.", ou "Opa, cochilei." se ele cochilava |
| Fase nova | Aponta para os hábitos novos. Na fase desbloqueada, pula, cai de costas, gira no casco esperneando e levanta num pulo |
| Check-in das 20h30 | Senta, pergunta "Como foi hoje?" e agradece qualquer resposta |
| Revisão de domingo | Conduz as perguntas, uma por vez |
| Dia fechado | Pulinho e aceno pequeno |
| Pausa | Recolhe-se no casco: "Pausa ligada. Bom descanso." E dorme |
| Perto de desligar as telas | Touca, "Daqui a pouco é hora de desligar as telas.", bocejo, senta, lê e cochila |
| Pilares mudaram | Mostra o casco: "Cada cor é um pilar seu." |
| Primeiro dia, sem internet, Jornada | A definir nas próximas versões |

## Movimento

O Zeno é a única exceção à regra "nada se mexe sozinho", com limites:

- **Só entra em momentos previstos.** Fora de cena, nada dele é desenhado.
- **Em cena, ele nunca fica parado encarando.** Entre uma ação e outra, ele fica à toa:
  - respira, pisca e muda o olhar a cada poucos segundos, entre partes da tela, o chão e, só de vez em quando, a pessoa;
  - a cada 4 a 7 s, faz uma coisinha calma, sorteada sem repetir a anterior:
    - olhar em volta;
    - ajeitar o cachecol;
    - coçar a bochecha, pensativo;
    - cantarolar, com uma notinha ♪;
    - espiar o próprio casco;
    - chutar uma pedrinha;
    - espreguiçar;
    - sentar um pouco.
- **Ele fica entediado.** Sem toque nem cena por 40 s, ele senta e fica. Aos 65 s, ele cochila sentado. Qualquer toque o acorda com "Opa, cochilei."
- **Dormindo:** na pausa, no cochilo do fim da noite e no cochilo de tédio, ele respira devagar e fundo, sem parar. A bolha de dormir dos animes sai do nariz: ela enche quando ele solta o ar e murcha quando ele puxa.
  - Na pausa e à noite, um toque estoura a bolha; ele se mexe e volta a dormir. Uma cena nova estoura a bolha e o acorda.
- **Bateria:**
  - nas ações, o desenho roda a 60 quadros por segundo;
  - à toa ou dormindo, a 30, que basta para respirar, piscar e mudar o olhar;
  - o desenho para quando ele sai de cena ou o app vai para o fundo.
- **Molas:** usam os mesmos parâmetros do Motion (`visualDuration` e `bounce`), as mesmas `calma`, `toque` e `festa` do app.
- **Pontas do cachecol e da touca:** balançam como pêndulos puxados pela aceleração. É o movimento que vem depois do gesto e faz o personagem parecer vivo.
- **Toques:**
  - tocar na tela faz ele olhar para o ponto tocado;
  - tocar nele dá um "oi";
  - os olhos vão na frente e a cabeça vem depois.
- **Movimento reduzido:**
  - cada cena vira poses paradas, trocadas por opacidade em 150 ms;
  - não há respiração, piscada, pulo, giro nem coisinhas à toa;
  - dormindo, a bolha aparece parada;
  - o desenho para assim que a pose assenta.

## Técnica

- **Three.js 0.170**, com o personagem montado em código a partir de esferas, cápsulas e cones. Não há modelo do Blender nem artista no caminho.
- **Cabeça, olhos e braços são peças separadas.** Por isso, "olhar para" e "apontar para" um botão de verdade da tela é uma conta: a posição do botão vira um ponto no espaço do Zeno.
- **Alcance com a mão:** para pegar o cachecol, segurar o livro ou coçar a bochecha, uma busca pequena acha o ângulo do ombro e do cotovelo que leva a mão ao ponto. O cotovelo só dobra para a frente.
- **Peso:** cerca de 140 KB comprimidos, carregados só quando o Zeno aparece. O personagem tem uns 36 mil triângulos, e as texturas do casco, da barriga e do cachecol são desenhadas em canvas na hora.
- **O tempo da cena vem do relógio de verdade**, e não do carimbo de cada quadro. Assim, um aparelho lento mostra a cena mais devagar, mas nunca pula pedaços.
- **API das cenas:** as cenas são roteiros curtos (`say`, `lookAt`, `pointAt`, `wave`, `hop`, `nod`, `eyesTo`) que esperam em tempo de cena e podem ser interrompidos por uma cena nova.

## No app

O Zeno do app é o do laboratório, só no estilo argila. A aparência, as molas, o olhar, as coisinhas à toa, o tédio e o sono são os mesmos. A tela `/dev/zeno` mostra o Zeno de verdade, com um botão para cada método e cada cena, alvos para apontar, o tema e o movimento reduzido. Ela existe no desenvolvimento e no build dos testes (`--mode e2e`), nunca no de produção.

### Módulos (`src/zeno/`)

| Arquivo | O que tem |
|---|---|
| `types.ts` | O contrato: `ZenoController`, `ZenoTarget`, `ZenoGaze`, `ZenoPlace`, e as extensões `ZenoTap` e `ZenoScene` |
| `index.ts` | `useZeno()`, `<ZenoHost />`, o controlador (`zeno`), `webglSupported()` e o gancho dos testes. É o único arquivo no pedaço principal |
| `zeno3d.ts` | O palco e o estado: o canvas que acompanha o Zeno, a câmera, o olhar, a fala, o desenho de cada quadro, os toques e a API do controlador |
| `character.ts` | O boneco montado em código, as texturas em canvas, a luz da argila e as pontas que balançam (cachecol e touca) |
| `scenes.ts` | Os roteiros: entrar, sair, andar, sentar, apontar, acenar, as cenas prontas e as coisinhas à toa |
| `springs.ts` | Os parâmetros do corpo, a pose de descanso e as molas (`calma`, `toque`, `festa` e as só dele) |
| `place.ts` | Os lugares na tela, o pedaço que o canvas cobre e a densidade do desenho. Conta pura |
| `color.ts` | As cores fixas do corpo, a conta do OKLCH e as fileiras do casco. Conta pura |
| `shell.ts` | As cores das placas: o fill da paleta dos pilares ativos. Fica no pedaço principal, e o controlador entrega as cores prontas ao desenho |
| `loop.ts` | O laço de desenho: 60 ou 30 quadros por segundo, parado fora de cena e com o app no fundo |
| `lines.ts` | As falas das cenas prontas, para o balão de quem conduz |

### Carga sob demanda e sem internet

- O `index.ts` não importa o three.js. O primeiro `enter()` faz `import('./zeno3d')`, e o boneco é montado nessa hora.
- O pedaço do Zeno não importa nada do app. As cores dos pilares e o movimento reduzido chegam pela ponte (`ZenoBridge`), para o pedaço principal não se dividir por causa dele. Na abertura, o app carrega uns 2 KB comprimidos a mais.
- O three.js e o desenho ficam num pedaço só, o `zeno3d-*.js`: uns 545 KB, ou 140 KB comprimidos. O pedaço principal não carrega nem pré-carrega esse arquivo.
- O service worker guarda o `zeno3d-*.js` no pacote offline, como os outros `.js` (`globPatterns` em `vite.config.ts`). Ele fica abaixo do limite de 2 MiB do Workbox. Depois da primeira visita, o Zeno aparece sem internet.
- Se o pedaço não chega (sem internet antes do pacote offline), `enter()` resolve sem fazer nada, e o tutorial segue só com o balão.

### O palco

- `<ZenoHost />` fica uma vez só no `RootLayout`, dentro do `.sh-app`, com z-index 70: acima das folhas (40) e do véu do tutorial (60), abaixo do balão (80). Os toasts ficam acima de tudo.
- O canvas tem só o tamanho do Zeno (cerca de 240 × 270 pontos no iPhone) e anda com ele. A câmera é a da coluna inteira do app, e o canvas desenha só o pedaço em volta dele. Por isso o Zeno é igual ao do laboratório.
- A densidade do desenho é a da tela, no máximo 2.
- O palco não pega toque. Só o corpo dele pega, numa área que acompanha a cabeça e o casco.
- O desenho fica escondido do leitor de tela (`aria-hidden`). O texto é do balão.

### Lugares

| Lugar | Onde fica |
|---|---|
| `'bottom'` | Os pés 4 pontos acima da barra de abas. Numa tela cheia, acima do pé preso (o Continuar do Começar); sem nenhum dos dois, acima da área segura |
| `'top'` | A cabeça logo abaixo do cabeçalho da tela (`.sh-hd`, `.sh-nb` ou `.sh-steptop`) |
| `{ awayFrom }` | O lado oposto ao alvo, sem cobrir o alvo. Prefere embaixo; se cobrir, vai para cima; depois tenta o outro lado |
| `{ awayFrom, room }` | Extensão, para o tutorial: num canto, e a faixa dele com o balão ao lado (`room` px de altura, de borda a borda) não cobre o alvo. Fica onde está se dali a faixa já não cobre |
| `{ corner, side, ledge }` | Extensão: num canto, encostado na borda do lado (o meio a 0,55 unidade mais 8 pontos da borda), embaixo ou em cima. Em cima, com `ledge`, os pés ficam no fim de baixo desse elemento (o título do passo, no Começar), e a cabeça sobe até a área segura |

- Embaixo e em cima ficam do lado onde ele já está. Ele entra à esquerda.
- Quando a tela muda de tamanho ou a barra de abas aparece, ele refaz a conta do último lugar pedido (o canto continua canto).
- Ele entra andando pela borda do lado do lugar. Na mesma fileira, atravessa a tela andando. Noutra fileira, sai pela borda e entra na fileira nova.
- Quando a barra de abas aparece ou some, ele desliza até o lugar novo com a mola `calma`.

### API

| Método | O que faz |
|---|---|
| `available` | "Mostrar o Zeno" ligado (`zenoShown(profile.prefs)`) e o aparelho cria um contexto WebGL 2. Falso: todos os métodos resolvem na hora, sem fazer nada |
| `present` | Está em cena (de quando começa a entrar até sair) |
| `enter({ place, wave })` | Carrega na primeira vez, entra andando até o lugar e acena, se pedido. Já em cena, anda até o lugar |
| `leave()` | Tchau e sai pela borda. Resolve quando ele saiu e o desenho parou |
| `moveTo(place)` | Anda até outro lugar |
| `lookAt(alvo, holdMs)` | Os olhos vão na frente e a cabeça vem depois. `'person'`, `'ground'`, `'around'` (volta ao olhar à toa) ou um elemento |
| `pointAt(alvo)` | Olha, aponta e resolve com o braço no lugar. O braço fica no alvo até `rest()` |
| `rest()` | Baixa os braços e volta ao corpo de descanso |
| `talk(texto)` | Mexe a boca e a cabeça pelo tempo da fala (até 2,2 s). O texto fica no balão |
| `wave`, `nod`, `hop`, `sit`, `stand` | Os gestos do laboratório |
| `celebrate('small' \| 'medium')` | Aceno de cabeça, ou pulinho e aceno (a escada de celebração) |
| `showShell()` | Dá as costas e olha por cima do ombro, para mostrar o casco |
| `anchor()` | O retângulo da cabeça na tela, para o balão. Acompanha andar, sentar, recolher e a touca, mas não a respiração nem o olhar, para o balão não tremer. `null` fora de cena |
| `onMove(cb)` | Avisa quando a âncora anda ou ele sai |
| `onTap(cb)` | Extensão: avisa os toques. `body` (tocaram nele, com a fala sugerida "Oi!"), `wake` ("Opa, cochilei.") e `screen` (ele olhou para o ponto) |
| `scene(id)` | Extensão: as cenas prontas, `acenar`, `casco`, `checkin`, `obrigado`, `dia`, `fase`, `pausa`, `noite`, `cochilo`, `acordar` e `sair`. A fala de cada uma está em `ZENO_LINES` (`@/zeno/lines`) |
| `touch(on)` | Extensão: o corpo pega o toque (o padrão) ou deixa passar para a tela. O tutorial desliga quando a pessoa usa a tela por baixo dele (o Começar com o balão recolhido, uma oferta), para ele nunca segurar o toque num controle. Ele continua olhando para o ponto tocado |

- Uma ação nova interrompe a anterior, e a promessa da anterior resolve. Nada rejeita.
- `talk` e `lookAt` não interrompem nada.
- No meio de uma ação pedida pelo app, um toque nele não interrompe: só chega no `onTap`.

### Bateria

- Nas ações, ele desenha a 60 quadros por segundo; à toa ou dormindo, a 30.
- O laço para fora de cena, com o app no fundo e, no movimento reduzido, assim que a pose assenta.
- 30 s depois de sair de cena, ele solta o contexto do WebGL, as geometrias e as texturas da GPU. O boneco continua montado na memória, e a próxima entrada cria o contexto de novo. Os 30 s evitam refazer tudo quando o tutorial tira e põe o Zeno entre dois passos.

### Testes

- `src/zeno/__tests__/zeno.test.ts`: as molas, os lugares (com os cantos e a faixa dele com o balão), o canvas e as cores do casco.
- `tests/e2e/tutorial-dia.spec.ts`: o Zeno de verdade no tutorial, no Começar e em "O dia", longe do alvo, com o toque nele e sem ele.
- `tests/e2e/zeno.spec.ts`: na `/dev/zeno`, entra (o pedaço chega só no `enter()`), aponta para um botão, sai (o desenho para), o movimento reduzido, "Mostrar o Zeno" desligado e um aparelho sem WebGL.
- Com navegador automatizado, `window.__pkZeno` traz o controlador, `frames`, `drawing`, `stats()`, `params()` e `freeze()`, como o `window.Zeno` do laboratório.

## Para decidir depois

- Quando cada momento ao longo do uso chama a cena dele (as cenas já existem no app).
- A entrada dele na abertura do app, junto com a nova tela de carregamento.
- O desenho do Zeno para o primeiro dia, para o "sem internet" e para a Jornada.
