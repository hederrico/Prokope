# Ajustes · plano · interações e animações

Como se comportam as telas onde a pessoa monta o próprio plano: a lista de Ajustes, os pilares (criar, reordenar, arquivar, apagar) e os hábitos (listar e criar).

## Ajustes  (rota: `/ajustes`)

**Como chega:** aba. O conteúdo troca com opacidade em `micro`, sem deslocamento ([navegacao.md](../navegacao.md)). Tocar na aba ativa volta à raiz da pilha de Ajustes ou, já na raiz, rola ao topo com `calma`.
**Ao aparecer:** nada anima. É um menu parado: sem cascata e sem números rolando. Os valores (16, Sistema, Desligado) chegam prontos do store.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Cartão do perfil | Toque | Abre Dados e conta (`/ajustes/dados`) | Empurrar com `calma` | — | — |
| Hábitos, Pilares | Toque | Abre a lista | Empurrar com `calma` | — | — |
| Pausar, Horários, Lembretes, Aparência, A dois | Toque | Abre a tela do grupo F ([ajustes-rotina-conta.md](ajustes-rotina-conta.md)) | Empurrar com `calma` | — | — |

**Estados desta tela:** com pausa ativa, a linha Pausar troca "Férias, doença, viagem" por "Pausado até 2 jan". Os valores mudam "ao abrir", sem animação ([comunicacao.md](../comunicacao.md)). Fases não aparece aqui: a edição fica na Jornada (`/jornada/fases`).
**Como sai:** pelas abas, ou empurrando um item.
**Acessibilidade:** perfil: "Henrique, conta Google, seus dados. Botão." Linha com valor: "Hábitos, 16. Botão." Os rótulos de grupo são `h2`. Com letra grande, o valor da direita desce para baixo do título.
**Implementação:** `ScreenHeader`, `ProfileCard`, `SectionLabel`, `ListGroup` e `ListItem` com bolha neutra. "16" conta hábitos ativos não arquivados, e a caminhada conta uma vez só.

## Pilares  (rota: `/ajustes/pilares`)

**Como chega:** empurrada a partir de Ajustes, com `calma`. A barra de abas fica, com Ajustes ativa.
**Ao aparecer:** só a passagem anima. As linhas não entram em cascata, porque a tela já chega inteira.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Alça (⠿) | Arrastar | Reordena (abaixo) | Levantar, abrir espaço, soltar | `pillars.order` ao soltar | Progresso, Hábitos e a barra lateral do PC, ao abrir |
| Resto da linha | Toque | Abre o pilar (`/ajustes/pilares/:id`) | Empurrar com `calma` | — | — |
| Novo pilar | Toque | Abre o formulário | Tela cheia: sobe 24 px com opacidade em `base` | — | — |
| Pilar arquivado | Toque | Abre o pilar arquivado, com "Restaurar pilar" | Empurrar com `calma` | — | — |

**Reordenar com arrasto** (`gestos-e-feedback.md`: arrastar pela alça, sem toque longo):

1. **Levantar.** O dedo na alça pega a linha na hora. Em `press`, a linha sobe: escala de 1 para 1,03, sombra `--shadow-2`, fundo `--raised` e alça em `--text-2`, com a mola `toque`. Sem vibração (fora da escada).
2. **Arrastar.** A linha segue o dedo 1:1, só no eixo vertical, presa à lista com resistência de 0,3 além das pontas. Quando o centro dela passa do meio da vizinha, a vizinha anda uma linha com layout `calma`. No máximo uma linha se move por vez.
3. **Rolar sozinho.** Com a linha a menos de 48 px da borda visível, a lista rola na direção do dedo, até 600 px/s, mais rápido quanto mais perto da borda.
4. **Soltar.** A linha assenta no lugar com `calma`; escala e sombra voltam em `base`. Só então grava `reorderPillars(ids)`, um lote com o `order` de cada pilar. Sem toast: arrastar de volta já desfaz.
5. **Cancelar.** `pointercancel` (uma ligação, por exemplo) ou `Esc` no PC devolve a linha ao lugar de origem com `calma`, sem gravar.

