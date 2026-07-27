# Roadmap

Este arquivo descreve a direcao estavel do produto.

Para saber onde a execucao parou, qual e a fase atual e qual foi o ultimo prompt usado, consulte
`docs/handoff.md`.

## Assets De Processo Reutilizaveis

O projeto agora tambem serve como referencia para um workflow SDD reutilizavel em novos repos:

- `references/agent-sdd-boilerplate/` concentra um kit copiavel para Cursor + Codex + GitHub Spec Kit
  + Lovable, com regras, skills espelhadas, overlays dos comandos principais do Spec Kit e templates
  iniciais de docs.
- Cursor permanece a fonte canonica das skills longas em `.cursor/skills`; Codex usa mirrors em
  `.codex/skills` e `AGENTS.md` como brief de topo.
- O padrao preserva o ciclo docs-first -> prototipo navegavel -> Spec Kit -> implementacao escalavel
  -> closeout obrigatorio em docs, handoff, roadmap e proximo prompt.
- Gate futuro: se esse boilerplate for usado em varios projetos, criar um instalador/validador para
  copiar o kit, substituir placeholders e rodar validacao formal das skills.

## Fase 1. Fundacao Operacional

Objetivo: criar a base minima que permita captura e persistencia com qualidade.

- ambiente local com `Docker Compose` e `PostgreSQL`
- API em `FastAPI`
- usuarios individuais com login por email/senha antes do primeiro deploy real
- modelo central de oportunidades
- suporte desde o inicio a `freelance` e `job`
- persistencia de query, origem e evidencia

## Fase 2. Busca De Empregos

Objetivo: entregar o primeiro valor pratico buscando vagas e publicacoes de emprego com keywords
relevantes e contato util.

- keywords configuradas pelo usuario
- fallback mockado com termos como `reactjs`, `typescript`, `nextjs` e `nodejs`
- futura extracao de keywords do curriculo
- busca por publicacoes e anuncios no LinkedIn
- captura de empresa, vaga, email ou convite claro de contato, link e evidencia
- listagem em modo `Full-time Job`

Estado atual:

- provider/fetcher inicial do LinkedIn foi implementado no worker
- API possui metadados de run/candidato para provider status, source type e contato preferencial
- parser/normalizer aceita email publico como primeira preferencia e convite explicito de contato
  LinkedIn com link de perfil
- worker consome runs `pending` no PostgreSQL e grava candidatos/oportunidades end-to-end
- a extensao Plasmo usa a sessao logada do navegador para capturar posts do LinkedIn, criar runs
  autenticadas, exibir diagnosticos, acompanhar o processamento do run ate status terminal e revisar
  vagas pela API local
- a captura LinkedIn espera conteudo renderizavel antes do primeiro scroll, descobre o container
  scrollavel real e mede progresso por `scrollTarget`, `scrollTop`, altura e posts encontrados,
  reduzindo travamentos quando o LinkedIn carrega resultados depois do `complete` da aba ou quando a
  altura do documento nao muda a cada avancada
- quando o infinite scroll do LinkedIn aparenta travar no fim da lista, a extensao tenta dois scrolls
  para cima e uma nova descida antes de contabilizar falha, preservando `max scrolls` como contagem
  apenas dos scrolls principais
- a verificacao da captura na extensao tem timeout amplo; quando o worker nao conclui a tempo, a UI
  mostra timeout terminal e libera nova busca em vez de ficar presa em `processing`
- o feedback da Search UI usa os counters do run como fonte principal e nao deve ficar zerado quando
  uma chamada detalhada de candidates encontra sinais de IA fora do enum esperado
- o dashboard `Full-time` usa metricas agregadas da API para total de vagas e vagas ainda nao
  enviadas, sem herdar filtros/paginacao da lista Jobs; campos legados como `with_email`, `saved` e
  `interviews` seguem no contrato por compatibilidade
- a deduplicacao de vagas usa URL do post como desempate quando empresa/cargo nao foram extraidos,
  evitando colapsar vagas diferentes do mesmo contato e mesmas keywords
- limites globais de candidatos por run foram removidos; limites futuros devem ser regras de produto
  por plano/assinatura
- a Search UI agora lembra a ultima busca usada pelo operador, salva novas palavras como badges
  owner-scoped com limite de 30, permite reutilizar/remover badges manualmente e continua iniciando
  captura somente com o texto atual do input
- a Search UI tambem oferece `Past month` como checkbox opcional para abrir a busca de conteudo do
  LinkedIn com `datePosted="past-month"` junto do sort recente, aumentando a diversidade de posts
  capturados sem alterar o contrato da API
- a spec `017-extension-search-history` foi implementada para adicionar uma aba `history` na extensao
  `Full-time`, mostrando 20 runs LinkedIn recentes, agregados por query/keyword e o total bruto de
  resultados capturados no LinkedIn antes de dedupe, mantendo duplicatas como diagnostico separado
- a spec Full-time priorizada agora existe em `specs/018-linkedin-jobs-external-search/spec.md`: usar a aba Jobs do LinkedIn como fonte deterministica de candidaturas externas, capturando apenas links externos de fontes curadas, sem filtro de qualidade por IA antes de salvar, e reorganizando `/search` em abas para separar `External jobs` de `LinkedIn posts`

- a spec `018-linkedin-jobs-external-search` foi implementada no recorte automatizado em 2026-07-23: API lifecycle `linkedin_jobs_external`, dedupe por URL canonica, fonte curada compartilhada, runtime background/content-script da extensao, Search UI em `External jobs`/`LinkedIn posts`, diagnostics e guards de no-outreach/apps-web. Falta validar manualmente o comportamento real do LinkedIn para direct URL/geoId/click path antes de chamar o runtime de estavel.

Gate restante desta fase:

- continuar medindo qualidade real: candidatos inspecionados, aceitos, rejeitados, duplicados e falhas
- validar capturas longas reais do LinkedIn com cerca de 250 posts para confirmar que a recuperacao de
  infinite scroll reduz truncamentos prematuros
