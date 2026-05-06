# Roadmap

Este arquivo descreve a direcao estavel do produto.

Para saber onde a execucao parou, qual e a fase atual e qual foi o ultimo prompt usado, consulte
`docs/handoff.md`.

## Fase 1. Fundacao operacional

Objetivo: criar a base minima que permita captura e persistencia com qualidade.

- ambiente local com `Docker Compose` e `PostgreSQL`
- API em `FastAPI`
- usuarios individuais com login por email/senha antes do primeiro deploy real
- modelo central de oportunidades
- suporte desde o inicio a `freelance` e `job`
- persistencia de query, origem e evidencia

## Fase 2. Busca de empregos

Objetivo: entregar o primeiro valor pratico buscando vagas e publicacoes de emprego com keywords
relevantes e email disponivel.

- keywords configuradas pelo usuario
- fallback mockado com termos como `reactjs`, `typescript`, `nextjs` e `nodejs`
- futura extracao de keywords do curriculo
- busca por publicacoes e anuncios no LinkedIn
- spike futuro com Google Jobs/SerpApi ou busca web estruturada como fonte adicional, apenas se gerar
  vagas com email publico confiavel
- captura de empresa, vaga, email, link e evidencia
- listagem em modo ou aba `Full-time Job`

Estado atual:

- provider/fetcher inicial do LinkedIn foi implementado no worker
- API ja possui metadados de run/candidato para provider status, source type e contato preferencial
- parser/normalizer ja aceita email publico como primeira preferencia e convite explicito de contato LinkedIn com link de perfil
- worker ja consome runs `pending` no PostgreSQL e grava candidatos/oportunidades end-to-end
- testes automatizados passam para API e worker quando executados separadamente
- a extensao Plasmo MVP usa a sessao logada do navegador para capturar posts do LinkedIn, criar
  runs autenticadas, exibir diagnosticos e revisar vagas pela API local
- limites globais de candidatos por run foram removidos; limites futuros devem ser regras de produto
  por plano/assinatura

Gate restante desta fase:

- continuar medindo qualidade real: candidatos inspecionados, aceitos, rejeitados, duplicados e falhas
  por bloqueio/rate limit
- estabilizar seletores da extensao conforme o DOM real do LinkedIn mudar
- harden login de usuario, ownership por `user_id` e backfill dos dados locais antes de deploy real
- estabilizar testes, contrato OpenAPI, deploy/configuracao, OAuth e banco fora do ambiente local
- antes de implementar Google Jobs de verdade, rodar spike descartavel e aceitar somente candidates que
  tenham email publico confiavel para virar opportunity

## Fase 3. Revisao e envio para vagas

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
- login/ownership por usuario ja foi adicionado ao caminho principal local, incluindo extensao autenticada
  e recursos owner-scoped
- a extensao ja possui envio individual com Gmail, escolha de template/curriculo, edicao de destinatario,
  lixeira individual/bulk e edicao de templates
- bulk send com IA ja gera assunto/corpo por vaga usando oportunidade, curriculo PDF extraido,
  portfolio, idioma detectado do post e template como referencia; o usuario revisa/edita/skip antes de
  clicar `SEND`

Gate restante desta fase:

- validar OAuth e envio real em ambiente publicado
- melhorar feedback pos-envio ate status final `sent/failed` por item, alem do estado atual de fila
  Gmail/worker
- adicionar tracking operacional de resposta, entrevista, rejeicao, ignorado e follow-up
- aproximar UI do prototipo com dashboard/campanhas/lista/detalhe `Full-time` mais completos
- atualizar testes legados e contratos para refletir auth/ownership e campos recentes do fluxo
  `Full-time`

## Fase 3.5. Filtros inteligentes pos-captura

Objetivo: compensar a baixa qualidade da busca do LinkedIn mantendo a coleta ampla e movendo filtros
complexos para uma camada opcional de IA depois que os posts forem capturados.

- busca LinkedIn deve ficar restrita a texto/query principal e ordenacao por recentes ou relevantes
- filtros como remoto, onsite/hibrido/presencial, regioes aceitas e regioes excluidas deixam de
  depender da URL/search do LinkedIn
