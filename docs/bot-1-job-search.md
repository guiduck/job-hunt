# Bot 1 - Busca de Empregos

## Objetivo

Implementar o primeiro bot de valor do produto: encontrar vagas e publicacoes de emprego no
LinkedIn que combinem com o perfil do usuario e tenham canal de contato util, principalmente email.

Esse bot deve priorizar oportunidades `job` antes do bot de prospeccao freelance.

Na web, esse fluxo pertence exclusivamente ao modo `Full-time`. Ele nao deve compartilhar lista,
templates ou pagina de detalhe com o modo `Freelance`.

## Oportunidade ideal

- publicacao ou anuncio de vaga no LinkedIn
- vaga descoberta via Google Jobs ou busca web estruturada, quando houver fonte rastreavel e email publico
- empresa identificavel
- cargo aderente ao perfil do usuario
- keywords relevantes encontradas no texto
- email ou contato publico de candidatura disponivel
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
3. em spike futuro, buscar tambem vagas via Google Jobs/SerpApi ou busca web estruturada
4. filtrar textos com keywords relevantes
5. detectar empresa, cargo, dominio oficial, email publico e link da publicacao/vaga
6. registrar a fonte e o trecho que justificou a captura
7. salvar a oportunidade como `opportunity_type=job`
8. listar no painel em uma aba ou modo `Full-time Job`
9. permitir revisao individual antes de envio
10. permitir selecao em massa para envio real de email com curriculo anexado, com aprovacao humana

## UI esperada no modo `Full-time`

O modo `Full-time` deve parecer um app independente para vagas.

Telas esperadas:

- `Dashboard`: metricas de vagas capturadas, vagas com email, candidaturas, respostas e entrevistas
- `Campanhas`: campanhas de busca por cargo, stack, senioridade, localidade e keywords
- `Leads`: tabela somente de vagas/publicacoes capturadas
- `Detalhe da vaga`: pagina propria para revisar evidencia e preparar candidatura
- `Templates`: templates somente de candidatura e follow-up de emprego
- `Configuracoes`: perfil profissional, curriculo, keywords e preferencias de vaga
- `Envios`: historico tecnico e operacional de emails enviados, falhas e pendencias

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
- email encontrado
- link da publicacao, vaga, ATS ou pagina usada como evidencia
- fonte, como `linkedin` ou `google_jobs`
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
- fonte, como `linkedin` ou `google_jobs`
- `source_query`
- `source_evidence`
- status de descoberta de contato, quando o email vier de enriquecimento posterior
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

O envio deve ser humano-assistido, mas nao apenas um link para Gmail. O operador deve conseguir
clicar em `Enviar email` em uma vaga, revisar o preview e confirmar o envio real pelo provedor
configurado.

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

Provider recomendado para o proximo recorte:

- Gmail API/OAuth como caminho preferencial para conta pessoal do operador
- SMTP apenas como fallback posterior
- nenhum segredo sensivel deve ser embutido na extensao Plasmo
- a extensao chama a API; a API/worker/provider executa o envio

Automacao total sem revisao deve ficar para depois, quando houver regras de qualidade, limite e
compliance. Envio em massa pode existir antes disso, desde que seja uma acao explicita, revisavel,
limitada e auditavel.

## Fora de escopo inicial

- parsing automatico completo de curriculo
- scraping agressivo ou fora das regras da plataforma
- envio automatico sem revisao
- enriquecimento automatico irrestrito de emails de empresas
- salvar vagas Google Jobs sem email como opportunities acionaveis
- Google Jobs como fonte primaria antes de um spike provar taxa suficiente de emails confiaveis
- bot de prospeccao freelance

## Uso recomendado de IA

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

Nao usar IA para burlar login, rate limit, paywall ou controles de acesso do LinkedIn. O fetch deve
continuar deterministico, auditavel e limitado a dados publicos ou fornecidos pelo usuario.

