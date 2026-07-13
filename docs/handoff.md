# Handoff

## Atualizacao De Processo

- `agent_sdd_boilerplate`: criado em `references/agent-sdd-boilerplate/` como kit reutilizavel para
  novos projetos com Cursor + Codex + Spec Kit + Lovable. O pacote inclui `AGENTS.md`, `CODEX.md`,
  rule always-on do Cursor, skills canonicas em `.cursor/skills`, mirrors em `.codex/skills`,
  overlays para os comandos principais do Spec Kit, templates de docs e templates Lovable.
- `validacao_boilerplate`: estrutura verificada com `rg --hidden --files
  references\agent-sdd-boilerplate` e checagem PowerShell de frontmatter em todos os `SKILL.md`.
  `quick_validate.py` foi tentado, mas o ambiente local nao tinha `python` no PATH e o runtime
  embutido nao tinha `PyYAML`; a validacao formal deve ser repetida em um ambiente Python com
  dependencia YAML instalada.

## Status Atual

- `fase_atual_roadmap`: Fase 4.5 `Outreach Freelance Em Massa` concluida, com novo recorte ativo de fine tuning no produto `Full-time`
- `etapa_atual_action_plan`: `specs/017-extension-search-history/spec.md` criada para historico de buscas LinkedIn na extensao; proximo passo recomendado e `/speckit-plan`
- `tasks_ativo_spec_kit`: ainda nao gerado para `017`; spec ativa em `specs/017-extension-search-history/spec.md`
- `hotfix_local_freelance_db`: em 2026-06-09, `apps/web/scripts/bootstrap-db.ts` passou a aplicar a
  migration `20260609000100_niche_catalog_governance` quando um banco local antigo ja tem as tabelas
  freelance iniciais mas ainda nao possui `freelance_niches.display_name`. O bootstrap tambem atualiza
  os campos novos do seed de nichos, corrigindo falhas em Leads, Campanhas e Configuracoes apos
  rodar `cd apps/web && npm.cmd run db:bootstrap`.
- `nicho_igrejas`: em 2026-06-09, `Igrejas` foi seedado e aplicado no banco local como nicho BR
  enabled/approved, com `conversion_hint=12.0`, `conversion_hint_source=operator_override`, aliases
  para igreja evangelica/catolica/paroquia e source note focada em sites CMS/admin para postagens,
  eventos, calendario, carousel de imagens e comunicacao comunitaria.
- `localidades_campanha`: em 2026-06-10, o modal de criar campanha ganhou autocomplete scrollavel de
  estado/cidade. BR usa IBGE Localidades para UF/municipios e ViaCEP para preencher UF/cidade/bairro a
  partir de CEP. Internacional usa estados dos EUA com tentativa de Census ACS places e fallback local
  de cidades principais quando a fonte externa devolve erro/HTML.
- `prospeccao_provider_real`: em 2026-06-10, corrigido o botao Prospect para respeitar
  `campaign.searchSettings.maxResults` em vez de enviar sempre `25`, mostrar o ultimo job no card,
  pollar `/api/freelance/prospecting-jobs/{jobId}` apos iniciar e exibir status/step/contadores/erro
  do provider. O worker local agora carrega `.env.local` antes do Prisma, entao `npm.cmd run worker`
  usa o banco freelance em `localhost:5433`. Provider real continua exigindo `web-worker` rodando; sem
  ele, jobs SerpApi/Apify ficam em `pending/queued`.
- `campanhas_prospeccao_polish`: em 2026-06-10, o botao Prospect passou a criar jobs pela rota plana
  `POST /api/freelance/prospecting-jobs`, enviando `campaignId` no corpo para evitar 404/HTML da rota
  aninhada no dev server. A tela de campanhas tambem recebeu largura maior, cards com altura completa,
  `View leads` sem quebra de linha e painel de status do job ocupando a largura disponivel do card.
- `prospeccao_worker_feedback_dedupe`: em 2026-06-10, corrigida a mensagem enganosa que dizia para
  iniciar o `web-worker` quando o job estava apenas aguardando pickup/polling. O SerpApi Google Maps
  agora pagina resultados quando `maxResults` passa do tamanho da primeira pagina, e o worker carrega
  chaves de leads ja salvos da campanha para nao recriar duplicados em execucoes repetidas.
- `lead_filters_empty_values`: em 2026-06-11, corrigido crash em `/leads` ao filtrar apenas por
  `websiteStatus=no_site`. Query params vazios vindos de selects como `commercialStatus=`,
  `temperature=` e `minScore=` agora sao normalizados para `undefined` antes da validacao Zod.
- `freelance_google_auth_web`: em 2026-06-11, o app Next.js `apps/web` ganhou login Google usando a
  mesma API/auth session da extensao. O web guarda o token da API em cookie HTTP-only
  `freelance_auth_token`, valida `/auth/me` e usa o `user.id` autenticado como owner scope; sem login,
  continua caindo em `DEFAULT_FREELANCE_USER_ID || local-operator`. Para rodar local com a mesma conta
  da extensao, suba tambem `postgres` + `api`, porque o OAuth vive no backend FastAPI. O Compose agora
  força `GMAIL_OAUTH_CLIENT_SECRETS_FILE=/app/.local/gmail/client_secret.json` dentro dos containers
  para reaproveitar o `.local/gmail/client_secret.json` montado pelo volume do repo.
- `lead_social_maps_evidence`: em 2026-06-10, leads passaram a separar site proprio (`website_url`)
  de perfil social (`social_url`). A pagina de detalhe nao mostra mais score mockado como auditoria
  real de website; o analyzer atual registra apenas status/evidencia ate existir crawl real. A tela
  sempre oferece um link de verificacao no Google Maps para conferir a fonte.
- `freelance_bulk_outreach_scope`: em 2026-06-24, o escopo do app web `Freelance` foi ampliado para
  incluir selecao em massa na tabela de leads e envio controlado de mensagens comerciais. O padrao de
  referencia e o fluxo ja existente na extensao `Full-time`: checkbox mestre/por linha, painel de
  bulk review, IA gerando assunto/corpo por item com template como referencia, contadores de
  elegibilidade/falha, edicao/skip por lead e aprovacao explicita antes de envio real. Em `Freelance`,
  o contexto deve vir de lead/nicho/site/status, settings do vendedor/prestador, site/portfolio,
  oferta, campo livre de contexto para IA e templates comerciais. Email real deve entrar com provider
  configuravel e eventos por lead; WhatsApp real deve ser avaliado via Twilio/WhatsApp Business API ou
  equivalente, sem link com query pronta, respeitando opt-in, templates aprovados, rate limit e secrets
  por ambiente.
- `full_time_jobs_hot_state_external_filters`: em 2026-06-11, a extensao passou a cachear localmente a
  pagina de Jobs por filtros/lane por 30s, evitando recarregar a lista ao alternar entre `With email`
  e `External applications` ou reabrir o popup apos abrir um link externo. As externas agora tambem
  mantem/enviam `send_status`, e a API interpreta `sent` para `external_application` como
  `job_stage` aplicado/respondido/entrevista. Validacao: `apps/extension npm.cmd run typecheck`,
  `apps/extension npm.cmd run build` e
  `docker compose exec api python -m pytest tests/integration/test_external_application_jobs.py`.
- `full_time_search_history_spec`: em 2026-07-13, criada `specs/017-extension-search-history/spec.md` via fluxo Spec Kit para uma aba de historico na extensao `Full-time`. O recorte registra runs LinkedIn da Search UI, agregados por query exata e keyword/token, e exige contador bruto de resultados encontrados/capturados no LinkedIn antes de dedupe. Duplicatas continuam como diagnostico separado e nao podem reduzir o total usado para comparar keywords. O escopo exclui explicitamente `apps/web`/Freelance, leads, outreach Email/WhatsApp e career-page/ATS no primeiro corte.
- `full_time_linkedin_past_month_filter`: em 2026-06-17, a Search UI da extensao ganhou checkbox
  `Past month`. Quando marcado, a captura abre o LinkedIn com `datePosted="past-month"` junto do
  `sortBy="date_posted"`, preservando a mesma API run/search query e aumentando diversidade de posts
  capturados. Validacao: `apps/extension npm.cmd run typecheck` e `apps/extension npm.cmd run build`
  passed; o build manteve os avisos conhecidos de `punycode` e `svgo`/htmlnano.
