# Handoff de Desenvolvimento

Este arquivo e o ponto rapido de retomada do projeto.

Objetivo: permitir que outra pessoa, outro usuario ou outro modelo entenda onde o trabalho parou
sem precisar reler toda a documentacao.

## Como usar

Atualize este arquivo sempre que houver mudanca relevante de rumo, conclusao de etapa ou troca de
contexto de trabalho.

Mantenha simples e direto.

## Estado atual

- `ultima_atualizacao`: 2026-05-03
- `fase_atual_roadmap`: Fase 3. Revisao e envio para vagas
- `etapa_atual_action_plan`: 5. Envio de emails para vagas
- `status_resumido`: spec `007-user-auth-ownership-deploy` implementada em grande parte: auth email/senha, sessoes bearer revogaveis, reset de senha, `user_id` nos modelos/migration, rotas protegidas e owner-scoped, default local owner/backfill, provider/worker com ownership, extensao com login/register/logout/reset em browser-session storage e docs de deploy atualizados. Validacao focada passou; validacao completa ainda tem testes legados sem bearer token e um teste worker antigo de provider publico falhando.

## Ultimo prompt utilizado

```text
`/speckit-implement`
```

## Ultimas decisoes

- `freelance` e `job` sao trilhos de primeira classe
- `job` passa a ser a prioridade inicial de produto
- o primeiro bot de valor deve buscar publicacoes e anuncios de vagas no LinkedIn com email disponivel
- vagas capturadas devem ser listadas como leads com empresa, cargo, email, link, keywords e evidencia
- o sistema deve permitir envio individual ou em massa de emails reais com template e curriculo
  anexado, sempre apos preview/aprovacao humana e com eventos auditaveis
