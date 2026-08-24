# Deskpet

Deskpet is a small desktop companion built with Next.js. You choose a species,
color, name, and personality, then chat with a pet whose voice stays consistent.
The app works locally without external services and can add durable Redis storage
and AI-generated replies when credentials are configured.

## Local setup

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Useful checks:

```bash
npm test
npm run typecheck
npm run lint
```

## Environment variables

Create `.env.local` only for the services you want to enable.

| Variable | Purpose |
| --- | --- |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway authentication. Uses `openai/gpt-5.6-luna`. Vercel OIDC (`VERCEL_OIDC_TOKEN`) is also recognized. |
| `OPENAI_API_KEY` | Calls OpenAI directly with `gpt-5.6-luna`; takes precedence over Gateway configuration. |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Vercel KV-compatible Upstash Redis credentials. |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Native Upstash Redis credentials. |

AI is optional. Without an AI credential, chat uses a deterministic,
personality-aware local responder. If an AI request fails, the same local
responder is used automatically.

## Storage

When either complete Redis credential pair is present, profiles and chat history
are stored as JSON in Redis under `deskpet:profile:<deviceId>` and
`deskpet:chat:<deviceId>`. Otherwise the server uses process-global in-memory
maps. In-memory data survives hot reloads in the same process but is not durable
across restarts or serverless instances, so configure Redis for production.

## API

All errors are JSON in the form `{ "error": "..." }`. `deviceId` is a nonempty,
UUID-style client identifier of at most 128 characters. Names are trimmed and
must contain 1–24 characters.

### `GET /api/pet?deviceId=<id>`

Returns `{ "profile": PetProfile }`, with `profile: null` when no pet exists.

### `POST /api/pet`

Creates or replaces a pet and returns the profile plus its greeting:

```json
{
  "deviceId": "browser-generated-id",
  "name": "Mochi",
  "species": "cat",
  "color": "#b39ddb",
  "personality": "sunny"
}
```

The response is `{ "profile": PetProfile, "greeting": "..." }` with status
`201`. Species values are `cat`, `dog`, `bunny`, `dragon`, `fox`, and `robot`.
Colors are peach `#f4a879`, mint `#7fcbb0`, sky `#7fb2e5`, lilac `#b39ddb`,
blush `#e896b8`, and sun `#f2c14e`. Personalities are `sunny`, `sassy`,
`chill`, `chaotic`, and `gentle`.

### `PATCH /api/pet`

Updates one or more profile choices. Send `deviceId` plus any of `name`,
`species`, `color`, or `personality`. Returns `{ "profile": PetProfile }`.

### `GET /api/chat?deviceId=<id>`

Returns `{ "messages": ChatMessage[] }`; an unknown device has an empty list.

### `POST /api/chat`

Send a message:

```json
{ "deviceId": "browser-generated-id", "message": "How is your day?" }
```

`userMessage` is accepted as an alias for `message`. The normal response is:

```json
{ "userMessage": {}, "assistantMessage": {} }
```

Each message contains `id`, `role`, `content`, and `createdAt`. To receive plain
text, set `Accept: text/plain`; AI output streams when AI is configured, and the
completed exchange is persisted. Without AI configuration, the endpoint returns
the local response as plain text.

### `DELETE /api/chat?deviceId=<id>`

Clears the server-side transcript and returns `{ "messages": [] }`.

## Browser persistence

The browser identity lives at `deskpet.device_id` as a generated UUID. The UI
also mirrors the current profile and transcript to `deskpet.profile` and
`deskpet.messages`. This keeps a demo usable when a serverless in-memory store
cold-starts; the profile is sent back to the server on the next visit.

## Deployment

Deploy as a standard Next.js application. Configure Redis for durable data and
set either Gateway/OIDC or OpenAI credentials for generated chat. Never expose
these server-only values through `NEXT_PUBLIC_` variables.
