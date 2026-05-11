# Bot 1 - Busca De Empregos

## Objetivo

Implementar o primeiro bot de valor do produto: encontrar vagas e publicacoes de emprego no LinkedIn
que combinem com o perfil do usuario e tenham canal de contato util, principalmente email ou convite
claro de contato.

Esse bot prioriza oportunidades `job` antes do bot de prospeccao freelance. Na UI, esse fluxo pertence
ao modo `Full-time` e nao deve compartilhar lista, templates ou detalhe com o modo `Freelance`.

## Oportunidade Ideal

- publicacao ou anuncio de vaga no LinkedIn
- empresa identificavel
- cargo aderente ao perfil do usuario
- keywords relevantes encontradas no texto
- email publico ou convite explicito de contato disponivel
- email sanitizado e validado, sem lixo textual anexado ao final da string
- contexto suficiente para personalizar email com curriculo anexado

## Entrada Esperada

O bot deve receber ou usar:

- keywords configuradas pelo usuario
- keywords mockadas enquanto o usuario nao configurar nada
- futuras keywords extraidas do curriculo
- localidade, remoto ou preferencia de mercado quando houver
- filtros opcionais de IA para senioridade, stack, cargo, modalidade e regiao

Keywords mockadas iniciais:

- `reactjs`
- `typescript`
- `nextjs`
- `nodejs`

## Fluxo Recomendado

1. carregar keywords do usuario ou fallback mockado
2. abrir/capturar publicacoes e anuncios no LinkedIn usando a sessao local do navegador
3. filtrar textos com keywords relevantes
4. detectar empresa, cargo, email publico ou convite claro de contato e link da publicacao/vaga
5. registrar a fonte e o trecho que justificou a captura
6. aplicar review scoring e filtros de IA apenas quando habilitados
7. salvar a oportunidade como `opportunity_type=job`
8. listar no painel em uma aba ou modo `Full-time Job`
9. permitir revisao individual antes de envio
10. permitir selecao em massa para envio real de email com curriculo anexado, com aprovacao humana
11. apoiar preenchimento de formularios externos de candidatura com respostas geradas por IA a partir
    do curriculo e perfil do operador

## UI Esperada No Modo Full-Time

O modo `Full-time` deve parecer um app independente para vagas.

Telas esperadas:

- `Dashboard`: metricas de vagas capturadas, vagas com contato, candidaturas, respostas e entrevistas
- `Campanhas`: campanhas de busca por cargo, stack, senioridade, localidade e keywords
- `Leads`: tabela/lista somente de vagas/publicacoes capturadas
- `Detalhe da vaga`: pagina propria para revisar evidencia e preparar candidatura
- `Templates`: templates somente de candidatura e follow-up de emprego
- `Configuracoes`: perfil profissional, curriculo, keywords e preferencias de vaga
- `Envios`: historico tecnico e operacional de emails enviados, falhas e pendencias
- assistente de navegador sobre paginas externas de candidatura: botao de varinha magica em campos
  longos/perguntas, dropdown de respostas recentes por keyword e insercao controlada pelo usuario

Nao mostrar no modo `Full-time`:

- leads freelance
- nicho comercial como campo principal
- demo URL
- score de website
- botao `Gerar Prompt Lovable` como acao primaria
- templates de WhatsApp comercial

## Dados Minimos Por Oportunidade

Cada oportunidade `job` deve guardar:

- empresa
- cargo ou titulo da publicacao
- email encontrado ou canal de contato aceito
- link da publicacao ou vaga usada como evidencia
- fonte da captura
- keywords encontradas
- trecho de evidencia
- status de candidatura
- notas do operador
- data de captura

Emails capturados precisam passar por sanitizacao antes de persistencia/uso em envio. Sufixos vindos
de parsing ruim, como `hashtag` colado ao fim do email, devem ser removidos sem alterar enderecos
validos.

## Pagina De Detalhe Da Vaga

Cada lead `job` deve ter uma pagina ou drawer detalhado.

Conteudo minimo:

- empresa
- cargo
- email ou contato encontrado
- link da vaga ou publicacao
- `source_query`
- `source_evidence`
- texto/resumo da publicacao
- keywords encontradas
- score de aderencia
- curriculo selecionado
- template de candidatura
- preview do email
- historico de interacoes

Acoes:

