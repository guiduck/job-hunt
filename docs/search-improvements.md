# Melhorias de Busca

## Objetivo

Sair de buscas genericas e construir uma estrategia de descoberta especializada, com mais sinal e
menos ruido. A prioridade inicial e busca de empregos com keywords relevantes ao curriculo; a busca
por clientes freelance vem depois.

## Regras praticas

- usar varias queries por nicho e localidade
- combinar cidade, bairro, servico e tipo de negocio
- para `job`, combinar cargo, stack, senioridade, remoto/local e email
- guardar sempre a `source_query` que originou a captura
- registrar fonte e evidencia da oportunidade
- deduplicar por nome, telefone, email e origem

## Estrategia de consulta

Para cada nicho, variar:

- cidade
- bairro ou regiao
- termos do nicho
- termos de intencao comercial ou profissional

Para vagas, a busca do LinkedIn deve ficar mais simples e menos dependente de operadores booleanos:

- texto/query principal, como `hiring typescript`
- ordenacao por recentes ou relevantes quando a interface do LinkedIn permitir

Filtros como remoto, onsite/hibrido/presencial, pais/regiao aceita e regioes excluidas devem migrar
para uma etapa pos-captura opcional, porque a busca do LinkedIn nao respeita Boolean Search de forma
confiavel no fluxo atual. Keywords excluidas nao devem ser um campo operacional separado neste
momento; o revisor por IA deve interpretar o texto completo e decidir com nuance.

## Fonte candidata: Google Jobs + email discovery

Google Jobs e uma fonte candidata para ampliar o modo `Full-time` somente se conseguir alimentar o
mesmo objetivo do produto atual: encontrar empresas com vagas aderentes e email publico utilizavel para
candidatura assistida. Se a fonte trouxer apenas links de formulario/ATS sem email, ela nao deve criar
`opportunity`; no maximo deve registrar candidatos rejeitados/diagnosticos para avaliacao do spike.

Viabilidade e fontes possiveis:

- a pagina de `JobPosting` structured data do Google explica como sites de vagas marcam dados para
  aparecer no Search/Google Jobs. Ela nao e uma API de consulta aberta; e um contrato de publicacao para
  donos de sites. Ainda assim, o schema e util para entender campos como titulo, empresa, localidade,
  `jobLocationType=TELECOMMUTE`, `applicantLocationRequirements`, data e descricao.
- `Cloud Talent Solution` e uma API oficial para produtos que possuem/importam seu proprio corpus de
  vagas. Nao deve ser tratada como API aberta para puxar todos os cards do Google Jobs.
- `Programmable Search / Custom Search JSON API` pode ajudar a descobrir paginas de vaga, paginas
  `careers` e paginas de contato indexadas, mas nao entrega os cards de Google Jobs como uma API de
  empregos.
- SerpApi `google_jobs` ou outro provedor SERP parece ser o caminho mais direto para testar resultados
  estruturados do Google Jobs. Isso adiciona custo e dependencia de terceiro, mas e adequado para um
  spike pequeno e descartavel.
- Google Jobs/SerpApi nao deve ser esperado como fonte de email. O papel dessa camada e encontrar vagas,
  empresas, URLs, localidade, modalidade e descricao. O email precisa ser descoberto depois, por uma
  etapa separada de web/IA sobre o dominio oficial da empresa e evidencias publicas.

Direcao correta para este produto:

- manter LinkedIn funcionando como fonte principal
- testar Google Jobs como um botao separado `Search with Google Jobs` na tela `/search`, sem substituir
  o botao atual do LinkedIn
- criar candidates com `source=google_jobs` durante o spike, mas criar `opportunity` apenas quando houver
  email publico validado e score minimo
- estruturar a opportunity no mesmo formato do LinkedIn: empresa, titulo da vaga, email, dominio,
  `source_query`, `source_url`, `source_evidence`, keywords/sinais, score e status
- adicionar filtro de listagem por `source`, com valores como `linkedin` e `google_jobs`
- jogar fora o spike se a taxa de oportunidades com email valido for baixa ou se os emails encontrados
  forem genericos/fracos demais para envio real

Branching do spike:

- desenvolver em branch separada da spec atual, por exemplo `codex/spike-google-jobs-email-discovery`
- manter o spike isolado para nao contaminar o fluxo LinkedIn que ja esta funcionando
- se a taxa de emails confiaveis for baixa, abandonar a branch e voltar para a spec/branch anterior
  sem carregar mudancas parciais para o produto principal

Fluxo proposto para o spike:

1. receber query, senioridade, remoto/regioes e filtros de IA da tela Search
2. consultar SerpApi `google_jobs` ou busca web estruturada com limite baixo
3. extrair empresa, titulo da vaga, localidade, remoto, URL da vaga/ATS, descricao e fonte original
4. usar schema `JobPosting` quando a pagina de destino expuser JSON-LD, principalmente para remoto e
   localidade
5. identificar dominio oficial da empresa, evitando confundir dominio de ATS/job board com dominio da
   empresa
