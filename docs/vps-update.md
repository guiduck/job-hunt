# Atualizar Projeto Na VPS

Este guia e o passo a passo simples para atualizar o projeto na VPS.

Dados atuais:

- VPS: `216.158.236.156`
- usuario SSH: `root`
- pasta do projeto na VPS: `/srv/projects/job-hunt/job-hunt`
- branch de producao esperada: `master`

## Antes De Comecar

No seu computador, confirme que suas mudancas ja foram enviadas para o GitHub.

```bash
git status --short
git push
```

Se o push falhar por arquivo grande em `.next`, leia a secao "Corrigir Push Com Arquivos De Cache".

## Atualizar Codigo Na VPS

Entre na VPS:

```bash
ssh root@216.158.236.156
```

Entre na pasta do projeto:

```bash
cd /srv/projects/job-hunt/job-hunt
```

Veja se existe alguma alteracao local na VPS:

```bash
git status --short
```

Se aparecer alguma linha aqui, pare e confira antes de puxar codigo. A VPS normalmente deve estar
limpa.

Puxe a versao nova:

```bash
git pull origin master
```

## Subir/Atualizar Containers

Rode:

```bash
docker compose up -d --build
```

Isso baixa/recria os containers necessarios e inicia tudo em segundo plano.

O servico `web` roda o app Next.js freelance em modo producao dentro do Docker: instala dependencias,
gera Prisma Client, executa bootstrap idempotente, faz `next build` e serve com `next start` na porta
3000. Evite usar `next dev` na VPS; o modo dev/Turbopack e apenas para desenvolvimento local.

O inbox do WhatsApp tambem sobe `redis` e `whatsapp-realtime`. O Caddy deve encaminhar `/ws` para
`127.0.0.1:3001`; veja `docs/vps-proxy-and-domains.md`.

Para login Google no app web Freelance, mantenha `GOOGLE_AUTH_SUCCESS_REDIRECT_URL` para o fluxo
existente da API/extensao e configure a URL final do web em uma variavel separada:

```bash
FREELANCE_WEB_APP_BASE_URL=https://freelance.gfig.space
FREELANCE_AUTH_API_BASE_URL=http://api:8000
FREELANCE_GOOGLE_AUTH_SUCCESS_REDIRECT_URL=https://freelance.gfig.space/auth/google/callback
TWILIO_WEBHOOK_BASE_URL=https://freelance.gfig.space
```

## Bancos Separados

O projeto roda dois bancos Postgres no Docker:

- `postgres`: banco do fluxo full-time/API/worker, gerenciado por Alembic
- `freelance-postgres`: banco do web app freelance, gerenciado por Prisma

Isso existe porque o projeto tem dois sistemas no mesmo repositorio, mas eles nao devem controlar o
mesmo banco:

- API/worker/full-time usam SQLAlchemy + Alembic e conhecem tabelas como `opportunities`,
  `job_search_runs`, `job_search_candidates`, `users` e `send_requests`.
- Web app freelance usa Prisma e conhece apenas as tabelas do produto freelance, como
  `freelance_campaigns`, `freelance_leads`, `freelance_niches`, `prospecting_jobs` e
  `website_analyses`.

O problema que causou o incidente foi o Prisma apontando para o mesmo banco da API. Ao rodar
`prisma db push`, o Prisma tentou fazer o banco inteiro ficar igual ao schema dele. Como o schema
Prisma nao conhecia as tabelas full-time, ele removeu dados dessas tabelas.

Regra permanente:

- Nunca aponte o Prisma para o banco `postgres` da API.
- Nunca rode `npx prisma db push` na VPS.
- Em producao/VPS, use apenas `npx prisma migrate deploy` para Prisma.
- Se precisar de `db push`, use somente em ambiente descartavel/local e conferindo o `DATABASE_URL`.

## Variaveis De Ambiente Dos Bancos

No `.env.local` da VPS e no `.env.local` local, mantenha variaveis separadas para os dois bancos.

Banco da API/full-time:

```bash
POSTGRES_DB=scrapper_freelance
POSTGRES_USER=scrapper
POSTGRES_PASSWORD=<senha-da-api>
POSTGRES_PORT=5432
DATABASE_URL=postgresql+psycopg://scrapper:<senha-da-api>@localhost:5432/scrapper_freelance
```

Banco do freelance/Prisma:

```bash
FREELANCE_POSTGRES_DB=freelance_app
FREELANCE_POSTGRES_USER=scrapper
FREELANCE_POSTGRES_PASSWORD=<senha-do-freelance>
FREELANCE_POSTGRES_PORT=5433
FREELANCE_DATABASE_URL=postgresql://scrapper:<senha-do-freelance>@localhost:5433/freelance_app
```

