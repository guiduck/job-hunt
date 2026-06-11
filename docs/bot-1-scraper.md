# Bot 2 - Prospeccao Freelance

## Objetivo

Implementar o app/bot de descoberta especializado para capturar oportunidades `freelance` com chance
real de virar contato comercial, usando busca local realista do Google/Google Maps por
nicho/localidade como primeira fonte planejada.

Este bot continua importante, mas agora vem depois do primeiro fluxo de busca de empregos. A base
de dados deve continuar preparada para ele desde o inicio.

Esse fluxo pertence exclusivamente ao app web `Freelance`. Ele deve ser tratado como um produto de
prospeccao comercial em `Next.js` + `shadcn/ui` + `Zod` + `Zustand` + `Prisma` + `PostgreSQL`,
separado da extensao `Full-time`.

## Perfil de oportunidade ideal

- pequeno negocio local
- nicho aderente a servicos oferecidos
- sem website claro ou com presenca digital fraca
- com email publico, telefone ou outro canal util
- com evidencia suficiente para justificar a captura

## Entrada esperada

O bot deve receber ao menos:

- nicho
- cidade, bairro ou regiao
- escopo geografico ou de mercado
- tipo de oportunidade alvo, inicialmente `freelance`
- criterio de site desejado: sem site, apenas rede social, site fraco ou qualquer sinal revisavel

## Nichos iniciais

A implementacao nao deve inventar a lista de nichos. Use as referencias registradas como fonte
inicial:

- `references/opportunity-desk-pro/src/lib/mockData.ts`, export `NICHE_OPTIONS`
- `docs/reference-ui.md`, secao `Campanhas Freelance`
- `docs/lovable-super-prompt-prototype-v2.md`, secao do select de nicho

Lista inicial normalizada:

- Clinica de Estetica
- Clinica Odontologica
- Dentista
- Salao de Beleza
- Psicologo
- Terapeuta
- Nutricionista
- Barbearia
- Fotografo
- Personal Trainer
- Clinica de Fisioterapia
- Arquiteto
- Designer de Interiores
- Academia
- Clinica Veterinaria
- Imobiliaria
- Pet Shop
- Escola de Idiomas
- Restaurante
- Pizzaria
- Hamburgueria
- Oficina Mecanica
- Med Spa
- HVAC
- Plumber
- Lawyer
- Real Estate Agent
- Landscaping
- Cleaning Service

Cada nicho pode carregar um `conversion_hint`/percentual estimado vindo da referencia. Esse valor e
apenas heuristica de priorizacao e UI, nao promessa de conversao.

Nota `015-freelance-niche-catalog`: provider/worker futuros devem ler nichos aprovados do catalogo
governado (`freelance_niches`) e usar `query_terms`/`aliases` como fonte das consultas. Nichos
`disabled`, `merged` ou candidatos ainda nao aprovados nao devem entrar em novas campanhas. O conflito
`Imobiliaria` permanece auditavel ate escolha explicita do operador. A gestao interna de nichos ja
permite criar, editar, desativar, reativar e mesclar entradas aprovadas sem deploy, mas nao deve
disparar coleta automaticamente; o worker continua usando apenas nichos enabled+approved.

US3 de `015-freelance-niche-catalog` adicionou `niche_candidates` para sugestoes de categorias vindas
de referencias/imagens. O scraper/API/provider nao deve tratar esses registros como negocios reais:
eles so podem virar fonte de query depois de aprovados em `freelance_niches`. Leads reais para contato
continuam vindo da busca Google/Google Maps ou provider equivalente, com nome do negocio, contato,
origem, query e evidencia de classificacao.

## Fluxo recomendado

1. gerar queries especializadas por nicho e geografia, como `dentist Austin Texas`, `barbershop
   Denver CO` ou `restaurant Miami`
2. coletar candidatos por provider/scraper de Google Maps que reproduza resultados reais de busca
   local
3. verificar se existe botao/URL de website, se aponta para rede social ou se o site parece fraco
4. capturar nome do negocio, endereco, telefone, nota, quantidade de reviews, website, email e links
   uteis quando disponiveis
5. baixar o HTML do site quando existir e rodar uma avaliacao propria de conteudo, design,
   performance e SEO
6. registrar a `source_query`, `source_url` e evidencia principal
7. deduplicar por nome, telefone, endereco, website e origem
8. calcular score inicial
9. salvar no banco como `opportunity_type=freelance`

## Decisao de provider

A melhor opcao inicial e usar uma camada `freelance_maps_provider` com um provider externo como
Apify Google Maps Scraper ou SerpApi Google Maps.

Nota operacional: a escolha da fonte deve acontecer por rodada de prospeccao, nao por um env global
silencioso. SerpApi e Apify devem aparecer como fontes reais selecionaveis; `mock` pode continuar
disponivel apenas como teste explicito de UI, retornando dados falsos e poucos resultados. Se a chave
server-side da fonte escolhida (`SERPAPI_API_KEY` ou `APIFY_TOKEN`) nao existir, a API deve falhar com
mensagem clara antes de criar uma expectativa de coleta real.

Motivo: o objetivo nao e apenas consultar um cadastro oficial de lugares; e reproduzir o que uma
pessoa encontraria pesquisando no Google ou Google Maps por nicho e localidade. Isso importa para
campanhas como "clinica de estetica em Blumenau", "igreja em Orlando" ou "clinica ortodontica em
Austin". Apify/SerpApi tendem a entregar resultados mais proximos da experiencia de SERP/Maps real,
com nome, telefone, website, rating, reviews, endereco e URL/ids de origem.

