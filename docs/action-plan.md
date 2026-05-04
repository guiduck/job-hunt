# Plano de Acao

## Objetivo

Levar o projeto ate o primeiro ponto em que ele ja seja util para operacao real, sem perder
compatibilidade com a direcao de CRM, outreach e IA definida no `constitution`.

Para acompanhamento rapido do andamento real da execucao e do ultimo prompt utilizado, manter
`docs/handoff.md` atualizado junto com este plano.

## Ordem recomendada

### 1. Fundacao local

Implementar primeiro:

- `docker-compose.yml` com `PostgreSQL`
- configuracao de ambiente
- conexao da API com o banco
- migracoes iniciais

Resultado esperado:

- banco local funcional
- API preparada para persistir oportunidades

### 2. Modelo central de oportunidades

Criar primeiro as entidades minimas:

- `leads`
- `lead_interactions`

Garantias dessa etapa:

- salvar oportunidade com `opportunity_type`
- registrar `source_query` e evidencia
- editar notas e classificacao
- diferenciar `freelance` de `job` sem criar dois sistemas paralelos

### 3. Bot 1 de busca de empregos

Implementar o primeiro fluxo especializado de captura:

- keywords configuradas pelo usuario
- fallback mockado de keywords enquanto nao houver input
- busca de vagas e publicacoes no LinkedIn
- uso de keywords relevantes como sinal de score, nao como criterio eliminatorio obrigatorio
- captura de empresa, cargo, email, link e evidencia
- persistencia no banco

Resultado esperado:

- oportunidades `job` entrando com contexto suficiente para revisao e envio de email

Estado atual:

- a fundacao local, modelos, API de runs e provider/fetcher inicial foram criados
- o provider monta queries com `hiring`, `contratando`, `contratamos` + keywords
- o fluxo aceita conteudo publico fornecido para validacao local
- candidatos com email publico ou convite explicito de contato no LinkedIn com link de perfil podem virar oportunidades
- o worker consome runs `pending` no PostgreSQL, grava candidatos/oportunidades e finaliza lifecycle/metricas
- runs `running` stale viram `failed/stale` no startup do worker, sem retry automatico
- Docker Compose agora sobe PostgreSQL, API e worker compartilhando banco para validacao local

Estado do recorte:

- Docker Compose, API, worker e PostgreSQL ja foram validados localmente
- a extensao Plasmo virou a primeira camada operacional `Full-time`
- oportunidades ja podem ser listadas, filtradas, revisadas, pontuadas e anotadas
- a revisao ja foi transformada em candidatura: templates, curriculo, preview, envio real Gmail/OAuth,
  base de bulk send e historico
- login de usuario, ownership por `user_id`, reset de senha e autenticacao da extensao foram
  implementados em grande parte no recorte `007`
- a proxima entrega deve estabilizar validacao completa, testes legados autenticados, smoke publicado
  e OAuth/envio real fora do ambiente local

### 4. Revisao operacional

Aqui um painel simples ja passa a gerar valor real.

Objetivo:

- listar oportunidades
- separar `freelance` e `job`
- filtrar por campanha, temperatura e status
- priorizar aba ou modo `Full-time Job`
- atualizar `lead_temperature` e `crm_stage`
- atualizar `job_stage`
- abrir detalhes com origem, evidencias e notas
- selecionar oportunidades para outreach
- comparar score deterministico e score assistido por IA antes de confiar no envio em massa

Implementacao possivel:

- extensao Plasmo como UI local-first atual
- `Next.js` futuro se a operacao exigir painel web persistente

Recorte ja coberto em boa parte:

- backend primeiro para expor campos de revisao, score, notas, status e filtros compativeis com a UI
- usar o prototipo `references/opportunity-desk-pro` como referencia visual para lista e detalhe
- manter `Full-time` separado de `Freelance` desde as rotas, payloads e linguagem
- nao implementar bot freelance neste recorte

### 5. Envio de emails para vagas

Implementar depois da revisao manual basica:

