# tryasva.com

Static site for tryasva.com, served by Cloudflare Pages (project `asva`).

**This folder is the source of truth.** Edit these HTML files directly. Do not
regenerate them with `whatsapp-tally-saas/app/site.py` `export_static`: that
generator stopped being updated in October 2026 (old Basic/Growth/Pro prices,
installer 1.9.0) and would overwrite every change made here.

Copy rules: no em or en dashes; never describe ASVA as "recovery agent",
"collection agent" or "debt collection" (WhatsApp's Business Messaging Policy
prohibits debt collection, and Meta reviews this site during verification).

## Deploying

Push to `main`. A `pre-push` hook publishes the pushed commit to Cloudflare Pages with wrangler.

Cloudflare's own git builds are connected but have not fired since 2026-08-30 (GitHub stopped delivering push events). To restore them, reinstall the "Cloudflare Workers and Pages" GitHub App on this repo, confirm a `github:push` deployment appears, then delete `.git/hooks/pre-push`.

Deploy by hand:

```
npx wrangler@4 pages deploy . --project-name asva --branch main
```
