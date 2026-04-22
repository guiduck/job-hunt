# Modelo de Dominio

## Tabelas principais

### `leads`

Tabela central do sistema.

Campos minimos:

- `id`
- `business_name`
- `category`
- `city`
- `phone`
- `email`
- `maps_url`
- `website_url`
- `website_status`
- `lead_score`
- `lead_temperature`
- `crm_stage`
- `notes`
- `source_query`
- `captured_at`
- `updated_at`

### `lead_interactions`

Historico manual e comercial do lead.

Campos:

- `id`
- `lead_id`
- `interaction_type`
- `channel`
- `summary`
- `created_at`

Exemplos:

- nota manual
- email enviado
- resposta recebida
- pedido de template

### `outreach_events`

Eventos tecnicos de envio de email.

Campos:

- `id`
- `lead_id`
- `event_type`
- `provider_message_id`
- `occurred_at`

### `prompt_artifacts`

Prompts e materiais gerados pela area de IA.

Campos:

- `id`
- `lead_id`
- `artifact_type`
- `title`
- `generated_prompt`
- `created_at`

## Status recomendados

`lead_temperature`:

- `cold`
- `warm`
- `hot`

`crm_stage`:

- `new`
- `qualified`
- `contacted`
- `interested`
- `proposal_requested`
- `proposal_sent`
- `won`
- `lost`

`website_status`:

- `confirmed`
- `not_identified`
- `suspected`
