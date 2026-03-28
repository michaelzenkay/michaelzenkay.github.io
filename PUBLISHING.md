# Publishing Flow

This repo is the deployment surface for `michaelzenkay.com`, but it is not the authoritative source for every page.

## Canonical flows

### 1. Breast MRI artifacts article

Source of truth:

- `d:\src\breastmri-artifacts\manuscript.md`
- `d:\src\breastmri-artifacts\figures\`
- `d:\src\breastmri-artifacts\build_html.py`

Publish command:

```powershell
cd d:\src\breastmri-artifacts
.\publish.ps1
```

That command:

- rebuilds `main.html` and `export/manuscript.html`
- copies `main.html` to `d:\src\michaelzenkay.github.io\breast-mri-artifacts.html`
- syncs `figures/` into `d:\src\michaelzenkay.github.io\figures\`
- commits and pushes only the scoped site files

Use `.\publish.ps1 -FullExport` if you also want fresh `docx`, `tex`, and `pdf` outputs before syncing the site page.

### 2. MG best run, manuscript, and reports landing

Source of truth:

- `d:\src\mg\results\...`
- `d:\src\mg\report.py`
- `d:\src\mg\scripts\prepare_best_publish.py`

Refresh and site-sync command:

```powershell
cd d:\src\mg
python scripts\prepare_best_publish.py --site-root d:\src\michaelzenkay.github.io
```

Then publish the site repo:

```powershell
cd d:\src\michaelzenkay.github.io
.\publish.bat
```

### 3. Site-only pages and demos

Edit directly in `d:\src\michaelzenkay.github.io`, then run:

```powershell
.\publish.bat
```

## Why the old flow felt brittle

- the artifacts article had two sources of truth at different times: `main.html` in the article repo and `breast-mri-artifacts.html` in the site repo
- the generic site publish script did not always stage article support assets such as `figures/`
- live traffic is still behaving like GitHub Pages behind Cloudflare proxying, so `_headers` are not the active source of cache policy yet

## Recommended mental model

- build where the content originates
- sync scoped outputs into `michaelzenkay.github.io`
- push only the deploy repo for production
- keep article figures next to the article source, and MG run outputs next to MG results

## Quick checks after publish

```powershell
curl.exe -I https://michaelzenkay.com/breast-mri-artifacts.html
curl.exe -I https://michaelzenkay.com/reports/mg_best_report.html
```

Useful things to inspect:

- `last-modified`
- `Cache-Control`
- whether headers still mention GitHub / Fastly versus true Cloudflare Pages delivery