- `vps_freelance_web_production`: em 2026-06-11, o servico `web` do Docker Compose foi ajustado para
  rodar Next.js em modo producao na VPS (`prisma generate`, `db:bootstrap`, `next build`, `next
  start`) em vez de `next dev`. O subdominio recomendado e `freelance.gfig.space` via Caddy para
  `127.0.0.1:3000`. O redirect final do login Google do app web usa
  `FREELANCE_GOOGLE_AUTH_SUCCESS_REDIRECT_URL`, mantendo `GOOGLE_AUTH_SUCCESS_REDIRECT_URL` reservado
  para o fluxo existente da API/extensao.
- `status_resumido`: a extensao Plasmo opera o fluxo `Full-time` local com login persistente, captura
  autenticada de posts do LinkedIn, listagem/detalhe de vagas, delete individual/bulk, templates,
  curriculos, login Google primary auth, Gmail OAuth, envio individual, bulk send revisavel com IA e
  busca LinkedIn simplificada com filtros opcionais por IA pos-captura. O feedback de captura acompanha o run do worker ate status
  terminal ou timeout amplo antes de liberar a UI, evitando contadores finais zerados enquanto a IA
  ainda esta processando e evitando que uma run presa bloqueie novas capturas. O dashboard usa metricas
  agregadas sem filtros da lista Jobs. A tentativa de adicionar uma fonte externa de vagas com
  enriquecimento de email foi descartada por baixa utilidade real: muitas respostas direcionavam para
  carreira/ATS/formulario, sem vantagem para o produto de outreach por email. A spec
  `011-saved-search-keywords` foi implementada: Search hidrata a ultima busca, salva novas palavras
  como badges owner-scoped com limite de 30, permite clicar no badge para adicionar ao input, remove
  badges somente por `X` e mantem a captura usando apenas o texto atual do input.
- `polish_atual`: `specs/012-extension-settings-polish/spec.md` foi criada via `/speckit-specify` para
  registrar a limpeza compacta da extensao antes de producao. Implementado: removido o botao quebrado
  `Pin assistant` do header, headings trocados para `Templates` e `Settings`, cards de settings com
  mais espacamento, lista de sites do AI field assistant simplificada para um dominio/URL por linha,
  sem badges `Domain/Active` e sem acao `Disable`, mantendo apenas remocao por icone de lixeira; a
  lista foi compactada novamente para linhas tipo tabela sem headers, com remocao pequena no extremo
  direito. Em seguida, o fluxo LinkedIn passou a preencher `opportunities.title` com o nome da pessoa
  que publicou o post; novas capturas autenticadas tambem promovem o label do post para `poster_name`
  no worker quando ele nao e generico, e os fallbacks aceitam texto colado como `feedDaniel...`. A
  lista `/jobs` usa esse campo como titulo do card e removeu `Email domain` dos cards.
- `estudo_fontes_ats`: criado `docs/ats-job-sources-pre-spec-study.md` como estudo pre-spec para
  reposicionar o produto como assistente de candidatura: ATS/career pages + AI matching + email
  assistido, com Greenhouse, Ashby e Lever como primeiros providers, Gupy/InHire em research-only, e
  `/jobs` dividido entre vagas com email e candidaturas externas. O projeto `Full-time` agora deve
  entrar em modo de fine tuning: smoke/ajuste fino de candidaturas externas, escala, polish, score ATS
  e futura geracao de curriculo ATS-friendly. O novo desenvolvimento principal passa a ser um app web
  `Freelance` separado.
- `spec_014_freelance_web_app`: criada `specs/014-freelance-web-app/spec.md` via
  `/speckit-specify`, com checklist completo em
  `specs/014-freelance-web-app/checklists/requirements.md`. A spec cobre o primeiro produto
  `Freelance` separado da extensao `Full-time`: campanhas por nicho/localidade, catalogo de nichos
  configuravel vindo das referencias, descoberta local realista, normalizacao/dedupe, analise de site,
  lista e detalhe de leads, prompt Lovable, gerador de mensagens, templates comerciais e settings de
  vendedor. Durante `/speckit-clarify`, foram registradas as decisoes: o MVP e uma fatia vertical
  completa; analise leve de website e obrigatoria; BR e internacional entram no fluxo do MVP, com
  smoke podendo focar uma amostra; CSV nao entra; prompts/mensagens sao gerados sob demanda e apenas a
  ultima versao gerada por lead fica salva, sem historico. `.specify/feature.json` aponta para
  `specs/014-freelance-web-app`. Em seguida, `/speckit-plan` gerou `plan.md`, `research.md`,
  `data-model.md`, `quickstart.md`, `contracts/openapi.yaml`, `contracts/web-ui.md` e
  `contracts/provider-payloads.md`. O plano cria um novo `apps/web` Next.js/Prisma para o produto
  `Freelance`, com worker separado para descoberta/analise e sem mexer nos fluxos `Full-time`. Em
  seguida, `/speckit-tasks` gerou `specs/014-freelance-web-app/tasks.md` com 170 tarefas organizadas
  por setup, fundacao, US1 campanhas, US2 descoberta/classificacao, US3 revisao de leads, US4
  geracao de prompt/mensagem, US5 templates/settings e polish/validacao. Depois,
  `/speckit-implement` concluiu T001-T045: scaffold `apps/web`, configs Next/Vitest/shadcn, Docker
  services `web`/`web-worker`, Prisma schema/migration/seed, config server-only, constantes,
  validacoes Zod, repositorios owner-scoped, service shells, provider abstraction com mock e
  skeletons Apify/SerpApi, worker shell, layout shell, store Zustand e estados basicos. Em seguida,
  US1 concluiu T046-T062: contratos/testes de campanha, rotas `GET /api/freelance/niches`,
  `GET/POST /api/freelance/campaigns`, `PATCH /api/freelance/campaigns/[campaignId]`, services de
  create/list/update, tela `/campaigns`, modal de criacao, cards de campanha, campos BR/international,
  hint de conversao como estimativa, empty state e link do dashboard para criar campanha. Validacao:
  `npm.cmd run test:contract`, `npm.cmd run test:unit`, `npm.cmd run test:integration`,
  `npm.cmd run typecheck`, `npm.cmd run build`; smoke local com Postgres Docker, seed de 29 nichos,
  campanha BR e internacional retornando 201 e `/campaigns` mostrando ambas. O proximo recorte
  recomendado e US2, T063-T091.
- `decisao_freelance_web`: o projeto freelance sera um app web interno em `Next.js` + `shadcn/ui` +
  `Zod` + `Zustand` + `Prisma` + `PostgreSQL`, com banco local via Docker Compose e deploy futuro em
  VPS. Ele nao deve ser uma extensao Chrome no MVP. O fluxo deve se basear no prototipo
  `references/opportunity-desk-pro`, nas imagens/templates em `references/`, em `docs/reference-ui.md`
  e nos requisitos de prospeccao ja registrados. A lista inicial de nichos ja esta registrada em
  `references/opportunity-desk-pro/src/lib/mockData.ts` como `NICHE_OPTIONS` e deve virar seed/config
  do webapp.
- `decisao_freelance_discovery`: a coleta v1 deve priorizar uma busca local realista de
  Google/Google Maps, porque o objetivo e identificar os negocios que usuarios reais encontrariam ao
  buscar por nicho/localidade, como "clinica de estetica", "igreja" ou "clinica ortodontica". A
  recomendacao inicial e implementar uma interface `freelance_maps_provider` com provider externo
  como Apify Google Maps Scraper ou SerpApi Google Maps. Playwright pode ser mantido apenas como
  fallback/spike de auditoria, nao como provider principal. Depois da coleta, o worker deve baixar o
  HTML do site quando existir e avaliar conteudo, design, performance e SEO em etapa propria.
