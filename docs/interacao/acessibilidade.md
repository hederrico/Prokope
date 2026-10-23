# Acessibilidade

As regras do app inteiro para VoiceOver, foco, Texto Dinâmico, contraste, alvo de toque, movimento reduzido e teclado no computador. O que cada componente anuncia está em [componentes.md](componentes.md). A auditoria que originou estas regras está em [../revisao/transversal.md](../revisao/transversal.md).

O app existe para alguém num momento difícil. Isso inclui quem usa letra grande à noite, quem tem a mão ocupada, quem não enxerga bem a tela no escuro e quem usa o VoiceOver. Nenhuma dessas pessoas é um caso especial.

## VoiceOver

### Nomes

- **Todo controle tem nome.** O nome vem do texto visível ou de `aria-label`. Ícone nunca é nome: todo `Icon` é `aria-hidden`.
- **Nome, estado, contexto, nessa ordem:** "Louça, até 20h30. Caixa de seleção, não marcada." O papel e o estado vêm do HTML (`role`, `aria-checked`, `aria-pressed`, `aria-selected`, `aria-expanded`), e não do texto.
- **Unidades por extenso** quando o texto visível é abreviado: "46 g de 80 g" vira "46 de 80 gramas"; "1,5 L" vira "1,5 litros"; "1h 48min" vira "1 hora e 48 minutos". Horários em texto ("6h52") são lidos certo e não precisam de troca.
- **Decorativos ficam fora:** bolinhas da semana, espaços do limite, barras finas, anéis da semana e o confete têm `aria-hidden`, porque o número sempre está escrito ao lado.
- **Gráficos** têm `role="img"` com a frase da tendência ("Peso: a média de 7 dias caiu de 84,8 para 83,7 kg desde 1 de outubro"). Quem quiser os números toca em "Ver como lista", que mostra os mesmos dados numa tabela.
- **Cabeçalhos:** um `h1` por tela (o título) e um `h2` por grupo (Manhã, Ao longo do dia, Limites da semana). O rotor do VoiceOver pula de grupo em grupo.
- **Idioma:** `<html lang="pt-BR">`. A palavra "προκοπή" leva `lang="el"`.

### Toque longo e reordenar

O VoiceOver repassa o toque longo quando a pessoa toca duas vezes e segura, então o menu do hábito já funciona. Mesmo assim, ninguém precisa descobrir esse gesto:

- **Menu do hábito:** cada `HabitRow` tem um botão "Mais opções" escondido da tela e alcançável pelo VoiceOver e pelo teclado, logo depois do controle da linha. Ele abre o mesmo menu. O "Mais" (⋯) no topo da tela do hábito é a alternativa visível.
- **Reordenar pilares e hábitos:** no modo de reordenar, cada linha ganha os botões "Mover para cima" e "Mover para baixo", escondidos da tela. Depois de mover, uma região viva anuncia "Mente, posição 2 de 4".
- **`aria-actions`** (ARIA 1.3) seria o caminho das ações personalizadas do rotor. Enquanto o Safari não der suporte, valem os botões escondidos. Reavaliar a cada versão do iOS.

### Regiões vivas

| Onde | Papel | O que anuncia | Quando |
|---|---|---|---|
| Toast | `role="status"` (educado) | "Caminhada marcada. Desfazer, botão." Nos contadores, com o total: "Ovo, 6 gramas. 52 de 80." | Ao aparecer |
| Sem internet | `role="status"` | "Sem internet. Tudo continua salvo aqui." e depois "Tudo em dia." | Ao mudar |
| Corrida | `aria-live="assertive"` | "Caminhada, 1 minuto e 30." "Último intervalo." "Treino feito." | Em cada troca. O relógio (`role="timer"`) não é anunciado a cada segundo |
| Dia fechado | `role="status"` | "Dia fechado. 11 de 12." | Uma vez, quando fecha |
| Reordenar | `role="status"` | "Mente, posição 2 de 4." | Depois de cada movimento |
| Erro de escrita | `role="alert"` | "Não deu para salvar. Tente de novo em instantes." | Ao acontecer |

