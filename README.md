# Scrapper Freelance API

Plataforma pessoal para encontrar pequenos negocios sem site, salvar leads, agrupar oportunidades, enviar emails e apoiar propostas comerciais.

## Escopo

Primeiro objetivo:

- buscar empresas locais
- identificar negocios sem website
- salvar leads no `PostgreSQL`
- agrupar e revisar leads
- preparar o envio de emails

Expansoes depois:

- mini CRM
- tracking de outreach
- area de IA para gerar mega prompt para `Lovable`

## Decisoes atuais

- backend em `FastAPI`
- banco em `PostgreSQL`
- ambiente local com `Docker Compose`
- deploy da API e banco no `Render`
- `Next.js` so quando a interface manual de leads e emails justificar

## Quando entra front

Para o scraper puro, nao precisa.

Para agrupar leads, mudar status por clique e disparar emails com controle manual, um front simples ou painel admin passa a valer a pena cedo.

## Documentacao

- `docs/overview.md`
- `docs/bot-1-scraper.md`
- `docs/search-improvements.md`
- `docs/architecture.md`
- `docs/domain-model.md`
- `docs/roadmap.md`
- `docs/action-plan.md`
