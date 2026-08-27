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

- `fase_atual_roadmap`: Fase 4.5 `Outreach Freelance Em Massa` concluida, com fine tuning ativo no produto `Full-time`
- `etapa_atual_action_plan`: `017-extension-search-history` teve primeiro recorte implementado; proxima spec priorizada agora e `Full-time LinkedIn Jobs External Search`
- `spec_018_linkedin_jobs_external_search`: criada `specs/018-linkedin-jobs-external-search/spec.md` via `/speckit-specify`, clarificada, planejada e detalhada em tasks em 2026-07-23. `tasks.md` tem 95 tarefas em setup, fundacao, US1 busca LinkedIn Jobs externa MVP, US2 keywords/data/sort, US3 abas claras em Search, US4 modo assistido e polish/validacao. Decisao principal: a extensao e dona da navegacao/inspecao do LinkedIn Jobs na aba logada do operador; API/worker ficam com persistencia, dedupe, validacao, diagnosticos e utilitarios compartilhados. `.specify/feature.json` aponta para `specs/018-linkedin-jobs-external-search`. Implementacao iniciada: fundacao backend/worker/extension-client entregue; proximo passo e implementar background/content-script/UI da extensao para inspecionar cards reais do LinkedIn Jobs.
- `full_time_linkedin_jobs_assisted_entry_hotfix`: em 2026-08-03, o modo assistido da extensao passou a abrir `https://www.linkedin.com/jobs/` em vez de `/jobs/search-results/`, preservando o caminho esperado de clicar `Exibir todas`. O content script tambem deixou de tratar uma rota vazia de `/jobs/search-results` como sucesso sem sinais reais de cards/renderizacao.
- `full_time_linkedin_jobs_opening_wait_hotfix`: em 2026-08-03, `waitForTabComplete` passou a checar o status atual da aba e a ter timeout de 30s, evitando que a captura fique presa em `opening` quando o LinkedIn Jobs SPA nao emite `complete` depois que a aba e criada.
- `full_time_linkedin_jobs_tab_create_hotfix`: em 2026-08-03, a criacao da aba LinkedIn Jobs passou a usar wrapper callback-based com timeout de 10s e progresso com `sourceTabId`, para evitar Promise de `chrome.tabs.create` pendurada sem abrir aba ou sem diagnostico visivel.
- `full_time_linkedin_jobs_popup_command_timeout`: em 2026-08-03, o popup passou a enviar `START_LINKEDIN_JOBS_EXTERNAL_CAPTURE` por callback com timeout de 10s, evitando que `chrome.runtime.sendMessage` deixe a UI presa antes do background abrir a aba. O texto inicial agora e `Sending LinkedIn Jobs command...`, util como marcador de build carregado.
- `full_time_linkedin_jobs_open_tab_before_run`: em 2026-08-03, o background passou a abrir a aba LinkedIn Jobs antes de criar a run na API. O comando responde ao popup assim que a aba e criada, e a captura continua por progress events; isso evita que lentidao/estado preso da API impeca a abertura da aba.
- `full_time_linkedin_jobs_content_script_reinject`: em 2026-08-05, o background passou a detectar `receiving end does not exist` ao enviar `CAPTURE_LINKEDIN_JOBS_EXTERNAL`, localizar o content script LinkedIn Jobs no manifest gerado e reinjeta-lo via `chrome.scripting.executeScript` antes de tentar novamente.
- `full_time_linkedin_jobs_assisted_show_all_click`: em 2026-08-05, o clique em `Exibir todas` no modo assistido passou a procurar tambem `[role=button]`, clicar o wrapper acionavel com eventos pointer/mouse, registrar `attempt`/`target`/`href` e repetir ate 3 tentativas com fallback por href.
- `full_time_linkedin_jobs_hrefless_button_current_tab_resolver`: em 2026-08-14, diagnostico dos logs mostrou `selected_apply_cta_candidate` com `href=null` para `BUTTON.jobs-apply-button[data-live-test-job-apply-button]`, seguido de `clickResult=null` e `reason=click_failed`. O resolvedor agora trata botoes sem href como clique na aba LinkedIn Jobs atual: executa o clique no `MAIN world`, espera a janela completa de eventos `tabs.onCreated/onUpdated`, captura a primeira URL externa observada e fecha apenas a aba externa auxiliar. O evento `apply_resolution_strategy` registra `current_tab_button_click`, e `script_no_result` diferencia clique abortado/sem retorno de clique que retornou diagnostico real.
- `full_time_linkedin_jobs_search_results_surface`: em 2026-08-05, corrigido o detector de superficie da busca de Jobs para aceitar `/jobs/search-results/` alem de `/jobs/search/`. A selecao de vaga tambem passou a usar um unico alvo estavel por card, preferindo o anchor `/jobs/view`, para evitar alternancia entre cards vizinhos no DOM virtualizado.
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
  forÃ§a `GMAIL_OAUTH_CLIENT_SECRETS_FILE=/app/.local/gmail/client_secret.json` dentro dos containers
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
- `freelance_twilio_delivery_status_hotfix`: em 2026-07-25, o provider Twilio do `Freelance` passou a expor `providerStatus` e diagnostico `twilio_delivery_pending` quando a API aceita a mensagem mas ainda retorna status como `queued`. O modal de envio agora mostra que a Twilio aceitou a mensagem e que entrega final deve ser confirmada nos logs/status callback, evitando interpretar HTTP 200/201 como entrega garantida no WhatsApp. Validado com `apps/web npm.cmd run typecheck`, `apps/web npm.cmd run test:unit -- whatsapp-provider.test.ts commercial-message-builder.test.ts` e `apps/web npm.cmd run build`.
- `freelance_whatsapp_plain_text_hotfix`: em 2026-07-25, a geracao comercial do `Freelance` passou a tratar WhatsApp como canal de chat puro: prompt proibe Markdown e links `[texto](url)`, evita pedir para chamar no WhatsApp quando a conversa ja esta no WhatsApp, e a camada pos-IA normaliza links Markdown para texto simples antes de salvar/enviar. Validado com `apps/web npm.cmd run typecheck` e `apps/web npm.cmd run test:unit -- commercial-message-builder.test.ts`.
- `freelance_offer_pricing_context_hotfix`: em 2026-07-22, settings do `Freelance` passou a aceitar URLs sem protocolo digitadas como `www.gfig.space`, normalizando para `https://...` no front e no Zod. A oferta agora separa preco base de landing page BRL/USD, ranges de projeto avancado e ranges de automacao, com defaults operacionais BRL 2500, USD 1000, prazo base 15 dias e parcelamento BR em ate 6x sem juros. A IA foi instruida a usar linguagem `a partir de`/`starting at`, deixando claro que banco de dados, captura de leads, admin, integracoes e automacoes WhatsApp aumentam escopo/preco.
- `freelance_seller_contact_context_hotfix`: em 2026-07-22, o app web `Freelance` ganhou campos de configuracao de vendedor para `companyWebsite` e `sellerLinkedinUrl`, alem dos campos ja existentes de email/WhatsApp/portfolio. A IA de mensagem comercial agora recebe esses contatos no contexto e trata `business.leadPhoneForOperatorReviewOnly` apenas como telefone do prospect, nunca como assinatura. Se `companyWebsite` ou `portfolioUrl` estiverem configurados, a mensagem deve incluir o link no rodape/assinatura; telefone de assinatura somente vem de `sellerWhatsapp`. A extensao `Full-time` ja enviava portfolio/LinkedIn/WhatsApp no contexto de email IA; o prompt foi ajustado para sempre incluir `portfolio_url` no rodape/assinatura quando configurado.
- `full_time_search_history_spec`: em 2026-07-13, criada `specs/017-extension-search-history/spec.md` via fluxo Spec Kit para uma aba de historico na extensao `Full-time`. O recorte registra runs LinkedIn da Search UI, agregados por query exata e keyword/token, e exige contador bruto de resultados encontrados/capturados no LinkedIn antes de dedupe. Duplicatas continuam como diagnostico separado e nao podem reduzir o total usado para comparar keywords. O escopo exclui explicitamente `apps/web`/Freelance, leads, outreach Email/WhatsApp e career-page/ATS no primeiro corte.
- `full_time_search_history_plan`: em 2026-07-13, `/speckit-plan` gerou `plan.md`, `research.md`, `data-model.md`, `quickstart.md` e contratos `contracts/api.md` e `contracts/extension-ui.md`. Decisao principal: adicionar campo nullable para resultado bruto LinkedIn em `job_search_runs`, expor endpoint owner-scoped de historico/agregados LinkedIn e criar tab compacta `history` na extensao. O script oficial `.specify/scripts/bash/setup-plan.sh --json` foi tentado, mas falhou porque os scripts Bash estao com CRLF neste workspace Windows; os artefatos foram criados manualmente a partir de `.specify/feature.json` e do template.
- `full_time_search_history_clarify`: em 2026-07-13, `/speckit-clarify` registrou que a lista principal do historico deve mostrar apenas as 20 buscas LinkedIn mais recentes. A ranking/lista de melhores keywords fica abaixo e nao depende de recorte por data; datas servem como contexto diagnostico para interpretar possiveis duplicatas.
- `full_time_search_history_plan_refresh`: em 2026-07-13, `/speckit-plan` foi reexecutado apos a clarificacao e os artefatos `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/api.md` e `contracts/extension-ui.md` foram sincronizados com a regra de 20 runs recentes + ranking de keywords independente de data.
- `full_time_search_history_tasks`: em 2026-07-13, `/speckit-tasks` gerou `specs/017-extension-search-history/tasks.md` com 75 tarefas em setup, fundacao, US1 historico de 20 runs, US2 ranking de keywords/query, US3 diagnosticos/evidencias, US4 isolamento Freelance e polish/validacao. O proximo passo recomendado e `/speckit-implement` iniciando por setup + fundacao + US1/US2 como MVP completo.
- `full_time_linkedin_jobs_external_search_prompt`: em 2026-07-23, a proxima spec Full-time foi repriorizada para buscar vagas externas pela aba Jobs do LinkedIn. O recorte deve ser deterministico, sem filtro de qualidade por IA antes de salvar, usando a mesma allowlist de fontes curadas do career-page search. A extensao deve reorganizar `/search` em abas `External jobs` e `LinkedIn posts`, manter a busca de career pages, adicionar botao de LinkedIn Jobs external search, aceitar busca sem keywords, busca por keywords com OR e modo opcional de busca assistida por IA do LinkedIn. Para busca classica, suportar periodo e ordenacao via parametros como `f_TPR`/`sortBy`; em modo assistido, desabilitar periodo/ordenacao salvo se houver caminho confiavel por clique manual. A coleta deve ignorar candidatura simplificada, capturar apenas links externos de fontes reconhecidas, paginar ate limite configuravel padrao 15/maximo 30 paginas, sem limite de aceites e sem parada precoce por poucos matches.
- `full_time_field_assistant_lever_textareas`: em 2026-07-13, hotfix na extensao para voltar a sugerir/preencher respostas em textareas do Lever/Osmind que usam `name="cards[...]"`. A regra de campo sensivel deixou de bloquear a palavra generica `card/cards` e passou a bloquear apenas sinais de cartao de credito reais (`credit card`, `card number`, CVV/CVC etc.); a varredura tambem cobre `[contenteditable]` de forma mais ampla e usa visibilidade por `getBoundingClientRect`/computed style para funcionar melhor em modais/portais. Validacao: `apps/extension npm.cmd run typecheck` e `apps/extension npm.cmd run build`.
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
- Esses scrolls de recuperacao nao avanÃ§am o loop de `maxScrolls`; ficam registrados apenas em
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

