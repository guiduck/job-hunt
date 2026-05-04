# Arquitetura

## Stack base

A base atual do projeto deve permanecer simples e compativel com o `constitution`:

- `FastAPI` para API e orquestracao leve
- `PostgreSQL` como fonte central de dados
- `Docker Compose` para ambiente local
- worker separado para jobs demorados
- extensao Chrome/Plasmo como primeira interface operacional local

## Objetivo arquitetural

A arquitetura precisa suportar:

- usuarios individuais autenticados por email/senha
- descoberta especializada de oportunidades
- armazenamento estruturado e reutilizavel
- operacao manual em fluxo de CRM
- outreach assistido por contexto, template, curriculo anexado e envio real aprovado pelo operador
- evolucao futura para IA e interfaces internas

## Componentes principais

### API

Responsavel por expor operacao e consulta:

- cadastro/login de usuario e resolucao de `current_user`
- CRUD e filtros de oportunidades
- leitura e atualizacao de classificacao, notas e estagios
- endpoints para iniciar jobs
- endpoints para revisar templates, anexos e envios
- endpoints para preparar drafts, aprovar envios e consultar eventos de outreach

A API nao deve executar scraping pesado, enriquecimento demorado ou envio em lote no mesmo
processo HTTP.

### Worker

Responsavel por processamento assincrono:

- scraping por nicho, geografia e tipo de oportunidade
- busca de vagas e publicacoes com keywords relevantes
- extracao de empresa, cargo, email e evidencia
- deduplicacao e normalizacao
- enriquecimento de contato e sinais
- analise opcional com IA sobre texto publico ja coletado
- preparacao e envio controlado de email via provider configurado
- futuras buscas freelance por Google Maps/nicho/localidade

Toda logica longa ou sujeita a retries deve ficar aqui.

### IA

A IA deve entrar como camada de interpretacao e qualificacao, nao como substituta direta do provider
de coleta. O provider/fetcher continua responsavel por buscar dados publicos de forma rastreavel,
com `source_query`, `source_url`, status de provider e evidencias. Depois disso, uma etapa opcional no
worker pode usar IA para extrair campos com mais nuance, estimar aderencia, explicar score, reduzir
falsos positivos e devolver JSON validado contra os schemas existentes.

Essa separacao evita um fluxo opaco: a IA ajuda a entender melhor o texto coletado, mas nao deve
burlar login, rate limit, controles de acesso ou transformar a busca em navegacao automatica sem
rastreabilidade.

### Banco

O banco precisa armazenar mais do que um lead cru. Ele deve sustentar:

- usuarios individuais, password hash e estado futuro de assinatura
- oportunidade central
- evidencias da captura
- interacoes e notas do operador
- eventos de outreach
- curriculos e anexos de envio, se forem armazenados pelo sistema
- templates e artefatos futuros de IA
- contas/provedores de envio, drafts, aprovacoes e eventos tecnicos de email

Dados operacionais nao devem depender de `.local/`. Tokens OAuth concedidos pelo usuario ficam no
PostgreSQL em `sending_provider_accounts.token_json`, e PDFs de curriculo enviados pelo app ficam em
`resume_attachments.file_content` enquanto o projeto ainda nao usa bucket. `.local/` fica reservado
para desenvolvimento: perfil Playwright, logs e arquivos de secret opcionais.

Antes do primeiro deploy real, dados operacionais precisam ser escopados por `user_id`. Nao ha
workspaces/times no plano atual: settings, curriculos, templates, provider Gmail, runs, oportunidades,
drafts, envios e eventos pertencem a um usuario individual. Assinaturas futuras tambem devem ser por
usuario.

### Extensao Plasmo

A extensao e a primeira interface operacional real do modo `Full-time`. Ela deve:

- consumir a API por `PLASMO_PUBLIC_API_BASE_URL`, apontando para `http://localhost:8000` no inicio
  e para homologacao/producao depois