- templates de email para candidatura
- anexo de curriculo
- conta/provedor de envio configurado, inicialmente Gmail API/OAuth como preferencia
- preview/draft antes do envio
- selecao individual de vagas
- selecao em massa de vagas
- preparo de mensagem com contexto
- disparo real controlado apos aprovacao humana
- gravacao de eventos de envio
- protecao contra duplicidade no envio em massa e controles futuros por plano/assinatura

Resultado esperado:

- o usuario consegue enviar emails reais para empresas que publicaram vagas com email disponivel,
  usando templates e curriculo anexado pela extensao/API

Estado atual:

- implementado no recorte `006-full-time-email-sending`
- token OAuth do Gmail fica no PostgreSQL
- PDFs de curriculo enviados ficam no PostgreSQL
- `.local/` e apenas conveniencia de desenvolvimento, nao storage de producao

### 5.5. Login de usuario, ownership e prontidao para deploy

Implementado em grande parte no recorte `007`; antes de avancar para mais produto, estabilizar:

- usuarios individuais com cadastro/login por email e senha
- hash seguro de senha, sem senha em texto puro
- token/sessao para API e extensao Plasmo
- `user_id` em settings, curriculos, templates, provider Gmail, runs, oportunidades, drafts, envios,
  bulk batches e eventos
- backfill dos dados locais existentes para um usuario local padrao
- assinatura futura ligada ao usuario, nao a workspace/time
- `DATABASE_URL` com Postgres gerenciado
- secrets OAuth por environment/secret manager, preferencialmente `GMAIL_OAUTH_CLIENT_CONFIG_JSON`
- redirect URI publica do Gmail OAuth
- migrations e seed em ambiente publicado
- health checks de API e worker
- validacao real de envio individual fora do localhost
- estrategia futura de storage para curriculos em R2/S3 sem quebrar a API atual

Pendencias de hardening:

- atualizar testes legados para enviar bearer token nas rotas protegidas
- revisar contrato OpenAPI contra rotas implementadas
- executar quickstart local com login, reset e isolamento de dois usuarios
- validar Gmail OAuth e approved-send em ambiente publicado
- decidir se a falha `blocked_source` vs `accepted` do provider LinkedIn e bug ou expectativa antiga

### 6. Tracking e feedback loop de emprego

Adicionar depois:

- resposta
- entrevista
- rejeicao
- follow-up
- status de candidatura

Esses eventos precisam retroalimentar o CRM e a avaliacao da qualidade das buscas por emprego.

### 7. Bot freelance

Depois que o fluxo de empregos estiver util:

- buscar empresas por nicho e localidade, com Google Maps como primeira fonte planejada
- detectar ausencia ou fraqueza de website
- detectar negocios que usam Facebook/Instagram como website
- capturar telefone, nota Google, reviews, endereco e URL de origem
- salvar leads freelance
- gerar demo ou prompt `Lovable`
- usar templates de prospeccao

### 8. Camada de IA

Por ultimo nesta fase:

- gerar prompt estruturado para proposta
- gerar material reutilizando dados da oportunidade
- apoiar benchmark, personalizacao e prompt para ferramentas externas

## Sequencia de maior retorno

Se a meta for validar valor rapido, a melhor sequencia continua sendo:

1. banco local
2. modelo central de oportunidades
3. bot de busca de empregos salvando oportunidades
4. painel simples para revisar vagas
5. envio real individual ou em massa de emails com curriculo
6. login de usuario, ownership dos dados e prontidao de deploy/configuracao para sair do local
7. bot freelance Google Maps com prompts Lovable

Esse e o primeiro ponto em que o sistema deixa de ser apenas um scraper e vira uma ferramenta de
operacao.

## Validacoes por etapa

- revisar se o schema continua aditivo e compativel
- medir falsos positivos do bot antes de escalar captura
- confirmar que o fluxo manual realmente ajuda a decidir o proximo passo
- atualizar `docs/` sempre que a direcao do produto mudar