**Estados desta tela:** com um pilar só, a alça e a dica somem. Com 8 ou mais, a lista rola e a rolagem automática do arrasto vale. Arquivados vazio usa `EmptyState`; cada pilar arquivado aparece com bolha neutra, "Arquivado em 22 out" e sem alça (arquivados não reordenam).

**Como sai:** "‹ Ajustes" ou o arrasto da borda, invertendo a passagem.
**Acessibilidade:** cada linha tem as ações personalizadas "Mover para cima" e "Mover para baixo", e o VoiceOver anuncia "Corpo, posição 2 de 4". A alça se chama "Mover Corpo". No PC, `Tab` chega à alça, `Espaço` pega, as setas movem, `Espaço` solta e `Esc` cancela.

**Implementação:** `ReorderList` (novo) usa `Reorder.Group axis="y"` do Motion, com `Reorder.Item dragListener={false}` e `useDragControls` iniciado no `onPointerDown` da alça, que tem `touch-action: none`; o `domMax` entra sob demanda. Durante o arrasto, a ordem vive no estado local e os snapshots não mexem na lista. Reduzido: a linha ganha a sombra sem escalar e segue o dedo, e as vizinhas trocam de lugar com opacidade em `micro`.

## Novo pilar  (rota: `/ajustes/pilares/novo`)

**Como chega:** tela cheia, a partir de "Novo pilar". Sobe 24 px com opacidade em `base`, e a barra de abas some.
**Ao aparecer:** o foco vai para Nome dentro do mesmo toque que abriu a tela, para o iPhone abrir o teclado. A prévia mostra "Novo pilar" em `--text-3`, a primeira cor livre da paleta e o ícone `circle-dashed`, e Criar começa desabilitado. Nada mais anima.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Nome | Digitar | O título da prévia acompanha cada tecla. Criar acende com o primeiro caractere que não é espaço. Depois de 300 ms sem digitar, a categoria que combina com o nome sobe para o topo da grade, com "sugerido pelo nome" | Título sem animação; Criar troca de cor em `micro`; a categoria sugerida entra com opacidade em `micro` | — | — |
| Bolinha de cor | Toque | Escolhe a cor. Numa cor já usada, o rótulo vira "Damasco · também em Corpo", sem bloquear | Anel de seleção cresce com a mola `toque`, ✓ entra em `micro`. Prévia, grade e rótulo trocam de cor em `micro` | — | — |
| Busca | Digitar | Filtra a grade (abaixo) | A grade troca com opacidade em `micro`, sem cascata | — | — |
| Chip de categoria | Toque | Rola a grade até a categoria | Rolagem com `calma`; chip escolhido em `micro` | — | — |
| Ícone da grade | Toque | Escolhe o ícone, que deixa de seguir a sugestão do nome | Fundo `fill` com a mola `toque` (escala 0,9 → 1). Na prévia, o ícone antigo sai em `micro` e o novo entra com escala 0,9 → 1 | — | — |
| Cancelar | Toque | Sai sem gravar e sem perguntar | Tela cheia desce 24 px com opacidade em `micro` | — | — |
| Criar | Toque | `createPillar({ name, color, icon })`, com `order` no fim | A tela cheia é trocada pelo pilar novo (`/ajustes/pilares/:id`), empurrado sobre Pilares | `pillars` | Pilares ganha a linha no fim; Progresso e a barra lateral do PC, ao abrir |

**Prévia ao vivo:** cor e ícone trocam em `micro`, e o nome troca sem animação. A troca de cor é uma transição de `background-color` e `color` em `--dur-micro`, disparada pela mudança das variáveis de `hueStyle`. Não anime `--h`.
**Busca de ícones:**
- Ignora acento e caixa (`normalize('NFD')` sem diacríticos) e procura no nome em português e nas palavras-chave, por começo de palavra: "agua" acha Água, "poupar" acha Cofrinho. A ordem é nome exato, começo do nome e palavra-chave.
- Com texto, as categorias dão lugar a "Resultados · 6" (`.gl.in`) e o chip Todos fica escolhido. Sem resultado: `EmptyState` com "Nenhum ícone para “xyz”. Tente “casa” ou “livro”."
- O X do campo limpa a busca, e `enterkeyhint="search"` fecha o teclado. Com o foco na busca, a página rola até o campo encostar no topo (`calma`), e a grade fica visível acima do teclado (`visualViewport`).