- o modo `Full-time Job` deve ter estados proprios como resposta e entrevista
- o bot de prospeccao freelance fica como etapa posterior
- o bot de prospeccao freelance deve seguir o metodo Google Maps/nicho/localidade do guia: achar
  negocios sem site, com apenas rede social ou site fraco, salvar evidencia, gerar prompt/demo Lovable
  e preparar primeiro contato/follow-up
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
- `specs/002-linkedin-job-bot/tasks.md` define 57 tarefas executaveis por fases e user stories para implementar o recorte
- o primeiro bot LinkedIn deve aceitar apenas oportunidades `job` com email ou canal publico de contato
- cada run automatizado deve inspecionar no maximo 50 candidatos e registrar status, contadores, cap e erros
- oportunidades aceitas precisam expor empresa, titulo/headline, descricao da vaga quando disponivel, contato, fonte, query, keywords e evidencia em campos estruturados
- a implementacao inicial criou `apps/api` e `apps/worker` com pytest passando para API e worker
- `specs/003-linkedin-search-provider/spec.md` define o proximo recorte formal: provider/fetcher real para coletar candidatos de vagas LinkedIn a partir de conteudo publico acessivel, URLs fornecidas ou conteudo publico fornecido pelo usuario
- a primeira versao do provider nao deve burlar login, bloqueio, rate limit ou controles de acesso; quando a coleta falhar ou vier vazia, a run deve registrar isso sem fabricar oportunidades
- o skeleton anterior continua como base para run lifecycle, parser, normalizer, persistencia, deduplicacao e revisao de oportunidades `job`
- `specs/003-linkedin-search-provider/plan.md` define a implementacao incremental: provider no worker, queries com `hiring`, `contratando`, `contratamos` + keywords, fontes fornecidas pelo usuario para validacao local e aceite por email publico ou DM explicita com link do perfil
- `specs/003-linkedin-search-provider/research.md`, `data-model.md`, `contracts/openapi.yaml` e `quickstart.md` foram gerados para guiar `/speckit-tasks`
- `specs/003-linkedin-search-provider/tasks.md` define 58 tarefas executaveis por setup, fundacao, tres user stories e polish para implementar o provider real
- a implementacao adicionou `apps/worker/app/services/linkedin_search_provider.py` com queries por `hiring`, `contratando`, `contratamos` + keywords, suporte a conteudo fornecido, fetching publico conservador e status de provider
- API e worker agora preservam metadados como `hiring_intent_terms`, `collection_source_type`, `provider_status`, `poster_profile_url` e `contact_priority`
- testes automatizados de API e worker passam quando rodados separadamente nos respectivos apps
- a task `T026` da spec `003` ficou pendente: o worker ainda precisa buscar runs `pending` no banco, executar provider/parser/normalizer e gravar candidatos/oportunidades end-to-end
- a validacao Docker/quickstart da spec `003` tambem ficou pendente: `T052`, `T056` e revisao final de contrato/schema `T057`
- `specs/004-linkedin-runs-e2e/spec.md` define o recorte incremental para transformar essas pendencias em um fluxo local completo e validavel
- `specs/004-linkedin-runs-e2e/plan.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml` e `quickstart.md` foram gerados para guiar task generation
- na clarificacao de `004`, runs presas em `running` apos restart do worker devem virar `failed/stale` sem retry automatico em v1
- a regra de aceite por LinkedIn nao deve depender de uma string fixa de DM; deve detectar convite explicito de contato em ingles/portugues como DM, direct message, inbox, message me, reach out, send CV/resume via LinkedIn, me chame, envie mensagem e equivalentes, ainda exigindo `poster_profile_url`
- `specs/004-linkedin-runs-e2e/tasks.md` define 70 tarefas executaveis por setup, fundacao, quatro user stories e polish para implementar o fluxo end-to-end
- a implementacao de `004` adicionou a migration `004_linkedin_runs_e2e`, tabela `linkedin_collection_inputs`, loop persistente/run-once do worker, persistencia end-to-end de candidatos/oportunidades, testes de lifecycle/falhas/deduplicacao/quickstart e Compose com API/worker/PostgreSQL
- testes completos passaram em 2026-04-30: `apps/api` com 29 passed e `apps/worker` com 25 passed
- validacao Docker real ficou pendente porque o ambiente atual nao tem Docker CLI disponivel (`docker: command not found`)
- nomes de containers do Compose foram ajustados para evitar confusao: API e banco sao compartilhados, o worker atual e especifico de vagas LinkedIn, e um futuro worker freelance deve ser separado
- a revisao de produto confirma que a implementacao atual e coerente como fundacao backend/worker para o prototipo: ela alimenta o modo `Full-time` com vagas, evidencia, keywords, contato, status e oportunidades `job`
- a lacuna frente ao prototipo esta na camada de revisao operacional: lista/detalhe `Full-time`, score de aderencia, notas, filtros, status de candidatura, template/curriculo e historico ainda nao existem como experiencia completa
- a IA nao deve substituir o fetch/provider; deve entrar como camada opcional pos-coleta para extrair campos, pontuar aderencia, explicar score e reduzir falso positivo, sempre validando JSON contra schemas e preservando fallback deterministico
- na clarificacao de `005`, score de aderencia e um inteiro 0-100; evidencia atual da vaga e a base principal, historico de review/aplicacao ajusta score quando houver oportunidades comparaveis, e `review_status` fica separado de `job_stage`
- a implementacao de `005` adicionou migration `005_job_review_intelligence`, campos review-ready em runs/candidates/job details, scoring deterministico, analyzer opcional com fallback, filtros de API, update de `review_status`/notas, sinais historicos e testes de contrato/integracao/unidade
- Docker Compose agora possui healthcheck da API e o worker espera a API saudavel para evitar corrida antes das migrations
- a busca publica anonima do LinkedIn retorna login wall para pesquisas uteis; o fluxo util agora deve usar `tools/linkedin_browser_collector.py` localmente, com Playwright, perfil persistente `.local/` e login feito pelo proprio operador no navegador
- runs de coleta autenticada usam `collection_source_types=["authenticated_browser_search"]` e nao disparam busca publica anonima junto
- o provider publico foi ajustado para usar `sortBy=date_posted` e detectar login wall como `blocked/login_required`
- a extensao Plasmo em `apps/extension` usa `PLASMO_PUBLIC_API_BASE_URL` para apontar para API local agora e homologacao/producao depois
- a extensao abre busca de conteudo do LinkedIn ordenada por recentes, captura posts visiveis com content script e cria runs `authenticated_browser_search` diretamente na API
- keywords deixaram de ser criterio eliminatorio para salvar oportunidade; agora pesam no score, mas
  uma vaga pode entrar no banco se a busca/contexto do LinkedIn indicar aderencia suficiente
- a extensao Plasmo agora e considerada a primeira UI operacional local do modo `Full-time`, antes de
  qualquer web `Next.js`