ValidaÃ§Ã£o final T001-T077:

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

Rodar `/speckit-implement` usando `docs/next-spec-prompt.md` para executar `specs/018-linkedin-jobs-external-search/tasks.md`. A spec `Full-time LinkedIn Jobs External Search` ja foi criada, clarificada, planejada e detalhada em 95 tarefas; o prompt anterior de History Drilldown continua util e foi preservado como prompt completo em `docs/spec-backlog.md`.

A implementacao deve comecar por setup/fundacao e US1 MVP: constantes compartilhadas de fontes externas curadas, dedupe/persistencia no lane `External applications`, captura assistida pela sessao LinkedIn do navegador, diagnosticos de run e validacao manual com LinkedIn real.

Ainda e util rodar `/speckit-analyze` para `specs/016-freelance-bulk-outreach` como revisao nao destrutiva de consistencia pos-implementacao. Possiveis follow-ups: webhooks/status reconciliation de providers, gestao avancada de templates/opt-in WhatsApp, contabilizacao diaria mais rica por provider e enriquecimento futuro de email para leads que chegam apenas com telefone/site.

O `/speckit-analyze` final de `specs/015-freelance-niche-catalog` ainda e util como revisao nao destrutiva, e provider real Google Maps/SerpApi/Apify continua sendo uma spec importante para qualidade dos leads. Ainda assim, candidatos de nicho continuam fora de leads/oportunidades/outreach e nenhum envio deve acontecer sem lead real vindo do scraper/API/provider e aprovacao do operador.

Pendencia de fine tuning do `Full-time`: executar o smoke manual T112 de `specs/013-serpapi-career-search/tasks.md` com provider real e vagas mistas email + external application. Isso deve virar ajuste pontual do produto `Full-time`, nao bloquear a spec de LinkedIn Jobs external search.

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

## Implementacao 017 Extension Search History

Em 2026-07-13, `/speckit-implement` entregou o primeiro recorte funcional de `specs/017-extension-search-history/tasks.md` para a extensao `Full-time`.

Entregue:

- API FastAPI: migration aditiva `021_extension_search_history`, campos nullable `raw_linkedin_result_count` e `raw_linkedin_result_count_source` em `job_search_runs`, schemas de history, endpoint `GET /job-search-runs/linkedin/history` owner-scoped e LinkedIn-only, excluindo `career_page`.
- Agregados: ranking por query exata e por keyword/token, independente de data, com totais/medias ignorando raw count desconhecido; duplicatas continuam separadas e nao reduzem o total bruto.
- Extensao Plasmo: captura autenticada envia `posts.length` como resultado bruto antes de dedupe/filtros/outcomes; nova aba `history` mostra 20 runs recentes, contadores de raw/checked/accepted/duplicates, diagnostico seguro e rankings `Best Keywords`/`Best Search Queries`.
- Isolamento: `apps/web`/Freelance nao foi alterado.

Validacao executada:

- `cd apps/api && python -m pytest tests\contract\test_job_search_runs_contract.py tests\integration\test_job_search_runs_api.py` -> 5 passed.
- `cd apps/extension && npm.cmd run typecheck` -> passed.

Notas operacionais:

