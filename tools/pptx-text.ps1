# Pulls the text (and the names of images) from each slide of a PowerPoint file, in slide order.
# Usage: powershell -File tools/pptx-text.ps1 -Pptx "path\to\file.pptx" -Out "path\to\output.txt"
param([string]$Pptx, [string]$Out)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($Pptx)
function Read-Entry($name) {
  $e = $zip.GetEntry($name); if (-not $e) { return '' }
  $r = New-Object IO.StreamReader($e.Open()); $t = $r.ReadToEnd(); $r.Close(); $t
}
$relNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
$pres = [xml](Read-Entry 'ppt/presentation.xml')
$rels = [xml](Read-Entry 'ppt/_rels/presentation.xml.rels')
$lines = New-Object System.Collections.Generic.List[string]
$n = 0
foreach ($sld in $pres.presentation.sldIdLst.sldId) {
  $n++
  $rid = $sld.GetAttribute('id', $relNs)
  $target = ($rels.Relationships.Relationship | Where-Object Id -eq $rid).Target
  $file = [IO.Path]::GetFileName($target)
  $xml = Read-Entry ('ppt/slides/' + $file)
  $srels = Read-Entry ('ppt/slides/_rels/' + $file + '.rels')
  $media = [regex]::Matches($srels, 'Target="\.\./media/([^"]+\.(png|jpe?g|gif|wmf|emf|svg))"') | ForEach-Object { $_.Groups[1].Value }
  # One line per paragraph
  $paras = [regex]::Matches($xml, '<a:p>.*?</a:p>') | ForEach-Object {
    ([regex]::Matches($_.Value, '<a:t>([^<]*)</a:t>') | ForEach-Object { $_.Groups[1].Value }) -join ''
  } | Where-Object { $_.Trim() -and $_ -notmatch '^Topic [A-E]:|^\.\d – |^[A-E]$' }
  $lines.Add("=== SLIDE $n  (images: $($media -join ', '))")
  foreach ($p in $paras) { $lines.Add([Net.WebUtility]::HtmlDecode($p.Trim())) }
}
$zip.Dispose()
[IO.File]::WriteAllLines($Out, $lines, (New-Object Text.UTF8Encoding($false)))
"$n slides -> $Out"
