#!/usr/bin/env bash
# Baixa Archivo + IBM Plex (as fontes da identidade, definidas em src/app/layout.tsx)
# e reescreve o CSS pra apontar pros arquivos locais — o Chromium que renderiza a
# tipografia roda offline, então não dá pra depender do CDN do Google em runtime.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p fonts && cd fonts
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
curl -sf -A "$UA" --max-time 30 \
  "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" \
  -o gf.css
cp gf.css ../onmode-fonts.css
i=0
for u in $(grep -o "https://[^)]*woff2" gf.css | sort -u); do
  i=$((i+1)); n="f${i}.woff2"
  curl -sf "$u" -o "$n" --max-time 30
  python3 -c "
import sys
p='../onmode-fonts.css'
s=open(p,encoding='utf-8').read().replace('$u','fonts/$n')
open(p,'w',encoding='utf-8').write(s)"
done
echo "fontes: $i arquivos em reels-onmode/fonts/, CSS em reels-onmode/onmode-fonts.css"
