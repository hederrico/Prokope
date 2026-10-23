# Revisão · H · Auditoria transversal

Olhar sobre o quadro inteiro (39 telas, 22 out, por volta das 18h25), no claro e no escuro. Os grupos estavam editando ao mesmo tempo, então algum item pode já ter sido resolvido. Além das capturas, um script mediu no Chrome cada texto, alvo de toque e contraste das telas (`rev-h/audit.html` na pasta de rascunho). Os números de contraste e tamanho abaixo vêm dele.

Grupos: A Entrada e Computador · B Registros · C Hábito e Progresso · D Jornada · E Ajustes 1 · F Ajustes 2 · Hoje (`f-hoje.js`) · I Estados.

## Achados, do maior impacto para o menor

### 1. Faltam caminhos: há tarefas que hoje não têm como ser feitas

**Problema.** Várias setas e cartões levam a lugar nenhum, e três tarefas do dia a dia não têm entrada.

| De → para | Como está | Proposta | Quem |
|---|---|---|---|
| Hoje → detalhe do hábito | Nenhuma linha mostra que abre algo. A regra do toque não está escrita. | Toque no controle da direita registra. Toque no nome abre o detalhe (tela empurrada, voltar "Hoje"). Toque longo abre o menu do hábito. | Hoje, I (menu do hábito) |
| Esqueci de marcar ontem | Sem caminho. | Tocar num dia passado da semana (os anéis do topo) abre aquele dia no mesmo layout do Hoje, com a faixa "Quarta, 21 out" e "Voltar para hoje". | Tela nova (Hoje ou I) |
| Domingo → revisão | A revisão só existe como tela cheia. Nada no app leva até ela. | No domingo, a partir das 18h, o Hoje ganha no topo o cartão "Revisão da semana · 5 min", como o check-in faz às 20h30. Na Jornada, "próxima: domingo, 25 out" vira botão no dia. | Hoje, D |
| Registrar peso | O botão do Progresso não abre nada, e o peso diário não aparece no Hoje. | Folha "Peso" com teclado decimal e o último valor como padrão. Linha "Peso" na manhã do Hoje. | B (folha), Hoje (linha) |
| Jornada ↔ Progresso | "Fase 1 · Base 81% ›" e as revisões têm seta sem destino. "Semana passada 74%" no Progresso não abre nada. | Revisão passada abre só para leitura (as 3 telas, sem botões). "Semana passada" no Progresso abre a mesma revisão. Fase concluída abre o Progresso com o período da fase. | D (tela nova), C |
| Progresso → hábito | As linhas de Caminhada, Futebol e Zero refrigerante parecem tocáveis e não levam a lugar nenhum. | Abrem o detalhe do hábito empurrado dentro da aba Progresso, com voltar "Progresso". | C |
| Hoje → cartão da fase | O cartão "Fase 2 · Alimentação ›" não diz para onde vai. | Troca para a aba Jornada. | Hoje |
| Ajustes → Fases | O item existe, a tela não. Repete a Jornada. | Tela nova de edição de fases (datas, hábitos de cada fase, sugestão aos 70%), com "Editar fases" também na Jornada. | E |
| Corrida | Sem entrada (o Hoje da fase 3) e sem fim (resumo do treino). | Linha "Corrida · semana 1, treino 1" com "Começar" no Hoje. Tela "Treino feito" com tempo e "Voltar ao dia". | D |

### 2. Alvos de toque pequenos justamente nos controles mais usados

**Problema.** Medidas no quadro:

- `r5`: 5 círculos de 28 px em 152 px, na linha do Almoço e do Jantar do Hoje. Com uma mão, às 13h, erra fácil.
- `.xbtn` (fechar de todas as folhas): 32 px. `.ibtn` 36, `.avatar` 36, `.chk` 40.
- `.chip` usado como botão de somar (Ovo, Whey, 500 ml): 32 a 34 px de altura.
- `.sg` (Semana · Mês, Ativos · Próximas fases): 27 px de altura.
- `.btn.sm` ("Fazer" do check-in, "Cancelar" de Dados e conta): 36 px. `.vpill` tocável: 30 px.
- `.xe-qb i` (o x para apagar um botão rápido em Novo hábito): ícone de 11 px.

**Proposta.** A base estende a área de toque para 44 px sem mudar o desenho (B2). O `r5` vira só leitura na lista, e tocar na linha abre a folha da nota, que já tem opções grandes (B7). O grupo E troca o x do botão rápido por "toque para editar" com "Apagar" dentro.
**Quem.** Base, Hoje, E. O grupo D já criou a própria extensão de toque no `.xbtn` da revisão, o que reforça que isso deve morar na base.

### 3. Contraste e tamanho de texto abaixo do combinado

**Problema.**

- `--text-3` sobre `--sunken` e `--wash` dá 4,3:1 no claro: placeholders, horários das listas de registro, legendas da Jornada, títulos da grade de ícones. No escuro, sobre `--wash`, 4,4:1.
- `--on` sobre `--fill` (número ou letra dentro de célula cheia) dá 3,9:1 em Corpo e 4,2:1 em Mente, Família e primária, no claro. Aparece em `r5` marcado, dias marcados (Revisão 2, Novo hábito), número da semana do plano de corrida e nota selecionada do almoço.
- Rótulos da barra de abas com 10 px, a única quebra da regra de 11 px no app inteiro.
- Rostinhos não selecionados com opacidade .55: o traço fica perto de 2:1, abaixo dos 3:1 de elemento gráfico.
- Dia "sem check-in" do Progresso · humor: número em `--text-3` sobre `--track`, 3,9:1.

