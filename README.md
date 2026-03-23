# michaelzenkay.github.io

Static site for `michaelzenkay.com` and report artifacts.

## Recommended Hosting

Use Cloudflare Pages for faster refresh behavior and easier rollbacks than GitHub Pages.

This repo now includes:

- `.github/workflows/deploy-cloudflare-pages.yml`: deploy to Cloudflare Pages on each `main` push
- `_headers`: cache policy tuned so report pages refresh immediately
- `publish.bat`: safer push flow (`fetch` + `pull --rebase` before push)

## One-Time Cloudflare Setup

1. In Cloudflare Pages, create a project named `michaelzenkay`.
2. Connect this GitHub repo (`michaelzenkay/michaelzenkay.github.io`).
3. Build settings:
   - Framework preset: `None`
   - Build command: leave empty
   - Build output directory: `.`
4. Add custom domain `michaelzenkay.com` in Pages and complete DNS prompts.
5. In GitHub repo settings, add secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

## Daily Publish Flow

From this repo:

```bat
publish.bat
```

That script now:

1. Fetches and rebases onto latest `origin/main`
2. Stages `reports/`, `results/`, `index.html`, `breast-mri-artifacts.html`
3. Commits
4. Pushes to `main` (which triggers Cloudflare deploy)

## Manual Git Commands

If you prefer manual commands:

```powershell
git fetch origin main --prune
git pull --rebase origin main
git -c core.filemode=false add reports/ results/ index.html breast-mri-artifacts.html
git commit -m "refresh site artifacts"
git push origin main
```

## Notes

- `CNAME` can remain in repo; Cloudflare ignores it for routing.
- `_headers` sets HTML/report pages to `must-revalidate`, reducing stale-page issues.
- If needed, use Cloudflare Pages "Retry deployment" or rollback to a prior successful deploy.