- estabilizar seletores da extensao conforme o DOM real do LinkedIn mudar
- harden login de usuario, ownership por `user_id` e backfill dos dados locais antes de deploy real
- estabilizar testes, contrato OpenAPI, deploy/configuracao, OAuth e banco fora do ambiente local

## Fase 3. Revisao E Envio Para Vagas

Objetivo: permitir que o usuario revise oportunidades de emprego e envie emails reais com templates
e curriculo.

- lista e filtros por `opportunity_type`
- filtros por campanha, temperatura e status
- status especificos de candidatura
- notas do operador
- visao detalhada da evidencia da captura
- selecao individual ou em massa
- envio real de email com curriculo anexado por provider configurado
- pagina/secao de templates para candidatura e follow-up
- preview/draft antes do envio
- botao de envio individual
- botao de envio em massa com confirmacao, controles de seguranca e eventos por destinatario
- tracking de resposta, entrevista, rejeicao ou ignorado

Estado atual:

- templates, settings/curriculos, drafts/previews, envio individual, bulk send revisavel, historico e
  worker Gmail/OAuth foram implementados
- tokens OAuth do Gmail ficam no PostgreSQL; PDFs de curriculo enviados ficam no PostgreSQL
- `.local/` permanece apenas para desenvolvimento local, coletor Playwright, logs e secrets opcionais
- login/ownership por usuario foi adicionado ao caminho principal local
- a extensao possui envio individual com Gmail, escolha de template/curriculo, edicao de destinatario,
  lixeira individual/bulk, selecao de todas as oportunidades listadas para envio/delecao e edicao de
  templates
- a UI de Jobs foi simplificada para operacao diaria: filtro Review saiu da listagem, selecao total usa
  checkbox mestre, `Delete all listed` age sobre os resultados filtrados, nomes repetidos sao
  deduplicados e parte do estado do popup persiste ao fechar/reabrir
- a lista Jobs mantem hot state local por lane/filtros/pagina por uma janela curta, reduzindo
  recarregamentos ao abrir links externos ou alternar entre `With email` e `External applications`
- o input de busca em Jobs encontra oportunidades por descricao, keywords, cargo, empresa e email de
  contato salvo
- login/cadastro com Google funciona como autenticacao primaria da extensao, vinculando identidade
  Google ao usuario existente quando o email verificado coincide; Gmail send OAuth continua separado
- bulk send com IA gera assunto/corpo por vaga usando oportunidade, curriculo PDF extraido, portfolio,
  LinkedIn, WhatsApp, informacoes extras, idioma detectado do post e template como referencia; o
  usuario revisa/edita/skip antes de clicar `SEND`, e a IA nao deve inventar fatos nem incluir
  WhatsApp quando o telefone estiver vazio
- a spec `009-full-time-fixes` implementou o hardening principal do fluxo local: sanitizacao de email,
  login/cadastro com Google como autenticacao primaria separada do OAuth Gmail, regiao apenas nos
  filtros de IA, paginacao Jobs em paginas de 50, `LinkedIn URL` no sender profile e progresso por
  item no batch AI retornado pela API/UI
- Google primary auth usa somente `openid` + userinfo email/profile; no local pode reaproveitar a config OAuth do
  Gmail para evitar duplicar client secrets, mas a permissao de envio Gmail continua dependendo do
  OAuth separado em Settings
- a spec `010-ai-field-assistant` foi implementada em primeiro recorte: API owner-scoped para
  ativacoes por dominio/pagina, geracao de resposta de campo com IA backend-only, sugestoes salvas por
  keyword com limite de 3, content script com botao de varinha magica, Settings para dominios
  habilitados e popup sem header/menu antes do login
- o assistente de campos foi hardenizado para paginas dinamicas: revarredura periodica/por mutacao/por
  foco, menu de autocomplete limitado ao viewport visivel e checkboxes por curriculo para escolher
  quais PDFs entram como contexto de IA; o backend agora extrai texto dos curriculos selecionados para
  respostas de formulario em vez de enviar apenas metadados
- a janela da varinha permite gerar respostas com IA, reutilizar sugestoes salvas por keyword sem IA e
  salvar respostas manuais ja digitadas no campo
- a janela da varinha permite editar a pergunta/instrucao detectada antes de gerar ou salvar resposta,
  e inputs de busca (`type=search`) ficam fora do assistente para evitar icones em caixas de navegacao
- em 2026-07-03, o limite de contexto de pergunta/instrucao do AI Field Assistant foi aumentado para
  500.000 caracteres em `label_text`, `existing_value` e `template_hint`, permitindo colar descricoes
  longas de empresa/vaga antes de gerar resposta
- em 2026-07-13, o AI Field Assistant foi ajustado para nao tratar `cards[...]` de formularios Lever
  como campo sensivel de cartao, voltando a detectar textareas de perguntas em aplicacoes e mantendo
  o bloqueio para campos reais de cartao de credito/CVV
- o popup `Full-time` foi simplificado para operacao diaria: dashboard com total/nao enviados, status
  visual `unsent/sent/interview`, marcacao rapida de entrevista, header alinhado com email/log out e
  acoes do assistente, e sender profile com WhatsApp/informacoes extras para contexto de emails IA
- o polish `012-extension-settings-polish` removeu o botao quebrado `Pin assistant` do header,
  renomeou as telas compactas para `Templates` e `Settings`, aumentou o respiro visual dos cards de
  configuracao e simplificou a lista de sites autorizados do AI field assistant para um dominio/URL
  por linha com acao direta de remocao; o layout atual deve permanecer como lista compacta tipo tabela
  sem headers, nao como cards grandes
