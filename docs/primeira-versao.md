# Primeira versão

O app inteiro, do celular, construído em 23 de outubro de 2026 a partir do quadro de telas e das especificações de interação. Funciona hoje no **modo demonstração**, com os dados de exemplo da história do quadro guardados no aparelho. O login com Google e a sincronização entram quando o projeto do Firebase existir ([firebase.md](firebase.md)).

## Como testar

```
npm install
npm run dev          # http://localhost:5173
npm run dev:phone    # o mesmo, na rede de casa, para abrir no iPhone
```

- Na tela Entrar, toque em **Explorar com dados de exemplo**.
- **Ver o dia em outro horário:** acrescente `?agora=20:34` à URL (ou `?agora=2026-11-01T18:30`). Depois de mudar a hora, use **Começar de novo a demonstração** em Ajustes.
- **Testar o primeiro acesso:** Ajustes › **Testar o primeiro acesso**.
- **Componentes:** a galeria fica em `/dev/componentes` (só no `npm run dev`).

## No iPhone

A demonstração está publicada em **<https://hederrico.github.io/Prokope/>**:

1. Abra o endereço no Safari.
2. Toque em **Compartilhar › Adicionar à Tela de Início**.
3. Abra pelo ícone e toque em **Explorar com dados de exemplo**.

Detalhes:

- **Os dados ficam no aparelho.** Cada iPhone tem a sua própria demonstração, sem login e sem sincronização. Para recomeçar a história, use **Ajustes › Começar de novo a demonstração**.
- **Publicação.** O fluxo `.github/workflows/pages.yml` roda os testes e publica a cada push na branch `etapa-9-github-pages` (e na `main`, quando o app chegar nela).
- **Atualização.** Quando sai uma versão nova, o app mostra o aviso para atualizar.
- **O que é diferente do Firebase Hosting.** O app mora na pasta `/Prokope/`, e um link direto para uma tela chega pelo `404.html`, que é o próprio app.

## O que está pronto

| Área | Telas |
|---|---|
| Entrada | Instalar no iPhone, Entrar (Google ou demonstração), Conta sem acesso, primeiro acesso em 3 passos com o plano base |
| Hoje | Manhã, tarde, noite, dia fechado, domingo com a revisão, outro dia, primeiro dia, pausado, sem internet, carregando, menu do hábito, corrida minimizada |
| Registros | Proteína, água, acordar e deitar, nota da refeição, check-in, deslize, peso |
| Hábito e Progresso | O hábito em todos os tipos, corrigir um dia, Progresso por período com visão geral, humor, medidas e um chip por pilar, o resumo de um dia |
| Jornada | Fases, editar fases, plano de corrida, corrida em andamento, treino feito, revisão da semana, fase desbloqueada, mais uma semana |
| Ajustes | Pilares, hábitos, horários, lembretes, aparência, pausa, a dois, dados e conta |

Por baixo:
- passagens entre telas, com o voltar pelo arrasto e a folha arrastável;
- desfazer em tudo;
- dia lógico às 4h;
- funcionamento sem internet;
- tema claro e escuro;
- movimento reduzido;
- testes de unidade e de ponta a ponta no tamanho do iPhone.

## Branches

Uma por etapa, cada uma partindo da anterior:

| Branch | O que tem |
|---|---|
| `docs/planejamento` | Toda a documentação |
| `etapa-0-fundacao` | Projeto, tokens, fontes, ícones, PWA, estrutura do Firebase |
| `etapa-1-2-casca-e-dados` | Dados, domínio e demonstração; casca, movimento e componentes |
| `etapa-3-hoje` | Integração entre as camadas, Hoje e folhas de registro |
| `etapa-4-entrada` | Entrada e primeiro acesso |
| `etapa-5-progresso` | Hábito e Progresso |
| `etapa-6-jornada` | Jornada, corrida e revisão |
| `etapa-7-ajustes` | Ajustes |
| `etapa-8-acabamento` | Correções da auditoria de fidelidade |
| `etapa-9-github-pages` | A demonstração no GitHub Pages (a ponta, com tudo) |

As branches estão no GitHub. A `main` continua como estava.

## O que ficou para depois

- **Firebase:** a conta Google atingiu a cota de projetos (os apagados contam por 30 dias). Os caminhos estão em [firebase.md](firebase.md). O código já está pronto para ele. Até lá, o login com Google não existe, e o app funciona só na demonstração.
- **Layout do computador:** por enquanto, o app aparece numa coluna central. O desenho próprio do computador vem depois, como combinado (mobile first).
- **Regras do Firestore:** não foram testadas no emulador, que pede Java 11 (a máquina tem o 8).

## Para você decidir

Diferenças pequenas que os agentes escolheram e anotaram:

- **Ícone do hábito feito:** passa de Duotone para Fill, como dizem os documentos. O quadro mostrava Duotone.
- **Constância por pilar:** a fórmula aplicada aos dados da história dá Corpo 75% e Alimentação 65%, contra 71% e 64% no quadro. O hoje entra na conta só com o que já foi feito.
- **Força do hábito:** é uma média que pesa mais os dias recentes, sem começar do zero.
- **Contagem de hábitos em Ajustes:** 19, e não 16. Almoço e jantar, peso e cintura, e o tempo de tela são hábitos separados nos dados.
- **Novo hábito:** "Subir aos poucos" vem desligado em contadores novos, e a unidade é uma lista com a opção "Outra".
- **Noite:** o cartão da semana sai do Hoje à noite, como no quadro.
- **Períodos do Progresso:** vão do mais novo para o mais antigo.
