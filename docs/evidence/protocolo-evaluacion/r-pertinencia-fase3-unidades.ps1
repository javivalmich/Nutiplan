[Console]::OutputEncoding = [Text.Encoding]::UTF8
git log -1 --format=%H
$rxH = '^\s{0,3}#{1,6}(\s|$)'; $rxLi = '^\s*([-*+]|\d+[.)])\s'; $rxF = '^\s*(```|~~~)'; $rxT = '^\s*\|'
function Unidad($arr, $idx) {
  $open = -1
  for ($j = 0; $j -lt $idx; $j++) { if ($arr[$j] -match $rxF) { if ($open -lt 0) { $open = $j } else { $open = -1 } } }
  if ($open -lt 0 -and $arr[$idx] -match $rxF) { $open = $idx }
  if ($open -ge 0) {
    $c = $idx; if ($c -eq $open) { $c++ }
    while ($c -lt $arr.Count -and $arr[$c] -notmatch $rxF) { $c++ }
    if ($c -ge $arr.Count) { $c = $arr.Count - 1 }
    return [pscustomobject]@{ Tipo = 'codigo'; Idx = @($open..$c) }
  }
  if ($arr[$idx] -match $rxT) {
    $h = $idx; while ($h -gt 0 -and $arr[$h-1] -match $rxT) { $h-- }
    return [pscustomobject]@{ Tipo = 'tabla'; Idx = @(@($h, $idx) | Select-Object -Unique) }
  }
  if ($arr[$idx] -match $rxH) { return [pscustomobject]@{ Tipo = 'encabezado'; Idx = @($idx) } }
  $s = $idx
  while ($arr[$s] -notmatch $rxLi -and $s -gt 0) {
    $p = $arr[$s-1]
    if ($p.Trim() -eq '' -or $p -match $rxH -or $p -match $rxF -or $p -match $rxT) { break }
    $s--
  }
  $e = $idx
  while ($e + 1 -lt $arr.Count) {
    $q = $arr[$e+1]
    if ($q.Trim() -eq '' -or $q -match $rxH -or $q -match $rxF -or $q -match $rxT -or $q -match $rxLi) { break }
    $e++
  }
  return [pscustomobject]@{ Tipo = 'bloque'; Idx = @($s..$e) }
}
function Mostrar($arr, $u, $conTexto) {
  "U {0} [{1}]" -f $u.Tipo, (($u.Idx | ForEach-Object { $_ + 1 }) -join ',')
  if ($conTexto) { foreach ($x in $u.Idx) { "{0}: {1}" -f ($x + 1), $arr[$x] } }
}
$sint = @('# Titulo','','Parrafo uno','sigue parrafo','- item a','  continua a','- item b','','| h1 | h2 |','|---|---|','| x | y |','','```','code','','mas code','```')
foreach ($x in 0,3,5,6,10,13) { Mostrar $sint (Unidad $sint $x) $false }
$doc = @(git show fc1fec8:docs/spec/plan-observable.md)
"total: {0}" -f $doc.Count
$vistos = @{}
foreach ($n in 13,15,31,49,72,88) {
  $u = Unidad $doc ($n - 1)
  $key = $u.Idx -join ','
  "linea {0} -> [{1}]" -f $n, (($u.Idx | ForEach-Object { $_ + 1 }) -join ',')
  if (-not $vistos.ContainsKey($key)) { $vistos[$key] = 1; Mostrar $doc $u $true }
}
"fin"
