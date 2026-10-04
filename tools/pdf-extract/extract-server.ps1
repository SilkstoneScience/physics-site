# Serves one PDF to extract.html (pdf.js) and saves the extracted text next to this folder.
# Usage: powershell -File extract-server.ps1 -Pdf "path\to\file.pdf" -Out "path\to\output.txt"
param([string]$Pdf, [string]$Out, [int]$Port = 8010)

$page = Join-Path $PSScriptRoot 'extract.html'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Extractor ready at http://localhost:$Port/"
$done = $false
while (-not $done) {
  $task = $listener.GetContextAsync()
  while (-not $task.AsyncWaitHandle.WaitOne(250)) { }
  $ctx = $task.Result; $req = $ctx.Request; $res = $ctx.Response
  try {
    switch ($req.Url.AbsolutePath) {
      '/' { $b = [IO.File]::ReadAllBytes($page); $res.ContentType = 'text/html; charset=utf-8'; $res.OutputStream.Write($b, 0, $b.Length) }
      '/source.pdf' { $b = [IO.File]::ReadAllBytes($Pdf); $res.ContentType = 'application/pdf'; $res.OutputStream.Write($b, 0, $b.Length) }
      '/save' {
        $reader = New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)
        [IO.File]::WriteAllText($Out, $reader.ReadToEnd(), (New-Object Text.UTF8Encoding($false)))
        Write-Host "Saved $Out"; $done = $true
      }
      default { $res.StatusCode = 404 }
    }
  } finally { $res.Close() }
}
$listener.Stop()