**Proposta.** Ajustar os tokens (B1), subir a aba para 11 px (B3) e tirar a opacidade dos rostinhos (B5). O estado selecionado continua claro pelo fundo, pelo contorno e pela palavra em negrito. O grupo C usa `--text-2` nos números sobre `--track`.
**Quem.** Base, C.

### 4. Os tipos de navegação não seguem uma regra só

Regra proposta (vale também para o PC):

| Tipo | Quando | Topo | Como volta | Barra de abas |
|---|---|---|---|---|
| Aba | Hoje, Progresso, Jornada, Ajustes | `hd`: contexto + título na serifa 32 | não volta | visível |
| Tela empurrada | detalhe de hábito, plano de corrida, páginas de Ajustes | `nb` com "‹ Origem" | botão à esquerda, sempre visível (o app instalado não tem voltar do navegador) | visível, na aba de origem |
| Folha | registro rápido, confirmação curta | alça + título na serifa 24 + X | X, arrastar ou tocar no fundo | coberta |
| Formulário modal | criar ou editar pilar e hábito | `nb`: Cancelar · título · Criar ou Salvar | Cancelar | escondida |
| Tela cheia | corrida, revisão, primeiro acesso, celebração | `stepTop`: voltar · passos · X | voltar entre passos; X sai e guarda | escondida |

**Onde quebra hoje.**

- Pilares e Hábitos (E) são telas empurradas sem barra de abas. Horários, Lembretes e as demais (F) têm. Proposta: barra visível em todas.
- Revisão (D) tem X e não tem voltar entre os passos. O primeiro acesso (A) tem voltar. Proposta: `stepTop` da base com as duas opções (B6). O X da revisão guarda o que foi preenchido, e o Hoje mostra "Continuar revisão".
- Corrida em andamento (D) tem X e também "Encerrar" com toque longo. O X fura a proteção. Proposta: trocar o X por `caret-down` "Minimizar", com o treino seguindo numa faixa no Hoje.
- Pilares tem "Editar" e as alças de arrastar já visíveis. O "Editar" não tem função. Proposta: tirar.
- Botão de criar: "Criar" em Novo pilar e "Salvar" em Novo hábito. Proposta: "Criar" ao criar, "Salvar" ao editar.
- Adicionar: "+" na barra em Hábitos, linha tracejada em Pilares e no primeiro acesso, chip tracejado em botões rápidos. Proposta: linha tracejada `addRow` da base no fim da lista (B6). Em lista longa, o "+" da barra fica também.
- Pausar e A dois têm título na barra e título na serifa logo abaixo, os dois dizendo a mesma coisa. Proposta: com título na serifa, a barra fica só com o voltar, como no detalhe do hábito.
- O avatar aparece no Hoje e na Jornada e falta no Progresso e nos Ajustes, sem função definida. Proposta: só no Hoje, abrindo Dados e conta.
- Computador (A): falta dizer como folha e tela empurrada aparecem no PC. Proposta: folha vira painel à direita de 420 px; tela empurrada ocupa a área principal, com voltar.

### 5. Cores de pilar usadas para o que não é pilar

**Problema.** Em Ajustes, os itens de menu usam as cores da paleta de pilares: Pilares em lavanda (a cor de Mente), Hábitos em sálvia (Alimentação), Fases em damasco (Corpo), A dois em rosa (Família), Lembretes em mel. Quando alguém cria o pilar "Finanças" em mel, ele fica com a mesma cor de Lembretes. As fases também pegam cor de pilar (fase 2 sálvia, fase 3 damasco), e outra pessoa pode ter outros pilares.
**Proposta.** Cor de pilar só para pilar e hábito. Itens de Ajustes com bolha neutra (`--sunken` e `--text-2`). Fases e Jornada na primária.
**Quem.** E (Ajustes), D (Jornada e Revisão 3). Fica para o Henrique decidir se as fases ganham cor própria.

### 6. Progresso não acompanha os pilares de cada pessoa

**Problema.** Os filtros são Visão geral, Corpo, Humor e Alimentação. Mente e Família ficam de fora. O peso, que é do pilar Alimentação na visão do produto, aparece em "Corpo". A caminhada, do pilar Família, também aparece em "Corpo". Com outra configuração de pilares, os filtros perdem o sentido.
**Proposta.** Filtros = Visão geral, Humor e um chip por pilar, na ordem definida em Ajustes › Pilares. Peso e cintura ganham um chip fixo "Medidas" (todo hábito do tipo Número). Cada vista de pilar monta seções pelo tipo de registro: contador em barras, dias sem em contagem, sim ou não em heatmap.
**Quem.** C.

### 7. Estado mostrado só pela cor

**Problema.**

- Heatmap: "feito" e "parcial" são o mesmo quadrado, só com tons diferentes.
- Dias marcados em Novo hábito (`.xe-days`): só cor.
- A forma certa já existe em Horários (`.xf-days`, com círculo e check), mas ninguém reaproveita.

**Proposta.** "Parcial" vira meio quadrado preenchido de baixo para cima (B4). Um componente `days()` na base, com check no dia marcado, para os três grupos (B6).
**Quem.** Base, C, D, E, F.

### 8. Números que se contradizem entre telas

