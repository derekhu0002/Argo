param(
    [string]$PandocPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Add-ZipText {
    param(
        [System.IO.Compression.ZipArchive]$Archive,
        [string]$Path,
        [string]$Content
    )

    $entry = $Archive.CreateEntry($Path)
    $stream = $entry.Open()
    $writer = New-Object System.IO.StreamWriter(
        $stream,
        (New-Object System.Text.UTF8Encoding($false))
    )
    try {
        $writer.Write($Content)
    }
    finally {
        $writer.Dispose()
    }
}

function Add-ZipBytes {
    param(
        [System.IO.Compression.ZipArchive]$Archive,
        [string]$Path,
        [byte[]]$Content
    )

    $entry = $Archive.CreateEntry($Path)
    $stream = $entry.Open()
    try {
        $stream.Write($Content, 0, $Content.Length)
    }
    finally {
        $stream.Dispose()
    }
}

function New-TestDocx {
    param([string]$Path)

    $bodyText = ([char]0x6B63) + ([char]0x6587) + ([char]0x5185) + ([char]0x5BB9)
    $footerText = ([char]0x9875) + ([char]0x811A) + ([char]0x4FDD) +
        ([char]0x7559) + ([char]0x5185) + ([char]0x5BB9)
    $file = [System.IO.File]::Open($Path, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::ReadWrite)
    $archive = New-Object System.IO.Compression.ZipArchive($file, [System.IO.Compression.ZipArchiveMode]::Create)

    try {
        Add-ZipText $archive '[Content_Types].xml' @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>
'@
        Add-ZipText $archive '_rels/.rels' @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@
        Add-ZipText $archive 'word/document.xml' @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <w:p><w:r><w:t>$bodyText</w:t></w:r></w:p>
    <w:p><w:r><w:drawing><wp:inline>
      <wp:extent cx="9525" cy="9525"/>
      <wp:docPr id="1" name="test-image" descr="test-image"/>
      <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic><pic:blipFill><a:blip r:embed="rIdImage1"/></pic:blipFill></pic:pic>
      </a:graphicData></a:graphic>
    </wp:inline></w:drawing></w:r></w:p>
    <w:sectPr><w:footerReference w:type="default" r:id="rIdFooter1"/></w:sectPr>
  </w:body>
</w:document>
"@
        Add-ZipText $archive 'word/_rels/document.xml.rels' @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
  <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>
'@
        Add-ZipText $archive 'word/footer1.xml' @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:r><w:t>$footerText</w:t></w:r></w:p>
</w:ftr>
"@
        $pixel = [Convert]::FromBase64String(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
        )
        Add-ZipBytes $archive 'word/media/image1.png' $pixel
        Add-ZipBytes $archive 'word/media/image2.png' $pixel
    }
    finally {
        $archive.Dispose()
        $file.Dispose()
    }
}

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "Assertion failed: $Message"
    }
}

$skillRoot = Split-Path -Parent $PSScriptRoot
$converter = Join-Path $skillRoot 'scripts/convert-docx-to-markdown.ps1'
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) (
    'docx-md-skill-test-' + [Guid]::NewGuid().ToString('N')
)
New-Item -ItemType Directory -Path $tempRoot | Out-Null

try {
    $unicodeSourceName = ([char]0x542B) + ' ' + ([char]0x7A7A) + '.docx'
    $unicodeOutputName = ([char]0x8F93) + ([char]0x51FA) + ' ' + ([char]0x6587) + '.md'
    $unicodeAssetsName = ([char]0x8F93) + ([char]0x51FA) + ' ' + ([char]0x6587) + '.assets'
    $unicodeDirectoryName = ([char]0x76EE) + ([char]0x5F55) + ' space'
    $bodyText = ([char]0x6B63) + ([char]0x6587) + ([char]0x5185) + ([char]0x5BB9)
    $footerText = ([char]0x9875) + ([char]0x811A) + ([char]0x4FDD) +
        ([char]0x7559) + ([char]0x5185) + ([char]0x5BB9)
    $unicodeDirectory = Join-Path $tempRoot $unicodeDirectoryName
    New-Item -ItemType Directory -Path $unicodeDirectory | Out-Null
    $source = Join-Path $unicodeDirectory $unicodeSourceName
    $output = Join-Path $unicodeDirectory $unicodeOutputName
    New-TestDocx $source

    $arguments = @{
        InputPath = $source
        OutputPath = $output
    }
    if ($PandocPath) {
        $arguments.PandocPath = $PandocPath
    }

    & $converter @arguments
    Assert-True (Test-Path -LiteralPath $output -PathType Leaf) 'Markdown should exist'

    $assets = Join-Path $unicodeDirectory $unicodeAssetsName
    $media = @(Get-ChildItem -LiteralPath (Join-Path $assets 'media') -File)
    Assert-True ($media.Count -eq 2) 'all source media, including unreferenced media, should be preserved'

    $markdown = [System.IO.File]::ReadAllText($output)
    Assert-True ($markdown.Contains($bodyText)) 'body text should be present'
    Assert-True ($markdown.Contains($footerText)) 'footer text should be appended'

    $reportPath = Join-Path $assets 'conversion-report.json'
    Assert-True (Test-Path -LiteralPath $reportPath -PathType Leaf) 'conversion report should exist'
    $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
    Assert-True ($report.sourceMediaCount -eq 2) 'report should inventory all source media'
    Assert-True ($report.exportedMediaCount -eq 2) 'report should count all exported media'
    Assert-True ($report.missingImageReferences.Count -eq 0) 'all Markdown image references should resolve'
    Assert-True ($report.mediaHashMismatches.Count -eq 0) 'exported media hashes should match source media'
    Assert-True ($report.mediaHashes.Count -eq 2) 'report should include one hash record per source media item'
    Assert-True (
        Test-Path -LiteralPath (Join-Path (Join-Path $assets 'source') $unicodeSourceName) -PathType Leaf
    ) 'original DOCX should be retained'

    $collisionFailed = $false
    try {
        & $converter @arguments
    }
    catch {
        $collisionFailed = $true
    }
    Assert-True $collisionFailed 'existing outputs should not be overwritten without -Force'

    $arguments.Force = $true
    & $converter @arguments
    Assert-True (Test-Path -LiteralPath $output -PathType Leaf) '-Force should replace a complete output pair'
    Assert-True (Test-Path -LiteralPath $assets -PathType Container) '-Force should publish replacement assets'

    Write-Output 'PASS: DOCX-to-Markdown conversion skill tests'
}
finally {
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}
