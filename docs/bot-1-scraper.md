# Bot 2 - Prospeccao Freelance

## Objetivo

Implementar o bot de descoberta especializado para capturar oportunidades `freelance` com chance
real de virar contato comercial, usando Google Maps/nicho/localidade como primeira fonte planejada.

Este bot continua importante, mas agora vem depois do primeiro fluxo de busca de empregos. A base
de dados deve continuar preparada para ele desde o inicio.

Na web, esse fluxo pertence exclusivamente ao modo `Freelance`. Ele deve ser tratado como um app de
prospeccao comercial, separado do modo `Full-time`.

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

## Fluxo recomendado

1. gerar queries especializadas por nicho e geografia, como `dentist Austin Texas`, `barbershop
   Denver CO` ou `restaurant Miami`
2. coletar candidatos do Google Maps ou de fonte manual equivalente
3. verificar se existe botao/URL de website, se aponta para rede social ou se o site parece fraco
4. capturar nome do negocio, endereco, telefone, nota, quantidade de reviews, website, email e links
   uteis quando disponiveis
5. registrar a `source_query`, `source_url` e evidencia principal
6. deduplicar por nome, telefone, endereco, website e origem
7. calcular score inicial
8. salvar no banco como `opportunity_type=freelance`

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
