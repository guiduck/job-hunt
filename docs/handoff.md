# Handoff de Desenvolvimento

Este arquivo e o ponto rapido de retomada do projeto.

Objetivo: permitir que outra pessoa, outro usuario ou outro modelo entenda onde o trabalho parou
sem precisar reler toda a documentacao.

## Como usar

Atualize este arquivo sempre que houver mudanca relevante de rumo, conclusao de etapa ou troca de
contexto de trabalho.

Mantenha simples e direto.

## Estado atual

- `ultima_atualizacao`: 2026-04-28
- `fase_atual_roadmap`: Fase 1. Fundacao operacional, com proxima fase priorizando busca de empregos
- `etapa_atual_action_plan`: 1. Fundacao local, 2. Modelo central de oportunidades e 3. Bot 1 de busca de empregos
- `status_resumido`: documentacao atualizada para priorizar o fluxo `job`; a spec `002-linkedin-job-bot` agora tem plano, pesquisa, modelo de dados, contrato OpenAPI e quickstart para a fundacao local de dados e o primeiro bot automatizado de vagas no LinkedIn

## Ultimo prompt utilizado

```text
/speckit-plan
```

## Ultimas decisoes

- `freelance` e `job` sao trilhos de primeira classe
- `job` passa a ser a prioridade inicial de produto
- o primeiro bot de valor deve buscar publicacoes e anuncios de vagas no LinkedIn com email disponivel
- vagas capturadas devem ser listadas como leads com empresa, cargo, email, link, keywords e evidencia
- o sistema deve permitir envio individual ou em massa de templates de email com curriculo anexado
- o modo `Full-time Job` deve ter estados proprios como resposta e entrevista
- o bot de prospeccao freelance fica como etapa posterior
- `roadmap` continua como direcao estavel do produto
- este arquivo `handoff.md` passa a registrar o estado vivo da execucao
- scraping, enrichment e outreach longo devem ficar fora do processo HTTP
- a referencia visual confirma um fluxo operacional por lead com `demo_url`, prompt `Lovable` e mensagem por etapa
- `docs/reference-ui.md` passa a registrar o produto-alvo observado nas imagens
- `docs/product-modes.md` passa a definir `Full-time` e `Freelance` como dois modos/apps separados
- `docs/lovable-prompt-base.md` passa a servir como base para prompts de landing page
- `.cursor/skills/specify-prompt-engineer/SKILL.md` passa a ser a skill responsavel por estruturar pedidos simples antes dos principais comandos do Spec Kit
- `.cursor/rules/specify-rules.mdc` e as skills de `speckit.constitution`, `speckit.clarify`, `speckit.specify` e `speckit.plan` agora exigem essa etapa
- `specs/001-local-opportunity-foundation/spec.md` define a primeira feature formal do projeto
- `specs/001-local-opportunity-foundation/plan.md` define o plano tecnico da primeira feature
- `specs/001-local-opportunity-foundation/tasks.md` define 57 tarefas de implementacao organizadas por setup, fundacao e user stories
- o modelo inicial precisa suportar `freelance` e `job` como lanes separados em uma base compartilhada
- busca full-time job deve considerar vagas formais e posts publicos com e-mail, keywords configuradas e futuras keywords extraidas de CV
- keyword sets entram na primeira fundacao com fallback mock: `reactjs`, `typescript`, `nextjs`, `nodejs`
- `specs/002-linkedin-job-bot/spec.md` define o proximo recorte formal: fundacao local de dados e esqueleto inicial do bot de vagas no LinkedIn
- `specs/002-linkedin-job-bot/plan.md` define API para iniciar/inspecionar runs e worker separado para executar busca automatizada no LinkedIn
- o primeiro bot LinkedIn deve aceitar apenas oportunidades `job` com email ou canal publico de contato
- cada run automatizado deve inspecionar no maximo 50 candidatos e registrar status, contadores, cap e erros
- oportunidades aceitas precisam expor empresa, titulo/headline, descricao da vaga quando disponivel, contato, fonte, query, keywords e evidencia em campos estruturados

## Onde estamos agora

- `README.md` e `docs/` principais foram reescritos para alinhar produto, arquitetura e execucao
- `docs/` foram realinhados para priorizar busca de emprego antes de freelance
- `docs/bot-1-job-search.md` foi criado como referencia do primeiro bot de produto
- `docs/bot-1-scraper.md` agora representa o bot posterior de prospeccao freelance
- referencias visuais do produto foram convertidas em documentacao operacional
- o fluxo de engenharia de prompt para Spec Kit foi formalizado no projeto
- a primeira spec foi criada em `specs/001-local-opportunity-foundation/spec.md`
- o plano foi criado com `research.md`, `data-model.md`, `contracts/openapi.yaml` e `quickstart.md`
- as tasks foram criadas em `specs/001-local-opportunity-foundation/tasks.md`
- ainda nao existe registro de execucao tecnica em codigo
- a spec `002-linkedin-job-bot` foi clarificada e planejada com `research.md`, `data-model.md`, `contracts/openapi.yaml` e `quickstart.md`

## Proximo passo recomendado

1. manter a fundacao local de `specs/001-local-opportunity-foundation/tasks.md` como base tecnica
2. executar `/speckit-tasks` para `specs/002-linkedin-job-bot/plan.md`
3. gerar tarefas por user story para fundacao local, run backend-triggered e revisao de oportunidades `job`
4. manter envio de email, parsing de curriculo, UI completa e bot freelance fora deste recorte

## Bloqueios ou pendencias

- as tasks atuais cobrem a fundacao local, mas ainda nao cobrem todo o fluxo de envio de email com curriculo
- gerar tasks para `specs/002-linkedin-job-bot/plan.md` antes de implementar o esqueleto do bot

## Referencias rapidas

- `docs/roadmap.md`
- `docs/action-plan.md`
- `docs/architecture.md`
- `docs/product-modes.md`
- `docs/domain-model.md`
- `docs/bot-1-job-search.md`
- `.specify/memory/constitution.md`
- `specs/001-local-opportunity-foundation/spec.md`
- `specs/001-local-opportunity-foundation/plan.md`
- `specs/001-local-opportunity-foundation/tasks.md`
- `specs/002-linkedin-job-bot/spec.md`
- `specs/002-linkedin-job-bot/plan.md`
- `specs/002-linkedin-job-bot/data-model.md`
- `specs/002-linkedin-job-bot/contracts/openapi.yaml`
- `specs/002-linkedin-job-bot/quickstart.md`
