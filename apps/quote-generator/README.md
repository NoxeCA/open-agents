# quote-generator

Internal quote generator.

See `/root/.claude/plans/i-want-to-make-reactive-walrus.md` for the product plan.

Stack:

- Next.js 16 App Router
- Better Auth (Microsoft SSO, `@noxe.ca` allowlist)
- Drizzle ORM + Neon Postgres
- AI SDK v5 + Anthropic
- Tailwind v4 + shadcn/ui

Run `bun install` at the repo root, then `bun run dev` here.

## Local dev without login

If you just want the app running locally, you can bypass Microsoft auth outside
production.

1. Start a local Postgres database:

   ```bash
   cd apps/quote-generator
   bun run db:up
   ```

2. Copy the local env file:

   ```bash
   cp apps/quote-generator/.env.example apps/quote-generator/.env.local
   ```

3. Set the minimum env vars:

   ```env
   DEV_SKIP_AUTH=true
   DEV_LOCAL_BLOB=true
   ```

   For the chat model, use one of:

   ```env
   ANTHROPIC_API_KEY=...
   ```

   or

   ```env
   AI_GATEWAY_API_KEY=...
   ```

4. Apply the existing Drizzle migration:

   ```bash
   cd apps/quote-generator
   bun run db:migrate
   ```

5. Start the app on `http://localhost:3001`:

   ```bash
   bun run dev:local
   ```

With `DEV_SKIP_AUTH=true`, the app auto-creates a local dev user in Postgres and
skips the Microsoft sign-in flow. `BETTER_AUTH_SECRET`,
`MICROSOFT_CLIENT_ID`, and `MICROSOFT_CLIENT_SECRET` are not required in that
mode.

If `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` is set, the quote agent uses
Vercel AI Gateway with the model id `anthropic/claude-sonnet-4.6`. Otherwise it
falls back to direct Anthropic access via `ANTHROPIC_API_KEY`.

If `DEV_LOCAL_BLOB=true` is set, or if you are in local dev without a
`BLOB_READ_WRITE_TOKEN`, uploaded Excel files and generated PDFs are written to:

```text
apps/quote-generator/.local/blob-storage/
```

That lets you test uploads and PDF generation locally without Vercel Blob.
The quote PDF now renders locally from the shared `@open-harness/quote-documents`
workspace package through `json-render`, so you do not need a separate
documents app running on `localhost:3000`.

The included `compose.yaml` provisions Postgres on `localhost:5433` with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/quote_generator
```