O toast não rouba o foco. Os 5 segundos do Desfazer param enquanto o toast tem foco. Quem não alcançar o toast desfaz pelo próprio controle (desmarcar) ou pelo menu do hábito, então nenhuma ação depende do tempo.

## Foco

- **Ao empurrar uma tela:** o foco vai para o título (`h1` com `tabIndex={-1}`), e o VoiceOver lê o nome da tela. Ao voltar, o foco volta para o elemento que abriu.
- **Folha:** ao abrir, o foco vai para o título e fica preso dentro da folha. `Esc` fecha. Ao fechar, o foco volta para o controle que abriu. Sem título (deslize), o foco vai para a pergunta.
- **Fluxo em passos:** a cada passo, o foco vai para o título do passo. Voltar faz o mesmo no passo anterior.
- **Abrir um grupo recolhido:** o foco fica no botão, que passa a "Expandido". O primeiro item novo é o próximo da ordem.
- **Apagar um item** (proteína, água): o foco vai para o próximo item, ou para o título da lista quando não houver próximo.
- **Trocar o dia** (Hoje · outro dia): o foco vai para a faixa "Quarta, 21 out", que tem "Voltar para hoje".
- **Ordem:** a ordem do código é a ordem visual. À noite, o check-in sobe para o topo também no código, e não só no desenho.
- **No computador:** primeiro o link "Ir para o conteúdo" (visível com foco), depois a barra lateral, a área principal e, por fim, o painel da folha, quando aberto. Com o painel aberto, o resto fica inerte (`inert`) até ele fechar.

## Texto Dinâmico

O app instalado só acompanha o tamanho de letra do iPhone se os tamanhos estiverem em `rem` e o `html` seguir a fonte do sistema.

```css
html { font-size: 17px; }
@supports (-webkit-touch-callout: none) {
  html { font: -apple-system-body; }   /* só no iPhone e no iPad; 17 px no tamanho padrão */
}
body { font-family: var(--font-ui); }
```

A escala do design system em `rem`, a partir de 17 px:

| Papel | px | rem |
|---|---|---|
| display | 34 | 2 |
| hero | 44 | 2.588 |
| title | 22 | 1.294 |
| headline | 17 | 1 |
| body | 16 | 0.941 |
| sub | 15 | 0.882 |
| stat | 28 | 1.647 |
| label | 13 | 0.765 |
| caption | 12 | `max(11px, 0.706rem)` |
| micro | 11 | `max(11px, 0.647rem)` |

- Espaços que acompanham o texto (respiro de linha, altura mínima) também em `rem`. Raios, bordas e ícones de controle ficam em px.
- O `max(11px, ...)` garante o mínimo de 11 px quando a pessoa escolhe letra menor.
- O `input` continua com 16 px ou mais em qualquer tamanho, para o iPhone não dar zoom.

### O que muda com letra grande

| Peça | A partir de | Comportamento |
|---|---|---|
| `HabitRow` | lista com menos de 17em de largura | O controle desce para uma segunda linha, alinhado à esquerda do texto. Use uma consulta de contêiner na lista (`@container (max-width: 17em)`) |
| `Button` | sempre | Altura mínima, e o texto quebra em duas linhas em vez de vazar |
| Fileira de chips | sempre | Rola de lado e esmaece no fim. Nenhum chip some |
| `NavBar` | título maior que o espaço | O título corta com reticências e o texto do voltar some, ficando a seta com o mesmo nome |
| `WeekStrip` | Extra Grande | As letras dos dias saem, o anel cresce até 44 px e o número para em 17 px |
| `StatGroup` | Extra Grande | Os números lado a lado viram uma coluna |
| `TabBar` | nunca cresce | Rótulos de 11 px e ícones de 26 px fixos, como no iOS |
| `Ring` grande, `disp-num` | nunca cresce | São números parados, já grandes |

**Como testar:** no iPhone, em Ajustes › Acessibilidade › Tela e Tamanho do Texto › Texto Maior, nos tamanhos padrão, Extra Grande e o primeiro dos grandes de acessibilidade. No Playwright, rodar as telas com o `html` em 17, 23 e 28 px e comparar as capturas.

