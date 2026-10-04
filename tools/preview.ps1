# A tiny web server for previewing the site on this computer.
# Run it by double-clicking preview.bat, then open http://localhost:8000
# Press Ctrl+C (or close the window) to stop it.
param([int]$Port = 8000)

$root = (Resolve-Path "$PSScriptRoot\..").Path
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'
  '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.gif' = 'image/gif'
  '.pdf' = 'application/pdf'; '.ico' = 'image/x-icon'; '.txt' = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Previewing the site at http://localhost:$Port/"
Write-Host "Leave this window open while you look at the site. Press Ctrl+C to stop."
if (-not $env:NO_BROWSER) { Start-Process "http://localhost:$Port/" }

try {
  while ($listener.IsListening) {
    # Wait for the next request in small steps so Ctrl+C still works.
    $task = $listener.GetContextAsync()
    while (-not $task.AsyncWaitHandle.WaitOne(250)) { }
    $ctx = $task.Result
    $res = $ctx.Response
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
      if (Test-Path $path -PathType Container) { $path = Join-Path $path 'index.html' }
      if ($path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path $path -PathType Leaf)) {
        $bytes = [IO.File]::ReadAllBytes($path)
        $ext = [IO.Path]::GetExtension($path).ToLower()
        $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-store')
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $res.StatusCode = 404
        $msg = [Text.Encoding]::UTF8.GetBytes("Not found: /$rel")
        $res.OutputStream.Write($msg, 0, $msg.Length)
      }
    } catch {
      $res.StatusCode = 500
    } finally {
      $res.Close()
    }
  }
} finally {
  $listener.Stop()
}
