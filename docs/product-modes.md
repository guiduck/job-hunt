# Modos do Produto

Este documento define a regra central de produto para a web: o sistema deve funcionar como dois
apps operacionais dentro da mesma casca visual.

Os modos sao:

- `Full-time`: operacao de busca, revisao e candidatura para vagas de emprego
- `Freelance`: operacao de prospeccao de clientes, demos, prompts Lovable e mensagens comerciais

## Regra principal

`Full-time` e `Freelance` nao devem ser misturados na experiencia do usuario.

Mesmo que o backend use entidades compartilhadas e campos compativeis, a UI deve tratar cada modo
como um app independente:

- cada modo tem dashboard proprio
- cada modo tem campanhas proprias
- cada modo tem leads/oportunidades proprios
- cada modo tem templates proprios
- cada modo tem tela de detalhe propria
- cada modo tem acoes, empty states, filtros e linguagem proprios

Nao deve existir uma lista principal misturando vagas de emprego e leads freelance.

## Mode switch global

A aplicacao deve ter um seletor global de modo no header, parecido com abas/pills:

- `Full-time`
- `Freelance`

Comportamento esperado:

- o modo selecionado controla todo o contexto da aplicacao
- ao trocar de modo, a navegacao continua visualmente parecida, mas os dados e fluxos mudam
- o estado ativo deve ser muito visivel, com pill preenchida e cor forte
- o modo inativo deve ficar como botao outlined/ghost
- em mobile, o seletor pode virar segmented control horizontal no topo

Exemplo conceitual:

```text
[ Full-time ] [ Freelance ]
```

Quando `Full-time` esta ativo:

- `Dashboard` mostra metricas de vagas, candidaturas, respostas e entrevistas
- `Campanhas` mostra buscas de vagas por cargo, stack, senioridade, localidade e keywords
- `Leads` ou `Oportunidades` mostra empresas/vagas capturadas a partir de publicacoes do LinkedIn
- `Templates` mostra templates de candidatura e follow-up de emprego
- `Configuracoes` mostra perfil profissional, curriculo, keywords e preferencias de vaga
- acoes de email enviam pela API/provider configurado apos preview e aprovacao

Quando `Freelance` esta ativo:

- `Dashboard` mostra metricas de prospeccao, leads quentes, demos, mensagens e receita potencial
- `Campanhas` mostra campanhas por nicho, cidade, regiao e mercado
- `Leads` mostra negocios/prospects capturados para contato comercial
- `Templates` mostra mensagens de primeiro contato e follow-up comercial
- `Configuracoes` mostra dados do vendedor, preco, WhatsApp, oferta e preferencias de prospeccao
- a descoberta principal planejada vem de Google Maps por nicho e localidade

## Navegacao compartilhada, conteudo separado

A sidebar pode ser compartilhada visualmente, mas cada item deve renderizar uma tela especifica do
modo ativo.

Itens recomendados:

- `Dashboard`
- `Campanhas`
- `Leads`
- `Templates`
- `Configuracoes`

Itens auxiliares como `Feedback`, `Discussoes`, `Comunidade` e `Changelog` sao opcionais e nao
devem roubar foco do MVP.

Rotas sugeridas:

```text
/fulltime/dashboard
/fulltime/campaigns
/fulltime/leads
/fulltime/leads/:id
/fulltime/templates
/fulltime/settings

/freelance/dashboard
/freelance/campaigns
/freelance/leads
/freelance/leads/:id
/freelance/templates
/freelance/settings
```

Se a implementacao usar rotas unicas, o modo ativo ainda deve escopar todos os dados e componentes.

## Linguagem por modo

### Full-time

Use linguagem de emprego:

- `vagas`
- `publicacoes`
- `empresa`
- `cargo`
- `email de recrutamento`
- `keywords do curriculo`
- `candidatura`
- `curriculo anexado`
- `resposta`
- `entrevista`
- `rejeitada`

Evite nesta area:

- `demo`
- `landing page`
- `WhatsApp comercial`
- `cliente`
- `receita potencial`
- `site fraco`

### Freelance

Use linguagem comercial:

- `leads`
- `prospects`
- `negocio`
- `nicho`
- `cidade`
- `site`
- `score do site`
- `demo`
- `prompt Lovable`
- `primeiro contato`
- `follow-up`
- `WhatsApp`
- `receita potencial`

Evite nesta area:

- `vaga`
- `curriculo`
- `candidatura`
- `entrevista`
- `job_stage`

## Full-time como app independente

O modo `Full-time` deve ser um sistema para encontrar e operar vagas.

Origem principal dos leads:

- publicacoes de vagas no LinkedIn
- anuncios de vagas
- posts publicos com email para candidatura
- textos que contenham keywords relevantes ao curriculo

Fluxo principal:

1. configurar cargo, senioridade, localidade e keywords
2. rodar busca por publicacoes/vagas
3. salvar cada vaga como lead `job`
4. revisar empresa, cargo, email, link e evidencia
5. selecionar curriculo
6. gerar ou selecionar template de candidatura
7. aprovar envio real individual ou em massa
8. acompanhar resposta, entrevista, rejeicao ou ignorado

Telas obrigatorias:

- dashboard `Full-time`
- campanhas de busca de vagas
- lista de leads/vagas
- detalhe da vaga
- templates de candidatura
- configuracoes de perfil/curriculo/keywords
- historico de envios e falhas por destinatario

## Freelance como app independente

O modo `Freelance` deve ser um sistema para prospeccao de clientes.

Origem principal dos leads:

- resultados do Google Maps por nicho e localidade
- negocios por nicho e localidade
- negocios sem site claro
- negocios com site fraco
- negocios com email, telefone ou WhatsApp publico
- resultados de busca com sinais de baixa maturidade digital

Fluxo principal:

1. criar campanha por nicho, mercado e localidade
2. prospectar leads
3. revisar negocio, contato, Google Maps/source URL, site, score e evidencias
4. salvar ou gerar URL de demo
5. gerar mega prompt Lovable para criar demo
6. gerar mensagem de primeiro contato ou follow-up
7. copiar/enviar por email ou WhatsApp com aprovacao humana
8. acompanhar status comercial

Telas obrigatorias:

- dashboard `Freelance`
- campanhas de prospeccao
- lista de leads freelance
- detalhe do lead freelance
- modal de mega prompt Lovable
- templates comerciais
- configuracoes de vendedor/preco/oferta

## Requisitos para prompts Lovable futuros

Todo prompt futuro para Lovable deve declarar explicitamente:

- existe um header com seletor `Full-time` / `Freelance`
- o modo ativo escopa todo o sistema
- nao existe tabela unica misturando os dois modos
- cada modo tem dashboard, campanhas, leads, templates e configuracoes proprias
- `Full-time` nao deve mostrar recursos de demo/prompt Lovable como acao principal
- `Freelance` deve ter pagina de detalhe com score, demo URL, botao de gerar mega prompt Lovable e gerador de mensagem
- templates de vaga e templates freelance sao colecoes separadas
- o prompt Lovable de `Freelance` deve seguir os templates de referencia: dados do negocio, nicho,
  localizacao, contato, avaliacao, pesquisa de concorrentes, estrutura da landing page, CTAs,
  mobile-first, SEO/acessibilidade e regras de conversao
- os dados podem compartilhar backend, mas nao devem parecer um unico CRM misturado
