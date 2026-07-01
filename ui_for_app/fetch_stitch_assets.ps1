$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlDir = Join-Path $base "html"
$screenshotDir = Join-Path $base "screenshots"
$manifestPath = Join-Path $base "screens-manifest.json"
$localManifestPath = Join-Path $base "screens-manifest.local.json"

New-Item -ItemType Directory -Force -Path $htmlDir, $screenshotDir | Out-Null

function Get-Slug {
    param([string]$Value)

    $slug = $Value.ToLowerInvariant()
    $slug = $slug -replace "[^a-z0-9]+", "-"
    $slug = $slug.Trim("-")
    if ([string]::IsNullOrWhiteSpace($slug)) {
        return "screen"
    }
    return $slug
}

$screens = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$results = @()

foreach ($screen in $screens) {
    $slug = Get-Slug $screen.title
    $prefix = "{0:D2}_{1}_{2}" -f [int]$screen.index, $slug, $screen.id.Substring(0, 8)
    $htmlExt = if ($screen.htmlMime -eq "image/svg+xml") { "svg" } else { "html" }
    $htmlPath = Join-Path $htmlDir "$prefix.$htmlExt"
    $screenshotPath = Join-Path $screenshotDir "$prefix.png"

    if (-not (Test-Path -LiteralPath $htmlPath)) {
        Invoke-WebRequest -Uri $screen.htmlUrl -OutFile $htmlPath
    }

    if (-not (Test-Path -LiteralPath $screenshotPath)) {
        Invoke-WebRequest -Uri $screen.screenshotUrl -OutFile $screenshotPath
    }

    $results += [pscustomobject]@{
        index = [int]$screen.index
        title = $screen.title
        id = $screen.id
        width = [int]$screen.width
        height = [int]$screen.height
        htmlMime = $screen.htmlMime
        htmlFile = Resolve-Path -LiteralPath $htmlPath | Select-Object -ExpandProperty Path
        screenshotFile = Resolve-Path -LiteralPath $screenshotPath | Select-Object -ExpandProperty Path
        sourceHtmlUrl = $screen.htmlUrl
        sourceScreenshotUrl = $screen.screenshotUrl
    }
}

$results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $localManifestPath -Encoding UTF8

[pscustomobject]@{
    screenCount = $results.Count
    htmlFiles = (Get-ChildItem -LiteralPath $htmlDir -File | Measure-Object).Count
    screenshotFiles = (Get-ChildItem -LiteralPath $screenshotDir -File | Measure-Object).Count
    output = $base
    localManifest = $localManifestPath
} | Format-List