- o envio de email deve usar provider backend/worker, preferencialmente Gmail API/OAuth no primeiro
  recorte, sem segredos embutidos na extensao
- envio em massa deve ter confirmacao, controles futuros por plano/assinatura, skip de oportunidades sem email ou ja enviadas, e um
  evento por destinatario
- na clarificacao de `006`, curriculo e sempre opcional, mas candidatura sem CV deve exibir aviso;
  novos previews usam o ultimo CV enviado nas configuracoes do usuario quando disponivel
- na clarificacao de `006`, Gmail/OAuth real e obrigatorio no v1; sender mock/local nao satisfaz o
  recorte de envio real
- na clarificacao de `006`, uma oportunidade com `job_application` enviada com sucesso bloqueia nova
  candidatura duplicada; contato posterior deve usar `job_follow_up`
- a implementacao de `006` manteve Gmail API/OAuth como provider v1; o client secret vem de
  `GMAIL_OAUTH_CLIENT_CONFIG_JSON` ou `GMAIL_OAUTH_CLIENT_SECRETS_FILE`, e o token OAuth fica no
  PostgreSQL em `sending_provider_accounts.token_json`
- curriculos enviados pelo app ficam no PostgreSQL em `resume_attachments.file_content`, com
  metadata/default resume tambem no banco
- `.local/` nao e storage de producao; ela serve para perfil Playwright, logs e arquivos locais
  opcionais como `client_secret.json` durante desenvolvimento
- limites globais de email/candidatos por env foram removidos; limites futuros devem ser regras de
  produto por plano/assinatura do usuario
- o produto nao tera times/workspaces no primeiro ciclo; cada conta e um usuario individual com email
  e senha, e assinaturas futuras pertencem ao usuario
- antes de deploy real, settings, curriculos, templates, provider Gmail, runs, oportunidades, drafts,
  envios, bulk batches e eventos precisam ser associados a `user_id`
- validacoes em 2026-05-03: `apps/api pytest` 62 passed; `apps/extension npm run typecheck`
  passed; testes focados de email do worker passed; suite completa do worker ficou com 44 passed e 1
  falha no teste existente `test_linkedin_provider_collection.py` (`blocked_source` vs `accepted`)
- `.specify/memory/constitution.md` foi atualizado para versao `1.1.0`, formalizando extensao
  local-first, envio aprovado/evented/rate-limited e compatibilidade com Google Maps freelance

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
- existe implementacao tecnica inicial em `apps/api` e `apps/worker`
- a spec `002-linkedin-job-bot` foi clarificada, planejada, quebrada em tasks e parcialmente implementada com testes automatizados passando
- a spec `003-linkedin-search-provider` foi criada como incremento para transformar o skeleton em coleta real ou fornecida pelo usuario; o limite fixo inicial de 50 candidatos por run foi removido depois, mantendo aceite somente para oportunidades com email ou canal publico
- a spec `003-linkedin-search-provider` foi clarificada e planejada; os artefatos de pesquisa, modelo, contrato e quickstart estao prontos para task generation
- as tasks de `003-linkedin-search-provider` foram geradas e estao prontas para `/speckit-implement`
- parte principal de `003-linkedin-search-provider` foi implementada com cobertura de provider, parser, normalizer, persistencia, deduplicacao e falhas
- o provider real esta conectado ao loop persistente do worker para processar runs criadas pela API no PostgreSQL local, incluindo fontes fornecidas, aceite por email/LinkedIn explicito, dedupe, provider failures e stale running recovery
- `references/opportunity-desk-pro` mostra que a proxima entrega de produto deve aproximar o backend da tela `Full-time`: lista de vagas, detalhe com evidencia, score, curriculo/template, status e acoes humanas de candidatura
- `specs/005-job-review-intelligence/spec.md` define o proximo recorte incremental: oportunidades `Full-time` review-ready com score, filtros operacionais, status de analise e analise opcional por IA com fallback deterministico
- `specs/005-job-review-intelligence/plan.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml` e `quickstart.md` foram gerados para guiar `/speckit-tasks`
- `specs/005-job-review-intelligence/tasks.md` esta majoritariamente concluido com setup, fundacao, US1, US2, US3, ajuste historico e validacoes automatizadas/Docker marcados
- `docs/next-spec-prompt.md` foi atualizado com um prompt estruturado para formalizar a spec
  de login email/senha, ownership por `user_id`, prontidao de deploy, configuracao por ambiente,
  OAuth secrets, storage e validacao em Render
