# Cloudflare Pages Migration Checklist

## Goal

Serve this static site from Cloudflare Pages with faster propagation and predictable cache behavior.

## Current Status

Observed on March 27, 2026 from live headers:

- `https://michaelzenkay.github.io/...` still 301 redirects through GitHub Pages
- `https://michaelzenkay.com/...` is still showing GitHub/Fastly response headers behind Cloudflare proxying
- page HTML is currently served with `Cache-Control: max-age=600`

That means the repo may be deploying to Cloudflare Pages, but the custom domain is not fully cut over to Pages yet. Until it is, `_headers` will not control HTML caching.

## Verify Project Settings

- Project name: `michaelzenkay`
- Production branch: `main`
- Build command: none
- Output directory: `.`

## GitHub Secrets Required

Set in GitHub repo settings:

- `CLOUDFLARE_API_TOKEN` (Pages deploy permissions)
- `CLOUDFLARE_ACCOUNT_ID`

## Domain Cutover

1. Add `michaelzenkay.com` in Cloudflare Pages custom domains.
2. Ensure DNS is managed in Cloudflare and points to the Pages target.
3. Confirm certificate status is active in Cloudflare.

## Deploy Paths

- Automatic: push to `main` triggers `.github/workflows/deploy-cloudflare-pages.yml`
- Manual direct deploy:

```bat
publish-cloudflare.bat
```

## Troubleshooting

- Stale page: Cloudflare dashboard -> Caching -> Purge cache (single file or everything).
- Failed GitHub deploy: check Actions logs for missing secrets or wrong project name.
- Wrong content: confirm latest commit is on `main` and Cloudflare production deploy points to that commit.
- Wrong cache behavior: if response headers still show GitHub / Fastly and `max-age=600`, the custom domain is still effectively on GitHub Pages and `_headers` are not active yet.
