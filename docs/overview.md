# Visao Geral

`Scrapper Freelance API` e uma plataforma pessoal para descobrir, organizar e operar
oportunidades em dois trilhos de primeira classe:

- `freelance`: empresas, negocios ou contatos que podem virar cliente
- `job`: vagas de emprego aderentes ao perfil e ao posicionamento profissional

O produto nao deve tratar um trilho como adaptacao do outro. Na interface, os dois trilhos devem se
comportar como dois apps independentes dentro da mesma casca visual:

- modo `Full-time`: app para buscar vagas, revisar publicacoes do LinkedIn, preparar candidatura e
  acompanhar resposta/entrevista
- modo `Freelance`: app para prospectar clientes, analisar site, gerar demo/prompt Lovable e
  preparar mensagens comerciais

Mesmo que o backend compartilhe entidades e infraestrutura, a experiencia do usuario nao deve
misturar os dois modos. Nao deve existir uma lista principal com vagas de emprego e prospects
freelance juntos.

## Prioridade atual

A primeira utilidade real do app e o fluxo `job`, agora operado localmente pela extensao Plasmo e
pelo coletor Playwright como fallback.

O MVP local ja cobre login de usuario, ownership dos dados, captura LinkedIn, revisao de vagas,
templates, curriculos, Gmail conectado, envio individual e bulk send revisavel. A geracao de emails
com IA usa curriculo PDF extraido como fonte de verdade, template como referencia de tom/estrutura,
idioma detectado do post da vaga e aprovacao humana antes de criar requests de envio pelo Gmail.

A busca do LinkedIn esta sendo simplificada: a extensao usa texto e ordenacao para capturar posts
amplos, enquanto filtros de remoto/onsite e regioes aceitas/excluidas ficam em uma camada opcional
pos-captura com status, motivos, confianca, sinais e counters persistidos. Nao ha mais campo explicito
de keywords excluidas; a IA deve avaliar o texto completo com contexto de curriculo/perfil e distinguir
vaga real de posts de pessoas procurando emprego.

O proximo recorte recomendado e de hardening operacional, nao de produto novo: validar manualmente o
fluxo `Full-time`, alinhar testes/contratos com auth e campos recentes, melhorar feedback pos-envio e
confirmar OAuth/envio publicado. Depois disso, o proximo salto de produto volta a ser o modo
`Freelance` com Google Maps, analise de site e prompts Lovable.

Para IA, chaves de API devem ficar somente no backend/worker via variaveis de ambiente. A extensao
nao deve armazenar nem receber `OPENAI_API_KEY` ou segredo equivalente.

Nao ha times/workspaces no primeiro ciclo; assinaturas futuras tambem pertencem ao usuario.

Antes de priorizar prospeccao freelance, o sistema deve ajudar o usuario a encontrar vagas e
publicacoes no LinkedIn em que empresas deixam email disponivel e usam keywords relevantes ao
perfil profissional do usuario. Essas keywords podem ser configuradas manualmente no inicio e,
depois, extraidas do curriculo.

O bot de oportunidades freelance continua planejado, mas entra depois que o fluxo de busca de
emprego, revisao de vagas e envio real de email com curriculo estiver funcionando. O modo
`Freelance` deve seguir o metodo de prospeccao por Google Maps/nicho/localidade documentado nas
referencias: encontrar negocios sem site, com apenas rede social ou com site fraco, gerar prompt/demo
Lovable e preparar primeiro contato/follow-up.

## Objetivo do produto

Construir uma base operacional que permita:

1. descobrir vagas e publicacoes de emprego com keywords relevantes
2. salvar tudo como dados estruturados e reaproveitaveis
3. revisar oportunidades em um fluxo manual estilo CRM
4. enviar emails reais com template e curriculo anexado, em massa ou um a um, apos revisao humana
5. isolar os dados por usuario antes de deploy
6. evoluir depois para prospeccao freelance via Google Maps, IA, analytics e sugestoes geograficas

## Capacidade principal

O sistema precisa cobrir estas capacidades ao longo da evolucao:

