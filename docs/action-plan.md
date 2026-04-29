# Plano de Acao

## Objetivo

Levar o projeto ate o primeiro ponto em que ele ja seja util para operacao real, sem perder
compatibilidade com a direcao de CRM, outreach e IA definida no `constitution`.

Para acompanhamento rapido do andamento real da execucao e do ultimo prompt utilizado, manter
`docs/handoff.md` atualizado junto com este plano.

## Ordem recomendada

### 1. Fundacao local

Implementar primeiro:

- `docker-compose.yml` com `PostgreSQL`
- configuracao de ambiente
- conexao da API com o banco
- migracoes iniciais

Resultado esperado:

- banco local funcional
- API preparada para persistir oportunidades

### 2. Modelo central de oportunidades

Criar primeiro as entidades minimas:

- `leads`
- `lead_interactions`

Garantias dessa etapa:

- salvar oportunidade com `opportunity_type`
- registrar `source_query` e evidencia
- editar notas e classificacao
- diferenciar `freelance` de `job` sem criar dois sistemas paralelos

### 3. Bot 1 de busca de empregos

Implementar o primeiro fluxo especializado de captura:

- keywords configuradas pelo usuario
- fallback mockado de keywords enquanto nao houver input
- busca de vagas e publicacoes no LinkedIn
- filtro por keywords relevantes
- captura de empresa, cargo, email, link e evidencia
- persistencia no banco

Resultado esperado:

- oportunidades `job` entrando com contexto suficiente para revisao e envio de email

### 4. Revisao operacional

Aqui um painel simples ja passa a gerar valor real.

Objetivo:

- listar oportunidades
- separar `freelance` e `job`
- filtrar por campanha, temperatura e status
- priorizar aba ou modo `Full-time Job`
- atualizar `lead_temperature` e `crm_stage`
- atualizar `job_stage`
- abrir detalhes com origem, evidencias e notas
- selecionar oportunidades para outreach

Implementacao possivel:

- `Next.js`
- ou um admin temporario enxuto

### 5. Envio de emails para vagas

Implementar depois da revisao manual basica:

- templates de email para candidatura
- anexo de curriculo
- selecao individual de vagas
- selecao em massa de vagas
- preparo de mensagem com contexto
- disparo manual controlado
- gravacao de eventos de envio

Resultado esperado:

- o usuario consegue enviar emails para empresas que publicaram vagas com email disponivel

### 6. Tracking e feedback loop de emprego

Adicionar depois:

- resposta
- entrevista
- rejeicao
- follow-up
- status de candidatura

Esses eventos precisam retroalimentar o CRM e a avaliacao da qualidade das buscas por emprego.

### 7. Bot freelance

Depois que o fluxo de empregos estiver util:

- buscar empresas por nicho e localidade
- detectar ausencia ou fraqueza de website
- salvar leads freelance
- gerar demo ou prompt `Lovable`
- usar templates de prospeccao

### 8. Camada de IA

Por ultimo nesta fase:

- gerar prompt estruturado para proposta
- gerar material reutilizando dados da oportunidade
- apoiar benchmark, personalizacao e prompt para ferramentas externas

## Sequencia de maior retorno

Se a meta for validar valor rapido, a melhor sequencia continua sendo:

1. banco local
2. modelo central de oportunidades
3. bot de busca de empregos salvando oportunidades
4. painel simples para revisar vagas
5. envio manual ou em massa de emails com curriculo

Esse e o primeiro ponto em que o sistema deixa de ser apenas um scraper e vira uma ferramenta de
operacao.

## Validacoes por etapa

- revisar se o schema continua aditivo e compativel
- medir falsos positivos do bot antes de escalar captura
- confirmar que o fluxo manual realmente ajuda a decidir o proximo passo
- atualizar `docs/` sempre que a direcao do produto mudar
