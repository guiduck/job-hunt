# Plasmo Chrome Extension - Uso Local

Este guia cobre a primeira versao da extensao Chrome para o modo `Full-time`.

## O Que Ela Faz

- Abre uma busca de publicacoes do LinkedIn usando `sortBy="date_posted"`.
- Usa a sessao real do Chrome, entao voce deve estar logado no LinkedIn.
- Rola a pagina de resultados e captura textos visiveis dos posts.
- Envia os textos para a API como `authenticated_browser_search`.
- Lista oportunidades `job` ja processadas pelo worker.
- Permite atualizar `review_status`, `job_stage` e notas.
- Permite conectar uma conta Google/Gmail pelo backend, subir um curriculo PDF, escolher o curriculo
  padrao e preparar/enviar emails pela API/worker.

O envio real usa Gmail API/OAuth no backend/worker. A extensao abre o fluxo de consentimento Google,
mas nao guarda refresh token, client secret ou token de acesso.

## Configuracao

Copie o exemplo de ambiente da extensao:

```bash
cp apps/extension/.env.example apps/extension/.env
```

Valor local padrao:

```text
PLASMO_PUBLIC_API_BASE_URL=http://localhost:8000
```

Quando existir homologacao ou producao, troque esse valor pela URL correspondente e gere um novo build.

## Login Da Extensao

A extensao agora exige signup/login antes de carregar dados operacionais. Ela guarda somente o bearer
token em `chrome.storage.session`, entao reiniciar o navegador exige login novamente. Logout limpa o
token local e revoga a sessao no backend. O reset de senha fica disponivel na tela inicial; a API cria
um pedido temporario sem confirmar se o email existe.

Para login Google e envio Gmail, configure tambem no backend:

```text
EMAIL_PROVIDER=gmail
GMAIL_OAUTH_CLIENT_SECRETS_FILE=.local/gmail/client_secret.json
GMAIL_OAUTH_REDIRECT_URI=http://localhost:8000/sending/google-oauth/callback
```

No Google Cloud Console, o redirect URI autorizado do OAuth Client precisa bater exatamente com
`GMAIL_OAUTH_REDIRECT_URI`.

## Subir Backend Local

```bash
docker compose up -d
docker compose ps
```

Espere a API ficar healthy e o worker ficar em execucao.

## Rodar Em Desenvolvimento

```bash
cd apps/extension
npm install
npm run dev
```

Carregue a pasta gerada pelo Plasmo em `chrome://extensions` usando o modo desenvolvedor.

## Gerar Build

```bash
cd apps/extension
npm run build
```

Carregue no Chrome a pasta:

```text
apps/extension/build/chrome-mv3-prod
```

## Fluxo De Captura

1. Faca login no LinkedIn no Chrome normal.
2. Abra a extensao `Opportunity Desk`.
3. Crie conta ou faca login na extensao.
4. Entre na aba `search`.
5. Informe keywords como `hiring typescript`.
6. Ajuste `max posts` e `max scrolls`.
7. Clique em `Open LinkedIn and capture`.
8. A extensao abre uma aba do LinkedIn, rola os resultados, captura posts e cria uma run autenticada na API.
9. Aguarde o worker processar a run.
10. Volte para a aba `jobs` e clique em `Refresh`.

## Validacao Rapida

```bash
cd apps/extension
npm run typecheck
npm run build
```

Depois de capturar posts pela extensao, confira a API:

```bash
TOKEN="<TOKEN_DA_EXTENSAO_OU_LOGIN>"
curl http://localhost:8000/job-search-runs -H "Authorization: Bearer $TOKEN"
curl "http://localhost:8000/opportunities?opportunity_type=job&contact_available=true" \
  -H "Authorization: Bearer $TOKEN"
```

## Limitacoes Atuais

- A extracao depende do DOM atual do LinkedIn e pode precisar de ajuste se a pagina mudar.
- A extensao nao clica em `ver mais`, para evitar modais e travamentos.
- A primeira versao usa metricas derivadas no popup, sem endpoint agregado dedicado.
- O coletor Playwright local continua sendo fallback caso a extensao precise ser comparada ou depurada.
- O estado de login fica em browser session storage; reiniciar o navegador exige login novamente.
