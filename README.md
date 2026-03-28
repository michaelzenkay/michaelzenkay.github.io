# michaelzenkay.github.io

Static site for `michaelzenkay.com` and report artifacts.

## Recommended Hosting

Use Cloudflare Pages for faster refresh behavior and easier rollbacks than GitHub Pages.

Current status on March 27, 2026:

- the live apex domain is still serving GitHub Pages responses through Cloudflare proxying
- `_headers` will not control HTML caching until the custom domain is actually cut over to Cloudflare Pages
- treat this repo as the deploy repo either way, but do not assume Cloudflare Pages behavior is live yet

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

## Source Of Truth

| Content | Authoritative source repo | Build / sync command | Published path |
|---|---|---|---|
| Breast MRI artifacts article | `src/breastmri-artifacts/` | `.\publish.ps1` from that repo | `breast-mri-artifacts.html` + `figures/` |
| MG best run + manuscript + reports index | `src/mg/` | `python scripts/prepare_best_publish.py --site-root d:\src\michaelzenkay.github.io` | `reports/` + `results/` + `index.html` |
| Site-only pages and demos | `src/michaelzenkay.github.io/` | edit here, then `publish.bat` | repo root |

## Article sources

| Content | Source | Published to |
|---|---|---|
| MG manuscript + report | `src/mg/` (via HPC) | michaelzenkay.com |
| Breast MRI artifacts article | `src/breastmri-artifacts/` | michaelzenkay.com only |

`breastmri.org` is reserved for the final polished article and nothing publishes there yet.

## Manual Git Commands

```powershell
git fetch origin main --prune
git pull --no-rebase origin main
git -c core.filemode=false add reports/ results/ figures/ index.html breast-mri-artifacts.html _headers review-system-auth.js
git commit -m "refresh site artifacts"
git push origin main
```

## Notes

- `CNAME` can remain in repo; Cloudflare ignores it for routing.
- `_headers` sets HTML/report pages to `must-revalidate`, but that only takes effect once the site is actually served by Cloudflare Pages.
- If needed, use Cloudflare Pages "Retry deployment" or rollback to a prior successful deploy.
