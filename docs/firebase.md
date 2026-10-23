# Firebase: ligar o projeto

O código já está pronto para o Firebase; falta só o projeto. Enquanto o `.env.local` não tiver a configuração, o app roda no **modo demonstração**, com os dados no próprio aparelho.

O que já está no repositório:

| Arquivo | O que faz |
|---|---|
| `firebase.json` | Hosting servindo o `dist`, com o app de página única (tudo cai no `index.html`) e cache longo para os arquivos com hash |
| `firestore.rules` | Só entra quem está na `allowlist`; cada pessoa lê e escreve só `users/{uid}/**`; `invites` e `links` do A dois |
| `firestore.indexes.json` | Vazio por enquanto (as consultas atuais usam os índices automáticos) |
| `.firebaserc` | O id sugerido, `prokope-app` |
| `.env.example` | As chaves `VITE_FIREBASE_*` |
| `src/data/firebase.ts` | Login Google por redirecionamento e Firestore com cache persistente |
| `.github/workflows/deploy.yml` | Build, testes e publicação no Hosting a cada push na `main` |

Os comandos abaixo usam o Firebase CLI, que já está instalado e logado na sua conta (`firebase --version` e `firebase login:list` para conferir). Se o seu id não for `prokope-app`, troque nos comandos, no `.firebaserc` e no `.env.local`.

## 1. Liberar a cota de projetos

A conta estourou o limite de projetos, e **projetos apagados continuam contando na cota por 30 dias** (ficam em "exclusão pendente"). Por isso a criação ainda falha com `exceeded your allotted project quota`. Há três saídas; escolha uma:

1. **Pedir aumento de cota.** Preencha o formulário de cota de projetos do Google Cloud: <https://support.google.com/code/contact/project_quota_increase>. Diga que é um app pessoal no plano gratuito. A resposta costuma chegar por e-mail em um ou dois dias.
2. **Restaurar um projeto apagado e reaproveitá-lo.** No console do Google Cloud, abra **IAM e administrador › Gerenciar recursos** (<https://console.cloud.google.com/cloud-resource-manager>), clique em **Exclusão pendente**, marque o projeto e toque em **Restaurar**. Depois:
   ```sh
   firebase projects:addfirebase <id-do-projeto>   # só se ele ainda não for um projeto do Firebase
   firebase use --add                              # escolha o projeto e o apelido "default"
   ```
   O `firebase use --add` troca o `default` do `.firebaserc`. Use o mesmo id no `.env.local` e pule o passo 2.
3. **Usar outra conta Google.** `firebase logout` e `firebase login` com a outra conta, e siga daqui. Quem pode entrar no app não depende da conta dona do projeto: é a `allowlist` (passo 6).

## 2. Criar o projeto

```sh
firebase projects:create prokope-app --display-name "Prokope"
```

O id precisa ser único no mundo todo. Se `prokope-app` estiver ocupado, use outro (por exemplo `prokope-hd`) e troque no `.firebaserc`.

## 3. Criar o app web e o `.env.local`

```sh
firebase apps:create web "Prokope" --project prokope-app
firebase apps:sdkconfig web --project prokope-app
```

O segundo comando mostra um objeto com `apiKey`, `projectId`, `appId` e os outros campos. Copie o modelo e preencha:

```sh
cp .env.example .env.local
```

| No `.env.local` | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | **`prokope-app.web.app`** (o domínio do app, e não o `firebaseapp.com` que o comando mostra) |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Essa configuração não é segredo (vai junto com o app para o navegador), mas o `.env.local` fica fora do git para o repositório público não apontar para o seu projeto. O domínio do login igual ao do app é o que faz o "Entrar com Google" funcionar no Safari e no app instalado no iPhone. Quando o app abre em `prokope-app.web.app` ou `prokope-app.firebaseapp.com`, o código já usa o próprio domínio.

## 4. Criar o Firestore em São Paulo

```sh
firebase firestore:databases:create "(default)" --location=southamerica-east1 --project prokope-app
```

Ou pelo console: **Firestore Database › Criar banco de dados**, modo de produção, local **southamerica-east1 (São Paulo)**. O local não muda depois.

## 5. Ativar o login com Google

1. No console do Firebase, abra **Authentication › Começar › Método de login › Google**, ative, escolha o e-mail de suporte e salve.
2. Em **Authentication › Configurações › Domínios autorizados**, confira se estão `localhost`, `prokope-app.web.app` e `prokope-app.firebaseapp.com` (eles entram sozinhos).
3. Como o login usa o domínio `web.app`, avise o Google: no console do Google Cloud, **APIs e serviços › Credenciais**, abra o cliente OAuth "Web client (auto created by Google Service)" e, em **URIs de redirecionamento autorizados**, acrescente `https://prokope-app.web.app/__/auth/handler`. Salve (pode levar alguns minutos para valer).

## 6. Quem pode entrar: a `allowlist`

As regras só deixam entrar quem tem o e-mail na coleção `allowlist`. Ela é editada **só pelo console** (o app não consegue escrever nela). No console, **Firestore Database › Iniciar coleção**:

- ID da coleção: `allowlist`
- ID do documento: o e-mail **em minúsculas**, por exemplo `fulano@gmail.com`
- Um campo qualquer, por exemplo `addedAt` (timestamp) ou `note` (texto)

Repita para cada pessoa. Quem entrar com um e-mail fora da lista consegue fazer o login, mas não lê nem grava nada, e o app mostra "Conta sem acesso". Os e-mails ficam só no Firebase, nunca no repositório.

## 7. Publicar as regras e o app

```sh
npm run build
firebase deploy --only firestore:rules,hosting
```

O app fica em <https://prokope-app.web.app>. No iPhone: abra no Safari, toque em **Compartilhar › Adicionar à Tela de Início**, abra pelo ícone e entre com Google.

## 8. Publicação automática pelo GitHub Actions

O fluxo `.github/workflows/deploy.yml` roda a cada push na `main`. Sem o segredo, ele só confere o build e os testes; com o segredo, publica no Hosting.

1. **Conta de serviço.** No console do Google Cloud, **IAM e administrador › Contas de serviço › Criar conta de serviço**, com o nome `github-deploy` e os papéis **Administrador do Firebase Hosting** e **Leitor de chaves de API**. Abra a conta criada, **Chaves › Adicionar chave › JSON**, e baixe o arquivo.
2. **Segredo no GitHub.** Na pasta do projeto:
   ```sh
   gh secret set FIREBASE_SERVICE_ACCOUNT < caminho/da/chave.json
   ```
   Depois apague o arquivo da chave do computador. (Pelo site: **Settings › Secrets and variables › Actions › New repository secret**, com o nome `FIREBASE_SERVICE_ACCOUNT` e o conteúdo do JSON.)
3. **Configuração do app no GitHub.** O build do Actions precisa das mesmas chaves do `.env.local`, como variáveis do repositório (não são segredo):
   ```sh
   gh variable set -f .env.local
   ```
4. Faça um push na `main` (ou rode o fluxo em **Actions › Deploy › Run workflow**) e confira a publicação.

Evite o `firebase init hosting:github`: ele cria fluxos próprios por cima do nosso.

## Depois de ligado

- O cache do Firestore fica no IndexedDB do aparelho: o app abre e grava sem internet e sobe quando a conexão volta.
- Regras novas: edite `firestore.rules` e rode `firebase deploy --only firestore:rules`.
- Para testar no celular pela rede de casa (`npm run dev:phone`), o login Google só funciona em `localhost` e nos domínios autorizados. Para testar o login no iPhone, use o app publicado.
