# Bot 1 - Scraper

## Objetivo

Encontrar pequenas empresas locais com chance de contratar um website.

## Lead ideal

- pequeno negocio local
- sem website identificado
- com email publico
- com telefone ou outro contato util

## Fluxo

1. buscar por nicho e cidade
2. coletar empresas
3. detectar website
4. capturar email e telefone
5. deduplicar
6. salvar no banco

## Regras iniciais

- se houver website no perfil, nao priorizar
- se houver so rede social, ainda pode ser lead
- se houver email publico, sobe prioridade
- se houver duvida sobre website, marcar para revisao

## Resultado minimo

- leads salvos no `PostgreSQL`
- score inicial
- status inicial para CRM