**Estados desta tela:** Criar desabilitado sem nome ([componentes.md](../componentes.md), regras comuns). Um nome igual ao de outro pilar ativo mostra "Já existe um pilar Corpo." abaixo do campo, em `--text-2`, sem bloquear.
**Como sai:** Cancelar, ou Criar, que leva ao pilar novo com o vazio "Nenhum hábito neste pilar." e "Novo hábito em Finanças".
**Acessibilidade:** a paleta é um grupo de rádio "Cor": "Damasco, usada em Corpo. Botão de opção, 2 de 12." Os ícones têm nome em português ("Cofrinho"), e a busca anuncia a contagem com `aria-live="polite"` ("6 ícones"). A prévia é `aria-hidden`, porque repete os campos. Com letra grande, a grade continua com 6 colunas e o título da prévia quebra linha.

**Implementação:** `PillarPreview`, `ColorPalette` e `IconPicker` são novos. O catálogo fica em `src/data/icons.ts`, com `{ name, label, keywords, category }` para os 154 ícones. O mesmo formulário edita um pilar (`/ajustes/pilares/:id/editar`), com "Editar pilar", os valores atuais e "Salvar", que só acende quando algo mudou.

## Pilar · Corpo  (rota: `/ajustes/pilares/:id`)

**Como chega:** empurrada a partir de Pilares, com `calma`. Também chega ao trocar o formulário Novo pilar por esta tela, depois de Criar.
**Ao aparecer:** só a passagem anima.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Editar | Toque | Abre "Editar pilar" (formulário com Salvar) | Tela cheia sobe | `updatePillar` ao salvar | A cor nova se espalha pelo app em `base` ([comunicacao.md](../comunicacao.md)) |
| Linha de hábito | Toque | Abre o hábito (`/ajustes/habitos/:id`, "‹ Corpo") | Empurrar com `calma` | — | — |
| Novo hábito em Corpo | Toque | Abre Novo hábito com `?pilar=:id` | Tela cheia sobe | — | — |
| Arquivar pilar | Toque | `archivePillar(id)`, sem confirmação. Volta a Pilares | Volta com `calma`. Corpo recolhe da lista (altura e opacidade em `base`) e entra em Arquivados com `fadeUp`; o vazio sai em `micro`. Toast "Corpo arquivado", com "Futebol saiu do seu dia" e Desfazer por 5 s | `pillars/{id}`: `archived`, `archivedAt`. Hábitos só de Corpo: `archived`, `archivedWith: id`. A caminhada não muda | Hoje: Futebol recolhe em `base` se estiver à vista. Progresso perde o pilar e o chip, ao abrir. Hábitos perde o grupo e o selo "também em Corpo" |
| Desfazer (toast) | Toque | `restorePillar(id)` | Corpo volta ao lugar com layout `calma`, sem celebração | O inverso | O inverso, pelo mesmo caminho |
| Apagar pilar | Toque | Abre a folha Pilar · apagar | Folha com a mola `folha` | — | — |

**Estados desta tela:**
- **Pilar sem hábitos:** a lista vira `EmptyState` "Nenhum hábito neste pilar." com a ação. Apagar não abre folha: apaga na hora, com o toast "Finanças apagado" e Desfazer, porque só nome, cor e ícone se perdem.
- **Pilar arquivado:** a legenda diz "Arquivado em 22 out", os hábitos aparecem em `--text-2`, e "Restaurar pilar" ocupa o lugar de Arquivar.
- **Pilar principal de um hábito compartilhado:** se Família fosse arquivada, a linha avisaria "A caminhada passa para Corpo". Ao arquivar, Corpo vira o principal, e a cor da linha muda em `base`.

