#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Onmode — pipeline dos reels cinematográficos
#
#   SRC_A=/caminho/gravacao-plano.mp4 SRC_B=/caminho/gravacao-registro.mp4 ./build.sh
#
# Gera out/onmode-reel-01.mp4 (16s) e out/onmode-reel-02.mp4 (12s), 1080x1920,
# 30fps, H.264 High + faixa de áudio muda (a trilha entra no app do Instagram).
#
# Etapas: planos (recorte + grade) -> composição com a arte -> montagem final.
# Os timecodes abaixo são das gravações originais; ver README.md.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

: "${SRC_A:?defina SRC_A = gravação da tela 'Seu plano do dia'}"
: "${SRC_B:?defina SRC_B = gravação do registro de treino}"
FF="${FF:-ffmpeg}"
command -v "$FF" >/dev/null || { echo "ffmpeg não encontrado (defina FF=/caminho/ffmpeg)"; exit 1; }

mkdir -p still shots clips out

# --- grade cinematográfico onmode -------------------------------------------
# Tudo em RGB (gbrp): o blend do bloom em YUV corrompe o croma e joga um
# magenta nos brancos da UI.
GRADE="format=gbrp,eq=contrast=1.10:saturation=1.12:brightness=-0.006,curves=m='0/0 0.22/0.17 0.78/0.83 1/1',colorbalance=rs=-0.015:bs=0.02:gh=0.02:bh=-0.03"
BLOOM="format=gbrp,split[ba][bb];[bb]gblur=sigma=18[bbl];[ba][bbl]blend=all_mode=screen:all_opacity=0.10"
FINISH="noise=alls=5:allf=t+u,vignette=PI/5,format=yuv420p"
TEX="format=gbrp,noise=alls=5:allf=t+u,vignette=PI/5,format=yuv420p"
ENC="-c:v libx264 -crf 15 -preset medium -pix_fmt yuv420p -r 30 -video_track_timescale 30000"

# A barra de status do iOS (relógio + pílula vermelha de gravação) fica nos
# primeiros 160px; todo recorte começa abaixo disso.
STATUS_BAR=160

