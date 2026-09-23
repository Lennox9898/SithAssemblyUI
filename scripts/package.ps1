$ErrorActionPreference = 'Stop'
$projectDirectory = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputDirectory = [IO.Path]::GetFullPath((Join-Path $projectDirectory 'dist'))
$releaseDirectory = Join-Path $projectDirectory 'releases'

Push-Location -LiteralPath $projectDirectory
try {
    & npm.cmd run check
    if ($LASTEXITCODE -ne 0) { throw 'Build or checks failed; no archive created.' }
    New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archivePath = Join-Path $releaseDirectory ('sith-assembly-webhosting-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.zip')
    # Include dot files and use portable ZIP separators even on Windows PowerShell 5.1.
    $zipWriter = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($websiteFile in (Get-ChildItem -LiteralPath $outputDirectory -Recurse -Force -File | Sort-Object FullName)) {
            $entryName = $websiteFile.FullName.Substring($outputDirectory.Length + 1).Replace('\', '/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipWriter, $websiteFile.FullName, $entryName, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally { $zipWriter.Dispose() }
    $archive = [IO.Compression.ZipFile]::OpenRead($archivePath)
    try {
        $entryNames = @($archive.Entries | ForEach-Object { $_.FullName })
        if ($entryNames | Where-Object { $_.Contains('\') }) { throw 'Archive paths must use forward slashes.' }
        if ('index.html' -notin $entryNames -or '.htaccess' -notin $entryNames) { throw 'Archive is missing its root files.' }
    } finally { $archive.Dispose() }
    Write-Host "Upload archive: $archivePath"
    Write-Host 'Extract and upload its contents, including .htaccess, to the domain document root.'
} finally { Pop-Location }