**Como sai:** "‹ Pilares", Arquivar (volta a Pilares) ou Apagar.
**Acessibilidade:** "Corpo" é o `h1`. A linha diz: "Arquivar pilar. Futebol sai do seu dia. A caminhada continua em Família. Botão." Depois de arquivar, o foco vai para o título de Pilares. O toast é anunciado sem roubar o foco.
**Implementação:** `archivePillar` grava num lote só (o pilar e os hábitos exclusivos) e devolve o inverso. A regra do principal fica em `src/domain/pillars.ts` e é testada no Vitest.

## Pilar · apagar  (rota: `/ajustes/pilares/:id?folha=apagar`)

**Como chega:** folha sobre o pilar, com a mola `folha`. O fundo escurece em `base` e cobre a barra de abas.
**Ao aparecer:** o foco vai para o título "Apagar Corpo?". Os botões não animam.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Arquivar pilar (principal) | Toque | `archivePillar(id)` | A folha desce em `base`; depois, igual a Arquivar na tela do pilar | Igual a Arquivar | Igual a Arquivar |
| Apagar de vez | Toque | `deletePillar(id)`, sem Desfazer | A folha desce e o app volta a Pilares, onde a linha recolhe em `base`. Sem toast: a linha sumindo já diz o que aconteceu | Apaga o pilar, os hábitos exclusivos e os `marks`, `entries` e `slips` deles; tira o id do `alsoIn` dos compartilhados | Some de Hoje, Progresso e Hábitos ao abrir; no PC à vista, recolhe em `base` |
| X, arrasto, fundo | Toque ou arrasto | Fecha sem fazer nada | Folha desce em `base` | — | — |

**Estados desta tela:** nos primeiros 500 ms depois de abrir, "Apagar de vez" ignora o toque, para um toque duplo não apagar sem querer. Sem internet, apagar entra na fila do Firestore como qualquer escrita.

**Acessibilidade:** a ordem de foco é: título, texto, os dois hábitos, "Arquivar pilar", "Apagar de vez" e Fechar. O botão diz "Apagar Corpo de vez. Botão."
**Implementação:** lotes de até 400 escritas (`writeBatch`), com os documentos vindos de consultas por `habitId`. A folha segue [gestos-e-feedback.md](../gestos-e-feedback.md): explica o destino de cada hábito e recomenda Arquivar.

## Hábitos  (rota: `/ajustes/habitos`)

**Como chega:** empurrada a partir de Ajustes, com `calma`.
**Ao aparecer:** só a passagem anima.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Ativos · Próximas fases · Arquivados | Toque | Troca a lista. Ativos é por pilar, Próximas fases é por fase ("Fase 3 · a partir de 2 nov") e Arquivados é por data | O fundo desliza com `calma` (componente). A lista troca com opacidade em `micro`, sem deslocamento, e volta ao topo | URL `?ver=proximas` | — |
| Linha | Toque | Abre o hábito (`/ajustes/habitos/:id`, "‹ Hábitos"), que tem Editar | Empurrar com `calma` | — | — |
| + e Novo hábito | Toque | Abre Novo hábito · tipo | Tela cheia sobe | — | — |

**Estados desta tela:** hábito pausado ganha o selo "Pausado até 5 nov" ([estados.md](../estados.md)); aba vazia diz "Nenhum hábito arquivado."; hábito recém-criado entra no grupo com `fadeUp` quando a lista volta à frente. Numa conta sem fases, o controle fica com Ativos e Arquivados, e as linhas perdem o "· fase N".

**Acessibilidade:** "Acordar. Horário, meta 6h50, fase 1. Botão." O selo é lido junto: "principal em Família". O rótulo de grupo diz "Mente, 5 hábitos". Com letra grande, a linha de baixo quebra, e o selo vai para uma linha própria.
**Implementação:** o seletor agrupa pela ordem dos pilares. A caminhada aparece no grupo do principal e no do `alsoIn`, com a chave `${pillarId}-${habitId}` e sempre na cor do principal.