- o campo explicito de keywords excluidas foi removido; a avaliacao deve ficar a cargo da IA com
  texto completo, contexto de curriculo/perfil e sinais estruturados
- uma secao `AI filters` na tela Search deve permitir ligar/desligar essa avaliacao
- cada candidato capturado deve registrar se passou/reprovou no filtro de IA, motivo, confianca e
  fallback quando a IA falhar
- oportunidades aprovadas pelo filtro devem continuar seguindo o pipeline existente de dedupe,
  score/review, listagem e candidatura

Status: implementacao inicial concluida no caminho automatizado. Campos/counters, Search UI separada,
captura ampla, provider OpenAI compativel, fallback deterministico, diagnosticos, rejeicao de posts de
pessoas procurando emprego e tratamento de controle visivel de mais resultados ja existem. Falta smoke
manual com LinkedIn real, revisao dos outputs do modelo e validacao operacional junto dos gates da
Fase 3.

Proxima spec recomendada: hardening operacional do `Full-time` MVP. Ela deve fechar smoke manual,
auth/ownership legado, contratos, OAuth/envio publicado, feedback pos-envio e riscos conhecidos antes
de abrir a Fase 4.

## Fase 3.6. Spike Google Jobs + email discovery

Objetivo: validar se Google Jobs/SerpApi ou busca web estruturada consegue gerar opportunities
`Full-time` no mesmo formato acionavel do LinkedIn: empresa, titulo da vaga, email publico confiavel,
fonte, evidencia, score, template e envio por Gmail.

Gate de entrada: iniciar somente depois do hardening operacional do `Full-time` MVP e da validacao
manual do fluxo LinkedIn + AI filters + Gmail. Esta fase nao substitui LinkedIn; ela mede se existe
retorno suficiente para justificar a fonte adicional.

- adicionar botao separado `Search with Google Jobs` na tela Search
- criar source type/provedor separado `google_jobs`
- preservar `source_query`, `source=google_jobs`, URL do resultado, URL da vaga/ATS, dominio oficial
  identificado e evidencia textual
- deduplicar contra vagas LinkedIn por empresa, titulo, localidade e URL canonica
- tentar ler JSON-LD `JobPosting` nas paginas de destino para titulo, empresa, localidade, descricao,
  remoto e requisitos de localidade quando disponivel
- buscar email publico em site oficial, paginas `careers`, `contact`, `about`, rodape, texto da vaga e
  resultados indexados do dominio
- classificar email como `recruiting`, `careers`, `hr`, `company_general`, `personal`, `invalid` ou
  `not_found`
- criar `opportunity` somente quando houver email aceitavel e score minimo; candidatos sem email ficam
  apenas em diagnostics/rejected candidates
- adicionar filtro de listagem por fonte, inicialmente `linkedin` e `google_jobs`
- comparar com LinkedIn por query, custo, tempo, taxa de email confiavel, taxa de aceite por IA e
  quantidade real de opportunities salvas

Decisao recomendada: testar, medir e jogar fora se for ruim. Google Jobs so interessa aqui se virar
pipeline de emails; se virar apenas outro agregador de links de candidatura, nao atende a proposta do
produto.

## Fase 4. Prospeccao freelance

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
- templates de `1o contato` e `follow-up`
- preparo de mensagem com contexto da oportunidade
- selecao manual de destinatarios
- eventos tecnicos de envio e resposta
- base para email e WhatsApp

## Fase 5. IA e inteligencia comercial

Objetivo: usar os dados estruturados para acelerar proposta, qualificacao e expansao.

- geracao de prompts e artefatos com IA
- geracao assistida de emails de candidatura por vaga, usando contexto da oportunidade, curriculo e
  portfolio do usuario, sempre com revisao humana antes do envio
- apoio a proposta, benchmark e personalizacao
- sugestoes de nichos e areas com maior concentracao
- compatibilidade futura com integracao de mapas

## Gate de qualidade entre fases

Antes de acelerar para a proxima fase, validar:

- qualidade real dos dados capturados
- taxa de falsos positivos na descoberta
- clareza do fluxo manual para o operador
- compatibilidade do schema e dos contratos atuais