Observacao: dentro do Docker Compose, `web` e `web-worker` recebem `DATABASE_URL` apontando para
`freelance-postgres:5432`. Fora do Docker, por exemplo rodando Next localmente direto na maquina,
use `apps/web/.env.local` com:

```bash
DATABASE_URL=postgresql://scrapper:<senha-do-freelance>@localhost:5433/freelance_app
```

Antes de migrations em producao, faca um backup:

```bash
mkdir -p /srv/backups/job-hunt
docker compose exec -T postgres pg_dump -U ${POSTGRES_USER:-scrapper} -d ${POSTGRES_DB:-scrapper_freelance} -Fc > /srv/backups/job-hunt/api_before_deploy_$(date +%Y%m%d_%H%M%S).dump
docker compose exec -T freelance-postgres pg_dump -U ${FREELANCE_POSTGRES_USER:-scrapper} -d ${FREELANCE_POSTGRES_DB:-freelance_app} -Fc > /srv/backups/job-hunt/freelance_before_deploy_$(date +%Y%m%d_%H%M%S).dump
```

## Rodar Migrations

### API FastAPI

No `docker-compose.yml` atual, o container `api` ja roda:

```bash
alembic upgrade head
```

Mesmo assim, se quiser rodar manualmente:

```bash
docker compose exec api alembic upgrade head
```

### Web Next.js / Prisma

Para aplicar migrations do Prisma no banco freelance da VPS:

```bash
docker compose exec web npx prisma migrate deploy
```

Para popular/atualizar seeds, como nichos e templates iniciais:

```bash
docker compose exec web npm run prisma:seed
```

Se o container `web` ainda estiver recriando ou nao estiver rodando, use:

```bash
docker compose run --rm web npx prisma migrate deploy
docker compose run --rm web npm run prisma:seed
```

Nao use `npx prisma db push` na VPS. Use apenas `migrate deploy`.

## Reiniciar Servicos

Depois das migrations:

```bash
docker compose restart api worker web web-worker whatsapp-realtime
```

Se algum servico nao existir na VPS ainda, rode apenas os que existem, ou rode:

```bash
docker compose up -d --build
```

## Conferir Se Esta Vivo

Veja os containers:

```bash
docker compose ps
```

Veja logs recentes:

```bash
docker compose logs --tail 100 api
docker compose logs --tail 100 web
docker compose logs --tail 100 web-worker
docker compose logs --tail 100 whatsapp-realtime
```

Se a API tiver rota publica de health:

```bash
curl http://localhost:8000/health
```

Se a web estiver na porta padrao:

```bash
curl http://localhost:3000
```

## Receita Curta

Quando tudo ja estiver configurado e voce so quiser atualizar:

```bash
ssh root@216.158.236.156
cd /srv/projects/job-hunt/job-hunt
git status --short
git pull origin master
docker compose up -d --build
docker compose exec api alembic upgrade head
docker compose exec web npx prisma migrate deploy
docker compose exec web npm run prisma:seed
docker compose restart api worker web web-worker whatsapp-realtime
docker compose ps
```

## Substituir Templates WhatsApp

Cadastre e aprove na Twilio os templates `primeiro_contato_site_v2` e
`first_contact_website_v2`, ambos com as 10 variaveis exibidas na pagina `/templates`.
Depois de receber os SIDs `HX...`, substitua os valores atuais no `.env.local` da VPS:

```dotenv
TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID=HX_PORTUGUES_ATUAL
TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID_EN=HX_INGLES_ATUAL
```

Atualize apenas os servicos do app Freelance, preservando os volumes nomeados:

```bash
cd /srv/projects/job-hunt/job-hunt
git status --short
git pull origin master
docker compose --env-file .env.local up -d --build web web-worker
docker compose --env-file .env.local ps
docker compose --env-file .env.local logs --tail 100 web web-worker
```

Nao ha migration para essa alteracao. Os dois valores sem sufixo representam os templates atuais
e substituem diretamente os SIDs anteriores.

## Corrigir Push Com Arquivos De Cache

Arquivos de `.next/`, `node_modules/`, `.turbo/`, `.plasmo/`, `*.tsbuildinfo` e caches parecidos nao
devem ir para o Git.

Se um commit ja colocou esses arquivos no Git, remova do indice sem apagar do computador:

```bash
git rm -r --cached apps/web/.next
git rm --cached apps/web/tsconfig.tsbuildinfo
git rm --cached apps/extension/tsconfig.tsbuildinfo
git add .gitignore docs/vps-update.md
git commit --amend --no-edit
git push -u origin 014-freelance-web-app
```

Se o branch ja tiver sido enviado antes e o GitHub pedir, use:

```bash
git push --force-with-lease -u origin 014-freelance-web-app
```
