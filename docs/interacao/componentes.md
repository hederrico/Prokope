# Componentes

Cada componente do app, do mais usado ao menos usado: para que serve, o helper que o desenha no quadro (`docs/telas/base.js`), as variações, os estados, as animações, a acessibilidade, as props e a base no shadcn/Base UI. Os tokens de movimento (`press`, `micro`, `base`, `fill`, `ring`, `glow`; molas `calma`, `toque`, `folha`, `festa`) estão em [movimento.md](movimento.md). As regras de acessibilidade do app inteiro estão em [acessibilidade.md](acessibilidade.md).

## Regras comuns

Valem para todo componente tocável, e por isso não se repetem nas seções:

- **Pressionado:** escala `--press-scale` (0,97) e fundo 4% mais escuro, em `press`. Solto, volta com a mola `toque`. Reduzido: só o fundo muda.
- **Área de toque:** pelo menos 44 × 44, com a classe `hit` quando o desenho é menor (veja [acessibilidade.md](acessibilidade.md#alvo-de-toque)).
- **Foco:** anel de 2,5 px em `--accent-mark`, afastado 2 px, só com `:focus-visible`.
- **Desabilitado:** fundo `--track`, texto `--text-3`, sem sombra e sem resposta ao toque. Nunca só opacidade.
- **Toque duplo:** um segundo toque no mesmo controle em até 300 ms é ignorado. `touch-action: manipulation` em tudo.
- **Ícones:** `Icon` é sempre decorativo (`aria-hidden`). O nome do controle vem do texto ou de `aria-label`.
- **Cor de pilar** só em pilar e hábito. O resto usa a primária (`accent`) ou neutros.
- **Altura:** `min-height`, nunca `height`, em tudo que tem texto, para a letra poder crescer.

## HabitRow

A linha de hábito, a peça mais tocada do app. Quadro: `hr()`.

- **Variações:** com `CheckButton` (sim ou não), `ValuePill` (horário registrado), `ActionPill` ("Dar nota", "4 · Bom"), `PlusButton` (limite da semana), `QuickAddButton` (água) ou sem controle (deitar à noite, "Amanhã cedo"). Pode ter `WeekDots` e um `.nudge` (convite gentil) abaixo.
- **Estados:**
  - repouso: título em `--text`;
  - feito: título em `--text-2`, o controle mostra o feito (✓ ou valor) e a linha fica no lugar;
  - pausado ou "hoje não se aplica": vai para o fim do grupo, título em `--text-3` e legenda "não se aplica hoje";
  - pressionado: a linha inteira escurece 4%, sem escala, porque a linha é grande.
- **Toque:** o controle da direita registra. O resto da linha abre o hábito (tela empurrada). O toque longo (500 ms) abre o menu do hábito. Há uma folga de 8 px entre o controle e o texto.
- **Animação:** coreografia padrão de movimento.md. O controle anima em 0 ms, a legenda ("3 de 7") em +60 ms e a cor do título em `micro`. Mudar de grupo (horário editado, pausa) usa layout `calma`. Sair (arquivar) recolhe altura e opacidade em `base`.
- **Acessibilidade:** a linha é um botão com o nome do hábito e a legenda: "Caminhada com o cachorro, 2 de 7 nesta semana, meta 6. Botão." O controle é um elemento separado, com o próprio nome. O toque longo tem uma alternativa: o botão "Mais opções", escondido da tela e visível para o VoiceOver e o teclado. Com letra grande, o controle desce para baixo do título.
- **Base:** `<li>` com um `<button>` para a linha e o controle ao lado (dois alvos, nunca um botão dentro do outro).

```ts
type HabitRowProps = {
  habit: Habit;            // nome, ícone, pilar
  subtitle?: ReactNode;    // "meta 6h50", WeekDots + "2 de 7 · meta 6"
  control?: ReactNode;     // CheckButton, ValuePill, ActionPill, PlusButton...
  done?: boolean;
  muted?: boolean;         // pausado ou não se aplica hoje
  nudge?: { text: string; action: string; onAction: () => void };
  onOpen: () => void;      // tela do hábito
  onLongPress: () => void; // menu do hábito
};
```

## CheckButton

O círculo de marcar um hábito de sim ou não. Quadro: `chk(on, label)`.

- **Estados:** repouso com contorno `--border-strong` de 2 px e miolo vazio; feito com fundo `--fill`, contorno `--mark` e ✓ em `--on`. O estado tem forma (✓) e cor.
- **Animação:** ao marcar, o círculo vai a `--check-scale` (0,9) em `press`, enche e volta com a mola `toque`, e o ✓ se desenha em `micro` (`pathLength` de 0 a 1). O ícone do hábito passa de Duotone para Fill. É o nível 1 da escada de celebração, com vibração bônus. Ao desmarcar, o inverso, sem celebração. Reduzido: o fundo e o ✓ aparecem com opacidade em `micro`.
- **Acessibilidade:** `role="checkbox"`, `aria-checked`, nome do hábito. VoiceOver: "Louça, até 20h30. Caixa de seleção, não marcada." Depois do toque: "marcada".
- **Base:** `Checkbox` do Base UI, com o desenho próprio.

```ts
type CheckButtonProps = { checked: boolean; label: string; onCheckedChange: (v: boolean) => void; pillar: PillarColor };
```

## WeekCard e WeekStrip

A semana com anéis (`WeekStrip`, quadro: `week()`) e o cartão do topo do Hoje, com o resumo do dia (`WeekCard`, quadro: `weekCard(feitos, pct, vals)`).

- **Variações:** `WeekCard` com a linha "3 de 12 feitos hoje · 76% na semana ›". `WeekStrip` solta, dentro de outro cartão (convite da revisão no domingo, primeiro dia).
- **Estados de cada dia:** hoje com anel em `--accent-ink` e número em destaque; passado com anel parcial ou cheio; passado sem registro com o trilho vazio; pausado hachurado; futuro vazado e não tocável; escolhido (Hoje · outro dia) com fundo `--accent-wash` e contorno. A tabela completa está em estados.md.
- **Animação:** o anel de hoje anda em `ring`, +120 ms depois do toque que o mudou (coreografia de movimento.md). Deslizar para a semana anterior troca com opacidade e 12 px na direção do tempo. Na primeira montagem, os anéis aparecem já no valor, sem desenhar. Reduzido: o anel vai direto ao valor.
- **Acessibilidade:** a semana é uma lista. Cada dia passado é um botão: "Quinta, 22. 25% do dia feito. Botão." O futuro é texto. A linha de cima: "3 de 12 feitos hoje" (texto) e "76% na semana. Abre o Progresso. Botão."
- **Base:** sem base; `Ring` por dia.

```ts
type WeekStripProps = { days: { date: string; value: number; state: 'done' | 'empty' | 'paused' | 'future' }[]; today: string; selected?: string; onSelect?: (date: string) => void; head?: ReactNode };
type WeekCardProps = { doneToday: number; totalToday: number; weekPct: number; days: WeekStripProps['days']; onOpenProgress: () => void };
```

## GoalBar

A barra com segmentos e a linha de meta (proteína, água em lista). Quadro: `pbar()`.

- **Variações:** grossa (12 px, cartão principal) e fina (8 px, `thin`). Com ou sem o rótulo dos segmentos.
- **Estados:** vazia (trilho `--track`); andando (segmentos em `--fill`, separados por 2 px); meta batida (a linha de meta passa de `--text-2` para `--ink` e entra a `Tag` "meta batida" com ✓); passou da meta (a barra continua e mostra "+6 g"). Hoje, até o dia fechar, a barra do Progresso fica listrada.
- **Animação:** o segmento novo cresce de 0 à largura em `fill`, com `--ease-out`. Meta batida é o nível 2 da escada (400 ms). O total ao lado rola com o NumberFlow em `fill`. Reduzido: a largura troca de uma vez e o segmento novo aparece com opacidade em `micro`.
- **Acessibilidade:** `role="meter"` com `aria-valuenow`, `aria-valuemax` e o texto "46 de 80 gramas". Os segmentos não são lidos um a um.
- **Base:** `Meter` do Base UI.

```ts
type GoalBarProps = { segments: number[]; goal: number; scale: number; unit: string; thin?: boolean; striped?: boolean };
```

## Ring

O anel de progresso (dia, água, constância, dia fechado, corrida). Quadro: `ring()` e `ringBox()`.

- **Variações:** 36 px (semana), 40 px (água na linha), 56 a 132 px (cartões), 196 px (dia fechado), 264 px (corrida). Traço de cerca de 10% do diâmetro, ponta redonda, começa às 12h.
- **Estados:** vazio (só o trilho), andando, cheio. Cheio no dia fechado ganha o brilho.
- **Animação:** `strokeDashoffset` em `ring` (600 ms), com o `pathLength` do Motion. Dia fechado: completa em `ring` e brilha uma vez em `glow` (nível 4). Reduzido: vai direto ao valor e o brilho fica parado.
- **Acessibilidade:** o SVG é decorativo. O conteúdo do centro dá o nome, ou `role="meter"` com o texto ("Água, 1,5 de 3 litros").
- **Base:** SVG próprio.

```ts
type RingProps = { size: number; stroke?: number; value: number; color?: string; track?: string; label?: string; children?: ReactNode; glow?: boolean };
```

## Sheet

A folha que sobe de baixo para registrar ou escolher algo rápido. Quadro: `sheet(title, body, { top })`.

- **Variações:** baixa (altura do conteúdo), alta (`top` de 56 px, check-in), sem título (deslize, com "Cancelar" no lugar do X). No computador, vira painel de 420 px à direita.
- **Partes:** alça de 36 × 5 px, título na serifa 24, X de 32 px (área de 44) e o corpo, que rola. A ação principal fica presa embaixo, acima do teclado.
- **Animação:** abre com a mola `folha`, e o fundo escurece em `base` (32% no claro, 50% no escuro). Fecha em `base` com `--ease-exit`. O arrasto segue o dedo e fecha ao passar de 30% da altura ou de 600 px/s (navegacao.md). Reduzido: entra e sai com opacidade em `micro`; o arrasto continua.
- **Acessibilidade:** `role="dialog"`, `aria-modal`, nome igual ao título. Ao abrir, o foco vai para o título e fica preso na folha. Ao fechar, volta para quem abriu. VoiceOver: "Proteína. Diálogo." O X: "Fechar. Botão." Escape fecha no computador.
- **Base:** `Dialog` do Base UI (o `Sheet` do shadcn com `side="bottom"`), com o arrasto feito no Motion.

```ts
type SheetProps = { open: boolean; onOpenChange: (o: boolean) => void; title?: ReactNode; label?: string; tall?: boolean; footer?: ReactNode; children: ReactNode };
```

## Toast

O aviso curto com Desfazer. Quadro: `toast()`.

- **Variações:** com ícone do pilar (marcar, somar), sem ícone, com ação cheia ("Atualizar", na versão nova), com o fio que esvazia em 5 s.
- **Cores:** fundo escuro nos dois temas (`--toast-bg`), texto `--toast-fg`, ação `--toast-act`. No escuro, um fio de contorno separa o toast do fundo.
- **Posição:** 8 px acima da barra de abas, ou da borda segura numa tela sem abas. Um por vez.
- **Animação:** entra com `fadeUp` (8 px em `base`) e sai em `micro` com `--ease-exit`. O fio esvazia em 5 s, linear. Arrastar para baixo dispensa. Reduzido: entra e sai só com opacidade; o fio continua, porque é informação.
- **Acessibilidade:** `role="status"` (`aria-live="polite"`): "Caminhada marcada. Desfazer, botão." O toast não rouba o foco. O tempo para enquanto o toast tem foco ou o dedo está sobre ele.
- **Base:** Sonner (o `Toaster` do shadcn), com o conteúdo próprio.

```ts
type ToastInput = { title: string; detail?: string; icon?: IconName; pillar?: PillarColor; action?: { label: string; onClick: () => void; filled?: boolean }; duration?: number };
```

## TabBar

As quatro abas: Hoje, Progresso, Jornada e Ajustes. Quadro: `tb()`. No computador, vira barra lateral.

- **Estados:** ativa com ícone Fill e texto em `--accent-ink`; inativa com ícone Regular e texto em `--text-3`. Forma (Fill contra Regular) e cor.
- **Rótulos:** 11 px, fixos. Não crescem com o Texto Dinâmico, como no iOS.
- **Animação:** o ícone passa de Regular para Fill com a mola `toque`, e o conteúdo troca com opacidade em `micro`. Tocar na aba ativa volta à raiz ou rola ao topo com `calma`.
- **Acessibilidade:** `role="tablist"`, cada aba com `role="tab"` e `aria-selected`. VoiceOver: "Hoje. Aba, 1 de 4, selecionada." No computador, as setas andam entre as abas.
- **Base:** `NavLink` do React Router com os papéis acima.

```ts
type TabBarProps = { active: 'today' | 'progress' | 'journey' | 'settings' };
```

## NavBar

A barra da tela empurrada e do formulário. Quadro: `nb()`.

- **Variações:** tela empurrada ("‹ Hoje" à esquerda, ação à direita, título opcional); formulário ("Cancelar", título, "Criar" ao criar ou "Salvar" ao editar). Com título na serifa logo abaixo, a barra fica só com o voltar.
- **Estados:** ação desabilitada (`--text-3`) até o campo obrigatório ser preenchido.
- **Animação:** o título troca com opacidade em `micro` durante a passagem. Nada mais anima.
- **Acessibilidade:** voltar é um botão: "Voltar para Hoje. Botão." O título é o cabeçalho da tela. Ação só com ícone leva nome ("Novo hábito"). Com letra grande, o texto do voltar some e fica a seta, com o mesmo nome.
- **Base:** `Button` (variante de texto).

```ts
type NavBarProps = { back?: string; onBack?: () => void; cancel?: boolean; title?: string; action?: { label: string; icon?: IconName; onClick: () => void; disabled?: boolean } };
```

## ScreenHeader e SectionLabel

O cabeçalho de aba (`hd()`) e o rótulo de grupo em caixa alta (`gl()`).

- **ScreenHeader:** contexto (data ou "Desde 21 de setembro") e título na serifa 32. Sem avatar. Pode ter um controle à direita (Semana · Mês no Progresso).
- **SectionLabel:** 12 px, caixa alta, `--text-3`, com um valor à direita ("1 de 2", "a partir das 20h30"). Dentro de folha, sem margem lateral (`.gl.in`).
- **Animação:** nenhuma. A saudação troca com opacidade em `base` quando o momento do dia muda com o app aberto.
- **Acessibilidade:** o título é `h1`. O rótulo de grupo é `h2`, para o rotor do VoiceOver pular de grupo em grupo ("Manhã, cabeçalho nível 2").

```ts
type ScreenHeaderProps = { context?: string; title: string; trailing?: ReactNode };
type SectionLabelProps = { children: string; trailing?: ReactNode; inset?: boolean };
```

## Button

Quadro: `btn()`.

- **Variações:** `primary` (fundo `--btn-bg`), `secondary` (contorno), `ghost` (só texto, 44 px), `tint` (fundo `--ink` do pilar), `warn` (fundo `--warning-ink`, só para o que pede cuidado), `small` (36 px de desenho, 44 de toque), `wide` (largura toda).
- **Medidas:** 52 px de altura mínima, cantos de pílula, texto 17 px. O texto quebra linha em vez de vazar.
- **Estados:** repouso, pressionado, foco, desabilitado (regras comuns). Nunca vermelho.
- **Acessibilidade:** `<button>` com o texto como nome. "Começar revisão. Botão."
- **Base:** `Button` do shadcn.

```ts
type ButtonProps = { variant?: 'primary' | 'secondary' | 'ghost' | 'tint' | 'warn'; size?: 'md' | 'sm'; wide?: boolean; icon?: IconName; disabled?: boolean; onClick: () => void; children: ReactNode };
```

## ValuePill, ActionPill, PlusButton e QuickAddButton

Os controles à direita da linha. Quadro: `vpill()`, `doPill()`, `plusBtn()`, `addPill()`.

| Componente | Mostra | Toque | VoiceOver |
|---|---|---|---|
| `ValuePill` | O valor registrado ("06h52 ✓", "83,6 kg ✓", "22h" fantasma) | Abre a folha para corrigir | "Acordar, 6h52, feito. Botão, abre o horário." |
| `ActionPill` | "Dar nota", depois "4 · Bom" | Abre a folha da nota | "Almoço, sem nota. Dar nota. Botão." |
| `PlusButton` | "+" num círculo de 40 px | Usa um do limite, com Desfazer | "Refeições livres, 0 de 2 na semana. Usar uma. Botão." |
| `QuickAddButton` | "+ 500 ml" | Soma na hora, com Desfazer | "Somar 500 mililitros. Botão." |

- **Estados:** a `ValuePill` feita usa o fundo `--success-wash` com ✓; a fantasma usa `--sunken` e `--text-2` (ainda não registrado). O `PlusButton` com o limite cheio continua disponível e neutro ("2 de 2 · a semana recomeça amanhã").
- **Animação:** o valor novo troca com o NumberFlow em `fill`. O "+" responde como o `CheckButton`, sem o ✓. Somar não celebra; a meta batida celebra na `GoalBar`.
- **Medidas:** 40 px de desenho e 44 de toque. A área de toque tem a altura da linha.
- **Base:** `<button>`.

```ts
type ValuePillProps = { value: string; state?: 'done' | 'ghost' | 'ok'; icon?: IconName; onClick: () => void; label: string };
type ActionPillProps = { children: string; onClick: () => void; label: string };
type PlusButtonProps = { onClick: () => void; label: string };
type QuickAddButtonProps = { amount: string; onClick: () => void };
```

## QuickAddGrid

Os botões rápidos da proteína, que somam na hora. Quadro: classes `.qa` e `.q` (o quadro não tem helper, então o nome do componente é novo).

- **Variações:** 3 botões que seguem a hora (no café, ovo, leite e whey; no almoço, frango, feijão e queijo) mais "Mais", que abre a folha. Na folha da proteína, os 7 alimentos e "Outro".
- **Medidas:** 48 px de altura, nome em 13 px e valor em 12 px no `--ink`.
- **Animação:** o toque soma; a `GoalBar` ao lado cresce em `fill` e o total rola. O botão só responde ao toque.
- **Acessibilidade:** "Somar ovo, 6 gramas. Botão." "Mais alimentos. Botão."

```ts
type QuickAddGridProps = { items: { id: string; name: string; grams: number }[]; onAdd: (id: string) => void; onMore: () => void };
```

## FoldedGroup

Um momento do dia recolhido numa linha: distante (a Noite de manhã) ou completo ("Tudo feito", "Feitos hoje · 8"). Quadro: `fold()`.

- **Partes:** até 4 ícones empilhados, "+n" quando há mais, título, legenda e a seta.
- **Animação:** abre no lugar com layout `calma`, a seta gira 180° em `micro` e os itens entram em cascata (30 ms, no máximo 6). Recolher faz o inverso, sem cascata. Reduzido: troca de altura sem animação e os itens aparecem com opacidade em `micro`.
- **Acessibilidade:** botão com `aria-expanded`: "Noite, 6 hábitos: louça, lixo, jantar e mais 3. Recolhido. Botão."

```ts
type FoldedGroupProps = { icons: { icon: IconName; pillar: PillarColor }[]; more?: number; title: string; subtitle: ReactNode; expanded: boolean; onToggle: () => void; children: ReactNode };
```

## DaysSinceTile

O cartão de "dias sem", com o número grande na serifa e sem controle. Quadro: `semTile()`.

- **Estados:** normal ("recorde 21" à direita); igual ou acima do recorde ("seu recorde" com o troféu, em `--ink`).
- **Animação:** o número muda uma vez por dia, sem animação. No deslize, desce até 0 com o NumberFlow em `fill`. Ao passar do recorde, entra a `Tag` "novo recorde" com a mola `festa` (nível 5).
- **Acessibilidade:** botão que abre o hábito: "Zero refrigerante, 12 dias sem, recorde 21. Botão." O deslize fica no detalhe, longe de um toque sem querer.

```ts
type DaysSinceTileProps = { habit: Habit; days: number; record: number; onOpen: () => void };
```

## BudgetRow e BudgetSlots

O limite da semana (refeições livres, tranqueiras). Quadro: `budget()` e `slots()`.

- **Estados de cada espaço:** livre (contorno), usado (preenchido em `--track`). Passar do limite mostra "3 de 2" em `--text-2`, sem cor nova.
- **Animação:** o espaço usado enche em `micro`.
- **Acessibilidade:** os espaços são decorativos; o texto ao lado diz "1 de 2 na semana".

```ts
type BudgetRowProps = { habit: Habit; used: number; total: number; note?: string; onUse?: () => void };
```

## WeekDots

As 7 bolinhas da semana de um hábito, sempre com o texto "2 de 7 · meta 6". Quadro: `dots()`.

- **Estados:** feita em `--mark`, não feita em `--track`.
- **Animação:** a bolinha nova enche em `micro`, +60 ms depois do toque.
- **Acessibilidade:** decorativa (`aria-hidden`). O texto ao lado é lido.

```ts
type WeekDotsProps = { total: number; done: number };
```

## RatingFaces e Face

Os 5 rostinhos de humor e energia. Quadro: `rf()` e `face()`.

- **Desenho:** na cor primária. No humor muda a boca; na energia, os olhos.
- **Estados:** repouso com contorno `--border` e traço `--accent-mark`; escolhido com fundo `--accent-wash`, contorno `--accent-mark`, rosto em `--accent-ink` e a palavra em negrito.
- **Animação:** o escolhido vai a 1,08 e volta com a mola `toque`; o fundo troca em `micro`. Reduzido: só o fundo.
- **Acessibilidade:** grupo de rádio com nome ("Humor"). Cada rosto: "Bem, 4 de 5. Botão de opção, selecionado."
- **Base:** `RadioGroup` e `Radio` do Base UI.

```ts
type RatingFacesProps = { kind: 'mood' | 'energy'; value?: 1 | 2 | 3 | 4 | 5; onChange: (v: 1 | 2 | 3 | 4 | 5) => void };
type FaceProps = { kind: 'mood' | 'energy'; level: 1 | 2 | 3 | 4 | 5; size?: number };
```

## RatingRow

A nota de 1 a 5 só para leitura (Progresso). Quadro: `r5()`. Na linha do Hoje, use `ActionPill`.

- **Acessibilidade:** `role="img"`: "Nota 4 de 5" ou "Sem nota".

```ts
type RatingRowProps = { value?: 1 | 2 | 3 | 4 | 5 };
```

## InsightCard

A frase do que os dados mostram. Quadro: classe `.insight`.

- **Partes:** ícone do pilar, a frase e a base ("24 dias com · 8 dias sem"). Pode trazer dois rostinhos lado a lado.
- **Regra:** só aparece com 7 dias com e 7 sem. Antes disso, entra a frase de poucos dados de estados.md.
- **Animação:** `fadeUp` na primeira vez que aparece. Depois, parado.
- **Acessibilidade:** texto corrido. Os rostinhos são decorativos, e os números estão na frase.

```ts
type InsightCardProps = { pillar: PillarColor; icon: IconName; text: string; basis?: string; compare?: { with: number; without: number } };
```

## Stat e StatGroup

O número grande (`.stat`, 28 px; `.big`, 44 px) e os números lado a lado com divisória (`.stats`).

- **Regra:** número que muda usa a Onest com algarismos tabulares. A serifa fica para números parados (o "12" do dias sem).
- **Animação:** NumberFlow em `fill`. Reduzido: troca de uma vez.
- **Acessibilidade:** cada número com o rótulo, na ordem de leitura: "Recorde, 21 dias."

```ts
type StatProps = { value: number | string; unit?: string; label: string; icon?: IconName; size?: 'md' | 'lg' };
type StatGroupProps = { items: StatProps[] };
```

## ListItem e ListGroup

A lista no estilo de Ajustes. Quadro: `li()` e `lg()`.

- **Variações:** com bolha de ícone (neutra em Ajustes; cor do pilar só em pilar e hábito), com valor à direita e seta, com `Switch`, com `TimeValue`, de atenção ("Apagar todos os dados", em `--warning-ink`).
- **Medidas:** 52 px de altura mínima, divisória de 1 px.
- **Animação:** nenhuma além do pressionado.
- **Acessibilidade:** a linha inteira é o alvo. Com seta, é um link: "Horários. Botão." Com `Switch`, o nome do interruptor é o título da linha.

```ts
type ListItemProps = { icon?: IconName; pillar?: PillarColor; title: string; subtitle?: string; value?: string; chevron?: boolean; trailing?: ReactNode; tone?: 'warn'; onClick?: () => void };
```

## Chip

Quadro: `chip()`.

- **Variações:** filtro (liga e desliga), opção de lista ("Proteína ✓" no prato), informativo (hábitos da fase na Jornada).
- **Estados:** desligado com contorno `--border`; ligado com fundo `--text` e texto `--bg` (`sel`), ou fundo `--wash` com ✓ (`tint`). O ligado tem ✓ ou fundo cheio, nunca só a cor.
- **Medidas:** 34 px de desenho, 44 de toque. Fileira longa rola de lado e esmaece no fim (`.chips.nowrap`).
- **Animação:** fundo em `micro`; o ✓ entra com a mola `toque`.
- **Acessibilidade:** chip que liga e desliga tem `aria-pressed`: "Proteína. Botão de alternar, ativado." Chip informativo é texto.
- **Base:** `Toggle` do Base UI para os que ligam e desligam.

```ts
type ChipProps = { children: string; selected?: boolean; tint?: boolean; icon?: IconName; detail?: string; onClick?: () => void };
```

## Switch

Quadro: `sw()`.

- **Estados:** desligado com trilho `--track`; ligado com trilho `--success-fill`. O botão branco muda de lado (forma) e o trilho muda de cor.
- **Animação:** o botão desliza com a mola `toque`, e o trilho troca de cor em `micro`. Reduzido: o botão pula de lado e só a cor anima.
- **Acessibilidade:** `role="switch"`: "Tolerância de 1h. Interruptor, ligado." A linha inteira liga e desliga.
- **Base:** `Switch` do Base UI.

```ts
type SwitchProps = { checked: boolean; onCheckedChange: (v: boolean) => void; label: string };
```

## SegmentedControl

Quadro: `seg()`.

- **Medidas:** 40 px de altura total, segmentos de 36 px, texto 14 px.
- **Estados:** escolhido com fundo `--raised` e sombra; os outros em `--text-2`.
- **Animação:** o fundo escolhido desliza de um segmento para o outro (`layoutId`) com `calma`. Reduzido: troca com opacidade em `micro`.
- **Acessibilidade:** grupo de rádio com nome: "Período. Semana. Botão de opção, 1 de 2, selecionado." As setas trocam a opção no computador.
- **Base:** `RadioGroup` do Base UI.

```ts
type SegmentedControlProps<T extends string> = { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string };
```

## TextField

Quadro: `fld()`.

- **Medidas:** 48 px de altura mínima, texto de 16 px (o iPhone não dá zoom), fundo `--sunken`.
- **Variações:** texto curto, texto longo (cresce até 4 linhas), número (`inputmode="decimal"`, com a unidade à direita), busca (com a lupa).
- **Estados:** vazio com o exemplo em `--text-3`; com foco, contorno de 2 px em `--accent-mark`; com erro, frase abaixo em `--text-2` e ícone, nunca vermelho.
- **Acessibilidade:** rótulo sempre visível acima (`label`), e o exemplo nunca substitui o rótulo. `enterkeyhint` conforme gestos-e-feedback.md.
- **Base:** `Field` e `Input` do Base UI.

```ts
type TextFieldProps = { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; inputMode?: 'text' | 'decimal' | 'numeric'; unit?: string; icon?: IconName };
```

## TimeValue

O horário ou a data que se toca para mudar ("06:50", "qui, 24 dez"). Quadro: `tval()`.

- **Variações:** normal (fundo `--sunken`), sobre fundo `--sunken` (`raised`, com contorno), ainda não vale (`off`, contorno e `--text-3`, como o fim da cafeína antes da fase 4).
- **Comportamento:** por baixo é um `<input type="time">` (ou `date`) nativo, que abre a roda do iOS.
- **Acessibilidade:** "Acordar, 6 horas e 50 minutos. Ajustável."

```ts
type TimeValueProps = { kind: 'time' | 'date'; value: string; onChange: (v: string) => void; label: string; off?: boolean; raised?: boolean };
```

## DayPicker

Os dias da semana (agenda de um hábito, coleta do lixo, programa a dois). Quadro: `days()`.

- **Variações:** vários dias (`group`) ou um só (`single`, na revisão).
- **Estados:** marcado com fundo `--wash`, contorno de 1,5 px em `--mark`, texto em `--ink` e ✓ embaixo do nome. Desmarcado com contorno `--border`.
- **Medidas:** 52 px de altura, 7 colunas iguais.
- **Animação:** fundo e ✓ em `micro`.
- **Acessibilidade:** cada dia: "Segunda. Caixa de seleção, marcada." Na escolha única: "Sábado. Botão de opção, selecionado."
- **Base:** `CheckboxGroup` ou `RadioGroup` do Base UI.

```ts
type DayPickerProps = { value: number[]; onChange: (v: number[]) => void; single?: boolean; pillar?: PillarColor; label: string };
```

## Heatmap e HeatmapKey

A grade do hábito, uma semana por coluna, e a legenda. Quadro: `heat()` e `heatKey()`.

- **Estados de cada dia:** feito (cheio em `--fill`), parcial (meio cheio, de baixo para cima), não feito (trilho), pausado (hachurado), fora da agenda (pontilhado), futuro (vazado), hoje (anel em volta). Todo estado tem forma.
- **Animação:** só a célula de hoje anima, em `micro`, quando o hábito é marcado. A grade não entra em cascata.
- **Acessibilidade:** `role="img"` com a frase do período: "Desde 21 de setembro: 24 dias feitos, 1 parcial, 8 sem caminhada." Tocar num dia abre aquele dia; com o VoiceOver, a grade tem a alternativa "Ver como lista".
- **Base:** grade CSS ou SVG próprio.

```ts
type HeatmapProps = { days: { date: string; state: 'done' | 'partial' | 'none' | 'paused' | 'off' | 'future' }[]; today: string; label: string; onSelect?: (date: string) => void };
type HeatmapKeyProps = { items: { state: HeatmapProps['days'][number]['state'] | 'today'; label: string }[] };
```

## MiniBar

A barra fina de porcentagem (força do hábito, pilares, notas). Quadro: `mbar()`.

- **Medidas:** 6 px (ou 8 px, `thick`), cantos redondos, preenchimento em `--mark`.
- **Animação:** largura em `fill` ao aparecer pela primeira vez com valor novo.
- **Acessibilidade:** decorativa. A porcentagem fica em texto ao lado.

```ts
type MiniBarProps = { value: number; thick?: boolean };
```

## Tag

O selo pequeno ("Família", "meta batida", "recorde", "Agora", "fase 4"). Quadro: `tag()`.

- **Variações:** com bolinha do pilar (`dot`), com ícone, em caixa alta (`up`), com fundo branco sobre `--wash` (`lift`).
- **Animação:** quando o selo nasce de uma conquista (meta batida, novo recorde), entra com a mola `toque` ou `festa`, conforme a escada. Os outros não animam.
- **Acessibilidade:** texto. Ícone decorativo.

```ts
type TagProps = { children: string; pillar?: PillarColor; icon?: IconName; dot?: boolean; upper?: boolean; lift?: boolean };
```

## CardHeader

O título de cartão, com legenda e algo à direita. Quadro: `ch()`.

- **Acessibilidade:** o título é `h3` dentro da seção.

```ts
type CardHeaderProps = { title: string; subtitle?: string; trailing?: ReactNode };
```

## StepTop

O topo dos fluxos em passos (primeiro acesso, revisão). Quadro: `stepTop()`.

- **Partes:** voltar a partir do passo 2, os trechos do progresso e o X quando o fluxo pode ser interrompido (a revisão pode; o primeiro acesso, não).
- **Animação:** o trecho do passo novo enche em `fill`. O conteúdo troca com 24 px de deslocamento e opacidade (navegacao.md).
- **Acessibilidade:** `role="progressbar"`: "Passo 2 de 3." Ao trocar de passo, o foco vai para o título do passo.
- **Base:** `Progress` do Base UI.

```ts
type StepTopProps = { step: number; total: number; onBack?: () => void; onClose?: () => void };
```

## AddRow

A linha tracejada de adicionar, no fim da lista ("Novo pilar", "Criar outro pilar"). Quadro: `addRow()`.

- **Estados:** repouso com contorno tracejado `--border-strong` e texto `--accent-ink`.
- **Acessibilidade:** botão: "Novo pilar. Botão."

```ts
type AddRowProps = { children: string; onClick: () => void };
```

## OptionCard e Radio

O cartão de escolha com rádio ("Com o plano base", "Do zero", as notas do almoço, o que a outra pessoa vê). Quadro: classe `.opt` e `radio()`.

- **Estados:** escolhido com fundo `--wash`, contorno de 2 px em `--mark` e o rádio cheio. O rádio tem forma (anel grosso) e cor.
- **Animação:** contorno e fundo em `micro`; o anel do rádio cresce com a mola `toque`.
- **Acessibilidade:** grupo de rádio com nome. "Com o plano base, sugerido. Botão de opção, 1 de 2, selecionado."
- **Base:** `RadioGroup` e `Radio` do Base UI.

```ts
type OptionCardProps = { value: string; title: string; description?: string; badge?: string; children?: ReactNode };
```

## ProfileCard

O perfil em Ajustes e em Dados e conta: avatar de 56 px com a inicial, nome e "Conta Google conectada". Quadro: classe `.profile`. É o único lugar do avatar.

- **Acessibilidade:** "Henrique, conta Google conectada. Botão." O avatar é decorativo.

```ts
type ProfileCardProps = { name: string; email?: string; since?: string; onClick?: () => void };
```

## EmptyState

A lista vazia. Quadro: classe `.empty`.

- **Regra:** uma frase em `--text-2`, com uma ação quando houver uma óbvia (estados.md). Sem ilustração e sem tom de erro.
- **Acessibilidade:** texto, com a ação como botão.

```ts
type EmptyStateProps = { icon?: IconName; title: string; detail?: string; action?: { label: string; onClick: () => void } };
```

## Icon

O ícone do Phosphor, ou a `Salsicha` para o cachorro. Quadro: `ico()`.

- **Pesos:** Duotone em hábito e pilar, Regular ao lado de texto, Bold em controles pequenos, Fill na aba ativa.
- **Acessibilidade:** sempre `aria-hidden`. Nunca o único nome de um controle.

```ts
type IconProps = { name: IconName | 'salsicha'; weight?: 'regular' | 'duotone' | 'fill' | 'bold'; size?: number };
```

## Estilos de texto

Sem componente, só classes: `.eyebrow` (sobretítulo em caixa alta), `.lead` (texto de apoio de 16 px), `.foot` (nota de rodapé de lista, 13 px), `.cap`, `.micro`, `.sub`, `.lt`, `.ttl2`, `.ttl3`, `.disp`, `.disp-num`. No app, viram utilitários do Tailwind no `@theme`.

## Componentes de uma tela só

Ficam na especificação da tela, que traz o comportamento de cada um.

| Componente | Onde aparece | Especificação |
|---|---|---|
| `QuickAddGrid`, `QuickAddTile` | Botões de proteína no Hoje e na folha (com `editable` em Novo hábito) | [telas/hoje.md](telas/hoje.md), [telas/registros.md](telas/registros.md) |
| `NudgeStrip`, `CheckinCard`, `DayClosedView`, `ReviewInvite`, `RunStrip` | Hoje | [telas/hoje.md](telas/hoje.md) |
| `EntryRow`, `DecimalField` | Folhas de proteína, água e peso | [telas/registros.md](telas/registros.md) |
| `MonthCalendar`, `PeriodSelector`, `DaySheet`, `WeightChart`, `DailyBarsChart`, `DayRings` | Hábito e Progresso | [telas/habito-progresso.md](telas/habito-progresso.md) |
| `PhasePath`, `RunScreen`, `IntervalStrip`, `ChoiceCard`, `Confetti` | Jornada, corrida, revisão, fase desbloqueada | [telas/jornada.md](telas/jornada.md) |
| `ReorderList`, `PillarPreview`, `ColorPalette`, `IconPicker`, `GoalStepper`, `GoalRamp` | Pilares, novo pilar, novo hábito | [telas/ajustes-plano.md](telas/ajustes-plano.md) |
| `ThemePreview`, `PauseStrip`, `DateSheet`, `PeerCard`, `AlarmRow`, `NumberedSteps` | Aparência, Pausar, A dois, Lembretes | [telas/ajustes-rotina-conta.md](telas/ajustes-rotina-conta.md) |
| `SignInArt`, `DesktopShell`, `SideNav`, `CommandPalette`, `Kbd` | Entrar e computador | [telas/entrada.md](telas/entrada.md) |
| `PastDayBanner`, `HabitMenuSheet`, `PatternWaitCard`, `OfflineNotice`, `Skeleton`, `SkeletonRow`, `PauseCard`, `InstallGuide`, `AccessDeniedScreen` | Estados e feedback | [telas/estados.md](telas/estados.md) |

O `Sheet` ganhou duas props pedidas pelas folhas de registro: `footer` (o botão preso no pé) e `keyboardAware` (a folha sobe com o teclado do iPhone).
