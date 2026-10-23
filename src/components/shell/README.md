# components/shell

A casca do app: abas, barras do topo, folhas, toasts e as passagens entre telas. Comportamento em
docs/interacao/navegacao.md e docs/interacao/movimento.md. Tudo sai de `@/components/shell`.

## Como as telas usam

| Tela | Topo | Como sai |
|---|---|---|
| Aba (`/hoje`, `/progresso`...) | `<ScreenHeader context="Quinta, 22 de outubro" title="Hoje" trailing={...} />` | — |
| Empurrada (`/ajustes/pilares`) | `<NavBar title="Pilares" action={{ label: 'Novo pilar', icon: 'plus', onClick }} />` — o "‹ Ajustes" vem da pilha da aba | Voltar, ou o arrasto da borda |
| Tela cheia (formulário) | `<FullScreen top={<NavBar cancel title="Novo pilar" action={{ label: 'Criar', disabled: !nome, onClick }} />}>` | Cancelar: `useGoBack()` |
| Fluxo em passos | `<FullScreen top={<StepTop step={n} total={3} onBack onClose />}>` e o conteúdo em `<StepTransition step={n}>` | `useFlowStep().goTo(n)` troca o passo com `replace` |
| Folha (`?folha=agua`) | o componente registrado em `src/app/sheets.ts` recebe `{ params, close }` e devolve `<Sheet title="Água" footer={...} keyboardAware>` | arrastar, tocar fora, Esc, X, `close()` |

- **Navegar**: use `<Link to>` ou `navigate()` normais; a casca escolhe a passagem sozinha (outra aba: opacidade;
  mais fundo na mesma aba: empurra; voltar: o inverso; tela cheia: sobe 24 px). Para forçar: `state: { transition: 'pop' }`.
- **Rotas espelho**: `useMirrorPaths().habit(id)` e `.pastReview(semana)` abrem dentro da aba atual.
- **Abrir folha**: `useOpenSheet()('menu', { habito: id })`. Da folha para uma tela: `navigate(path, { replace: true })`.
- **Folha local** (fora da URL): `<Sheet open={open} onOpenChange={setOpen} title="...">`.
- **Desfazer**: `showUndo({ title: 'Caminhada marcada', detail: '3 de 7 na semana', pillar: 'familia', icon: 'check' }, undo)`.
  Outros avisos: `showToast({ title, detail, action, duration })`.
- **Nome no Voltar** da próxima tela, quando o nome é dado da pessoa: `useScreenTitle(pilar.nome)`.
- A camada da tela já rola (cada tela guarda a rolagem) e já deixa o espaço da barra de abas embaixo.
