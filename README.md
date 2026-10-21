# tryasva.com

Static site for tryasva.com, served by Cloudflare Pages (project `asva`).

## Deploying

Push to `main`. A `pre-push` hook publishes the pushed commit to Cloudflare Pages with wrangler.

Cloudflare's own git builds are connected but have not fired since 2026-08-30 (GitHub stopped delivering push events). To restore them, reinstall the "Cloudflare Workers and Pages" GitHub App on this repo, confirm a `github:push` deployment appears, then delete `.git/hooks/pre-push`.

Deploy by hand:

```
npx wrangler@4 pages deploy . --project-name asva --branch main
```
