# Modelo de Dominio

## Principio de modelagem

O sistema precisa tratar toda captura como um registro estruturado de oportunidade. Mesmo que a
tabela inicial continue se chamando `leads`, ela deve suportar tanto `freelance` quanto `job`
sem perder contexto, origem e possibilidade de operacao em CRM.

O objetivo nao e guardar apenas contato bruto. O objetivo e guardar uma oportunidade reutilizavel
por revisao, outreach, IA e analytics.

## Usuarios e ownership

Antes do primeiro deploy real, o sistema deve sair do modelo single-operator local e passar a ter
usuarios individuais autenticados por email e senha.

Nao ha times/workspaces no ciclo atual. Cada usuario tem seus proprios dados e uma assinatura futura
propria.

### `users`

Campos recomendados:

- `id`
- `email`
- `password_hash`
- `display_name`
- `subscription_status`
- `subscription_plan`
- `created_at`
- `updated_at`

O campo `email` deve ser unico. `password_hash` deve ser gerado com algoritmo apropriado; senha em
texto puro nunca deve ser persistida.

### Regra de ownership

Adicionar `user_id` aos registros operacionais que pertencem a um usuario:

- settings
- curriculos
- templates editaveis/criados pelo usuario
- provider Gmail e token OAuth
- identidades Google vinculadas para login primario
- runs de busca
- oportunidades/vagas/leads
- drafts, send requests, bulk batches e outreach events
- campanhas futuras
- prompts/artefatos futuros

Templates padrao da aplicacao podem existir como seed/system templates, mas qualquer template editado
ou criado pelo usuario deve pertencer ao usuario.

## Separacao por modo

O backend pode compartilhar tabelas e infraestrutura, mas a experiencia do produto deve separar os
modos com rigor:

- registros `opportunity_type=job` pertencem ao modo `Full-time`
- registros `opportunity_type=freelance` pertencem ao modo `Freelance`
- listas, dashboards, templates, filtros e paginas de detalhe nao devem misturar os dois modos
- campos especificos de um modo nao devem aparecer como acao primaria no outro modo

Essa regra existe para evitar que vagas de emprego parecam leads comerciais ou que prospects
freelance parecam candidaturas.

## Entidade central

### `leads`

Tabela central para oportunidades capturadas.

Campos recomendados:

- `id`
- `user_id`
- `campaign_id`
- `opportunity_type`
- `market_scope`
- `business_name`
- `contact_name`
- `headline`
- `job_title`
- `category`
- `city`
- `region`
- `country`
- `phone`
- `email`
- `website_url`
- `website_status`
- `source_name`
- `source_url`
- `source_query`
- `source_evidence`
- `matched_keywords`
- `job_stage`
- `lead_score`
- `lead_temperature`
- `crm_stage`
- `demo_url`
- `resume_attachment_id`
- `last_outreach_event_id`
- `operator_notes`
- `captured_at`
- `updated_at`

### Observacoes de modelagem

- `opportunity_type` diferencia `freelance` de `job`
- `job_title`, `matched_keywords`, `job_stage` e `resume_attachment_id` sustentam o fluxo inicial de emprego
- `source_evidence` deve registrar por que aquela oportunidade entrou no sistema
- `operator_notes` concentra leitura humana e observacoes operacionais
- `website_status` nao deve ser binario; ele precisa suportar revisao
- `demo_url` permite associar a landing page criada para outreach
- `campaign_id` conecta o lead ao contexto operacional da campanha
- `demo_url` e prompts Lovable sao recursos do modo `Freelance`, nao do modo `Full-time`
- `resume_attachment_id` e `job_stage` sao recursos do modo `Full-time`, nao do modo `Freelance`

## Entidades de apoio

### `lead_interactions`

Historico de acoes humanas e comerciais relacionadas a oportunidade.

Campos recomendados:

- `id`
- `user_id`
- `lead_id`
- `interaction_type`
- `channel`
- `summary`
- `payload`
- `created_at`

