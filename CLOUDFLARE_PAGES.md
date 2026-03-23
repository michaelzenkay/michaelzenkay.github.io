# Cloudflare Pages Migration Checklist

## Goal

Serve this static site from Cloudflare Pages with faster propagation and predictable cache behavior.

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