- no fluxo LinkedIn, `opportunities.title` agora representa o nome da pessoa que publicou o post; a
  lista `/jobs` usa esse campo como titulo do card e nao mostra mais `Email domain`; novas capturas
  autenticadas tambem propagam o nome capturado do DOM do LinkedIn para `poster_name` via worker,
  preservando fallback por evidencia quando o texto do feed vem colado
- a spec `013-serpapi-career-search` foi criada para retomar fontes externas com outro objetivo:
  buscar URLs oficiais de vagas em career pages/ATS curados sem exigir nome de empresa, separar vagas
  com email de candidaturas externas em `/jobs`, avaliar resultados com IA e permitir marcar
  candidaturas externas como aplicadas manualmente
- a spec `013-serpapi-career-search` foi clarificada e planejada: cada clique no botao em `/search`
  cria uma busca nova no provider; vagas aceitas persistem no banco; vagas com qualquer email utilizavel
  entram em `With email` e continuam elegiveis ao fluxo Gmail; vagas sem email entram em
  `External applications`; todas as fontes ativas iniciam marcadas; a UI mostra a ultima busca e bloqueia
  novas buscas enquanto uma estiver rodando; aplicacao manual usa `job_stage=applied`; e o worker deve
  respeitar tanto o maximo de oportunidades aceitas quanto um teto configuravel de candidatos
  inspecionados baseado em custo
- `External applications` agora aceita filtro `All/Not sent/Sent`; nesse lane, `sent` significa
  aplicada/respondida/entrevista em `job_stage`, nao envio por Gmail
- `specs/013-serpapi-career-search/tasks.md` foi gerado com tarefas para API, worker, extensao,
  contratos, testes, docs e validacao; a implementacao deve comecar por fundacao + US1 como MVP antes
  de avancar para abas, IA, aplicacao manual e metricas


Gate restante desta fase:

- fazer smoke manual real do assistente de campos em formularios de candidatura variados, validando
  revarredura sem refresh, posicionamento no fim da tela, influencia do curriculo selecionado, sugestoes
  salvas e campos `contenteditable`
- evoluir os controles injetados para iframe/shadow-root mais isolado se sites reais entrarem em
  conflito com CSS/layout do content script inicial
- validar OAuth e envio real em ambiente publicado
- melhorar feedback pos-envio ate status final `sent/failed` por item
- mover a geracao AI em massa para processamento worker-owned realmente assincrono com polling/recovery
  de batches ativos; hoje o endpoint ja expoe status por item, mas ainda processa no caminho da API
- especificar um gerador de curriculo ATS revisavel a partir do curriculo base, perfil do operador e
  vagas para as quais emails ja foram enviados, evitando prometer treino de modelo ATS proprietario
  sem dados/validacao
- implementar `013-serpapi-career-search`: busca em career pages curadas, checkboxes de fontes, abas
  `With email` e `External applications`, dashboard separado, status manual de aplicado para vagas
  externas, provider diagnostics e teto configuravel de candidatos inspecionados
- planejar uma spec separada de retencao/limpeza operacional para arquivar ou apagar vagas antigas
  por politica configuravel, sem apagar oportunidades recentes ou dados de envio sem confirmacao
- adicionar tracking operacional de resposta, entrevista, rejeicao, ignorado e follow-up
- aproximar UI do prototipo com dashboard/campanhas/lista/detalhe `Full-time` mais completos e polish
  de produto publicavel
- atualizar testes legados e contratos para refletir auth/ownership e campos recentes do fluxo
  `Full-time`

## Fase 3.5. Filtros Inteligentes Pos-Captura

Objetivo: compensar a baixa qualidade da busca do LinkedIn mantendo a coleta ampla e movendo filtros
complexos para uma camada opcional de IA depois que os posts forem capturados.

- busca LinkedIn fica restrita a texto/query principal e ordenacao por recentes ou relevantes
- filtros como remoto, onsite/hibrido/presencial, regioes aceitas e regioes excluidas deixam de
  depender da URL/search do LinkedIn
- o campo explicito de keywords excluidas foi removido; a avaliacao fica a cargo da IA com texto
  completo, contexto de curriculo/perfil e sinais estruturados
- a secao `AI filters` permite ligar/desligar essa avaliacao
- cada candidato capturado registra se passou/reprovou no filtro de IA, motivo, confianca e fallback
  quando a IA falhar
- oportunidades aprovadas pelo filtro continuam seguindo o pipeline existente de dedupe, score/review,
  listagem e candidatura

Status: implementacao inicial concluida no caminho automatizado. Campos/counters, Search UI separada,
captura ampla, provider OpenAI compativel, fallback deterministico, diagnosticos, rejeicao de posts de
pessoas procurando emprego, tratamento de controle visivel de mais resultados e normalizacao de sinais
compostos de modo de trabalho da IA ja existem.

## Decisoes De Fonte Removidas

O spike de descoberta de vagas via fonte externa com enriquecimento posterior de email foi descartado
para o produto atual. A evidencia real indicou que os contatos encontrados tendem a responder com link
de carreiras, ATS ou instrucao para aplicar em outro lugar. Isso torna a feature pouco util para o
objetivo central do `Full-time`: contato por email com alta chance de acao.

Resultado da decisao:

- remover o codigo, specs, configs e UI da fonte externa
- manter uma migration placeholder no-op apenas para bancos locais ja carimbados com a revision
  descartada, sem reintroduzir schema ou comportamento da fonte externa
- manter o pipeline LinkedIn como caminho principal
- preservar melhorias gerais de UI/estado/filtros que continuam valiosas
- nao retomar fonte externa com descoberta posterior de email; a retomada valida e a spec
  `013-serpapi-career-search`, que usa career pages/ATS como candidaturas externas manuais com URL
  oficial e avaliacao por IA

