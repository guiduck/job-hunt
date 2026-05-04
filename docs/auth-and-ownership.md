# Usuarios, Login e Ownership

Este documento define a direcao de autenticacao e dono dos dados antes do primeiro deploy real.

## Decisao de produto

O produto nao tera times/workspaces no primeiro ciclo. Cada conta representa um usuario individual,
com email e senha. Assinaturas futuras tambem pertencem ao usuario.

Isso mantém o modelo simples para o MVP e evita misturar curriculos, Gmail, templates, vagas e
historico entre operadores diferentes.

## Por que isso vem antes do deploy

Hoje o MVP local funciona como single-operator: settings, curriculos, templates, provider Gmail,
vagas, runs e historico sao globais no banco. Isso e aceitavel para desenvolvimento local, mas nao e
aceitavel quando a API fica publica.

Antes de subir para um ambiente compartilhado, cada recurso operacional precisa ter dono.

## Modelo minimo recomendado

### `users`

Campos recomendados:

- `id`
- `email`
- `password_hash`
- `display_name`
- `subscription_status`
- `subscription_plan`
- `created_at`
- `updated_at`

`email` deve ser unico. Senhas nunca devem ser salvas em texto puro; usar hash forte como
`bcrypt`/`passlib` ou equivalente.

### Sessao/autenticacao

Para o primeiro recorte, usar um fluxo simples:

1. usuario cria conta com email e senha
2. usuario faz login
3. API emite token de sessao ou JWT
4. extensao guarda apenas o token de acesso/sessao, nunca senha, OAuth token Gmail ou client secret
5. todas as rotas protegidas resolvem `current_user`

Magic link, OAuth social e SSO ficam fora do MVP.

Decisoes do recorte atual:

- signup aberto em todos os ambientes, usando `DATABASE_URL` proprio por ambiente
- sem verificacao de email no MVP
- sessoes bearer guardadas pela extensao em browser session storage; reiniciar o navegador exige login novamente
- reset de senha user-facing com token temporario e resposta nao enumeradora para email desconhecido

## Recursos que devem pertencer ao usuario

Adicionar `user_id` nos recursos abaixo, com migration/backfill para um usuario local padrao:

- `user_settings`
- `resume_attachments`
- `email_templates`
- `sending_provider_accounts`
- `job_search_runs`
- candidatos/runs auxiliares, quando aplicavel
- `opportunities`
- detalhes de vaga e matches associados via oportunidade
- `email_drafts`
- `send_requests`
- `bulk_send_batches`
- `outreach_events`
- futuras campanhas
- futuros prompts/artefatos de IA
- futuros leads e campanhas freelance

Templates padrao da aplicacao podem existir depois, mas devem ser tratados como seeds/system
templates copiaveis para o usuario. Templates editados pelo usuario devem ser do usuario.

## Regras de acesso

- Um usuario so pode listar, criar, editar, enviar ou apagar recursos dele.
- O Gmail conectado pertence ao usuario autenticado.
- O curriculo default e por usuario.
- Keywords, settings e preferencias de busca sao por usuario.
- Vagas capturadas pela extensao pertencem ao usuario logado que iniciou a coleta.
- Bulk send nunca deve selecionar vagas de outro usuario.
- Worker deve processar jobs preservando `user_id` e nunca misturar provider account de outro usuario.

## Desenvolvimento local

Para nao quebrar dados locais existentes, a migration deve criar ou aceitar um usuario local padrao
para backfill, por exemplo:

- email: `local@example.com`
- nome: `Local Operator`

Isso e apenas compatibilidade de desenvolvimento. Em producao, login deve ser explicito.

## Assinaturas futuras

Como nao havera workspace/time no inicio, limites e planos futuros devem se ligar diretamente a
`users`:

- plano do usuario
- status da assinatura
- limites de busca/envio por usuario
- historico de uso por usuario

Nao usar variaveis de ambiente globais para limites de produto.
