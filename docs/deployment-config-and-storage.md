# Deploy, Configuracao e Storage

Este documento registra a decisao de ambiente para evitar que o projeto fique preso ao computador
local.

## Regra principal

Tudo que muda por ambiente deve vir de variavel de ambiente, secret manager ou servico gerenciado.
Arquivos em `.local/` sao apenas conveniencia de desenvolvimento e nao devem ser tratados como fonte
de verdade da aplicacao.

Antes de expor a API fora do computador local, a aplicacao tambem precisa de login por usuario e
ownership dos dados. O produto nao tera times/workspaces no primeiro ciclo; cada usuario tera email,
senha, dados proprios e uma assinatura futura propria.

## O que `.local/` significa hoje

`.local/` e uma pasta ignorada pelo Git para arquivos locais:

- perfil persistente do Playwright/Chrome usado na coleta autenticada do LinkedIn
- logs/debug do coletor local
- opcionalmente, o `client_secret.json` baixado do Google Cloud para desenvolvimento
- arquivos temporarios usados pelo operador durante testes locais

`.local/` nao e banco de dados. O banco local e o PostgreSQL do Docker Compose, persistido no volume
`postgres_data`. Em producao, esse banco deve ser substituido por um Postgres gerenciado, por exemplo
Render Postgres.

## Dados que ja ficam no banco

Estes dados operacionais ja devem ser considerados persistidos no PostgreSQL:

- usuarios, password hashes e sessoes de auth
- oportunidades, runs, candidatos e evidencias
- settings do usuario
- templates de email
- drafts, send requests, bulk batches e eventos de outreach
- tokens OAuth do Gmail em `sending_provider_accounts.token_json`
- conteudo de PDFs de curriculo em `resume_attachments.file_content`

Isso significa que trocar de ambiente nao exige copiar `.local/` para manter tokens ou curriculos
enviados pelo app. O que precisa ser migrado/preservado e o banco. Em ambiente publicado, esses
registros tambem precisam estar associados ao `user_id` correto.

## Variaveis de auth e reset

Use os mesmos nomes em local, staging e producao, trocando apenas os valores:

- `AUTH_SESSION_TTL_HOURS`
- `AUTH_TOKEN_BYTES`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES`
- `DEFAULT_LOCAL_USER_EMAIL`
- `DEFAULT_LOCAL_USER_DISPLAY_NAME`

Validacao minima apos deploy: `/health`, registro, login, `/auth/me`, reset de senha, duas contas sem
visibilidade cruzada, OAuth Gmail com callback publico e envio aprovado processado pelo worker.

## Usuarios e dados por usuario

O recorte `007-user-auth-ownership-deploy` adicionou usuarios individuais com email/senha e `user_id`
aos recursos operacionais principais. Isso vale para settings, curriculos, templates, provider Gmail,
tokens OAuth, runs, oportunidades, drafts, envios, bulk batches e eventos.

Nao criar um usuario novo silenciosamente por instalacao da extensao. A extensao deve ter fluxo
explicito de signup/login e enviar requisicoes autenticadas.

## Gmail OAuth: client secret x token

Existem dois tipos de dados diferentes:

- `client secret`: configuracao do app OAuth criado no Google Cloud. Ele identifica o projeto OAuth
  da aplicacao e deve entrar como secret de ambiente.
- `token OAuth`: autorizacao concedida pelo usuario depois do login/consentimento Google. Esse token
  permite enviar email pela conta conectada e fica no banco.

Para desenvolvimento local, existem duas formas suportadas para o client secret:

- `GMAIL_OAUTH_CLIENT_CONFIG_JSON`: JSON bruto do OAuth client como variavel/secret.
- `GMAIL_OAUTH_CLIENT_SECRETS_FILE`: caminho para um arquivo local, por exemplo
  `.local/gmail/client_secret.json`.

Para deploy em Render, preferir `GMAIL_OAUTH_CLIENT_CONFIG_JSON` no painel de Environment/Secrets do
servico da API. O worker nao precisa do client secret para enviar emails; ele usa o token salvo no
banco.

## Curriculos

O upload atual salva o PDF no PostgreSQL como `BYTEA`. Isso e simples e suficiente para o momento
inicial. Quando o volume crescer, a evolucao recomendada e:

1. manter metadata, default resume e relacoes no PostgreSQL
2. mover bytes do arquivo para R2/S3/GCS
3. salvar no banco apenas `storage_backend`, `object_key`, `mime_type`, tamanho e checksum
4. preservar a API de upload/download para nao quebrar a extensao

## Limites

Limites globais por env foram removidos:

- nao ha `EMAIL_SEND_DAILY_LIMIT`
- nao ha `JOB_SEARCH_DEFAULT_CANDIDATE_LIMIT`

Quando houver planos/assinaturas, limites devem vir de regra de produto no banco, por usuario,
assinatura ou plano. Variavel de ambiente global nao e boa fonte para isso porque mistura todos os
usuarios e ambientes.

## Checklist antes de subir em Render

- Criar Postgres gerenciado e configurar `DATABASE_URL`.
- Validar login de usuario por email/senha, reset de senha e logout.
- Confirmar `user_id`/ownership em settings, curriculos, templates, provider Gmail, runs,
  oportunidades, drafts e eventos.
- Configurar `EMAIL_PROVIDER=gmail`.
- Configurar `GMAIL_OAUTH_CLIENT_CONFIG_JSON` como secret do servico da API.
- Configurar `GMAIL_OAUTH_REDIRECT_URI` com a URL publica da API, por exemplo
  `https://api.example.com/sending/google-oauth/callback`.
- Cadastrar essa redirect URI no OAuth client do Google Cloud.
- Configurar `GMAIL_OAUTH_SUCCESS_REDIRECT_URL` para uma tela do app/extensao ou pagina de sucesso.
- Apontar a extensao com `PLASMO_PUBLIC_API_BASE_URL` para a API publicada.
- Rodar migrations no banco publicado.
- Validar `/sending/google-oauth/start`, callback, status do provider e um envio real controlado.
