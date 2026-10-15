# Renders real Rive frames (headless CLI) for every phase of a generated project.
#   pwsh tools/capture.ps1 <projectDir> <outDir> [prefix]
# Evidence class: VISUAL (CLI render of the compiled scene), not LIVE.
param([Parameter(Mandatory)][string]$Project, [Parameter(Mandatory)][string]$Out, [string]$Prefix = 'paper')
$ErrorActionPreference = 'Continue'
New-Item -ItemType Directory -Force $Out | Out-Null
# name, data flags, advance
$shots = @(
  @('idle',        @(),                                   '30'),
  @('proximity',   @('--data=proximity=1'),               '30'),
  @('ink-mid',     @('--data=phase=1'),                   '300ms'),
  @('ink-done',    @('--data=phase=1'),                   '1400ms'),
  @('pending',     @('--data=phase=2'),                   '900ms'),
  @('sealed-hit',  @('--data=phase=3'),                   '260ms'),
  @('sealed',      @('--data=phase=3'),                   '1500ms'),
  @('waiting',     @('--data=phase=4'),                   '900ms'),
  @('reveal-same-mid', @('--data=phase=5', '--data=outcome=1'), '420ms'),
  @('reveal-same', @('--data=phase=5', '--data=outcome=1'), '2200ms'),
  @('reveal-different', @('--data=phase=5', '--data=outcome=2'), '2200ms'),
  @('failed-mid',  @('--data=phase=6'),                   '400ms'),
  @('failed',      @('--data=phase=6'),                   '1700ms'),
  @('unavailable', @('--data=phase=7'),                   '1000ms')
)
foreach ($s in $shots) {
  $file = Join-Path $Out "$Prefix-$($s[0]).png"
  $args = @($Project, "--screenshot=$file", "--advance=$($s[2])") + $s[1] + @('--quiet')
  & rive @args *> $null
  if (-not (Test-Path $file)) { Write-Error "no frame for $($s[0])" } else { "ok $($s[0]) $((Get-Item $file).Length)" }
}
