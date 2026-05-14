# Revisao do Estado Atual

Esta revisao compara a aplicacao atual com `references/opportunity-desk-pro`, `references/images` e
o guia freelance em `references/guia`.

## Resumo executivo

O projeto esta coerente com o caminho escolhido: primeiro tornar o modo `Full-time` util de ponta a
ponta, depois voltar para o bot `Freelance` de Google Maps/Lovable. A base tecnica ja cobre captura,
persistencia, revisao, scoring, templates, curriculos, drafts, login email/senha e Google, envio
Gmail/OAuth, historico de envio, bulk send com IA e filtros inteligentes pos-captura para buscas
LinkedIn. A maior lacuna de produto agora e ajudar o operador durante aplicacoes externas, onde ele
perde tempo respondendo formularios longos. Por isso a proxima spec recomendada e um AI Field
Assistant na extensao, com overlay em campos e respostas baseadas no curriculo.

## O que esta implementado

- `FastAPI`, worker e PostgreSQL como base compartilhada.
- Modelo central de oportunidades com separacao entre `job` e `freelance`.
- Runs de busca de vagas LinkedIn com lifecycle, candidatos, aceite/rejeicao, deduplicacao e metricas.
- Coleta autenticada local via extensao/Playwright para contornar login wall sem burlar controles.
- Extensao Plasmo como primeira UI operacional `Full-time`.
- Lista/detalhe de vagas, review status, notas, score deterministico/assistido e filtros.
- Templates `Full-time`, previews, drafts, envio individual, base de bulk send e historico.
- Gmail API/OAuth como provider v1, com token OAuth salvo no PostgreSQL.
- Upload de curriculo PDF com conteudo salvo no PostgreSQL e curriculo default.
- Limites globais removidos para permitir regras futuras por plano/assinatura.
- Login email/senha, sessoes bearer, reset de senha e rotas protegidas por usuario.
- Login/cadastro com Google como autenticacao primaria do app, com linking por email verificado e
  separacao total do OAuth Gmail de envio.
- `user_id` em recursos operacionais principais, com backfill para usuario local padrao.
- Extensao Plasmo com signup/login/logout/reset e token em browser session storage.
- Busca LinkedIn simplificada por texto/ordenacao e filtros opcionais por IA pos-captura, com campos,
  status, motivos, confianca, sinais, counters, provider OpenAI compativel e fallback deterministico.
  O filtro explicito de keywords excluidas foi removido; a IA passa a avaliar texto completo,
  contexto de curriculo/perfil, preferencia remota, regioes e se o post representa uma vaga real.
- Content script da extensao tenta acionar o controle visivel de mais resultados quando a lista para
  de carregar durante uma captura iniciada pelo usuario.
- Assistente de campos externos com IA implementado na extensao: ativacao por dominio/pagina, shell
  persistente, varinha em campos elegiveis, respostas salvas por keyword, contexto de curriculos
  selecionados e preenchimento em massa `Fill saved`/`Fill with AI`.
- Busca LinkedIn ganhou timeout terminal na extensao para nao bloquear nova captura quando a verificacao
  nao completa, e o worker pode marcar runs antigas em `running` como timeout.
- Dashboard `Full-time` usa metricas agregadas da API, sem herdar filtros/paginacao da lista Jobs.

Ainda nao implementado:

- atualizar todos os testes legados para enviar bearer token nas rotas protegidas
- validar OAuth Gmail e approved-send em ambiente real publicado
- revisar e polir o fluxo visual da extensao depois do login para aproximar do prototipo e ficar
  publicavel
- executar o smoke manual completo de `008` com LinkedIn real, AI filters, controle de mais resultados
  e revisao de output do modelo
- executar smoke manual ampliado do assistente de campos em formularios reais variados

## Coerencia com o prototipo

O prototipo `opportunity-desk-pro` descreve dois modos dentro da mesma casca visual: `Full-time` e
`Freelance`. A implementacao atual segue essa direcao no backend e na extensao, mas a UI ainda e um
MVP operacional, nao a experiencia visual completa do prototipo.

Pontos alinhados:

- separacao conceitual entre vagas e leads freelance
- detalhe de oportunidade com evidencia, score, status, notas e acoes
- fluxo `Full-time` com curriculo, template e candidatura
- settings com perfil/curriculo/provider
- historico/eventos de contato como trilha auditavel