| O quê | Onde diverge | Fica |
|---|---|---|
| Insight da caminhada | Computador "14 dias com · 12 dias sem"; Hábito "24 dias com · 8 dias sem" | 24 com · 8 sem (bate com 24 caminhadas). Grupo A. |
| Caminhada na semana | Progresso · corpo "3 de 6 da meta" e anel 3/6; Hoje e Hábito "3 de 7 · meta 6" | "3 de 7 · meta 6". Grupo C. |
| Fases em Ajustes › Hábitos | Louça, Lixo e Futebol marcados como "fase 2" | Louça e Lixo na fase 1; Futebol "já ativo". Grupo E. |
| Tipo do check-in | "Lista de passos" | "Nota de 1 a 5", com texto. Grupo E. |
| Tipo da caminhada | Ajustes "Vezes por semana"; Hoje marca como sim ou não | Sim ou não, meta 6 de 7. Grupo E. |
| Cintura | Progresso 96,5 → 95,0 cm; Revisão 2 "91,5 · semana passada 92" | Usar a série do Progresso (95,0 em 18 out). Grupo D. |
| SPEC | Grupo B "total 31", grupo C "total de 46 caminhadas" | A história diz 33 e 24, e as telas já usam esses números. Corrigir o SPEC. |
| Ícone repetido | "Sem Shorts e TikTok" e "Telas desligadas" com o mesmo `device-mobile-slash`, no mesmo pilar | `video-camera-slash` para Shorts e TikTok. Hoje, E, A. |

### 9. Componentes que cada grupo reinventou

| Componente | Versões hoje | Pedido |
|---|---|---|
| Dias da semana | `.xd-days`, `.xe-days`, `.xf-days` | `days()` |
| Valor de horário | `.xf-tm`, `.xa-time`, `.xb-val` | `.tval` e `tval()` |
| Topo de fluxo em passos | `.xa-top/.xa-steps`, `.xd-rvtop/.xd-steps` | `stepTop()` |
| Linha de adicionar | `.xa-add`, `.xe-new`, `.xe-add`, `.xb-q.other` | `.addrow` e `addRow()` |
| Selo pequeno | `.xc-tag`, `.xc-badge`, `.xc-delta`, `.xe-also`, `.xf-tag`, `.xa-sug`, `.xd-tag` | `.tag` e `tag()` |
| Sobretítulo | `.xa-ey`, `.xd-eye` | `.eyebrow` |
| Texto de apoio | `.xa-lead`, `.xf-lead`, `.xf-hero p` | `.lead` |
| Nota de rodapé | `.xf-foot`, `.xe-hint`, `.xe-tip`, `.xe-foot`, `.xb-note`, `.xd-hint`, `.xd-fn`, `.xa-hint` | `.foot` |
| Rótulo de grupo dentro de folha | `.xb-lab`, `.xa-ch`, `.xe-ict` | `.gl.in` |
| Barra fina | `.xc-mbar`, `.xd-wbar`, `.xf-mp` | `.mbar` e `mbar()` |
| Limite da semana | `budget()` em `f-hoje.js` e em `f-habito-progresso.js` | `budget()` |
| Números lado a lado | `.xc-3`, `.xb-nums` | `.stats` |
| Perfil | `.xe-prof`, `.xf-prof` | `.profile` |
| Cabeçalho de cartão | `.xc-ch`, `.xa-ch` | `.ch` e `ch()` |
| Opção com rádio | `.xa-opt`, `.xb-op` (com rádio próprio) | `.opt` e `radio()` |
| Estado vazio | `.xe-empty` | `.empty` |
| Botão de atenção | `.xf-wbtn` | `.btn.warn` |
| Legenda do heatmap | `.xc-lg/.xc-sw` | `heatKey()` |
| Aviso com Desfazer | (grupo I desenhando) | `.toast` e `toast()` |

Os números grandes também variam: `.xc-v`, `.xc-avg b` e `.xc-ntv b` usam 26 px, e a base tem `.stat` com 28. Proposta: usar `.stat` (grupo C).

### 10. Leitor de tela, foco, texto maior e movimento

**VoiceOver.** Os helpers geram `span` sem papel nem nome, e os ícones `<i>` seriam lidos como caracteres soltos. Como cada controle deveria ser anunciado:

| Controle | Hoje anunciaria | Deve anunciar |
|---|---|---|
| `chk` na linha da Louça | nada, ou "imagem" | "Louça, até 20h30. Caixa de seleção, não marcada." |
| `vpill` "12 dias" | "12 dias" | "Zero refrigerante, 12 dias sem, recorde 21. Botão." |
| `r5` no Almoço | "1, 2, 3, 4, 5" | "Almoço, sem nota. Botão, abre a nota." |
| Chip "+ Ovo 6 g" | "Ovo 6 g" | "Somar ovo, 6 gramas. Botão." |
| Anel do dia na semana | "22" | "Quinta, 22. 25% do dia feito." |
| Rostinho | nada | "Humor: Bem, 4 de 5. Selecionado." |
| `.xbtn` | nada | "Fechar. Botão." |
| `nb` voltar | "Hoje" | "Voltar para Hoje. Botão." |
| Abas | "Hoje" | "Hoje. Aba 1 de 4, selecionada." |
| Folha | conteúdo solto | "Proteína. Diálogo." O foco vai para o título e fica preso na folha. |
| Heatmap | nada | "Desde 21 de setembro: 24 dias feitos, 1 parcial, 8 sem caminhada." |
| Corrida (troca de intervalo) | nada | Região viva: "Caminhada, 1 minuto e 30." |

