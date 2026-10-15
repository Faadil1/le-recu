# Composes captured frames into one labelled contact sheet (System.Drawing).
#   powershell -File tools/contact-sheet.ps1 <dir> <prefix> <out.png> name1,name2,...
param([string]$Dir, [string]$Prefix, [string]$Out, [string]$Names, [int]$Cols = 4)
Add-Type -AssemblyName System.Drawing
$list = $Names -split ','
$w = 360; $h = 240; $pad = 10; $lab = 18
$rows = [math]::Ceiling($list.Count / $Cols)
$bmp = New-Object System.Drawing.Bitmap ($Cols * ($w + $pad) + $pad), ($rows * ($h + $lab + $pad) + $pad)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(28, 22, 18))
$font = New-Object System.Drawing.Font('Consolas', 9)
$brush = [System.Drawing.Brushes]::White
for ($i = 0; $i -lt $list.Count; $i++) {
  $x = $pad + ($i % $Cols) * ($w + $pad); $y = $pad + [math]::Floor($i / $Cols) * ($h + $lab + $pad)
  $img = [System.Drawing.Image]::FromFile((Join-Path $Dir "$Prefix-$($list[$i]).png"))
  $g.DrawImage($img, $x, $y + $lab, $w, $h); $img.Dispose()
  $g.DrawString("$Prefix / $($list[$i])", $font, $brush, $x, $y)
}
$g.Dispose(); $bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose(); "wrote $Out"
