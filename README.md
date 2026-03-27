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

Use `publish.bat` when `d:\src\michaelzenkay.github.io` already has the correct artifacts and should be treated as the source of truth.

```bat
publish-hpc.bat
```

`publish-hpc.bat` / `publish-hpc.ps1`:

1. Fetches and rebases onto latest `origin/main`
2. Syncs MG report artifacts from `Z:\src\michaelzenkay.github.io` into `D:\src\michaelzenkay.github.io`
3. Refuses to overwrite newer `D:` artifacts by default
4. Prints the blocked files and stops if `D:` is newer, so stale `Z:` output cannot silently clobber local work
5. If you explicitly want `Z:` to win, rerun with `.\publish-hpc.ps1 -PreferSource`
6. Stages, commits, and pushes to `main` (triggers Cloudflare deploy)

## Article sources

| Content | Source | Published to |
|---|---|---|
| MG manuscript + report | `src/mg/` (via HPC) | michaelzenkay.com |
| Breast MRI artifacts article | `Z:\src\breastmri-site\` | michaelzenkay.com only |

`breastmri.org` is reserved for the final polished article — nothing publishes there yet.

## Manual Git Commands

```powershell
git fetch origin main --prune
git pull --no-rebase origin main
git -c core.filemode=false add reports/ results/ index.html images/artifacts/ breast-mri-artifacts.html
git commit -m "refresh site artifacts"
git push origin main
```

## Notes

- `CNAME` can remain in repo; Cloudflare ignores it for routing.
- `_headers` sets HTML/report pages to `must-revalidate`, reducing stale-page issues.
- If needed, use Cloudflare Pages "Retry deployment" or rollback to a prior successful deploy.