Os gráficos do grupo C já têm `role="img"` com frase, e esse é o modelo. O pedido B7 leva papéis e nomes para os helpers.

**Ordem de foco.**

- Seguir a ordem visual. À noite, o check-in sobe para o topo também no código.
- Na folha, o foco entra no título e volta para quem abriu quando ela fecha.
- Na revisão, a cada passo, o foco vai para o título do passo.
- No PC: barra lateral, depois o conteúdo, com o anel de foco da base (B10).

**Texto Dinâmico.** No app instalado, a letra só cresce se os tamanhos estiverem em `rem` e o `html` usar `font: -apple-system-body`. Hoje tudo está em `px`. Pontos que quebram com letra grande:

- `.btn` com altura fixa e `nowrap`;
- `.chips.nowrap` com `overflow: hidden`, que esconde chips sem aviso (botões de proteína, filtros do Progresso, motivos da pausa);
- `.hr` com o controle da direita em coluna fixa;
- `.xc-pil` com o nome do pilar em coluna de 104 px;
- alturas fixas em `.xb-q`, `.xb-op`, `.xd-days` e `.xe-days`.

Proposta: B9 na base. No app, com letra "Extra Grande" ou maior, a linha de hábito vira duas (nome em cima, controle embaixo).

**Movimento reduzido.** A base não tem tokens de duração nem regra para `prefers-reduced-motion`. O interruptor "Animações" de Aparência precisa de um alvo. Proposta: B8. Com movimento reduzido, números e anéis aparecem já no valor final, a mola do check vira troca de cor e o confete aparece parado (já é).

**Teclado.** Na Revisão 2 e no check-in, o botão do fim fica atrás do teclado. Regra: a folha rola, e o botão principal fica preso acima do teclado. Campos de digitação com 16 px ou mais (o grupo B já corrigiu os do check-in).

## Pedidos para a base

**Aplicados na base em 22 out**, com três ajustes: os tokens de movimento usam os nomes de `docs/interacao/movimento.md`, o aviso com Desfazer segue o desenho do grupo I, e as peças do Hoje (`weekCard`, `fold`, `doPill`, `plusBtn`, `addPill`, `semTile`) também entraram. O código abaixo fica como registro da proposta. A versão em vigor está em `base.css` e `base.js`.

### B1 · Contraste (base.css, tokens)

```css
/* :root (claro) */
--text-3: oklch(53% .01 75);
--mente-on: oklch(40% .09 285); --alim-on: oklch(40% .09 150); --corpo-on: oklch(40% .09 60); --familia-on: oklch(40% .09 355); --accent-on: oklch(40% .08 230);

/* nos dois blocos escuros (media query e [data-theme="dark"]) */
--text-3: oklch(66% .01 75);

/* .hued claro: troque "--on: var(--ink)" por */
.hued { --on: oklch(40% .09 var(--h)); }
```

Conferido no Chrome:

- `--text-3` passa a 4,6 a 4,7:1 sobre `--sunken` e `--wash` no claro, e 4,9:1 sobre `--wash` no escuro.
- Sobre `--track` continua em 4,3:1. Por isso o grupo C usa `--text-2` ali (5,5:1).
- `--on` sobre `--fill` fica entre 5,2 e 6,8:1 em todos os pilares e na paleta.
- O traço do rostinho com opacidade 1 dá 3,3:1.

### B2 · Área de toque de 44 px sem mudar o desenho

```css
.xbtn, .ibtn, .avatar, .chk, .chip, .vpill, .btn.sm, .nb .back, .nb .act { position: relative; }
.xbtn::after, .ibtn::after, .avatar::after, .chk::after, .chip::after, .vpill::after, .btn.sm::after, .nb .back::after, .nb .act::after {
  content: ""; position: absolute; left: 50%; top: 50%;
  width: max(100%, 44px); height: max(100%, 44px); transform: translate(-50%, -50%);
}
.nb .back, .nb .act { min-height: 44px; }
```

### B3 · Tipo mínimo e controle segmentado

```css
.tb span { font: 600 11px/13px var(--font-ui); }
.sg span { display: grid; place-items: center; min-height: 36px; padding: 0 6px; font: 600 14px/18px var(--font-ui); }
```

### B4 · Heatmap com forma, e legenda compartilhada

```css
/* troca a regra atual de .hm i.p */
.hm i.p, .hmk i.p { background: linear-gradient(to top, var(--fill) 50%, var(--track) 50%); }
.hmk { display: flex; flex-wrap: wrap; gap: 6px 14px; font: var(--t-caption); color: var(--text-2); }
.hmk > span { display: inline-flex; align-items: center; gap: 6px; }
.hmk i { width: 12px; height: 12px; border-radius: 4px; background: var(--track); }
.hmk i.d { background: var(--fill); }
.hmk i.x { background: repeating-linear-gradient(135deg, var(--track) 0 3px, transparent 3px 7px); box-shadow: inset 0 0 0 1px var(--track); }
.hmk i.u { background: transparent; border: 1.5px dotted var(--border-strong); }
.hmk i.f { background: transparent; box-shadow: inset 0 0 0 1.5px var(--border); }
.hmk i.t { box-shadow: 0 0 0 1.5px var(--surface), 0 0 0 3px var(--text); }
```

```js
/* legenda do heatmap. items: [['d','Feito'],['p','Parcial'],['','Sem caminhada'],['d t','Hoje']] */
function heatKey(items) {
  return '<div class="hmk" aria-hidden="true">' + items.map(function (x) { return '<span><i class="' + x[0] + '"></i>' + x[1] + '</span>'; }).join('') + '</div>';
}
```

