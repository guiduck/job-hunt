# Roadmap

Este arquivo descreve a direcao estavel do produto.

Para saber onde a execucao parou, qual e a fase atual e qual foi o ultimo prompt usado, consulte
`docs/handoff.md`.

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
- o feedback da Search UI usa os counters do run como fonte principal e nao deve ficar zerado quando
  uma chamada detalhada de candidates encontra sinais de IA fora do enum esperado
- a deduplicacao de vagas usa URL do post como desempate quando empresa/cargo nao foram extraidos,
  evitando colapsar vagas diferentes do mesmo contato e mesmas keywords
- limites globais de candidatos por run foram removidos; limites futuros devem ser regras de produto
  por plano/assinatura

Gate restante desta fase:

- continuar medindo qualidade real: candidatos inspecionados, aceitos, rejeitados, duplicados e falhas
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
- o input de busca em Jobs encontra oportunidades por descricao, keywords, cargo, empresa e email de
  contato salvo
- login/cadastro com Google funciona como autenticacao primaria da extensao, vinculando identidade
  Google ao usuario existente quando o email verificado coincide; Gmail send OAuth continua separado
- bulk send com IA gera assunto/corpo por vaga usando oportunidade, curriculo PDF extraido, portfolio,
  idioma detectado do post e template como referencia; o usuario revisa/edita/skip antes de clicar
  `SEND`
- a spec `009-full-time-fixes` implementou o hardening principal do fluxo local: sanitizacao de email,
  login/cadastro com Google como autenticacao primaria separada do OAuth Gmail, regiao apenas nos
  filtros de IA, paginacao Jobs em paginas de 50, `LinkedIn URL` no sender profile e progresso por
  item no batch AI retornado pela API/UI
- Google primary auth usa somente `openid` + userinfo email/profile; no local pode reaproveitar a config OAuth do
  Gmail para evitar duplicar client secrets, mas a permissao de envio Gmail continua dependendo do
  OAuth separado em Settings
- a spec `010-ai-field-assistant` foi implementada em primeiro recorte: API owner-scoped para
  ativacoes por dominio/pagina, geracao de resposta de campo com IA backend-only, sugestoes salvas por
  keyword com limite de 3, content script com botao de varinha magica, shell persistente via `Pin
  assistant`, Settings para dominios habilitados e popup sem header/menu antes do login
- o assistente de campos foi hardenizado para paginas dinamicas: revarredura periodica/por mutacao/por
  foco, menu de autocomplete limitado ao viewport visivel e checkboxes por curriculo para escolher
  quais PDFs entram como contexto de IA; o backend agora extrai texto dos curriculos selecionados para
  respostas de formulario em vez de enviar apenas metadados
- a shell persistente do assistente agora oferece preenchimento em massa de campos visiveis: `Fill
  saved` reutiliza respostas salvas por keyword sem IA, enquanto `Fill with AI` usa respostas salvas
  primeiro e gera apenas o que faltar; respostas manuais ja digitadas no campo tambem podem ser salvas
  pela janela da varinha
- a janela da varinha permite editar a pergunta/instrucao detectada antes de gerar ou salvar resposta,
  e inputs de busca (`type=search`) ficam fora do assistente para evitar icones em caixas de navegacao

Gate restante desta fase:

- fazer smoke manual real do assistente de campos em formularios de candidatura variados, validando
  revarredura sem refresh, posicionamento no fim da tela, influencia do curriculo selecionado e campos
  `contenteditable`, alem de `Fill saved`/`Fill with AI` em formularios com multiplos campos
- evoluir a shell persistente para iframe/shadow-root mais isolado se sites reais entrarem em conflito
  com CSS/layout do content script inicial
- validar OAuth e envio real em ambiente publicado
- melhorar feedback pos-envio ate status final `sent/failed` por item
- mover a geracao AI em massa para processamento worker-owned realmente assincrono com polling/recovery
  de batches ativos; hoje o endpoint ja expoe status por item, mas ainda processa no caminho da API
- planejar uma spec separada de retencao/limpeza operacional para arquivar ou apagar vagas antigas
  por politica configuravel, sem apagar oportunidades recentes ou dados de envio sem confirmacao
- adicionar tracking operacional de resposta, entrevista, rejeicao, ignorado e follow-up
- aproximar UI do prototipo com dashboard/campanhas/lista/detalhe `Full-time` mais completos
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
- nao planejar outra fonte de vagas ate existir uma hipotese clara de contato publico realmente
  acionavel

## Fase 4. Prospeccao Freelance

Objetivo: adicionar o bot de busca por clientes freelance via Google Maps/nicho/localidade, como
planejado inicialmente.

Gate de entrada: iniciar depois que a spec de hardening operacional do `Full-time` confirmar que o
fluxo atual esta validado o suficiente para nao carregar dividas de auth/deploy/outreach para o modo
`Freelance`.

- consultas por nicho, cidade, bairro e mercado usando Google Maps como primeira fonte planejada
- deteccao de website com estados revisaveis
- deteccao de negocio sem site, so com rede social ou com site fraco
- captura de nota Google, quantidade de reviews, endereco, telefone, website e fonte
- deduplicacao por nome, contato e origem
- score inicial
- salvar URL da demo por lead
- gerar prompt para `Lovable`
- templates iniciais de email
- preparo de mensagem com contexto da oportunidade
- selecao manual de destinatarios
- eventos tecnicos de envio e resposta
- base para email e WhatsApp

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
