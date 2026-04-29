# Referencia Visual do Produto

Este arquivo transforma as imagens de `references/images` em requisitos observaveis para specs,
implementacao e prompts Lovable.

As imagens mostram um prototipo forte para prospeccao freelance. O nosso produto deve preservar
os padroes visuais e operacionais observados, mas corrigir uma regra central: o sistema final deve
funcionar como dois apps separados dentro da mesma casca visual.

Modos obrigatorios:

- `Full-time`: busca, revisao e candidatura para vagas de emprego
- `Freelance`: prospeccao de clientes, demo, mega prompt Lovable e mensagens comerciais

## Regra de separacao visual

O app deve ter um seletor global no header, no formato de abas/pills, semelhante ao exemplo anexado
pelo usuario:

- `Full-time`
- `Freelance`

Requisitos observaveis para esse seletor:

- fica no header/top area, sempre visivel nas telas principais
- o modo ativo usa pill preenchida com cor forte
- o modo inativo fica como botao escuro/outlined
- o modo ativo muda todo o contexto da aplicacao
- trocar modo nao deve apenas filtrar uma tabela; deve trocar o app operacional inteiro
- nao deve haver lista principal misturando leads `freelance` com leads `job`
- cada modo tem seus proprios dashboards, campanhas, leads, templates, detalhes e configuracoes

## Casca visual observada

As imagens mostram uma aplicacao dark, operacional e densa.

Requisitos visuais:

- tema principal escuro
- fundo geral quase preto/azul escuro
- sidebar fixa a esquerda
- top bar horizontal no topo
- cards escuros com borda sutil
- azul vivo para acoes primarias
- amarelo/laranja para barra de trial/status e indicadores de atencao
- badges pequenos para status, temperatura, categoria e etapa
- textos primarios claros e secundarios em cinza/azul
- tabelas densas com hover
- formularios em cards escuros
- modais com overlay escuro/blur
- botoes com radius medio
- estado ativo de navegacao na sidebar com fundo azul escuro
- indicador de sistema operacional no rodape da sidebar com ponto verde

## Navegacao lateral observada

Os modulos visiveis nas imagens sao:

- `Dashboard`
- `Campanhas`
- `Leads`
- `Templates`
- `Configuracoes`
- `Feedback`
- `Discussoes`
- `Comunidade`
- `Changelog`

Para o nosso MVP, os modulos principais devem ser:

- `Dashboard`
- `Campanhas`
- `Leads`
- `Templates`
- `Configuracoes`

Itens auxiliares podem existir depois, mas nao devem atrapalhar o foco.

Regra importante:

- a sidebar pode ser visualmente igual nos dois modos
- o conteudo de cada item deve ser especifico do modo ativo
- `Leads` em `Full-time` significa vagas/publicacoes salvas
- `Leads` em `Freelance` significa negocios/prospects comerciais

## Top bar observada

As imagens mostram uma faixa superior amarela/laranja com status de trial e limite de prospeccoes.

Requisitos:

- manter uma top/status bar fina no topo
- mostrar contexto operacional do modo ativo
- em prototipos, deixar claro quando dados sao mockados
- em producao, pode mostrar limite, status do worker, ultima busca ou plano

Exemplos por modo:

- `Full-time`: "Modo Full-time - worker pronto - 18 vagas novas para revisar"
- `Freelance`: "Modo Freelance - 2 prospeccoes restantes - campanha pronta"

## Dashboard observado

As imagens mostram:

- titulo `Dashboard`
- alerta de configuracao pendente
- cards de metricas
- funil de conversao
- card de leads recentes
- bloco de feedback/comunidade

### Dashboard Full-time

Deve ser especifico para emprego.

Metricas recomendadas:

- vagas capturadas
- vagas com email
- vagas salvas
- candidaturas enviadas
- respostas recebidas
- entrevistas

Funil recomendado:

- capturadas
- revisadas
- salvas
- aplicadas
- responderam
- entrevista

Cards de acao:

- configurar keywords
- rodar busca LinkedIn
- revisar novas vagas
- preparar emails com curriculo

Nao mostrar:

- receita potencial
- demo URL
- prompt Lovable como CTA principal
- WhatsApp de venda

### Dashboard Freelance

Deve seguir mais de perto as imagens de prospeccao.

Metricas recomendadas:

- total de leads
- leads contactados
- leads convertidos
- receita potencial
- leads quentes
- demos criadas
- prompts gerados

