# Super Prompt Lovable - Protótipo Final-Like

> Status: referencia antiga. Este prompt foi considerado insuficiente porque mistura os modos
> `Full-time` e `Freelance` em alguns pontos. Para gerar o proximo prompt Lovable, use primeiro
> `docs/product-modes.md` e `docs/reference-ui.md`, que definem a separacao obrigatoria entre os
> dois apps/modos.

Use este prompt no Lovable para gerar uma versão prototipada do produto que já pareça a versão real final. O protótipo deve usar dados mockados no frontend, mas deve ser desenhado com estrutura, fluxos e nomes compatíveis com a futura produção em Python + FastAPI + PostgreSQL + worker.

```text
Você é um expert em criar aplicações SaaS internas, dashboards operacionais e CRMs de alta conversão usando Lovable AI.

Crie uma aplicação web completa, production-ready no visual, para "Scrapper Freelance API" - uma plataforma pessoal para descobrir, organizar, revisar e operar oportunidades em dois trilhos: vagas de emprego (`job`) e oportunidades comerciais freelance (`freelance`).

IMPORTANTE:
- Esta entrega deve ser um protótipo navegável com dados mockados, mas com aparência de produto real final.
- A versão de produção usará backend em Python com FastAPI, banco PostgreSQL e worker separado para scraping/enriquecimento/envios.
- No protótipo, implemente a interface em React + TypeScript + Vite + Tailwind CSS, com estado local/mock services bem organizados para futura troca por chamadas à API FastAPI.
- Não crie uma landing page genérica. Crie uma web app interna estilo mesa de operação/CRM.
- Use as imagens anexadas de `references/images` como referência visual forte para layout, densidade, navegação, cards, tabelas, modais, estados vazios, dark mode e fluxos.
- Siga a estrutura e o nível de detalhe dos templates Lovable de referência, mas adapte tudo ao produto deste projeto.

=========================================================
CONTEXTO DO PROJETO
=========================================================

O produto é uma plataforma pessoal para descobrir, qualificar e operar oportunidades reutilizáveis em dois trilhos de primeira classe:

1. `job`: vagas de emprego e publicações de emprego aderentes ao perfil profissional do usuário.
2. `freelance`: empresas, negócios ou contatos que podem virar cliente para serviços de criação de sites, landing pages, automações ou presença digital.

A prioridade inicial de produto é o fluxo `job`.

O primeiro valor prático deve ser:
- buscar vagas e publicações no LinkedIn com keywords relevantes ao currículo;
- capturar empresa, cargo, email, link da publicação/vaga e evidência;
- salvar tudo como oportunidade estruturada;
- revisar as oportunidades em uma interface estilo CRM;
- preparar email de candidatura com currículo anexado;
- permitir envio individual ou em massa, sempre com revisão humana.

O fluxo `freelance` deve aparecer como trilho preparado para a fase seguinte:
- campanhas por nicho e geografia;
- detecção de empresa sem site ou com presença digital fraca;
- score inicial;
- demo URL por lead;
- geração de prompt Lovable;
- templates de primeiro contato e follow-up;
- preparo de mensagem para email ou WhatsApp.

O produto não é apenas um scraper. Ele deve parecer uma mesa de operação com CRM leve, campanhas, templates, prompts, revisão humana e outreach assistido.

=========================================================
OBJETIVO DO PRODUTO
=========================================================

- Objetivo principal: transformar oportunidades capturadas por bots em ações revisáveis pelo operador.
- Usuário primário: operador único/fundador que quer encontrar vagas aderentes e, depois, prospects freelance.
- Resultado de sucesso: o usuário consegue ver oportunidades priorizadas, entender a evidência de origem, selecionar oportunidades, revisar mensagem/template e registrar próximo passo.
- CTA principal do protótipo: "Buscar oportunidades".
- CTAs secundários: "Revisar vaga", "Preparar email", "Enviar com currículo", "Criar campanha", "Gerar prompt Lovable", "Gerar mensagem".
- Tom do produto: operacional, rápido, confiável, focado em clareza e poucos cliques.

=========================================================
REFERÊNCIAS VISUAIS OBRIGATÓRIAS
=========================================================

Use as imagens anexadas de `references/images` como referência de produto. A direção visual deve preservar:

- dark mode como tema principal;
- sidebar fixa à esquerda;
- top trial/status bar em amarelo/laranja no topo;
- cards escuros com bordas sutis, radius médio e sombras discretas;
- azul vivo como cor principal de ação;
- badges pequenos para status, temperatura, estágio e tipo;
- tabelas densas com boa legibilidade;
- filtros horizontais acima da tabela;
- modais centralizados com backdrop escuro/blur;
- empty states claros e úteis;
- botões "primary" em azul e ações perigosas em vermelho/laranja;
- painéis laterais/direita para score, prompt e mensagem;
- layout de detalhe em duas colunas: conteúdo principal à esquerda, ações e score à direita.

Padrões específicos observados nas referências:

- Dashboard com cards de métricas, funil, leads recentes e bloco de feedback/social proof.
- Campanhas com estado vazio, botão "+ Nova Campanha", modal de criação e cards de campanha com status.
- Leads com busca textual, filtro de campanha, filtro de temperatura, filtro de status, exportação CSV e tabela operacional.
- Templates com tabs por etapa (`1o Contato`, `Follow-up`), cards de template, badges de categoria e ações Preview/Editar.
- Configurações com formulário, alertas de dados incompletos, campos agrupados e preview financeiro.
- Detalhe do lead com informações, análise/sinais, score circular, URL de demo, botão de gerar prompt Lovable, gerador de mensagem e histórico.
- Modal "Prompt Lovable" com variantes (`Blueprint`, `Genérico`, `Compacto`), chips de configuração, contador de caracteres, área grande de texto e botão "Copiar Prompt".
- Gerador de mensagem com tabs por etapa, select de template, botão de gerar, cards de mensagem com copiar/email/WhatsApp/editar/aprovar.

Não copie textos de outro produto como "HB Insider". Use a inspiração visual, mas nomeie a aplicação como "Opportunity Desk" ou "Scrapper Freelance API".

=========================================================
ARQUITETURA FUTURA E IMPLICAÇÕES PARA O PROTÓTIPO
=========================================================

A produção terá:

- API: Python + FastAPI.
- Banco: PostgreSQL.
- Ambiente local: Docker Compose.
- Worker separado para scraping, enriquecimento, deduplicação e envios demorados.
- API apenas para consulta, comandos, filtros, revisão, atualização de status e disparo de jobs.
- Worker para jobs longos: busca LinkedIn, scraping, extração, enriquecimento, deduplicação, preparação de envio.

No protótipo Lovable:

- Use dados mockados e estado local.
- Crie uma camada `mockApi` ou `services` com funções assíncronas simulando endpoints FastAPI.
- Estruture os tipos TypeScript para refletir o domínio real.
- Deixe claro visualmente quando uma ação está "simulando worker".
- Use loading states realistas em ações como buscar oportunidades, prospectar, gerar prompt e gerar mensagem.
- Não implemente scraping real.
- Não implemente envio real de email/WhatsApp.
- Mostre toasts/feedbacks de sucesso/erro.

=========================================================
MODELO DE DADOS PARA O PROTÓTIPO
=========================================================

Crie tipos TypeScript e dados mockados com estes conceitos.

Lead / Opportunity:
- `id`
- `campaign_id`
- `opportunity_type`: `job` ou `freelance`
- `market_scope`: `br`, `international`, `remote`
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
- `website_status`: `confirmed`, `not_identified`, `suspected`
- `source_name`
- `source_url`
- `source_query`
- `source_evidence`
- `matched_keywords`
- `job_stage`: `new`, `saved`, `applied`, `responded`, `interview`, `rejected`, `ignored`
- `lead_score`
- `lead_temperature`: `cold`, `warm`, `hot`
- `crm_stage`: `new`, `qualified`, `contacted`, `interested`, `proposal_requested`, `proposal_sent`, `won`, `lost`
- `demo_url`
- `resume_attachment_id`
- `operator_notes`
- `captured_at`
- `updated_at`

Campaign:
- `id`
- `name`
- `channel`
- `target_niche`
- `target_region`
- `status`: `draft`, `running`, `paused`, `completed`
- `opportunity_type`
- `market_scope`
- `notes`
- `created_at`

MessageTemplate:
- `id`
- `name`
- `channel`: `email`, `whatsapp`
- `message_stage`: `first_contact`, `follow_up`, `job_application`
- `template_kind`: `job_application`, `job_follow_up`, `freelance_first_contact`, `freelance_follow_up`
- `content`
- `variables_schema`
- `is_active`

ResumeAttachment:
- `id`
- `display_name`
- `file_name`
- `mime_type`
- `is_default`

OutreachEvent:
- `id`
- `lead_id`
- `channel`
- `event_type`
- `provider_name`
- `resume_attachment_id`
- `payload`
- `occurred_at`

PromptArtifact:
- `id`
- `lead_id`
- `artifact_type`: `lovable_prompt`
- `variant`: `blueprint`, `compact`, `generic`
- `title`
- `generated_prompt`
- `input_context`
- `external_target`: `lovable`
- `copied_at`
- `created_at`

=========================================================
INFORMAÇÃO E NAVEGAÇÃO
=========================================================

Crie uma aplicação com sidebar fixa e estes módulos:

1. Dashboard
2. Campanhas
3. Oportunidades
4. Templates
5. Currículos
6. Configurações

Inclua também no rodapé da sidebar:
- indicador "Sistemas operacionais" com ponto verde;
- versão fictícia `v0.1.0`;
- colapso visual da sidebar em mobile.

Top bar:
- alerta amarelo/laranja estilo trial/status: "Modo protótipo - dados mockados - produção em FastAPI";
- à direita, avatar circular com iniciais do usuário;
- em mobile, botão de menu.

=========================================================
TELA 1 - DASHBOARD
=========================================================

Objetivo: dar visão executiva da operação.

Componentes:

- Header: "Dashboard" + subtítulo "Acompanhe oportunidades, buscas e envios assistidos."
- Alert banner: "Configure keywords, currículo e preferências antes de rodar o bot."
- Cards de métricas:
  - Total de oportunidades
  - Vagas novas
  - Emails encontrados
  - Prontas para candidatura
  - Entrevistas
  - Leads freelance quentes
- Funil `job`:
  - Capturadas
  - Salvas
  - Aplicadas
  - Responderam
  - Entrevista
- Card "Job bot status":
  - keywords ativas: `reactjs`, `typescript`, `nextjs`, `nodejs`
  - última busca
  - oportunidades capturadas
  - falsos positivos estimados
  - botão "Buscar oportunidades"
- Card "Leads recentes":
  - lista compacta com empresa/cargo/email/score/status
  - link "Ver todos"
- Card "Próximas ações":
  - "Revisar 8 vagas novas"
  - "Preparar 5 emails com currículo"
  - "Completar preferências de vaga"
- Empty/loading state quando não houver dados.

Interações:
- Clicar em "Buscar oportunidades" deve simular job do worker com loading de 2 segundos e toast.
- Durante loading, mostrar "Worker buscando publicações com email e keywords aderentes...".

=========================================================
TELA 2 - CAMPANHAS
=========================================================

Objetivo: agrupar buscas e operações por contexto.

Layout:
- Header: "Campanhas"
- Respeitar o modo global ativo: `Full-time` ou `Freelance`
- Botão "+ Nova Campanha"
- Grid de cards de campanha.

Cards de campanha:
- nome;
- tipo inferido pelo modo ativo, sem misturar campanhas dos dois modos;
- localidade/mercado;
- status (`Rascunho`, `Coletando`, `Pausada`, `Concluída`);
- total de oportunidades;
- mini badges adequados ao modo ativo;
- barra de progresso quando estiver coletando;
- ações: "Ver oportunidades", "Rodar busca", "Pausar", "Parar".

Quando `Full-time` estiver ativo, inclua apenas campanhas de vagas:

1. `Full-time Job - React Remote`
   - tipo: `job`
   - mercado: `Remote / BR`
   - keywords: `reactjs`, `typescript`, `nextjs`, `nodejs`
   - status: `running`

2. `Frontend Jobs - International`
   - tipo: `job`
   - mercado: `US / Remote`
   - keywords: `frontend`, `typescript`, `react`
   - status: `draft`

Quando `Freelance` estiver ativo, inclua apenas campanhas de prospeccao:

1. `Dentistas - Alamo`
   - tipo: `freelance`
   - mercado: `International`
   - status: `paused`

Modal "Nova Campanha":
- step ou grupos de campo:
  - Nao escolher tipo dentro do modal; o tipo vem do modo global ativo
  - Mercado: `Brasil`, `Internacional`, `Remote`
  - Se modo `Full-time`: cargo alvo, senioridade, stack/keywords, localidade, exigir email público
  - Se modo `Freelance`: nicho, país, estado, cidade, website status alvo
  - Nome da campanha preenchido automaticamente, mas editável
- Botões: "Cancelar" e "Criar Campanha"
- Ao criar, adicionar card e mostrar toast.

=========================================================
TELA 3 - OPORTUNIDADES
=========================================================

Objetivo: ser a mesa principal de revisão e qualificação.

Header:
- título muda por modo: "Vagas" em `Full-time`, "Leads" em `Freelance`
- subtítulo muda por modo
- botão "Exportar CSV"

Regra obrigatoria:
- nao criar aba `Todas`
- nao misturar vagas full-time e leads freelance
- o header global `Full-time` / `Freelance` controla qual tabela aparece
- cada modo tem filtros, colunas e acoes proprias

Filtros:
- busca textual;
- campanha;
- temperatura;
- status CRM;
- status de candidatura;
- email disponível;
- keywords;
- score mínimo.

Tabela para `Full-time Job`:
- checkbox;
- empresa;
- cargo;
- email;
- fonte;
- keywords;
- score;
- `job_stage`;
- temperatura;
- capturado em;
- ações: "Revisar", "Preparar email", menu `...`.

Tabela para `Freelance`:
- checkbox;
- negócio;
- telefone;
- email;
- nicho;
- website status;
- score;
- temperatura;
- status CRM;
- demo URL;
- ações: "Abrir", "Gerar prompt", "Gerar mensagem".

Comportamento:
- seleção em massa mostra action bar fixa inferior:
  - "Preparar emails"
  - "Marcar como salvo"
  - "Ignorar"
  - "Exportar selecionados"
- clique em linha abre tela/drawer de detalhe.
- estado vazio útil: "Nenhuma oportunidade encontrada. Ajuste filtros ou rode uma busca."

Dados mockados para `job`:
- `TechNova Labs` - `Frontend Developer React` - `jobs@technova.dev` - keywords `reactjs`, `typescript`, `nextjs` - score 88 - stage `new`
- `BrightHire AI` - `Next.js Engineer` - `careers@brighthire.ai` - keywords `nextjs`, `typescript` - score 82 - stage `saved`
- `RemoteCraft Studio` - `React TypeScript Developer` - `talent@remotecraft.io` - keywords `reactjs`, `typescript`, `nodejs` - score 79 - stage `applied`
- `CloudPixel` - `Full Stack JS Developer` - `people@cloudpixel.com` - keywords `nodejs`, `reactjs` - score 71 - stage `responded`

Dados mockados para `freelance`:
- `Mazi Imobiliária` - nicho `Imobiliária` - score 53 - temperatura `hot` - website fraco - demo URL vazia
- `Geralo Urbanismo` - nicho `Imobiliária` - score 60 - temperatura `hot`
- `Sorriso Prime Dental` - nicho `Dentista` - score 76 - temperatura `warm`

=========================================================
TELA 4 - DETALHE DA OPORTUNIDADE
=========================================================

Pode ser rota dedicada ou drawer largo. Preferência: rota dedicada com botão "Voltar".

Layout:
- coluna principal 70%;
- coluna lateral 30%;
- dark cards iguais às referências.

Header:
- nome da empresa/lead;
- badges de temperatura, estágio e tipo;
- ações rápidas.

Para oportunidade `job`, mostrar:
- Informações da vaga:
  - empresa;
  - cargo;
  - email encontrado;
  - link da vaga/publicação;
  - fonte;
  - localização/remoto;
  - data de captura.
- Evidência de origem:
  - `source_query`
  - trecho da publicação com keywords destacadas;
  - motivo da captura.
- Keywords:
  - chips `reactjs`, `typescript`, `nextjs`, `nodejs`;
  - indicar quais bateram com currículo.
- Revisão:
  - notas do operador;
  - dropdown `job_stage`;
  - dropdown `lead_temperature`;
  - botão "Salvar revisão".
- Preparar candidatura:
  - select de currículo;
  - select de template;
  - preview de email;
  - botões "Copiar email", "Marcar como enviado", "Enviar simulado".
- Histórico:
  - capturado;
  - salvo;
  - email preparado;
  - enviado;
  - resposta/entrevista.

Para oportunidade `freelance`, mostrar:
- Informações do negócio;
- Análise do site;
- Score circular;
- Demo URL;
- botão "Gerar Prompt Lovable";
- gerador de mensagem por etapa;
- mensagens geradas.

Coluna lateral comum:
- score circular estilo referência;
- card "Ações rápidas";
- card "Próximo passo recomendado";
- card "Riscos / qualidade do dado".

=========================================================
TELA 5 - MODAL PROMPT LOVABLE
=========================================================

Objetivo: prototipar o fluxo futuro de geração de artefatos Lovable para leads freelance.

Abrir ao clicar "Gerar Prompt Lovable" em uma oportunidade freelance.

Modal grande:
- título: "Prompt Lovable"
- tabs:
  - `Blueprint`
  - `Genérico`
  - `Compacto`
- chip de contexto: `Nicho pesquisado`
- chips de design:
  - `split-left`
  - `Inter`
  - `CTA pill`
  - `dark-light contrast`
- contador de caracteres;
- textarea/code block grande com prompt gerado;
- botão "Copiar Prompt";
- feedback visual "Copiado!".

Conteúdo do prompt mockado:
- deve parecer com os templates Lovable existentes;
- deve usar dados do lead;
- deve pedir landing page completa e pronta para publicar;
- deve incluir negócio, nicho, localização, score, sinais, análise, oferta, CTA, design system, mobile, SEO, tech stack e unique seed.

=========================================================
TELA 6 - TEMPLATES
=========================================================

Objetivo: administrar mensagens reutilizáveis para job e freelance.

Tabs:
- `Job Application`
- `Job Follow-up`
- `Freelance 1o Contato`
- `Freelance Follow-up`

Filtros:
- tipo;
- canal;
- ativo/inativo.

Cards de template:
- nome;
- tipo;
- badge "Padrão" quando for default;
- preview curto;
- variáveis usadas;
- ações "Preview", "Editar", "Duplicar".

Templates mockados:

1. `Job - Candidatura direta`
   - variáveis: `{{company_name}}`, `{{job_title}}`, `{{matched_keywords}}`, `{{resume_link}}`

2. `Job - Follow-up educado`
   - variáveis: `{{company_name}}`, `{{job_title}}`, `{{sent_at}}`

3. `Freelance - Demo pronta`
   - variáveis: `{{business_name}}`, `{{niche}}`, `{{demo_url}}`, `{{offer_price}}`

4. `Freelance - Site fraco upgrade`
   - variáveis: `{{business_name}}`, `{{website_score}}`, `{{demo_url}}`

Editor modal:
- campos nome, tipo, canal, conteúdo;
- preview com dados mockados;
- botão salvar.

=========================================================
TELA 7 - CURRÍCULOS
=========================================================

Objetivo: preparar anexos para envio de candidaturas.

Componentes:
- card do currículo padrão;
- lista de anexos;
- botão "Adicionar currículo" (simulado);
- campos:
  - nome exibido;
  - arquivo;
  - stack principal;
  - idiomas;
  - observações.

Inclua um currículo mockado:
- `CV - Frontend React TypeScript.pdf`
- default: sim
- keywords associadas: `reactjs`, `typescript`, `nextjs`, `nodejs`

Mostrar aviso:
"No protótipo, arquivos são simulados. Em produção, o backend FastAPI controlará upload, storage e vínculo com envios."

=========================================================
TELA 8 - CONFIGURAÇÕES
=========================================================

Objetivo: configurar preferências do operador e parâmetros de busca.

Seções:

1. Perfil do operador:
   - nome;
   - título profissional;
   - email de envio;
   - WhatsApp;
   - localização.

2. Preferências de vaga:
   - cargos alvo;
   - senioridade;
   - remoto/híbrido/presencial;
   - países/regiões;
   - keywords principais;
   - keywords negativas.

3. Preferências freelance:
   - nichos favoritos;
   - regiões;
   - score mínimo;
   - website status alvo.

4. Integrações futuras:
   - Email provider: mock/disconnected;
   - LinkedIn search: mock/disconnected;
   - Google Maps: future;
   - Lovable: external prompt copy only.

5. Segurança operacional:
   - "Envio automático desativado";
   - "Revisão humana obrigatória";
   - "Worker separado para jobs longos".

=========================================================
CORE FEATURES
=========================================================

Implemente no protótipo:

- navegação completa entre telas;
- dados mockados realistas;
- filtros funcionais na tabela;
- tabs funcionais;
- seleção em massa;
- detalhe de oportunidade;
- atualização local de `job_stage`, `lead_temperature`, `crm_stage` e notas;
- simulação de busca de oportunidades;
- simulação de criação de campanha;
- simulação de geração de prompt Lovable;
- simulação de geração de mensagem;
- simulação de envio com currículo;
- toasts de feedback;
- loading states;
- empty states;
- estados de erro simples;
- persistência local via `localStorage` para alterações básicas.

=========================================================
DESIGN SYSTEM
=========================================================

Direção visual:
- SaaS interno premium, dark, operacional e denso.
- Inspirar-se fortemente nas imagens de referência.
- Deve parecer uma ferramenta real usada todos os dias, não um mock genérico.

Cores:
- Background principal: `#050B16` ou `#07111F`
- Sidebar: `#0B1628`
- Cards: `#0F1B2E`
- Cards elevados: `#111F35`
- Border: `#20304A`
- Texto principal: `#E5EDF7`
- Texto secundário: `#8EA0B8`
- Primary/action: `#2F7DF6`
- Primary hover: `#1F6FE5`
- Yellow/status/trial: `#F59E0B`
- Success: `#22C55E`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Hot: `#F97316`
- Warm: `#EAB308`
- Cold: `#38BDF8`
- Purple/accent for AI/prompt: `#8B5CF6`