# --- funções de plano --------------------------------------------------------
# hero: tela cheia (recorte 1170x2080 -> 1080x1920) com push-in suave
hero () { # <still> <cx> <cy> <cw> <ch> <dur> <z0> <z1> <out> [filtro extra]
  local st=$1 cx=$2 cy=$3 cw=$4 ch=$5 dur=$6 z0=$7 z1=$8 out=$9 extra=${10:-}
  local nf; nf=$(python3 -c "print(int($dur*30))")
  "$FF" -y -framerate 30 -loop 1 -t "$dur" -i "$st" -filter_complex \
"[0:v]crop=$cw:$ch:$cx:$cy,scale=2160:3840:flags=lanczos,\
zoompan=z='$z0+($z1-$z0)*on/$nf':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,\
$GRADE,$BLOOM,$FINISH${extra:+,$extra}[v]" -map "[v]" $ENC -t "$dur" "$out" -loglevel error
  echo "  plano $(basename "$out")"
}
# motion: trecho real de vídeo em tela cheia (com rampa de velocidade)
motion () { # <src> <ss> <dur_fonte> <cx> <cy> <cw> <ch> <vel> <out>
  local src=$1 ss=$2 sd=$3 cx=$4 cy=$5 cw=$6 ch=$7 sp=$8 out=$9
  local pts; pts=$(python3 -c "print(round(1/$sp,5))")
  "$FF" -y -ss "$ss" -t "$sd" -i "$src" -filter_complex \
"[0:v]crop=$cw:$ch:$cx:$cy,scale=1080:1920:flags=lanczos,setpts=$pts*PTS,fps=30,\
$GRADE,$BLOOM,$FINISH[v]" -map "[v]" $ENC "$out" -loglevel error
  echo "  plano $(basename "$out")"
}
# insert: recorte fechado, emoldurado sobre preto com fio lima (plano de detalhe)
insert () { # <src> <ss> <dur_fonte> <cx> <cy> <cw> <ch> <vel> <boxw> <bx> <by> <out>
  local src=$1 ss=$2 sd=$3 cx=$4 cy=$5 cw=$6 ch=$7 sp=$8 bw=$9 bx=${10} by=${11} out=${12}
  local pts bh; pts=$(python3 -c "print(round(1/$sp,5))")
  bh=$(python3 -c "print(int(round($bw*$ch/$cw/2))*2)")
  "$FF" -y -f lavfi -t 30 -i "color=c=0x0a0a0a:s=1080x1920:r=30" -ss "$ss" -t "$sd" -i "$src" -filter_complex \
"[1:v]crop=$cw:$ch:$cx:$cy,scale=$bw:$bh:flags=lanczos,setpts=$pts*PTS,fps=30,$GRADE[fg];\
[0:v][fg]overlay=$bx:$by:shortest=1,\
drawbox=x=$((bx-2)):y=$((by-2)):w=$((bw+4)):h=$((bh+4)):color=0xd7ff3e@0.55:t=2,\
$BLOOM,$FINISH[v]" -map "[v]" $ENC "$out" -loglevel error
  echo "  plano $(basename "$out") moldura=${bw}x${bh}"
}
insert_still () { # <still> <cx> <cy> <cw> <ch> <dur> <boxw> <bx> <by> <z0> <z1> <out>
  local st=$1 cx=$2 cy=$3 cw=$4 ch=$5 dur=$6 bw=$7 bx=$8 by=$9 z0=${10} z1=${11} out=${12}
  local bh nf; bh=$(python3 -c "print(int(round($bw*$ch/$cw/2))*2)"); nf=$(python3 -c "print(int($dur*30))")
  "$FF" -y -f lavfi -t "$dur" -i "color=c=0x0a0a0a:s=1080x1920:r=30" -framerate 30 -loop 1 -t "$dur" -i "$st" -filter_complex \
"[1:v]crop=$cw:$ch:$cx:$cy,scale=$((bw*2)):$((bh*2)):flags=lanczos,\
zoompan=z='$z0+($z1-$z0)*on/$nf':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${bw}x${bh}:fps=30,$GRADE[fg];\
[0:v][fg]overlay=$bx:$by:shortest=1,\
drawbox=x=$((bx-2)):y=$((by-2)):w=$((bw+4)):h=$((bh+4)):color=0xd7ff3e@0.5:t=2,\
$BLOOM,$FINISH[v]" -map "[v]" $ENC -t "$dur" "$out" -loglevel error
  echo "  plano $(basename "$out") moldura=${bw}x${bh}"
}

# --- composição --------------------------------------------------------------
title () { "$FF" -y -framerate 30 -i "overlays/$1/f%04d.png" -vf "$TEX" $ENC "clips/$2.mp4" -loglevel error; echo "  arte $2"; }
comp () { # <plano> <overlay animado> <saída>
  "$FF" -y -i "shots/$1.mp4" -framerate 30 -i "overlays/$2/f%04d.png" \
    -filter_complex "[0:v][1:v]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]" \
    -map "[v]" $ENC "clips/$3.mp4" -loglevel error; echo "  comp $3"; }
comp_static () { # <plano> <overlay de 1 quadro> <saída>
  "$FF" -y -i "shots/$1.mp4" -framerate 30 -loop 1 -i "overlays/$2/f0000.png" \
    -filter_complex "[0:v][1:v]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]" \
    -map "[v]" $ENC "clips/$3.mp4" -loglevel error; echo "  comp $3"; }

# ===========================================================================
echo "[1/4] quadros-chave das gravações"
"$FF" -y -ss 17.40 -i "$SRC_A" -frames:v 1 still/A_plano.png    -loglevel error  # "Seu plano do dia" estável
"$FF" -y -ss 7.40  -i "$SRC_B" -frames:v 1 still/B_form.png     -loglevel error  # formulário preenchido (7 / 60)
"$FF" -y -ss 9.60  -i "$SRC_B" -frames:v 1 still/B_card.png     -loglevel error  # card "Treino de hoje registrado"