- O script oficial `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` continua falhando neste workspace Windows por CRLF nos scripts Bash; a feature ativa foi resolvida por `.specify/feature.json`.
- Smoke manual com LinkedIn real ainda deve confirmar a contagem bruta em capturas longas e a ergonomia visual da aba `history` dentro do popup carregado no Chrome.
- Guarda apps/web: `rg "SearchHistory|searchHistory|linkedin/history|history" apps\web` retornou apenas usos genericos existentes (`window.history`, outreach history e teste de contrato de outreach), sem acoplamento com a aba History Full-time.
- Tasks 017: 65/75 marcadas como concluidas. Abertas intencionalmente: testes especificos T011/T012, drilldown/diagnosticos US3 T051-T058, guard test dedicado em apps/web T059 e smoke manual T073.

## Hotfix Freelance Lead Detail AI Outreach - 2026-07-13

O detalhe de lead do `apps/web` centraliza o fluxo no card amplo `Commercial message`: a IA gera a mensagem usando dados visiveis do lead, review do operador, evidencia de origem, analise de site, campanha, settings do vendedor/prestador e template selecionado apenas como base. O operador edita a mensagem no proprio campo e clica em `Send message`; um modal permite escolher WhatsApp ou Email, desabilitando Email quando o lead nao tem endereco capturado, editar destinatario/mensagem e confirmar `Send`. O backend continua usando as rotas de outreach existentes por tras, mas sem expor conceitos de batch/approve na UX de detalhe. Telefones de WhatsApp sao normalizados para E.164 antes do envio ao Twilio.

## Hotfix Full-time Field Assistant Modal Textareas - 2026-07-14

A extensao `Full-time` recebeu um ajuste no Field Assistant para lidar melhor com textareas em modais/overlays de aplicacao externa. O detector agora aceita campos visiveis dentro de ancestrais com role de modal/apresentacao mesmo quando algum wrapper usa `aria-hidden=true`, e o preenchimento de input/textarea passou a usar o setter nativo antes de disparar eventos `input`/`change`, melhorando compatibilidade com campos controlados por React/Vue.


- `spec_018_implementation_foundation`: em 2026-07-23, implementada a fundacao do LinkedIn Jobs external search: enums/schemas/rotas API para `linkedin_jobs_external`, lifecycle create/progress/candidate/finalize/latest, dedupe por URL canonica em oportunidade `external_application`, endpoint compartilhado `/job-search-runs/external-sources`, source registry com Teamtailor inativo, normalizacao de safety redirect no worker e utilitarios/client TypeScript da extensao. Validacao: `python -m pytest apps/api/tests/contract/test_linkedin_jobs_external_contract.py` (3 passed), `python -m pytest apps/worker/tests/unit/test_external_job_normalizer.py` (7 passed), `apps/extension npm.cmd run typecheck` (pass), `python -m py_compile ...` (pass). Pendente: content-script/background para varrer LinkedIn Jobs real, Search UI em abas e smoke manual direct URL/geoId/click path.

- `spec_018_implementation_complete_automated`: em 2026-07-23, a implementacao automatizada da spec 018 foi completada: API lifecycle/owner scope/no outreach, worker registry+URL canonicalization, extension client/store/background/content-script/Search UI, build Plasmo e docs. Validacao: API focused suite 12 passed, worker focused suite 8 passed, extension `npm.cmd run typecheck` passed, extension `npm.cmd run build` passed. Guard `rg "linkedin_jobs_external|LinkedIn Jobs|linkedin-jobs" apps\web` retornou sem matches. Pendencias antes de considerar runtime real validado: smoke manual no LinkedIn para direct URL sem geoId, eventual geoId, fallback/click path, mistura Easy Apply/unsupported/duplicate/accepted e verificacao visual na lane `External applications`.

## Hotfix LinkedIn Jobs External Search Tab Opening - 2026-07-23

O popup de `Search > External jobs > LinkedIn Jobs` ficava preso em `opening` porque `apps/extension/background.ts` ainda nao roteava a mensagem `START_LINKEDIN_JOBS_EXTERNAL_CAPTURE`; o background ignorava a chamada e nao executava `chrome.tabs.create`. O listener agora trata esse fluxo antes do handler antigo de `START_LINKEDIN_CAPTURE`, abre a aba LinkedIn Jobs, reporta falhas por `LINKEDIN_JOBS_EXTERNAL_PROGRESS` e preserva o fluxo existente de captura de publicacoes. Validacao: `apps/extension npm.cmd run typecheck` passed e `apps/extension npm.cmd run build` passed.

## Hotfix LinkedIn Jobs Runtime Stabilization - 2026-07-23

A validacao manual mostrou que o LinkedIn Jobs assistido precisa abrir `https://www.linkedin.com/jobs/` e clicar em `Exibir todas` na secao `Vagas com base nas suas preferencias`; a URL direta fica apenas para o modo nao assistido. A extensao tambem passou a ouvir `LINKEDIN_JOBS_EXTERNAL_PROGRESS`, varrer a lista de resultados por scroll interno com dedupe de URLs vistas, emitir progresso durante a inspecao e finalizar o run como failed em timeout, evitando ficar preso em `pending` quando o DOM do LinkedIn para de responder. Validacao: `apps/extension npm.cmd run typecheck` passed e `apps/extension npm.cmd run build` passed.

## Hotfix LinkedIn Jobs Search Results Card Detection - 2026-07-23

A validacao assistida chegou corretamente em `/jobs/search-results/`, mas alguns layouts do LinkedIn nao expunham os resultados com as classes esperadas (`jobs-search-results__list-item`, `job-card-container` etc.), gerando `completed_no_results` apos olhar zero cards mesmo com vagas visiveis. O detector de cards agora tambem aceita `li.scaffold-layout__list-item`, seletores parciais de `jobs-search-results`/`job-card` e, principalmente, faz fallback por links `a[href*='/jobs/view/']`/`currentJobId`, subindo para o container mais proximo do resultado. Validacao: `apps/extension npm.cmd run typecheck` passed e `apps/extension npm.cmd run build` passed.

## Hotfix LinkedIn Jobs Detail Selection And Stale Runs - 2026-07-24

A validacao manual mostrou dois novos pontos de instabilidade: alguns cliques nos containers dos resultados nao trocavam a vaga selecionada no painel de detalhes, e quedas/interrupcoes de login podiam deixar runs `pending/running` bloqueando novas tentativas. O content script agora clica no anchor real `a[href*='/jobs/view/']`/`currentJobId` do card e espera o painel de detalhes conter o titulo/job id antes de ler Easy Apply ou link externo. A API passou a considerar runs browser-owned de LinkedIn Jobs sem heartbeat por 5 minutos como `failed` com `provider_error_code=stale_browser_capture` antes de criar nova busca. Validacao: `apps/api tests/contract/test_linkedin_jobs_external_contract.py` 4 passed, `apps/extension npm.cmd run typecheck` passed e `apps/extension npm.cmd run build` passed.

## Hotfix LinkedIn Jobs Immediate Interrupted Run Recovery - 2026-07-24

A extensao agora trata o erro `A LinkedIn Jobs external search is already pending or running` como sinal de run browser-owned interrompido: busca o ultimo run LinkedIn Jobs do usuario, finaliza como `failed/cancelled` quando ainda esta `pending/running` e tenta iniciar a captura novamente uma vez. Isso evita que uma queda de login/aba deixe o operador preso esperando a janela backend de stale recovery. Validacao: `apps/extension npm.cmd run typecheck` passed e `apps/extension npm.cmd run build` passed.

## Hotfix LinkedIn Jobs Preserve Search Results List - 2026-07-24

