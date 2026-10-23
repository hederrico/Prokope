# Movimento

Este documento define como as coisas se mexem no Prokopē: os princípios, os tokens (durações, curvas e molas), a ordem em que as animações acontecem, a escada de celebração, o movimento reduzido e o código de referência. As especificações de cada tela (`telas/*.md`) usam os nomes definidos aqui.

## Princípios

1. **Calma primeiro.** O app é aberto cedo, meio acordado, e à noite, antes de dormir. O movimento é curto e amortecido, quica pouco e nunca pisca. Nada se mexe sozinho para chamar atenção.
2. **Movimento explica causa e efeito.** Toda animação liga uma ação ao resultado dela: o toque no ✓ enche a barra, e a barra cheia completa o anel do dia. Se uma animação não explica nada, ela sai.
3. **O feito ganha o brilho.** A celebração é proporcional ao feito (veja a escada abaixo). O que falta nunca anima: não existe tremida, pulso de cobrança ou contagem regressiva vermelha.
4. **Resposta imediata e interrompível.** O toque responde em até 100 ms. Nenhuma animação bloqueia o próximo toque, e toda animação pode ser interrompida no meio (por isso as molas).
5. **Nada muda de lugar debaixo do dedo.** O que é tocado responde no lugar. Mudanças de posição (recolher um momento completo, mandar um hábito para o fim do grupo, reorganizar o Hoje pelo horário) acontecem na próxima vez que a tela aparece.
6. **O corpo de quem usa manda.** Com movimento reduzido, deslocamento e escala viram troca de opacidade e cor. Nada de parallax, loop infinito ou animação que começa sozinha.

## Tokens

### Durações

| Token | Valor | Uso |
|---|---|---|
| `press` | 100 ms | Resposta ao toque: escala e fundo do elemento pressionado |
| `micro` (`--dur-1`) | 150 ms | Cor, ícone, chip, interruptor, troca de aba |
| `base` (`--dur-2`) | 240 ms | Elementos entrando e saindo, toast, folha fechando |
| `fill` (`--dur-3`) | 400 ms | Barras, números (NumberFlow), passo da revisão |
| `ring` (`--dur-4`) | 600 ms | Anéis grandes (água, dia fechado) e gráficos se desenhando. Os anéis pequenos da semana usam `fill` |
| `glow` | 900 ms | Brilho do dia fechado |
| `confetti` | 1.600 ms | Confete da fase desbloqueada (o único) |

- A saída dura cerca de 70% da entrada: o que some não pode atrasar o que vem.
- Nenhuma animação de interface passa de 600 ms. Só o brilho e o confete passam, e eles não bloqueiam nada.

### Curvas

| Token | Valor | Uso |
|---|---|---|
| `--ease-out` (`--ease`) | `cubic-bezier(.2, .8, .2, 1)` | Padrão para entrar e para preencher (barras, anéis) |
| `--ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` | Mover algo que já está na tela de um lugar para outro |
| `--ease-exit` | `cubic-bezier(.4, 0, 1, 1)` | Sair (toast, item apagado) |
| `--ease-spring` | `cubic-bezier(.34, 1.56, .64, 1)` | Só no CSS puro, quando não há mola do Motion (o ✓ no guia) |

### Molas (Motion)

As molas usam `visualDuration` (o tempo até parecer parado) e `bounce` (de 0 a 1). Com a mola, a animação herda a velocidade do dedo e pode ser interrompida sem salto.

| Nome | `visualDuration` | `bounce` | Uso |
|---|---|---|---|
| `calma` | 0,35 s | 0 | Telas empurradas, mudanças de layout, listas que reordenam |
| `toque` | 0,25 s | 0,25 | ✓ do hábito, rostinho escolhido, chip selecionado |
| `folha` | 0,40 s | 0,08 | Folha abrindo e voltando ao lugar depois de um arrasto |
| `festa` | 0,60 s | 0,35 | Título da fase desbloqueada, selo de novo recorde |

### Distâncias e escala