echo "[2/4] tipografia cinética (Chromium)"
[ -f onmode-fonts.css ] || ./fetch-fonts.sh
# package.json local é obrigatório: sem ele o npm sobe a árvore e instala o
# playwright no package.json da raiz do projeto Next.
[ -f package.json ] || echo '{"name":"reels-onmode","private":true,"type":"module"}' > package.json
[ -d node_modules/playwright ] || npm install --silent --no-save playwright
node render_art.mjs

echo "[3/4] planos"
hero        still/A_plano.png 0  $STATUS_BAR 1170 2080 1.3 1.00 1.045 shots/s1_wide.mp4
insert_still still/A_plano.png 55 455 1070 620  2.2 1000 40 470 1.00 1.06 shots/s2_ia.mp4
insert      "$SRC_B" 3.6 2.4 55 295 1070 710 1.35 1000 40 430 shots/s3_reg.mp4
insert_still still/B_form.png  40 850 1090 1010 1.6 1000 40 400 1.00 1.05 shots/s4_toque.mp4
motion      "$SRC_B" 7.60 0.95 0 $STATUS_BAR 1170 2080 0.72 shots/s5_save.mp4
hero        still/B_card.png 0 245 1170 2080 3.3 1.00 1.055 shots/s6_card.mp4 "fade=t=in:st=0:d=0.14:color=0xd7ff3e"
hero        still/B_form.png 0 $STATUS_BAR 1170 2080 1.4 1.00 1.04 shots/s7_form.mp4
insert      "$SRC_B" 3.6 2.7 55 295 1070 710 1.35 1000 40 430 shots/s8_escolhe.mp4
hero        still/B_card.png 0 245 1170 2080 3.2 1.00 1.05 shots/s10_card.mp4 "fade=t=in:st=0:d=0.14:color=0xd7ff3e"

echo "[4/4] composição e montagem"
title       r1_hook              c1_01
comp        s1_wide    r1_wide      c1_02
comp        s2_ia      r1_ia        c1_03
comp        s3_reg     r1_registro  c1_04
comp        s4_toque   r1_toque     c1_05
comp_static s5_save    frame_only   c1_06
comp        s6_card    r1_card      c1_07
title       end                  c1_08
title       r2_hook              c2_01
comp_static s7_form    frame_only   c2_02
comp        s8_escolhe r2_escolhe   c2_03
comp_static s5_save    frame_only   c2_04
comp        s10_card   r2_share     c2_05
cp clips/c1_08.mp4 clips/c2_06.mp4

: > list1.txt; for c in c1_01 c1_02 c1_03 c1_04 c1_05 c1_06 c1_07 c1_08; do echo "file 'clips/$c.mp4'" >> list1.txt; done
: > list2.txt; for c in c2_01 c2_02 c2_03 c2_04 c2_05 c2_06; do echo "file 'clips/$c.mp4'" >> list2.txt; done
for n in 1 2; do
  "$FF" -y -f concat -safe 0 -i "list$n.txt" -c copy "joined$n.mp4" -loglevel error
  # ffmpeg -i sem arquivo de saída termina com código 1; sem o || true o
  # pipefail derruba o script na hora de medir a duração.
  D=$({ "$FF" -i "joined$n.mp4" 2>&1 || true; } | grep Duration | sed 's/.*Duration: //;s/,.*//' | awk -F: '{print $1*3600+$2*60+$3}')
  FO=$(python3 -c "print(round($D-0.45,2))")
  # faixa de áudio muda: o Instagram aceita, e a trilha entra por cima no app
  "$FF" -y -i "joined$n.mp4" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
    -vf "fade=t=in:st=0:d=0.35,fade=t=out:st=$FO:d=0.45" \
    -c:v libx264 -crf 18 -preset slow -profile:v high -level 4.0 -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 128k -shortest -movflags +faststart "out/onmode-reel-0$n.mp4" -loglevel error
  echo "  out/onmode-reel-0$n.mp4  ${D}s"
done
echo "pronto."