A validacao manual mostrou que clicar diretamente no anchor `a[href*='/jobs/view/']` pode navegar para a pagina full `/jobs/view/{id}` e remover a lista da esquerda. O content script deixou de usar o anchor como alvo de clique: agora seleciona o container do resultado (`li.jobs-search-results__list-item`, `li.scaffold-layout__list-item`, `li[data-occludable-job-id]`, `div.job-card-container` ou `div[data-job-id]`) e adiciona rollback se o LinkedIn ainda assim navegar para `/jobs/view/`. O detector de link externo tambem aceita textos como `Acessar site da empresa` para vagas onde o usuario ja se candidatou fora do LinkedIn. Validacao: `apps/extension npm.cmd run typecheck` passed e `apps/extension npm.cmd run build` passed.

## Hotfix LinkedIn Jobs Left List Scoped Selection - 2026-07-24

Manual validation showed that scanning the whole LinkedIn document could treat right-detail pane elements as result cards and dispatch selection clicks outside the left jobs list, including preference-match UI such as the "Correspondencia de preferencias" modal. The content script now discovers a concrete left results list root, scopes job card detection, dedupe, link counting, and scroll target discovery to that root, and refuses to inspect/click a result when the click target is outside the left jobs list. If no left list root is found, the capture fails closed with no cards instead of clicking arbitrary LinkedIn UI. Validation: `npm.cmd run typecheck` and `npm.cmd run build` passed for `apps/extension`.

## Hotfix LinkedIn Jobs Assisted List Fallback Detection - 2026-07-24

Manual validation showed that the conservative left-list scoping could fail with `no_renderable_results` on LinkedIn assisted jobs pages where visible result cards do not expose the expected `/jobs/view/` anchors or class names. The content script now still refuses to scan the full document, but can identify the left jobs column by visible layout, scrollability, repeated job-card signals, and job-like text. Card detection also includes `data-view-name*=job` and a fallback scan inside the already-confirmed left list only. Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed.

## Hotfix LinkedIn Jobs SDUI Stable Selectors - 2026-07-24

Manual DOM inspection of the current LinkedIn assisted jobs page showed that visible result cards are rendered as SDUI components with `componentkey="job-card-component-ref-*"` rather than stable LinkedIn job anchors/classes. The content script now treats `[componentkey^='job-card-component']` / `[componentkey*='job-card-component']` as primary card selectors, clicks the nearest `role="button"` ancestor for card selection, reads external apply links from `aria-label="Candidatar-se no site da empresa"` and LinkedIn safety redirect hrefs, and uses `button[data-testid='pagination-controls-next-button-visible']` for next-page navigation. Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed.

## Hotfix LinkedIn Jobs SDUI Dedupe And Selection Retry - 2026-07-24

Manual validation showed that some LinkedIn SDUI job cards do not expose a `/jobs/view/` URL inside the card. `findLinkedInJobUrl()` previously fell back to `window.location.href`, causing multiple visible cards on the same assisted-results page to share one dedupe key and be skipped after the first inspections. The content script now returns `null` when no job URL is present and dedupes by `componentkey`, title/company/location text, or page position. It also scopes Easy Apply detection to the selected detail pane instead of `document.body`, and card inspection now retries multiple safe click targets inside the left list (`role=button`, SDUI component, then legacy containers) before failing. Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed.

## Hotfix LinkedIn Jobs External Link Before Easy Apply Diagnostics - 2026-07-24

Manual validation showed stable card clicking, but 40/40 inspected jobs were classified as `skipped_easy_apply` while several details showed `Candidatou-se no site da empresa` / `Acessar site da empresa`. The classifier now looks for external apply hrefs before applying the Easy Apply skip rule, so jobs with `aria-label="Candidatar-se no site da empresa"` or LinkedIn safety redirects are decoded and matched against selected curated sources first. LinkedIn Jobs diagnostic samples now prefer non-Easy-Apply/external-link cases and include `rawApplyHref`, `sourceKey`, and `skipReason` to confirm why no jobs were accepted. Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed.

## Hotfix LinkedIn Jobs Text-Based Apply Link Detection - 2026-07-24

Manual validation after a 15-page run showed visible external `Candidatar-se` buttons with no accepted or external links captured. The apply-link detector was simplified to scan all page anchors by string/aria-label and href semantics: `Candidatar-se no site da empresa`, `Acessar site da empresa`, `company site`, generic `Candidatar-se`/`Apply`, and LinkedIn safety/redir hrefs are treated as external apply candidates unless they are internal `/jobs/view/` or `Candidatura simplificada`. Each inspected job now logs `outcome`, `rawApplyHref`, `canonicalApplyUrl`, `sourceKey`, and `skipReason` to the LinkedIn tab console for debugging source matching. Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed.

## 2026-07-24 - Hotfix LinkedIn Jobs Long Run Completion Status

- Increased the LinkedIn Jobs content-script response timeout from 3 minutes to 45 minutes so 15-30 page assisted searches can finish submitting inspected candidates instead of leaving the backend run pending after the tab keeps scrolling.
- Emitted a local `submitting` progress event when the LinkedIn Jobs inspection reaches a terminal diagnostics state, making the popup reflect that the DOM scan ended and backend candidate submission is underway.
- Updated the LinkedIn Jobs diagnostics panel to prefer the latest local progress status over a stale persisted `pending` run status while the popup is receiving live progress.
- Validation: `npm.cmd run typecheck` and `npm.cmd run build` passed in `apps/extension`; build only reported the existing Plasmo/htmlnano warnings.

## 2026-07-25 - Hotfix LinkedIn Jobs Submit Only Accepted Candidates

- Changed LinkedIn Jobs external submission to send only deterministic `accepted` candidates to the API; Easy Apply and unsupported-source cards remain represented in diagnostics counters but no longer generate rejected candidate POSTs.
- Added `submitting` progress updates from the background while accepted LinkedIn Jobs candidates are being persisted, including every 5 submitted candidates and the final submitted count.
- This avoids long `submitting` pauses when a scan finds zero accepted candidates but dozens of skipped cards, and makes accepted persistence easier to monitor from the popup.
- Validation: `npm.cmd run typecheck` and `npm.cmd run build` passed in `apps/extension`; build only reported existing Plasmo/htmlnano warnings.

## 2026-07-25 - Hotfix LinkedIn Jobs Apply Link Scope

- Diagnosed VPS candidate rows showing `unsupported_source` application URLs like `https://about.linkedin.com/pt-br`, `http://node.js/`, and `http://next.js/`, proving the LinkedIn Jobs detector was accepting generic external links from the whole page/job description instead of only the apply button.
- Restricted LinkedIn Jobs apply-link detection to links whose visible text or aria-label indicates application intent (`Candidatar-se`, `Acessar site da empresa`, `company site`, `Apply`, etc.) and excluded footer/nav/header/aside anchors; raw external redirects alone are no longer enough.
- Added a bounded wait for the job apply state after card selection and made Easy Apply detection read only a real job-detail pane, preventing left-list `Candidatura simplificada` text from being interpreted as the selected job's button while the right pane is still loading.
- Backend LinkedIn Jobs completion now reapplies final diagnostics counters after candidate reconciliation so runs can preserve inspected/rejected counts even when only accepted candidates are persisted.
- Validation: `apps/extension npm.cmd run typecheck`, `apps/extension npm.cmd run build`, and `python -m compileall apps/api/app/services/job_search_run_service.py` passed. Local Docker API contract test could not run because Docker Desktop was not active.

## 2026-07-26 - Hotfix LinkedIn Jobs Apply CTA Redirect Resolution

- Manual validation still showed visible blue `Candidatar-se` buttons with external-link UI, but LinkedIn rendered the anchor `href` as an internal `/jobs/view/...` tracking URL instead of the final ATS URL.
- The extension now treats `linkedin.com/jobs/view/...` as non-canonical for external applications, preserving `/safety/` and `/redir/` decoding only when those redirects point to a real external URL.
- When the apply CTA has application intent but its `href` cannot be canonicalized, the content script asks the background to click the selected CTA in a controlled `_blank` context, watch the newly opened tab until it resolves to a non-LinkedIn URL, close that auxiliary tab, and continue source matching with the resolved ATS URL.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.

