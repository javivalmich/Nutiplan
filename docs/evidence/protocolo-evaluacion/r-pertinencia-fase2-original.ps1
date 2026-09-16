[Console]::OutputEncoding = [Text.Encoding]::UTF8
git log -1 --format=%H
$l = @(git show fc1fec8:docs/spec/plan-observable.md)
"total: {0}" -f $l.Count
$L = '(?<![\p{L}\p{N}_])'; $R = '(?![\p{L}\p{N}_])'
$f = [ordered]@{
  'T1' = "(?i)${L}transformaci[oó]n(es)?$R"
  'T2' = "(?i)${L}cegad[oa]s?$R"
  'T3' = "(?i)${L}com[uú]n(es)?$R"
  'T4' = "(?i)${L}(motores comparados|motor comparado)$R"
  'N1' = "(?i)((?<![\p{L}\p{N}_.\-])protocolo-evaluacion\.md(?![\p{L}\p{N}_\-]|\.[\p{L}\p{N}])|${L}protocolo de evaluaci[oó]n$R)"
}
for ($i = 0; $i -lt $l.Count; $i++) {
  $s = $l[$i]
  foreach ($k in $f.Keys) { $n = [regex]::Matches($s, $f[$k]).Count; if ($n) { "{0}: {1} x{2}" -f ($i+1), $k, $n } }
  $n = [regex]::Matches([regex]::Replace($s, $f['N1'], ''), "(?i)${L}protocolo$R").Count
  if ($n) { "{0}: P0 x{1}" -f ($i+1), $n }
}
"fin"
