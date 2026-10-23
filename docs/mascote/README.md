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
- Vai poder ser escondido em Ajustes › Aparência.

## Onde ele aparece

O Zeno entra **por cima da tela**, como no laboratório. Ele vai **conduzir o tutorial do primeiro uso** e **aparecer em alguns momentos ao longo do uso**. Como integrar isso ao app fica para uma próxima conversa.

| Momento | O que ele faz |
|---|---|
| Primeiro acesso | Entra andando, acena, se apresenta e aponta para o ✓. Quando a pessoa toca, comemora com um aceno de cabeça |
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
- **Peso:** cerca de 150 KB comprimidos, carregados só quando o Zeno aparece. O personagem tem uns 33 mil triângulos, e as texturas do casco, da barriga e do cachecol são desenhadas em canvas na hora.
- **O tempo da cena vem do relógio de verdade**, e não do carimbo de cada quadro. Assim, um aparelho lento mostra a cena mais devagar, mas nunca pula pedaços.
- **API das cenas:** as cenas são roteiros curtos (`say`, `lookAt`, `pointAt`, `wave`, `hop`, `nod`, `eyesTo`) que esperam em tempo de cena e podem ser interrompidos por uma cena nova.

## Para decidir depois

- Como o tutorial do primeiro uso e os momentos ao longo do uso entram no app.
- A entrada dele na abertura do app, junto com a nova tela de carregamento.
- O desenho do Zeno para o primeiro dia, para o "sem internet" e para a Jornada.