## 2026-07-26 - Hotfix LinkedIn Jobs Button Apply CTA Without Href

- Manual DevTools inspection showed current LinkedIn Jobs detail panes can render the visible external `Candidatar-se` CTA as `BUTTON.jobs-apply-button` with `href=null`; earlier detection only scanned `a[href]`, so these jobs were invisible to the apply-link resolver even though the button text/aria was present.
- The content script now treats `a[href]`, `button`, and `[role='button']` with application intent text/aria as apply CTA candidates. Candidates without href are passed to the background resolver instead of being classified as missing/Easy Apply.
- The background resolver now searches/clicks `a[href]`, `button`, and `[role='button']`, logs the selected CTA (`tag`, `label`, `href`), observes the opened external tab, logs the resolved result, and returns the external URL for source matching.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.

## 2026-07-26 - Hotfix LinkedIn Jobs Share Profile Intermediate Modal

- Manual validation showed that clicking a `BUTTON.jobs-apply-button` can open LinkedIn's intermediate "Gostaria de compartilhar seu perfil?" modal before the external ATS tab is opened.
- The background apply resolver now treats that dialog as part of the external-apply flow: after clicking `Candidatar-se`, it waits briefly for the share-profile modal, clicks `Continuar`/`Continue`, then captures the resulting non-LinkedIn tab URL for source matching.
- If no external URL resolves, the resolver attempts to close the share-profile modal so it does not block subsequent card inspections. Resolver logs now include CTA click, modal continuation, and final result.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.

## 2026-07-26 - Correction LinkedIn Jobs Share Profile Modal Handling

- Manual feedback clarified that the share-profile modal is not the expected user path for the visible external apply CTA. The resolver must not click `Continuar` automatically because that can share profile data and may indicate the automation selected an ambiguous/wrong CTA.
- The background resolver now treats `Gostaria de compartilhar seu perfil?` / `Share your profile` as an unexpected blocker: it logs the exact clicked CTA (`tag`, `className`, `label`, `outerHTML`), closes the modal when possible, and returns no resolved URL instead of continuing.
- This keeps the run from being stuck behind the modal while preserving enough evidence to tighten CTA selection based on the actual element clicked.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.

## 2026-07-26 - Hotfix LinkedIn Jobs Stop Hrefless Apply Button Clicks

- Manual validation showed the extension still opened LinkedIn's share-profile modal while resolving `BUTTON.jobs-apply-button` candidates without `href`.
- To stop destructive/ambiguous behavior, the content script now refuses click-based resolution for apply CTA candidates with `href=null`; it logs the hrefless CTA and returns no URL instead of clicking. The background resolver also has a guard that refuses hrefless CTA requests.
- This prevents automatic profile-sharing modals while preserving deterministic handling for anchors/redirect hrefs. The next diagnostic step is to inspect the button's surrounding DOM/dataset/form metadata without clicking to find where LinkedIn stores the external destination.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.

## 2026-07-27 - LinkedIn Jobs Hrefless Apply CTA Passive Diagnostics

- Manual DOM inspection confirmed current LinkedIn Jobs external apply CTAs can render as `BUTTON` with `role="link"`, `data-live-test-job-apply-button`, visible `Candidatar-se`, and no `href`.
- The extension now keeps hrefless CTA handling passive: it refuses click-based resolution and logs a diagnostic snapshot with `currentJobId`, CTA attributes/dataset/html, parent chain, recent `/voyager/` and `/jobs/` resource URLs, and JSON/code signals matching the job id.
- This is intended to identify where LinkedIn stores or fetches the external destination without opening tabs, clicking `Continuar`, or triggering profile-share modals.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.
- `linkedin_jobs_hrefless_cta_guard_hotfix`: em 2026-07-27, a extensao `Full-time` recebeu guardas para o fluxo LinkedIn Jobs quando CTAs `Candidatar-se` aparecem como `BUTTON.jobs-apply-button` sem `href`. O popup agora trata resposta vazia/erro do background sem quebrar em `diagnostics` indefinido; o content-script reduz `resourceUrls` do snapshot para URLs escopadas ao `currentJobId`; e a inspe��o aborta/restaura a URL quando um clique de card leva para fora de `/jobs/search` (ex.: `/feed/`). Nao houve mudanca de schema nem migration. O diagnostico atual confirma que resources passivos nao exp�em o ATS; se for necessario clicar para descobrir destino, o proximo passo deve usar uma aba descartavel para nao interromper a coleta principal nem avan�ar modal de compartilhar perfil automaticamente.
- `linkedin_jobs_disposable_apply_resolver`: em 2026-07-27, a extensao `Full-time` passou a resolver CTAs `Candidatar-se` sem `href` por uma aba descartavel criada pelo background. O content-script envia `pageUrl`, `expectedHref` e `expectedLabel`; o background abre a vaga em aba inativa, clica somente o CTA ranqueado dentro do detalhe da vaga, observa a aba temporaria/aba filha ate surgir uma URL nao-LinkedIn, fecha as abas auxiliares e devolve a URL externa para matching/dedupe. O codigo antigo que clicava o CTA na aba principal e o bloqueio passivo de `href=null` foram removidos. Se o LinkedIn exibir modal de compartilhar perfil, o resolver registra `share_profile_blocked` e fecha a aba descartavel sem clicar `Continuar`. Nao houve mudanca de schema nem migration.
- `linkedin_jobs_disposable_resolver_wait_hotfix`: em 2026-07-27, o resolver descartavel de `Candidatar-se` passou a esperar ate ~8s pelo CTA renderizado dentro da aba auxiliar antes de clicar. Isso cobre o caso observado em que a aba temporaria ficava em skeleton de `/jobs/search/` e o clique era tentado cedo demais. Quando nenhum CTA aparece, o diagnostico agora inclui `pageUrl` e um resumo de `bodyText` para separar skeleton/login/rate-limit de seletor quebrado. Nao houve mudanca de schema nem migration.
- `freelance_outreach_retry_after_failed_send`: em 2026-07-27, o dedupe de outreach do `Freelance` passou a considerar o evento mais recente do primeiro contato por lead/campanha/canal/stage. Eventos `sent`, `queued_send` ou status `queued`/`sending`/`sent` continuam bloqueando duplicidade; se o evento mais recente for `failed_send`, uma nova tentativa e permitida. Isso corrige o caso em que um `queued_send` antigo bloqueava retry mesmo depois de falha de provider. Nao houve mudanca de schema nem migration.
- `linkedin_jobs_current_tab_hrefless_apply_resolver`: em 2026-07-27, a extensao `Full-time` ajustou novamente o resolver de CTAs `Candidatar-se` sem `href`. Validacao manual mostrou que duplicar `jobs/search/?currentJobId=...` em aba descartavel pode recriar apenas a pagina LinkedIn/skeleton e nao o mesmo estado SPA da vaga ativa, enquanto o clique manual na aba atual abre o ATS externo (ex.: Gupy). Para esses CTAs sem `href`, o content-script agora pede ao background para clicar o CTA na aba atual, observar a aba externa criada, fechar a aba auxiliar e devolver somente URL nao-LinkedIn para matching. Nao houve mudanca de schema nem migration.
- `linkedin_jobs_hrefless_apply_resolver_loop_guard`: em 2026-07-27, a extensao `Full-time` recebeu memoizacao/in-flight cache por vaga/CTA para impedir que o polling de `waitForJobApplyState()` clique repetidamente no mesmo `Candidatar-se` sem `href`. O resolvedor agora tenta a captura externa uma vez por `currentJobId + pageUrl + label`, reutiliza o resultado durante a inspecao da vaga e evita abrir/fechar a mesma URL varias vezes. Nao houve mudanca de schema nem migration.
- `linkedin_jobs_external_url_stabilization`: em 2026-07-27, o resolvedor de CTAs externos do LinkedIn Jobs passou a aguardar ~1.2s depois da primeira URL nao-LinkedIn antes de capturar/fechar a aba auxiliar. Isso permite que encurtadores ou redirects intermediarios resolvam para a URL ATS final antes do matching/dedupe. Nao houve mudanca de schema nem migration.
- `linkedin_jobs_external_tab_and_source_alias_hotfix`: em 2026-07-27, a extensao `Full-time` corrigiu dois problemas observados na validacao manual: abas ATS abertas pelo clique em `Candidatar-se` nem sempre carregam `openerTabId`, entao o background agora rastreia abas novas externas criadas na mesma janela durante a resolucao; e Greenhouse tambem pode usar `job-boards.greenhouse.io`, nao apenas `boards.greenhouse.io`. O matcher ganhou aliases para Greenhouse e Gupy, com cobertura para `brq.inhire.app` e `job-boards.greenhouse.io`. A estabilizacao de URL externa subiu para ~2s para cobrir redirects/encurtadores. Nao houve mudanca de schema nem migration.

