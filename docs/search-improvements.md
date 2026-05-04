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

Para vagas, variar:

- cargo alvo
- stack principal
- termos como `hiring`, `vaga`, `oportunidade`, `email`, `curriculo`, `resume`
- senioridade
- remoto, hibrido ou presencial
- regiao, quando fizer sentido

## Papel de IA na busca

A busca deve continuar separando duas responsabilidades:

- provider deterministico: monta queries, respeita limites, busca dados publicos ou fornecidos pelo
  usuario e registra `source_query`, fonte, status e evidencia
- analise inteligente: interpreta o texto coletado, extrai campos, estima aderencia e explica por que
  o candidato deve ou nao virar oportunidade

Isso evita depender de uma lista infinita de strings para entender nuance, sem abrir mao de
rastreabilidade. Keywords e termos de intencao continuam uteis para descobrir fontes e limitar custo;
IA pode ser usada depois para reduzir ruido, detectar cargos equivalentes, distinguir vaga real de
post generico e preencher o formato dos schemas com mais qualidade.

Para manter compatibilidade, a primeira camada de IA deve ser opcional, configuravel e com fallback
para parser/normalizer deterministico.

## Review intelligence implementado

A camada inicial de revisao para vagas `Full-time` ja existe no backend/worker:

- oportunidades `job` aceitas recebem `review_status`, `match_score`, `score_explanation`, fatores de score, keywords ausentes e sinais historicos
- candidatos e runs expõem `analysis_status` para distinguir analise deterministica, IA assistida, fallback, falha ou skip
- a IA continua opcional e desativada por padrao; saida invalida cai para fallback deterministico
- filtros de API permitem revisar vagas por score minimo, keyword, contato disponivel, status de revisao, stage, provider, analysis status e run

O proximo passo de produto deve usar esses campos para preparar candidaturas humanas: escolher
curriculo/template, gerar preview de email, enviar email real pelo provider configurado apos
aprovacao, registrar evento de envio e acompanhar respostas sem automatizar envio irrestrito.

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