Status de `013-serpapi-career-search`: implementacao automatizada praticamente concluida, 111/112
tasks. A API cria runs `career_page`, lista fontes curadas, bloqueia duplicidade ativa, expoe latest
run e filtra Jobs por `job_application_kind`. O worker processa runs career-page via provider
SerpApi-style, respeita maximo de aceitos/teto de inspecionados, registra logs estruturados e persiste
oportunidades com email ou apply URL. A extensao ganhou botao separado em Search, ultima busca, fontes
curadas com checkboxes, abas reais `With email`/`External applications`, mark applied e metricas
separadas. A correcao mais recente tambem remove filtros de email/envio quando a aba externa esta
ativa e mantem o botao de busca de career pages habilitado quando pelo menos uma fonte esta marcada e
nao ha run ativa. O worker tambem passou a pedir resultados dos ultimos 31 dias ao SerpApi/Google e a
rejeitar resultados com data explicita mais antiga antes de criar opportunities, para reduzir vagas
expiradas. Testes focados de API/worker/extensao passam. Falta apenas smoke manual com provider real e
ajuste de caps apos amostra.

Recorte Full-time priorizado especificado e planejado: `specs/018-linkedin-jobs-external-search/spec.md`. A busca deve viver na
extensao, junto da aba de vagas externas, e usar LinkedIn Jobs como superficie de garimpo de URLs
externas oficiais. Diferente da busca por posts e do career-page search com IA, este caminho deve ser
puramente deterministico: filtros de periodo/ordenacao/keywords quando possiveis, mesma allowlist de
fontes curadas, exclusao de candidatura simplificada, paginacao com padrao 15 e maximo 30 paginas,
sem limite de aceites e sem parada precoce por poucos matches.
`/speckit-plan` definiu que a extensao e dona da navegacao/inspecao usando a sessao LinkedIn do
operador, enquanto API/worker ficam com persistencia, dedupe, validacao, diagnosticos e utilitarios
compartilhados. `/speckit-tasks` gerou 95 tarefas; o proximo passo e `/speckit-implement`,
iniciando por setup/fundacao e US1 como MVP.

## Fase 4. Prospeccao Freelance

Objetivo: iniciar um app web interno para prospeccao freelance via busca local realista no
Google/Google Maps por nicho/localidade, como planejado inicialmente, mas separado da extensao
`Full-time`.

Status: `specs/014-freelance-web-app/spec.md` foi criada via `/speckit-specify`, clarificada via
`/speckit-clarify`, planejada via `/speckit-plan`, detalhada via `/speckit-tasks` e implementada como
vertical revisavel em `apps/web`. Entregue: scaffold `Next.js`/Prisma/Tailwind, bootstrap aditivo de
banco, seed de nichos/templates, provider mock, adapters esqueleto Apify/SerpApi, job de prospeccao,
dedupe, analise leve de website, leads salvos, dashboard, campanhas, leads, detalhe, prompt Lovable
sob demanda, mensagens comerciais, templates e configuracoes.

Validacao em 2026-06-08: `npm run db:bootstrap`, `npm run typecheck`, `npm run test` (31 arquivos, 43
testes), `npm run build`, smoke HTTP em `localhost:3000` cobrindo nichos, campanhas, job mock
`completed`, leads, detalhe, prompt, mensagem e settings, e `apps/extension npm run typecheck`.

Status de `015-freelance-niche-catalog`: T001-T087 foram implementados. O app web agora possui
schema/migration Prisma para governanca de nichos, seed backfill com source evidence, normalizacao de
nomes, schemas Zod, audit service, rota `GET /api/freelance/niche-audit` e pagina
`Settings -> Niche audit`. O audit compara a baseline de 30 nichos, evidencia de origem, encoding
danificado, duplicados, entries extras/missing e mantem o conflito `Imobiliaria` visivel com `11.0`
versus `6.1` ate override explicito do operador. A tab `Approved niches` adiciona CRUD/governanca
interna, prevencao de duplicados por slug/alias, source evidence obrigatoria, disable/re-enable/merge
e preservacao de snapshots historicos de campanha. A tab `Candidate review` adiciona candidatos de
nicho vindos de referencias/imagens, seed deterministico, matching sugerido contra a baseline,
decisoes approve/reject/defer/already-covered, rotas `GET/PATCH /api/freelance/niche-candidates` e
contadores/achados de candidatos no audit. Candidatos continuam fora da selecao de campanhas ate
aprovacao e nao criam leads, jobs, contatos, mensagens ou outreach.

