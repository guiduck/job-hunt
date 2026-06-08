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

## Bancos Separados

O projeto roda dois bancos Postgres no Docker:

- `postgres`: banco do fluxo full-time/API/worker, gerenciado por Alembic
- `freelance-postgres`: banco do web app freelance, gerenciado por Prisma

Nunca aponte o Prisma para o banco `postgres` da API. Nunca rode `prisma db push` no banco da API.
O comando `prisma db push` pode apagar tabelas que nao existem no schema Prisma.

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

Nao use `npx prisma db push` na VPS. Use apenas `migrate deploy`.

## Reiniciar Servicos

Depois das migrations:

```bash
docker compose restart api worker web web-worker
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
docker compose restart api worker web web-worker
docker compose ps
```

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
