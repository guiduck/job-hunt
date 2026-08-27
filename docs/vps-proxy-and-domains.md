# VPS Proxy E Dominios

Este guia registra como os dominios publicos chegam nos containers da VPS.

## Estado Atual

A VPS usa Caddy como proxy reverso. O sinal visto pelo `curl` e:

```bash
Via: 1.1 Caddy
```

Servicos publicados:

- `jobs-api.gfig.space` aponta para a API FastAPI em `http://127.0.0.1:8000`
- `freelance.gfig.space` aponta para o Next.js freelance em `http://127.0.0.1:3000`

Portas Docker na VPS:

```text
API/full-time:      127.0.0.1:8000 -> api:8000
Postgres full-time: 127.0.0.1:5432 -> postgres:5432
Freelance web:      0.0.0.0:3000   -> web:3000
Postgres freelance: 127.0.0.1:5433 -> freelance-postgres:5432
WhatsApp realtime:  127.0.0.1:3001 -> whatsapp-realtime:3001
Redis freelance:    127.0.0.1:6379 -> redis:6379
```

Os bancos nao devem ser expostos publicamente. Acesso remoto a Postgres deve ser via tunel SSH.

## Conferir API Publica

No computador local:

```bash
curl -i https://jobs-api.gfig.space/health
```

Resultado esperado:

```http
HTTP/1.1 200 OK
Server: uvicorn
Via: 1.1 Caddy

{"status":"ok"}
```

Na VPS:

```bash
cd /srv/projects/job-hunt/job-hunt
docker compose ps
curl -i http://127.0.0.1:8000/health
```

Se a VPS responde localmente mas o dominio publico nao responde, o problema esta em DNS, Caddy ou
certificado TLS.

## Configuracao Caddy Esperada

O arquivo geralmente fica em:

```bash
/etc/caddy/Caddyfile
```

Bloco esperado para a API:

```caddyfile
jobs-api.gfig.space {
    reverse_proxy 127.0.0.1:8000
}
```

Bloco recomendado para o app freelance:

```caddyfile
freelance.gfig.space {
    @whatsapp_realtime path /ws
    reverse_proxy @whatsapp_realtime 127.0.0.1:3001
    reverse_proxy 127.0.0.1:3000
}
```

Caddy forwards WebSocket upgrades automatically. The matcher must come before the general web
proxy so only `/ws` reaches the realtime service.

Depois de editar:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
systemctl status caddy --no-pager
```

## DNS

No provedor DNS, crie registros `A` apontando para a VPS:

```text
jobs-api.gfig.space    A    216.158.236.156
freelance.gfig.space   A    216.158.236.156
```

Se o painel DNS pedir campos separados, use:

```text
Type: A
Name/Host: freelance
Value/Points to: 216.158.236.156
TTL: Auto ou padrao
Proxy/CDN: desativado, se existir essa opcao inicialmente
```

Depois confira propagacao basica:

```bash
dig +short freelance.gfig.space
```

O resultado esperado e `216.158.236.156`.

## Env Do App Freelance Na VPS

No `.env.local` da raiz do projeto na VPS, configure:

```bash
FREELANCE_WEB_APP_BASE_URL=https://freelance.gfig.space
FREELANCE_AUTH_API_BASE_URL=http://api:8000
FREELANCE_GOOGLE_AUTH_SUCCESS_REDIRECT_URL=https://freelance.gfig.space/auth/google/callback
TWILIO_WEBHOOK_BASE_URL=https://freelance.gfig.space
REDIS_URL=redis://redis:6379
```

Do not set `NEXT_PUBLIC_WHATSAPP_REALTIME_URL` to `localhost` in production. When it is unset, the
browser derives `wss://freelance.gfig.space/ws` from the page URL.

Nao substitua `GOOGLE_AUTH_SUCCESS_REDIRECT_URL` por essa URL do Freelance; essa variavel continua
servindo como fallback do fluxo Google primario existente da API/extensao. A API aceita
`FREELANCE_GOOGLE_AUTH_SUCCESS_REDIRECT_URL` como destino final adicional para o web app.

## Extensao Plasmo

O `.env.local` que importa para a extensao fica em:

```bash
apps/extension/.env.local
```

Para usar a API da VPS:

```bash
PLASMO_PUBLIC_API_BASE_URL=https://jobs-api.gfig.space
```

Depois de mudar essa variavel, rebuild/reload e obrigatorio porque o Plasmo embute envs no bundle:

```bash
cd apps/extension
npm run build
```

Depois abra `chrome://extensions` e clique em reload na extensao.

Para desenvolvimento com hot reload:

```bash
cd apps/extension
npm run dev
```

## Debug Rapido Da Extensao

Se o popup mostrar `Failed to fetch`:

1. Confira `curl -i https://jobs-api.gfig.space/health` no computador.
2. Confira se `apps/extension/.env.local` aponta para `https://jobs-api.gfig.space`.
3. Rebuild/reload a extensao no Chrome.
4. Abra o console do popup da extensao e veja qual URL aparece nos logs `API request`.
5. Se o dominio responde no `curl`, mas a extensao falha, investigar CORS/permissoes da extensao.

## Freelance Local Apontando Para VPS

Nao exponha o Postgres freelance publicamente. Use tunel SSH:

```bash
ssh -L 5433:127.0.0.1:5433 root@216.158.236.156
```

Em `apps/web/.env.local`:

```bash
DATABASE_URL=postgresql://scrapper:<senha-do-freelance>@localhost:5433/freelance_app
```

Entao rode:

```bash
cd apps/web
npm run dev
```
