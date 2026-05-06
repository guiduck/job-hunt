# Handoff de Desenvolvimento

Este arquivo e o ponto rapido de retomada do projeto.

Objetivo: permitir que outra pessoa, outro usuario ou outro modelo entenda onde o trabalho parou
sem precisar reler toda a documentacao.

## Como usar

Atualize este arquivo sempre que houver mudanca relevante de rumo, conclusao de etapa ou troca de
contexto de trabalho.

Mantenha simples e direto.

## Estado atual

- `ultima_atualizacao`: 2026-05-06
- `fase_atual_roadmap`: Fase 3/3.5. Full-time operacional + filtros inteligentes pos-captura
- `etapa_atual_action_plan`: Full-time local MVP implementado; proximo recorte recomendado e hardening/validacao operacional antes de abrir Fase 4 Freelance
- `status_resumido`: a extensao Plasmo ja opera o fluxo `Full-time` local com login persistente, captura autenticada de posts do LinkedIn, listagem/detalhe de vagas, delete individual/bulk, templates, curriculos, Gmail OAuth, envio individual, bulk send revisavel com IA e busca LinkedIn simplificada com filtros opcionais por IA pos-captura. O bulk AI usa `OPENAI_API_KEY` apenas no backend, PDF do curriculo como fonte de verdade, template como referencia, idioma detectado do post, portfolio URL, revisao/edicao/skip por item e botao `SEND` para criar requests normais de envio via Gmail/worker. A camada `008` adicionou campos/counters de AI filters, provider OpenAI compativel no worker, fallback deterministico, diagnosticos e testes focados. Em 2026-05-06, o campo `Exclude keywords` foi removido da UI/contrato/payload; a IA passou a avaliar texto completo com contexto de curriculo/perfil, rejeitar posts de pessoas procurando emprego e considerar remoto/regiao com mais nuance. O content script tambem passou a acionar controle visivel de mais resultados quando a lista para de carregar durante uma captura iniciada pelo usuario. O proximo recorte recomendado nao e produto novo: e estabilizar validacao manual, auth/deploy, contratos e feedback pos-envio para poder seguir com seguranca para `Freelance` Google Maps/Lovable.

## Ultimo prompt utilizado

