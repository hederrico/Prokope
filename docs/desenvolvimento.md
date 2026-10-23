# Plano de desenvolvimento

A ordem para construir o Prokopē, o que ler antes de cada etapa e quando cada etapa está pronta. As decisões tomadas na revisão de usabilidade e as perguntas em aberto estão em [revisao/README.md](revisao/README.md). As decisões de produto estão em [visao.md](visao.md), as visuais em [design-system.md](design-system.md), as telas em [telas/index.html](telas/index.html) e o comportamento em [interacao/](interacao/README.md).

## Estrutura do código

```
src/
  app/          AppShell, rotas, provedores (MotionConfig, Toaster, tema)
  screens/      uma pasta por área: today, progress, journey, settings, onboarding, run, review
  components/   componentes do design system (HabitRow, CheckButton, Sheet, GoalBar, Ring...)
  motion/       tokens.ts, variantes, transições de rota, arrasto da folha e do voltar
  data/         firebase.ts, listeners.ts, conversores entre tipos e documentos
  stores/       dados normalizados e estado de interface (Zustand)
  domain/       funções puras: dia lógico, constância, força, dias sem, correlações, fases, plano de corrida
  actions/      markHabit, addEntry, rate, logSlip... cada uma devolve o seu desfazer
  icons/        Salsicha (IconBase) e o acesso aos ícones do Phosphor
  styles/       tokens.css (@theme do Tailwind) e fontes
public/fonts/   Fraunces recortada em woff2 (com "ē" e acentos), Literata só com o grego
tests/e2e/      Playwright, no tamanho do iPhone (390 × 844) e do computador
```

No código, tudo em inglês. Rotas e textos da interface em português.

## Etapas

### 0 · Fundação

- Vite, React, TypeScript, Tailwind com os tokens do `:root` de `design-system.html`, nos dois temas.
- Fontes hospedadas no app (veja "Tipografia" em design-system.md).
- PWA: manifesto, ícones, `vite-plugin-pwa` em modo de aviso.
- Firebase: projeto, login Google, Firestore com cache persistente, regras com a lista de e-mails permitidos e `users/{uid}`. Sem Cloud Functions: tudo cabe no plano gratuito (Spark), sem cartão.
- GitHub Actions publicando no Firebase Hosting a cada push na `main`.

**Ler:** visao.md (decisões técnicas), design-system.md.
**Pronto quando:** o app abre instalado no iPhone, entra com Google e mostra uma tela em branco com o nome do usuário, nos dois temas.

### 1 · Casca e movimento

- `AppShell`, `TabBar` e as rotas de [navegacao.md](interacao/navegacao.md).
- As quatro passagens: aba, tela empurrada com o voltar pela borda, folha com arrasto e tela cheia.
- `motion/tokens.ts`, `MotionConfig` com movimento reduzido e o interruptor do app.
- `Toast` com desfazer, o truque da vibração e o som opcional.

**Ler:** [movimento.md](interacao/movimento.md), [navegacao.md](interacao/navegacao.md), [gestos-e-feedback.md](interacao/gestos-e-feedback.md), [componentes.md](interacao/componentes.md) e [acessibilidade.md](interacao/acessibilidade.md). Comparar com o [laboratório](interacao/laboratorio.html).
**Pronto quando:** dá para navegar por telas vazias com as passagens iguais às do laboratório, no iPhone e no computador, e o movimento reduzido troca tudo por opacidade.

### 2 · Dados e domínio

- Tipos, conversores, ouvintes e stores de [comunicacao.md](interacao/comunicacao.md).
- Ações com desfazer.
- Funções puras com testes no Vitest: dia lógico (virada às 4h, semana na segunda), constância, força do hábito no estilo do Loop, dias sem (atual, recorde, total), orçamento semanal, correlações (7 dias com e 7 sem), pausas fora das contas.

**Ler:** comunicacao.md, [estados.md](interacao/estados.md), "Experiência" em design-system.md.
**Pronto quando:** os testes cobrem os casos da história do quadro (por exemplo, caminhada 3 de 7 na quinta, refrigerante 12 dias com recorde 21 e total 33).