Exemplos:

- nota manual
- mudanca de estagio
- email enviado
- WhatsApp enviado
- resposta recebida
- pedido de proposta
- prompt gerado
- mensagem aprovada

### `campaigns`

Agrupamento operacional para rodada de prospeccao.

Campos recomendados:

- `id`
- `user_id`
- `name`
- `channel`
- `target_niche`
- `target_region`
- `opportunity_type`
- `market_scope`
- `status`
- `notes`
- `created_at`

Campanhas devem ser escopadas por modo. Uma campanha `job` nao deve conter leads `freelance`, e uma
campanha `freelance` nao deve conter vagas.

### `message_templates`

Templates reutilizaveis para outreach por contexto.

Campos recomendados:

- `id`
- `user_id`
- `name`
- `channel`
- `message_stage`
- `template_kind`
- `content`
- `variables_schema`
- `is_active`
- `mode`
- `subject_template`
- `body_template`
- `created_at`

Templates iniciais devem priorizar email de candidatura para vagas encontradas, com variaveis como
empresa, cargo, autor da publicacao, keywords encontradas, link da vaga e breve apresentacao do
usuario. A tela `Templates` deve permitir criar, editar, ativar/desativar e testar preview.

Templates tambem devem ser escopados por modo:

- templates `job_application` e `job_follow_up` aparecem no modo `Full-time`
- templates `freelance_first_contact` e `freelance_follow_up` aparecem no modo `Freelance`
- a UI nao deve oferecer templates freelance na tela de vaga
- a UI nao deve oferecer templates de candidatura na tela de lead freelance

### `resume_attachments`

Arquivos de curriculo disponiveis para envio.

Campos recomendados:

- `id`
- `user_id`
- `display_name`
- `file_url`
- `file_name`
- `mime_type`
- `file_content`
- `is_default`
- `created_at`

No recorte atual, o PDF pode ficar diretamente no PostgreSQL em `file_content` para simplificar o
MVP. Quando houver volume maior, mover os bytes para R2/S3/GCS e manter no banco apenas metadata,
`storage_backend`, chave do objeto e relacoes.

### `email_accounts`

Conta ou provedor autorizado para envio.

Campos recomendados:

- `id`
- `user_id`
- `provider_name`
- `display_email`
- `display_name`
- `auth_status`
- `send_limit_per_day`
- `token_json`
- `token_updated_at`
- `created_at`
- `updated_at`

O provedor preferencial para o primeiro recorte e Gmail API/OAuth, porque o usuario quer um botao
que envie email real a partir do proprio contexto. SMTP pode existir como fallback posterior, mas
credenciais sensiveis nao devem ficar na extensao.

`send_limit_per_day` deve ser opcional. Limites futuros devem vir da assinatura do usuario, nao de
variavel global. O token OAuth concedido pelo usuario fica em `token_json`; o
client secret do app Google vem de secret do ambiente e nao deve ser exposto em schemas de resposta.

### `user_settings`

Perfil operacional owner-scoped usado por templates, emails com IA e assistentes.

Campos atuais/recomendados:

- `id`
- `user_id`
- `operator_name`
- `operator_email`
- `portfolio_url`
- `operator_linkedin_url`
- `operator_whatsapp`
- `extra_context`
- `default_mode`
- `created_at`
- `updated_at`

Regras:

- `operator_whatsapp` aceita validacao leve para telefone/WhatsApp humano (`+`, digitos, espacos,
  parenteses e hifen) e deve ser omitido pela IA quando vazio.
- `extra_context` e um campo livre para instrucoes/fatos fornecidos pelo operador; a IA pode usar esse
  texto apenas como contexto fornecido e nao deve expandi-lo em alegacoes inventadas.
- Nome, email, portfolio, LinkedIn, WhatsApp, informacoes extras e curriculo padrao/selecionado podem
  entrar no contexto de geracao de email, sempre com revisao humana antes de envio.

