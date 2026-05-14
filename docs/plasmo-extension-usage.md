# Plasmo Chrome Extension - Uso Local

Este guia cobre a primeira versao da extensao Chrome para o modo `Full-time`.

## O Que Ela Faz

- Abre uma busca de publicacoes do LinkedIn usando `sortBy="date_posted"`.
- Usa a sessao real do Chrome, entao voce deve estar logado no LinkedIn.
- Rola a pagina de resultados e captura textos visiveis dos posts.
- Quando a lista visivel para de carregar e aparece um controle de mais resultados, tenta acionar esse
  controle como parte do fluxo iniciado pelo usuario.
- Envia os textos para a API como `authenticated_browser_search`.
- Lista oportunidades `job` ja processadas pelo worker e mostra dashboard focado em jobs totais e
  jobs ainda nao enviados, sem reaproveitar filtros ativos da lista Jobs.
- Permite atualizar status operacional `unsent/sent/interview` e notas, preservando campos legados de
  `review_status`/`job_stage` no contrato.
- Permite conectar uma conta Google/Gmail pelo backend, subir um curriculo PDF, escolher o curriculo
  padrao e preparar/enviar emails pela API/worker.
- Permite salvar sender profile com nome, email, portfolio, LinkedIn, WhatsApp e informacoes extras;
  esses dados, junto do curriculo, entram como contexto para emails gerados por IA.
- Inclui um assistente de campos externos: content script detecta campos longos de candidatura em
  dominios habilitados, posiciona um botao de varinha magica no fim do campo e chama a API para gerar
  respostas com IA usando curriculo/perfil do usuario.

O envio real usa Gmail API/OAuth no backend/worker. A extensao abre o fluxo de consentimento Google,
mas nao guarda refresh token, client secret ou token de acesso. Login com Google e autenticacao do app,
separada do OAuth Gmail; quando o email verificado ja existe, a identidade Google deve ser vinculada
ao usuario local existente.

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
GOOGLE_AUTH_REDIRECT_URI=http://localhost:8000/auth/google/callback
GOOGLE_AUTH_SCOPES=openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile
```

No Google Cloud Console, os redirect URIs autorizados do OAuth Client precisam incluir exatamente:

- `http://localhost:8000/sending/google-oauth/callback`
- `http://localhost:8000/auth/google/callback`

O primeiro e para permissao Gmail send em Settings. O segundo e para login Google do app.

## Assistente De Campos

O assistente fica desativado por padrao em sites externos. Depois de logar:

1. Abra uma pagina de candidatura.
2. Clique em `Enable site` no header autenticado, ou use `settings > AI field assistant`.
3. Escolha `Enable current site` para liberar o dominio base, ou `Enable exact page` para uma URL
   especifica.
4. Em campos elegiveis, use o botao `Pin assistant` para abrir a shell persistente e a varinha magica
   ao lado de perguntas de texto.

O content script ignora campos sensiveis como senha, token, OTP, cartao, CPF/CNPJ e campos ocultos ou
readonly. Ele envia ao backend apenas metadados seguros do campo, label/pergunta proxima e URL
sanitizada. A resposta gerada aparece para revisao; inserir, substituir, anexar ou salvar exige clique
explicito do operador. A extensao nunca submete formularios externos automaticamente.

Respostas salvas sao owner-scoped por keyword e limitadas a 3 por usuario + keyword. O salvamento e
manual: gerar uma resposta nao persiste sugestao automaticamente.

## UI Persistente

O popup nativo do Chrome fecha quando perde foco. O fluxo autenticado agora substitui `Keep open` por
`Pin assistant`, que pede ao content script para abrir uma shell fixa/minimizavel dentro da aba ativa,
sem depender da janela popup do Chrome. O documento `PERSISTENT_EXTENSION_SHELL.md` explica a diferenca
entre popup, janela separada e UI injetada persistente.

Enquanto o usuario nao estiver autenticado, a extensao deve mostrar apenas a experiencia de login. O
titulo, abas (`dashboard`, `search`, `jobs`, `templates`, `settings`) e acoes operacionais devem ficar
ocultos ate existir sessao valida.

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
6. Opcionalmente ligue `AI filters` e configure remoto/regioes para avaliacao pos-captura.
7. Ajuste `max posts` e `max scrolls`.
8. Clique em `Open LinkedIn and capture`.
9. A extensao abre uma aba do LinkedIn, rola os resultados, captura posts e cria uma run autenticada na API.
10. Aguarde o worker processar a run. A verificacao da extensao acompanha o status por ate cerca de 10
   minutos; se estourar esse tempo, a captura vira um timeout terminal na UI e libera uma nova busca.
11. Volte para a aba `jobs` e clique em `Refresh`.

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
curl "http://localhost:8000/opportunities/metrics?opportunity_type=job" \
  -H "Authorization: Bearer $TOKEN"
curl "http://localhost:8000/opportunities?opportunity_type=job&contact_available=true" \
  -H "Authorization: Bearer $TOKEN"
```

## Limitacoes Atuais

- A extracao depende do DOM atual do LinkedIn e pode precisar de ajuste se a pagina mudar.
- A extensao trata apenas controles visiveis de mais resultados na pagina de resultados; mudancas de
  DOM/idioma podem exigir novos labels ou seletores.
- O worker marca runs `running` muito antigas como falha por timeout configuravel; isso nao cancela um
  processo Python preso no meio da execucao, mas evita que reinicios/loops posteriores deixem runs
  antigas bloqueando a operacao.
- O coletor Playwright local continua sendo fallback caso a extensao precise ser comparada ou depurada.
- O estado de login fica em browser session storage; reiniciar o navegador exige login novamente.
- O assistente de campos usa host permissions amplas para poder operar nos dominios escolhidos pelo
  usuario, mas permanece opt-in por dominio/pagina e autenticado antes de injetar controles.