Hotfix local em 2026-06-09: o bootstrap do `apps/web` foi ajustado para aplicar a migration de
governanca de nichos tambem em bancos locais ja existentes. Isso evita que telas dependentes de
`freelance_niches.display_name` quebrem quando o banco foi criado antes de `015-freelance-niche-catalog`.
Na mesma data, `Igrejas` entrou como nicho BR aprovado pelo operador para prospectar igrejas
evangelicas e catolicas com demanda por CMS/admin de site, postagens, eventos, calendario, carousel de
imagens e comunicacao comunitaria.
Em 2026-06-10, o formulario de campanha passou a usar autocomplete de localidades: IBGE para estados e
municipios BR, ViaCEP para preenchimento por CEP e uma rota internacional focada inicialmente em EUA
com estados/FIPS, tentativa de Census ACS places e fallback local de cidades principais.
Tambem em 2026-06-10, a prospeccao com provider real foi corrigida para respeitar o maximo salvo na
campanha, exibir/pollar o ultimo job no card e carregar `.env.local` no worker local. Operacionalmente,
SerpApi/Apify precisam do processo `web-worker` ativo; caso contrario o job fica enfileirado.
Na sequencia, o inicio de prospeccao pela UI passou a usar a rota plana
`POST /api/freelance/prospecting-jobs` com `campaignId` no corpo, evitando falha generica quando a
rota aninhada devolvia 404/HTML no dev server. A grid de campanhas foi ampliada e os controles dos
cards foram ajustados para evitar quebra de `View leads` e para expandir o painel de status do job.
Depois, o feedback `Queued` foi ajustado para nao culpar o worker quando o job ainda esta apenas
aguardando pickup/polling, o SerpApi passou a paginar para tentar chegar ao `maxResults` solicitado e
o dedupe passou a comparar novos resultados com leads ja existentes da campanha, evitando inflar
contadores em execucoes repetidas.
Em 2026-06-11, os filtros de leads foram hardenizados para aceitar selects vazios na query string:
filtrar por `websiteStatus=no_site` nao deve quebrar quando `commercialStatus`, `temperature` ou
`minScore` chegam vazios pelo form.
Tambem em 2026-06-11, o web app `Freelance` passou a conectar Google pela mesma API/auth session da
extensao. A barra superior mostra `Connect Google`, redireciona para `/auth/google/start`, recebe o
token via `/auth/google/callback`, salva cookie HTTP-only no Next e passa a usar o `user.id` autenticado
como owner scope. Localmente isso exige `postgres` + `api` alem de `freelance-postgres` + `web`; o
Compose aponta o client OAuth para `/app/.local/gmail/client_secret.json` dentro dos containers para
reaproveitar a credencial existente da extensao.
Em 2026-06-11, o Docker Compose tambem passou a servir o app `Freelance` em modo producao na VPS com
`next build` + `next start`, preparando acesso publico por `freelance.gfig.space` via Caddy. O
redirect final do login Google do web app usa `FREELANCE_GOOGLE_AUTH_SUCCESS_REDIRECT_URL`, sem
substituir `GOOGLE_AUTH_SUCCESS_REDIRECT_URL` do fluxo existente da API/extensao.
No mesmo ciclo, leads passaram a separar `website_url` de `social_url` e a UI deixou de mostrar scores
mockados como auditoria real; o analyzer atual registra apenas status/evidencia ate existir crawl real.
A tela de lead agora deve mostrar link de verificacao no Google Maps para conferencia manual do
resultado capturado.

Validacao complementar em 2026-06-09: `apps/web` passou em typecheck, suÃƒÂ­te completa, build, bootstrap
local, smoke HTTP de `/settings/niches`, `/api/freelance/niche-audit` e
`/api/freelance/niche-candidates`, alem de guardas sem CSV, sem linguagem Full-time indevida na UI de
nichos e sem caminhos de candidatos criando lead/job/outreach.

Proximo passo recomendado: `specs/016-freelance-bulk-outreach/spec.md` foi criado para o recorte de
outreach em massa de leads `Freelance`; executar `/speckit-plan` para definir arquitetura, contratos,
schema, UI e validacao. O recorte aproveita a tabela de leads existente, settings/templates e o padrao
ja validado na extensao `Full-time`: selecao por checkbox, geracao IA por item usando template como
referencia, revisao/edicao/skip antes de qualquer envio real e tracking de status por lead. Provider
real de Google Maps/SerpApi/Apify segue como dependencia importante para qualidade de entrada, mas nao
deve ser misturado com a implementacao de envio.

Decisoes clarificadas para o MVP:

- entregar uma fatia vertical completa, nao apenas descoberta ou apenas UI
- exigir sinal revisavel de status de website no MVP e deferir auditorias reais/profundas de
  navegador, design, performance e SEO
- suportar BR e internacional no fluxo, com smoke podendo focar um mercado representativo
- nao incluir CSV export no MVP nem planejar por padrao
- gerar prompts/mensagens sob demanda e salvar apenas a ultima versao gerada por lead, sem historico

Decisao de plano:

- criar `apps/web` como novo app interno `Next.js`/`Prisma`
- manter `apps/api`, `apps/worker` e `apps/extension` focados no produto `Full-time`
- rodar descoberta local e analise leve de sites em um worker separado do request path do Next.js
- usar provider abstraction `freelance_maps_provider` com mock local e primeiro adapter real planejado
  para Apify Google Maps Scraper ou SerpApi Google Maps

Gate de entrada: o fluxo `Full-time` ja esta satisfatorio para candidaturas; antes de congelar essa
fase, ainda falta smoke/ajuste fino das candidaturas externas. Isso nao bloqueia o inicio do projeto
`Freelance`, desde que a extensao `Full-time` seja tratada como produto separado e nao misturada no
novo app.

Stack decidida:

- app web em `Next.js`
- componentes em `shadcn/ui`
- validacao com `Zod`
- estado local de UI com `Zustand`
- ORM/migrations em `Prisma`
- banco `PostgreSQL`
- ambiente local com `Docker Compose`
- deploy futuro em VPS

Decisao de coleta:

- usar provider externo/scraper de Google Maps como Apify Google Maps Scraper ou SerpApi Google Maps
  atras de uma interface propria
- priorizar resultados que reproduzam o que usuarios reais encontrariam pesquisando por nicho e
  localidade no Google/Google Maps
- manter Playwright apenas como fallback/spike de auditoria, nao como provider principal do MVP
- apos coletar o negocio, baixar o HTML do site quando existir e avaliar conteudo, design,
  performance e SEO em etapa propria

- consultas por nicho, cidade, bairro e mercado usando busca local Google/Maps como primeira fonte
- seed inicial de nichos vindo de `references/opportunity-desk-pro/src/lib/mockData.ts` (`NICHE_OPTIONS`)
- deteccao de website com estados revisaveis
- deteccao de negocio sem site, so com rede social ou com site fraco, sem tratar rede social como
  website proprio
- captura de nota Google, quantidade de reviews, endereco, telefone, website e fonte
- captura de `source_query`, `source_url`, place ids/data ids quando disponiveis e evidencia textual
- deduplicacao por nome, contato e origem
- score inicial de oportunidade/temperatura comercial; scores de conteudo, design, performance e SEO
  so devem aparecer quando houver auditoria real de website
- salvar URL da demo por lead
- gerar prompt para `Lovable`
- templates iniciais de email
- preparo de mensagem com contexto da oportunidade
- selecao manual de destinatarios
- eventos tecnicos de envio e resposta
- base para email e WhatsApp