Google Places API oficial pode ser considerada em pesquisa futura, mas nao deve ser o provider v1
porque seus termos sao restritivos para copiar/salvar dados de Maps em uma base de prospeccao, e o
resultado pode nao representar tao bem o ranking/experiencia que o usuario final ve.

Playwright pode existir como fallback ou ferramenta de auditoria para comparar resultados reais no
navegador, mas nao deve ser a dependencia principal do MVP por exigir manutencao de DOM, sessoes,
captcha/proxy e comportamento de scroll.

## Metodo manual de referencia

O guia de prospeccao usado como referencia recomenda:

- escolher um nicho e uma cidade antes de buscar
- pesquisar no Google Maps por `nicho + cidade`
- rolar a lista de resultados e abrir cada negocio
- priorizar negocios sem botao `Website`
- tratar `Website` apontando para Facebook/Instagram como lead bom
- revisar sites ruins com checklist: nao responsivo, antigo, lento, sem HTTPS, sem CTA, informacao
  desatualizada ou template generico
- usar concorrente local com site melhor como argumento comercial quando fizer sentido

Essa logica deve virar scoring/evidencia, nao apenas texto livre.

## Analise automatica de site

Quando `website_url` existir, o worker deve baixar e avaliar o site em etapa separada da coleta Maps.

Sinais iniciais:

- HTML acessivel e status HTTP
- HTTPS valido
- title, meta description e headings principais
- presenca de CTA claro
- telefone, WhatsApp, email e formulario
- imagens sem `alt`
- peso aproximado da pagina, scripts e imagens
- responsividade basica por viewport headless quando viavel
- indicios de template antigo, layout quebrado, Linktree/rede social ou pagina agregadora
- sinais de SEO local: cidade, servicos, endereco, schema/structured data quando existir

O resultado deve gerar scores separados para conteudo, design, performance e SEO, alem de uma
classificacao revisavel: `sem_site`, `rede_social`, `linktree`, `site_fraco`, `site_ok` ou
`incerto`.

## UI esperada no modo `Freelance`

O modo `Freelance` deve seguir de perto as imagens de referencia.

Telas esperadas:

- `Dashboard`: metricas de leads, contactados, convertidos, receita potencial, demos e prompts
- `Campanhas`: campanhas por nicho, mercado, pais, estado e cidade
- `Leads`: tabela somente de negocios/prospects comerciais
- `Detalhe do lead`: pagina propria com score, analise de site, demo URL, prompt Lovable e mensagens
- `Templates`: templates somente de primeiro contato e follow-up comercial
- `Configuracoes`: dados do vendedor, WhatsApp, preco, parcelas e oferta

Nao mostrar no modo `Freelance`:

- vagas full-time
- curriculo anexado
- status de candidatura
- templates de candidatura
- entrevistas
- keywords de curriculo como campo principal

## Regras iniciais

- se houver website claro e funcional, reduzir prioridade
- se houver apenas rede social, ainda pode ser oportunidade
- se houver email publico, subir prioridade
- se houver duvida sobre website, marcar `suspected`
- nao salvar oportunidade sem contexto minimo de origem

## Evidencias minimas para persistir

Cada oportunidade salva deve carregar pelo menos:

- consulta que originou a captura
- fonte principal ou link de origem
- sinal que justificou a entrada, como ausencia de website ou contato publico

## Pagina de detalhe freelance

Cada lead `freelance` deve ter uma pagina ou drawer detalhado.

Conteudo minimo:

- nome do negocio
- telefone
- email
- website
- cidade/endereco
- nicho
- nota Google
- quantidade de avaliacoes
- Google Maps/source URL
- query de origem
- analise do site
- score mobile
- score desktop
- responsivo
- plataformas detectadas
- se tem anuncios
- se usa linktree
- motivo da classificacao
- problema identificado: sem site, so rede social, site ruim, site ok mas melhoravel
- score circular
- status comercial

Acoes:

- alterar status comercial
- salvar `demo_url`
- gerar mega prompt Lovable
- copiar prompt
- gerar mensagem de `1o Contato`
- gerar mensagem de `Follow-up`
- escolher template automatico
- copiar mensagem
- enviar por email
- enviar por WhatsApp
- editar/aprovar mensagem

## Mega prompt Lovable

O modo `Freelance` deve ter um modal especifico para gerar o mega prompt Lovable a partir do lead.

Requisitos:

- abrir pela pagina de detalhe do lead
- variantes `Completo`/`Blueprint`, `Generico` e `Compacto`
- chips de design e contexto
- contador de caracteres
- area grande monoespacada
- botao `Copiar Prompt`
- salvar como artefato versionavel no futuro

O prompt deve seguir o padrao das referencias `references/lovable-template`: dados reais do negocio,
nicho, localizacao, contato, avaliacao Google, pesquisa de concorrentes, estrutura da landing page,
design system, CTAs, mobile-first, SEO/acessibilidade e regras de conversao. O prompt gerado pelo
modo `Freelance` deve adaptar esse formato ao lead capturado, sem misturar linguagem de vagas.

## Resultado minimo esperado

- oportunidades salvas no `PostgreSQL`
- `opportunity_type` preenchido
- score inicial
- status inicial de revisao para CRM
- base pronta para enriquecimento e outreach futuro