- `spec_013_serpapi_career_search`: criada `specs/013-serpapi-career-search/spec.md` via
  `/speckit-specify`. A nova direcao evita o spike antigo de enriquecimento de email: busca career
  pages/ATS curados por keywords sem exigir nome de empresa/board/tenant do operador, usa fontes
  selecionaveis, avalia resultados com IA, salva vagas externas com URL oficial de candidatura, separa
  `/jobs` entre vagas com email e candidaturas externas, permite selecao multipla apenas para deletar e
  adiciona status manual de aplicado para vagas externas. Durante `/speckit-clarify`, foram registradas
  decisoes: cada clique no botao de career-page search em `/search` inicia uma busca nova no provider;
  resultados aceitos persistem no banco como opportunities; vagas LinkedIn e career-page devem seguir
  uma politica operacional planejada de cerca de 1 mes apos captura; qualquer vaga externa com email
  utilizavel entra em `With email` e no fluxo Gmail automatico atual; todas as fontes ativas iniciam
  marcadas; a UI mostra a ultima busca ao lado do botao e desabilita o botao enquanto uma busca externa
  esta em andamento; aplicacao manual externa usa `job_stage=applied`; e a busca para ao atingir o
  maximo aceito ou um teto configuravel de candidatos inspecionados baseado em custo. Em seguida,
  `/speckit-plan` gerou `specs/013-serpapi-career-search/plan.md`, `research.md`, `data-model.md`,
  `quickstart.md`, `contracts/openapi.yaml` e `contracts/extension-search.md`, e atualizou `AGENTS.md`,
  `.cursor/rules/specify-rules.mdc` e `docs/next-spec-prompt.md` para apontarem para `/speckit-tasks`.
  Depois, `/speckit-tasks` gerou `specs/013-serpapi-career-search/tasks.md` com 112 tarefas organizadas
  por setup, fundacao, US1 busca career-page, US2 revisao separada, US3 matching IA, US4 aplicacao
  manual externa, US5 metricas de dashboard e polish/validacao. O proximo passo e implementar a partir
  de Phase 1/2 e US1 como MVP.
- `decisao_recente`: remover codigo, specs, configs e UI da fonte externa; preservar melhorias
  independentes como feedback de captura, checkbox mestre de selecao, `Delete all listed`, dedupe visual
  de nomes, filtro Review removido e estado persistido do popup. Apos estabilizar login Google, a spec
  `010-ai-field-assistant` foi implementada em primeiro recorte com API owner-scoped, botao de varinha
  em campos externos, respostas recentes por keyword, Settings para ativacoes e popup sem header/menu
  antes do login. O recorte foi hardenizado depois de smoke real no LinkedIn:
  campos dinamicos passam a receber o botao sem refresh manual, o menu de resposta fica contido no
  viewport visivel, e Settings permite marcar quais curriculos entram como contexto do assistente.
- `full_time_fixes_mais_recentes`: o fluxo `Full-time` foi corrigido antes das proximas specs com
  sanitizacao real de emails colados com `hashtag`, migration de backfill para dados recuperaveis,
  metrica explicita `unsent` baseada em ausencia de `SendRequest job_application sent`, dashboard
  reduzido para total/nao enviados, status operacional `unsent/sent/interview` na extensao, header do
  popup reorganizado com icones, sender profile com WhatsApp e informacoes extras, e contexto/prompt
  de AI bulk email usando esses dados sem inventar fatos nem incluir WhatsApp vazio. A captura
  LinkedIn da extensao tambem foi hardenizada contra render tardio e containers internos do LinkedIn:
  o content script agora espera posts legiveis antes do primeiro scroll, descobre dinamicamente o alvo
  scrollavel real, usa wheel/scroll incremental imediato e registra `scrollTarget`, `scrollTop`,
  `clientHeight` e `scrollRange` nos diagnosticos.
- `validacao_mais_recente`: apos remover o spike descartado, passaram `apps/extension npm run
  typecheck`, `apps/extension npm run build`, `docker compose exec api python -m compileall app`,
  `docker compose exec worker python -m compileall app`, API focused tests
  (`test_job_search_runs_contract.py`, `test_job_search_run_collection_schema.py`,
  `test_linkedin_ai_filter_schema.py`, `test_linkedin_ai_filters_compatibility.py`) e worker focused
  tests (`test_job_ai_filter.py`, `test_linkedin_ai_filter_pipeline.py`,
  `test_linkedin_ai_filter_counters.py`) com `OPENAI_API_KEY` vazia para validar o fallback esperado.
  Em seguida, o container da API falhou porque o banco local ja estava carimbado com a revision
  descartada `013_google_jobs_email_discovery`; foi adicionada uma migration placeholder no-op
  `013_discarded_external_job_source_placeholder.py`, a API reiniciou, Alembic passou e `/health`
  retornou 200. `docker compose exec api python -m compileall app alembic` tambem passou. Em seguida,
  o filtro `keyword` da lista Jobs foi ampliado para encontrar tambem `contact_email`, validado por
  `docker compose exec api python -m pytest tests/integration/test_job_opportunity_filters.py`. Depois,
  o feedback de captura da extensao foi ajustado para continuar publicando progresso do run ate a
  conclusao real do worker; `apps/extension npm run build` passou, apesar do aviso esperado de rede do
  Plasmo ao buscar metadados de pacote. Depois, o worker foi ajustado para persistir candidates e
  counters incrementalmente a cada post analisado durante runs longos com AI filters; isso evita que a
  tela mostre `0 candidates checked; accepted=0, rejected=0, duplicates=0` enquanto a analise ja esta
  rejeitando, aceitando ou pulando itens. Validado com
  `docker compose exec worker env OPENAI_API_KEY= python -m pytest tests/unit/test_linkedin_candidate_parser.py tests/integration/test_linkedin_ai_filter_pipeline.py tests/integration/test_linkedin_ai_filter_counters.py`
  (11 passed) e worker reiniciado. Em seguida foi diagnosticado que a Search UI ainda ficava zerada
  porque `/job-search-runs/{id}/candidates` retornava 500 quando a IA salvava `detected_work_mode`
  composto como `onsite|hybrid` ou `remote|hybrid|onsite`; a API agora normaliza esses valores para
  `mixed`, o worker tambem normaliza novos sinais antes de persistir, e a extensao passa a mostrar os
  counters do run mesmo se uma chamada secundaria de candidates/opportunities falhar. Validado no run
  real `85c25402-0f0a-49a9-983a-c0d941351bc5`: endpoint `/candidates` retornou 200 com 250 candidates
  e counters `completed`, `accepted=10`, `rejected=209`, `duplicate=31`. Outro run real,
  `da6c8e85-5efd-4479-b4ae-e934b124f146`, mostrou `ai_filter_passed=24` mas `accepted=0` porque os 24
  aprovados pela IA foram marcados como `duplicate`; a causa era dedupe agressivo quando parser nao
  extraia empresa/cargo, gerando chaves no formato `||node,react,remoto|email`. A dedupe key agora
  inclui `source_url` quando empresa e titulo estao vazios, preservando dedupe do mesmo post sem
  colapsar vagas diferentes do mesmo email/keyword.
  Depois, o login Google primary auth foi corrigido end-to-end: a API usa escopos canonicos de
  userinfo, tolera aliases de escopo do Google, usa fallback `userinfo` quando `id_token` nao vem nas
  credenciais, reaproveita a config OAuth local do Gmail sem conceder `gmail.send`, e vincula
  identidade Google ao usuario existente quando o email verificado coincide. Validado com
  `docker compose exec api python -m pytest tests/contract/test_auth_google_contract.py tests/integration/test_google_primary_auth.py tests/integration/test_google_auth_gmail_oauth_separation.py`
  (12 passed), `docker compose exec api python -m compileall app`, `apps/extension npm run typecheck`
  e `/health` 200 apos restart da API. Para `010-ai-field-assistant`, passaram
  `docker compose exec api python -m compileall app alembic`, os testes focados
  `docker compose exec api python -m pytest tests/contract/test_field_assistant_contract.py tests/unit/test_field_assistant_service.py tests/integration/test_field_assistant_activation.py tests/integration/test_field_response_suggestions.py tests/integration/test_field_assistant_ownership.py tests/integration/test_field_answer_generation.py tests/integration/test_field_assistant_migration.py`
  (17 passed), `apps/extension npm run typecheck` e `apps/extension npm run build`. O build gerou o
  content script `field-assistant.*`; o Plasmo ainda emite o aviso conhecido de rede ao buscar
  metadados de pacote apos concluir o build. Em seguida, o hardening do assistente passou em
  `docker compose exec api python -m pytest tests/contract/test_resume_attachments.py tests/contract/test_field_assistant_contract.py tests/integration/test_field_assistant_migration.py`
  (7 passed), `apps/extension npm run typecheck` e `apps/extension npm run build`; a API local foi
  reiniciada e Alembic aplicou `016_field_assistant_ctx`. Em seguida, a shell do assistente ganhou
  `Fill saved` e `Fill with AI`, a janela da varinha passou a salvar respostas manuais ja digitadas no
  campo, keywords genericas passaram a usar termos significativos da pergunta, inputs `type=search`
  passaram a ser ignorados, e a pergunta/instrucao detectada agora e editavel antes de gerar/salvar;
  validado com
  `apps/extension npm run typecheck`, `apps/extension npm run build` e
  `docker compose exec api python -m pytest tests/contract/test_field_assistant_contract.py tests/contract/test_resume_attachments.py`
  (6 passed). Depois, a captura LinkedIn ganhou timeout terminal na extensao apos cerca de 10 minutos,
  o worker ganhou timeout configuravel de runs antigas em `running`, e o dashboard passou a chamar
  `/opportunities/metrics?opportunity_type=job` para mostrar totais reais sem os filtros da lista Jobs.
  Validado com `python -m pytest tests/contract/test_full_time_fixes_contract.py` em `apps/api` (5
  passed), `python -m pytest tests/unit/test_linkedin_worker_stale_runs.py` em `apps/worker` (2 passed)
  e `npm run typecheck` em `apps/extension`.
  Depois, os ajustes finais do fluxo Full-time passaram em
  `docker compose exec api python -m pytest tests/unit/test_email_sanitization.py tests/integration/test_job_email_sanitization.py tests/contract/test_user_settings.py tests/unit/test_ai_email_generation_context.py tests/contract/test_bulk_ai_email.py tests/contract/test_full_time_fixes_contract.py tests/integration/test_email_recipient_validation.py`
  (20 passed), `docker compose exec worker python -m pytest tests/unit/test_gmail_provider.py tests/integration/test_email_sending_job.py`
  (3 passed), `apps/extension npm run typecheck` e `apps/extension npm run build`. O build concluiu
  com o aviso conhecido de rede do Plasmo ao buscar metadata de pacote e uma mensagem nao bloqueante
  sobre `svgo`.
  Para `011-saved-search-keywords`, passaram `docker compose exec api python -m compileall app alembic`,
  `docker compose exec api python -m pytest tests/unit/test_job_search_preferences_service.py tests/contract/test_job_search_preferences_contract.py tests/integration/test_job_search_preferences.py tests/integration/test_job_search_preferences_ownership.py tests/integration/test_linkedin_ai_filters_compatibility.py`
  (14 passed), `apps/extension npm.cmd run typecheck` e `apps/extension npm.cmd run build`. O build
  concluiu com o aviso nao bloqueante conhecido sobre `svgo`.
  Para `012-extension-settings-polish`, passaram `apps/extension npm.cmd run typecheck` e
  `apps/extension npm.cmd run build`; o build concluiu com o aviso nao bloqueante conhecido sobre
  `svgo`/htmlnano. Depois da correcao de `opportunities.title` como nome do poster no fluxo LinkedIn
  e remocao de `Email domain` em `/jobs`, `apps/extension npm.cmd run typecheck` e
  `apps/extension npm.cmd run build` passaram novamente com o mesmo aviso nao bloqueante de
  `svgo`/htmlnano. Depois do ajuste visual da lista de sites e do hardening de `poster_name`, passaram
  `apps/extension npm.cmd run typecheck` e
  `docker compose exec worker python -m pytest tests/unit/test_linkedin_search_provider_inputs.py tests/unit/test_linkedin_candidate_parser.py`
  (13 passed).

