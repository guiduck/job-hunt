# Melhorias de Busca

## Objetivo

Sair de buscas genericas e construir uma estrategia de descoberta especializada, com mais sinal e
menos ruido. A prioridade atual continua sendo o fluxo `Full-time` por LinkedIn; a busca por clientes
freelance vem depois.

## Regras praticas

- usar queries simples e rastreaveis
- para `job`, combinar texto de busca, stack, senioridade e sinais de trabalho remoto/local
- guardar sempre a `source_query` que originou a captura
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
- tratar novas fontes de vagas como fora do roadmap imediato ate que exista uma hipotese melhor que
  gere contato publico realmente acionavel

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
- a lista Jobs usa pagina de 50 itens por padrao para manter o popup leve; selecao `All visible on this
  page` e acoes em massa usam apenas os itens visiveis da pagina atual
- contatos de email capturados ou editados passam por sanitizacao antes de persistir/usar em envio,
  removendo sufixos invalidos como `hashtag` sem destruir emails validos

A tela Search foi separada em duas responsabilidades: busca simples no LinkedIn por texto/ordenacao e
uma secao `AI filters` opcional/desligada por padrao. A extensao captura posts de forma ampla e envia
filtros apenas quando habilitados; o worker registra motivo, confianca, sinais e counters antes de
criar oportunidade.

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