## Fase 4.5. Outreach Freelance Em Massa

Objetivo: transformar leads revisados do app web `Freelance` em campanhas de contato controladas,
com geracao assistida por IA e envio real apenas depois de revisao humana.

Status: `specs/016-freelance-bulk-outreach/spec.md` foi criada via `/speckit-specify` em
2026-06-24, com checklist completo e `.specify/feature.json` apontando para o novo recorte. Em
2026-06-25, `/speckit-clarify` registrou que email do `Freelance` deve ficar dentro do `apps/web`,
WhatsApp entra end-to-end quando configurado, contatos podem vir de provider/edicao/enriquecimento
apos revisao, limites por canal sao configuraveis por env/provider, e Email/WhatsApp usam botoes de
acao separados apos selecao de leads. Em seguida, `/speckit-plan` gerou `plan.md`, `research.md`,
`data-model.md`, `quickstart.md` e contratos `api`, `web-ui` e `provider-diagnostics`. Depois,
`/speckit-tasks` gerou `specs/016-freelance-bulk-outreach/tasks.md` com 77 tarefas organizadas por
setup, fundacao, US1 selecao/batch, US2 geracao IA, US3 review/edicao/skip, US4 Email real, US5
settings/WhatsApp/diagnostics e polish. `/speckit-implement` concluiu T001-T077: fundacao Prisma/
config/diagnostics, selecao por checkbox na tabela de Leads, batch duravel por canal, geracao de
drafts sem side effects, review/editor por item, skip/unskip, envio real por Email via adapter Resend,
readiness/settings por canal, WhatsApp provider-backed via Twilio quando configurado, eventos/
historico por lead, bloqueio de duplicidade, guardas de copy/segredo/acessibilidade, docs e validacao
final. O fluxo `Freelance` agora pode gerar, revisar e aprovar Email/WhatsApp dentro de `apps/web`,
mostrando env/config/rate-limit/provider diagnostics sem expor secrets.

Nota Full-time em 2026-07-03: a busca `career_page` ja encontra oportunidades quando o provider
retorna resultados, mas precisa continuar evoluindo em observabilidade e previsibilidade. Foi aplicado
um hotfix para persistir as fontes/limites escolhidos na extensao, fazer polling do latest run ate o
estado terminal e logar diagnosticos finais por fonte no worker. Um recorte futuro deve expor esses
diagnosticos na UI e diferenciar claramente fonte vazia, falha parcial de provider, duplicata e run
sem aceite. No mesmo ajuste, filtros de IA de modo de trabalho/regiao passaram a ser aplicados antes
de criar oportunidades de career-page, e a query do provider passou a incluir preferencias basicas de
remoto/regioes aceitas/excluidas. A proxima evolucao deve tornar esses controles explicitos para vagas
externas e mostrar quando uma vaga foi rejeitada por `remote_only`, hibrido/on-site ou regiao excluida.
Um segundo hotfix operacional recupera runs `career_page` presos em `running`: o worker marca stale
no startup, aplica `running_timeout` configuravel nas voltas normais e registra a fonte atual como
`fetching` antes de consultar o provider, reduzindo bloqueios invisiveis na extensao.

Escopo planejado:

- adicionar checkboxes na tabela de leads e selecao em massa limitada aos leads visiveis/filtrados
- oferecer botoes separados para bulk Email e bulk WhatsApp depois da selecao; o botao escolhido
  define o canal do batch antes da geracao
- criar painel de bulk outreach para leads selecionados, inspirado no `BulkEmailPanel` da extensao
  `Full-time` como referencia de UX, mas sem depender do servico/API `Full-time`
- gerar mensagens comerciais com IA por lead, usando oportunidade, nicho, site/status, telefone/email
  quando existirem, `SellerSettings.extraContext`, site/portfolio do prestador e template comercial
  como referencia de tom/estrutura
- permitir revisar, editar, pular e salvar cada item antes de aprovar o envio
- manter contadores por lote: elegivel, sem contato, duplicado, invalido, gerado, falhou, pulado e
  enviado
- separar configuracoes de perfil/oferta ja existentes em `Settings` de configuracoes de providers de
  envio, preservando secrets em ambiente seguro
- suportar email real como primeiro canal, com provider configuravel proprio do `apps/web` e eventos
  por destinatario
- pesquisar/enriquecer email de leads em recorte proprio se o provider de Maps entregar apenas telefone
  ou site, sem bloquear leads que ja tiverem email valido
- implementar WhatsApp real por provider como Twilio/WhatsApp Business API ou equivalente, nao por
  link com texto em query string, com opt-in, rate limit, credenciais por ambiente, templates aprovados
  quando exigido, diagnosticos de configuracao/erro no app e historico de envio/falha por lead
- impedir envio automatico sem aprovacao explicita do operador e bloquear reenvio duplicado para o
  mesmo lead/canal/campanha sem confirmacao

Validacao final de `016-freelance-bulk-outreach`:

- `apps/web` typecheck, testes unitarios, contratos, integracao e build passaram.
- Prisma validate/generate passaram com `DATABASE_URL` local do app web.
- Os testes focados cobrem providers Email/WhatsApp, readiness, duplicidade, contratos de approve e
  channel settings, fluxo de review/delivery, Settings context e guardas de copy/segredo/acessibilidade.

Decisoes de seguranca e produto:

- a IA gera rascunhos, nao envia sozinha
- templates sao referencia editavel, nao fonte para inventar fatos
- WhatsApp depende de configuracao/provider real; quando faltar env var, credencial, template, opt-in,
  janela de mensagem, limite ou permissao de conta, a UI deve explicar exatamente o bloqueio
- limites de envio nao devem ser caps pequenos hardcoded; usar limites altos configuraveis por env ou
  capacidade reportada pelo provider, com capacidade restante visivel
- mensagens devem usar somente dados registrados do lead, settings do vendedor/prestador e contexto
  adicional preenchido pelo operador