Tipografia:
- Use `Inter` como fonte principal.
- H1: `clamp(1.75rem, 3vw, 2.5rem)`, font-weight 750.
- H2: `clamp(1.25rem, 2vw, 1.75rem)`, font-weight 700.
- Body: 14-16px.
- Labels/tabela: 12-13px, legíveis.
- Use tracking sutil em labels, nunca exagerado.

Layout:
- Sidebar: 240px desktop, colapsável em mobile.
- Conteúdo: padding 24px desktop, 16px mobile.
- Cards: radius 12px, border 1px, padding 16-24px.
- Tabelas: densidade média, linhas com hover.
- Grid dashboard: 4 colunas desktop, 2 tablet, 1 mobile.
- Detalhe: 2 colunas desktop, stack mobile.

Componentes:
- Buttons: primary, secondary, ghost, destructive.
- Badges: status, temperature, type, stage, keyword.
- Inputs escuros com borda e foco azul.
- Selects com aparência consistente.
- Tabs estilo pills/segmented controls.
- Modal com overlay escuro e card central.
- Toasts no canto inferior direito.
- Progress bars para jobs.
- Score ring circular SVG/CSS.

Motion:
- transições rápidas de 150-250ms;
- fade/slide leve em modais;
- loading skeleton em tabelas/cards;
- respeitar reduced motion;
- não usar animações pesadas.