- **Entrada de elemento:** sobe de 8 px com opacidade de 0 a 1. Nunca mais que 16 px.
- **Tela empurrada:** a nova entra de 100% da largura; a anterior recua 25% e escurece 6%.
- **Folha:** sobe da borda de baixo; o fundo escurece até 38% no claro e 55% no escuro (o token `--dim`).
- **Toque:** cartões e botões vão a 0,97 de escala; o círculo do ✓ vai a 0,9 e volta com a mola `toque`.
- **Cascata:** 30 ms entre itens, no máximo 6 itens (180 ms no total). Só na primeira vez que a tela aparece, nunca quando os dados atualizam.

## Coreografia

Quando uma ação tem várias consequências, elas acontecem em ordem, do lugar do toque para longe:

| Tempo | O que anima | Exemplo (marcar a caminhada) |
|---|---|---|
| 0 ms | O que foi tocado | O círculo encolhe, preenche e o ✓ se desenha |
| +60 ms | A consequência local | As bolinhas "2 de 7" viram "3 de 7"; a linha esmaece para "feito" |
| +120 ms | O reflexo distante | O anel de hoje na semana (em `fill`, porque é pequeno) e o "4 de 12 feitos hoje" do cartão da semana andam |
| +200 ms | O toast | O toast "Desfazer" sobe, quando a ação tem um |
| até 500 ms | Fim | Tudo parado; se foi o último hábito do dia, começa o dia fechado |

- No máximo duas coisas grandes animam ao mesmo tempo.
- Uma mudança que chega de outro aparelho (a pessoa marcou no PC) aparece com uma troca suave de 150 ms, sem cascata e sem celebração. Só o que foi feito nesta tela celebra. No código, isso se distingue pelo `hasPendingWrites` do Firestore (veja [comunicacao.md](comunicacao.md)).

## Escada de celebração

| Nível | Quando | O que acontece | Duração |
|---|---|---|---|
| 1 · Toque | Marcar um hábito, escolher uma nota | Mola `toque` no controle, ícone passa de Duotone para Fill, vibração bônus | 250 ms |
| 2 · Meta do dia | Proteína ou água chega à meta | A barra encosta na linha de meta, a linha acende (de `mark` para `ink`) e entra o selo "meta batida" | 400 ms |
| 3 · Momento concluído | Todos os hábitos da manhã feitos | O "1 de 2" do grupo vira "feito" com troca suave, e o grupo pode recolher | 240 ms |
| 4 · Dia fechado | O último hábito que se marca no próprio dia | O anel completa, brilha uma vez e assenta; entra "Dia fechado". Acontece uma vez por dia e não repete ao reabrir o app | 600 + 900 ms |
| 5 · Novo recorde | "Dias sem" passa do recorde | O número rola e entra o selo "novo recorde" com a mola `festa` | 600 ms |
| 6 · Fase desbloqueada | Começar uma fase nova pela revisão (da 2 em diante; começar a fase 1 no primeiro acesso é calmo, só com a cascata do primeiro Hoje) | Confete nas cores dos pilares, uma vez, e o título com a mola `festa` | 1.600 ms |

Fora da escada:

- **Deslize:** o número desce até 0, devagar (`fill`), e o recorde fica em destaque. Sem tremida e sem cor de alerta.
- **Números grandes de "dias sem":** são da Fraunces, que não tem algarismos tabulares. Eles rolam algarismo por algarismo com a largura de cada um animada (demonstração 12 do laboratório). É a única exceção à regra de que número que anima usa a Onest.
- **Meta passada:** a barra continua enchendo além da linha e mostra "+6 g". O selo não repete.
- **Desfazer:** a animação volta pelo mesmo caminho, sem celebração.

## Movimento reduzido

O app reduz o movimento quando o iPhone pede (`prefers-reduced-motion: reduce`) ou quando a pessoa desliga "Animações" em Ajustes › Aparência. O interruptor do app só reduz; ele não liga o movimento se o iPhone pediu para reduzir.

| Com movimento | Reduzido |
|---|---|
| Tela empurrada entrando da direita | Troca de opacidade de 150 ms |
| Folha subindo | Folha aparece com opacidade de 150 ms; o arrasto para fechar continua funcionando |
| Mola com quique | Transição de 150 ms sem quique |
| Barras e anéis enchendo | Vão direto ao valor, com troca de opacidade de 150 ms |
| Números rolando (NumberFlow) | Trocam de uma vez (`respectMotionPreference`, que já é o padrão) |
| Cascata de entrada | Tudo entra junto |
| Brilho do dia fechado | Brilho parado e suave |
| Confete | Confete parado, desenhado ao redor do título |

