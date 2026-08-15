# Natilon Starter

An Astro site and the [Natilon CMS](https://github.com/natilon/cms) admin panel,
deployed as **one Cloudflare Worker**. Every record is a JSON file in this
repo, every publish is a git commit, and an editor can't break the site:
saving doesn't publish, internal links are picked from a list and verified at
build, moved pages keep their old paths as real 301s.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/natilon/natilon-starter)

## After the deploy button (two manual steps)

The button clones this repo into your GitHub account, provisions the KV
namespace and deploys the Worker. Two things it cannot do for you:

1. **Point the CMS at your clone** — edit `cms.config.mjs`:
   ```js
   owner: "your-github-user",
   repo:  "your-repo-name",
   ```
2. **Set the secrets** (`npx wrangler secret put <NAME> -c worker/wrangler.jsonc`):
   - `GITHUB_TOKEN` — a [fine-grained PAT](https://github.com/settings/personal-access-tokens)
     with read/write **Contents** permission on your clone (this is how the
     CMS reads and writes your content)
   - `ADMIN_PASS` — the admin panel password
   - `RESEND_API_KEY` — optional, for the contact form
     (verify your sender domain at [resend.com](https://resend.com) and set
     `mail.from` in `cms.config.mjs`)

Then open `https://<your-worker>.workers.dev/admin/` and sign in as `admin`.

## Five things to try first

1. **Edit the homepage** — change a paragraph, hit *Save*. The live site
   doesn't move: saves land on the `cms-drafts` branch.
2. **Publish page** — now it's live. One page went out; nothing else did.
3. **The draft** — "Style notes" exists in the admin and nowhere on the site.
   Flip its draft toggle and publish to take it live.
4. **Visit `/old-web-design`** — a real 301 to `/services/web-design/`,
   generated from the page's "Old paths" field.
5. **Break a link — try to.** Internal links are picked from a page list;
   `npm run build` verifies every one and names the page if something's off.

## Local development

```bash
npm install
cp .env.example .env          # set ADMIN_PASS
npm run dev                   # site + /admin on one origin, content on disk
```

Local dev edits the JSON files directly (the `fs` backend); the deployed
Worker talks to GitHub. Same admin, same content model.

```bash
npm run preview               # build + run the real Worker locally (wrangler dev)
npm run deploy                # build + deploy to Cloudflare
```

## Manual deploy (no button)

```bash
npm install
# set the secrets listed above
npm run deploy
```

**Optional — page templates** (reusable block sets in the admin). Everything
works without this; the templates list is just empty:

```bash
npx wrangler kv namespace create TEMPLATES_KV
# → uncomment kv_namespaces in worker/wrangler.jsonc with the printed id
npm run deploy
```

## How it fits together

```
src/pages-data/    content — one JSON file per page, edited by the admin
cms.config.mjs     the content model: collections, fields, blocks, forms
src/pages/         Astro templates rendering the content
worker/index.mjs   ONE worker: redirects → /api (CMS) → /admin (SPA) → site
```

The build (`npm run build`) outputs the static site to `dist/`, copies the
admin SPA to `dist/admin/`, and writes the redirect map to
`worker/redirects.json`. Files that exist are served by Cloudflare's asset
layer without running the worker; everything else — the API, redirects, the
404 page — is the worker's job.

## Custom domain

Workers → your worker → Settings → Domains & Routes → add your domain.
`workers.dev` is for trying things out, not for shipping.
