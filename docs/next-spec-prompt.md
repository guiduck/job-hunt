## Command
speckit.specify

## Objective
Especificar o proximo hardening operacional do fluxo `Full-time`: transformar AI bulk generation e
feedback pos-envio em um workflow duravel/worker-owned, mantendo revisao humana, ownership por usuario
e contratos atuais da extensao.

## Source Request
O fluxo Full-time foi corrigido antes das proximas specs: emails vindos de LinkedIn/hashtags sao
sanitizados antes de chegar em drafts, bulk review, SendRequest e Gmail; o dashboard agora foca em
`jobs total` e `jobs ainda nao enviados`; o popup reduziu status para `unsent/sent/interview`; o
sender profile ganhou WhatsApp e informacoes extras para IA; e a geracao AI bulk recebe esse contexto
sem inventar fatos.

O proximo passo deve tirar o trabalho longo de geracao/envio do caminho sincrono da API e melhorar a
visibilidade operacional ate cada item terminar como `sent` ou `failed`.

## Project Context
- Stack: FastAPI, PostgreSQL, worker, extensao Plasmo/React.
- Modo prioritario: `job` / Full-time.
- Preservar: contratos publicos existentes, ownership por usuario, Gmail OAuth separado do login
  Google, envio com revisao humana, curriculos como fonte de verdade para IA.
- Estado atual importante:
  - `send_status=sent|unsent` e metricas `unsent` usam ausencia/presenca de `SendRequest`
    `job_application` com status `sent`.
  - `job_stage` e `review_status` continuam no contrato por compatibilidade, mas a UI operacional
    foca `unsent/sent/interview`.
  - `user_settings` inclui `operator_linkedin_url`, `operator_whatsapp` e `extra_context`.
  - AI email usa oportunidade, curriculo, portfolio, LinkedIn, WhatsApp e extra context sem inventar
    fatos.

## Requirements
- Mover a geracao AI bulk para processamento duravel do worker ou job assíncrono recuperavel.
- Retornar rapidamente da API com batch/item status inicial e permitir polling idempotente.
- Persistir status por item (`queued`, `running`, `completed`, `failed`, `skipped`) e erros
  estruturados.
- Preservar limite operacional de 50 itens por batch no popup.
- Permitir retomar/reconciliar batches interrompidos depois de restart do worker/API.
- Melhorar feedback pos-envio: cada item aprovado deve evoluir ate `sent` ou `failed`, com erro
  legivel quando Gmail/OAuth/curriculo falhar.
- Manter bloqueio de duplicata para `job_application` ja enviada.
- Nao enviar nenhum email sem revisao/aprovacao humana.
- Atualizar extensao para mostrar progresso de geracao e envio sem travar o popup.
- Manter sanitizacao de recipient em edicoes manuais, SendRequest e camada final antes de Gmail.
- Incluir testes de ownership para batches e send requests.

## Non-Goals
- Reabrir fonte externa de vagas descartada.
- Remover `job_stage` ou `review_status` legados.
- Submeter formularios externos automaticamente.
- Criar app web Next.js antes de validar o fluxo extension-first.

## Acceptance Criteria
- Criar batch AI retorna rapido e pode ser acompanhado por polling.
- Um restart do worker/API nao perde itens pendentes nem duplica emails.
- Popup mostra progresso claro por item durante geracao e envio.
- Email final respeita sanitizacao, contexto do sender profile e revisao humana.
- `unsent` muda para `sent` apenas quando existe `SendRequest job_application sent`.
- Testes de contrato, unidade, integracao worker e build/typecheck da extensao passam.
- Docs afetados, `docs/handoff.md`, `docs/roadmap.md` e este arquivo ficam atualizados ao fim da implementacao.
cd