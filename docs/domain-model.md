# Modelo de Dominio

## Principio de modelagem

O sistema precisa tratar toda captura como um registro estruturado de oportunidade. Mesmo que a
tabela inicial continue se chamando `leads`, ela deve suportar tanto `freelance` quanto `job`
sem perder contexto, origem e possibilidade de operacao em CRM.

O objetivo nao e guardar apenas contato bruto. O objetivo e guardar uma oportunidade reutilizavel
por revisao, outreach, IA e analytics.

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
- `name`
- `channel`
- `message_stage`
- `template_kind`
- `content`
- `variables_schema`
- `is_active`
- `created_at`

Templates iniciais devem priorizar email de candidatura para vagas encontradas, com variaveis como
empresa, cargo, keywords encontradas e breve apresentacao do usuario.

Templates tambem devem ser escopados por modo:

- templates `job_application` e `job_follow_up` aparecem no modo `Full-time`
- templates `freelance_first_contact` e `freelance_follow_up` aparecem no modo `Freelance`
- a UI nao deve oferecer templates freelance na tela de vaga
- a UI nao deve oferecer templates de candidatura na tela de lead freelance

### `resume_attachments`

Arquivos de curriculo disponiveis para envio.

Campos recomendados:

- `id`
- `display_name`
- `file_url`
- `file_name`
- `mime_type`
- `is_default`
- `created_at`

### `outreach_events`

Eventos tecnicos de envio de email.

Campos recomendados:

- `id`
- `lead_id`
- `channel`
- `event_type`
- `provider_name`
- `provider_message_id`
- `resume_attachment_id`
- `payload`
- `occurred_at`

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
- enviar email de candidatura com curriculo anexado
- registrar resposta, entrevista, rejeicao ou follow-up
- revisar se uma empresa realmente nao tem site
- registrar contatos, respostas e mudancas de estagio
- salvar uma URL de demo por lead
- gerar e versionar prompt para `Lovable`
- preparar contexto para email, WhatsApp e IA
- medir qualidade da busca por `source_query`, nicho e localidade

## Requisitos de UI derivados do modelo

- Toda consulta de lista deve receber ou inferir `opportunity_type`.
- A tela `Full-time / Leads` deve consultar apenas `opportunity_type=job`.
- A tela `Freelance / Leads` deve consultar apenas `opportunity_type=freelance`.
- A pagina de detalhe deve renderizar componentes diferentes por modo.
- Acoes em massa devem respeitar o modo ativo.
- Dashboards devem agregar metricas por modo, nunca em uma unica visao misturada.
