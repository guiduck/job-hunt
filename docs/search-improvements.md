# Melhorias de Busca

## Objetivo

Sair de buscas genericas e construir uma estrategia de descoberta especializada, com mais sinal e
menos ruido. A prioridade atual continua sendo o fluxo `Full-time` por LinkedIn; a busca por clientes
freelance vem depois.

## Regras praticas

- usar queries simples e rastreaveis
- para `job`, combinar texto de busca, stack, senioridade e sinais de trabalho remoto/local
- guardar sempre a `source_query` que originou a captura
- lembrar a ultima busca confirmada pelo operador e renderizar keywords salvas como badges
- registrar fonte e evidencia da oportunidade
- deduplicar por empresa, titulo, contato e origem
- criar opportunities apenas quando houver contato publico util para acao
- sanitizar emails antes de persistir/usar em envio, removendo sufixos invalidos como `hashtag`
- paginar listagens grandes de oportunidades para manter a UI responsiva

## Estrategia de consulta

Para vagas, a busca do LinkedIn deve ficar simples e menos dependente de operadores booleanos:

- texto/query principal, como `hiring typescript`
- ordenacao por recentes ou relevantes quando a interface do LinkedIn permitir

Filtros como remoto, onsite/hibrido/presencial, pais/regiao aceita e regioes excluidas ficam somente
em uma etapa pos-captura opcional. A busca de publicacoes do LinkedIn nao filtra regiao de forma
confiavel no fluxo atual, entao o produto captura de forma ampla e deixa a IA interpretar o texto
completo quando `AI filters` estiver ligado.

## Decisao Sobre Fontes Externas

O spike de vagas via fonte externa com descoberta posterior de email foi descartado para o produto
atual. Na pratica, os emails encontrados geraram respostas de baixa utilidade: muitas empresas
redirecionam para pagina de carreiras, ATS ou formulario oficial, o que nao cria vantagem sobre aplicar
diretamente.

Decisao de produto:

- manter LinkedIn como fonte operacional do fluxo `Full-time`
- remover provider externo, descoberta automatica de email da empresa, campos de source externo e UI
  dedicada dessa fonte
- preservar apenas melhorias independentes de UI: feedback de captura, filtros de IA opcionais,
  selecao em massa por checkbox, `Delete all listed`, dedupe visual de nomes e estado persistido do
  popup
- retomar novas fontes de vagas somente quando a hipotese nao depender de email: a nova direcao
  `013-serpapi-career-search` busca links oficiais de candidatura em career pages/ATS curados, separa
  essas vagas em `External applications` e usa IA para avaliar aderencia antes de salvar oportunidades

## Nova Direcao Para Career Pages

O recorte `013-serpapi-career-search` muda o objetivo das fontes externas: a busca nao tenta mais
descobrir email da empresa. Ela deve encontrar URLs de vagas em sites de candidatura simples e oficiais,
sem exigir que o operador saiba o nome da empresa, board, tenant ou client id.

Fontes ativas iniciais:

- InHire
- Ashby
- Lever
- Greenhouse
- SmartRecruiters
- Trampos
- Catho

Fontes brasileiras em observacao, ainda fora da lista ativa ate pesquisa posterior:

- Programathor
- Remotar
- GeekHunter
- Vagas.com.br
- InfoJobs

Regras:

- a busca deve usar keywords do operador e uma lista curada de sites/fonte
- `max scrolls` continua pertencendo apenas ao fluxo LinkedIn
- jobs com email ficam no fluxo de envio por Gmail
- jobs sem email e com URL oficial ficam no fluxo `External applications`
- acoes em massa em vagas externas permitem deletar, mas nao abrir varias candidaturas ao mesmo tempo
- a aplicacao externa e manual; o assistente de campos ajuda no site aberto pelo operador

## Papel De IA Na Busca

A busca continua separando duas responsabilidades:

- provider deterministico: monta queries, respeita limites, busca dados publicos ou fornecidos pelo
  usuario e registra `source_query`, fonte, status e evidencia
- analise inteligente: interpreta o texto coletado, extrai campos, estima aderencia e explica por que
  o candidato deve ou nao virar oportunidade

Isso evita depender de uma lista infinita de strings para entender nuance, sem abrir mao de
rastreabilidade. Keywords e termos de intencao continuam uteis para descobrir fontes e limitar custo;
IA pode ser usada depois para reduzir ruido, detectar cargos equivalentes, distinguir vaga real de
post generico ou autopromocional, avaliar trabalho remoto/regiao e preencher os schemas existentes com
mais qualidade.

Para manter compatibilidade, a camada de IA deve ser opcional, configuravel e com fallback
deterministico.

## Review Intelligence Implementado

A camada inicial de revisao para vagas `Full-time` ja existe no backend/worker:

- oportunidades `job` aceitas recebem `review_status`, `match_score`, `score_explanation`, fatores de
  score, keywords ausentes e sinais historicos
- candidatos e runs expoem `analysis_status` e `ai_filter_status`
- a IA continua opcional; saida invalida cai para fallback deterministico
- filtros de API e UI permitem revisar vagas por score minimo, keyword, contato disponivel, stage,
  provider, analysis status e status de envio
- o input unico de busca da lista Jobs consulta keywords, titulo/cargo, empresa, descricao/evidencia e
  email de contato explicito da vaga
- no fluxo LinkedIn, o titulo visivel da opportunity representa a pessoa que publicou o post; cargo e
  headline continuam em `job_detail` para matching, dedupe e templates
- a lista Jobs usa pagina de 50 itens por padrao para manter o popup leve; selecao `All visible on this
  page` e acoes em massa usam apenas os itens visiveis da pagina atual
- contatos de email capturados ou editados passam por sanitizacao antes de persistir/usar em envio,
  removendo sufixos invalidos como `hashtag` sem destruir emails validos

A tela Search foi separada em duas responsabilidades: busca simples no LinkedIn por texto/ordenacao e
uma secao `AI filters` opcional/desligada por padrao. A extensao captura posts de forma ampla e envia
filtros apenas quando habilitados; o worker registra motivo, confianca, sinais e counters antes de
criar oportunidade.

A Search UI tambem persiste a ultima busca usada na captura para preencher o input na proxima sessao.
Cada palavra nova do input vira uma keyword salva, respeitando limite de 30 badges por usuario. Esses
badges ficam abaixo do input para acesso rapido: clicar no texto adiciona a keyword ao input atual, e
clicar em `X` remove somente o badge. A captura continua usando apenas o texto presente no input no
momento do start, sem misturar automaticamente todos os badges salvos.

## Sinais Positivos

- email publico ou convite claro de contato
- keywords aderentes ao curriculo
- cargo compativel com o perfil
- empresa identificavel
- fonte e evidencia suficientes para revisar
- score alto com explicacao coerente

## Sinais Negativos

- contato ausente
- vaga sem email ou sem convite claro de contato quando o objetivo for envio direto
- keywords fracas ou genericas demais
- fonte bloqueada, vazia ou inacessivel
- duplicidade de oportunidade ja conhecida
- resposta real indicando que email nao e um canal util de candidatura

## Historico De Buscas LinkedIn Planejado

`017-extension-search-history` registra o proximo recorte do fluxo `Full-time`: uma aba de historico na extensao para comparar buscas feitas em `/search`. O objetivo e mostrar tanto a lista de runs LinkedIn recentes quanto agregados por query exata e por keyword/tag.

Regra central: o contador de resultado bruto do LinkedIn deve representar o que foi encontrado/capturado na busca antes de dedupe, rejeicao, filtro de IA ou criacao de opportunity. Duplicatas continuam importantes, mas aparecem como diagnostico separado; elas nao podem ser subtraidas do total bruto usado para comparar keywords, porque buscas repetidas naturalmente reencontram vagas ja conhecidas.

O escopo inicial nao altera o app web `Freelance`, leads, templates, Email/WhatsApp ou outreach. Tambem nao mistura career-page/ATS no primeiro corte; a historia e focada nas capturas LinkedIn iniciadas pela Search UI da extensao.

## Evidencia E Rastreabilidade

Toda melhoria de busca precisa manter rastreabilidade suficiente para responder:

- qual query trouxe essa oportunidade
- qual fonte sustentou a captura
- qual sinal elevou ou reduziu o score
- qual etapa rejeitou o candidato
- qual fluxo produziu mais oportunidades realmente acionaveis

## Validacao Antes De Escalar

- revisar amostra manual de oportunidades
- medir falsos positivos
- medir taxa real de oportunidades com contato util
- comparar qualidade entre queries
- ajustar score com base em resultado real, nao em achismo
- comparar resultados com e sem analise de IA antes de depender dela em producao

## Career Pages E Lifecycle

`013-serpapi-career-search` adiciona uma busca separada por career pages/ATS curados a partir do
botao da tela Search. Cada clique cria uma run nova no banco; nao ha cache de provider substituindo a
busca. A run persiste diagnosticos por fonte, limite de vagas aceitas e teto de candidatos
inspecionados para controlar custo.

Vagas com email capturado continuam no fluxo `With email`. Vagas sem email mas com URL oficial de
candidatura ficam em `External applications` para aplicacao manual. Como planejamento operacional,
vagas de LinkedIn e career pages devem ter vida util aproximada de 1 mes apos captura, mas esta feature
nao executa limpeza destrutiva automatica. Qualquer arquivamento/retencao deve preservar historico de
envio, aplicacao e oportunidades com eventos.