- alterar `job_stage`
- salvar notas
- preparar email
- copiar email
- marcar candidatura como enviada
- registrar resposta
- registrar entrevista
- rejeitar/ignorar vaga

## Estados Recomendados

`job_stage`:

- `new`
- `saved`
- `applied`
- `responded`
- `interview`
- `rejected`
- `ignored`

## Envio De Email

O envio deve ser humano-assistido. O operador deve conseguir clicar em `Enviar email` em uma vaga,
revisar o preview e confirmar o envio real pelo provedor configurado.

O sistema deve permitir:

- selecionar uma oportunidade e revisar o email antes de enviar
- selecionar varias oportunidades e preparar envio em massa
- criar preview/draft com assunto, corpo, destinatario e curriculo selecionado
- permitir editar o texto antes de enviar
- anexar o curriculo do usuario
- registrar qual template foi usado
- registrar quando o email foi enviado
- registrar evento tecnico por tentativa: `queued`, `sent`, `failed` ou `skipped`
- impedir reenvio acidental para a mesma oportunidade sem confirmacao

Templates do modo `Full-time` devem usar variaveis como:

- `{{company_name}}`
- `{{job_title}}`
- `{{matched_keywords}}`
- `{{source_url}}`
- `{{resume_name}}`
- `{{operator_name}}`
- `{{operator_email}}`
- `{{operator_linkedin_url}}`

Provider recomendado:

- Gmail API/OAuth como caminho preferencial para conta pessoal do operador
- SMTP apenas como fallback posterior
- nenhum segredo sensivel deve ser embutido na extensao Plasmo
- a extensao chama a API; a API/worker/provider executa o envio

Automacao total sem revisao deve ficar para depois, quando houver regras de qualidade, limite e
compliance. Envio em massa pode existir antes disso, desde que seja uma acao explicita, revisavel,
limitada e auditavel.

## Fora De Escopo Inicial

- parsing automatico completo de curriculo
- scraping agressivo ou fora das regras da plataforma
- envio automatico sem revisao
- enriquecimento automatico irrestrito de emails de empresas
- buscar vagas em fontes externas que entregam apenas links de candidatura ou ATS
- bot de prospeccao freelance

## Uso Recomendado De IA

O uso de keywords e termos de busca nao deve ser visto como solucao final de inteligencia, mas como
base rastreavel para coleta. A IA entra melhor depois que o provider ja trouxe texto publico ou fonte
fornecida pelo usuario.

Papel recomendado da IA no fluxo `Full-time`:

- receber o texto publico, `source_query`, URL e metadados do provider
- extrair empresa, cargo, senioridade, modalidade, localidade e contato com mais nuance
- identificar se o texto realmente representa vaga, convite de candidatura ou apenas conteudo fraco
- calcular um score de aderencia explicavel com base em keywords, cargo, stack e evidencias
- devolver JSON estruturado validado contra os schemas existentes
- preservar o parser/normalizer deterministico como fallback quando IA estiver desativada ou falhar
- gerar respostas para perguntas de formularios externos de candidatura usando curriculo, sender
  profile, LinkedIn URL, portfolio e preferencias do usuario, sem auto-submeter formularios

Nao usar IA para burlar login, rate limit, paywall ou controles de acesso do LinkedIn. O fetch deve
continuar deterministico, auditavel e limitado a dados publicos ou fornecidos pelo usuario.

## Limites Da Primeira Automacao

O primeiro esqueleto automatizado deve ser pequeno e rastreavel:

- disparado pelo backend, mas executado fora do processo HTTP
- limitado pelo input `Max posts` da extensao, com teto operacional de 1000
- restrito a dados publicos ou fornecidos pelo usuario
- sem fabricar oportunidades quando LinkedIn estiver indisponivel, bloqueado ou com rate limit
- salvando somente vagas com email ou canal publico de contato
- registrando empresa, cargo/headline, descricao quando disponivel, contato, query, fonte, keywords e
  evidencia em campos estruturados

## Provider Real De Busca LinkedIn

A primeira versao real do provider busca publicacoes publicas do LinkedIn usando termos de intencao de
contratacao combinados com as keywords do usuario.

Termos iniciais:

- `hiring`
- `contratando`
- `contratamos`

Exemplos de queries:

- `hiring reactjs`
- `contratando typescript`
- `contratamos nodejs`