## Produto

O produto continua com duas lanes:

- `job`: full-time job opportunities, prioridade atual
- `freelance`: prospeccao freelance planejada para depois

O caminho funcional atual de `job` e LinkedIn-first:

1. operador define texto de busca, sort, max posts/max scrolls e opcionalmente filtros de IA
2. extensao abre/captura LinkedIn autenticado
3. API cria run/candidates com owner scope
4. worker normaliza, aplica scoring/filtros, dedupe e cria opportunities acionaveis
5. operador revisa vagas, gera/edita mensagens, envia por Gmail com aprovacao humana

## Melhorias Que Devem Permanecer

- Search UI com filtros de IA desligados por padrao e aplicados somente quando marcados
- Search UI preenchida pela ultima busca confirmada, com keywords salvas como badges abaixo do input,
  limite de 30 por usuario, reutilizacao por clique no badge e remocao manual por `X`; a captura usa
  somente o texto atual do input
- Search UI com checkbox `Past month`, que aplica o facet de publicacoes do ultimo mes na URL do
  LinkedIn (`datePosted="past-month"`) sem mudar os filtros pos-captura da IA
- feedback visual de captura/run no painel de Search, com status do run separado do status da captura
  e contadores atualizados durante o processamento do worker; se a verificacao nao completar em cerca
  de 10 minutos, a extensao deve mostrar timeout terminal e liberar nova busca. Valores compostos de
  modo de trabalho retornados pela IA nao devem derrubar o endpoint de candidates
- dashboard `Full-time` com metricas agregadas da API, sem recalcular totais a partir da pagina ou dos
  filtros atuais de Jobs, mostrando foco operacional em total de vagas e vagas ainda nao enviadas
- dedupe de vagas deve usar empresa/cargo quando disponiveis e usar a URL do post como desempate quando
  empresa/cargo nao foram extraidos
- Jobs UI sem filtro Review
- checkbox mestre `All listed` para selecionar/desselecionar todas as oportunidades listadas
- `Delete all listed` sempre respeitando os filtros atuais da lista
- bulk email limitado a 50 selecionadas por vez
- sender profile com nome, email, portfolio, LinkedIn, WhatsApp e informacoes extras usados como
  contexto da IA junto do curriculo, com assinatura limpa e sem WhatsApp quando o telefone estiver vazio
- estado persistido para aba, filtros, selecao, modal bulk, detalhe selecionado e progresso de captura
- cards usando titulo/cargo da vaga como label principal, com dedupe de nomes repetidos
- input unico de busca em Jobs cobrindo descricao, keywords, cargo, empresa e email de contato salvo
- login Google do app separado do OAuth Gmail de envio, com linking por email verificado
- logs estruturados de AI filter no worker
- assistente de campos externos com botao de varinha magica e respostas recentes por keyword, usando
  IA backend-only, curriculos selecionados como contexto extraido no backend e menu contido no viewport;
  a acao quebrada `Pin assistant` foi removida do popup, e o proximo hardening visual deve focar nos
  controles injetados em campos reais; a lista de sites autorizados no popup deve permanecer compacta,
  em linhas sem headers e com remocao pequena no extremo direito

## Decisao Sobre Fonte Externa De Vagas

A fonte externa de vagas com enriquecimento posterior de email nao deve entrar na aplicacao agora.
Motivo: mesmo quando acha emails publicos, o retorno pratico tende a ser "aplique pelo site de
carreiras" ou "use este portal", o que torna o fluxo pouco util para outreach direto.

A excecao planejada agora e `013-serpapi-career-search`: a fonte externa nao faz enriquecimento
automatico de email nem tenta descobrir email da empresa depois do resultado; ela encontra URLs oficiais
de candidatura em sites curados. Quando o proprio resultado capturado tiver email utilizavel, a vaga
entra em `With email` e permanece elegivel ao fluxo Gmail atual. Quando nao tiver email, mas tiver URL
oficial, ela entra em `External applications` e deixa o operador aplicar manualmente com apoio do
assistente de campos.

Remover/evitar:

- botao separado do spike antigo de fonte externa/enriquecimento de email na Search UI
- provider externo de vagas no worker
- descoberta automatica obrigatoria de email de empresa
- campos de schema/model/contract especificos dessa fonte
- configs/secrets de provider externo
- specs e tasks do spike descartado

Dados locais antigos dessa fonte podem continuar no banco de desenvolvimento se ja foram gerados, mas
o codigo atual nao deve depender deles. Qualquer limpeza de dados reais deve ser uma acao explicita do
operador.

Existe uma migration placeholder com a revision antiga somente para compatibilidade com bancos locais
que ja tinham aplicado o spike. Ela nao adiciona schema, provider, UI ou comportamento da fonte
descartada.

## Status Atual - 013 Career Page Search

`/speckit-implement` avancou `specs/013-serpapi-career-search/tasks.md` ate 111/112 tarefas
concluidas. Entregue: migration/model/schema aditivos para `search_kind=career_page`, fontes curadas,
endpoints de fonte/start/latest, guarda contra run duplicada ativa, config `SERPAPI_API_KEY` e caps,
provider worker-owned SerpApi-style, normalizador externo, persistencia de opportunities com email ou
apply URL, separacao `With email`/`External applications`, mark applied sem eventos Gmail, metricas
separadas, Search UI com ultima busca/botao desabilitado enquanto a run esta ativa, logs estruturados
do worker e testes focados de API/worker/extensao.

