# LinkedIn Browser Collector - Uso Local

Este guia mostra como usar o coletor local autenticado do LinkedIn.

## O Que Cada Parte Faz

- Docker roda a infraestrutura:
  - `api`: recebe runs e expõe os endpoints.
  - `worker`: processa runs, faz parse, normaliza, deduplica, calcula score e salva oportunidades.
  - `postgres`: banco de dados.
- `tools/linkedin_browser_collector.py` roda fora do Docker, na sua máquina, abrindo um navegador Playwright com seu login do LinkedIn.

O coletor envia texto bruto para a API. Depois o worker extrai campos úteis como email, contato, keywords e score.

## Primeira Instalação

```bash
python -m pip install playwright
python -m playwright install chromium
```

## Subir API, Worker e Banco

```bash
docker compose up -d
docker compose ps
```

Espere ver:

```text
api      healthy
worker   up
postgres healthy
```

## Rodar Coleta Com LinkedIn Logado

Para buscar até 50 publicações recentes com mais scrolls:

```bash
python tools/linkedin_browser_collector.py --keywords "hiring typescript" --max-posts 50 --max-scrolls 15 --scroll-delay-seconds 2
```

## Disparar Pela API Local

Tambem existe um endpoint para iniciar o coletor:

```bash
curl -X POST http://localhost:8000/linkedin/browser-collector/runs \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["hiring typescript"],
    "max_posts": 50,
    "max_scrolls": 15,
    "scroll_delay_seconds": 2
  }'
```

Importante: esse endpoint chama o script `tools/linkedin_browser_collector.py` a partir do processo da API. Para abrir o navegador com seu login, a API precisa estar rodando em um ambiente local que consiga abrir janelas. Se a API estiver dentro do Docker, o endpoint pode iniciar o subprocesso no container, mas o container normalmente não consegue usar a sessão/navegador logado do host.

Uso recomendado para coleta logada real:

```bash
docker compose up -d
python tools/linkedin_browser_collector.py --keywords "hiring typescript" --max-posts 50 --max-scrolls 15 --scroll-delay-seconds 2
```

Use o endpoint quando a API estiver rodando localmente fora do Docker, ou quando voce configurar um ambiente capaz de abrir o navegador.

O link gerado segue este formato, ordenado por mais recentes:

```text
https://www.linkedin.com/search/results/content/?keywords=hiring+typescript&origin=FACETED_SEARCH&sid=VRT&sortBy=%22date_posted%22
```

`%22date_posted%22` e `"date_posted"` representam o mesmo valor com aspas na URL.

Para usar outras buscas, troque o texto em `--keywords`:

```bash
python tools/linkedin_browser_collector.py --keywords "hiring react native" --max-posts 50 --max-scrolls 15 --scroll-delay-seconds 2
python tools/linkedin_browser_collector.py --keywords "contratando typescript remoto" --max-posts 50 --max-scrolls 15 --scroll-delay-seconds 2
python tools/linkedin_browser_collector.py --keywords "frontend developer email" --max-posts 50 --max-scrolls 15 --scroll-delay-seconds 2
python tools/linkedin_browser_collector.py --keywords "hiring typescript react" --max-posts 100 --max-scrolls 30 --scroll-delay-seconds 2
```

Para rodar várias buscas na mesma execução, passe cada busca entre aspas:

```bash
python tools/linkedin_browser_collector.py --keywords "hiring typescript" "hiring react native" "contratando frontend" --max-posts 50 --max-scrolls 15 --scroll-delay-seconds 2
```

Na primeira execução:

1. O navegador abre.
2. Faça login no LinkedIn normalmente.
3. Se usar magic link ou 2FA, espere o LinkedIn carregar de verdade.
4. Volte ao terminal e pressione Enter.

O perfil local fica salvo em:

```text
.local/linkedin-playwright-profile/
```

Essa pasta está no `.gitignore`.

## Rodar Sem Criar Run

Use `--dry-run` para ver o que o coletor consegue capturar sem enviar para a API:

```bash
python tools/linkedin_browser_collector.py --keywords "hiring typescript" --max-posts 20 --max-scrolls 10 --dry-run
```

O coletor lê o DOM/HTML renderizado do navegador, não tira print screen. Ele não clica em `ver mais` porque isso pode abrir modais do LinkedIn e travar a navegação; a extração usa o texto já disponível no DOM do card/post.

## Consultar Runs

```bash
curl http://localhost:8000/job-search-runs
```

Pegue o `id` da run criada e consulte candidatos:

```bash
curl http://localhost:8000/job-search-runs/<run_id>/candidates
```

Consulte oportunidades aceitas:

```bash
curl http://localhost:8000/job-search-runs/<run_id>/opportunities
```

