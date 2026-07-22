[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [string]$OutputPath,

    [string]$PandocPath,

    [switch]$Force
)

Set-StrictMode -Version 2
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-PandocExecutable {
    param([string]$RequestedPath)

    if ($RequestedPath) {
        $resolved = Resolve-Path -LiteralPath $RequestedPath -ErrorAction Stop
        return $resolved.Path
    }

    $command = Get-Command pandoc -CommandType Application -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $cacheBase = Join-Path $env:LOCALAPPDATA 'ArgoTools/pandoc'
    if (Test-Path -LiteralPath $cacheBase) {
        $integrityFiles = Get-ChildItem -LiteralPath $cacheBase -Filter integrity.json -File -Recurse |
            Sort-Object FullName -Descending
        foreach ($integrityFile in $integrityFiles) {
            try {
                $integrity = [IO.File]::ReadAllText($integrityFile.FullName) | ConvertFrom-Json
                $cachedExecutable = Join-Path $integrityFile.DirectoryName $integrity.executableRelativePath
                if (Test-Path -LiteralPath $cachedExecutable -PathType Leaf) {
                    $cachedHash = (Get-FileHash -LiteralPath $cachedExecutable -Algorithm SHA256).Hash.ToLowerInvariant()
                    if ($cachedHash -eq $integrity.executableSha256) {
                        return $cachedExecutable
                    }
                }
            }
            catch {
                continue
            }
        }
    }

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $headers = @{ 'User-Agent' = 'argo-docx-to-markdown-skill' }
    $release = Invoke-RestMethod `
        -Uri 'https://api.github.com/repos/jgm/pandoc/releases/latest' `
        -Headers $headers
    $asset = $release.assets |
        Where-Object { $_.name -match '^pandoc-.+-windows-x86_64\.zip$' } |
        Select-Object -First 1

    if (-not $asset) {
        throw 'The latest Pandoc release has no Windows x86_64 ZIP asset.'
    }
    if (-not $asset.digest -or $asset.digest -notmatch '^sha256:([0-9a-fA-F]{64})$') {
        throw 'The Pandoc release asset has no verifiable SHA-256 digest.'
    }

    $expectedHash = $Matches[1].ToLowerInvariant()
    $releaseRoot = Join-Path $cacheBase $release.tag_name
    $downloadPath = Join-Path $releaseRoot $asset.name
    New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null

    if (-not (Test-Path -LiteralPath $downloadPath -PathType Leaf)) {
        Invoke-WebRequest `
            -Uri $asset.browser_download_url `
            -Headers $headers `
            -UseBasicParsing `
            -OutFile $downloadPath
    }

    $actualHash = (Get-FileHash -LiteralPath $downloadPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $expectedHash) {
        Remove-Item -LiteralPath $downloadPath -Force -ErrorAction SilentlyContinue
        throw "Pandoc ZIP checksum mismatch. Expected $expectedHash, got $actualHash."
    }

    $extractRoot = Join-Path $releaseRoot 'expanded'
    if (Test-Path -LiteralPath $extractRoot) {
        Remove-Item -LiteralPath $extractRoot -Recurse -Force
    }
    Expand-Archive -LiteralPath $downloadPath -DestinationPath $extractRoot

    $executable = Get-ChildItem -LiteralPath $extractRoot -Filter pandoc.exe -File -Recurse |
        Select-Object -First 1
    if (-not $executable) {
        throw 'pandoc.exe was not found after extracting the verified release asset.'
    }

    $integrity = [ordered]@{
        releaseTag = $release.tag_name
        assetName = $asset.name
        assetSha256 = $actualHash
        executableRelativePath = $executable.FullName.Substring($releaseRoot.Length + 1)
        executableSha256 = (Get-FileHash -LiteralPath $executable.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    [IO.File]::WriteAllText(
        (Join-Path $releaseRoot 'integrity.json'),
        ($integrity | ConvertTo-Json),
        (New-Object Text.UTF8Encoding($false))
    )

    return $executable.FullName
}

function Get-ZipEntrySha256 {
    param([System.IO.Compression.ZipArchiveEntry]$Entry)

    $algorithm = [Security.Cryptography.SHA256]::Create()
    $stream = $Entry.Open()
    try {
        $hash = $algorithm.ComputeHash($stream)
    }
    finally {
        $stream.Dispose()
        $algorithm.Dispose()
    }
    return ([BitConverter]::ToString($hash) -replace '-', '').ToLowerInvariant()
}

function Get-WordPartText {
    param([System.IO.Compression.ZipArchiveEntry]$Entry)

    $reader = New-Object System.IO.StreamReader(
        $Entry.Open(),
        (New-Object System.Text.UTF8Encoding($false)),
        $true
    )
    try {
        $content = $reader.ReadToEnd()
    }
    finally {
        $reader.Dispose()
    }

    $document = New-Object System.Xml.XmlDocument
    $document.XmlResolver = $null
    $document.LoadXml($content)
    $namespaces = New-Object System.Xml.XmlNamespaceManager($document.NameTable)
    $namespaces.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

    $paragraphs = New-Object System.Collections.Generic.List[string]
    foreach ($paragraph in $document.SelectNodes('//w:p', $namespaces)) {
        $text = ($paragraph.SelectNodes('.//w:t', $namespaces) | ForEach-Object { $_.InnerText }) -join ''
        if (-not [string]::IsNullOrWhiteSpace($text)) {
            $paragraphs.Add($text)
        }
    }
    return ($paragraphs -join [Environment]::NewLine)
}

function Resolve-LocalImageReferences {
    param(
        [string]$Markdown,
        [string]$BaseDirectory
    )

    $references = New-Object System.Collections.Generic.List[string]
    $patterns = @(
        '!\[[^\]]*\]\((?:<)?([^>\s\)]+|[^>]+?)(?:>)?\)',
        '(?<!!)\[[^\]]*\]\((?:<)?([^>\s\)]+|[^>]+?)(?:>)?\)',
        '<img\b[^>]*\bsrc=["'']([^"'']+)["'']'
    )
    foreach ($pattern in $patterns) {
        foreach ($match in [regex]::Matches($Markdown, $pattern, 'IgnoreCase')) {
            $references.Add($match.Groups[1].Value.Trim())
        }
    }

    $missing = New-Object System.Collections.Generic.List[string]
    foreach ($reference in $references) {
        if ($reference -match '^(?:https?:|data:|#)') {
            continue
        }
        $decoded = [Uri]::UnescapeDataString($reference)
        $localPath = Join-Path $BaseDirectory ($decoded -replace '/', [IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path -LiteralPath $localPath -PathType Leaf)) {
            $missing.Add($reference)
        }
    }

    return @{
        References = $references.ToArray()
        Missing = $missing.ToArray()
    }
}

$sourcePath = (Resolve-Path -LiteralPath $InputPath -ErrorAction Stop).Path
if ([IO.Path]::GetExtension($sourcePath) -ne '.docx') {
    throw 'InputPath must point to a .docx file.'
}

if (-not $OutputPath) {
    $OutputPath = [IO.Path]::ChangeExtension($sourcePath, '.md')
}
$targetPath = [IO.Path]::GetFullPath($OutputPath)
if ([IO.Path]::GetExtension($targetPath) -ne '.md') {
    throw 'OutputPath must end in .md.'
}

$targetDirectory = Split-Path -Parent $targetPath
if (-not (Test-Path -LiteralPath $targetDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
}

$targetBaseName = [IO.Path]::GetFileNameWithoutExtension($targetPath)
$assetsName = $targetBaseName + '.assets'
$assetsPath = Join-Path $targetDirectory $assetsName
$hasCollision = (Test-Path -LiteralPath $targetPath) -or (Test-Path -LiteralPath $assetsPath)
if ($hasCollision -and -not $Force) {
    throw 'Output Markdown or assets already exist. Use -Force only when replacement is intended.'
}

$pandoc = Get-PandocExecutable $PandocPath
$stageRoot = Join-Path $targetDirectory ('.docx-md-stage-' + [Guid]::NewGuid().ToString('N'))
$stageMarkdown = Join-Path $stageRoot ([IO.Path]::GetFileName($targetPath))
$stageAssets = Join-Path $stageRoot $assetsName
$stageMedia = Join-Path $stageAssets 'media'
$archive = $null

try {
    New-Item -ItemType Directory -Path $stageRoot | Out-Null
    $archive = [IO.Compression.ZipFile]::OpenRead($sourcePath)
    if (-not $archive.GetEntry('[Content_Types].xml') -or -not $archive.GetEntry('word/document.xml')) {
        throw 'Input is not a valid, readable DOCX package.'
    }

    $sourceMedia = @(
        $archive.Entries |
            Where-Object { $_.FullName -like 'word/media/*' -and -not $_.FullName.EndsWith('/') }
    )
    $mediaHashes = New-Object System.Collections.Generic.List[object]
    foreach ($entry in $sourceMedia) {
        $mediaHashes.Add([ordered]@{
            name = ($entry.FullName.Substring('word/media/'.Length) -replace '\\', '/')
            length = $entry.Length
            sourceSha256 = Get-ZipEntrySha256 $entry
            exportedSha256 = $null
        })
    }
    $preservedPartEntries = @(
        $archive.Entries |
            Where-Object {
                $_.FullName -match '^word/(header|footer|comments)[^/]*\.xml$'
            }
    )
    $unsupportedParts = @(
        $archive.Entries |
            Where-Object {
                $_.FullName -match '^(word/(embeddings|charts|diagrams|activeX)/|customXml/)' -or
                    $_.FullName -match '^word/.*\.bin$'
            } |
            ForEach-Object { $_.FullName }
    )

    $pandocOutput = @()
    Push-Location $stageRoot
    try {
        $pandocArguments = @(
            '--from=docx',
            '--to=gfm+raw_html',
            '--wrap=none',
            '--markdown-headings=atx',
            '--track-changes=all',
            "--extract-media=$assetsName",
            "--output=$([IO.Path]::GetFileName($stageMarkdown))",
            $sourcePath
        )
        $pandocOutput = @(& $pandoc @pandocArguments 2>&1 | ForEach-Object { $_.ToString() })
        $pandocExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($pandocExitCode -ne 0) {
        throw "Pandoc failed with exit code $pandocExitCode. $($pandocOutput -join ' ')"
    }
    if (-not (Test-Path -LiteralPath $stageMarkdown -PathType Leaf)) {
        throw 'Pandoc returned success but did not create Markdown output.'
    }

    New-Item -ItemType Directory -Path $stageMedia -Force | Out-Null
    $stageMediaRoot = [IO.Path]::GetFullPath($stageMedia) + [IO.Path]::DirectorySeparatorChar
    foreach ($entry in $sourceMedia) {
        $relativeName = $entry.FullName.Substring('word/media/'.Length)
        $destination = [IO.Path]::GetFullPath((Join-Path $stageMedia $relativeName))
        if (-not $destination.StartsWith($stageMediaRoot, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Unsafe media path in DOCX: $($entry.FullName)"
        }
        $destinationDirectory = Split-Path -Parent $destination
        New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
        [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destination, $true)
    }

    $markdown = [IO.File]::ReadAllText($stageMarkdown)
    $appendix = New-Object System.Text.StringBuilder
    $preservedParts = New-Object System.Collections.Generic.List[object]
    foreach ($entry in $preservedPartEntries) {
        $partText = Get-WordPartText $entry
        if (-not [string]::IsNullOrWhiteSpace($partText)) {
            if ($appendix.Length -eq 0) {
                [void]$appendix.AppendLine()
                [void]$appendix.AppendLine('# Preserved Word headers, footers, and comments')
            }
            [void]$appendix.AppendLine()
            [void]$appendix.AppendLine("## $($entry.FullName)")
            [void]$appendix.AppendLine()
            [void]$appendix.AppendLine($partText)
            $preservedParts.Add([ordered]@{
                part = $entry.FullName
                textCharacters = $partText.Length
            })
        }
    }

    $unreferencedMedia = New-Object System.Collections.Generic.List[string]
    foreach ($entry in $sourceMedia) {
        $name = $entry.FullName.Substring('word/media/'.Length) -replace '\\', '/'
        $relative = "$assetsName/media/$name"
        if ($markdown.IndexOf($relative, [StringComparison]::OrdinalIgnoreCase) -lt 0) {
            $unreferencedMedia.Add($relative)
        }
    }
    if ($unreferencedMedia.Count -gt 0) {
        [void]$appendix.AppendLine()
        [void]$appendix.AppendLine('# Preserved media not referenced by the converted body')
        foreach ($relative in $unreferencedMedia) {
            $extension = [IO.Path]::GetExtension($relative).ToLowerInvariant()
            if ($extension -in @('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp')) {
                [void]$appendix.AppendLine("![](<$relative>)")
            }
            else {
                [void]$appendix.AppendLine("[$([IO.Path]::GetFileName($relative))](<$relative>)")
            }
        }
    }

    if ($appendix.Length -gt 0) {
        $markdown = $markdown.TrimEnd() + [Environment]::NewLine + $appendix.ToString()
        [IO.File]::WriteAllText($stageMarkdown, $markdown, (New-Object Text.UTF8Encoding($false)))
    }

    $sourceCopyDirectory = Join-Path $stageAssets 'source'
    New-Item -ItemType Directory -Path $sourceCopyDirectory -Force | Out-Null
    Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $sourceCopyDirectory ([IO.Path]::GetFileName($sourcePath)))

    $exportedMedia = @(Get-ChildItem -LiteralPath $stageMedia -File -Recurse)
    if ($exportedMedia.Count -ne $sourceMedia.Count) {
        throw "Media verification failed: source=$($sourceMedia.Count), exported=$($exportedMedia.Count)."
    }
    $mediaHashMismatches = New-Object System.Collections.Generic.List[string]
    foreach ($mediaRecord in $mediaHashes) {
        $exportedPath = Join-Path $stageMedia ($mediaRecord.name -replace '/', [IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path -LiteralPath $exportedPath -PathType Leaf)) {
            $mediaHashMismatches.Add($mediaRecord.name)
            continue
        }
        $mediaRecord.exportedSha256 = (Get-FileHash -LiteralPath $exportedPath -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($mediaRecord.exportedSha256 -ne $mediaRecord.sourceSha256) {
            $mediaHashMismatches.Add($mediaRecord.name)
        }
    }
    if ($mediaHashMismatches.Count -gt 0) {
        throw "Media hash verification failed: $($mediaHashMismatches -join ', ')"
    }

    $markdown = [IO.File]::ReadAllText($stageMarkdown)
    $linkCheck = Resolve-LocalImageReferences $markdown $stageRoot
    if ($linkCheck.Missing.Count -gt 0) {
        throw "Missing Markdown image references: $($linkCheck.Missing -join ', ')"
    }

    $pandocVersionOutput = @(& $pandoc --version)
    if ($LASTEXITCODE -ne 0 -or $pandocVersionOutput.Count -eq 0) {
        throw 'Unable to read the Pandoc version.'
    }
    $pandocVersion = $pandocVersionOutput[0].ToString()
    $report = [ordered]@{
        status = 'converted-with-source-preservation'
        inputPath = $sourcePath
        inputSha256 = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
        outputPath = $targetPath
        pandocVersion = $pandocVersion
        sourceMediaCount = $sourceMedia.Count
        exportedMediaCount = $exportedMedia.Count
        imageReferenceCount = $linkCheck.References.Count
        missingImageReferences = $linkCheck.Missing
        mediaHashes = $mediaHashes.ToArray()
        mediaHashMismatches = $mediaHashMismatches.ToArray()
        unreferencedMediaAppended = $unreferencedMedia.ToArray()
        preservedParts = $preservedParts.ToArray()
        unsupportedPackageParts = @($unsupportedParts)
        pandocMessages = @($pandocOutput)
        preservationLimitations = @(
            'Markdown does not preserve exact page layout, styles, fields, or all OOXML semantics.',
            'Header, footer, and comment appendices preserve paragraph text only; formatting and field behavior remain in the retained DOCX.'
        )
        note = 'Markdown cannot represent every DOCX layout feature. The original DOCX is retained under assets/source.'
    }
    $reportJson = $report | ConvertTo-Json -Depth 6
    [IO.File]::WriteAllText(
        (Join-Path $stageAssets 'conversion-report.json'),
        $reportJson,
        (New-Object Text.UTF8Encoding($false))
    )

    $archive.Dispose()
    $archive = $null

    $backupRoot = $null
    try {
        if ($hasCollision) {
            $backupRoot = Join-Path $targetDirectory ('.docx-md-backup-' + [Guid]::NewGuid().ToString('N'))
            New-Item -ItemType Directory -Path $backupRoot | Out-Null
            if (Test-Path -LiteralPath $targetPath) {
                Move-Item -LiteralPath $targetPath -Destination (Join-Path $backupRoot ([IO.Path]::GetFileName($targetPath)))
            }
            if (Test-Path -LiteralPath $assetsPath) {
                Move-Item -LiteralPath $assetsPath -Destination (Join-Path $backupRoot $assetsName)
            }
        }
        Move-Item -LiteralPath $stageMarkdown -Destination $targetPath
        Move-Item -LiteralPath $stageAssets -Destination $assetsPath
    }
    catch {
        Remove-Item -LiteralPath $targetPath -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $assetsPath -Recurse -Force -ErrorAction SilentlyContinue
        if ($backupRoot) {
            $backupMarkdown = Join-Path $backupRoot ([IO.Path]::GetFileName($targetPath))
            $backupAssets = Join-Path $backupRoot $assetsName
            if (Test-Path -LiteralPath $backupMarkdown) {
                Move-Item -LiteralPath $backupMarkdown -Destination $targetPath
            }
            if (Test-Path -LiteralPath $backupAssets) {
                Move-Item -LiteralPath $backupAssets -Destination $assetsPath
            }
        }
        throw
    }
    finally {
        if ($backupRoot -and (Test-Path -LiteralPath $backupRoot)) {
            Remove-Item -LiteralPath $backupRoot -Recurse -Force
        }
    }

    Write-Output "Markdown: $targetPath"
    Write-Output "Assets: $assetsPath"
    Write-Output "Media: $($exportedMedia.Count)/$($sourceMedia.Count)"
}
finally {
    if ($archive) {
        $archive.Dispose()
    }
    if (Test-Path -LiteralPath $stageRoot) {
        Remove-Item -LiteralPath $stageRoot -Recurse -Force
    }
}
