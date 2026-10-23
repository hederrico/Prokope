# Prokopē · design system

Os valores exatos dos tokens (cores, tipos, espaços, raios, sombras, durações) estão no bloco `:root` de [design-system.html](design-system.html), que é a referência viva. Este documento registra as decisões e o motivo de cada uma.

## Direção: papel e tinta

- Neutros com leve tom quente (pedra) no claro e carvão morno no escuro. O escuro morno evita a luz azulada na hora de dormir. A alternativa fria (ardósia) foi descartada.
- Quatro pastéis, um por pilar: Mente lavanda, Alimentação sálvia, Corpo damasco, Família rosa. O destaque é um azul-petróleo.
- Nenhum vermelho. Dia sem registro é o trilho vazio, e orçamento estourado fica neutro.

## Cores

- Todas em OKLCH, com hex só como reserva.
- Cada matiz tem quatro papéis:
  - **wash**: fundo tingido.
  - **fill**: o pastel de barras, bolinhas e células. É decorativo e sempre acompanha número ou texto.
  - **mark**: traço de gráficos, com contraste de pelo menos 3:1.
  - **ink**: texto e ícones, com contraste de pelo menos 4,5:1.
  - **on**: texto e ícone sobre o fill (o número dentro de uma célula cheia). No claro, L 40% C 0,09, que dá de 5,2 a 6,8:1; no escuro, o fundo da página.
- No escuro, os papéis se invertem em vez de só escurecer: o fill fica mais claro, o ink vira um tom bem claro e o wash vira um tom profundo do mesmo matiz. A croma fica em 0,08 ou menos em áreas grandes, para nada brilhar.
- Os pares de pilares foram ajustados para continuar distintos com daltonismo (deuteranopia e protanopia).

## Pilares personalizáveis

- Cada pessoa cria, edita, reordena e arquiva os próprios pilares. Os quatro atuais (Mente, Alimentação, Corpo, Família) são só a configuração inicial.
- Um pilar guarda: nome, chave da cor, nome do ícone e ordem.
- **Paleta fechada de 12 cores:** Coral 25°, Damasco 60°, Mel 90°, Oliva 120°, Sálvia 150°, Menta 175°, Água 205°, Céu 235°, Índigo 262°, Lavanda 285°, Ameixa 320° e Rosa 355°.
  - Todas usam a mesma fórmula e só mudam o matiz.
  - **Claro:** wash L 95,5% C 0,022 · fill L 85% C 0,075 · mark L 64% C 0,115 · ink L 47,5% C 0,10.
  - **Escuro:** wash L 27% C 0,03 · fill L 78% C 0,08 · mark igual ao fill · ink L 85% C 0,065.
  - O texto apagado (`--text-3`) fica em L 53% no claro e 66% no escuro, para passar de 4,5:1 também sobre os fundos tingidos.
  - Damasco e Sálvia mantêm os ajustes finos de luminosidade dos pilares originais.
- Cor e ícone podem se repetir entre pilares. O editor só avisa "também usada em Corpo", sem bloquear.
- No código, uma classe genérica recebe o matiz (`--h`) e calcula os quatro papéis. Por isso uma cor nova na paleta é só uma linha.

## Tipografia

- **Escolhida:** Fraunces com o eixo soft no máximo para títulos, e Onest para a interface.
- **Regra dos números:** todo número que anima ou se alinha em coluna (gramas, litros, minutos, contadores) usa a Onest. Os dígitos da Fraunces têm larguras diferentes e "pulariam". A Fraunces fica para números parados e grandes, como o "12" do "dias sem". Nas raras vezes em que esse número muda (deslize, novo recorde), ele rola com a largura de cada algarismo animada, como mostra o laboratório de movimento.
- **Hospedar a Fraunces junto com o app.** A versão do Google Fonts (e do Fontsource, que usa os mesmos recortes por idioma) desenha o "ē" de "Prokopē" com o traço deslocado para a direita. O arquivo completo do repositório `google/fonts` desenha certo. O guia usa esse arquivo em `docs/fonts/`, com a licença OFL. No app, ele vira um woff2 recortado por nós, mantendo os acentos do português e o "ē".
- **Grego:** a Fraunces não tem letras gregas. As letras de "προκοπή" vêm da Literata, carregada só com esses glifos e listada logo depois da Fraunces na pilha de fontes.
- **Descartadas:**
  - Literata + Figtree, que era a opção A.
  - A Commissioner da página anterior, porque não tem números tabulares.
- A escala segue o iPhone: display 34, hero 44, title 22, headline 17, body 16, sub 15, stat 28, label 13, caption 12, micro 11. Nenhum texto fica abaixo de 11, e campos de digitação têm pelo menos 16 para o iPhone não dar zoom.

## Espaço e forma