- `specs/007-user-auth-ownership-deploy/spec.md` foi criada para formalizar esse recorte com
  historias de usuario, requisitos de ownership, configuracao segura, extensao autenticada,
  validacao publicada e checklist de qualidade sem pendencias de clarificacao
- `specs/007-user-auth-ownership-deploy/plan.md`, `research.md`, `data-model.md`,
  `contracts/openapi.yaml` e `quickstart.md` foram gerados para guiar `/speckit-tasks`;
  decisoes principais: signup aberto em todos ambientes, sessao da extensao ate restart do browser,
  sem verificacao de email no MVP, reset de senha user-facing e mesmos nomes de env vars com valores
  especificos por ambiente
- `specs/007-user-auth-ownership-deploy/tasks.md` foi gerado com 112 tarefas executaveis: setup,
  fundacao, US1 auth/ownership MVP, US2 backfill local, US3 deploy/worker/config e US4 login state da
  extensao, alem de validacoes finais
- `specs/006-full-time-email-sending/spec.md` foi criada e clarificada para templates `Full-time`,
  settings do usuario, curriculos opcionais, preview/draft, envio real Gmail/OAuth, envio em massa
  conservador e historico auditavel
- `specs/006-full-time-email-sending/plan.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`
  e `quickstart.md` foram gerados para guiar `/speckit-tasks`
- `specs/006-full-time-email-sending/tasks.md` foi implementado ate os fluxos principais de setup,
  fundacao, US1 templates, US2 envio individual, US3 settings/curriculos, US4 bulk send, US5
  historico e validacoes principais
- `apps/extension` contem o MVP Plasmo com popup mobile, dashboard, captura por keywords, lista/filtros de vagas e detalhe com atualizacao de review/status/notas
- a documentacao foi realinhada para tratar Google Maps como a primeira fonte planejada do futuro
  bot `Freelance`
- `docs/deployment-config-and-storage.md` registra o que fica no banco, o que fica em secrets de
  ambiente e o papel limitado de `.local/`
- `docs/current-state-review.md` registra a revisao contra o prototipo, referencias visuais, guia
  freelance, riscos atuais e proxima spec recomendada
- `docs/auth-and-ownership.md` registra a decisao de usuarios individuais, login email/senha,
  ausencia de workspace/time no MVP e recursos que devem receber `user_id`

## Revisao de coerencia com prototipo

- Coerente: separacao `job`/`freelance`, API compartilhada, worker fora do HTTP, persistencia estruturada, evidencia, keywords, provider status e accepted opportunities `job`.
- Coerente: o fluxo atual alimenta a lista `Full-time / Vagas` do prototipo, porque ja possui empresa/cargo/headline, contato, fonte, evidencia, matched keywords e status de run/candidato.
- Ajustado: Compose agora usa nomes neutros (`opportunity_desk_api`, `opportunity_desk_linkedin_job_worker`) para nao sugerir que a API pertence apenas ao modo freelance.
- Coerente: a camada de review intelligence cobre score explicavel, status de revisao, filtros operacionais, analysis status e fallback deterministico para o modo `Full-time`.
- Coerente: o fluxo de candidatura do prototipo ja cobre curriculo selecionado, templates,
  preview/draft, envio real pelo provider e historico inicial por vaga.
- Gap: ainda falta tracking operacional completo de resposta, entrevista, rejeicao, ignorado e
  follow-up, alem de dashboard/campanhas/lista/detalhe mais proximos da web de referencia.
- Coerente: o proximo recorte deve ser login/ownership/prontidao de deploy, nao Google Maps, porque
  o fluxo `Full-time` local ja esta util e agora precisa funcionar fora do localhost sem misturar
  dados de usuarios e sem depender de `.local/`.
- Coerente: Google Maps freelance continua no roadmap seguinte, baseado no guia de busca manual por
  nicho/cidade, ausencia de website, rede social como site e checklist de site ruim.

## Proximo passo recomendado