## Fase 5. IA E Inteligencia Comercial

Objetivo: usar os dados estruturados para acelerar proposta, qualificacao e expansao.

- geracao de prompts e artefatos com IA
- geracao assistida de emails de candidatura por vaga, usando contexto da oportunidade, curriculo e
  portfolio do usuario, sempre com revisao humana antes do envio
- apoio a proposta, benchmark e personalizacao
- sugestoes de nichos e areas com maior concentracao
- compatibilidade futura com integracao de mapas

## Gate De Qualidade Entre Fases

Antes de acelerar para a proxima fase, validar:

- qualidade real dos dados capturados
- taxa de falsos positivos na descoberta
- clareza do fluxo manual para o operador
- compatibilidade do schema e dos contratos atuais
- seguranca de secrets e ownership por usuario

## Hotfix Freelance Twilio Delivery Status - 2026-07-25

O envio WhatsApp via Twilio no app web `Freelance` agora diferencia aceite da API de entrega final. Quando a Twilio retorna um SID com status inicial como `queued`, o provider ainda registra o item como enviado para manter compatibilidade, mas devolve `providerStatus` e diagnostico `twilio_delivery_pending`; a UI informa que a mensagem foi aceita pela Twilio e que a entrega deve ser confirmada pelos logs/status callback. Isso evita tratar HTTP 200/201 como prova de recebimento no WhatsApp do destinatario.

## Hotfix Freelance WhatsApp Plain Text - 2026-07-25

Mensagens comerciais geradas para o canal WhatsApp no app web `Freelance` agora devem sair como texto puro de chat. O prompt instrui a IA a nao usar Markdown, nao criar links `[texto](url)` e nao pedir para o lead chamar no WhatsApp quando a conversa ja esta nesse canal; a confirmacao correta e pedir para responder por ali. A camada de formatacao tambem converte links Markdown remanescentes para texto simples antes de salvar ou enviar.

## Hotfix Freelance Offer Pricing Context - 2026-07-22

As configuracoes do vendedor no app web `Freelance` agora tratam preco como referencia de escopo, nao promessa fixa. O formulario inclui preco base de landing page em BRL/USD, ranges para projetos com banco/captura/admin/integracoes e ranges para automacoes como atendimento WhatsApp. Defaults: R$ 2500, US$ 1000, entrega base de 15 dias e parcelamento BR em ate 6x sem juros. A geracao IA deve usar `a partir de`/`starting at`, adaptar moeda/parcelamento ao mercado do lead e explicar que o valor varia conforme necessidades do cliente. URLs de website/portfolio/LinkedIn aceitam entrada sem protocolo e sao normalizadas para `https://...`.

## Hotfix Freelance Seller Contact Context - 2026-07-22

O app web `Freelance` agora espelha as configuracoes comerciais mais uteis da extensao: nome, email, WhatsApp, website da empresa, portfolio/site e LinkedIn. `SellerSettings` ganhou `companyWebsite` e `sellerLinkedinUrl`, com migration Prisma correspondente. A geracao IA de mensagens comerciais usa esses dados como contatos do vendedor e separa explicitamente o telefone do lead como `leadPhoneForOperatorReviewOnly`, para impedir que o modelo assine mensagens com o telefone do prospect. Quando `companyWebsite` ou `portfolioUrl` estiverem configurados, o prompt pede inclusao do link no rodape/assinatura; WhatsApp de assinatura so pode vir de `sellerWhatsapp`.

A extensao `Full-time` ja enviava `portfolio_url`, `linkedin_url` e `whatsapp` no contexto de geracao de email. O prompt fixo foi reforcado para sempre incluir `portfolio_url` no rodape/assinatura quando configurado, mantendo a regra de nao incluir WhatsApp vazio.

Ideia futura para discovery `Freelance`: criar uma spec separada de scraper/provider de Instagram focado em perfis comerciais publicos por nicho/localidade/hashtags/places, extrair bio/nome/categoria/cidade/telefone/email/link-in-bio/site, classificar ausencia ou fraqueza de website e cruzar com verificacao Google/Maps pelo nome + cidade. O score resultante pode priorizar ofertas de site + Google Business Profile/geolocalizacao, com revisao humana antes de contato e preferencia por APIs/providers legais para reduzir risco de ToS, rate-limit e bloqueios.

## Hotfix Freelance Lead Detail AI Outreach - 2026-07-13

O detalhe de lead do `apps/web` centraliza o fluxo no card amplo `Commercial message`: a IA gera a mensagem usando dados visiveis do lead, review do operador, evidencia de origem, analise de site, campanha, settings do vendedor/prestador e template selecionado apenas como base. O operador edita a mensagem no proprio campo e clica em `Send message`; um modal permite escolher WhatsApp ou Email, desabilitando Email quando o lead nao tem endereco capturado, editar destinatario/mensagem e confirmar `Send`. O backend continua usando as rotas de outreach existentes por tras, mas sem expor conceitos de batch/approve na UX de detalhe. Telefones de WhatsApp sao normalizados para E.164 antes do envio ao Twilio.

## Hotfix Full-time Field Assistant Modal Textareas - 2026-07-14

A extensao `Full-time` recebeu um ajuste no Field Assistant para lidar melhor com textareas em modais/overlays de aplicacao externa. O detector agora aceita campos visiveis dentro de ancestrais com role de modal/apresentacao mesmo quando algum wrapper usa `aria-hidden=true`, e o preenchimento de input/textarea passou a usar o setter nativo antes de disparar eventos `input`/`change`, melhorando compatibilidade com campos controlados por React/Vue.


## Hotfix Full-time LinkedIn Jobs Apply CTA Redirect Resolution - 2026-07-26