6. rodar uma etapa obrigatoria de email discovery fora do Google Jobs, procurando email publico em site
   oficial, pagina de carreira, contato, sobre, rodape, texto da vaga e paginas indexadas do dominio
7. classificar o email por utilidade: `recruiting`, `careers`, `hr`, `company_general`, `personal`,
   `invalid`, `not_found`
8. rodar IA/fallback com curriculo, filtros e evidencia para decidir aderencia da vaga e confianca do
   email
9. salvar no banco somente se passar no score e tiver email publico aceitavel

Regra de aceite para `opportunity`:

- aceitar emails de recrutamento, carreira, RH ou contato geral da empresa quando houver evidencia
  publica e dominio coerente
- rejeitar candidato sem email, mesmo que tenha link oficial de candidatura
- rejeitar email pessoal sem evidencia clara de que a pessoa publicou a vaga ou e contato de recrutamento
- rejeitar dominio de job board/ATS como se fosse email da empresa, salvo quando o proprio anuncio
  indicar esse email como contato de candidatura
- preservar todos os motivos de rejeicao em candidates/diagnostics para medir se a fonte vale continuar

Minha leitura atualizada: Google Jobs pode ser interessante como descoberta, mas so vale para este
produto se o enriquecimento de email funcionar bem. O teste correto nao e "quantas vagas achamos"; e
"quantas vagas aderentes viram opportunity com email confiavel e pronta para template/envio".

## Papel de IA na busca

A busca deve continuar separando duas responsabilidades:

- provider deterministico: monta queries, respeita limites, busca dados publicos ou fornecidos pelo
  usuario e registra `source_query`, fonte, status e evidencia
- analise inteligente: interpreta o texto coletado, extrai campos, estima aderencia e explica por que
  o candidato deve ou nao virar oportunidade

Isso evita depender de uma lista infinita de strings para entender nuance, sem abrir mao de
rastreabilidade. Keywords e termos de intencao continuam uteis para descobrir fontes e limitar custo;
IA pode ser usada depois para reduzir ruido, detectar cargos equivalentes, distinguir vaga real de
post generico ou autopromocional, avaliar trabalho remoto/regiao e preencher o formato dos schemas
com mais qualidade.

Para manter compatibilidade, a primeira camada de IA deve ser opcional, configuravel e com fallback
para parser/normalizer deterministico.

## Review intelligence implementado

A camada inicial de revisao para vagas `Full-time` ja existe no backend/worker:

- oportunidades `job` aceitas recebem `review_status`, `match_score`, `score_explanation`, fatores de score, keywords ausentes e sinais historicos
- candidatos e runs expõem `analysis_status` para distinguir analise deterministica, IA assistida, fallback, falha ou skip
- a IA continua opcional e desativada por padrao; saida invalida cai para fallback deterministico
- filtros de API permitem revisar vagas por score minimo, keyword, contato disponivel, status de revisao, stage, provider, analysis status e run

A tela Search foi separada em duas responsabilidades: busca simples no LinkedIn por texto/ordenacao
e uma secao `AI filters` opcional/desligada por padrao. A extensao agora captura posts de forma ampla
e envia filtros apenas quando habilitados; o worker registra `ai_filter_status`, motivo, confianca,
sinais e counters antes de criar oportunidade.

Estado atual da camada: campos, contratos, provider OpenAI compativel, fallback deterministico e
diagnostics estao implementados. O campo `Exclude keywords` foi removido da UI/contrato; a avaliacao
deve considerar texto completo, contexto de curriculo/perfil quando disponivel, preferencia remota e
regioes. Quando nao houver chave/provider configurado, os filtros habilitados usam fallback local para
preservar comportamento deterministico e registrar o motivo.

Exemplos de dimensoes a combinar:

- nichos de servicos
- igrejas e ministerios
- psicologos e terapeutas
- medicos e clinicas

## Sinais positivos

- email publico
- email em publicacao de vaga
- keywords aderentes ao curriculo
- cargo compativel com o perfil
- telefone valido
- categoria coerente com o nicho
- ausencia de website proprio confirmado
- pagina com sinais de baixa maturidade digital

## Sinais negativos

- franquia grande ou marca nacional
- website claro e funcional
- contato ausente
- vaga sem email quando o objetivo for envio direto
- keywords fracas ou genericas demais
- categoria divergente da busca
- duplicidade de oportunidade ja conhecida

## Website nao deve ser binario

Nao tratar website apenas como sim ou nao.

Usar:

- `confirmed`
- `not_identified`
- `suspected`

Isso evita descartar oportunidades boas por deteccao imperfeita.

## Evidencia e rastreabilidade

Toda melhoria de busca precisa manter rastreabilidade suficiente para responder:

- qual query trouxe essa oportunidade
- qual fonte sustentou a captura
- qual sinal elevou ou reduziu o score
- qual nicho e geografia performaram melhor

## Validacao antes de escalar

- revisar amostra manual por nicho
- medir falsos positivos
- medir taxa real de oportunidades sem website
- comparar qualidade entre cidades ou bairros
- ajustar score com base em resultado real, nao em achismo
- comparar resultados com e sem analise de IA antes de depender dela em producao