=========================================================
RESPONSIVIDADE
=========================================================

Desktop:
- sidebar fixa;
- tabelas completas;
- detalhe em duas colunas;
- dashboards com múltiplos cards.

Tablet:
- sidebar pode colapsar;
- tabelas com scroll horizontal;
- cards em 2 colunas.

Mobile:
- sidebar vira drawer;
- top bar com menu;
- tabelas viram cards de oportunidade;
- action bar de seleção fica sticky bottom;
- botões com altura mínima 44px;
- modais ocupam quase tela inteira;
- filtros podem virar accordion/drawer.

=========================================================
UX E PSICOLOGIA OPERACIONAL
=========================================================

O usuário precisa sentir que o produto reduz esforço manual e aumenta controle.

Princípios:
- Mostrar evidência antes de sugerir ação.
- Deixar claro por que uma oportunidade tem score alto.
- Nunca incentivar envio automático irrevisável.
- Repetir CTAs nos pontos certos: depois da evidência, depois do preview e na action bar.
- Separar dado capturado, decisão humana e evento técnico.
- Priorizar velocidade: poucos cliques entre encontrar oportunidade, revisar e preparar outreach.
- Usar microcopy prática:
  - "Revise antes de enviar"
  - "Email encontrado na publicação"
  - "Keywords bateram com seu currículo"
  - "Worker simulado"
  - "Pronto para candidatura"