```text
Atualizar docs e handoff depois dos ajustes de LinkedIn AI filters, e preparar com prompt engineering o prompt da proxima spec para `/speckit-specify`.
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
- `AGENTS.md`, `CODEX.md` e `.codex/skills/` adicionam compatibilidade com Codex sem remover o fluxo Cursor existente
- a extensao Plasmo e a UI operacional atual do modo `Full-time`; antes de criar uma web Next.js, o produto esta sendo validado dentro do popup/local browser
- login email/senha, sessoes bearer, auth persistente na extensao, owner scoping por `user_id`, Gmail OAuth e curriculos/templates por usuario ja existem no caminho principal
- envio individual pela tela de detalhe deve continuar permitindo duplicatas quando acionado manualmente, mas envio em massa deve continuar bloqueando/skipping duplicatas de `job_application`
- secrets de IA/GPT nunca devem ficar na extensao; `OPENAI_API_KEY` e modelo devem ser configurados no backend/worker via `.env.local`/secrets de ambiente
- mensagens geradas por IA para candidatura devem ser revisadas/editaveis antes do envio real e nao devem inventar experiencia, dados da empresa ou detalhes da vaga
- bulk AI deve usar o curriculo PDF como fonte de verdade, template apenas como referencia de tom/estrutura, detectar idioma original do job post e escrever a mensagem nesse idioma
- o botao final do bulk email deve ser apresentado como `SEND`; apos clique, a UI deve comunicar que emails foram submetidos para entrega Gmail/worker e que o status final deve ser conferido no historico
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
- `docs/next-spec-prompt.md` foi atualizado com um prompt estruturado para o proximo recorte de
  produto: bulk send com IA, floating send, portfolio URL, geracao por vaga, revisao/edicao
  individual, curriculo anexado e aprovacao humana antes do envio real
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
- `specs/007-user-auth-ownership-deploy/tasks.md` foi implementado ate US1-US4 e parte do polish:
  auth/ownership/deploy/extensao estao presentes, mas T102, T103, T105, T107, T108, T109 e T110
  continuam pendentes por exigir atualizacao ampla de testes legados, quickstart/smoke real e revisao
  de contrato
- `specs/006-full-time-email-sending/spec.md` foi criada e clarificada para templates `Full-time`,
  settings do usuario, curriculos opcionais, preview/draft, envio real Gmail/OAuth, envio em massa
  conservador e historico auditavel
- `specs/006-full-time-email-sending/plan.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`
  e `quickstart.md` foram gerados para guiar `/speckit-tasks`
- `specs/006-full-time-email-sending/tasks.md` foi implementado ate os fluxos principais de setup,
  fundacao, US1 templates, US2 envio individual, US3 settings/curriculos, US4 bulk send, US5
  historico e validacoes principais
- `apps/extension` contem o MVP Plasmo com popup mobile, dashboard, captura por keywords, lista/filtros de vagas e detalhe com atualizacao de review/status/notas
- desde 2026-05-05, o MVP da extensao tambem inclui: login persistente via `chrome.storage.local`, logs de auth/API/captura, preview de PDF com fetch autenticado, conexao/desconexao Google condicional, escolha de template e curriculo no envio individual, edicao do email destinatario antes do envio, feedback de falha/sucesso, lixeira individual, lixeira flutuante para selecionados, delete por status enviado/nao enviado, ordenacao por coleta recente/antiga, popup maior e edicao de templates existentes
- a captura LinkedIn agora abre a URL com a string normal de busca, captura de forma ampla e envia apenas filtros opcionais de IA quando habilitados; `Exclude keywords` saiu da UI, store, payload, API schema e worker settings
- o content script para de scrollar antes do limite quando nao encontra novos posts nem aumento de pagina por timeout, evitando esperar ate `maxScrolls` quando acabaram as publicacoes; quando aparece um controle visivel de mais resultados, ele tenta acionar esse controle e registra diagnosticos
- o envio individual usa Gmail pela API imediatamente e o worker como processador de fila/fallback; a corrida que enviava emails duplicados foi mitigada marcando requests como `sending` antes do envio e fazendo o worker reclamar apenas requests `approved/queued`
- parser de emails do LinkedIn foi endurecido para cortar ruido colado antes/depois de emails, incluindo hashtags e textos grudados em TLDs comuns; dados existentes foram parcialmente normalizados em banco durante validacao local
- `docs/next-spec-prompt.md` agora descreve o recorte de filtros por IA na busca: manter LinkedIn search apenas com texto/ordenacao e avaliar remoto/onsite/regioes/exclusoes depois da captura
- desde 2026-05-05, o bulk send com IA foi implementado no caminho local: `portfolio_url`,
  configuracao `OPENAI_API_KEY`/`AI_EMAIL_MODEL`, geracao por vaga, tratamento estruturado de erros
  OpenAI, extracao de texto de PDF com `pypdf`, template reference, deteccao simples de idioma do post
  (`English`, `Spanish`, `Portuguese`), revisao/edicao/skip e botao `SEND`
- o proximo recorte recomendado mudou para filtros de busca por IA: a tela Search deve manter apenas
  texto/query e ordenacao como parametros da busca LinkedIn, enquanto remoto/onsite/regiao/exclusoes
  devem virar filtros opcionais avaliados por IA depois da captura
- a documentacao foi realinhada para tratar Google Maps como a primeira fonte planejada do futuro
  bot `Freelance`
- `docs/deployment-config-and-storage.md` registra o que fica no banco, o que fica em secrets de
  ambiente e o papel limitado de `.local/`
- `docs/current-state-review.md` registra a revisao contra o prototipo, referencias visuais, guia
  freelance, riscos atuais e proxima spec recomendada
- `docs/auth-and-ownership.md` registra a decisao de usuarios individuais, login email/senha,
  ausencia de workspace/time no MVP e recursos que devem receber `user_id`
- `specs/008-linkedin-ai-filters/spec.md` foi criada com `/speckit-specify` para formalizar o
  proximo recorte: Search simples no LinkedIn, filtros opcionais por IA pos-captura, fallback
  deterministico, counters de run/candidato e preservacao de ownership/evidencias
- `specs/008-linkedin-ai-filters/plan.md`, `research.md`, `data-model.md`,
  `contracts/openapi.yaml` e `quickstart.md` foram gerados com `/speckit-plan`; decisoes principais:
  filtros de IA desligados por padrao, fallback para regras deterministicas quando IA falhar ou
  confianca ficar abaixo de `0.70`, status de filtro separado de `analysis_status`, e avaliacao no
  worker depois da captura/parser antes da criacao de oportunidade
- `specs/008-linkedin-ai-filters/tasks.md` foi gerado com 89 tarefas executaveis: setup,
  fundacao, US1 busca ampla no LinkedIn, US2 filtros opcionais por IA pos-captura, US3 diagnosticos
  de counters/fallback/ownership e polish
- `/speckit-implement` iniciou a implementacao de `008`: foram adicionados migration/campos
  aditivos para runs/candidates, schemas/contratos API, worker `job_ai_filter`, integracao do worker
  antes da criacao de oportunidade, Search UI separada entre `LinkedIn search` e `AI filters`,
  captura ampla sem pre-filtro na extensao, payload opcional de filtros, counters/diagnosticos e
  testes focados de API/worker/typecheck
- validacoes focadas de `008` passaram em 2026-05-05: API AI filters `15 passed`, worker AI filters
  `12 passed`, extension `npm run typecheck` passed; testes legados focados de job-search API/worker
  tambem passaram
- ajuste pos-implementacao em 2026-05-06 removeu `Exclude keywords` como filtro explicito e
  recalibrou a IA para avaliar posts como revisor humano usando texto completo, busca, contexto de
  curriculo/perfil, remoto/regioes e classificacao de tipo de autor/post; posts de pessoas procurando
  emprego sao rejeitados mesmo quando a IA retorna aprovacao
- validacoes focadas apos esse ajuste passaram em 2026-05-06: API AI filters `6 passed`, worker AI
  filters `15 passed` e `apps/extension npm run typecheck` passed; API e worker foram reiniciados
  localmente depois da validacao
- `docs/next-spec-prompt.md` agora contem o prompt estruturado para `/speckit-specify` da proxima
  spec recomendada: hardening operacional do `Full-time` MVP antes de iniciar a fase `Freelance`
  Google Maps/Lovable

## Revisao de coerencia com prototipo

- Coerente: separacao `job`/`freelance`, API compartilhada, worker fora do HTTP, persistencia estruturada, evidencia, keywords, provider status e accepted opportunities `job`.
- Coerente: o fluxo atual alimenta a lista `Full-time / Vagas` do prototipo, porque ja possui empresa/cargo/headline, contato, fonte, evidencia, matched keywords e status de run/candidato.
- Ajustado: Compose agora usa nomes neutros (`opportunity_desk_api`, `opportunity_desk_linkedin_job_worker`) para nao sugerir que a API pertence apenas ao modo freelance.
- Coerente: a camada de review intelligence cobre score explicavel, status de revisao, filtros operacionais, analysis status e fallback deterministico para o modo `Full-time`.
- Coerente: o fluxo de candidatura do prototipo ja cobre curriculo selecionado, templates,
  preview/draft, envio real pelo provider e historico inicial por vaga.
- Gap: ainda falta tracking operacional completo de resposta, entrevista, rejeicao, ignorado e
  follow-up, alem de dashboard/campanhas/lista/detalhe mais proximos da web de referencia.
- Atualizado: o proximo recorte recomendado deve ser uma spec de hardening/validacao operacional do
  `Full-time` local MVP, cobrindo smoke real da extensao, auth/ownership, contratos, deploy/OAuth e
  feedback pos-envio. Depois disso, o proximo salto de produto volta a ser `Freelance` Google
  Maps/Lovable.
- Coerente: Google Maps freelance continua no roadmap seguinte, baseado no guia de busca manual por
  nicho/cidade, ausencia de website, rede social como site e checklist de site ruim.

## Proximo passo recomendado

1. rodar `/speckit-specify` usando `docs/next-spec-prompt.md`
2. criar a spec de hardening operacional do `Full-time` MVP
3. validar manualmente o quickstart restante de `008` com LinkedIn real, AI filters, controle de mais
   resultados e revisao dos motivos/sinais do modelo
4. fechar testes legados/auth, revisao OpenAPI, smoke dois usuarios, OAuth publicado e feedback
   pos-envio ate status final `sent/failed`
5. depois dessa estabilizacao, criar a proxima spec de produto para `Freelance` Google Maps/Lovable

## Bloqueios ou pendencias

- o fluxo de email esta implementado, mas envio Gmail real ainda depende de configuracao OAuth e teste
  manual com conta Gmail; para deploy, preferir `GMAIL_OAUTH_CLIENT_CONFIG_JSON` em secret de ambiente
- Compose validado em 2026-05-01: `docker compose config`, `docker compose up -d`, API healthy, worker running e quickstart supplied-content com oportunidade review-ready
- busca publica do LinkedIn pode retornar bloqueio/login/rate limit; para dados reais, usar o coletor local autenticado com Playwright e calibrar DOM/selectors com a sessao logada do operador
- suite completa do worker ainda falha em 1 teste de coleta LinkedIn fora do caminho de email
- suite completa de API ainda tem testes legados sem bearer token depois da introducao de auth
- feedback de bulk send ainda mostra submissao para fila Gmail/worker; falta uma UX que acompanhe ate
  status final `sent/failed` por item sem exigir abrir historico manualmente
- a implementacao de `008` ainda precisa de polish/manual: validar provider real com `OPENAI_API_KEY`
  em ambiente local, executar smoke da extensao contra LinkedIn real, revisar outputs do modelo,
  confirmar rejeicao de posts de pessoas procurando emprego, observar o controle de mais resultados e
  limpar/organizar a branch antes de merge
- ainda nao ha bot Google Maps freelance, analise de site, prompt Lovable gerado por lead ou templates
  comerciais implementados
- a extensao depende do DOM atual do LinkedIn e pode precisar de ajuste de seletores com dados reais

## Proximo prompt recomendado

```text
Use `docs/next-spec-prompt.md` with `/speckit-specify` to create the next feature spec:
Full-time operational hardening and published validation before starting the `Freelance` Google
Maps/Lovable lane.
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
- `specs/008-linkedin-ai-filters/spec.md`
- `specs/008-linkedin-ai-filters/plan.md`
- `specs/008-linkedin-ai-filters/research.md`
- `specs/008-linkedin-ai-filters/data-model.md`
- `specs/008-linkedin-ai-filters/contracts/openapi.yaml`
- `specs/008-linkedin-ai-filters/quickstart.md`
- `specs/008-linkedin-ai-filters/tasks.md`