Para validacao local, o mesmo fluxo tambem aceita URL do LinkedIn ou conteudo publico colado pelo
usuario. Essas entradas nao pulam as regras de qualidade: cada candidato ainda precisa passar por
parser, normalizer, evidencia, contato e deduplicacao. Limites futuros devem vir de plano/assinatura
ou regra operacional, nao de env global fixa.

Contato aceito:

- email publico, sempre como primeira preferencia
- convite explicito de contato pelo LinkedIn quando o texto pedir DM, direct message, inbox, message
  me/us, reach out, envio de CV/resume via LinkedIn, me chame, envie mensagem, fale comigo ou frase
  equivalente em ingles/portugues, sempre com link do perfil do autor

Nao aceitar apenas um link de perfil solto como contato. Tambem nao fabricar oportunidades quando a
busca publica estiver bloqueada, inacessivel, vazia ou com rate limit; registrar o estado na run ou no
candidato.

## Decisao Sobre Fonte Externa De Vagas

Foi testada a hipotese de buscar vagas fora do LinkedIn e depois descobrir email publico por
enriquecimento. A decisao atual e nao incluir essa feature na aplicacao: na experiencia real, muitos
contatos respondem com link de carreiras ou instrucoes para aplicar via portal/ATS, reduzindo muito o
valor do envio por email.

O que fica:

- melhorias gerais de UI, filtros, estado persistido e selecao em massa
- LinkedIn como caminho principal de descoberta `Full-time`
- criterio de salvar apenas oportunidades com contato realmente acionavel

O que sai:

- botao separado para fonte externa na Search UI
- provider externo de vagas
- descoberta automatica de email de empresa como etapa obrigatoria
- campos, configs, specs e metricas especificos dessa fonte descartada

## Estado Tecnico Atual

Ja existe implementacao inicial para:

- provider/fetcher em `apps/worker/app/services/linkedin_search_provider.py`
- query builder com `hiring`, `contratando`, `contratamos` + keywords
- suporte a URL/conteudo publico fornecido pelo usuario para validacao local
- parser e normalizer com email publico como prioridade
- aceite de convite explicito de contato no LinkedIn quando houver `poster_profile_url`
- metadados de provider na API: source type, provider status, hiring intent term, contact priority e
  profile URL
- worker consumir runs `pending` direto do PostgreSQL
- worker gravar candidatos/oportunidades sem chamada manual intermediaria
- persistencia dos `collection_inputs` para consumo assincrono
- lifecycle e metricas de run com `pending -> running -> completed/completed_no_results/failed`
- recuperacao de runs `running` stale como `failed/stale`, sem retry automatico
- Docker Compose com PostgreSQL, API e worker compartilhando banco
- review intelligence para oportunidades aceitas: score 0-100, explicacao, fatores, keywords ausentes,
  campos normalizados, `review_status` e `analysis_status`
- filtros operacionais para a lista `Full-time`: score minimo, keyword, contato disponivel,
  `job_stage`, provider, analysis status, run e status de envio
- o mesmo input de busca da lista Jobs tambem encontra oportunidades pelo email de contato salvo,
  alem de descricao, keywords, cargo e empresa
- a lista Jobs carrega resultados paginados em lotes de 50, preservando filtros, busca e ordenacao
  entre paginas; selecao em massa fica limitada aos itens visiveis da pagina atual
- login/cadastro com Google agora cria ou vincula o usuario local por identidade/email Google, mas o
  OAuth de Gmail para envio permanece uma conexao separada em Settings
- o sender profile inclui `operator_linkedin_url`, disponivel para o contexto de emails gerados por IA
- bulk AI retorna status por item (`completed`, `failed`, `skipped` e equivalentes) para dar feedback
  visual antes do envio humano-aprovado
- coletor local autenticado em `tools/linkedin_browser_collector.py`, usando Playwright com perfil
  persistente em `.local/`
- Search UI com filtros de IA opcionais e Jobs UI com selecao total por checkbox, `Delete all listed`
  e estado persistido do popup

Ainda falta calibrar a busca publica com respostas reais do LinkedIn, incluindo bloqueios, login walls
e rate limits. Tambem falta evoluir a revisao para um fluxo operacional mais completo de candidatura,
tracking de respostas e progresso item a item em geracao/envio em massa.
