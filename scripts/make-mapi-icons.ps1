# Generate MAPI placeholder app icons by cropping the "M" mark out of the
# wide company logo banner and upscaling it onto square canvases.
# Placeholder only: the source mark is 98x65px, so large sizes are soft.
Add-Type -AssemblyName System.Drawing

$repo   = 'C:\Users\barrya\source\repos\open-PDF-studio'
$srcPng = "$repo\docs\images\MulletsLogoSM.png"
$icons  = "$repo\open-pdf-studio\src-tauri\icons"
$public = "$repo\open-pdf-studio\public"

# Measured bounds of the M mark within the banner.
$cropX = 4; $cropY = 5; $cropW = 98; $cropH = 65

$src = New-Object System.Drawing.Bitmap($srcPng)
$mark = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($mark)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)),
             $cropX, $cropY, $cropW, $cropH, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose(); $src.Dispose()

function New-Icon([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $gr = [System.Drawing.Graphics]::FromImage($bmp)
  $gr.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gr.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $gr.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $gr.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $gr.Clear([System.Drawing.Color]::Transparent)

  # Fit the mark inside ~82% of the canvas, preserving aspect ratio.
  $pad   = [int]($size * 0.09)
  $availW = $size - 2 * $pad
  $availH = $size - 2 * $pad
  $scale = [Math]::Min($availW / $cropW, $availH / $cropH)
  $dw = [int][Math]::Round($cropW * $scale)
  $dh = [int][Math]::Round($cropH * $scale)
  $dx = [int](($size - $dw) / 2)
  $dy = [int](($size - $dh) / 2)
  $gr.DrawImage($mark, $dx, $dy, $dw, $dh)
  $gr.Dispose()
  return $bmp
}

# Vista+ ICO container holding PNG-encoded entries.
function Write-Ico([string]$path, [int[]]$sizes) {
  $pngs = @()
  foreach ($s in $sizes) {
    $b = New-Icon $s
    $ms = New-Object System.IO.MemoryStream
    $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngs += ,@($s, $ms.ToArray())
    $ms.Dispose(); $b.Dispose()
  }
  $fs = [System.IO.File]::Create($path)
  $bw = New-Object System.IO.BinaryWriter($fs)
  $bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$pngs.Count)
  $offset = 6 + 16 * $pngs.Count
  foreach ($e in $pngs) {
    $sz = $e[0]; $data = $e[1]
    $bw.Write([Byte]$(if ($sz -ge 256) { 0 } else { $sz }))
    $bw.Write([Byte]$(if ($sz -ge 256) { 0 } else { $sz }))
    $bw.Write([Byte]0); $bw.Write([Byte]0)
    $bw.Write([UInt16]1); $bw.Write([UInt16]32)
    $bw.Write([UInt32]$data.Length); $bw.Write([UInt32]$offset)
    $offset += $data.Length
  }
  foreach ($e in $pngs) { $bw.Write($e[1]) }
  $bw.Flush(); $bw.Dispose(); $fs.Dispose()
}

function Save-Png([string]$path, [int]$size) {
  $b = New-Icon $size
  $b.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $b.Dispose()
}

# Tauri core icons
Save-Png "$icons\icon.png"        512
Save-Png "$icons\32x32.png"        32
Save-Png "$icons\64x64.png"        64
Save-Png "$icons\128x128.png"     128
Save-Png "$icons\128x128@2x.png"  256

# Windows Store / MSIX tiles
foreach ($s in 30,44,71,89,107,142,150,284,310) { Save-Png "$icons\Square${s}x${s}Logo.png" $s }
Save-Png "$icons\StoreLogo.png" 50

Write-Ico "$icons\icon.ico" @(16,24,32,48,64,128,256)

# Web/public assets used by the About dialog and browser tab
Save-Png "$public\icon.png" 512
Write-Ico "$public\icon.ico"    @(16,24,32,48,64,128,256)
Write-Ico "$public\favicon.ico" @(16,24,32,48,64)

$mark.Dispose()
Write-Output 'Icon set generated.'