### B5 · Rostinhos

```css
.face { opacity: 1; }
```

### B6 · Componentes novos

```css
.eyebrow { display: block; font: 600 12px/16px var(--font-ui); letter-spacing: .1em; text-transform: uppercase; color: var(--ink, var(--accent-ink)); }
.lead { font: 400 16px/23px var(--font-ui); color: var(--text-2); }
.foot { padding: 8px 20px 0; font: 400 13px/18px var(--font-ui); color: var(--text-3); }
.foot.c { text-align: center; text-wrap: balance; }
.foot i { font-size: 15px; vertical-align: -2px; margin-right: 4px; }
.gl.in { padding: 0 4px 8px; }

.addrow { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 6px 14px; border-radius: 16px; border: 1.5px dashed var(--border-strong); color: var(--accent-ink); font: 600 16px/20px var(--font-ui); }
.addrow > span { width: 40px; height: 40px; flex: none; border-radius: 13px; display: grid; place-items: center; background: var(--accent-wash); font-size: 19px; }

.days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.days > span { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; min-height: 52px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); font: 600 13px/16px var(--font-ui); color: var(--text-2); }
.days > span i { font-size: 13px; visibility: hidden; }
.days > span.on { background: var(--wash, var(--accent-wash)); border: 1.5px solid var(--mark, var(--accent-mark)); color: var(--ink, var(--accent-ink)); }
.days > span.on i { visibility: visible; }

.tval { display: inline-flex; align-items: center; min-height: 34px; padding: 6px 11px; border-radius: 9px; background: var(--sunken); color: var(--text); font: 500 16px/22px var(--font-ui); font-variant-numeric: tabular-nums; white-space: nowrap; }
.tval.raised { background: var(--surface); box-shadow: inset 0 0 0 1px var(--border); }
.tval.off { background: transparent; box-shadow: inset 0 0 0 1px var(--border-strong); color: var(--text-3); }

.steptop { flex: none; display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 8px; min-height: 48px; padding: 0 8px; }
.steptop > .ibtn, .steptop > .xbtn { justify-self: center; }
.steps { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px; }
.steps i { height: 5px; border-radius: 99px; background: var(--track); }
.steps i.on { background: var(--accent-mark); }

.mbar { display: block; height: 6px; border-radius: 99px; background: var(--track); overflow: hidden; }
.mbar.thick { height: 8px; }
.mbar > i { display: block; height: 100%; border-radius: 99px; background: var(--mark, var(--accent-mark)); }

.tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 999px; background: var(--wash, var(--sunken)); color: var(--ink, var(--text-2)); font: 600 12px/14px var(--font-ui); font-variant-numeric: tabular-nums; white-space: nowrap; }
.tag i { font-size: 13px; }
.tag.dot::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--mark, var(--text-3)); }
.tag.up { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
.tag.lift { background: var(--surface); }

.budget { padding: 12px 14px; }
.budget b { display: block; font: 600 15px/20px var(--font-ui); }

.stats { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); padding: 14px 0; }
.stats > div { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 0 14px; }
.stats > div + div { border-left: 1px solid var(--border); }
.stats .k { display: flex; align-items: center; gap: 5px; font: var(--t-caption); color: var(--text-3); }
.stats .k i { font-size: 15px; color: var(--ink, var(--text-2)); }
.stats .stat small { margin-left: 4px; font: 500 14px/1 var(--font-ui); letter-spacing: 0; color: var(--text-3); }

.profile { display: flex; align-items: center; gap: 14px; padding: 14px 16px; }
.profile .avatar { width: 56px; height: 56px; font: 600 22px/1 var(--font-ui); }
.profile b { display: block; font: 600 18px/22px var(--font-ui); }
.profile small { display: flex; align-items: center; gap: 5px; margin-top: 3px; font: var(--t-caption); color: var(--text-3); }
.profile small i { font-size: 14px; }

.ch { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.ch > span:first-child { min-width: 0; }
.ch b { display: block; font: 600 16px/20px var(--font-ui); }
.ch .cap { display: block; margin-top: 2px; }
.ch > span + * { flex: none; white-space: nowrap; }

.opt { display: grid; grid-template-columns: minmax(0, 1fr) 22px; gap: 12px; align-items: center; min-height: 52px; padding: 12px 14px; border-radius: 16px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--border); }
.opt.on { background: var(--wash, var(--accent-wash)); box-shadow: inset 0 0 0 2px var(--mark, var(--accent-mark)); }
.opt.on .radio { border: 7px solid var(--mark, var(--accent-mark)); }

.empty { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 22px 20px; border-radius: 16px; background: var(--sunken); text-align: center; }
.empty > i { font-size: 28px; color: var(--text-3); margin-bottom: 4px; }
.empty b { font: 500 15px/20px var(--font-ui); color: var(--text-2); }

.btn.warn { background: var(--warning-ink); color: var(--surface); }

/* aviso com Desfazer: alinhar o desenho com o grupo I */
:root { --toast-bg: oklch(27% .012 75); --toast-fg: oklch(97% .004 75); --toast-act: oklch(85% .075 230); }
/* nos dois blocos escuros, acrescente: --toast-bg: oklch(32% .01 75); */
.toast { position: absolute; left: 12px; right: 12px; bottom: 96px; z-index: 8; display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 6px 6px 6px 16px; border-radius: 16px; background: var(--toast-bg); color: var(--toast-fg); box-shadow: var(--shadow-2); font: 500 15px/20px var(--font-ui); }
.toast.low { bottom: 40px; }
.toast > span:first-child { flex: 1; min-width: 0; }
.toast .btn.g { height: 44px; padding: 0 14px; color: var(--toast-act); font-size: 15px; }
```