Pontos ainda distantes:

- web app dark completa com sidebar, dashboard, campanhas, leads, templates e configuracoes por modo
- campanhas `Full-time` com campos proprios como cargo, senioridade, modalidade e keywords negativas
- dashboard com funil de vagas, candidaturas, respostas e entrevistas mais proximo de produto final
- export CSV e acoes em massa mais polidas
- estados de resposta, entrevista, rejeicao e follow-up com feedback loop real
- bot `Freelance` com Google Maps, analise de site, demo URL e prompt Lovable

## Coerencia com o guia freelance

O guia de prospeccao freelance pede uma maquina de volume e consistencia: nichos, cidades, negocios
sem site ou com site fraco, demo/prompt Lovable, email, checklist e acompanhamento. Nada disso deve
ser misturado com `Full-time`.

O caminho atual preserva essa proxima fase porque:

- `freelance` continua como modo separado no modelo
- `demo_url`, prompts Lovable e status comercial continuam reservados para freelance
- templates de candidatura e templates comerciais sao colecoes separadas
- eventos de outreach podem ser reaproveitados sem virar um CRM misturado

Antes de implementar Google Maps, vale estabilizar login/ownership/deploy, feedback pos-envio e smoke
real do que ja existe. Depois disso, o proximo grande recorte de produto pode ser o bot freelance.

## Decisoes tecnicas revisadas

### `.local/`

`.local/` nao e storage de producao. Ela fica restrita a coleta local com Playwright, logs e arquivos
de secret opcionais no desenvolvimento. Dados operacionais relevantes devem estar no PostgreSQL ou,
no futuro, em bucket com referencia no banco.

### OAuth Gmail

O `client secret` e configuracao do app OAuth e deve vir de secret de ambiente ou arquivo montado. O
token de consentimento do usuario fica no banco em `sending_provider_accounts.token_json`. Para Render,
a direcao preferida e `GMAIL_OAUTH_CLIENT_CONFIG_JSON` como Environment Secret, nao arquivo em `.local`.

### Curriculos

Salvar PDF no PostgreSQL e aceitavel no inicio e reduz complexidade. A evolucao para R2/S3 deve ser
feita por adapter, mantendo metadata e relacoes no banco para nao quebrar a API/extensao.

### Limites

Limites por env foram removidos corretamente. Limite de busca/envio deve ser regra de produto futura,
vinda de plano/assinatura do usuario, nao configuracao global.

### Usuarios

O produto deve usar usuarios individuais com email e senha. Nao ha time/workspace no ciclo atual.
Assinaturas futuras pertencem ao usuario. Cada curriculo, template, provider Gmail, vaga, run e
historico precisa pertencer a um usuario.

## Riscos atuais

- OAuth real precisa ser validado com URL publica quando houver deploy, porque redirect URI muda.
- Armazenar PDFs no Postgres e simples, mas pode crescer demais se houver muitos usuarios/arquivos.
- A extensao depende do DOM atual do LinkedIn e pode quebrar com mudancas visuais.
- Bulk send precisa de mais observabilidade, retries, polling duravel e controles antes de uso em
  volume.
- O worker ainda tem uma falha conhecida fora do fluxo de email na suite completa do provider LinkedIn.
- Parte da suite legada ainda falha porque testes antigos chamam rotas protegidas sem bearer token.
- Login/ownership ja existe, mas ainda precisa de hardening de validacao completa e smoke test
  publicado antes de uso real com mais de uma pessoa.

## Proxima spec recomendada

A proxima spec deve ser `full-time-publishable-mvp-hardening`: polir o MVP `Full-time` para uso
publicavel, cobrindo dashboard/jobs/search, timeout/status de workflows longos, deploy/OAuth real,
smoke checklist, observabilidade basica, retencao segura e AI bulk/post-send duravel.
O foco deve ser reduzir atrito e risco no que ja existe antes de iniciar outra frente grande.

So depois dessa estabilizacao faz sentido acelerar para:

1. tracking mais completo de respostas/status de candidatura no `Full-time`
2. retencao/limpeza automatica configuravel para oportunidades antigas
3. web app mais proxima do prototipo, se a operacao local justificar
4. bot `Freelance` com Google Maps, analise de site e prompt Lovable