Trust signals internos:
- "Evidência preservada"
- "Envio humano-assistido"
- "Worker separado"
- "Compatível com FastAPI"
- "Dados estruturados para CRM e IA"

=========================================================
ACESSIBILIDADE E PERFORMANCE
=========================================================

Obrigatório:
- contraste WCAG AA;
- labels em todos os inputs;
- navegação por teclado;
- foco visível;
- aria-label em botões de ícone;
- estados empty/loading/error claros;
- componentes responsivos;
- evitar dependências pesadas;
- lazy-load apenas quando fizer sentido;
- sem scraping real, sem chamadas externas reais.

=========================================================
TECH STACK
=========================================================

Use:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Framer Motion apenas se necessário e leve
- React Hook Form se ajudar nos formulários

Evite:
- dependências desnecessárias;
- bibliotecas pesadas de chart se o score/funil puder ser feito com CSS/SVG;
- backend real;
- chamadas externas reais.

Organização sugerida:
- `src/types.ts`
- `src/data/mockData.ts`
- `src/services/mockApi.ts`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/ui/*`
- `src/pages/Dashboard.tsx`
- `src/pages/Campaigns.tsx`
- `src/pages/Opportunities.tsx`
- `src/pages/OpportunityDetail.tsx`
- `src/pages/Templates.tsx`
- `src/pages/Resumes.tsx`
- `src/pages/Settings.tsx`

=========================================================
CONTRATO FUTURO COM FASTAPI
=========================================================

Inclua comentários ou estrutura de service indicando endpoints futuros, sem chamar nenhum endpoint real:

- `GET /api/leads`
- `GET /api/leads/{id}`
- `PATCH /api/leads/{id}`
- `GET /api/campaigns`
- `POST /api/campaigns`
- `POST /api/jobs/search`
- `POST /api/leads/{id}/prepare-email`
- `POST /api/leads/{id}/send-email`
- `POST /api/leads/{id}/generate-lovable-prompt`
- `POST /api/leads/{id}/generate-message`
- `GET /api/templates`
- `POST /api/templates`
- `GET /api/resume-attachments`

Deixe o protótipo pronto para trocar mock services por fetch/axios no futuro.

=========================================================
REGRAS DE DESIGN ÚNICO
=========================================================

Seed do design:
`Scrapper Freelance API|Opportunity Desk|job-first|FastAPI-production|dark-ops-crm`

Hero/entrada:
- Não faça landing page pública.
- A tela inicial deve ser o Dashboard interno.
- Se quiser incluir uma mini intro, faça dentro do Dashboard, como produto logado.

Ordem da navegação:
1. Dashboard
2. Campanhas
3. Oportunidades
4. Templates
5. Currículos
6. Configurações

Estilo de cards:
- densos, escuros, borda azul/cinza, radius 12px.

Estilo de CTA:
- primary azul, radius 8-10px, texto direto.

Estilo de tabela:
- profissional, compacta, com hover e badges.

Estilo de prompt/modal:
- modal grande, dark, área de prompt monoespaçada, tabs e chips como referência.

Não copiar:
- nomes, textos ou identidade "HB Insider";
- conteúdos de clínica/dentista dos templates;
- layout de landing page pública.

Adaptar:
- estrutura de prompt detalhado dos templates Lovable;
- padrões de conversão para operação interna;
- imagens de referência para aparência e fluxo;
- documentação do projeto para domínio, entidades e prioridades.

=========================================================
CHECKLIST FINAL
=========================================================

Antes de considerar pronto, garanta:

[ ] A aplicação parece um SaaS real final, não wireframe.
[ ] Prioridade `job` está clara no Dashboard e nas Oportunidades.
[ ] `freelance` existe como trilho preparado, sem roubar foco.
[ ] O fluxo de revisar vaga e preparar email com currículo funciona no protótipo.
[ ] O detalhe da oportunidade mostra evidência, score e próximo passo.
[ ] O modal de Prompt Lovable existe para leads freelance.
[ ] Templates e currículos existem como módulos navegáveis.
[ ] Há mock services simulando futura API FastAPI.
[ ] Há loading, empty e error states.
[ ] Há responsividade desktop/tablet/mobile.
[ ] Há contraste, foco visível e navegação por teclado.
[ ] Nenhuma chamada externa real é necessária.

Agora gere o código completo da aplicação prototipada, pronta para rodar, com visual de produto final.
```
