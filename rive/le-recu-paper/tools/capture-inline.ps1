# Renders real Rive CLI frames of the inline-ink overlay with MOCK row geometry (grey bars stand in for text).
#   powershell -File tools/capture-inline.ps1 <projectDir> <outDir> <prefix> [viewport e.g. 390x420]
# Evidence class: VISUAL. Real DOM text alignment is proven separately in the browser E2E, not here.
param([Parameter(Mandatory)][string]$Project, [Parameter(Mandatory)][string]$Out, [Parameter(Mandatory)][string]$Prefix, [string]$Viewport = '390x340')
$ErrorActionPreference = 'Continue'
New-Item -ItemType Directory -Force $Out | Out-Null
$rowA = @('--data=a0x=24', '--data=a0y=121', '--data=a0w=2.5', '--data=s1x=300', '--data=s1y=121')
$sameB = @('--data=b0x=24', '--data=b0y=121', '--data=b0w=2.5', '--data=s2x=300', '--data=s2y=121')
$diffB = @('--data=b0x=24', '--data=b0y=263', '--data=b0w=1.75', '--data=s2x=232', '--data=s2y=263', '--data=cx=345', '--data=cy=121', '--data=ch=1.42')
$shots = @(
  @('idle-ghost', @('--data=g0x=24', '--data=g0y=121', '--data=g0w=2.5', '--data=proximity=1'), '30'),
  @('ink-mid', (@('--data=phase=1', '--data=viewerFirst=1') + $rowA), '260ms'),
  @('ink-done', (@('--data=phase=1', '--data=viewerFirst=1') + $rowA), '1500ms'),
  @('pending', (@('--data=phase=2', '--data=viewerFirst=1') + $rowA), '1000ms'),
  @('sealed-hit', (@('--data=phase=3', '--data=viewerFirst=1') + $rowA), '250ms'),
  @('waiting', (@('--data=phase=4', '--data=viewerFirst=1') + $rowA), '1500ms'),
  @('reveal-same-mid', (@('--data=phase=5', '--data=outcome=1', '--data=viewerFirst=1') + $rowA + $sameB), '620ms'),
  @('reveal-same', (@('--data=phase=5', '--data=outcome=1', '--data=viewerFirst=1') + $rowA + $sameB), '2800ms'),
  @('reveal-different', (@('--data=phase=5', '--data=outcome=2', '--data=viewerFirst=1') + $rowA + $diffB), '3200ms'),
  @('guest-pending', (@('--data=phase=2', '--data=viewerFirst=0') + $diffB), '900ms'),
  @('guest-reveal-different', (@('--data=phase=5', '--data=outcome=2', '--data=viewerFirst=0') + $rowA + $diffB), '3400ms'),
  @('failed-owner', (@('--data=phase=6', '--data=viewerFirst=1') + $rowA), '1500ms'),
  @('unavailable', (@('--data=phase=7', '--data=viewerFirst=1') + $rowA + $sameB), '900ms')
)
foreach ($s in $shots) {
  $file = Join-Path $Out "$Prefix-$($s[0]).png"
  $a = @($Project, "--screenshot=$file", "--advance=$($s[2])", "--viewport=$Viewport") + $s[1] + @('--quiet')
  & rive @a *> $null
  if (Test-Path $file) { "ok $($s[0])" } else { "MISSING $($s[0])" }
}
