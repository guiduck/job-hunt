# Arquitetura

## Stack base

A base atual do projeto deve permanecer simples e compativel com o `constitution`:

- `FastAPI` para API e orquestracao leve
- `PostgreSQL` como fonte central de dados
- `Docker Compose` para ambiente local
- worker separado para jobs demorados

## Objetivo arquitetural

A arquitetura precisa suportar:

- descoberta especializada de oportunidades
- armazenamento estruturado e reutilizavel
- operacao manual em fluxo de CRM
- outreach assistido por contexto, template e curriculo anexado
- evolucao futura para IA e interfaces internas

## Componentes principais

### API

Responsavel por expor operacao e consulta:

- CRUD e filtros de oportunidades
- leitura e atualizacao de classificacao, notas e estagios
- endpoints para iniciar jobs
- endpoints para revisar templates, anexos e envios

A API nao deve executar scraping pesado, enriquecimento demorado ou envio em lote no mesmo
processo HTTP.

### Worker

Responsavel por processamento assincrono:

- scraping por nicho, geografia e tipo de oportunidade
- busca de vagas e publicacoes com keywords relevantes
- extracao de empresa, cargo, email e evidencia
- deduplicacao e normalizacao
- enriquecimento de contato e sinais
- preparacao futura de envio de email e WhatsApp

Toda logica longa ou sujeita a retries deve ficar aqui.

### Banco

O banco precisa armazenar mais do que um lead cru. Ele deve sustentar:

- oportunidade central
- evidencias da captura
- interacoes e notas do operador
- eventos de outreach
- curriculos e anexos de envio, se forem armazenados pelo sistema
- templates e artefatos futuros de IA

### Web futura

O projeto pode nascer sem frontend, mas uma interface simples passa a fazer sentido cedo quando
voce quiser:

- separar `freelance` e `job` por abas ou filtros
- mudar `lead_temperature` e `crm_stage` por clique
- acompanhar `job_stage`, resposta e entrevista
- revisar oportunidade antes de outreach
- operar campanhas, templates, anexos e prompts

Quando isso acontecer, `Next.js` continua sendo uma opcao coerente para painel interno.

Os referenciais visuais atuais sugerem uma web com modulos como:

- `Dashboard`
- `Campanhas`
- `Leads`
- `Templates`
- `Configuracoes`
- areas auxiliares de feedback, discussoes, comunidade e changelog

## Fronteiras importantes

### API x worker

- API recebe comandos, consulta dados e registra decisoes do operador
- worker executa captura, enriquecimento, deduplicacao e jobs pesados

### Dados operacionais x dados tecnicos

- CRM, notas, classificacao e filtros devem ficar faceis de consultar
- eventos tecnicos de email, WhatsApp e scraping devem ser rastreaveis sem poluir a visao do operador

### Fluxo humano x automacao

- o sistema pode preparar envio automaticamente
- a decisao de enviar deve permanecer revisavel por humano ate haver regras claras de compliance

## Fluxo recomendado

1. o operador define keywords, preferencias de vaga e curriculo base
2. a API dispara um job de busca de empregos
3. o worker encontra publicacoes, emails e evidencias relevantes
4. a API entrega lista de leads `job` para revisao
5. o operador qualifica a vaga, edita o template e escolhe envio individual ou em massa
6. o sistema prepara email com curriculo anexado
7. o operador aprova e envia
8. respostas, entrevistas e descartes retroalimentam a mesma base de dados
9. depois, o mesmo modelo suporta o bot freelance com demo, prompt `Lovable` e WhatsApp

## Estrutura sugerida

```text
apps/
  api/
  worker/
  web/          # opcional, entra quando a operacao manual justificar
docs/
docker-compose.yml
```

## Deploy

### Local

- `Docker Compose` para `PostgreSQL`
- API e worker rodando separadamente

### Producao

- `Render` para API
- `Render` para worker
- `Render Postgres` para banco
- `Vercel` para a web, se existir

## Regras nao negociaveis

- nao misturar scraping pesado com o processo HTTP
- preservar suporte a `freelance` e `job` desde o modelo e filtros
- priorizar evolucao compativel do esquema e dos contratos
