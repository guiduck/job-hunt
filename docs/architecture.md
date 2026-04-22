# Arquitetura

## Stack base

- `FastAPI`
- `PostgreSQL`
- `Docker Compose`

## Componentes

### API

- CRUD de leads
- filtros
- regras de classificacao
- disparo de jobs

### Worker

- scraping
- deduplicacao
- enriquecimento
- envio de emails depois

### Banco

- leads
- interacoes
- eventos de email
- artefatos de IA depois

## Sobre front

No inicio, o sistema pode funcionar sem front.

Mas para estes fluxos um front simples passa a valer a pena:

- reter um lead com clique
- mudar status rapidamente
- agrupar leads
- revisar antes de enviar email

Entao a recomendacao passa a ser:

- sem `Next.js` no primeiro dia
- com uma `web` simples logo depois do scraper e do banco, se voce quiser operar leads manualmente

## Se houver web

`Next.js` continua sendo uma boa opcao para:

- painel interno
- mini CRM
- tela de leads
- area de IA

## Estrutura sugerida

```text
apps/
  api/
  worker/
  web/   # entra quando precisar
docs/
docker-compose.yml
```

## Deploy

Local:

- `Docker Compose` para `PostgreSQL`
- API e worker locais

Producao:

- `Render` para API e worker
- `Render Postgres` para banco
- `Vercel` para a web, se existir

## Regra pratica

Nao misturar scraping pesado com o processo HTTP da API.
