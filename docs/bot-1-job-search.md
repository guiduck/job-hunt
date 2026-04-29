# Bot 1 - Busca de Empregos

## Objetivo

Implementar o primeiro bot de valor do produto: encontrar vagas e publicacoes de emprego no
LinkedIn que combinem com o perfil do usuario e tenham canal de contato util, principalmente email.

Esse bot deve priorizar oportunidades `job` antes do bot de prospeccao freelance.

Na web, esse fluxo pertence exclusivamente ao modo `Full-time`. Ele nao deve compartilhar lista,
templates ou pagina de detalhe com o modo `Freelance`.

## Oportunidade ideal

- publicacao ou anuncio de vaga no LinkedIn
- empresa identificavel
- cargo aderente ao perfil do usuario
- keywords relevantes encontradas no texto
- email ou contato publico disponivel
- contexto suficiente para personalizar email com curriculo anexado

## Entrada esperada

O bot deve receber ou usar:

- keywords configuradas pelo usuario
- keywords mockadas enquanto o usuario nao configurar nada
- futuras keywords extraidas do curriculo
- localidade, remoto ou preferencia de mercado quando houver
- filtros basicos como senioridade, stack, cargo ou area

Keywords mockadas iniciais:

- `reactjs`
- `typescript`
- `nextjs`
- `nodejs`

## Fluxo recomendado

1. carregar keywords do usuario ou fallback mockado
2. buscar publicacoes e anuncios no LinkedIn
3. filtrar textos com keywords relevantes
4. detectar empresa, cargo, email e link da publicacao
5. registrar a fonte e o trecho que justificou a captura
6. salvar a oportunidade como `opportunity_type=job`
7. listar no painel em uma aba ou modo `Full-time Job`
8. permitir revisao individual antes de envio
9. permitir selecao em massa para envio de email com curriculo anexado

## UI esperada no modo `Full-time`

O modo `Full-time` deve parecer um app independente para vagas.

Telas esperadas:

- `Dashboard`: metricas de vagas capturadas, vagas com email, candidaturas, respostas e entrevistas
- `Campanhas`: campanhas de busca por cargo, stack, senioridade, localidade e keywords
- `Leads`: tabela somente de vagas/publicacoes capturadas
- `Detalhe da vaga`: pagina propria para revisar evidencia e preparar candidatura
- `Templates`: templates somente de candidatura e follow-up de emprego
- `Configuracoes`: perfil profissional, curriculo, keywords e preferencias de vaga

Nao mostrar no modo `Full-time`:

- leads freelance
- nicho comercial como campo principal
- demo URL
- score de website
- botao `Gerar Prompt Lovable` como acao primaria
- templates de WhatsApp comercial

## Dados minimos por oportunidade

Cada oportunidade `job` deve guardar:

- empresa
- cargo ou titulo da publicacao
- email encontrado, se houver
- link da publicacao ou vaga
- keywords encontradas
- trecho de evidencia
- status de candidatura
- notas do operador
- data de captura

## Pagina de detalhe da vaga

Cada lead `job` deve ter uma pagina ou drawer detalhado.

Conteudo minimo:

- empresa
- cargo
- email encontrado
- link da vaga ou publicacao
- fonte
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

## Estados recomendados

`job_stage`:

- `new`
- `saved`
- `applied`
- `responded`
- `interview`
- `rejected`
- `ignored`

## Envio de email

O envio deve ser humano-assistido.

O sistema deve permitir:

- selecionar uma oportunidade e revisar o email antes de enviar
- selecionar varias oportunidades e preparar envio em massa
- anexar o curriculo do usuario
- registrar qual template foi usado
- registrar quando o email foi enviado

Templates do modo `Full-time` devem usar variaveis como:

- `{{company_name}}`
- `{{job_title}}`
- `{{matched_keywords}}`
- `{{source_url}}`
- `{{resume_name}}`
- `{{operator_name}}`
- `{{operator_email}}`

Automacao total deve ficar para depois, quando houver regras de qualidade, limite e compliance.

## Fora de escopo inicial

- parsing automatico completo de curriculo
- scraping agressivo ou fora das regras da plataforma
- envio automatico sem revisao
- classificacao com IA sem base de dados suficiente
- bot de prospeccao freelance

## Resultado minimo esperado

- oportunidades `job` salvas no `PostgreSQL`
- keywords e evidencias preservadas
- emails encontrados visiveis para revisao
- templates de email prontos para uso manual
- suporte a envio individual ou em massa com curriculo anexado
