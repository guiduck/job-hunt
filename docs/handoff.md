# Handoff

## Status Atual

- `fase_atual_roadmap`: Fase 3 / 3.5 - Full-time LinkedIn MVP com filtros inteligentes pos-captura
- `etapa_atual_action_plan`: preparar smoke manual do primeiro recorte do AI Field Assistant em
  formularios externos reais
- `status_resumido`: a extensao Plasmo opera o fluxo `Full-time` local com login persistente, captura
  autenticada de posts do LinkedIn, listagem/detalhe de vagas, delete individual/bulk, templates,
  curriculos, login Google primary auth, Gmail OAuth, envio individual, bulk send revisavel com IA e
  busca LinkedIn simplificada com filtros opcionais por IA pos-captura. O feedback de captura acompanha o run do worker ate status
  terminal antes de marcar a analise como concluida, evitando contadores finais zerados enquanto a IA
  ainda esta processando. A tentativa de adicionar uma fonte externa de vagas com
  enriquecimento de email foi descartada por baixa utilidade real: muitas respostas direcionavam para
  carreira/ATS/formulario, sem vantagem para o produto de outreach por email.
- `decisao_recente`: remover codigo, specs, configs e UI da fonte externa; preservar melhorias
  independentes como feedback de captura, checkbox mestre de selecao, `Delete all listed`, dedupe visual
  de nomes, filtro Review removido e estado persistido do popup. Apos estabilizar login Google, a spec
  `010-ai-field-assistant` foi implementada em primeiro recorte com API owner-scoped, botao de varinha
  em campos externos, respostas recentes por keyword, shell `Pin assistant`, Settings para ativacoes e
  popup sem header/menu antes do login. O recorte foi hardenizado depois de smoke real no LinkedIn:
  campos dinamicos passam a receber o botao sem refresh manual, o menu de resposta fica contido no
  viewport visivel, Settings permite marcar quais curriculos entram como contexto do assistente, e a
  shell persistente ganhou preenchimento em massa com respostas salvas primeiro e IA apenas quando o
  operador escolher.
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
  (6 passed).

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
- feedback visual de captura/run no painel de Search, com status do run separado do status da captura
  e contadores atualizados durante o processamento do worker; valores compostos de modo de trabalho
  retornados pela IA nao devem derrubar o endpoint de candidates
- dedupe de vagas deve usar empresa/cargo quando disponiveis e usar a URL do post como desempate quando
  empresa/cargo nao foram extraidos
- Jobs UI sem filtro Review
- checkbox mestre `All listed` para selecionar/desselecionar todas as oportunidades listadas
- `Delete all listed` sempre respeitando os filtros atuais da lista
- bulk email limitado a 50 selecionadas por vez
- estado persistido para aba, filtros, selecao, modal bulk, detalhe selecionado e progresso de captura
- cards usando titulo/cargo da vaga como label principal, com dedupe de nomes repetidos
- input unico de busca em Jobs cobrindo descricao, keywords, cargo, empresa e email de contato salvo
- login Google do app separado do OAuth Gmail de envio, com linking por email verificado
- logs estruturados de AI filter no worker
- assistente de campos externos com botao de varinha magica e respostas recentes por keyword, usando
  IA backend-only, curriculos selecionados como contexto extraido no backend, menu contido no viewport
  e shell persistente injetada por content script com acoes `Fill saved` e `Fill with AI`; primeiro
  recorte implementado e aguardando smoke manual ampliado em sites reais

## Decisao Sobre Fonte Externa De Vagas

A fonte externa de vagas com enriquecimento posterior de email nao deve entrar na aplicacao agora.
Motivo: mesmo quando acha emails publicos, o retorno pratico tende a ser "aplique pelo site de
carreiras" ou "use este portal", o que torna o fluxo pouco util para outreach direto.

Remover/evitar:

- botao separado de busca por fonte externa na Search UI
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

## Pendencias Prioritarias

- fazer smoke manual completo de `specs/010-ai-field-assistant` em paginas externas: ativar dominio,
  abrir `Pin assistant`, confirmar botoes sem refresh, gerar resposta com curriculo marcado como
  contexto, inserir/substituir/anexar no fim da tela, salvar sugestao manual, usar `Fill saved`/`Fill
  with AI` e confirmar que campos sensiveis nao recebem botao
- ajustar isolamento visual do assistente para iframe/shadow-root se sites reais entrarem em conflito
  com o DOM/CSS injetado atual
- completar as partes realmente assincronas/worker-owned de AI bulk generation e feedback pos-envio
- executar smoke manual completo de extensao com LinkedIn real, AI filters, Jobs pagination, Google
  auth e Gmail OAuth/send
- melhorar feedback pos-envio ate status final por item
- revisar contratos/testes legados de auth/ownership e campos recentes do fluxo `Full-time`
- smoke manual do LinkedIn real depois de build/restart
- planejar futuramente retencao/limpeza automatica de vagas antigas por politica configuravel

## Proximo Passo Spec Kit Recomendado

`/speckit-implement` executou o primeiro recorte de `specs/010-ai-field-assistant/tasks.md`. Entregue:
modelos/migration/rotas API `field-assistant`, geracao de respostas usando contexto de perfil/resumo
no backend, sugestoes salvas owner-scoped por keyword com limite de 3, clientes/tipos da extensao,
content script `field-assistant`, shell `Pin assistant`, Settings para ativacoes, ocultacao de header e
tabs sem sessao e documentacao atualizada. `tasks.md` ficou com 84/88 tarefas marcadas; continuam
abertas apenas duas tarefas de teste especifico de UI/auth e dois smokes manuais. Validacao: API 17
passed, extension typecheck passed, extension build passed com aviso de rede pos-build do Plasmo. O
hardening posterior adicionou selecao de curriculos para contexto, extracao de texto real do PDF no
assistente, varredura dinamica de campos, menu responsivo ao viewport, salvar respostas manuais e
preenchimento em massa via shell; a API local esta em `016_field_assistant_ctx`.

Antes disso, `/speckit-specify` criou `specs/010-ai-field-assistant/spec.md` a partir de
`docs/next-spec-prompt.md`. A spec cobre assistente de campos externos com IA, respostas recentes por
keyword, shell persistente da extensao, comportamento authenticated-only e nao-objetivos como
submissao automatica de formularios, limpeza de vagas antigas e retomada da fonte externa descartada.
Durante `/speckit-clarify`, foram adicionadas decisoes: ativacao por dominio base com opcao de pagina
exata, respostas salvas apenas por acao explicita, e substituicao do `Keep open` pela shell
persistente para usuarios autenticados. O documento raiz `PERSISTENT_EXTENSION_SHELL.md` explica a
diferenca entre popup, janela `Keep open` e UI injetada persistente. Em seguida, `/speckit-plan`
gerou `specs/010-ai-field-assistant/plan.md`, `research.md`, `data-model.md`, `quickstart.md`,
`contracts/openapi.yaml` e `contracts/extension-messages.md`, e atualizou `AGENTS.md` e
`.cursor/rules/specify-rules.mdc` para apontarem para o plano ativo `010`. Depois, `/speckit-tasks`
gerou `specs/010-ai-field-assistant/tasks.md` com 88 tarefas: setup/fundacao, US1 geracao e insercao
em campo, US2 respostas salvas por keyword, US3 shell persistente/ativacao por dominio, US4 UI
authenticated-only e polish/validacao.

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
