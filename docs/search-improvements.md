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