```js
function addRow(text) { return '<div class="addrow" role="button"><span>' + ico('plus', 'bold') + '</span>' + text + '</div>'; }

/* dias da semana. sel: índices ligados (0 = seg). o: { p pilar, single escolha única, label } */
function days(sel, o) {
  o = o || {};
  var n = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], full = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  var role = o.single ? 'radio' : 'checkbox';
  return '<div class="days" role="' + (o.single ? 'radiogroup' : 'group') + '"' + (o.p ? ' data-pillar="' + o.p + '"' : '') + (o.label ? ' aria-label="' + o.label + '"' : '') + '>' +
    n.map(function (d, i) {
      var on = sel.indexOf(i) > -1;
      return '<span role="' + role + '" aria-checked="' + on + '" aria-label="' + full[i] + '" class="' + (on ? 'on' : '') + '">' + d + ico('check', 'bold') + '</span>';
    }).join('') + '</div>';
}

/* valor de horário ou data tocável. o: { off, raised } */
function tval(t, o) { o = o || {}; return '<span class="tval num' + (o.off ? ' off' : '') + (o.raised ? ' raised' : '') + '" role="button">' + t + '</span>'; }

/* topo de fluxo em passos. o: { back, close } */
function stepTop(n, total, o) {
  o = o || {};
  var s = '';
  for (var i = 1; i <= total; i++) s += '<i class="' + (i <= n ? 'on' : '') + '"></i>';
  return '<div class="steptop">' +
    (o.back && n > 1 ? '<span class="ibtn" role="button" aria-label="Voltar">' + ico('caret-left', 'bold') + '</span>' : '<span></span>') +
    '<span class="steps" role="progressbar" aria-valuemin="1" aria-valuemax="' + total + '" aria-valuenow="' + n + '" aria-label="Passo ' + n + ' de ' + total + '">' + s + '</span>' +
    (o.close ? '<span class="xbtn" role="button" aria-label="Fechar">' + ico('x', 'bold') + '</span>' : '<span></span>') + '</div>';
}

function mbar(pct, thick) { return '<span class="mbar' + (thick ? ' thick' : '') + '" aria-hidden="true"><i style="width:' + Math.min(100, pct) + '%"></i></span>'; }

/* selo pequeno. o: { p pilar, icon, iw, dot, up, lift } */
function tag(text, o) {
  o = o || {};
  return '<span class="tag' + (o.dot ? ' dot' : '') + (o.up ? ' up' : '') + (o.lift ? ' lift' : '') + '"' + (o.p ? ' data-pillar="' + o.p + '"' : '') + '>' +
    (o.icon ? ico(o.icon, o.iw || 'bold') : '') + text + '</span>';
}

/* limite da semana (tranqueiras, refeições livres). o: { p, t, s, used, total } */
function budget(o) {
  return '<div class="between budget" data-pillar="' + (o.p || 'accent') + '"><span><b>' + o.t + '</b><span class="cap">' + o.s + '</span></span>' +
    '<span class="row" style="gap:8px">' + slots(o.total, o.used, 'used') + '<span class="cap num">' + o.used + ' de ' + o.total + '</span></span></div>';
}

function ch(t, s, right) { return '<div class="ch"><span><b>' + t + '</b>' + (s ? '<span class="cap">' + s + '</span>' : '') + '</span>' + (right || '') + '</div>'; }
function radio(on) { return '<span class="radio' + (on ? ' on' : '') + '" role="radio" aria-checked="' + !!on + '"></span>'; }
function toast(text, o) { o = o || {}; return '<div class="toast' + (o.low ? ' low' : '') + '" role="status"><span>' + text + '</span><span class="btn g" role="button">Desfazer</span></div>'; }
```

### B7 · Papéis e nomes nos helpers (base.js)