Funil recomendado:

- leads
- contactados
- interessados
- proposta enviada
- convertidos

Cards de acao:

- criar campanha
- prospectar
- revisar leads quentes
- gerar prompt Lovable
- gerar mensagem

## Campanhas observadas

As imagens mostram:

- tela `Campanhas`
- botao `+ Nova Campanha`
- empty state central com icone, titulo e CTA
- modal `Nova Campanha`
- cards de campanha com status, localidade, nicho e botoes
- campanha em `Rascunho`
- campanha em `Coletando`
- progresso com texto "pode levar ~30s"
- botoes `Processando...`, `Pausar`, `Parar`
- botao `Ver Leads`
- botao `Prospectar`
- lixeira/acao de remover

### Campanhas Full-time

Nao devem usar nichos de comercio local como base principal.

Campos esperados:

- nome da campanha
- cargo alvo
- senioridade
- modalidade: remoto, hibrido, presencial
- localidade/mercado
- keywords
- keywords negativas
- exigir email publico: sim/nao
- fonte: LinkedIn/publicacoes/anuncios

Card deve mostrar:

- cargo ou stack principal
- mercado/localidade
- quantidade de vagas capturadas
- quantidade com email
- status da busca
- ultima execucao
- botoes: `Ver vagas`, `Buscar vagas`, `Pausar`, `Parar`

### Campanhas Freelance

Devem seguir o prototipo observado.

Campos esperados:

- mercado: BR Nacional ou Internacional
- pais/regiao
- nicho
- estado
- cidade
- nome gerado automaticamente, editavel
- taxa/score de conversao por nicho quando disponivel

O select de nicho observado mostra opcoes com percentual de conversao:

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
- Pet Shop
- Escola de Idiomas
- Restaurante
- Pizzaria
- Hamburgueria
- Oficina Mecanica
- Dentista, Med Spa, HVAC, Plumber, Lawyer, Real Estate Agent, Chiropractor, Landscaping, Cleaning Service

Card deve mostrar:

- nome da campanha, ex: `Dentist - Alamo`
- localidade
- nicho
- status: `Rascunho`, `Coletando`, `Pausada`, `Concluida`
- total de leads
- contadores por temperatura/status
- acoes: `Ver Leads`, `Prospectar`, `Pausar`, `Parar`

## Leads observados

As imagens mostram uma pagina `Leads` com:

- titulo
- busca textual
- botao `Buscar`
- filtro por campanha
- filtro por temperatura
- filtro por status
- botao `Exportar CSV`
- empty state quando nao ha leads
- tabela com checkbox por linha
- colunas para nome, telefone, email, nicho, score, temperatura, status e acoes
- hover/selecionado em linha
- acao por linha `Ver`

### Leads Full-time

Devem ser apenas vagas/publicacoes de emprego capturadas.

Origem:

- publicacoes de vagas no LinkedIn
- anuncios de vagas
- posts publicos com email para candidatura
- textos com keywords aderentes ao curriculo

Colunas obrigatorias:

- checkbox
- empresa
- cargo
- email de recrutamento
- fonte/link
- keywords encontradas
- score de aderencia
- status da candidatura
- data de captura
- acoes

Filtros especificos:

- campanha de busca
- cargo
- senioridade
- modalidade
- keywords
- email disponivel
- status da candidatura
- score minimo

Estados de candidatura:

- `new`
- `saved`
- `applied`
- `responded`
- `interview`
- `rejected`
- `ignored`

Acoes por linha:

- `Abrir detalhe`
- `Preparar email`
- `Salvar vaga`
- `Ignorar`

Nao mostrar:

- telefone como coluna primaria
- nicho comercial
- score de website
- demo URL
- botao de prompt Lovable na tabela principal
- WhatsApp comercial como acao principal

### Leads Freelance

Devem ser apenas negocios/prospects comerciais.

Colunas obrigatorias:

- checkbox
- nome do negocio
- telefone
- email
- nicho
- canais disponiveis
- score
- temperatura
- status comercial
- acoes

Filtros especificos:

- campanha
- nicho
- temperatura
- status
- website status
- cidade/regiao
- score minimo

Estados comerciais:

- `novo`
- `contactado`
- `convertido`
- `perdido`
- `ignorado`

Acoes por linha:

- `Ver`
- `Gerar prompt`
- `Gerar mensagem`
- `Abrir demo`