A extensao `Full-time` agora resolve botoes `Candidatar-se` do LinkedIn Jobs que parecem externos na UI, mas expoem `href` interno `linkedin.com/jobs/view/...` no DOM. URLs internas `/jobs/view` deixam de ser aceitas como application URL canonica; quando o CTA nao decodifica diretamente, o background clica no botao em uma aba auxiliar, observa a URL externa final, fecha a aba auxiliar e devolve o ATS real para matching/dedupe. Isso preserva a regra de pular Easy Apply, mas evita perder vagas externas so porque o LinkedIn usa redirect/tracking intermediario.

## Hotfix Full-time LinkedIn Jobs Button CTA Without Href - 2026-07-26

A extensao `Full-time` agora tambem considera `BUTTON.jobs-apply-button` e `[role='button']` com texto/aria de `Candidatar-se` como CTA de candidatura externa, mesmo sem `href`. O background clica o CTA, observa a aba externa aberta e registra logs de `LinkedIn apply resolver` para diagnosticar label/href/tag/URL resolvida em validacoes futuras.

## Hotfix Full-time LinkedIn Jobs Share Profile Modal - 2026-07-26

A extensao `Full-time` agora trata o modal intermediario do LinkedIn `Gostaria de compartilhar seu perfil?` como parte do fluxo de apply externo. O resolvedor clica `Continuar`, captura a URL externa aberta e fecha o modal se a resolucao falhar, evitando que o modal bloqueie a varredura dos proximos cards.

## Correction Full-time LinkedIn Jobs Share Profile Modal - 2026-07-26

A extensao `Full-time` nao deve avancar automaticamente o modal `Gostaria de compartilhar seu perfil?`. Esse modal agora e tratado como bloqueio inesperado/diagnostico: a extensao registra o CTA exato clicado, fecha o modal se possivel e segue sem compartilhar perfil, permitindo ajustar o alvo correto sem travar a captura.

## Hotfix Full-time LinkedIn Jobs Stop Hrefless CTA Clicks - 2026-07-26

A extensao `Full-time` nao clica mais automaticamente em CTA `Candidatar-se` sem `href`, porque esse caminho abriu o modal de compartilhamento de perfil. O fluxo agora evita side effects, loga o CTA sem href e exige diagnostico DOM sem clique para descobrir a origem real do link externo.

## Diagnostic Full-time LinkedIn Jobs Hrefless Apply CTA - 2026-07-27

A extensao `Full-time` agora registra diagnostico passivo para `BUTTON`/`role=link` de `Candidatar-se` sem `href`: job id atual, dataset/html do CTA, cadeia de pais, resources `/voyager/`/`/jobs/` e sinais JSON. O objetivo e descobrir a origem do apply URL sem clique automatico nem modal de compartilhar perfil.

Atualizacao operacional 2026-07-27: no recorte `018-linkedin-jobs-external-search`, CTAs externos sem `href` continuam sem URL deterministica antes do clique. O runtime agora evita crash de progresso sem `diagnostics`, reduz ruido de resource logs e bloqueia/restaura navegação acidental para fora de `/jobs/search`. Proximo hardening recomendado: resolver `BUTTON.jobs-apply-button` sem `href` em uma aba descartavel/isolada, capturando somente a primeira URL externa e fechando a aba/modal sem afetar a busca principal.

Atualizacao operacional 2026-07-27: o hardening de `018-linkedin-jobs-external-search` agora inclui resolver de CTA externo em aba descartavel para `BUTTON.jobs-apply-button` sem `href`. A coleta principal nao deve mais clicar no apply da vaga ativa; qualquer clique de resolucao acontece em aba auxiliar fechada automaticamente. Gate restante: validar manualmente se o LinkedIn entrega o ATS externo nessa aba inativa ou se bloqueia em `share_profile_blocked`.

Atualizacao operacional 2026-07-27: o resolver descartavel do LinkedIn Jobs agora aguarda o CTA renderizar na aba auxiliar antes do clique, reduzindo falsos `click_failed` em paginas que abrem primeiro como skeleton. Validacao manual ainda deve confirmar se a aba auxiliar chega ao ATS externo ou se fica bloqueada pelo estado do LinkedIn.

Atualizacao operacional 2026-07-27: no `Freelance`, o bloqueio de duplicidade de outreach agora permite retry quando a ultima tentativa terminou em `failed_send`. Duplicidade continua bloqueada para envio pendente ou ja enviado, mas falha de provider nao deve impedir nova tentativa manual.

Atualizacao operacional 2026-07-27: o resolver de CTAs `Candidatar-se` sem `href` do LinkedIn Jobs voltou a usar a aba atual como fonte de clique quando necessario, porque a aba descartavel nao preservava o estado SPA real e podia abrir apenas outra pagina LinkedIn Jobs. O objetivo permanece capturar e fechar rapidamente a aba externa ATS, sem aceitar `linkedin.com/jobs/search` como resultado.

Atualizacao operacional 2026-07-27: o resolvedor de CTA sem `href` do LinkedIn Jobs ganhou cache/in-flight por vaga e label para evitar abrir repetidamente a mesma candidatura durante o polling do estado da vaga.

Atualizacao operacional 2026-07-27: o resolvedor de candidatura externa do LinkedIn Jobs agora espera a URL nao-LinkedIn estabilizar por ~1.2s antes de capturar/fechar, reduzindo falsos matches em encurtadores e redirects intermediarios.

Atualizacao operacional 2026-07-27: a captura LinkedIn Jobs agora rastreia abas ATS externas criadas sem `openerTabId` e aceita aliases de dominio como `job-boards.greenhouse.io`. Isso deve corrigir casos em que InHire/Greenhouse abriam visualmente, mas a vaga continuava com `accepted=0`.

Atualizacao operacional 2026-07-27: o matching de fontes externas do LinkedIn Jobs agora e propositalmente simples: se a URL canonica contem a chave/dominio/alias da fonte selecionada, a vaga e aceita para aquela fonte. Isso substitui matching estrito de host para evitar falsos negativos em variantes como `job-boards.greenhouse.io` vs `boards.greenhouse.io`.
