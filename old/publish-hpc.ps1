param(
    [string]$SourceRoot = "Z:\src\michaelzenkay.github.io",
    [string]$RepoRoot = $PSScriptRoot,
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"

function Run-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    & git @Args
    if ($LASTEXITCODE -ne 0) {
        throw "git command failed: git $($Args -join ' ')"
    }
}

function Copy-Artifact {
    param(
        [string]$RelativePath,
        [string]$SourceBase,
        [string]$DestBase
    )
    $src = Join-Path $SourceBase $RelativePath
    $dst = Join-Path $DestBase $RelativePath
    if (-not (Test-Path $src)) {
        Write-Host "[skip] missing source: $RelativePath"
        return $false
    }
    $parent = Split-Path -Parent $dst
    if (-not (Test-Path $parent)) {
        New-Item -Path $parent -ItemType Directory -Force | Out-Null
    }
    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "[copy] $RelativePath"
    return $true
}

$resolvedSource = (Resolve-Path $SourceRoot).Path
$resolvedRepo = (Resolve-Path $RepoRoot).Path

Push-Location $resolvedRepo
try {
    Run-Git fetch origin main --prune
    # Allow running with local unstaged files (for example, intentionally untracked/deleted
    # archives) while still rebasing onto latest main.
    Run-Git pull --rebase --autostash origin main

    $artifacts = [System.Collections.Generic.List[string]]::new()
    @(
        "index.html",
        "demo.html",
        "mg-risk-demo.html",
        "demo-client.js",
        "reports/mg_best_report.html",
        "reports/mg_manuscript_latest.html",
        "results/reports.html",
        "results/summary.html"
    ) | ForEach-Object { [void]$artifacts.Add($_) }

    $sourceLanding = Join-Path $resolvedSource "results/reports.html"
    if (Test-Path $sourceLanding) {
        $landing = Get-Content $sourceLanding -Raw
        $matches = [regex]::Matches($landing, 'href="([^"]+?/report\.html)"', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($m in $matches) {
            $href = $m.Groups[1].Value
            if ($href -and -not $href.StartsWith("..") -and -not $href.Contains("://")) {
                if (-not $href.StartsWith("results/")) {
                    $href = ("results/" + $href).Replace("\", "/")
                }
                if (-not $artifacts.Contains($href)) {
                    [void]$artifacts.Add($href)
                }
                Write-Host "[info] best-run report from landing: $href"
                break
            }
        }
    } else {
        Write-Host "[warn] source landing missing: results/reports.html"
    }

    # ── Sync artifacts article from breastmri-site ───────────────────────────
    $breastmriSite = "Z:\src\breastmri-site"
    if (Test-Path $breastmriSite) {
        # Copy images
        $imgSrc = Join-Path $breastmriSite "images\artifacts"
        $imgDst = Join-Path $resolvedRepo "images\artifacts"
        if (Test-Path $imgSrc) {
            if (-not (Test-Path $imgDst)) { New-Item -Path $imgDst -ItemType Directory -Force | Out-Null }
            Copy-Item -Path "$imgSrc\*.png" -Destination $imgDst -Force
            Write-Host "[copy] images/artifacts/ ($(( Get-ChildItem $imgSrc -Filter *.png ).Count) files)"
        }
        # Copy HTML with review gate stripped
        $htmlSrc = Join-Path $breastmriSite "breast-mri-artifacts.html"
        $htmlDst = Join-Path $resolvedRepo "breast-mri-artifacts.html"
        if (Test-Path $htmlSrc) {
            (Get-Content $htmlSrc -Raw) -replace '<script src="review-system\.js"></script>', '' |
                Set-Content $htmlDst -NoNewline
            Write-Host "[copy] breast-mri-artifacts.html (review gate stripped)"
        }
    } else {
        Write-Host "[warn] breastmri-site not found at $breastmriSite, skipping artifacts article sync"
    }
    # ─────────────────────────────────────────────────────────────────────────

    $copied = [System.Collections.Generic.List[string]]::new()
    foreach ($rel in $artifacts) {
        if (Copy-Artifact -RelativePath $rel -SourceBase $resolvedSource -DestBase $resolvedRepo) {
            [void]$copied.Add($rel)
        }
    }

    if ($copied.Count -eq 0) {
        Write-Host "No artifact files were copied."
        exit 0
    }

    & git -c core.filemode=false add -- "images/artifacts/" "breast-mri-artifacts.html" @copied
    if ($LASTEXITCODE -ne 0) {
        throw "git add failed."
    }
    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "No publish artifact changes detected."
        exit 0
    }
    if ($LASTEXITCODE -ne 1) {
        throw "git diff --cached --quiet failed."
    }

    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $CommitMessage = "publish: sync HPC report artifacts ($stamp)"
    }

    Run-Git commit -m $CommitMessage
    Run-Git push origin main
    Write-Host "Publish complete. Cloudflare Pages deploy should trigger from this push."
}
finally {
    Pop-Location
}