No Motion, `<MotionConfig reducedMotion="user">` já desliga transformações e layout e mantém opacidade e cor. O interruptor do app troca esse valor para `"always"`.

## Desempenho

- Anime só `transform` e `opacity`. Nos anéis, `strokeDashoffset` (com o `pathLength` do Motion). Altura só pela animação de layout do Motion ou por `height: auto` do Motion, nunca por `max-height`.
- `will-change` só durante a animação.
- Carregue o Motion com `LazyMotion`. As funções de arrasto e layout (`domMax`) entram sob demanda, junto com a primeira folha ou lista arrastável.
- `backdrop-filter` só na barra de abas e no fundo da folha, nunca em cartões de lista.
- Teste no iPhone com o Modo de Pouca Energia ligado: as animações precisam continuar suaves a 60 quadros.

## Vibração e som

- **Vibração:** o Safari não tem API de vibração. O truque do interruptor nativo (`<input type="checkbox" switch>` escondido, alternado por código) gera uma vibração leve no iOS 18 ou mais novo. É um bônus, usado só nos níveis 1, 2 e 4 da escada. Se o truque parar de funcionar numa versão do iOS, nada quebra.
- **Som:** desligado por padrão (Ajustes › Aparência › "Som suave ao marcar"). Um único som curto e grave, gerado pela Web Audio, no nível 1 da escada. Nunca toca no modo silencioso do iPhone (o Safari já respeita).
- **Exceção da corrida:** na corrida em andamento, o som das trocas de intervalo fica ligado por padrão e tem um interruptor próprio na tela, porque a pessoa não está olhando para o celular. A troca também tenta a vibração bônus.

## Código de referência

Os tokens vivem em dois lugares: CSS (para o Tailwind e transições simples) e TypeScript (para o Motion).

```css
/* src/styles/tokens.css, dentro do @theme do Tailwind 4 */
@theme {
  --ease-out: cubic-bezier(.2, .8, .2, 1);
  --ease-in-out: cubic-bezier(.65, 0, .35, 1);
  --ease-exit: cubic-bezier(.4, 0, 1, 1);
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
  --duration-press: 100ms;
  --duration-micro: 150ms;
  --duration-base: 240ms;
  --duration-fill: 400ms;
  --duration-ring: 600ms;
}
```

```ts
// src/motion/tokens.ts
export const dur = { press: 0.1, micro: 0.15, base: 0.24, fill: 0.4, ring: 0.6, glow: 0.9, confetti: 1.6 } as const;

export const ease = {
  out: [0.2, 0.8, 0.2, 1],
  inOut: [0.65, 0, 0.35, 1],
  exit: [0.4, 0, 1, 1],
} as const;

export const spring = {
  calma: { type: 'spring', visualDuration: 0.35, bounce: 0 },
  toque: { type: 'spring', visualDuration: 0.25, bounce: 0.25 },
  folha: { type: 'spring', visualDuration: 0.4, bounce: 0.08 },
  festa: { type: 'spring', visualDuration: 0.6, bounce: 0.35 },
} as const;

// entrada padrão de um elemento
export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: dur.micro, ease: ease.exit } },
};

// cascata: só na primeira montagem da tela
export const cascade = { animate: { transition: { staggerChildren: 0.03, delayChildren: 0 } } };
```

```tsx
// NumberFlow com os tokens (gramas, litros, minutos, contadores)
<NumberFlow
  value={gramas}
  locales="pt-BR"
  suffix=" g"
  transformTiming={{ duration: 400, easing: 'cubic-bezier(.2, .8, .2, 1)' }}
  spinTiming={{ duration: 400, easing: 'cubic-bezier(.2, .8, .2, 1)' }}
/>
```

O laboratório de movimento ([laboratorio.html](laboratorio.html)) mostra cada token e cada animação deste documento funcionando, com velocidade ajustável e o modo reduzido.