### 3 · Hoje e registros

- Hoje por momento do dia, semana do topo, resumo da fase, cartão gentil.
- Folhas de proteína, água, acordar, nota, check-in, deslize e peso.
- Outro dia, menu do hábito, "hoje não se aplica", dia fechado.

**Ler:** [telas/hoje.md](interacao/telas/hoje.md), [telas/registros.md](interacao/telas/registros.md), [telas/estados.md](interacao/telas/estados.md).
**Pronto quando:** um dia inteiro da história pode ser vivido no app, do acordar ao dia fechado, com desfazer em tudo e sem internet no meio.

### 4 · Entrada

- Instalar no iPhone, Entrar, Conta sem acesso, Começar em 3 passos.
- "Com o plano base" cria os pilares e os hábitos da fase 1 de visao.md. Nenhum valor pessoal (peso, metas próprias) fica no código: a pessoa preenche no app.

**Ler:** [telas/entrada.md](interacao/telas/entrada.md).
**Pronto quando:** uma conta nova chega ao primeiro Hoje em menos de 1 minuto.

### 5 · Hábito e Progresso

- Tela do hábito: força, semana, heatmap, insight, pausar e arquivar.
- Progresso: visão geral, corpo e peso, humor, alimentação. Gráficos próprios em SVG com d3-shape e d3-scale.

**Ler:** [telas/habito-progresso.md](interacao/telas/habito-progresso.md), "Gráficos" em design-system.md.

### 6 · Jornada

- Fases, revisão de domingo em 3 passos, fase desbloqueada com confete.
- Plano de corrida e corrida em andamento: tela sempre acesa (Wake Lock), tempo calculado pela hora de início, aviso das trocas.

**Ler:** [telas/jornada.md](interacao/telas/jornada.md).

### 7 · Ajustes

- Pilares (paleta de 12 cores, biblioteca de ícones com busca sem acento), hábitos (9 tipos), horários, lembretes, aparência, pausar, dados e conta (exportar CSV e JSON, apagar tudo).

**Ler:** [telas/ajustes-plano.md](interacao/telas/ajustes-plano.md), [telas/ajustes-rotina-conta.md](interacao/telas/ajustes-rotina-conta.md).

### 8 · Computador

- Barra lateral, duas colunas no Hoje, diálogos no lugar das folhas, atalhos de teclado.

**Ler:** a seção "No computador" de navegacao.md e [telas/entrada.md](interacao/telas/entrada.md).

### Depois

- A dois (espaço compartilhado opcional), sempre por escolha das duas pessoas. O convite é um link para compartilhar, sem servidor.

## Testes

- **Vitest:** todo o `domain/` e as ações (com o Firestore emulado).
- **Playwright:** um teste por fluxo (marcar e desfazer, somar proteína até a meta, check-in, deslize, revisão, pausar), no tamanho do iPhone e do computador, com e sem movimento reduzido (`reducedMotion: 'reduce'`).
- **Acessibilidade:** axe nos testes do Playwright; VoiceOver no iPhone antes de cada etapa fechar, seguindo a lista de verificação de [acessibilidade.md](interacao/acessibilidade.md).

## Confirmar no iPhone cedo

Estas coisas dependem do iOS e podem mudar entre versões. Vale testar na etapa 0 ou 1, antes de construir em cima delas:

- Login Google com redirecionamento dentro do app instalado.
- Vibração pelo truque do interruptor.
- Wake Lock no app instalado (corrida). A pesquisa do grupo da Jornada indica que só funciona no app instalado a partir do iOS 18.4.
- Som da corrida com `navigator.audioSession.type = 'transient'`, para o bipe abaixar a música em vez de pará-la, e o comportamento no modo silencioso.
- Links abertos pelo app Atalhos: abrem no Safari ou no app instalado?
- Cache do Firestore (IndexedDB) sobrevivendo a dias sem abrir o app.

## Privacidade

O repositório é público. Nenhum dado pessoal entra no código, nos testes ou nas capturas: os testes usam os dados ilustrativos do quadro. Registros, metas, peso e anotações ficam só no Firebase.