## Contraste

Texto pede 4,5:1 (3:1 a partir de 24 px, ou 18,7 px em negrito). Gráfico, contorno de controle e ícone que carrega estado pedem 3:1. O `fill` dos pilares é decorativo e sempre vem com número ou texto.

A revisão mudou três tokens, porque não passavam. Os valores em vigor estão em `docs/telas/base.css`. O `:root` de `docs/design-system.html` ainda tem os antigos e precisa ser atualizado na etapa 0.

| Token | Antes | Agora | Resultado |
|---|---|---|---|
| `--text-3` (claro) | `oklch(55% .01 75)` | `oklch(53% .01 75)` | 4,6 a 4,7:1 sobre `--sunken` e `--wash` (era 4,3) |
| `--text-3` (escuro) | `oklch(64% .01 75)` | `oklch(66% .01 75)` | 4,9:1 sobre `--wash` (era 4,4) |
| `--{pilar}-on` e `--accent-on` (claro) | o `--ink` do pilar | `oklch(40% .09 matiz)` (`.08` na primária) | 5,2 a 6,8:1 sobre o `--fill` (era 3,9 a 4,2) |

Também saíram do quadro: rótulos de aba com 10 px (agora 11) e rostinhos a 55% de opacidade (agora 100%, com 3,3:1).

- **`--text-3` sobre `--track`** dá 4,3:1. Ali, use `--text-2`.
- **Toast:** fundo escuro nos dois temas (`--toast-bg`), com ação em `--toast-act`. Mais de 8:1.
- **Como medir:** axe-core 4.8 ou mais novo nos testes do Playwright, que entende OKLCH, nos dois temas. Os traços de SVG (anéis, gráficos) passam por conferência manual com um medidor de contraste, contra o fundo real do cartão.

## Alvo de toque

- Todo alvo tem pelo menos 44 × 44, mesmo quando o desenho é menor. A distância mínima entre dois alvos é de 8 px.
- A área cresce por um pseudo-elemento transparente, sem mudar o desenho. No Tailwind 4:

```css
@utility hit {
  position: relative;
  &::after {
    content: ""; position: absolute; left: 50%; top: 50%;
    width: max(100%, 44px); height: max(100%, 44px); translate: -50% -50%;
  }
}
```

- `CheckButton`, o X da folha, o voltar, os chips, as pílulas, o `Button` pequeno e o `TimeValue` já usam `hit`. Num controle novo menor que 44 px, acrescente a classe.
- Na linha de hábito, a área do controle tem a altura da linha e pelo menos 56 px de largura (regras do Hoje).
- Um pseudo-elemento que passa da borda da tela cria rolagem lateral: não use `hit` num controle vazio.

## Movimento reduzido

