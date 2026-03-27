param(
    [string]$SourceRoot = "Z:\src\michaelzenkay.github.io",
    [string]$DestRoot = $PSScriptRoot,
    [switch]$PreferSource,
    [switch]$SkipGit
)

$ErrorActionPreference = "Stop"

function Get-TrackedArtifactFiles {
    param(
        [string]$Root
    )

    $patterns = @(
        "reports\*.html",
        "results\*.html",
        "results\*\report.html",
        "index.html",
        "breast-mri-artifacts.html",
        "demo.html",
        "mg-risk-demo.html",
        "demo-client.js",
        "_headers",
        "review-system-auth.js"
    )

    $files = New-Object System.Collections.Generic.List[string]
    foreach ($pattern in $patterns) {
        $fullPattern = Join-Path $Root $pattern
        Get-ChildItem -Path $fullPattern -File -ErrorAction SilentlyContinue | ForEach-Object {
            $files.Add($_.FullName)
        }
    }
    return $files | Sort-Object -Unique
}

function Copy-WithFreshnessGuard {
    param(
        [string]$SourceFile,
        [string]$SourceRoot,
        [string]$DestRoot,
        [switch]$PreferSource
    )

    $sourceRootPath = (Resolve-Path $SourceRoot).Path.TrimEnd('\')
    $sourceFilePath = (Resolve-Path $SourceFile).Path
    if ($sourceFilePath.StartsWith($sourceRootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        $relative = $sourceFilePath.Substring($sourceRootPath.Length).TrimStart('\')
    } else {
        throw "Source file is not under source root: $SourceFile"
    }
    $destFile = Join-Path $DestRoot $relative
    $sourceInfo = Get-Item $SourceFile

    if (-not (Test-Path $destFile)) {
        New-Item -ItemType Directory -Force -Path (Split-Path $destFile) | Out-Null
        Copy-Item $SourceFile $destFile -Force
        return [pscustomobject]@{ Relative = $relative; Action = "copied"; Reason = "missing" }
    }

    $destInfo = Get-Item $destFile
    $srcTime = $sourceInfo.LastWriteTimeUtc
    $dstTime = $destInfo.LastWriteTimeUtc

    if ($PreferSource) {
        Copy-Item $SourceFile $destFile -Force
        return [pscustomobject]@{ Relative = $relative; Action = "overwrote"; Reason = "prefer-source" }
    }

    if ($srcTime -gt $dstTime) {
        Copy-Item $SourceFile $destFile -Force
        return [pscustomobject]@{ Relative = $relative; Action = "updated"; Reason = "source-newer" }
    }

    if ($srcTime -eq $dstTime) {
        return [pscustomobject]@{ Relative = $relative; Action = "skipped"; Reason = "same-timestamp" }
    }

    return [pscustomobject]@{
        Relative = $relative
        Action = "blocked"
        Reason = "dest-newer"
        SourceTime = $sourceInfo.LastWriteTime
        DestTime = $destInfo.LastWriteTime
    }
}

if (-not (Test-Path $SourceRoot)) {
    throw "Source root not found: $SourceRoot"
}
if (-not (Test-Path $DestRoot)) {
    throw "Destination root not found: $DestRoot"
}

Push-Location $DestRoot
try {
    if (-not $SkipGit) {
        git fetch origin main --prune
        git pull --rebase origin main
    }

    $sourceFiles = Get-TrackedArtifactFiles -Root $SourceRoot
    if (-not $sourceFiles -or $sourceFiles.Count -eq 0) {
        throw "No publishable artifacts found under $SourceRoot"
    }

    $results = foreach ($sourceFile in $sourceFiles) {
        Copy-WithFreshnessGuard -SourceFile $sourceFile -SourceRoot $SourceRoot -DestRoot $DestRoot -PreferSource:$PreferSource
    }

    $blocked = @($results | Where-Object { $_.Action -eq "blocked" })
    if ($blocked.Count -gt 0) {
        Write-Host ""
        Write-Host "Blocked sync: destination has newer artifact(s) than source." -ForegroundColor Yellow
        $blocked | ForEach-Object {
            Write-Host ("  {0}`n    source: {1}`n    dest:   {2}" -f $_.Relative, $_.SourceTime, $_.DestTime) -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "Publish from D directly, or rerun with -PreferSource if you really want Z to win." -ForegroundColor Yellow
        exit 1
    }

    Write-Host ""
    $results | ForEach-Object {
        Write-Host ("{0,-10} {1} ({2})" -f $_.Action, $_.Relative, $_.Reason)
    }

    if (-not $SkipGit) {
        git -c core.filemode=false add reports/ results/ index.html breast-mri-artifacts.html demo.html mg-risk-demo.html demo-client.js _headers review-system-auth.js
        git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Nothing to commit."
            exit 0
        }
        git commit -m "refresh site artifacts"
        git push origin main
    }
}
finally {
    Pop-Location
}
