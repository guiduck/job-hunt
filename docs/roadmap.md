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
- implementar login de usuario, ownership por `user_id` e backfill dos dados locais antes de deploy
- estabilizar deploy/configuracao para API, worker, OAuth e banco fora do ambiente local

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

- templates, settings/curriculos, drafts/previews, aprovacao de envio individual, base de bulk send,
  historico e worker Gmail/OAuth foram implementados
- tokens OAuth do Gmail ficam no PostgreSQL; PDFs de curriculo enviados ficam no PostgreSQL
- `.local/` permanece apenas para desenvolvimento local, coletor Playwright, logs e secrets opcionais
- ainda falta associar settings, curriculos, templates, provider Gmail, runs, vagas e historico a
  usuarios individuais antes de um deploy compartilhado

Gate restante desta fase:

- adicionar login email/senha e isolamento dos dados por usuario
- validar OAuth e envio real em ambiente publicado
- adicionar tracking operacional de resposta, entrevista, rejeicao, ignorado e follow-up
- aproximar UI do prototipo com dashboard/campanhas/lista/detalhe `Full-time` mais completos

## Fase 4. Prospeccao freelance

Objetivo: adicionar o bot de busca por clientes freelance via Google Maps/nicho/localidade, como
planejado inicialmente.

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
- apoio a proposta, benchmark e personalizacao
- sugestoes de nichos e areas com maior concentracao
- compatibilidade futura com integracao de mapas

## Gate de qualidade entre fases

Antes de acelerar para a proxima fase, validar:

- qualidade real dos dados capturados
- taxa de falsos positivos na descoberta
- clareza do fluxo manual para o operador
- compatibilidade do schema e dos contratos atuais