- `linkedin_jobs_source_substring_match_hotfix`: em 2026-07-27, o matcher de fontes externas do LinkedIn Jobs foi simplificado para aceitar URLs canonicas que contenham qualquer sinal normalizado da fonte selecionada: chave da fonte, dominio cadastrado ou alias conhecido. Isso evita perder ATS como `job-boards.greenhouse.io` quando a fonte configurada e `greenhouse`/`boards.greenhouse.io`. Fontes inativas ou nao selecionadas continuam bloqueadas. Nao houve mudanca de schema nem migration.

- `linkedin_jobs_detail_pane_selection_hotfix`: em 2026-07-27, a extensao Full-time corrigiu um falso positivo no carregamento do detalhe de vagas LinkedIn Jobs. O wait de selecao nao usa mais document.body para comparar titulo, porque o titulo tambem aparece na lista esquerda e podia fazer a inspe��o ler o apply CTA da vaga anterior. Agora o titulo precisa estar no painel real de detalhe, ou a URL precisa conter o job id esperado. Isso deve corrigir casos em que InHire/Greenhouse abriam manualmente mas nao entravam como ccepted. Nao houve mudanca de schema nem migration.

- `linkedin_jobs_internal_href_current_tab_resolver_hotfix`: em 2026-07-27, a extensao Full-time corrigiu CTAs Candidatar-se que exibem UI externa, mas cujo href no DOM e interno do LinkedIn (/jobs/view/...alternateChannel=search). Esses casos agora usam o mesmo resolvedor de aba atual usado para CTAs sem href, observando a aba ATS externa aberta pelo clique real. O detector de Easy Apply tambem passou a exigir um controle/botao com label de Easy Apply/Candidatura simplificada, evitando classificar vagas externas InHire como Easy Apply por texto solto no painel. Nao houve mudanca de schema nem migration.

- `linkedin_jobs_apply_cta_ranking_debug_hotfix`: em 2026-07-27, a extensao `Full-time` corrigiu a escolha do CTA `Candidatar-se` antes do source matching. O content-script nao usa mais o primeiro `button/a/[role=button]` encontrado no DOM; agora ranqueia candidatos visiveis do painel de detalhe, prioriza texto de candidatura/site da empresa, penaliza href interno do LinkedIn e registra `[Opportunity Desk] selected LinkedIn apply CTA candidate` com label/href/score/diagnostico. O matcher de fonte segue simples por `includes` contra chave/dominio/alias selecionado, e agora loga `[Opportunity Desk] LinkedIn external source match` com `matchedSignals` para diagnosticar InHire/Greenhouse. Nao houve mudanca de schema nem migration.

- linkedin_jobs_source_registry_gupy_aliases: em 2026-07-27, a lista oficial de fontes ATS removeu Teamtailor e adicionou Gupy. O matcher da extensao agora tem aliases por substring para todas as fontes visiveis: InHire, Ashby, Lever, Greenhouse, Gupy, SmartRecruiters, Trampos e Catho. Nao houve mudanca de schema nem migration.


- `linkedin_jobs_url_only_source_decision_debug`: em 2026-07-27, a extensao `Full-time` recebeu logs focados somente na URL resolvida da aba externa e na decisao de matching por `includes`. O console agora deve mostrar `LinkedIn Jobs capture configuration`, `LinkedIn apply resolver URL result`, `LinkedIn apply state after selecting job` e `LinkedIn external source URL decision`, incluindo `canonicalApplyUrl`, `searchableUrl`, `selectedSourceKeys`, `checkedSources`, `matchedSignals`, `accepted` e o motivo de recusa. Logs antigos de snapshots/passive resource scanning foram removidos para reduzir ruido. Nao houve mudanca de schema nem migration.

- `linkedin_jobs_observed_external_url_fallback`: em 2026-07-28, a extensao `Full-time` corrigiu o caso em que o background observava uma aba externa real em `observedApplyTabs` (`isExternal: true`, ex.: `jobs.micro1.ai`, `*.inhire.app`), mas ainda retornava `url: null`/`click_failed` para o content-script. O resolver agora guarda a primeira URL externa observada e usa essa URL como fallback de sucesso quando o resultado estabilizado ou o retorno do script de clique vier vazio/amb�guo. Isso evita diagnosticos falsos `missing_external_apply` quando o clique em `Candidatar-se` de fato abriu um ATS externo. Nao houve mudanca de schema nem migration.

- `linkedin_jobs_pagination_advance_guard`: em 2026-07-28, a extensao `Full-time` corrigiu um falso `max_pages_reached` no LinkedIn Jobs External Search. A captura agora valida que a paginacao realmente avancou depois do clique em proxima pagina comparando `start` da URL e uma amostra das vagas visiveis antes/depois. Se o LinkedIn mantiver a mesma pagina/lista, o run encerra com `pagination_stalled` e loga `[Opportunity Desk] LinkedIn Jobs pagination advance result` com `previousUrl`, `currentUrl`, `previousStart`, `currentStart`, `previousKeys`, `currentKeys` e motivo. Nao houve mudanca de schema nem migration.

- linkedin_jobs_pagination_strict_start_guard: em 2026-07-28, a extensao Full-time corrigiu a contagem falsa de paginas no LinkedIn Jobs External Search. A lista virtualizada do LinkedIn muda cards durante scroll e isso nao pode contar como pagina nova. Agora a captura so aceita avanco de pagina quando o parametro real start da URL aumenta; mudanca de cards (listChanged) fica apenas como diagnostico. O seletor fallback de proxima pagina tambem ficou restrito a controles de paginacao/links com start maior, evitando clicar em texto/botao de vaga. Sem migration.
- `linkedin_jobs_long_run_timeout_hotfix`: em 2026-07-28, o timeout do background para `LinkedIn Jobs External Search` deixou de ser fixo em 45 minutos e passou a escalar com `maxPages` (`8min/pagina`, minimo 15min e teto 3h). Isso evita que buscas longas que chegam ate a pagina final sejam marcadas como `dom_inspection_failed` antes de retornar candidatos aceitos para persistencia. Sem migration.