- descoberta especializada de oportunidades
- armazenamento estruturado com evidencia da captura
- revisao e qualificacao manual em fluxo de operacao
- outreach humano assistido por templates, email real, curriculo anexado e eventos auditaveis
- geracao assistida por IA para mensagens, prompts e artefatos, sempre com revisao humana antes de
  qualquer envio real

## Interface alvo

A web deve ter um seletor global no header para alternar entre `Full-time` e `Freelance`. O modo
ativo escopa toda a aplicacao:

- dashboard
- campanhas
- leads/oportunidades
- templates
- configuracoes
- pagina de detalhe

`Full-time` deve usar linguagem de vagas, empresas, cargos, emails de recrutamento, keywords,
curriculo e candidatura. `Freelance` deve usar linguagem de negocios, nichos, site, score, demo,
prompt Lovable, WhatsApp e follow-up.

Essa separacao e requisito de produto, nao apenas filtro visual.

## Fluxo operacional de referencia

As imagens de referencia mostram principalmente um fluxo de prospeccao `Freelance`:

1. descobrir e listar leads em uma visao operacional
2. filtrar por campanha, temperatura e status
3. abrir uma oportunidade e revisar contexto, origem e contato
4. gerar ou selecionar template de mensagem
5. aprovar envio real individual ou em massa por provedor configurado
6. registrar resposta, candidatura, entrevista ou descarte

Esse fluxo reforca que o produto nao e apenas um scraper. Ele evolui para uma mesa de operacao
com CRM leve, campanhas, templates, prompts e outreach assistido.

Para `Full-time`, o mesmo nivel de detalhe visual deve existir, mas com outro fluxo:

1. buscar publicacoes/vagas no LinkedIn por keywords
2. salvar vagas com empresa, cargo, email, link, keywords e evidencia
3. revisar a vaga em pagina de detalhe propria
4. selecionar curriculo e template de candidatura
5. aprovar envio individual ou em massa
6. acompanhar resposta, entrevista, rejeicao ou descarte

## Fase atual

O foco imediato ainda e construir a base de operacao:

- API em `FastAPI`
- banco em `PostgreSQL`
- hardening de login email/senha, ownership por usuario e deploy antes de uso compartilhado
- jobs longos fora do processo HTTP
- extensao Plasmo como primeira interface operacional local para o modo `Full-time`
- modelo de dados preparado para `freelance` e `job`
- fluxo `job` priorizado no produto
- documentacao pronta para orientar implementacao sem drift

## Principios que guiam desenvolvimento

Esta documentacao assume os principios do `constitution`:

- `dual opportunity search`: `freelance` e `job` sao fluxos de primeira classe
- `specialized discovery`: busca por nicho, localidade e evidencias, nao scraping generico
- `structured records`: tudo que entrar deve ser reutilizavel por CRM, outreach e IA
- `human-reviewed outreach`: automacao de envio so depois de regras claras
- `compatible architecture`: scraping, enrichment e outreach rodam fora da API

## O que isso significa na pratica

Durante o desenvolvimento:

- prefira extensoes aditivas ao modelo de dados em vez de reestruturacoes bruscas
- preserve compatibilidade de contratos e nomes sempre que possivel
- capture `source_query`, sinais, evidencias e notas desde a origem
- trate painel, campanhas, templates e IA como evolucoes naturais do mesmo sistema

## Mapa rapido dos docs

- `docs/architecture.md`: componentes, fronteiras e deploy
- `docs/product-modes.md`: separacao obrigatoria entre modo `Full-time` e modo `Freelance`
- `docs/domain-model.md`: entidades, campos e enums principais
- `docs/auth-and-ownership.md`: usuarios, login, ownership e assinatura futura
- `docs/bot-1-job-search.md`: escopo do primeiro bot de busca de emprego
- `docs/bot-1-scraper.md`: escopo posterior do bot de prospeccao freelance
- `docs/search-improvements.md`: estrategia de busca especializada
- `docs/roadmap.md`: fases do produto
- `docs/action-plan.md`: ordem recomendada de implementacao
