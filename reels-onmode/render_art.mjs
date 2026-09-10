import { chromium } from 'playwright';
import fs from 'fs';

const FPS = 30;
// Deixe CHROME vazio pra usar o Chromium que o Playwright baixou.
const CHROME = process.env.CHROME || '';

// ---------- helpers de markup ----------
const frame = `<div class="frame"></div>
<div class="corner c-tl"></div><div class="corner c-tr"></div>
<div class="corner c-bl"></div><div class="corner c-br"></div>`;

const titleCard = ({ kicker, h1, foot, sub, cls = '' }) => `
<div class="stage solid" id="stage">
  <div class="hatch"></div><div class="glow" data-a data-d="0"></div>
  <div class="pad">
    <div class="kicker" data-a data-d="0.00"><span class="dot"></span>${kicker}</div>
    <div class="rule" data-a data-r data-d="0.10"></div>
    <h1 class="${cls}">${h1.map((l, i) => `<div data-a data-d="${0.16 + i * 0.11}">${l}</div>`).join('')}</h1>
    ${sub ? `<div class="sub" data-a data-d="${0.16 + h1.length * 0.11}">${sub}</div>` : ''}
  </div>
  <div class="foot" data-a data-d="0.5">
    <span class="mono">${foot[0]}</span><span class="mono">${foot[1]}</span>
  </div>
  ${frame}
</div>`;

const overlayCard = ({ kicker, h2, top, lowerDelay = 0, scrimH = 820 }) => `
<div class="stage" id="stage">
  ${h2 ? `<div class="scrim-b" style="height:${scrimH}px" data-a data-d="${Math.max(0, lowerDelay - .12)}" data-fade></div>` : ''}
  ${top ? `<div class="scrim-t" data-a data-d="0" data-fade></div>
  <div class="topbar" data-a data-d="0.08"><span class="mono">${top[0]}</span><span class="mono">${top[1]}</span></div>` : ''}
  ${h2 ? `<div class="lower">
    <div class="kicker" data-a data-d="${lowerDelay + 0.06}"><span class="dot"></span>${kicker}</div>
    <h2>${h2.map((l, i) => `<div data-a data-d="${lowerDelay + 0.18 + i * 0.10}">${l}</div>`).join('')}</h2>
  </div>` : ''}
  ${frame}
</div>`;

// ---------- roteiro ----------
const SCENES = [
  // ---------------- REEL 01 ----------------
  { name: 'r1_hook', dur: 1.9, html: titleCard({
      kicker: 'ONMODE', cls: 'sm',
      h1: ['VOCÊ ESTUDA.', 'VOCÊ TRABALHA.', '<span class="lime">E AINDA TREINA.</span>'],
      foot: ['ALTA PERFORMANCE', '01'] }) },

  { name: 'r1_wide', dur: 1.3, alpha: 1, html: overlayCard({
      top: ['ALTA PERFORMANCE', 'ONMODE'] }) },

  { name: 'r1_ia', dur: 2.2, alpha: 1, html: overlayCard({
      kicker: 'PLANO GERADO POR IA',
      h2: ['O TREINO DE HOJE', 'JÁ VEM <span class="lime">PRONTO</span>.'], scrimH: 700 }) },

  { name: 'r1_registro', dur: 1.8, alpha: 1, html: overlayCard({
      kicker: 'REGISTRO',
      h2: ['VOCÊ SÓ MARCA', 'O QUE <span class="lime">FEZ</span>.'], scrimH: 640 }) },

  { name: 'r1_toque', dur: 1.6, alpha: 1, html: overlayCard({
      kicker: 'SALVAR', h2: ['UM <span class="lime">TOQUE</span>.'], scrimH: 560 }) },

  { name: 'r1_card', dur: 3.3, alpha: 1, html: overlayCard({
      kicker: 'STORIES · FEED',
      h2: ['E JÁ SAI', '<span class="lime">PRONTO PRA POSTAR</span>.'],
      top: ['TREINO REGISTRADO', 'ONMODE'], lowerDelay: 1.9, scrimH: 600 }) },

  // ---------------- REEL 02 ----------------
  { name: 'r2_hook', dur: 1.6, html: titleCard({
      kicker: 'ONMODE', cls: 'xs',
      h1: ['TREINO REGISTRADO', 'EM <span class="lime">10 SEGUNDOS</span>.'],
      foot: ['ALTA PERFORMANCE', '02'] }) },

  { name: 'r2_escolhe', dur: 2.0, alpha: 1, html: overlayCard({
      kicker: 'MODALIDADE · INTENSIDADE · DURAÇÃO',
      h2: ['ESCOLHE.', '<span class="lime">MARCA</span>.'], scrimH: 620 }) },

  { name: 'r2_share', dur: 3.2, alpha: 1, html: overlayCard({
      kicker: 'STORIES · FEED',
      h2: ['SEU TREINO', 'VIRA <span class="lime">STORY</span>.'],
      top: ['TREINO REGISTRADO', 'ONMODE'], lowerDelay: 1.8, scrimH: 600 }) },

  { name: 'frame_only', dur: 0.04, alpha: 1, static: 1, html: `<div class="stage" id="stage">${frame}</div>` },

  // ---------------- comum ----------------
  { name: 'end', dur: 2.8, ease: 0.34, html: `
<div class="stage solid" id="stage">
  <div class="hatch"></div><div class="glow" data-a data-d="0"></div>
  <div class="pad">
    <div class="kicker" data-a data-d="0.00"><span class="dot"></span>ALTA PERFORMANCE</div>
    <h1 data-a data-d="0.06" style="font-size:150px;letter-spacing:-.04em;color:var(--accent)">ONMODE</h1>
    <div class="rule" data-a data-r data-d="0.20"></div>
    <div class="sub" data-a data-d="0.26">Treino, nutrição e recuperação em um só lugar —<br>pensado pra quem também tem aula, reunião e prazo.</div>
  </div>
  <div class="foot" data-a data-d="0.38">
    <span class="mono" style="color:var(--accent)">LINK NA BIO</span><span class="mono">TREINO · DIETA · IA</span>
  </div>
  ${frame}
</div>` },
];