Validacao feita: `docker compose exec api alembic upgrade head`, `docker compose exec api python -m
compileall app alembic`, `docker compose exec worker python -m compileall app`, API career-page
focused tests 17 passed, worker career-page focused tests 11 passed, extension `npm run typecheck`
passed e `npm run build` passed. O build mantem avisos conhecidos do Plasmo/Node sobre `punycode` e
`svgo`.

Pendencia restante: T112, smoke manual da extensao com provider/dados reais e vagas mistas email +
external application. Depois desse smoke, ajustar caps conforme amostra real de SerpApi.

## Pendencias Prioritarias

- fazer smoke manual completo de `specs/010-ai-field-assistant` em paginas externas: ativar dominio,
  confirmar botoes sem refresh, gerar resposta com curriculo marcado como contexto,
  inserir/substituir/anexar no fim da tela, salvar sugestao manual, reutilizar sugestoes salvas no menu
  de campo e confirmar que campos sensiveis nao recebem botao
- ajustar isolamento visual do assistente para iframe/shadow-root se sites reais entrarem em conflito
  com o DOM/CSS injetado atual
- completar as partes realmente assincronas/worker-owned de AI bulk generation e feedback pos-envio
- polir a casca publicavel: mensagens vazias, estados de erro/loading, dashboard/funil, onboarding
  local, build extension, configuracao de API publicada e checklist de smoke
- executar smoke manual completo de extensao com LinkedIn real, AI filters, Search badges, Jobs pagination, Google
  auth e Gmail OAuth/send
- melhorar feedback pos-envio ate status final por item
- revisar contratos/testes legados de auth/ownership e campos recentes do fluxo `Full-time`
- smoke manual do LinkedIn real depois de build/restart
- observar em novo smoke real se a captura LinkedIn volta a registrar `LinkedIn initial posts ready`
  e multiplos `scroll capture progress` com `scrollTarget` diferente de `window` quando o LinkedIn
  usar container interno; os avisos de WebSocket/HMR do Plasmo continuam nao bloqueantes quando o dev
  server nao esta conectado
- planejar futuramente retencao/limpeza automatica de vagas antigas por politica configuravel

## Status Atual - 014 Freelance Web App

`/speckit-implement` concluiu a vertical revisavel de `specs/014-freelance-web-app/tasks.md`.
Entregue em `apps/web`: app `Next.js`/Prisma/Tailwind, `db:bootstrap` aditivo para o banco local,
seed de nichos/templates, campanhas BR/internacional, provider mock deterministicamente, job de
prospeccao, dedupe, analise leve de website, persistencia de leads, dashboard, lista/detalhe de leads,
edicao de status/notas/demo URL, prompt Lovable sob demanda, geracao de mensagem comercial,
templates, configuracoes e guardrails contra CSV/envio automatico.

Validacao feita em 2026-06-08:

- `cd apps/web && npm run db:bootstrap`
- `cd apps/web && npm run typecheck`
- `cd apps/web && npm run test` -> 31 arquivos, 43 testes
- `cd apps/web && npm run build`
- smoke HTTP em `http://127.0.0.1:3000`: nichos 200, campanhas 200, prospecting job 201 com
  `status=completed` e 3 leads aceitos, `/leads` 200, detalhe 200, prompt 200, mensagem 200,
  `/settings` 200
- `npm run typecheck --prefix apps/extension`

Como rodar localmente para revisar:

```bash
cd apps/web
npm install
npm run db:bootstrap
npm run dev
```

Abra `http://localhost:3000/campaigns`, crie ou use uma campanha, clique em prospectar, depois revise
`/leads`, `/templates` e `/settings`.

Riscos/pendencias residuais:

- provider real Apify/SerpApi ainda e adapter inicial; a validacao completa foi feita com mock
- auth/ownership real ainda esta em modo interno/local
- polish visual fino deve ser guiado pela revisao manual do operador
- o browser interno do Codex falhou ao conectar nesta sessao, entao a verificacao visual final foi
  feita por build e smoke HTTP, nao por screenshot automatizado

Revisao manual inicial em 2026-06-08:

- `http://127.0.0.1:3000/campaigns` mostrando campanha `Barbearia - Indaial (BR)` com leads gerados
  pelo provider mock e status `completed` e resultado esperado para o MVP local.
- `/templates`, `/leads/{leadId}` e `/settings` renderizaram a casca operacional esperada, com dados
  seed/mock e aviso de provider mock ate credenciais reais serem configuradas.
- Confirmado que a fonte principal de nichos planejada para o seed inicial veio de `NICHE_OPTIONS` em
  `references/opportunity-desk-pro/src/lib/mockData.ts`, espelhada em `docs/reference-ui.md` e
  `docs/bot-1-scraper.md`. Em 2026-06-09, `Igrejas` foi adicionada como nicho aprovado pelo operador
  para oportunidades de sites CMS/admin para postagens, eventos, calendario, carousel de imagens e
  comunicacao comunitaria.

## Status Atual - 015 Freelance Niche Catalog

`/speckit-specify` criou `specs/015-freelance-niche-catalog/spec.md` e checklist de qualidade para o
recorte de governanca do catalogo de nichos Freelance, auditoria seed x referencias, normalizacao de
nomes, source evidence, adicao/edicao/desativacao de nichos sem deploy e fluxo controlado para
candidatos vindos de `references/`.

`/speckit-plan` foi executado manualmente a partir de `.specify/feature.json` porque
`.specify/scripts/bash/setup-plan.sh --json` continua bloqueado neste Windows sem distribuicao WSL.
Foram gerados `plan.md`, `research.md`, `data-model.md`, `quickstart.md` e contratos
`contracts/api.md`, `contracts/web-ui.md` e `contracts/audit-report.md`.

O plano preserva os `NICHE_OPTIONS` originais e a adicao aprovada `Igrejas` como baseline, exige metadados de governanca/source
evidence, trata nomes com mojibake como problema auditavel, preserva snapshots historicos de campanha
quando nichos mudarem, cria candidatos revisaveis para referencias futuras e mantem CSV/provider-real
fora do escopo. O conflito de conversao `Imobiliaria` (`11.0%` no seed textual versus `6.1%` nas
imagens) deve aparecer no audit com ambos os valores e impedir catalogo alinhado ate escolha explicita
do operador.

Em 2026-06-09, `/speckit-clarify` registrou essa decisao de manter ambos os valores ate escolha do
operador, e `/speckit-plan` foi reconciliado com a clarificacao. Depois, uma nova clarificacao separou
`niche_candidates` de leads/oportunidades reais: imagens e referencias sao fonte de verdade para
possiveis nichos de catalogo, `Igrejas` pode entrar como nicho aprovado quando docs/source evidence
sao atualizados, mas negocios reais para contato continuam vindo somente do scraper/API/provider
Google Maps ou equivalente, com dados contextuais para outreach. `/speckit-tasks` foi reconciliado
depois dessa clarificacao: US3 agora fala explicitamente em `niche candidates`, T060/T064/T086 guardam
contra criacao de leads/oportunidades/outreach a partir de referencias/imagens, e T071 preserva
`Igrejas` como baseline aprovado separado dos candidatos de referencia.

Em seguida, `/speckit-tasks` gerou `specs/015-freelance-niche-catalog/tasks.md` com 87 tarefas
organizadas por setup, fundacao, US1 auditoria de catalogo, US2 CRUD/governanca de nichos, US3
candidatos de referencias e polish/validacao. `.specify/feature.json` aponta para
`specs/015-freelance-niche-catalog`.

Em seguida, `/speckit-implement` concluiu o MVP T001-T037. Entregue em `apps/web`: enums/modelos
Prisma aditivos para governanca de nichos, candidatos e audit runs/findings; migration
`20260609000100_niche_catalog_governance`; seed backfill com display names normalizados, source
evidence, query terms e conversion hint source; utilitarios de normalizacao/mojibake; constantes de
baseline e referencias visuais; schemas Zod de catalogo; repositorios; listagem de nichos campaign-safe
por padrao; campanha usando apenas nichos enabled+approved; rota `GET /api/freelance/niche-audit`;
pagina `Settings -> Niche audit`; componentes de resumo, achados e conflito `Imobiliaria`; testes
focados T019-T026; guardas sem CSV e sem linguagem Full-time/job/resume/candidature na nova UI.