## Ver Apenas Oportunidades Com Email

```bash
curl "http://localhost:8000/opportunities?opportunity_type=job&contact_available=true"
```

## Imprimir Email, Título e Link

No Git Bash/terminal:

```bash
python - <<'PY'
import json
import urllib.request

url = "http://localhost:8000/opportunities?opportunity_type=job&contact_available=true"
with urllib.request.urlopen(url) as response:
    opportunities = json.load(response)

for item in opportunities:
    detail = item.get("job_detail") or {}
    print("---")
    print("company:", detail.get("company_name") or item.get("organization_name"))
    print("title:", detail.get("role_title") or item.get("title"))
    print("email:", detail.get("contact_email") or detail.get("contact_channel_value"))
    print("source:", item.get("source_url"))
    print("score:", (detail.get("review_profile") or {}).get("match_score"))
PY
```

## Onde O Email Aparece

O coletor captura texto bruto. O email é extraído depois pelo worker.

Campos relevantes:

- candidato: `contact_channel_value`
- detalhe da oportunidade: `job_detail.contact_email`
- detalhe da oportunidade: `job_detail.contact_channel_value`

Se um post não tiver email público, ele normalmente vira candidato `rejected_no_contact` e não vira oportunidade aceita.

## Deduplicação

A deduplicação atual usa uma chave montada com:

- empresa normalizada
- cargo/headline normalizado
- keywords encontradas
- contato/email normalizado

No worker, antes de criar uma nova oportunidade, o sistema procura `job_opportunity_details.dedupe_key`.

Se já existe:

- não cria nova oportunidade;
- registra o candidato da run como `duplicate`;
- aponta `opportunity_id` para a oportunidade existente;
- incrementa `duplicate_count` na run.

Se não existe:

- cria uma nova oportunidade `job`;
- cria o detalhe em `job_opportunity_details`;
- salva email, fonte, evidência, keywords e review profile.

## Limitação Atual Da Deduplicação

Quando o LinkedIn não fornece empresa/cargo claros, a chave pode ficar baseada principalmente em keyword + email.

Isso evita duplicar o mesmo post, mas pode considerar duas publicações diferentes do mesmo contato/email como duplicadas se os campos estiverem vazios. Para melhorar isso depois, podemos incluir `post_url` ou um hash do texto da publicação na dedupe key.

## Comando Mais Útil Para Agora

```bash
docker compose up -d
python tools/linkedin_browser_collector.py --keywords "hiring typescript" --max-posts 50 --max-scrolls 15 --scroll-delay-seconds 2
curl "http://localhost:8000/opportunities?opportunity_type=job&contact_available=true"
```

## Preparar Envio De Email Gmail/OAuth

O envio real de candidaturas `Full-time` usa Gmail/OAuth no backend/worker. A extensao Plasmo nunca
deve guardar client secret, refresh token ou token de acesso.

Arquivos locais opcionais para desenvolvimento:

```text
.local/gmail/client_secret.json
```

Esse caminho fica sob `.local/`, que esta ignorado pelo Git, apenas no ambiente local. Em deploy,
prefira `GMAIL_OAUTH_CLIENT_CONFIG_JSON` no painel de Environment/Secrets. O token OAuth gerado apos
consentimento fica no PostgreSQL em `sending_provider_accounts.token_json`, e curriculos enviados
pelo app ficam no PostgreSQL em `resume_attachments.file_content`.

```bash
EMAIL_PROVIDER=gmail
GMAIL_OAUTH_CLIENT_CONFIG_JSON=
GMAIL_OAUTH_CLIENT_SECRETS_FILE=.local/gmail/client_secret.json
GMAIL_OAUTH_SCOPES=https://www.googleapis.com/auth/gmail.send
RESUME_STORAGE_BACKEND=local_fs
RESUME_STORAGE_DIR=.local/resumes
EMAIL_SEND_POLL_INTERVAL_SECONDS=5
```

Em producao, o banco muda por `DATABASE_URL`, o client secret OAuth deve vir de secret do ambiente, e
`.local/` nao deve ser copiado para o servidor.

Passos do operador:

1. Crie um projeto no Google Cloud.
2. Ative a Gmail API.
3. Configure a tela de consentimento OAuth para uso local/teste.
4. Crie credenciais OAuth Client.
5. Baixe o JSON e escolha uma das opcoes:
   - local: salve como `.local/gmail/client_secret.json`
   - deploy: cole o JSON bruto em `GMAIL_OAUTH_CLIENT_CONFIG_JSON`
6. Abra o fluxo `/sending/google-oauth/start`; a API troca o `code` do callback por token e salva no
   banco.
7. Envie curriculos pela tela `Settings` ou pelo endpoint de upload; o PDF fica no banco.