// ---------- animação por frame ----------
const ANIM = `(t, dur, EASE) => {
  const easeOut = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(2, -9 * x);
  const stage = document.getElementById('stage');
  const gp = easeOut(Math.min(t / Math.max(dur, .001), 1));
  stage.style.transform = 'scale(' + (1 + 0.028 * gp) + ')';
  stage.style.transformOrigin = '50% 50%';
  const OUT = 0.30;                                  // fade final
  const outK = t > dur - OUT ? Math.max(0, (dur - t) / OUT) : 1;
  document.querySelectorAll('[data-a]').forEach(el => {
    const d = parseFloat(el.dataset.d || '0');
    const e = easeOut((t - d) / EASE);
    if (el.hasAttribute('data-r')) {                 // régua lima: cresce na horizontal
      el.style.transform = 'scaleX(' + e + ')';
      el.style.transformOrigin = 'left center';
      el.style.opacity = outK;
    } else if (el.classList.contains('glow')) {
      el.style.opacity = outK;
    } else if (el.hasAttribute('data-fade')) {
      el.style.opacity = e * outK;
    } else {                                          // texto: sobe + revela
      el.style.opacity = e * outK;
      el.style.transform = 'translateY(' + ((1 - e) * 52) + 'px)';
      el.style.clipPath = 'inset(0 0 ' + ((1 - e) * 105) + '% 0)';
    }
  });
}`;

// ---------- execução ----------
const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const only = process.argv[2];

for (const sc of SCENES) {
  if (only && !sc.name.startsWith(only)) continue;
  const dir = `overlays/${sc.name}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  await page.goto('file://' + process.cwd() + '/');
  await page.setContent(`<html><head><link rel="stylesheet" href="art.css"></head><body>${sc.html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const n = sc.static ? 1 : Math.round(sc.dur * FPS);
  for (let i = 0; i < n; i++) {
    if (sc.static) { await page.screenshot({ path: `${dir}/f0000.png`, omitBackground: true }); break; }
    await page.evaluate(([fn, t, d, e]) => eval('(' + fn + ')')(t, d, e), [ANIM, i / FPS, sc.dur, sc.ease || 0.62]);
    await page.screenshot({
      path: `${dir}/f${String(i).padStart(4, '0')}.png`,
      omitBackground: !!sc.alpha,
    });
  }
  console.log(`${sc.name}: ${n} frames (${sc.dur}s)${sc.alpha ? ' [alpha]' : ''}`);
}
await browser.close();