### `email_drafts`

Preview revisavel antes do envio.

Campos recomendados:

- `id`
- `user_id`
- `lead_id`
- `template_id`
- `resume_attachment_id`
- `to_email`
- `subject`
- `body`
- `status`
- `created_by`
- `created_at`
- `updated_at`

### `outreach_events`

Eventos tecnicos de envio de email.

Campos recomendados:

- `id`
- `user_id`
- `lead_id`
- `channel`
- `event_type`
- `provider_name`
- `provider_message_id`
- `resume_attachment_id`
- `template_id`
- `draft_id`
- `recipient_email`
- `subject`
- `status`
- `error_message`
- `payload`
- `occurred_at`

Eventos de email devem ser criados para `queued`, `sent`, `failed`, `skipped_duplicate` e
`skipped_missing_contact`, permitindo envio individual, envio em massa e auditoria posterior.

### `whatsapp_events`

Eventos tecnicos de envio de WhatsApp.

Campos recomendados:

- `id`
- `lead_id`
- `event_type`
- `provider_name`
- `provider_message_id`
- `payload`
- `occurred_at`

### `prompt_artifacts`

Artefatos gerados pela camada futura de IA.

Campos recomendados:

- `id`
- `lead_id`
- `artifact_type`
- `variant`
- `title`
- `generated_prompt`
- `input_context`
- `external_target`
- `copied_at`
- `created_at`

Exemplos de uso:

- prompt `Lovable` completo
- prompt `Lovable` compacto
- prompt generico

Na primeira experiencia, `prompt_artifacts` e uma capacidade do modo `Freelance`. O modo
`Full-time` pode usar IA no futuro para melhorar emails ou resumir vagas, mas nao deve exibir
`Gerar Prompt Lovable` como acao primaria.

### `field_response_suggestions`

Respostas curtas/medias geradas ou salvas para campos externos de candidatura.

Campos recomendados:

- `id`
- `user_id`
- `keyword`
- `field_label`
- `field_context`
- `response_text`
- `source`: `ai_generated`, `operator_saved`, `manual_edit`
- `used_count`
- `last_used_at`
- `created_at`

Regras:

- `keyword` deve ser owner-scoped e derivada de label, placeholder, aria-label, name, pergunta
  proxima ou mapeamento manual do usuario.
- Manter no maximo as 3 respostas mais recentes/uteis por usuario + keyword.
- A resposta deve ser inserida em campo externo somente por acao explicita do usuario.
- Nao armazenar valores digitados de campos sensiveis; campos de senha, pagamento, OTP, email
  pessoal puro e documentos devem ser ignorados pelo detector.
- O contexto de curriculo/perfil fica no backend; a extensao nao deve receber dados sensiveis alem da
  resposta escolhida para inserir.

### `field_assistant_activations`

Permissoes owner-scoped para decidir onde o assistente de campos pode aparecer.

Campos recomendados:

- `id`
- `user_id`
- `scope_type`: `base_domain` ou `exact_page`
- `scope_value`: dominio normalizado ou URL sanitizada
- `display_name`
- `enabled`
- `last_used_at`
- `created_at`
- `updated_at`

Regras:

- A ativacao e desligada por padrao para qualquer dominio externo.
- `base_domain` cobre subpaths do dominio normalizado; `exact_page` cobre apenas a URL sanitizada sem
  fragmentos e tracking params conhecidos.
- Ativacoes pertencem ao usuario autenticado e nao sao globais.
- Ao fazer logout ou perder sessao, content scripts devem tratar a pagina como nao autorizada.

### `field_answer_generations`

Registro tecnico das respostas geradas para campos externos.

Campos recomendados:

- `id`
- `user_id`
- `keyword`
- `field_label`
- `page_origin`
- `status`
- `answer_text`
- `error_message`
- `created_at`

Regras:

- O registro serve para auditoria/debug de geracao, nao para auto-salvar sugestoes.
- Uma resposta so vira sugestao reutilizavel quando o operador clica explicitamente em salvar.