```js
function txt(h) { return String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

/* ico: acrescente aria-hidden nos dois retornos */
//   '<i class="pk-icon pk-salsicha' + ... + '" aria-hidden="true"></i>'
//   '<i class="' + ... + ' ph-' + name + '" aria-hidden="true"></i>'

function tb(active) {
  var tabs = [['hoje', 'sun', 'Hoje'], ['prog', 'chart-line-up', 'Progresso'], ['jor', 'path', 'Jornada'], ['aj', 'gear-six', 'Ajustes']];
  return '<nav class="tb" role="tablist" aria-label="Seções">' + tabs.map(function (t) {
    var on = t[0] === active;
    return '<span role="tab" aria-selected="' + on + '" class="' + (on ? 'on' : '') + '">' + ico(t[1], on ? 'fill' : 'regular') + t[2] + '</span>';
  }).join('') + '</nav>';
}

function sheet(title, body, o) {
  o = o || {};
  return '<div class="dim" aria-hidden="true"></div><div class="sheet" role="dialog" aria-modal="true"' + (title ? ' aria-label="' + txt(title) + '"' : '') +
    (o.top ? ' style="top:' + o.top + 'px"' : '') + '><span class="grab" aria-hidden="true"></span>' +
    (title ? '<div class="sh-h"><h3>' + title + '</h3><span class="xbtn" role="button" aria-label="Fechar">' + ico('x', 'bold') + '</span></div>' : '') + body + '</div>';
}

function nb(o) {
  var left = o.left ? '<span class="back" role="button">' + o.left + '</span>'
    : (o.back ? '<span class="back" role="button" aria-label="Voltar para ' + o.back + '">' + ico('caret-left', 'bold') + o.back + '</span>' : '<span></span>');
  var act = o.act ? '<span class="act" role="button"' + (txt(o.act) ? '' : ' aria-label="' + (o.actLabel || 'Adicionar') + '"') + '>' + o.act + '</span>' : '<span class="act"></span>';
  return '<div class="nb">' + left + '<span class="nbt" role="heading" aria-level="1">' + (o.title || '') + '</span>' + act + '</div>';
}

function chk(on, label) {
  return '<span class="chk' + (on ? ' on' : '') + '" role="checkbox" aria-checked="' + !!on + '"' + (label ? ' aria-label="' + label + '"' : '') + '>' + ico('check', 'bold') + '</span>';
}
function sw(on, label) { return '<span class="sw' + (on ? ' on' : '') + '" role="switch" aria-checked="' + !!on + '"' + (label ? ' aria-label="' + label + '"' : '') + '></span>'; }
function seg(opts, sel, label) {
  return '<div class="sg" role="radiogroup"' + (label ? ' aria-label="' + label + '"' : '') + '>' + opts.map(function (o, i) {
    return '<span role="radio" aria-checked="' + (i === sel) + '" class="' + (i === sel ? 'on' : '') + '">' + o + '</span>';
  }).join('') + '</div>';
}
/* chip: acrescente role e, quando o.sel vier definido, aria-pressed */
//   '<span class="chip' + ... + '" role="button"' + (o.sel !== undefined ? ' aria-pressed="' + !!o.sel + '"' : '') + '>'

/* r5 vira só leitura: a linha abre a folha da nota */
function r5(sel) {
  var s = '<span class="r5" role="img" aria-label="' + (sel ? 'Nota ' + sel + ' de 5' : 'Sem nota') + '">';
  for (var i = 1; i <= 5; i++) s += '<span class="' + (i === sel ? 'on' : '') + '" aria-hidden="true">' + i + '</span>';
  return s + '</span>';
}
function rf(kind, sel) {
  var s = '<div class="rf" role="radiogroup" aria-label="' + (kind === 'mood' ? 'Humor' : 'Energia') + '">';
  for (var l = 1; l <= 5; l++) s += '<div role="radio" aria-checked="' + (l === sel) + '" aria-label="' + FACE_WORDS[kind][l - 1] + ', ' + l + ' de 5" class="' + (l === sel ? 'on' : '') + '">' +
    face(kind, l) + '<span aria-hidden="true">' + FACE_WORDS[kind][l - 1] + '</span></div>';
  return s + '</div>';
}

/* ring: acrescente aria-hidden="true" no <svg>. dots e slots: aria-hidden="true" no span de fora (sempre há texto ao lado) */

function week(vals, today, nums) {
  var d = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'], full = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  nums = nums || [19, 20, 21, 22, 23, 24, 25];
  return '<div class="card wk" role="list" aria-label="Semana">' + d.map(function (x, i) {
    var cls = 'wkd' + (i === today ? ' today' : '') + (i > today ? ' future' : '');
    var lab = full[i] + ', ' + nums[i] + (i > today ? '' : '. ' + Math.round((vals[i] || 0) * 100) + '% do dia feito');
    return '<div role="listitem" aria-label="' + lab + '" class="' + cls + '"><span aria-hidden="true">' + x + '</span><span class="rg" aria-hidden="true">' +
      ring(36, 3.5, vals[i] || 0, i === today ? 'var(--accent-ink)' : 'var(--accent-mark)') + '<b>' + nums[i] + '</b></span></div>';
  }).join('') + '</div>';
}

/* pbar: role="img" com o total. Acrescente no <div class="pb"> */
//   var tot = segs.reduce(function (a, b) { return a + b; }, 0);
//   '<div class="pb" role="img" aria-label="' + tot + ' de ' + meta + '">'

/* heat: label opcional; sem label, conta os estados */
function heat(states, label) {
  if (!label) {
    var c = { d: 0, p: 0 };
    states.forEach(function (s) { var k = s.split(' ')[0]; if (k in c) c[k]++; });
    label = c.d + ' dias feitos, ' + c.p + ' parciais';
  }
  return '<div class="hm" role="img" aria-label="' + label + '">' + states.map(function (s) { return '<i class="' + s + '"></i>'; }).join('') + '</div>';
}
```

Nota para os grupos: `hr()` não sabe o nome do controle da direita. Passe o nome no `chk(false, 'Louça')` e no `sw(true, 'Mente')`.

### B8 · Movimento (tokens e movimento reduzido)

```css
:root {
  --dur-tap: 150ms; --dur: 240ms; --dur-num: 400ms; --dur-ring: 600ms;
  --ease: cubic-bezier(.2, .8, .2, 1); --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
}
@media (prefers-reduced-motion: reduce) {
  :root { --dur-num: 0ms; --dur-ring: 0ms; --ease-spring: var(--ease); }
}
/* o interruptor "Animações" de Aparência desligado põe data-motion="off" no html */
:root[data-motion="off"] { --dur-num: 0ms; --dur-ring: 0ms; --ease-spring: var(--ease); }
```

