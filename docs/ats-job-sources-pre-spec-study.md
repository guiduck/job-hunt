# Estudo Pre-Spec: Busca Full-time por ATS e Fontes Permitidas

**Data**: 2026-06-02  
**Objetivo de produto**: Opportunity Desk promete encontrar vagas acionaveis com contato util. O core vira
ATS/career pages + AI matching + email assistido, enquanto LinkedIn fica posicionado como assistente
para acelerar uma acao que o usuario ja faria manualmente.

## Frase De Posicionamento

> Opportunity Desk e um helper para quem esta buscando vagas: ele encontra oportunidades acionaveis,
> organiza o que tem email ou link de candidatura, ajuda a priorizar por aderencia e prepara a proxima
> acao com revisao humana.

Nao vender como "LinkedIn scraper". Vender como assistente de candidatura e mesa operacional para
economizar tempo do candidato.

## Tese

A extensao no LinkedIn deve continuar descrita como captura assistida pelo usuario: o operador abre,
ve e aciona a coleta do que ja esta na tela dele. Para reduzir dependencia e risco, a busca
programatica principal deve crescer via fontes que publicam vagas para serem exibidas em career pages
ou via APIs licenciadas.

Essa evolucao corrige uma limitacao real do fluxo atual: nem toda vaga boa tem email. Quando nao ha
email, ainda existe valor se o sistema salvar a vaga, estimar fit, gerar curriculo/email/respostas
para formulario e levar o usuario ao link certo de candidatura.

## Diferenca Em Relacao Ao Spike Externo Descartado

O spike descartado tentava descobrir email de empresas depois de achar vagas externas. Isso gerou
baixa utilidade porque muitas respostas mandavam o candidato para ATS/careers page.

Este recorte e diferente:

- nao promete descobrir email quando a vaga nao publicou email;
- salva vagas externas mesmo sem email, desde que tenham link oficial de candidatura;
- separa claramente "com email" de "candidatura externa";
- usa AI matching para priorizar oportunidades;
- usa o AI field assistant/curriculo ATS para facilitar formularios externos;
- mantem LinkedIn como acao assistida, nao como marca do produto.

## Fontes Pesquisadas

### Greenhouse