## Novo hábito · tipo  (rota: `/ajustes/habitos/novo/tipo`)

**Como chega:** tela cheia, a partir de Hábitos ("+" ou Novo hábito) ou do pilar (com `?pilar=:id`). Sobe 24 px com opacidade em `base`.
**Ao aparecer:** nada anima, e não há cascata.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Linha de tipo | Toque | Guarda o tipo no rascunho e passa para os detalhes | Pressionado e depois o passo (abaixo) | Rascunho em memória (`ui`) | — |
| Cancelar | Toque | Sai e descarta o rascunho | Tela cheia desce | — | — |

**O passo entre tipo e detalhes:**
- A rota troca com `replace` para `/ajustes/habitos/novo/detalhes?tipo=contador`.
- Os tipos saem para a esquerda (−24 px com opacidade em `micro`) e os detalhes entram da direita (+24 px com opacidade em `base`, `--ease-out`). Na barra, "Cancelar" vira "‹ Tipo" e "Criar" aparece com opacidade em `micro`, ainda desabilitado. O título fica parado.
- "‹ Tipo" faz o inverso. No rascunho ficam nome, pilar, ícone, momento, dias e início. Meta, unidade e botões só voltam ao padrão se o tipo mudar. O tipo escolhido aparece com ✓ e "escolhido".
- Reduzido: a troca é só de opacidade, em `micro`.

**Acessibilidade:** "Sim ou não. Louça feita. Mais simples. Botão." Os rótulos de grupo são `h2`. Depois do passo, o foco vai para o campo Nome, e o VoiceOver anuncia "Novo hábito, Contador".

## Novo hábito · detalhes  (rota: `/ajustes/habitos/novo/detalhes`)

**Como chega:** pelo passo acima.
**Ao aparecer:** a prévia mostra a barra vazia com a linha da meta. Nada anima.

| Elemento | Gesto | Resposta | Animação | Dado gravado | Reflexo em outras telas |
|---|---|---|---|---|---|
| Nome | Digitar | A prévia acompanha cada tecla, e Criar acende. Depois de 300 ms sem digitar, o ícone sugerido pelo nome entra, enquanto a pessoa não tiver escolhido um | Ícone troca em `micro` | Rascunho | — |
| Lápis da prévia | Toque | Abre o `IconPicker` numa folha alta (`top` 56) | Folha | — | — |
| Pilar | Toque | Folha de escolha única com o pilar principal, que dá a cor. A prévia troca de cor. Se o novo principal estava marcado em "Também conta em", ele sai de lá, e o antigo principal vira uma opção desmarcada | Valor e cor da prévia em `micro`; a folha fecha sozinha | — | — |
| Também conta em | Toque num chip | Marca ou desmarca um pilar extra. Os chips são os outros pilares ativos, na ordem dos pilares; o principal nunca aparece aqui. A linha some quando só existe um pilar | O chip enche com o tom do pilar e o ✓ entra com a mola `toque` (`Chip` com `tint`); desmarcado, contorno com "+" | `habits/{id}.alsoIn` ao salvar | O hábito entra na constância e na barra de cada pilar no Progresso, na vista do pilar, no grupo do pilar em Hábitos ("principal em Família"), na tela do pilar e na contagem de hábitos de Pilares; a tela do hábito mostra uma etiqueta por pilar |
| − e + | Toque; segurar | Meta muda de um passo (g: 5, ml: 250, L: 0,25, vezes: 1, minutos: 5). Segurar repete a cada 120 ms depois de 400 ms. O − desabilita no passo mínimo | Número com NumberFlow em `fill`; a linha da meta na prévia anda com `calma`; os degraus da escada recalculam | — | — |
| Número da meta | Toque | Vira campo no lugar (`inputmode="decimal"`) | — | — | — |
| Mínimo para parcial | Toque | Opcional, em hábitos com duração ou quantidade (caminhada, corrida, leitura). Abaixo da meta e a partir do mínimo, o dia conta como parcial | — | `habits/{id}.partialMin` | Calendário (meio cheio), constância e força |
| Unidade | Toque | Folha com g, ml, L, vezes, minutos, páginas e Outra | Folha | — | — |
| Subir aos poucos | Toque | Liga ou desliga a escada | A escada abre com altura automática do Motion em `calma`, e as barras crescem de 0 em `fill`. Ao desligar, recolhe em `base` | `goal.ramp` | A Revisão da semana pergunta antes de cada subida |
| "+10 g a cada 2 semanas, até 110 g" | Toque | Folha com degrau, intervalo e teto | Folha | — | — |
| Botão rápido | Toque | Folha "Ovo" com nome, quantidade e "Apagar botão" | Folha | — | — |
| Apagar botão | Toque | Tira o botão e fecha a folha. Toast "Ovo apagado", com Desfazer | O botão sai da grade (escala 0,9 e opacidade em `base`), e os outros andam com layout `calma` | — | — |
| Novo | Toque | A mesma folha, vazia. Ao salvar, o botão entra no fim | `fadeUp` | — | — |
| Momento do dia, Dias, Começa | Toque | Folha: escolha única, `DayPicker` (com "Pronto") e `OptionCard` ("Agora, na fase 2", "Na fase 3, 2 nov", "Na fase 4, 23 nov") | O valor da linha troca em `micro` | — | — |
| Criar | Toque | `createHabit(draft)` | A tela cheia desce. Na origem, a linha nova entra com `fadeUp` | `habits` | Hoje: a linha entra no momento do dia ao abrir, com o selo "novo" no primeiro dia. Se começa numa fase futura, vai para Próximas fases, e o toast "Proteína entra na fase 3, em 2 nov" traz Desfazer |