- Grade de 4 pontos: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Margem lateral 16, respiro dos cartões 16, distância entre cartões 12 e entre seções 32.
- Raios: 6 nas células, 10 e 14 em botões e campos, 20 nos cartões, 28 nos painéis, e pílula. Cantos aninhados são concêntricos.
- Elevação: no claro, sombra morna de 4 a 8%. No escuro, sem sombra: a superfície sobe ficando mais clara, com um fio de luz no topo.
- Toque: pelo menos 44 × 44, e de 48 a 56 nos botões principais do check-in.

## Ícones

- **Pesos do Phosphor:** Regular ao lado de texto, Duotone tingido com o pilar nos hábitos e Fill na aba ativa.
- **Biblioteca curada:** 154 ícones para pilares e hábitos, em 10 categorias.
  - As categorias são: Mente e sono, Alimentação, Corpo e movimento, Família e casa, Saúde, Trabalho e estudo, Dinheiro, Lazer e natureza, Relações e fé, e Deixar de lado (para maus hábitos).
  - Todos os nomes foram conferidos contra a lista oficial do `@phosphor-icons/web` 2.1.1.
- **Busca:** cada ícone tem palavras-chave em português, e a busca ignora acentos ("agua" encontra "Água").
- **Ícone próprio "salsicha":** substitui o `dog` do Phosphor como ícone de cachorro.
  - É um dachshund de perfil, desenhado na mesma grade de 256, com traço de 16, pontas redondas, orelha caída sólida e olho de raio 8.
  - No guia, ele é aplicado por máscara CSS e herda a cor do texto.
  - No app, vira um componente com o `IconBase` do `@phosphor-icons/react`, com as versões Regular e Duotone, para funcionar igual aos outros ícones.

## Gráficos

- **Barras:** 8 px nas linhas e 12 px na barra principal.
  - Segmentos separados por 2 px.
  - Linha de meta de 1,5 px.
  - Ao passar da meta, a barra continua enchendo e mostra "+12 g".
- **Anéis:** traço de cerca de 10% do diâmetro, com ponta redonda, começando às 12h.
- **Heatmap:** usa cor e forma ao mesmo tempo. Os estados são feito, parcial, não feito (trilho), pausado (hachurado), fora da agenda (pontilhado), futuro (vazado) e hoje (anel).
- **Peso:** pontos claros para cada pesagem e a média de 7 dias como linha forte. O título do gráfico é uma frase com a tendência.
- **Correlações:** mostradas como frase ("nos dias com X, humor médio 4,1 contra 3,4"), com o número de dias, sem sugerir causa. Só aparecem com pelo menos 7 dias com o hábito e 7 sem.

## Movimento

O sistema completo (tokens, molas, coreografia, celebração e movimento reduzido) está em [interacao/movimento.md](interacao/movimento.md). Em resumo:

- **Durações:** 100 ms (pressionar), 150 ms (micro), 240 ms (padrão), 400 ms (barras e números), 600 ms (anéis) e 900 ms (brilho do dia fechado).
- **Check:** uma mola curta no círculo e o ✓ se desenhando.
- **Números:** rolam com NumberFlow, nunca saltam.
- **Celebração:** brilho suave quando o dia fecha. Confete só quando uma fase é desbloqueada.
- **Vibração no iPhone:** é só um bônus (truque do interruptor nativo), porque o Safari não tem API de vibração.
- **Movimento reduzido:** o app respeita a configuração do iPhone e troca deslocamento por mudança de cor.

## Experiência (vinda da pesquisa)

- Bons hábitos mostram constância ("5 de 7") e uma "força do hábito" no estilo do app Loop: sobe e desce devagar e nunca zera.
- "Dias sem" guarda o recorde e o total, e o deslize zera só a contagem atual.
- Toda ação tem "Desfazer" por 5 segundos.
- Notas de 1 a 5 são cinco botões com um rostinho e uma palavra, nunca um slider.
  - Os rostinhos usam a cor primária (destaque).
  - O selecionado fica no tom claro da primária (wash), com contorno da primária e o rosto em tom forte.
  - No humor, o que muda é a boca: da tristeza ao sorriso aberto.
  - Na energia, o que muda são os olhos: de fechados de sono a bem abertos.
  - Assim as duas escalas ficam diferentes à primeira vista.
- Pausar um hábito ou o app inteiro (férias, doença) tira esses dias do cálculo.
- O convite de nova fase dá o mesmo peso a "Começar" e "Ficar mais uma semana".
- Entre as contas não há placar nem comparação. Qualquer compartilhamento é opcional.

## Bibliotecas

React 19.3, Vite 8, Tailwind 4.3, shadcn/ui sobre Base UI 1.9, Motion 14.6, NumberFlow, Sonner, d3-shape e d3-scale (gráficos próprios em SVG), Phosphor, date-fns 4.4 com fuso de São Paulo, Firebase 13.1, Zustand 5, React Router 8.5, vite-plugin-pwa 2.0, Vitest 5 e Playwright. As versões foram verificadas em 22/10/2026.