Validacao feita em 2026-06-09:

- `cd apps/web && npx.cmd prisma generate`
- `cd apps/web && npm.cmd run test -- tests/unit/niche-normalization.test.ts tests/unit/niche-validation.test.ts tests/unit/niche-audit-service.test.ts tests/unit/niche-conversion-conflicts.test.ts tests/contract/niche-audit-contract.test.ts tests/integration/niche-seed-backfill.test.ts tests/integration/niche-audit-run.test.ts tests/integration/niche-audit-ui.test.tsx` -> 8 arquivos, 16 testes
- `cd apps/web && npm.cmd run typecheck`
- guardas `rg` sem matches para CSV import/export e sem labels Full-time/job/resume/candidature em `apps/web/components/niches` e `apps/web/app/(freelance)`

Em seguida, `/speckit-implement` continuou US2 e concluiu T038-T055. Entregue em `apps/web`:
`niche-service` com create/update, duplicate slug/alias guard, source evidence enforcement,
disable/re-enable/merge e self-merge validation; `POST /api/freelance/niches`; `PATCH
/api/freelance/niches/[nicheId]`; tab `Approved niches` em `Settings -> Niche audit`; componentes
`niche-form`, `approved-niche-table` e `niche-conflict-warning`; campaign selector usando
`displayName` e filtrando apenas enabled+approved; testes focados para contrato, lifecycle,
duplicados, selecao de campanha, snapshot historico e UI.

Validacao US2 feita em 2026-06-09:

- `cd apps/web && npm.cmd run test -- tests/unit/niche-duplicate-guard.test.ts tests/unit/niche-lifecycle.test.ts tests/contract/niche-management-contract.test.ts tests/integration/niche-campaign-selection.test.ts tests/integration/niche-campaign-snapshot.test.ts tests/integration/niche-management-ui.test.tsx` -> 6 arquivos, 13 testes
- `cd apps/web && npm.cmd run typecheck`

Hotfix de infinite scroll LinkedIn validado em 2026-06-11:

- A captura da extensao em `apps/extension/contents/linkedin-search.ts` agora, quando um scroll
  estoura timeout sem progresso, tenta recuperar o infinite scroll do LinkedIn com dois scrolls para
  cima e uma nova descida antes de incrementar `noProgressCount`.
- Esses scrolls de recuperacao nao avançam o loop de `maxScrolls`; ficam registrados apenas em
  `diagnostics.scrolls[].recoveryScrolls` para depuracao.
- Validacao: `cd apps/extension && npm.cmd run typecheck`.
- Smoke manual recomendado: repetir uma busca longa com `max posts` perto de 250 e confirmar no
  console/diagnosticos que timeouts intermediarios acionam `recoveryScrolls: 3` antes de a captura
  desistir por `no_new_posts_after_scroll_timeout`.

Hotfix de localidade validado em 2026-06-10:

- `cd apps/web && npm.cmd run test -- tests/unit/locality-service.test.ts tests/contract/campaigns-contract.test.ts` -> 2 arquivos, 6 testes
- `cd apps/web && npm.cmd run typecheck`
- Smoke HTTP local: `GET /api/freelance/localities/states?marketScope=BR&q=santa` retornou `SC`,
  `GET /api/freelance/localities/cities?marketScope=BR&state=SC&q=inda` retornou `Indaial`,
  `GET /api/freelance/localities/postal-code?postalCode=89010000` retornou Blumenau/SC/Centro e
  `GET /api/freelance/localities/cities?marketScope=INTERNATIONAL&state=FL&q=orlan` retornou
  `Orlando` pelo fallback local.
- Tentativa de smoke visual com Playwright CLI abriu a pagina, mas o CLI travou em `snapshot/list`; a
  verificacao final ficou em testes, typecheck e rotas HTTP.

Hotfix de prospeccao validado em 2026-06-10:

- Reproducao: Docker tinha apenas `freelance-postgres` rodando; sem `web-worker`, job SerpApi ficava
  `pending/queued` e campanha ficava `collecting`. O botao tambem enviava `maxResults: 25` hardcoded
  apesar da campanha ter `{"maxResults":50}`.
- `cd apps/web && npm.cmd run test -- tests/contract/prospecting-jobs-contract.test.ts tests/integration/prospecting-worker-flow.test.ts tests/integration/niche-campaign-snapshot.test.ts` -> 3 arquivos, 3 testes
- `cd apps/web && npm.cmd run typecheck`
- `cd apps/web && npm.cmd run build`
- `FREELANCE_WORKER_RUN_ONCE=1 npm.cmd run worker` agora conecta ao banco certo. Com rede liberada,
  job SerpApi novo para campanha `igrejas teste api` gravou `requested_max_results=50`, inspecionou
  20 resultados e salvou 20 leads (`hot=3`, `failed=0`).

Em seguida, `/speckit-implement` concluiu US3 e polish T056-T087. Entregue em `apps/web`:
`niche-candidate-service` com geracao/matching de candidatos, revisao approve/reject/defer/
already-covered, aprovacao reaproveitando `createNiche`, rotas `GET /api/freelance/niche-candidates`
e `PATCH /api/freelance/niche-candidates/[candidateId]`, componentes `niche-candidate-list` e
`niche-candidate-decision-dialog`, tab `Candidate review`, contadores de candidatos no audit, seed
deterministico de candidatos visuais em `prisma/seed.ts` e `scripts/bootstrap-db.ts`, e guardas para
nao criar leads/oportunidades/outreach a partir de referencias/imagens.

Validacao US3/polish feita em 2026-06-09:

- `cd apps/web && npm.cmd run test -- tests/unit/niche-candidate-service.test.ts tests/unit/niche-candidate-decisions.test.ts tests/contract/niche-candidates-contract.test.ts tests/integration/niche-candidate-approval.test.ts tests/integration/niche-candidate-selection-guard.test.ts tests/integration/niche-candidate-ui.test.tsx` -> 6 arquivos, 10 testes
- `cd apps/web && npm.cmd run typecheck`
- `cd apps/web && npm.cmd run test` -> 51 arquivos, 83 testes
- `cd apps/web && npm.cmd run build`
- `cd apps/web && npm.cmd run db:bootstrap`
- smoke HTTP no dev server existente em `http://localhost:3000`: `/settings/niches` 200,
  `/api/freelance/niche-audit` 200 e `/api/freelance/niche-candidates` retornando 3 candidatos
  seedados com match sugerido
- guardas `rg` sem matches para CSV, labels Full-time/resume/candidature na area de nichos e imports
  de lead/job/outreach em `niche-candidate-service`/rotas de candidatos

## Status Atual - 016 Freelance Bulk Outreach

`/speckit-specify` criou `specs/016-freelance-bulk-outreach/spec.md` e checklist de qualidade em
`specs/016-freelance-bulk-outreach/checklists/requirements.md`. `.specify/feature.json` agora aponta
para esse recorte.

A spec cobre selecao por checkbox na tabela de Leads, checkbox mestre para visiveis/filtrados,
criacao duravel de batch/itens, geracao IA individualizada com template comercial como referencia,
contexto de lead/nicho/site/social/source evidence/settings/oferta, revisao item a item, edicao de
recipient/channel/assunto/corpo/mensagem, skip/unskip, contadores por elegibilidade/contato/duplicado/
invalido/gerado/falhou/pulado/enviado, aprovacao explicita antes de qualquer delivery real, email
como primeiro canal real, e WhatsApp como canal provider-backed end-to-end quando configurado, sem
shortcut `wa.me` como implementacao final.

Decisoes assumidas na spec:

- primeiro recorte e focado em primeiro contato; follow-up vira fluxo explicito posterior
- email do `Freelance` deve ser implementado dentro do `apps/web` por adapter proprio, sem depender
  do servico/API `Full-time` rodando
- provider exato de email/WhatsApp deve ser decidido no plano, mantendo secrets server-side
- WhatsApp entra no escopo end-to-end quando configurado, com diagnosticos claros no app para env vars,
  credenciais, conta/provider, templates, opt-in, rate limit e falhas de delivery
- contatos de email/WhatsApp podem vir do provider, edicao manual ou enriquecimento futuro, desde que
  o operador revise/edite o contato e a mensagem antes de aprovar
- limites por canal nao devem ser caps pequenos hardcoded; usar limites altos configuraveis por env ou
  capacidade reportada pelo provider, mostrando capacidade restante/erro no app