**Estados desta tela:** Criar fica desabilitado sem nome, e "Subir aos poucos" só existe no Contador. Os outros tipos trocam o cartão da meta pelo deles: horário com `TimeValue`, vezes e limite por semana com o `GoalStepper`; Sim ou não e Dias sem não têm meta. Numa conta sem fases, Começa oferece "Hoje" ou uma data.

**Como sai:** "‹ Tipo" (o passo, ao contrário), Criar, ou Cancelar no passo do tipo.
**Também conta em:** fica logo abaixo de Pilar, em "Onde e quando", com o título, a linha "Entra na constância de cada um. A cor é a do principal." e os chips. Vale para Novo hábito e para Editar hábito: o rascunho guarda os extras junto com o pilar, e Salvar só acende quando o conjunto muda (desmarcar e marcar de novo não conta). Um pilar extra arquivado não aparece como chip, mas continua no hábito.
**Acessibilidade:** a meta é ajustável ("Meta, 80 gramas por dia. Ajustável."), e deslizar para cima ou para baixo muda um passo. Os chips formam um grupo "Também conta em", e cada um é um botão de alternar: "Corpo. Botão de alternar, ativado.". A escada tem uma frase só: "Sobe 10 gramas a cada 2 semanas: 80, 90, 100 e 110." Botão rápido: "Editar Ovo, 6 gramas. Botão." A prévia é `aria-hidden`.

**Implementação:** `GoalStepper` e `GoalRamp` são novos; o `QuickAddGrid` ganha `editable`, e o `IconPicker` de Novo pilar volta dentro de um `Sheet`. A prévia é o mesmo cartão do contador do Hoje, com `GoalBar`. Dados: `goal: { value, unit, ramp?: { step, everyWeeks, max, ask: true } }`, `quickAdds: [{ id, name, amount }]` e `pillarId` com `alsoIn: string[]` (os extras, nunca o principal; `createHabit` e `updateHabit` também tiram o principal da lista). As regras do campo ficam em `habitForm.ts` (`withPrimaryPillar`, `toggleAlsoIn`, `formChanged`), testadas no Vitest. O rascunho vive no store `ui` e some em Criar ou Cancelar.