Para descoberta de email da empresa, a IA pode atuar como pesquisadora assistida, mas so depois que a
vaga ja foi capturada por fonte rastreavel. Ela deve procurar sinais publicos em site oficial,
pagina de carreira, ATS, rodape, pagina de contato e texto da vaga. Emails descobertos por esse
caminho devem entrar como pendentes de revisao, com URL de evidencia, e nao como contato automaticamente
confiavel. Se a vaga oferece apenas formulario oficial de candidatura e nao divulga email, o candidato
deve ser rejeitado para criacao de opportunity, porque o objetivo deste bot e contato facil por email.

## Limites da primeira automacao

O primeiro esqueleto automatizado deve ser pequeno e rastreavel:

- disparado pelo backend, mas executado fora do processo HTTP
- limitado a 50 candidatos inspecionados por run
- restrito a dados publicos ou fornecidos pelo usuario
- sem fabricar oportunidades quando LinkedIn estiver indisponivel, bloqueado ou com rate limit
- salvando somente vagas com email ou canal publico de contato
- registrando empresa, cargo/headline, descricao quando disponivel, contato, query, fonte, keywords e evidencia em campos estruturados

## Provider real de busca LinkedIn

A primeira versao real do provider deve tentar buscar publicacoes publicas do LinkedIn usando termos
de intencao de contratacao combinados com as keywords do usuario.

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
busca publica estiver bloqueada, inacessivel, vazia ou com rate limit; registrar o estado na run ou
no candidato.

## Spike futuro: Google Jobs + email discovery

Google Jobs pode entrar como segunda fonte do modo `Full-time`, mas apenas se o spike provar que ele
gera opportunities no mesmo formato acionavel do LinkedIn: vaga aderente, empresa identificada, email
publico confiavel, evidencia e score.

Nao assumir que a documentacao de `JobPosting` structured data e uma API aberta para consumir Google
Jobs. Ela documenta como sites publicam dados estruturados para aparecer no Google. Para buscar
resultados estruturados, o spike deve testar SerpApi `google_jobs` ou busca web estruturada com limite
baixo.

Fluxo recomendado do spike:

1. operador clica em `Search with Google Jobs` na tela Search
2. worker consulta SerpApi `google_jobs` ou busca web estruturada usando query, senioridade, remoto e
   regioes
3. parser extrai titulo da vaga, empresa, localidade, remoto, URL da vaga/ATS, descricao e evidencia
4. fetcher visita a pagina de destino e tenta ler JSON-LD `JobPosting`, quando existir
5. normalizer identifica o dominio oficial da empresa, sem confundir ATS/job board com empresa
6. email discovery procura contato publico em site oficial, pagina `careers`, `contact`, `about`, rodape,
   texto da vaga e resultados indexados do dominio
7. classificador marca email como `recruiting`, `careers`, `hr`, `company_general`, `personal`,
   `invalid` ou `not_found`
8. IA/fallback avalia aderencia da vaga ao curriculo/filtros e confianca do contato
9. apenas candidatos com score suficiente e email aceitavel viram `opportunity`

Filtro remoto:

- usar `jobLocationType=TELECOMMUTE` e `applicantLocationRequirements` quando a pagina expuser
  `JobPosting`
- usar campos estruturados retornados pela SerpApi, quando disponiveis
- usar descricao/titulo/localidade como fallback, com IA/fallback classificando `remote`, `hybrid`,
  `onsite` ou `unknown`
- se `Remote only` estiver ligado, rejeitar `hybrid`, `onsite` e `unknown` de baixa confianca

Metricas minimas para decidir se continua:

- quantidade de resultados brutos
- quantidade de candidatos com empresa e dominio oficial confiavel
- quantidade com email publico aceitavel
- quantidade que passou score de aderencia
- quantidade salva como opportunity
- tempo/custo por opportunity salva
- comparacao com LinkedIn para a mesma query

Criterio de descarte: se a maioria dos resultados terminar sem email confiavel, com email generico
demais, dominio incorreto ou custo alto por opportunity, abandonar o spike e manter apenas LinkedIn.

## Estado tecnico atual

Ja existe implementacao inicial para:

- provider/fetcher em `apps/worker/app/services/linkedin_search_provider.py`
- query builder com `hiring`, `contratando`, `contratamos` + keywords
- suporte a URL/conteudo publico fornecido pelo usuario para validacao local
- parser e normalizer com email publico como prioridade
- aceite de convite explicito de contato no LinkedIn quando houver `poster_profile_url`
- metadados de provider na API: source type, provider status, hiring intent term, contact priority e profile URL
- testes automatizados para provider, parser, normalizer, API contracts, persistencia, deduplicacao e falhas
- worker consumir runs `pending` direto do PostgreSQL
- worker gravar candidatos/oportunidades sem chamada manual intermediaria
- persistencia dos `collection_inputs` para consumo assincrono
- lifecycle e metricas de run com `pending -> running -> completed/completed_no_results/failed`
- recuperacao de runs `running` stale como `failed/stale`, sem retry automatico
- Docker Compose com PostgreSQL, API e worker compartilhando banco
- container names neutros no Compose: API compartilhada, worker especifico de vagas LinkedIn, futuro worker freelance separado
- review intelligence para oportunidades aceitas: score 0-100, explicacao, fatores, keywords ausentes, campos normalizados, `review_status` e `analysis_status`
- filtros operacionais para a lista `Full-time`: score minimo, keyword, contato disponivel, `review_status`, `job_stage`, provider, analysis status e run
- atualizacao de `review_status` e notas sem sobrescrever evidencia, source data ou campos de analise
- ajuste historico inicial de score com base em outcomes comparaveis como `saved`, `responded`, `interview`, `rejected` e `ignored`
- Compose validado com API, worker e Postgres rodando localmente
- coletor local autenticado em `tools/linkedin_browser_collector.py`, usando Playwright com perfil persistente em `.local/` para abrir LinkedIn logado, buscar publicacoes recentes (`sortBy=date_posted`), rolar resultados e enviar posts capturados para a API como `authenticated_browser_search`
- runs com `collection_source_types=["authenticated_browser_search"]` reaproveitam o parser, normalizer, dedupe e review scoring existentes sem disparar busca publica anonima em paralelo

Ainda falta calibrar a busca publica com respostas reais do LinkedIn, incluindo bloqueios, login walls
e rate limits; quando LinkedIn retorna tela de login, o provider agora deve marcar o caso como bloqueado/login requerido, nao como candidato sem contato. Tambem falta transformar a revisao em fluxo de candidatura: curriculos, templates,
preview de email, envio humano-assistido e tracking de resposta/entrevista.

## Como testar coleta autenticada local

1. Suba API, worker e banco:

   ```bash
   docker compose up -d
   ```

2. Instale Playwright no Python local, se ainda nao estiver instalado:

   ```bash
   python -m pip install playwright
   python -m playwright install chromium
   ```

3. Rode o coletor em modo visivel:

   ```bash
   python tools/linkedin_browser_collector.py --keywords "hiring typescript" --max-posts 20 --max-scrolls 5
   ```

4. Na primeira execucao, faca login no navegador aberto pelo Playwright. O perfil fica em `.local/linkedin-playwright-profile/`, ignorado pelo Git.

5. Depois consulte a run criada:

   ```bash
   TOKEN="<TOKEN_DA_EXTENSAO_OU_LOGIN>"
   curl http://localhost:8000/job-search-runs/<run_id>/candidates -H "Authorization: Bearer $TOKEN"
   curl http://localhost:8000/job-search-runs/<run_id>/opportunities -H "Authorization: Bearer $TOKEN"
   ```

O recorte de coleta, review, templates, curriculos, preview, envio real individual, base de bulk send e
auth/ownership ja existe. O proximo recorte operacional deve estabilizar validacao pos-auth antes de
expandir produto.

## Resultado minimo esperado

- oportunidades `job` salvas no `PostgreSQL`
- keywords e evidencias preservadas
- emails encontrados visiveis para revisao
- templates de email prontos para uso manual
- suporte a envio individual ou em massa com curriculo anexado e eventos auditaveis
