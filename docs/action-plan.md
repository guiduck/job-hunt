# Plano de Acao

## Objetivo

Colocar o sistema para funcionar o mais cedo possivel, sem esperar tudo ficar pronto.

## Ordem de prioridade

### 1. Base local

Implementar primeiro:

- `docker-compose.yml` com `PostgreSQL`
- `.env`
- conexao da API com o banco
- migracoes iniciais

Resultado esperado:

- banco local funcionando
- API conectada

### 2. Modelo de leads

Criar primeiro as tabelas:

- `leads`
- `lead_interactions`

Resultado esperado:

- salvar leads
- editar notas
- mudar status

### 3. Bot 1

Implementar:

- coleta inicial
- deduplicacao
- deteccao de website
- score inicial
- persistencia no banco

Resultado esperado:

- leads entrando no sistema

### 4. Painel simples

Aqui um front simples ja comeca a fazer sentido.

Objetivo:

- ver lista de leads
- clicar para marcar `cold`, `warm` ou `hot`
- mudar `crm_stage`
- abrir detalhes do lead
- escrever nota
- selecionar leads para outreach

Isso pode ser:

- `Next.js`
- ou um admin simples temporario

Se voce quer operar por clique, eu recomendo colocar essa etapa cedo.

### 5. Envio manual assistido de emails

Implementar:

- template simples
- selecao de leads
- disparo manual controlado
- gravacao de evento de envio

Resultado esperado:

- voce consegue escolher leads e mandar emails sem automacao complexa

### 6. Tracking de outreach

Depois:

- resposta
- clique
- interesse
- pedido de template

Esses eventos devem voltar para o lead e para o CRM.

### 7. Area de IA

Por ultimo nesta primeira fase:

- gerar prompt estruturado para proposta
- gerar mega prompt para `Lovable`
- usar dados do lead, observacoes e nicho

## Recomendacao objetiva

Se a meta e ver valor rapido, eu faria:

1. banco local
2. tabela de leads
3. scraper salvando no banco
4. front simples para revisar e agrupar
5. envio manual de emails

Esse e o primeiro ponto em que o sistema ja fica realmente util.