## Pagina de detalhe obrigatoria

O prototipo anterior falhou por nao criar uma pagina especifica do lead. A documentacao deve exigir
essa tela em ambos os modos.

Requisitos visuais observados:

- link/botao `Voltar`
- titulo com nome do lead/empresa
- badges ao lado do titulo
- layout em duas colunas
- coluna principal com cards grandes
- coluna lateral com score, demo/prompt/mensagem
- cards com titulo e dados em grid
- score circular grande
- botoes de status em linha
- painel de mensagens geradas abaixo do gerador

### Detalhe Full-time

Esta pagina deve ser especifica para vaga.

Conteudo obrigatorio:

- empresa
- cargo
- email encontrado
- link da vaga/publicacao
- fonte (`LinkedIn`, `LinkedIn post`, `job board`, etc.)
- localidade/modalidade
- data de captura
- `source_query`
- `source_evidence`
- trecho da publicacao com keywords destacadas
- matched keywords
- score de aderencia ao curriculo
- status da candidatura
- notas do operador
- curriculo selecionado
- template de candidatura
- preview do email
- historico: capturada, revisada, email preparado, aplicada, respondeu, entrevista, rejeitada

Acoes obrigatorias:

- alterar status da candidatura
- salvar notas
- selecionar curriculo
- gerar/preparar email de candidatura
- copiar email
- marcar como enviado
- registrar resposta
- registrar entrevista
- ignorar vaga

Nao deve conter como recurso principal:

- landing page demo
- prompt Lovable
- score de site
- gerador de mensagem WhatsApp de venda

### Detalhe Freelance

Esta pagina deve seguir de perto as imagens de detalhe.

Conteudo obrigatorio:

- informacoes do negocio
- telefone
- email
- website
- cidade/endereco
- nicho
- nota Google
- avaliacoes
- Google Maps/source URL
- analise do site
- tem website
- score mobile
- score desktop
- responsivo
- tem anuncios
- plataformas detectadas
- linktree
- motivo da classificacao
- score circular
- status comercial

Acoes obrigatorias:

- alterar status comercial
- salvar `demo_url`
- gerar mega prompt Lovable
- copiar prompt
- gerar mensagem
- alternar `1o Contato` e `Follow-up`
- escolher template automatico
- copiar mensagem
- enviar por email
- enviar por WhatsApp
- editar/aprovar mensagem

## Modal de mega prompt Lovable

As imagens mostram um modal chamado `Prompt Lovable`.

Requisitos:

- abrir a partir da pagina de detalhe freelance
- modal grande centralizado
- titulo `Prompt Lovable`
- botao fechar no canto superior direito
- tabs/variantes:
  - `Blueprint` ou `Completo`
  - `Generico`
  - `Compacto`
- chip `Nicho pesquisado`
- chips de design, por exemplo:
  - `split-left`
  - `CTA pill`
  - fontes sugeridas
  - cores
- contador de caracteres
- area grande monoespacada para prompt
- botao grande `Copiar Prompt`
- feedback visual ao copiar

Conteudo do prompt:

- deve ser gerado a partir dos dados do lead freelance
- deve usar nome, nicho, localidade, telefone, avaliacao, sinais e analise
- deve pedir landing page completa no Lovable
- deve seguir templates de alta conversao
- deve ter variantes versionaveis

Este modal pertence ao modo `Freelance`.

## Gerador de mensagens freelance

As imagens mostram:

- card `Gerar Mensagem`
- segmented tabs `1o Contato` e `Follow-up`
- select `Template automatico`
- opcoes como:
  - `Sem Site - Demo Pronta`
  - `Sem Site - Impacto Visual`
  - `Site Fraco - Demo Comparativa`
  - `Site Fraco - Upgrade Direto`
  - `Linktree - Site Real`
  - `Linktree - Reputacao Merecida`
  - `Sem Anuncios - Base Digital`
  - `Sem Anuncios - Concorrentes na Frente`
  - `Geral - Demo Direto`
  - `Geral - Resultado na Mao`
- botao `Gerar Mensagem`
- lista `Mensagens`
- card de mensagem com template, etapa, texto, link da demo, preco e CTA
- botoes `Copiar`, `Email`, `WhatsApp` e acoes auxiliares

Esse fluxo pertence ao modo `Freelance`.

## Templates observados

As imagens mostram pagina `Templates` com:

- titulo
- tabs/filtros `Todos`, `1o Contato`, `Follow-up`
- botao `Restaurar Padroes`
- botao `+ Novo Template`
- cards em grid de duas colunas
- badge de categoria
- badge `Padrao`
- acoes `Preview`, `Editar`, `Excluir`

### Templates Full-time

Devem ser uma colecao separada.

Tipos:

- candidatura direta
- candidatura com destaque de stack
- follow-up apos candidatura
- resposta a recrutador
- agradecimento apos entrevista

Variaveis:

- `{{company_name}}`
- `{{job_title}}`
- `{{matched_keywords}}`
- `{{source_url}}`
- `{{resume_name}}`
- `{{operator_name}}`
- `{{operator_email}}`

Cards devem falar de vaga/candidatura, nao de demo ou site.

### Templates Freelance

Devem seguir o prototipo observado.

Tipos:

- primeiro contato
- follow-up
- sem site
- site fraco
- linktree
- sem anuncios
- geral

Variaveis:

- `{{business_name}}`
- `{{niche}}`
- `{{city}}`
- `{{demo_url}}`
- `{{offer_price}}`
- `{{installments}}`
- `{{website_score}}`
- `{{seller_name}}`
- `{{seller_whatsapp}}`

## Configuracoes observadas

As imagens mostram:

- alerta de dados pendentes em vermelho/rosa
- card de formulario central
- secao `Pais / Regiao`
- secao `Dados do Vendedor`
- secao `Preco`
- preview de parcelamento
- botao grande `Salvar Configuracoes`

### Configuracoes Full-time

Devem conter:

- nome do usuario
- titulo profissional
- email de candidatura
- curriculo padrao
- cargos alvo
- senioridade
- stack/keywords
- keywords negativas
- localidade/modalidade
- preferencias de vaga
- assinatura de email

### Configuracoes Freelance

Devem conter:

- pais/regiao
- nome do vendedor
- titulo profissional
- WhatsApp
- preco da landing page
- parcelas
- preview de parcelamento
- oferta principal
- nichos preferidos
- mensagem padrao

## Requisitos de estado vazio

As imagens usam empty states claros.

Requisitos:

- `Campanhas` vazia deve mostrar icone, titulo e botao de criar campanha
- `Leads` vazio deve orientar a criar campanha ou iniciar scraping/busca
- `Mensagens` vazia deve dizer que nenhuma mensagem foi gerada
- `Avaliacoes` vazia deve mostrar icone central
- empty state deve ser especifico do modo ativo

Exemplos:

- Full-time: "Nenhuma vaga encontrada. Crie uma campanha de busca ou ajuste suas keywords."
- Freelance: "Nenhum lead encontrado. Crie uma campanha e inicie a prospeccao."

## Requisitos de loading/job

As imagens mostram campanha `Coletando` com progresso e controles.

Requisitos:

- toda busca longa deve parecer job/worker
- mostrar status textual
- mostrar progresso ou etapa atual
- permitir pausar/parar quando aplicavel
- nao bloquear toda a UI

Full-time:

- "Buscando publicacoes no LinkedIn..."
- "Filtrando por keywords..."
- "Detectando emails..."
- "Salvando vagas..."

Freelance:

- "Abrindo navegador..."
- "Prospectando negocios..."
- "Analisando website..."
- "Calculando score..."

## Anti-requisitos para prompts futuros

Para evitar o erro do prototipo anterior:

- nao criar uma aba `Todas` que misture `Full-time` e `Freelance` como experiencia principal
- nao usar `demo_url` em vaga full-time
- nao usar `curriculo` em lead freelance
- nao usar templates freelance para candidatura
- nao usar templates de vaga para prospeccao
- nao esconder a pagina de detalhe do lead
- nao deixar mega prompt Lovable apenas como botao solto sem modal
- nao transformar o produto em landing page publica
- nao tratar `Full-time` como apenas filtro de leads
- nao tratar `Freelance` como apenas categoria de campanha

## O que preservar das imagens

- dark UI densa e profissional
- sidebar com modulo ativo destacado
- header com status global
- cards de campanha com status e acoes
- tabela de leads com filtros e CSV
- detalhe do lead em duas colunas
- score circular
- modal grande de prompt
- gerador de mensagem com tabs e select
- templates em cards
- configuracoes com alertas e formulario
- poucos cliques entre lead, prompt/mensagem e acao