Tudo está em [movimento.md](movimento.md#movimento-reduzido). Em resumo:

- O app reduz quando o iPhone pede (`prefers-reduced-motion`) ou quando "Animações" está desligado em Aparência, que põe `data-motion="off"` no `html` e troca o `MotionConfig` para `reducedMotion="always"`.
- Os tokens de CSS já mudam sozinhos: `--dur-fill`, `--dur-ring` e `--dur-glow` vão a 0, `--dur-base` vai a 150 ms, e `--rise` e `--press-scale` param de mover. Use os tokens e nunca escreva uma duração à mão.
- O app continua completo: nenhuma informação depende de animação.

## Teclado no computador

| Tecla | Faz |
|---|---|
| `Tab` e `Shift+Tab` | Anda pelos controles na ordem visual |
| `Enter` | Abre a linha (hábito, item de lista) ou aciona o botão |
| `Espaço` | Marca o `CheckButton`, liga o `Switch` e os chips, aciona o botão |
| `Esc` | Fecha a folha, o diálogo ou a tela cheia. O foco volta para quem abriu |
| Setas | Andam dentro de um grupo: abas, `SegmentedControl`, rostinhos, `DayPicker`, opções e a grade do heatmap |
| `Shift+F10` ou a tecla de menu | Abre o menu do hábito na linha com foco (o toque longo) |
| `Espaço`, setas, `Espaço` | Na alça de reordenar: pega, move e solta. `Esc` cancela |

- O foco nunca fica preso fora de uma folha ou diálogo.
- Os atalhos do computador (registrar, trocar de aba) estão em [telas/entrada.md](telas/entrada.md). Nenhum atalho usa uma letra sozinha num campo de texto.

## Lista de verificação por etapa

As etapas são as de [../desenvolvimento.md](../desenvolvimento.md).

**0 · Fundação**
- [ ] `lang="pt-BR"` no `html` e `lang="el"` no grego.
- [ ] Tokens de contraste novos no `@theme`, nos dois temas (atualizar o `design-system.html`).
- [ ] Escala de tipo em `rem`, com `-apple-system-body` no iPhone e o mínimo de 11 px.
- [ ] Utilitário `hit` e anel de foco (`:focus-visible`) no CSS base.
- [ ] axe-core no Playwright desde o primeiro teste.

**1 · Casca e movimento**
- [ ] `TabBar` com `tablist`, `tab` e `aria-selected`; setas no computador.
- [ ] Foco no título ao empurrar e de volta ao abridor ao voltar.
- [ ] `Sheet` sobre o `Dialog` do Base UI: foco preso, `Esc`, retorno do foco, nome igual ao título.
- [ ] `Toast` com `role="status"`, sem roubar o foco, com o tempo parado enquanto tem foco.
- [ ] Movimento reduzido pelos dois caminhos (iPhone e interruptor), conferido no laboratório.
- [ ] Link "Ir para o conteúdo" e `inert` atrás do painel no computador.

**2 · Dados e domínio**
- [ ] Os textos de anúncio saem do domínio junto com os números ("46 de 80 gramas", "3 de 7 nesta semana"), para a tela não montar frase.
- [ ] Ações devolvem o texto do toast e o do anúncio.

**3 · Hoje e registros**
- [ ] `HabitRow` com dois alvos (linha e controle) e o botão escondido "Mais opções".
- [ ] `CheckButton`, `ActionPill`, `PlusButton` e `QuickAddButton` com nome e estado.
- [ ] `WeekStrip` como lista, com cada dia passado como botão nomeado.
- [ ] Folhas com o campo visível acima do teclado e campos de 16 px.
- [ ] Toast dos contadores com o total no anúncio.
- [ ] Testar o Hoje inteiro com o VoiceOver e com Texto Extra Grande.

**4 · Entrada**
- [ ] `StepTop` com `progressbar` e foco no título de cada passo.
- [ ] Botão do Google com nome em texto, sem depender do logo.

**5 · Hábito e Progresso**
- [ ] Gráficos com `role="img"`, a frase da tendência e "Ver como lista".
- [ ] Heatmap com a frase do período e navegação por setas no computador.
- [ ] Insights e números com rótulo na ordem de leitura.

**6 · Jornada**
- [ ] Corrida com `role="timer"` e região viva só nas trocas.
- [ ] Encerrar a corrida com alternativa ao toque longo para o VoiceOver (tocar duas vezes e segurar, ou o botão de encerrar na folha).
- [ ] Confete `aria-hidden`; a fase nova anunciada pelo título.

**7 · Ajustes**
- [ ] Reordenar com "Mover para cima" e "Mover para baixo" e o anúncio da posição.
- [ ] `Switch`, `DayPicker` e `TimeValue` com nome e estado.
- [ ] O interruptor "Animações" ligado ao `data-motion` e ao `MotionConfig`.
- [ ] "Apagar todos os dados" sem depender só da cor de atenção.

**8 · Computador**
- [ ] Ordem: link de pular, barra lateral, conteúdo, painel.
- [ ] Todas as teclas da tabela acima, incluindo `Shift+F10` e o reordenar pelo teclado.
- [ ] axe sem violações nos dois temas, no tamanho do iPhone e no do computador.
