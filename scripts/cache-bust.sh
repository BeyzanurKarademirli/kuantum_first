#!/usr/bin/env bash
# Yayın klasöründeki CSS/JS adreslerine sürüm etiketi ekler (?v=<commit>).
# Böylece güncellemeden sonra tarayıcı önbellekteki eski dosyayı kullanamaz.
set -euo pipefail
dir="$1"; ver="$2"
sed -i -E "s#(href=\"css/style\.css)\"#\1?v=${ver}\"#; s#(src=\"js/app\.js)\"#\1?v=${ver}\"#" "$dir/index.html"
for f in "$dir"/js/*.js; do
  sed -i -E "s#(from '\./[A-Za-z0-9_-]+\.js)'#\1?v=${ver}'#g" "$f"
done
grep -q "style.css?v=${ver}" "$dir/index.html"
grep -q "app.js?v=${ver}" "$dir/index.html"
