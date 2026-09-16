[Console]::OutputEncoding = [Text.Encoding]::UTF8
git log -1 --format=%H
$izq = '(?<![\p{L}\p{N}_])'; $der = '(?![\p{L}\p{N}_])'
$pat = [ordered]@{
  'T1' = "(?i)${izq}transformaci[oó]n(es)?$der"
  'T2' = "(?i)${izq}cegad[oa]s?$der"
  'T3' = "(?i)${izq}com[uú]n(es)?$der"
  'T4' = "(?i)${izq}(motores comparados|motor comparado)$der"
  'N1' = "(?i)((?<![\p{L}\p{N}_.\-])protocolo-evaluacion\.md(?![\p{L}\p{N}_\-]|\.[\p{L}\p{N}])|${izq}protocolo de evaluaci[oó]n$der)"
}
foreach ($k in 'T1','T3','N1') { "cp {0}: {1}" -f $k, (($pat[$k].ToCharArray() | Where-Object { [int]$_ -gt 127 } | ForEach-Object { [int]$_ }) -join ',') }
function Escanear($texto, $etiqueta) {
  foreach ($k in $pat.Keys) { $n = [regex]::Matches($texto, $pat[$k]).Count; if ($n) { "{0}: {1} x{2}" -f $etiqueta, $k, $n } }
  $n = [regex]::Matches([regex]::Replace($texto, $pat['N1'], ''), "(?i)${izq}protocolo$der").Count
  if ($n) { "{0}: P0 x{1}" -f $etiqueta, $n }
}
Escanear 'Transformación, cegados; común; motores comparados. Ver docs/spec/protocolo-evaluacion.md y protocolo de evaluación; protocolo.' 'S1'
Escanear 'xprotocolo-evaluacion.md protocolo-evaluacion.md.bak' 'S2'
$lineas = @(git show fc1fec8:docs/spec/plan-observable.md)
"total: {0}" -f $lineas.Count
$it = 0
for ($i = 0; $i -lt $lineas.Count; $i++) { $it++; Escanear $lineas[$i] ($i+1) }
"iteradas: {0}" -f $it
"fin"
