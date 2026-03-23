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

If HPC writes artifacts under `Z:\src\michaelzenkay.github.io` and you publish from
`D:\src\michaelzenkay.github.io`, use:

```bat
publish-hpc.bat
```

`publish-hpc.bat` / `publish-hpc.ps1` now:

1. Fetches and rebases onto latest `origin/main`
2. Copies a safe artifact allowlist from `Z:\src\michaelzenkay.github.io`
3. Auto-detects and copies the current best-run `results/<run>/report.html` from `results/reports.html`
4. Stages only copied artifact files (avoids unrelated local deletions)
5. Commits and pushes to `main` (which triggers Cloudflare deploy)

For same-repo local publish (no Z->D sync), use:

```bat
publish.bat
```

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
