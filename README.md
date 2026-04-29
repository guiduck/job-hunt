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
- `docs/domain-model.md`
- `docs/bot-1-job-search.md`
- `docs/bot-1-scraper.md`
- `docs/search-improvements.md`
- `docs/roadmap.md`
- `docs/action-plan.md`
- `docs/handoff.md`
- `docs/reference-ui.md`
- `docs/lovable-prompt-base.md`