- apos selecionar leads, a UI deve oferecer botoes separados de bulk Email e bulk WhatsApp; a escolha
  define o canal antes da geracao, e aprovacao de envio tambem e separada por canal
- provider-real Google Maps/SerpApi/Apify continua separado; bulk outreach usa somente leads reais ja
  salvos por fluxos de operador/provider, nunca candidatos de nicho ou referencias/imagens
- a UI deve continuar usando linguagem `Freelance`, sem termos de vaga/curriculo/candidatura

`/speckit-plan` gerou `plan.md`, `research.md`, `data-model.md`, `quickstart.md` e contratos
`contracts/api.md`, `contracts/web-ui.md` e `contracts/provider-diagnostics.md`. O setup oficial
`.specify/scripts/bash/setup-plan.sh --json` continua bloqueado neste Windows sem distribuicao WSL, entao
o plano foi criado manualmente a partir de `.specify/feature.json` como nas specs anteriores.

Decisoes de plano:

- `BulkOutreachBatch`, `BulkOutreachItem`, `OutreachChannelSetting` e `OutreachEvent` entram como
  modelos owner-scoped no Prisma do `apps/web`
- batches sao de canal unico (`email` ou `whatsapp`) desde a criacao
- revisao de Email valida recipient/subject/body; revisao de WhatsApp valida numero/mensagem
- adapters de provider ficam em `apps/web/lib/providers`, com diagnostics normalizados e sem expor
  secrets
- readiness de canal mostra env vars faltantes por nome, limite configurado/restante, provider status
  e motivos de bloqueio
- aprovacao deve ser idempotente e bloquear duplicidade first-contact por lead/campanha/canal/stage

`/speckit-tasks` gerou `specs/016-freelance-bulk-outreach/tasks.md` com 77 tarefas organizadas por
setup, fundacao, US1 selecao de leads e batch duravel, US2 geracao IA individualizada, US3 review/
edicao/skip persistente, US4 envio real por Email via adapter do `apps/web`, US5 settings/readiness e
WhatsApp provider-backed, alem de polish/guardas/docs/validacao. O script oficial
`.specify/scripts/bash/check-prerequisites.sh --json` continua bloqueado neste Windows sem
distribuicao WSL; a feature ativa foi resolvida manualmente por `.specify/feature.json`.

`/speckit-implement` concluiu T001-T077. Entregue em `apps/web`: env/config de outreach, constantes e
diagnostics, schema Prisma/migration/bootstrap para `BulkOutreachBatch`, `BulkOutreachItem`,
`OutreachChannelSetting` e `OutreachEvent`, schemas Zod, fixtures/testes, repositorios/counters,
duplicate guard, selecao por checkbox na tabela de Leads, botoes separados `Generate Email` e
`Generate WhatsApp`, criacao de batch channel-specific, geracao de drafts por template/settings/lead
evidence, review list com editor por item, skip/unskip e persistencia de counters. US4 adicionou
aprovacao real de Email dentro do `apps/web`, adapters `email-provider` e `resend-email-provider`,
rota `POST /api/freelance/bulk-outreach/[batchId]/approve`, historico
`GET /api/freelance/leads/[leadId]/outreach-events`, idempotencia por item ja enviado, duplicate
blocking e eventos de delivery. US5 adicionou readiness/settings por canal, rota
`GET/PATCH /api/freelance/channel-settings`, adapter WhatsApp/Twilio provider-backed, cards de
diagnostico em Settings e aprovacao WhatsApp quando configurado. Polish adicionou guardas de copy,
segredo e acessibilidade, quickstart/docs e proximo prompt.

Validação final T001-T077:

- `cd apps/web && $env:DATABASE_URL='postgresql://scrapper:scrapper@localhost:5433/freelance_app'; npx.cmd prisma validate --schema prisma/schema.prisma`
- `cd apps/web && $env:DATABASE_URL='postgresql://scrapper:scrapper@localhost:5433/freelance_app'; npx.cmd prisma generate --schema prisma/schema.prisma`
- `cd apps/web && npm.cmd run typecheck`
- `cd apps/web && npm.cmd run test:unit -- tests/unit/email-provider.test.ts tests/unit/whatsapp-provider.test.ts tests/unit/bulk-outreach-duplicates.test.ts tests/unit/freelance-copy-guard.test.ts tests/unit/server-secret-guard.test.ts`
- `cd apps/web && npm.cmd run test:contract -- tests/contract/bulk-outreach-contract.test.ts tests/contract/channel-settings-contract.test.ts`
- `cd apps/web && npm.cmd run test:integration -- tests/integration/bulk-outreach-selection-ui.test.tsx tests/integration/bulk-outreach-review-flow.test.tsx tests/integration/bulk-outreach-delivery-flow.test.tsx tests/integration/bulk-outreach-whatsapp-flow.test.tsx tests/integration/bulk-outreach-accessibility.test.tsx tests/integration/seller-settings-generation.test.tsx`
- `cd apps/web && npm.cmd run build`

## Hotfix Full-time Career-Page Search

Em 2026-07-03, foi investigada variabilidade na busca externa da extensao Full-time: alguns runs de
career pages retornavam `completed_no_results`, enquanto outros aceitavam vagas normalmente. Os logs
mostraram que um run recente aceitou resultados de InHire/Ashby/SmartRecruiters, mas a UI podia ficar
confusa porque o popup nao persistia fontes/limites escolhidos e o refresh pos-disparo podia usar o
cache de oportunidades por ate 30s antes de buscar o latest run atualizado.

Mudancas aplicadas:

- a extensao agora persiste `selectedCareerSourceKeys`, `careerPageAcceptedLimit` e
  `careerPageInspectedCap` no estado local do popup
- `startCareerPageSearch` limpa cache e faz polling do latest career-page run ate sair de
  `pending/running`, atualizando oportunidades no terminal
- o worker agora inclui `inspected_count`, `accepted_count` e `source_diagnostics` no log
  `career_page_run_terminal`, para diferenciar fonte vazia, falha parcial e aceite real

Validacao local: `apps/extension npm.cmd run typecheck` passou; `compileall` do worker passou usando o
Python empacotado do Codex. `python`/`py` nao existem no PATH do Windows local.

Complemento em 2026-07-03: o fluxo career-page tambem foi ajustado para respeitar filtros de IA de
modo de trabalho/regiao antes de criar oportunidades. Antes, `ai_filters_enabled` era salvo no run
externo, mas o worker career-page usava IA apenas para review/score, nao para rejeitar candidatos. A
extensao agora enriquece a query enviada ao provider com `remote`, regioes aceitas e termos negativos
como regioes excluidas/onsite/hybrid quando esses filtros estao ativos; o worker aplica
`job_ai_filter` antes de `insert_opportunity`, persistindo candidatos rejeitados como
`rejected_ai_filter` com diagnosticos. O campo `Extra AI context` de Settings continua voltado a
contexto de geracao de emails/respostas e nao deve ser usado como controle principal de busca externa.

Validacao adicional: `apps/extension npm.cmd run typecheck` passou; `compileall` do worker passou com
o Python empacotado. O teste focado `apps/worker/tests/integration/test_career_page_search_pipeline.py`
foi atualizado, mas nao rodou localmente porque nem o Python empacotado nem o container `worker`
tinham `pytest` instalado; a tentativa via Docker subiu `api`/`postgres` temporariamente e eles foram
parados depois com `docker compose stop api postgres`.

## Hotfix AI Field Assistant Large Questions

Em 2026-07-03, o AI Field Assistant foi ajustado para aceitar perguntas/instrucoes muito maiores no
menu de autocomplete da extensao. O bloqueio vinha da API: `FieldContext.label_text` aceitava apenas
2.000 caracteres, `existing_value` 4.000 e `template_hint` 1.000, o que impedia perguntas compostas
com textos longos sobre empresa/vaga antes de chegar na OpenAI. Esses tres campos agora usam o teto
compartilhado `FIELD_ASSISTANT_LARGE_TEXT_MAX_LENGTH = 500_000` em
`apps/api/app/schemas/field_assistant.py`. O banco ja usa `Text` para o historico de geracoes e nao
precisou de migration.

Validacao local: `compileall apps/api/app` passou com o Python empacotado; `apps/extension
npm.cmd run typecheck` passou. O teste de integracao `test_field_answer_generation.py` recebeu caso
cobrindo contexto maior que o limite antigo, mas nao rodou neste ambiente porque o Python empacotado
nao tem `pytest`.

