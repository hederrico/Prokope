# Prokopē

> **προκοπή** (grego): "progresso". Um pouco de progresso, todo dia.

App pessoal de hábitos, organizado em pilares e fases, para iPhone (instalado pela Tela de Início) e computador.

## Documentação

| Documento | O que tem |
|---|---|
| [docs/visao.md](docs/visao.md) | O produto: pilares, hábitos, fases, o dia, decisões técnicas |
| [docs/design-system.md](docs/design-system.md) e [design-system.html](docs/design-system.html) | Cores, tipos, espaços, ícones e o motivo de cada decisão |
| [docs/telas/index.html](docs/telas/index.html) | Todas as telas, como um quadro do Figma (abra no navegador) |
| [docs/interacao/](docs/interacao/README.md) | Movimento, navegação, como as telas conversam, gestos, estados, componentes, acessibilidade e a especificação de cada tela |
| [docs/interacao/laboratorio.html](docs/interacao/laboratorio.html) | Cada animação funcionando, com câmera lenta e modo reduzido |
| [docs/revisao/](docs/revisao/README.md) | A revisão de usabilidade: o que mudou, as decisões e as perguntas em aberto |
| [docs/desenvolvimento.md](docs/desenvolvimento.md) | A ordem de construção, etapa por etapa |
| [docs/firebase.md](docs/firebase.md) | Como ligar o projeto do Firebase, o login e a publicação |

## Rodar

Vite, React e TypeScript. Sem o `.env.local`, o app roda no modo demonstração, com os dados no aparelho.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run dev:phone` | O mesmo, aberto na rede de casa, para testar no iPhone |
| `npm run build` e `npm run preview` | Build de produção (com o service worker) e a prévia dele |
| `npm run typecheck`, `npm run lint` | TypeScript e ESLint |
| `npm test` | Testes do Vitest |
| `npm run test:e2e` | Build e testes do Playwright no tamanho do iPhone |

Os dados das telas e dos testes são ilustrativos. Registros pessoais ficam só no Firebase.
