# ASVA marketing website (tryasva.com)

Static site auto-deployed by Cloudflare Pages. Do NOT edit these
files by hand - they are generated from `app/site.py` in the ASVA
backend repo.

## Update on a new version
1. In the backend repo: `python build_zip.py website-repo`
2. Here: `git add -A && git commit -m "site update" && git push`
3. Cloudflare Pages auto-deploys the push. Done.