Com movimento reduzido, troca de cor e opacidade continua em `--dur`. Deslocamento, mola e números rolando somem.

### B9 · Preparar para letra maior

```css
.btn { height: auto; min-height: 52px; padding-block: 12px; white-space: normal; text-align: center; line-height: 1.2; }
.btn.g { min-height: 44px; }
.btn.sm { min-height: 36px; padding-block: 6px; }
.chips.nowrap { overflow-x: auto; scrollbar-width: none; -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 24px), transparent); mask-image: linear-gradient(to right, #000 calc(100% - 24px), transparent); }
.chips.nowrap::-webkit-scrollbar { display: none; }
```

Regra para os grupos: `min-height` no lugar de `height` em tudo que tem texto.

### B10 · Anel de foco

```css
.phone :focus-visible { outline: 2.5px solid var(--accent-mark); outline-offset: 2px; }
```

### B11 · Regras para o SPEC

- A tabela de navegação do achado 4.
- Cor de pilar só para pilar e hábito.
- `r5` só para leitura.
- Todo estado com forma e cor.
- Horário no texto como "6h52". "06:50" só dentro do seletor de horário.
- Corrigir "total 31" (B) e "46 caminhadas" (C) para 33 e 24, como na história.

## Glossário

Um termo por conceito. A coluna "Trocar" lista o que apareceu no quadro (ou nos documentos) e deve mudar.

| Conceito | Usar | Trocar | Onde |
|---|---|---|---|
| Fazer com regularidade | constância | consistência, regularidade | Já está igual em todo o quadro |
| Indicador que sobe e desce devagar | força do hábito | "Força" sozinho | Hábito · Caminhada (rótulo do número) |
| Fazer o que se evita (dias sem) | deslize, registrar um deslize | recaída, falha, perdeu | Já está igual |
| Valor a alcançar | meta | objetivo, alvo | Já está igual |
| Hábito realizado | feito, feitos hoje | cumprido | "conta como cumprido" em Acordei às, Rotina e Horários: trocar por "conta como feito" |
| Contador que chegou na meta | meta batida; "x dias na meta" | | Hoje noite, Progresso · alimentação: já está certo |
| Pôr um valor no app | registrar | anotar, lançar | Nota da Proteína ("lançar o café da manhã") |
| Tocar no círculo do sim ou não | marcar | concluir, checar | |
| Voltar atrás | Desfazer | Cancelar (depois de feito), Reverter | Grupo I |
| Dias seguidos sem o mau hábito | dias sem; recorde; total | sequência, streak | Já está igual |
| Limite semanal | limite por semana; Limites da semana | orçamento, cota | visao.md fala em "Orçamento semanal" |
| Tipo "x vezes" | Vezes por semana | Frequência semanal | Ajustes já usa; visao.md não |
| Tipo checklist | Lista de passos | Checklist | Ajustes já usa; visao.md não |
| Tipo binário | Sim ou não | Sim/não | Ajustes já usa; visao.md não |
| Revisão do domingo | Revisão da semana | revisão de domingo, revisão semanal | Seção "Revisões" da Jornada vira "Revisões da semana"; notas da Jornada |
| Momento da noite | Check-in do dia | Check-in às 20h30 (como nome) | Ajustes › Hábitos |
| As três coisas boas | 3 coisas boas | gratidão | Subtítulo do check-in no Hoje; descrição do pilar Mente na Entrada |
| Minutos no celular | tempo de tela | telas hoje, minutos de tela | Rótulo "Telas hoje" no check-in |
| Tirar do dia sem apagar | arquivar, arquivado | desligar, remover | Seus pilares · 2 de 3 ("Desligar um pilar...") |
| Interromper por um período | pausar, pausa, pausado | congelar, suspender | Já está igual |
| Nome do hábito | só o nome: Acordar, Deitar, Louça, Futebol, Telas desligadas | Acordar às 6h50, Deitar às 22h, Louça até 20h30, Futebol às quintas | Ajustes › Hábitos (o horário vai para a linha de baixo) |
| Caminhada | Caminhada com o cachorro | Caminhada | Revisão 1 de 3 |
| Contagem | x de y ("3 de 12") | 3/12, 3/6 | Anel do Hoje e anéis do Progresso · corpo: usar número grande + "de 12" embaixo, como no Dia fechado |
| Horário no texto | 6h52, 7h10 | 06h52, 07h10 | `vpill` do Hoje, listas da Proteína e da Água |
| Horário no seletor | 06:50 | | Horários, Rotina |
| Datas | "18 out" em listas e intervalos; "22 de outubro" em títulos e frases | | Já está quase igual |

## Fica para o Henrique decidir

O orquestrador já decidiu todos estes pontos (veja "Decisões tomadas" no SPEC). O avatar saiu de todos os cabeçalhos. O Henrique pode rever qualquer um deles.

- **Cor das fases:** a primária (proposta) ou uma cor escolhida no editor de fases. Hoje cada fase usa a cor de um pilar.
- **Toque no nome do hábito abre o detalhe:** é rápido, e pode haver toque sem querer com uma mão. A alternativa é uma seta à direita, que tira espaço do controle.
- **Revisões passadas:** ficam na Jornada (proposta, junto com as fases) ou vão para o Progresso, com os outros números.
- **Ajustes › Fases:** vira tela de edição (proposta) ou sai dos Ajustes e fica só na Jornada.
- **Avatar:** só no Hoje, abrindo Dados e conta (proposta), ou fora de todos os cabeçalhos.