## 2026-07-30 - LinkedIn assisted jobs search channel fix

- Extension: assisted LinkedIn Jobs search now opens `https://www.linkedin.com/jobs/` first, clicks the visible assisted `Exibir todas`/`Show all` entry, and only then starts the shared results capture.
- Reason: navigating during the long `CAPTURE_LINKEDIN_JOBS_EXTERNAL` message can unload the content script and close Chrome's message port, causing `Receiving end does not exist` and `message channel closed` failures.
- Direct LinkedIn Jobs search remains unchanged.
- Verification: `npm.cmd run typecheck` in `apps/extension`.
- Migration: not required.



## 2026-08-05 - LinkedIn Jobs Results List Scroll Cleanup

- Extension: LinkedIn Jobs capture no longer falls back to `window.scrollBy()` when the left results list scroller is not detected. This prevents the assisted flow from scrolling into the LinkedIn footer/help panel and continuing from a broken page state.
- The content script now prefers the scrollable ancestor of the current job cards, returns `advanced/atEnd` diagnostics for result-list scrolling, stops retrying when the list cannot advance, and caps each logical page at 25 newly inspected jobs before attempting pagination.
- External apply resolution uses the current LinkedIn Jobs tab for hrefless or internal LinkedIn apply CTAs, preserving the SPA state that opens the real ATS tab while the background observes and closes the auxiliary external tab.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.
- Migration: not required.


## 2026-08-06 - LinkedIn Jobs Apply CTA Pointer Activation

- Extension: the LinkedIn Jobs apply resolver now activates the selected `Candidatar-se` CTA with focus plus pointer/mouse events before the fallback `.click()`. This preserves the current-tab resolver path for hrefless/internal LinkedIn CTAs while improving compatibility with LinkedIn buttons that do not react to a bare programmatic click.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.
- Migration: not required.


## 2026-08-06 - LinkedIn Jobs Resolver Debug Bridge

- Extension: LinkedIn Jobs content-script diagnostics are now bridged to the service worker via `LINKEDIN_JOBS_DEBUG`, so Opera/Chrome extension DevTools show CTA selection, apply-resolution requests, resolver responses, apply state, and inspected-job outcomes in the same console as background progress.
- The background resolver also logs `LinkedIn apply resolver request` and `LinkedIn apply resolver response`, including `sourceTabId`, clicked CTA metadata, observed tabs, and selected CTA candidates.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.
- Migration: not required.


## 2026-08-06 - LinkedIn Jobs Detail Selection Title Normalization

- Extension: LinkedIn Jobs card titles are now normalized before detail-pane validation, including removal of the `(Vaga verificada)` badge and collapse of repeated title text produced by LinkedIn's nested card markup.
- The detail selection wait now emits `job_detail_selection_attempt`, `job_detail_selection_matched`, and `job_detail_selection_failed` through the service-worker debug bridge, and can accept a current URL `currentJobId` selection when the card did not expose a reliable job URL.
- Cause diagnosed from manual logs: captures were producing only `inspected_job` failures and never reaching `selected_apply_cta_candidate` / `request_apply_resolution`, so the apply CTA was not being searched or clicked yet.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.
- Migration: not required.

## 2026-08-06 - LinkedIn Jobs Full Flow Debug Instrumentation

- Extension: LinkedIn Jobs capture now emits service-worker debug events around the whole card-to-apply path: `job_card_click_before`, `job_card_click_after`, `job_detail_selection_attempt/matched/failed`, `job_detail_selection_abort`, `selected_apply_cta_candidate`, `no_apply_cta_candidate`, `request_apply_resolution`, `apply_resolver_url_result`, and `inspected_job`.
- Current diagnosis from operator logs: the run was failing before CTA discovery. It selected/scrolled cards and pages, but aborted at detail-pane validation, so the `Candidatar-se` button was never searched/clicked for those candidates.
- The selection wait now logs URL/job-id/title/pane snapshots and falls back to the page body only when LinkedIn has a current job id, making the next manual run distinguish selection failure from CTA/resolver failure.
- `no_apply_cta_candidate` logs visible controls from the detail pane/body with a 1.5s throttle to avoid flooding the service worker console.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.
- Migration: not required.

## 2026-08-06 - LinkedIn Jobs Direct Href And Source Decision Diagnostics

- Extension: LinkedIn Jobs now emits `capture_configuration` to the service-worker debug bridge with selected source keys, available sources, assisted mode, and page cap.
- The apply resolver now emits `apply_href_direct_external_candidate` when a `Candidatar-se` CTA already exposes a LinkedIn safety/redir href that decodes to an external ATS URL. In this branch the code intentionally does not click/open a tab because the external URL is already available from the href.
- The source matcher decision now emits `external_source_url_decision` through the service-worker bridge, including requested/normalized selected source keys, available source keys, checked source signals, matched signals, reason, and accepted/matched source key.
- Diagnosis from the latest operator log: at least some jobs were not failing to find/click the CTA. They reached `selected_apply_cta_candidate` and produced canonical URLs such as `job-boards.greenhouse.io/...` and `dwsbrazil.gupy.io/...`, then were rejected as `unsupported_source` with `no_selected_source_signal_matched`.
- Validation: `apps/extension npm.cmd run typecheck` passed and `apps/extension npm.cmd run build` passed; build only reported the existing Plasmo `punycode` deprecation and `svgo`/htmlnano warning.
- Migration: not required.

## LinkedIn Jobs Injected CTA Click Diagnostic Note

2026-08-14: the hrefless `Candidatar-se` button resolver was narrowed to a background injection issue, not a CTA selector issue. Logs showed `selected_apply_cta_candidate`, `apply_resolution_strategy=current_tab_button_click`, and `apply resolver request`, followed by `scriptReturnedNoResult=true` and `observedApplyTabs=[]`. The injected function was referencing the background helper `waitInPage`, which is not available after `chrome.scripting.executeScript({ func })` serializes the function into the LinkedIn page. The resolver now uses an injected-page-local delay helper and returns structured diagnostics (`phase`, selected element, dispatch results, tab snapshots) instead of failing as `null`.

## LinkedIn Jobs Duplicate External Tab Fix Note

2026-08-14: after the hrefless apply button resolver started executing correctly, logs showed one resolver window observing two external candidate tabs (`candidateExternalTabIds: Array(2)`) for the same `Candidatar-se` CTA. The injected script was still dispatching a synthetic `MouseEvent("click")` and then calling `element.click()`, which could activate LinkedIn's apply handler twice. The resolver now dispatches only pointer/mouse hover/down/up events and uses a single final `element.click()` activation. Cleanup also closes every observed external candidate tab, not only the last `openedTabId`.

## 2026-08-21 - Freelance WhatsApp First Contact Template Support

- apps/web now supports Twilio WhatsApp approved templates for first-contact bulk outreach. When `TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID` is configured, the Twilio provider sends `ContentSid` and `ContentVariables` instead of freeform `Body`.
- WhatsApp bulk generation now creates the deterministic `primeiro_contato_site_v1` preview and stores numbered Twilio variables in `generationInputContext.twilioWhatsAppTemplate.contentVariables`. Variable 9 is an AI-generated `customText`, sanitized to one line and capped at 600 characters.
- Existing checkbox -> Generate WhatsApp -> Generate drafts -> review -> Approve delivery flow is preserved. Email generation remains unchanged. No database migration required.
- Validation: `apps/web npx.cmd tsc --noEmit` passed; focused `apps/web npm.cmd run test -- --run tests/unit/whatsapp-provider.test.ts tests/unit/bulk-generation-context.test.ts tests/unit/bulk-outreach-selection.test.ts tests/unit/bulk-outreach-eligibility.test.ts tests/integration/bulk-outreach-whatsapp-flow.test.tsx tests/integration/bulk-outreach-delivery-flow.test.tsx` passed (6 files, 14 tests).