- exigir login explicito por email/senha antes de acessar dados protegidos em ambiente publicado
- usar a sessao autenticada do navegador do operador para abrir buscas do LinkedIn, rolar resultados
  e capturar publicacoes visiveis
- exibir dashboard, busca, lista, detalhe, filtros, diagnosticos de captura e acoes de candidatura
- acionar drafts/envios de email pela API, sem guardar segredo sensivel dentro do bundle da extensao

### Envio de email

Envio real de email deve ser tratado como workflow operacional:

- a API cria ou atualiza templates, curriculos, drafts e pedidos de envio
- o operador revisa o preview e aprova um envio individual ou em massa
- o worker ou adapter dedicado envia pelo provedor configurado, inicialmente Gmail API/OAuth como
  preferencia e SMTP como fallback se necessario
- cada tentativa grava evento tecnico com provider, status, destinatario, template, curriculo e erro
  quando houver
- envio em massa deve ter fila, dry-run/preview, protecao contra duplicidade e controles futuros por
  plano/assinatura, nao limites globais por variavel de ambiente

O `client secret` do OAuth e configuracao do app Google e deve vir de `GMAIL_OAUTH_CLIENT_CONFIG_JSON`
em secrets do ambiente ou de `GMAIL_OAUTH_CLIENT_SECRETS_FILE` em desenvolvimento local. O token
OAuth gerado apos consentimento e dado operacional e fica no banco.

### Web futura

O projeto pode nascer sem frontend, mas uma interface simples passa a fazer sentido cedo quando
voce quiser:

- separar `freelance` e `job` por abas ou filtros
- mudar `lead_temperature` e `crm_stage` por clique
- acompanhar `job_stage`, resposta e entrevista
- revisar oportunidade antes de outreach
- operar campanhas, templates, anexos e prompts

Quando isso acontecer, `Next.js` continua sendo uma opcao coerente para painel interno. A web deve
reusar os mesmos contratos da extensao em vez de criar um backend paralelo.

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
- todos os dados operacionais devem ter dono (`user_id`) antes de serem expostos em ambiente publico

### Usuario x assinatura futura

- o MVP usa usuarios individuais com email/senha
- nao ha time, workspace ou organizacao no primeiro ciclo
- planos, limites e billing futuros pertencem ao usuario
- variaveis de ambiente nao devem controlar limites de produto por usuario

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
7. o operador aprova e o worker/provider envia
8. respostas, entrevistas e descartes retroalimentam a mesma base de dados
9. depois, o mesmo modelo suporta o bot freelance com Google Maps, demo, prompt `Lovable`, email e
   WhatsApp

## Estrutura sugerida

```text
apps/
  api/
  worker/
  extension/    # Plasmo, interface local-first para captura/revisao/outreach
  web/          # opcional, entra quando a operacao manual justificar
docs/
docker-compose.yml
```

## Deploy

### Local

- `Docker Compose` para `PostgreSQL`, API e worker local quando Docker estiver disponivel
- API e worker tambem podem rodar separadamente contra o mesmo banco durante desenvolvimento
- extensao Plasmo roda localmente e aponta para a API configurada por env var

### Producao

- `Render` para API
- `Render` para worker
- `Render Postgres` para banco
- `Vercel` para a web, se existir
- Chrome Web Store ou distribuicao manual para a extensao, quando a API remota existir
- secrets do ambiente para OAuth, database e provider config; nao copiar `.local/` como estrategia de
  deploy
- login/ownership por usuario antes de expor a API para uso real

## Regras nao negociaveis

- nao misturar scraping pesado com o processo HTTP
- nao enviar emails em lote diretamente pelo processo HTTP
- preservar suporte a `freelance` e `job` desde o modelo e filtros
- nao expor dados globais sem `user_id` em ambiente publicado
- priorizar evolucao compativel do esquema e dos contratos
