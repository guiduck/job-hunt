# Scrapper Freelance API

Plataforma pessoal para descobrir, organizar e operar oportunidades em dois trilhos de primeira
classe:

- `freelance`: empresas e contatos com potencial comercial
- `job`: vagas de emprego aderentes ao perfil profissional

## Objetivo atual

Construir uma base de desenvolvimento que permita:

- busca especializada de vagas e publicacoes de emprego
- matching por keywords configuradas ou extraidas do curriculo
- captura de oportunidades com evidencia de origem
- persistencia estruturada no `PostgreSQL`
- revisao e qualificacao em fluxo estilo CRM
- envio assistido de templates de email com curriculo anexado

## Direcao do produto

Expansoes planejadas:

- painel operacional para revisar oportunidades
- tracking de outreach
- templates e campanhas
- area de IA para gerar prompts e materiais
- bot de prospeccao freelance para empresas sem site ou com baixa maturidade digital
- sugestoes de areas com maior concentracao dos nichos escolhidos
- compatibilidade futura com Google Maps

## Decisoes atuais

- backend em `FastAPI`
- banco em `PostgreSQL`
- ambiente local com `Docker Compose`
- jobs longos fora do processo HTTP
- deploy da API e worker no `Render`
- envio real de email `Full-time` via Gmail API/OAuth no worker, com segredos via variaveis de ambiente ou arquivos secretos do ambiente
- `Next.js` entra quando a operacao manual justificar uma web interna
- prioridade inicial de produto: `job`
- proxima prioridade depois do fluxo de emprego: `freelance`

## Quando entra front

Para scraping puro, nao e obrigatorio.

Para revisar oportunidades, separar `job` de `freelance`, mudar status por clique, registrar notas,
selecionar vagas e enviar emails com curriculo anexado, uma web simples passa a fazer sentido cedo.

## Documentacao

- `docs/overview.md`
- `docs/product-modes.md`
- `docs/architecture.md`
- `docs/auth-and-ownership.md`
- `docs/domain-model.md`
- `docs/bot-1-job-search.md`
- `docs/bot-1-scraper.md`
- `docs/search-improvements.md`
- `docs/plasmo-extension-usage.md`
- `docs/roadmap.md`
- `docs/action-plan.md`
- `docs/handoff.md`
- `docs/deployment-config-and-storage.md`
- `docs/current-state-review.md`
- `docs/reference-ui.md`
- `docs/lovable-prompt-base.md`

## Envio de Email Full-time

O recorte atual usa `Gmail API/OAuth` como provider v1. Ele envia email de verdade pela conta Gmail
autorizada pelo operador. Para um produto multiusuario ou transacional, a arquitetura ja separa
`EMAIL_PROVIDER` para permitir um adapter futuro como SendGrid, Resend ou Postmark.

No local, use `.env.local`:

```bash
EMAIL_PROVIDER=gmail
GMAIL_OAUTH_CLIENT_CONFIG_JSON=
GMAIL_OAUTH_CLIENT_SECRETS_FILE=.local/gmail/client_secret.json
GMAIL_OAUTH_SCOPES=https://www.googleapis.com/auth/gmail.send
RESUME_STORAGE_BACKEND=local_fs
RESUME_STORAGE_DIR=.local/resumes
```

Em staging/producao, prefira `GMAIL_OAUTH_CLIENT_CONFIG_JSON` como secret do ambiente. O token OAuth
concedido apos login fica no PostgreSQL em `sending_provider_accounts.token_json`, e PDFs de curriculo
enviados pelo app ficam em `resume_attachments.file_content`. `.local/` e apenas conveniencia de
desenvolvimento.

A extensao Plasmo consulta status/preview/aprovacao pela API, mas nunca recebe client secret, token
OAuth ou conteudo dos arquivos locais.

## Auth e Deploy

Antes de validar staging/producao, rode migrations e confirme registro/login com `/auth/register`,
`/auth/login` e `/auth/me`. Rotas operacionais exigem bearer token e retornam apenas dados do usuario
autenticado. Use os mesmos nomes de variaveis em todos os ambientes (`DATABASE_URL`,
`GMAIL_OAUTH_CLIENT_CONFIG_JSON`, `GMAIL_OAUTH_REDIRECT_URI`, `PLASMO_PUBLIC_API_BASE_URL` e variaveis
`AUTH_*`), sempre com valores especificos do ambiente.

Estado atual: o recorte de auth/ownership ja existe, mas ainda precisa de hardening final antes de
uso publicado: atualizar testes legados para bearer auth, revisar contrato OpenAPI, executar smoke de
dois usuarios, validar OAuth Gmail publicado e aprovar um envio real controlado pelo worker.