## 2026-08-21 - Freelance WhatsApp English Template SID Support

- apps/web now preserves `TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID` as the Portuguese/default Twilio Content SID and adds `TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID_EN` for the English first-contact template.
- WhatsApp draft generation stores `twilioWhatsAppTemplate.templateLanguage` as `pt-BR` or `en`; bulk approval passes that language to the provider so Twilio selects the matching Content SID while keeping the existing checkbox -> generate -> review -> approve flow.
- The English template uses the same 9-variable order as the Portuguese template under `first_contact_website_v1`. No database migration required.
- Validation: `apps/web npx.cmd tsc --noEmit` passed; focused `apps/web npm.cmd run test -- --run tests/unit/whatsapp-provider.test.ts tests/unit/bulk-generation-context.test.ts` passed (2 files, 9 tests).

## 2026-08-24 - Freelance WhatsApp Inbox MVP

- apps/web now has a WhatsApp inbox MVP for Twilio WhatsApp Business Platform replies: public webhook `POST /api/twilio/whatsapp/webhook`, authenticated inbox APIs under `/api/freelance/whatsapp/conversations`, and page `/inbox` in the Freelance sidebar.
- Added Prisma models `WhatsAppConversation` and `WhatsAppMessage`, with inbound/outbound direction, contact phone, lead linkage when phone matches an existing lead, provider SID/status, unread count, and last-message metadata.
- Existing WhatsApp sends through bulk/lead outreach now also record outbound messages into the inbox when Twilio accepts the message. Inbox replies send freeform WhatsApp messages through the existing Twilio provider, intended for the customer-care 24h reply window after a lead answers.
- Twilio webhook signature validation is implemented with `TWILIO_AUTH_TOKEN`; local/ngrok troubleshooting can explicitly disable it with `TWILIO_DISABLE_WEBHOOK_VALIDATION=true`.
- Validation: `apps/web npx.cmd tsc --noEmit` passed; focused `apps/web npm.cmd run test -- --run tests/unit/whatsapp-provider.test.ts tests/unit/bulk-generation-context.test.ts tests/unit/whatsapp-conversation-service.test.ts` passed (3 files, 11 tests). Prisma Client generation passed. Local migration application was attempted but blocked because `localhost:5433`/`freelance-postgres` was not reachable/running.


## 2026-08-25 - WhatsApp Template Validation And Bulk Review UX

- The Templates page now shows the exact approved Portuguese and English Twilio first-contact bodies, their 9-variable mapping, and whether each language SID is configured. The old generic first-contact seed is now Email-only; a provider-managed WhatsApp system template supplies bulk generation.
- First-contact variables are guaranteed non-empty and single-line before delivery. The Twilio provider blocks invalid variables locally, requires the language-specific SID, and no longer falls back from a missing English SID to the Portuguese SID.
- Brazilian outreach phone normalization now adds the mandatory ninth digit to legacy mobile-looking numbers while preserving landlines and already-modern mobile numbers.
- Lead bulk actions now mirror the extension interaction: checkbox selection exposes floating Email and WhatsApp icon actions, and generation/review occurs in a modal. Missing, invalid, and duplicate leads are skipped while eligible leads continue. A duplicate-only selection is reported as already contacted, not missing WhatsApp.
- Validation: production build passed; TypeScript passed; 3 focused test files passed with 13 tests. Local database bootstrap passed after Postgres became healthy. Playwright CLI browser startup was attempted but its WSL wrapper stalled and was terminated, so automated screenshot verification remains pending.


## 2026-08-26 - Docker Web Runtime OpenSSL

- Added a shared Node 22 Bookworm runtime image for the freelance web app and worker.
- Installed OpenSSL and CA certificates in the image so Prisma can detect the supported runtime library.
- Full VPS restarts should use `docker compose --env-file .env.local`; named database volumes must be preserved.
- The Chrome extension is not a Compose service. Build it separately from `apps/extension` and reload the generated unpacked extension in Chrome.


## 2026-08-26 - WhatsApp Sender Diagnostics

- Twilio error 63007 was isolated to sender/account configuration, after template-variable validation succeeded.
- WhatsApp readiness now states that environment values are present without claiming Twilio remotely validated sender ownership or ONLINE status.
- Batches with only failed deliveries now finish as `failed`; repeated approval reports the stored provider failure instead of returning an empty result and does not retry automatically.
- Validation: focused provider/status tests passed (11 tests) and TypeScript passed.

## 2026-08-27 - WhatsApp Inbox Outbound Reconciliation

- Fixed the bulk approval path so every Twilio-accepted WhatsApp send creates the outbound inbox
  conversation/message immediately; previously only direct inbox replies called the persistence service.
- Added `POST /api/twilio/whatsapp/status` with Twilio signature validation and monotonic delivery
  reconciliation for `sent`, `delivered`, `read`, `failed`, and `undelivered`.
- Added provider-status labels to outbound inbox bubbles and the idempotent
  `npm run whatsapp:backfill-inbox` command for already-sent bulk messages.
- Authentication was not the cause of the empty inbox: the current unconnected flow and its batches
  both use the configured fallback owner (`DEFAULT_FREELANCE_USER_ID` or `local-operator`).
- Validation: web TypeScript passed, production build passed, and 3 focused test files passed with
  14 tests before the monotonic-status assertions were added; final focused validation is required.
- Migration: not required.

## 2026-08-27 - Brazilian WhatsApp Ninth-Digit Guard

- Centralized Brazilian E.164 normalization and now applies it when leads are saved, bulk recipients
  are prepared, inbox addresses are matched, and immediately before Twilio receives the `To` value.
- Legacy mobile `+556182724656` is sent as `whatsapp:+5561982724656`; Brazilian landlines and the
  configured Twilio `From` sender remain unchanged.
- Added `npm run whatsapp:normalize-lead-phones` to repair existing lead records idempotently.
- Historical delivery records are intentionally immutable; a past `delivered` status must be checked
  by Twilio Message SID and is not silently reclassified after phone repair.
- Migration: not required.

## 2026-08-27 - WhatsApp Delivery-Time Localization

- Fixed Twilio template variable 7 so a saved `deliveryTime` such as `15 days` becomes `15 dias`
  for `pt-BR`, while `15 dias` becomes `15 days` for English.
- The approved Twilio templates remain unchanged because the complete timeline is already variable
  `{{7}}`; the defect was in local variable construction.
- Existing generated drafts are immutable snapshots and must be regenerated to receive the fix.
- Validation: focused WhatsApp generation/provider/phone/inbox suite passed with 17 tests; TypeScript passed.
- Migration: not required.

## 2026-08-27 - Database Phone Integrity And Reply Test Readiness

- Added migration `20260827000100_brazilian_phone_integrity`: repairs legacy Brazilian mobile
  numbers, including GFig `+556182724656` to `+5561982724656`, and adds general E.164 plus
  Brazil-specific phone/WhatsApp check constraints.
- Invalid Brazilian contacts that cannot be normalized are cleared instead of remaining sendable.
- Duplicate first-contact protection now keys the blocking event to the actual recipient, allowing
  one corrected-number send while still blocking repeats to the same destination.
- The final Twilio provider rejects invalid recipients locally before making an HTTP request.
- Migration SQL was validated against PostgreSQL: repaired GFig correctly, preserved a US E.164
  number, and rejected insertion of the old incomplete Brazilian mobile.
- Migration: required.