### Dados adicionais para Google Maps freelance

Quando o modo `Freelance` implementar descoberta por Google Maps, os registros devem preservar:

- nome do negocio
- nicho
- cidade, estado/regiao e pais
- endereco
- telefone
- email publico quando encontrado
- URL do Google Maps ou identificador da fonte
- nota Google e quantidade de avaliacoes
- `website_url`, quando existir
- `website_status`: sem site, rede social como site, site fraco, site bom ou incerto
- sinais do problema: sem HTTPS, nao responsivo, lento, antigo, sem CTA, apenas Facebook/Instagram
- concorrente de referencia, quando usado no argumento comercial

## Enums recomendados

### `lead_temperature`

- `cold`
- `warm`
- `hot`

### `crm_stage`

Estados compartilhados para operacao de oportunidade:

- `new`
- `qualified`
- `contacted`
- `interested`
- `proposal_requested`
- `proposal_sent`
- `won`
- `lost`

O fluxo `job` tem estados proprios em `job_stage`, mas `crm_stage` continua util para a leitura
compartilhada do funil.

### `opportunity_type`

- `freelance`
- `job`

### `job_stage`

Estados especificos para o fluxo de emprego:

- `new`
- `saved`
- `applied`
- `responded`
- `interview`
- `rejected`
- `ignored`

### `message_template_kind`

- `job_application`
- `job_follow_up`
- `freelance_first_contact`
- `freelance_follow_up`

### `email_draft_status`

- `draft`
- `approved`
- `queued`
- `sent`
- `failed`
- `cancelled`

### `website_status`

- `confirmed`
- `not_identified`
- `suspected`

## Regras de compatibilidade

- evoluir o schema de forma aditiva sempre que possivel
- preservar campos de origem, sinais e notas desde a primeira versao
- evitar tabelas separadas cedo demais para `freelance` e `job` se a mesma entidade central suportar os dois casos
- separar eventos tecnicos de operacao humana para manter leitura simples no CRM

## Casos de uso que o modelo precisa suportar

- filtrar oportunidades por trilho, nicho, geografia e score
- filtrar vagas por keywords encontradas, email disponivel e `job_stage`
- filtrar oportunidades por campanha, temperatura e status
- preparar preview e enviar email real de candidatura com curriculo anexado
- enviar emails em massa com dedupe, preview, aprovacao humana e registro de evento por destinatario
- registrar resposta, entrevista, rejeicao ou follow-up
- revisar se uma empresa realmente nao tem site
- registrar contatos, respostas e mudancas de estagio
- salvar uma URL de demo por lead
- gerar e versionar prompt para `Lovable`
- preparar contexto para email, WhatsApp e IA
- gerar e reaproveitar respostas para perguntas de formularios de candidatura externos
- medir qualidade da busca por `source_query`, nicho e localidade
- descobrir leads freelance via Google Maps por nicho/localidade e classificar ausencia/fraqueza de site

## Requisitos de UI derivados do modelo

- Toda consulta de lista deve receber ou inferir `opportunity_type`.
- A tela `Full-time / Leads` deve consultar apenas `opportunity_type=job`.
- A tela `Freelance / Leads` deve consultar apenas `opportunity_type=freelance`.
- A pagina de detalhe deve renderizar componentes diferentes por modo.
- Acoes em massa devem respeitar o modo ativo.
- Dashboards devem agregar metricas por modo, nunca em uma unica visao misturada.
- Dashboards devem buscar agregados totais do modo ativo, sem depender dos filtros/paginacao da lista
  operacional que o usuario esta revisando naquele momento.
- Templates e envios devem ser sempre escopados por modo.
- A extensao Plasmo pode operar o modo `Full-time`, mas deve consumir os mesmos contratos que uma
  futura web.
- O assistente de campos da extensao deve escopar respostas por usuario autenticado e nao deve
  aparecer quando a sessao local nao existir.