## Hotfix Career-Page Running Timeout

Em 2026-07-03, um run real de `career_page` ficou preso depois de concluir InHire e Ashby; o ultimo
log registrado foi `career_page_candidate_inspected` em Ashby com 14 inspecionados, sem
`career_page_source_progress` para SmartRecruiters e sem `career_page_run_terminal`. A causa provavel
e o worker ficar travado/morrer entre fontes externas, deixando o run em `running` ou `pending` ativo
e bloqueando novas buscas na extensao.

O worker de career-page agora tem recuperacao de runs `running` antigas equivalente ao fluxo
LinkedIn, filtrada por `search_kind = 'career_page'`: no startup marca runs antigas como
`failed/stale_running`, e em loops normais marca runs acima de
`WORKER_RUNNING_RUN_TIMEOUT_MINUTES` como `failed/running_timeout`. O `apps/worker/app/main.py`
tambem passou a propagar corretamente `worker_mark_stale_running_on_startup` para career-page, para
evitar que uma busca ativa seja marcada como stale em toda volta do loop. Antes de chamar cada fonte,
o worker persiste `source_diagnostics[source_key].status = "fetching"` e atualiza `updated_at`, dando
um rastro melhor quando a execucao para entre fontes.

Validacao local: `compileall apps/worker/app` passou com o Python empacotado; `apps/extension
npm.cmd run typecheck` passou. Foi adicionado teste unitario para stale/timeout de career-page, mas
ele nao rodou localmente porque o Python empacotado nao tem `pytest`.

## Proximo Passo Spec Kit Recomendado

Rodar `/speckit-analyze` para `specs/016-freelance-bulk-outreach` como revisao nao destrutiva de
consistencia pos-implementacao. Possiveis follow-ups: webhooks/status reconciliation de providers,
gestao avancada de templates/opt-in WhatsApp, contabilizacao diaria mais rica por provider e
enriquecimento futuro de email para leads que chegam apenas com telefone/site.

O `/speckit-analyze` final de `specs/015-freelance-niche-catalog` ainda e util como revisao
nao destrutiva, e provider real Google Maps/SerpApi/Apify continua sendo uma spec importante para
qualidade dos leads. Ainda assim, a proxima spec de produto deve explicitar que candidatos de nicho
continuam fora de leads/oportunidades/outreach e que nenhum envio acontece sem lead real vindo do
scraper/API/provider e aprovacao do operador.

Pendencia de fine tuning do `Full-time`: executar o smoke manual T112 de
`specs/013-serpapi-career-search/tasks.md` com provider real e vagas mistas email + external
application. Isso deve virar ajuste pontual do produto `Full-time`, nao bloquear a revisao do app
`Freelance`.

Durante `012-extension-settings-polish`, a tentativa de criar a branch `codex/012-extension-settings-polish`
falhou porque o Git local nao conseguiu criar o diretorio de ref aninhado; a implementacao continuou
na branch atual sem reverter o arquivo nao rastreado `Untitled`.

`/speckit-implement` concluiu `specs/011-saved-search-keywords/tasks.md` com a melhoria pequena da
Search UI: ultima busca persistida, badges abaixo do input, captura usando apenas o input atual,
adicao de novas palavras com limite de 30 e remocao manual por `X`. Validacao focada de API e extensao
passou; smoke manual em LinkedIn real ainda deve ser feito.

`/speckit-plan` gerou `specs/011-saved-search-keywords/plan.md`, `research.md`, `data-model.md`,
`quickstart.md`, `contracts/openapi.yaml` e `contracts/extension-search.md`, e atualizou `AGENTS.md`
e `.cursor/rules/specify-rules.mdc` para apontarem para o plano ativo `011`. O script oficial
`setup-plan.sh` nao pode rodar porque `bash` no Windows chamou WSL sem distribuicao instalada; o
setup foi feito manualmente a partir de `.specify/feature.json` e dos templates.
Em seguida, `/speckit-tasks` gerou `specs/011-saved-search-keywords/tasks.md` com 57 tarefas
organizadas por setup, fundacao, US1 ultima busca/persistencia na captura, US2 badges reutilizaveis
e removiveis, US3 ownership/compatibilidade, e polish/validacao. O script oficial
`check-prerequisites.sh` tambem depende de `bash`/WSL neste ambiente, entao a feature ativa foi
resolvida manualmente por `.specify/feature.json`.

`/speckit-implement` executou o primeiro recorte de `specs/010-ai-field-assistant/tasks.md`. Entregue:
modelos/migration/rotas API `field-assistant`, geracao de respostas usando contexto de perfil/resumo
no backend, sugestoes salvas owner-scoped por keyword com limite de 3, clientes/tipos da extensao,
content script `field-assistant`, Settings para ativacoes, ocultacao de header e tabs sem sessao e
documentacao atualizada. `tasks.md` ficou com 84/88 tarefas marcadas; continuam
abertas apenas duas tarefas de teste especifico de UI/auth e dois smokes manuais. Validacao: API 17
passed, extension typecheck passed, extension build passed com aviso de rede pos-build do Plasmo. O
hardening posterior adicionou selecao de curriculos para contexto, extracao de texto real do PDF no
assistente, varredura dinamica de campos, menu responsivo ao viewport, salvar respostas manuais e
reuso de respostas salvas no menu de campo; a API local esta em `016_field_assistant_ctx`.

Antes disso, `/speckit-specify` criou `specs/010-ai-field-assistant/spec.md` a partir de
`docs/next-spec-prompt.md`. A spec cobre assistente de campos externos com IA, respostas recentes por
keyword, comportamento authenticated-only e nao-objetivos como
submissao automatica de formularios, limpeza de vagas antigas e retomada da fonte externa descartada.
Durante `/speckit-clarify`, foram adicionadas decisoes: ativacao por dominio base com opcao de pagina
exata e respostas salvas apenas por acao explicita. Em seguida, `/speckit-plan`
gerou `specs/010-ai-field-assistant/plan.md`, `research.md`, `data-model.md`, `quickstart.md`,
`contracts/openapi.yaml` e `contracts/extension-messages.md`, e atualizou `AGENTS.md` e
`.cursor/rules/specify-rules.mdc` para apontarem para o plano ativo `010`. Depois, `/speckit-tasks`
gerou `specs/010-ai-field-assistant/tasks.md` com 88 tarefas: setup/fundacao, US1 geracao e insercao
em campo, US2 respostas salvas por keyword, US3 ativacao por dominio, US4 UI authenticated-only e
polish/validacao.

Antes disso, `/speckit-implement` avancou `specs/009-full-time-fixes/tasks.md` ate 105/114 tasks concluidas. Foram
implementados e validados: US2 Google primary auth com `GoogleIdentityLink`, rotas
`/auth/google/start` e `/auth/google/callback`, linking por email verificado e separacao total do Gmail
OAuth; US3 testes restantes de regiao somente em AI filters; US4 paginacao de opportunities/Jobs em
paginas de 50 com selecao limitada aos itens visiveis; US5 `operator_linkedin_url` owner-scoped em
settings, UI e contexto de geracao; e parte de US6 com status por item no batch AI, rota
`/bulk-email/generate-ai/{batch_id}` e badges de progresso no painel. Validacao consolidada: API
focused tests 37 passed, worker AI filter pipeline 3 passed, `apps/extension npm run typecheck` passed
e `apps/extension npm run build` passou com o aviso conhecido de rede do Plasmo ao buscar metadados de
pacote. A verificacao de fonte descartada removeu a ramificacao visual residual `Google Jobs` da Jobs
UI; os hits restantes sao apenas specs/docs e a migration placeholder local. O fluxo de Google primary
auth foi corrigido para usar `chrome.identity` com redirect da extensao e para reaproveitar a config
OAuth local do Gmail quando `GOOGLE_AUTH_CLIENT_ID/SECRET` nao estiverem preenchidos, mantendo escopos
de login limitados a `openid` + userinfo email/profile e sem conceder Gmail send. Ainda ficam pendentes
as partes realmente assincronas/worker-owned de US6: T078-T079, T081, T084-T086 e T090, alem do teste
worker completo T101 e smoke manual T103. Depois do primeiro recorte do AI Field Assistant, o proximo
prompt recomendado em `docs/next-spec-prompt.md` voltou para hardening operacional: retencao segura de
vagas antigas, AI bulk generation duravel e feedback final pos-envio.
