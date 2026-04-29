# Roadmap

Este arquivo descreve a direcao estavel do produto.

Para saber onde a execucao parou, qual e a fase atual e qual foi o ultimo prompt usado, consulte
`docs/handoff.md`.

## Fase 1. Fundacao operacional

Objetivo: criar a base minima que permita captura e persistencia com qualidade.

- ambiente local com `Docker Compose` e `PostgreSQL`
- API em `FastAPI`
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

## Fase 3. Revisao e envio para vagas

Objetivo: permitir que o usuario revise oportunidades de emprego e envie templates com curriculo.

- lista e filtros por `opportunity_type`
- filtros por campanha, temperatura e status
- status especificos de candidatura
- notas do operador
- visao detalhada da evidencia da captura
- selecao individual ou em massa
- envio de email com curriculo anexado
- tracking de resposta, entrevista, rejeicao ou ignorado

## Fase 4. Prospeccao freelance

Objetivo: adicionar o bot de busca por clientes freelance, como planejado inicialmente.

- consultas por nicho, cidade, bairro e mercado
- deteccao de website com estados revisaveis
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