Fonte oficial: [Greenhouse Job Board API](https://developers.greenhouse.io/job-board).

Achados:

- API feita para job boards e career sites.
- GET endpoints de job board sao publicos e nao exigem autenticacao.
- Retorna boards, offices, departments e published jobs em JSON.
- Exige `board_token`, ou seja, nao e uma busca global: precisamos conhecer empresas/boards alvo.
- O endpoint de submissao de candidatura exige autenticacao e deve ficar fora do MVP.

Fit para MVP: alto.

Uso recomendado:

- manter uma tabela/lista de board tokens conhecidos;
- buscar jobs publicados por token;
- filtrar localmente por keywords, senioridade, remoto/localidade e AI fit;
- salvar `application_url`/`source_url`, empresa, cargo, localidade, descricao e fonte.

### Ashby

Fonte oficial: [Ashby Job Postings API](https://developers.ashbyhq.com/docs/public-job-posting-api).

Achados:

- API publica para jobs atualmente publicados de uma organizacao.
- Permite chamar `https://api.ashbyhq.com/posting-api/job-board/{JOB_BOARD_NAME}`.
- Pode incluir compensacao via query param.
- Assim como Greenhouse, depende de conhecer o `JOB_BOARD_NAME`; nao e busca global.

Fit para MVP: alto, especialmente para startups/empresas tech.

Uso recomendado:

- seed inicial com empresas tech relevantes que usam Ashby;
- sincronizar jobs recentes;
- usar AI filter para reduzir ruido;
- separar como "external application" quando nao houver email.

### Lever

Fonte oficial: [Lever Postings API](https://github.com/lever/postings-api).

Achados:

- API/documentacao publica para job postings.
- Vagas publicadas tambem ficam em sites como `https://jobs.lever.co/{company}`.
- Suporta listagem paginada e detalhe da vaga.
- Tambem depende de slug/empresa conhecida; nao e busca global.

Fit para MVP: alto.

Uso recomendado:

- provider semelhante a Greenhouse/Ashby;
- seed de slugs;
- dedupe por provider + external job id/url + company + title.

### Workable

Fontes oficiais: [Workable API Documentation](https://help.workable.com/hc/en-us/articles/115013356548-Workable-API-Documentation) e [Using the Workable API to create a careers page](https://help.workable.com/hc/en-us/articles/115012771647-Using-the-Workable-API-to-create-a-careers-page).

Achados:

- API permite listar jobs e detalhes, mas parece mais voltada a contas Workable/integracoes.
- Documentacao menciona rate limit de 10 requests por 10 segundos.
- Para o nosso produto, precisa validar autenticacao, permissao e se ha endpoints publicos por
  subdomain utilizaveis sem parceria.

Fit para MVP: medio.

Uso recomendado:

- nao entrar no primeiro recorte salvo se houver endpoint publico claro por empresa;
- tratar como provider experimental/desabilitado por padrao.

### InHire

Fonte oficial: [Como listar todas as vagas de maneira paginada | InHire API](https://docs.inhire.com.br/guides/guias/vaga/listar).

Achados:

- Ha documentacao para listar vagas com `getJobsLeanPaginated`.
- A API parece voltada a integracoes autenticadas do cliente InHire, nao a descoberta publica global.
- Produto brasileiro relevante para o mercado tech, entao vale investigar com cuidado.

Fit para MVP: medio/baixo sem permissao ou endpoint publico.

Uso recomendado:

- mapear career pages publicas InHire primeiro;
- se exigir token/parceria, deixar para recorte posterior;
- nao fazer scraping agressivo sem revisar termos.

### Gupy

Fontes oficiais: [Gupy Public API - creating a job](https://developers.gupy.io/docs/creating-a-job), [Portal Gupy](https://portal.gupy.io/) e referencia de feed em [artigo Gupy sobre job boards](https://www.gupy.io/blog/job-boards-recrutamento).

Achados:

- A Public API oficial encontrada e mais voltada a empresas/integracoes para criar/gerenciar vagas.
- O Portal Gupy concentra muitas vagas no Brasil.
- Artigo da Gupy menciona feed XML para job boards parceiros, mas isso precisa revisao de termos e
  disponibilidade antes de virar provider.

Fit para MVP: medio para pesquisa; baixo para implementacao imediata sem clareza de permissao.

Uso recomendado:

- criar spike documental/tecnico separado para Gupy;
- priorizar se houver endpoint publico/permitido de listagem;
- caso contrario, tratar como fonte manual ou provider licenciado/parceiro.

### Catho

Fonte oficial: [Portal dos desenvolvedores Catho](https://desenvolvedores.catho.com.br/).

Achados:

- API de vagas da Catho e voltada a recrutadores/empresas para divulgar vagas.
- Exige autenticacao.
- Nao parece uma fonte direta para buscar vagas como candidato.

Fit para MVP: baixo.

Uso recomendado:

- nao priorizar no primeiro recorte;
- manter como potencial integracao/parceria, nao como fonte publica.

### APIs Licenciadas De Dados De Vagas

Fontes:

- [TheirStack API](https://theirstack.com/en/docs/api-reference)
- [jobdata API docs](https://jobdataapi.com/docs/)
- [Adzuna API](https://developer.adzuna.com/)

Achados:

- Podem entregar busca global por keywords, pais, remoto, empresa e tecnologias sem manter scrapers.
- TheirStack declara job postings em 100+ paises e filtros flexiveis.
- jobdata API oferece jobs ATS-sourced, filtros e planos pagos; recomenda backend/cache e nao expor API key no frontend.
- Adzuna oferece API de anuncios de emprego por keyword/localizacao.

Fit para MVP: medio/alto se aceitarmos custo/licenca.

Uso recomendado:

- avaliar preco, licenca e cobertura Brasil/remoto;
- usar como fallback ou acelerador quando board-specific APIs exigirem muitos slugs;
- manter dados cacheados e contratos de uso respeitados.

## Conclusao De Fonte

Atualizacao 2026-06-02: a conclusao abaixo foi superada pela spec
`specs/013-serpapi-career-search/spec.md`. APIs oficiais de Ashby, Lever e Greenhouse exigem
empresa/board/tenant e nao resolvem a busca global desejada. O recorte recomendado agora e busca por
career pages curadas sem exigir empresa do operador, usando URLs oficiais encontradas por keyword,
com InHire, Ashby, Lever, Greenhouse, SmartRecruiters, Trampos e Catho como fontes ativas iniciais.

### Conclusao anterior preservada como historico

Primeiro recorte recomendado:

1. Greenhouse
2. Ashby
3. Lever
4. lista manual/configuravel de empresas/boards
5. UI de provedores on/off em Settings
6. botao `Search other sources` em Search
7. Jobs com tabs `With email` e `External applications`

Segundo recorte:

1. InHire/Gupy como pesquisa separada para mercado Brasil
2. Workable se houver endpoint publico claro
3. provider licenciado como TheirStack/jobdata/Adzuna

## UX Proposta

### Settings

Adicionar secao `Job sources`.

Controles:

- lista de provedores com checkbox/toggle:
  - LinkedIn assisted capture
  - Greenhouse
  - Ashby
  - Lever
  - Workable experimental
  - InHire research
  - Gupy research
- cada provider com status:
  - `enabled`
  - `disabled`
  - `research_only`
  - `requires_config`
- lista de companies/boards configurados:
  - provider
  - company label
  - slug/board token
  - country/market tags
  - active
- botao para adicionar board manualmente.

Regra: para o MVP, nao precisa descobrir todos os boards automaticamente. Uma lista seed + adicao
manual ja entrega valor e evita scraping exploratorio agressivo.

### Search

Manter o bloco atual de LinkedIn.

Adicionar abaixo:

- botao primario/secundario: `Search other sources`
- texto curto: busca vagas em ATS/career pages habilitados nas Settings
- usa a mesma query/keywords atuais
- mostra progresso:
  - providers checked
  - boards checked
  - jobs inspected
  - accepted
  - duplicates
  - external-only
  - with email
- opcional: toggle `Only jobs with email` desligado por padrao para esse fluxo.

### Jobs

Adicionar tabs dentro de `/jobs`:

- `With email`: vagas com contato direto por email ou convite claro de contato.
- `External applications`: vagas sem email, mas com link oficial de candidatura.

Comportamento:

- `With email` mantem envio por Gmail/template.
- `External applications` mostra `Open application`, score, fit, keywords e origem.
- Para external applications, a acao primaria nao e `Send`; e `Apply`/`Open`.
- O AI field assistant e curriculo ATS viram recursos centrais para essa aba.

## Modelo De Dados Proposto

Adicionar/estender de forma compativel:

### `job_source_providers`

- `id`
- `user_id` nullable para configs globais/default vs owner overrides
- `provider_key`: `linkedin_assisted`, `greenhouse`, `ashby`, `lever`, `workable`, `inhire`, `gupy`, `licensed_api`
- `display_name`
- `status`: `enabled`, `disabled`, `research_only`, `requires_config`
- `config`
- `created_at`
- `updated_at`

### `job_source_boards`

- `id`
- `user_id`
- `provider_key`
- `company_name`
- `board_token`
- `careers_url`
- `country`
- `market_tags`
- `is_active`
- `last_checked_at`
- `last_success_at`
- `last_error`
- `created_at`
- `updated_at`

### Campos Em `job_search_runs`

- `source_provider_keys`
- `external_source_count`
- `external_application_count`
- `with_email_count`

### Campos Em `opportunities/job_detail`

Campos existentes ja cobrem parte do fluxo. Confirmar/adicionar:

- `application_url`
- `contact_channel_type`: `email`, `linkedin_profile`, `external_application`, `unknown`
- `contact_channel_value`
- `collection_source_type`
- `source_provider_key`
- `external_job_id`

## Worker/Provider Design

Criar interface comum:

```text
JobSourceProvider.search(query, boards, limits) -> JobSourceCandidate[]
```

Providers:

- `GreenhouseProvider`
- `AshbyProvider`
- `LeverProvider`
- futuro `WorkableProvider`
- futuro `LicensedJobDataProvider`

Cada candidato deve normalizar:

- provider
- company
- title
- location
- remote signal
- description
- application url
- source url
- external id
- published/updated date quando disponivel
- contact email se aparecer explicitamente no texto
- source evidence

Depois, reaproveitar pipeline atual:

1. normalizacao
2. AI filter opcional
3. dedupe
4. scoring/review
5. persistencia como `opportunity_type=job`
6. exposicao em Jobs com tab correta

## Dedupe

Prioridade da chave:

1. provider + external job id
2. provider + source/application URL
3. company + title + location + provider
4. fallback com hash de title + company + normalized description excerpt

Nao misturar dedupe de LinkedIn com ATS sem usar URL/source como parte da chave, porque o mesmo cargo
pode aparecer como post no LinkedIn e como vaga oficial no ATS.

## Compliance E Produto

Mensagem de produto:

- "assistente de candidatura"
- "encontra vagas acionaveis"
- "organiza vagas com email e candidaturas externas"
- "ajuda a priorizar e aplicar com revisao humana"

Evitar:

- "scraper de LinkedIn"
- "automacao de candidaturas sem revisao"
- "disparo automatico para recrutadores"
- "burlar ATS"

Regras operacionais:

- respeitar rate limits;
- cachear resultados;
- nao expor API keys no frontend;
- manter source URL e evidence;
- permitir desativar provider;
- nao enviar email sem aprovacao humana;
- separar claramente vagas com email de vagas com candidatura externa;
- manter opt-out/suppression para emails.

## Riscos E Mitigacoes

- **Risco: ATS APIs nao oferecem busca global.**  
  Mitigacao: comecar por board registry de empresas alvo e permitir adicionar board manualmente.

- **Risco: Brasil tem fontes relevantes mas permissao/API menos clara.**  
  Mitigacao: deixar Gupy/InHire em research-only ate confirmar endpoint publico ou parceria.

- **Risco: muitas vagas sem email reduzem o valor do Gmail flow.**  
  Mitigacao: criar tab `External applications` e conectar com AI field assistant + curriculo ATS.

- **Risco: reintroduzir o problema do spike externo descartado.**  
  Mitigacao: nao descobrir email artificialmente; aceitar que algumas vagas sao "apply link".

- **Risco: volume alto no popup.**  
  Mitigacao: paginacao existente, batch limits, counters e filtro por tab.

## Prompt Pre-Spec Kit Specify

Atualizacao 2026-06-02: prompt substituido por `docs/next-spec-prompt.md`, que agora orienta
`/speckit-plan` para `specs/013-serpapi-career-search/spec.md` e evita depender de boards/slugs
digitados pelo usuario.

### Prompt anterior preservado como historico

## Command
speckit.specify

## Objective
Especificar a expansao do fluxo `Full-time` para buscar vagas em fontes ATS/career pages permitidas,
mantendo LinkedIn como captura assistida pelo usuario e adicionando uma segunda trilha de vagas sem
email, mas com link oficial de candidatura.

## Source Request
O produto deve ser vendido como assistente de candidatura, nao como scraper de LinkedIn. Ele deve
encontrar vagas acionaveis com contato util, organizar oportunidades com email e candidaturas
externas, estimar aderencia com IA e ajudar o usuario a economizar tempo. Adicionar fontes como
Greenhouse, Ashby e Lever, com Settings para ativar/desativar providers e botao na Search para
`Search other sources`.

## Project Context
- Stack: FastAPI, PostgreSQL, worker, extensao Plasmo/React.
- Modo prioritario: `job` / Full-time.
- LinkedIn atual: captura assistida pelo usuario na extensao, com filtros/AI pos-captura.
- Nova direcao: ATS/career pages + AI matching + email assistido.
- Preservar: ownership por usuario, contratos existentes, human-reviewed outreach, dedupe,
  rastreabilidade de source_query/source_url/source_evidence e API keys backend-only.

## Requirements
- Adicionar fonte programatica para Greenhouse, Ashby e Lever usando boards/slugs conhecidos.
- Permitir que o usuario ative/desative provedores de busca em Settings.
- Permitir lista de boards/empresas configuraveis por usuario, com seed inicial.
- Adicionar botao `Search other sources` na tela Search, usando a query/keywords atuais.
- Persistir candidatos e oportunidades com provider, external job id/url, application URL e evidencia.
- Separar `/jobs` em tabs `With email` e `External applications`.
- Manter envio Gmail apenas para vagas com email/contato direto.
- Para vagas externas sem email, mostrar acao primaria de abrir candidatura oficial.
- Reaproveitar AI filters/scoring para reduzir ruido das vagas externas.
- Manter rate limits, cache e logs por provider.
- Nao descobrir email automaticamente como requisito do fluxo.
- Nao enviar candidatura ou email sem revisao humana.

## Non-Goals
- Scraping agressivo de LinkedIn.
- Descoberta automatica de email corporativo quando a vaga nao publicou contato.
- Submeter candidaturas automaticamente em ATS.
- Implementar Gupy/InHire sem revisao de permissao/API publica.
- Criar app web Next.js.

## Acceptance Criteria
- Usuario consegue habilitar Greenhouse/Ashby/Lever em Settings.
- Usuario consegue iniciar `Search other sources` e ver progresso por provider.
- Vagas com email aparecem em `With email`; vagas sem email mas com application URL aparecem em
  `External applications`.
- O pipeline salva source/provider/evidence e deduplica sem colapsar posts LinkedIn e vagas ATS
  diferentes.
- A acao de envio por Gmail permanece restrita a oportunidades com email.
- Vagas externas podem ser abertas para candidatura e aproveitam o AI field assistant/curriculo ATS.
- Testes focados de API, worker e typecheck/build da extensao passam.
- Docs, roadmap, handoff e next-spec-prompt ficam atualizados.

## Recomendacao

Fazer esta feature antes de insistir em mais automacao do LinkedIn. Ela melhora o posicionamento legal
e comercial do produto, aumenta a cobertura de vagas e cria uma ponte natural para o gerador de
curriculo ATS e o AI field assistant.