1. implementar `specs/007-user-auth-ownership-deploy/tasks.md` com `/speckit-implement`
2. validar login email/senha, reset de senha, `current_user` e `user_id` nos dados operacionais
3. validar Gmail/OAuth em ambiente publicado com `GMAIL_OAUTH_CLIENT_CONFIG_JSON` e redirect URI
   publica cadastrada no Google Cloud
4. validar um envio real controlado com vaga de teste e curriculo enviado pelo endpoint de upload
5. investigar a falha existente do teste de provider LinkedIn (`blocked_source` vs `accepted`) antes
   de considerar a suite completa do worker totalmente verde

## Bloqueios ou pendencias

- o fluxo de email esta implementado, mas envio Gmail real ainda depende de configuracao OAuth e teste
  manual com conta Gmail; para deploy, preferir `GMAIL_OAUTH_CLIENT_CONFIG_JSON` em secret de ambiente
- Compose validado em 2026-05-01: `docker compose config`, `docker compose up -d`, API healthy, worker running e quickstart supplied-content com oportunidade review-ready
- busca publica do LinkedIn pode retornar bloqueio/login/rate limit; para dados reais, usar o coletor local autenticado com Playwright e calibrar DOM/selectors com a sessao logada do operador
- suite completa do worker ainda falha em 1 teste de coleta LinkedIn fora do caminho de email
- ainda nao ha bot Google Maps freelance, analise de site, prompt Lovable gerado por lead ou templates
  comerciais implementados
- a extensao depende do DOM atual do LinkedIn e pode precisar de ajuste de seletores com dados reais

## Proximo prompt recomendado

```text
Use `specs/007-user-auth-ownership-deploy/tasks.md` com `/speckit-implement` para implementar login
email/senha, reset de senha, ownership por usuario, configuracao por ambiente, OAuth secrets, storage
e validacao em ambiente publicado.
```

## Referencias rapidas

- `docs/roadmap.md`
- `docs/action-plan.md`
- `docs/architecture.md`
- `docs/auth-and-ownership.md`
- `docs/deployment-config-and-storage.md`
- `docs/current-state-review.md`
- `docs/next-spec-prompt.md`
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
- `specs/002-linkedin-job-bot/tasks.md`
- `specs/003-linkedin-search-provider/spec.md`
- `specs/003-linkedin-search-provider/plan.md`
- `specs/003-linkedin-search-provider/research.md`
- `specs/003-linkedin-search-provider/data-model.md`
- `specs/003-linkedin-search-provider/contracts/openapi.yaml`
- `specs/003-linkedin-search-provider/quickstart.md`
- `specs/003-linkedin-search-provider/tasks.md`
- `specs/004-linkedin-runs-e2e/spec.md`
- `specs/004-linkedin-runs-e2e/checklists/requirements.md`
- `specs/004-linkedin-runs-e2e/plan.md`
- `specs/004-linkedin-runs-e2e/research.md`
- `specs/004-linkedin-runs-e2e/data-model.md`
- `specs/004-linkedin-runs-e2e/contracts/openapi.yaml`
- `specs/004-linkedin-runs-e2e/quickstart.md`
- `specs/004-linkedin-runs-e2e/tasks.md`
- `specs/005-job-review-intelligence/spec.md`
- `specs/005-job-review-intelligence/plan.md`
- `specs/005-job-review-intelligence/research.md`
- `specs/005-job-review-intelligence/data-model.md`
- `specs/005-job-review-intelligence/contracts/openapi.yaml`
- `specs/005-job-review-intelligence/quickstart.md`
- `specs/005-job-review-intelligence/tasks.md`
- `specs/006-full-time-email-sending/spec.md`
- `specs/006-full-time-email-sending/plan.md`
- `specs/006-full-time-email-sending/research.md`
- `specs/006-full-time-email-sending/data-model.md`
- `specs/006-full-time-email-sending/contracts/openapi.yaml`
- `specs/006-full-time-email-sending/quickstart.md`
- `specs/006-full-time-email-sending/tasks.md`
- `specs/007-user-auth-ownership-deploy/spec.md`
- `specs/007-user-auth-ownership-deploy/plan.md`
- `specs/007-user-auth-ownership-deploy/research.md`
- `specs/007-user-auth-ownership-deploy/data-model.md`
- `specs/007-user-auth-ownership-deploy/contracts/openapi.yaml`
- `specs/007-user-auth-ownership-deploy/quickstart.md`
- `specs/007-user-auth-ownership-deploy/tasks.md`
