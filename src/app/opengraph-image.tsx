import { ImageResponse } from "next/og";

export const alt = "Onmode — performance que cabe na sua rotina";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#0a0a0a";
const INK = "#fafafa";
const INK_SOFT = "#a3a3a3";
const ACCENT = "#d7ff3e";

/**
 * Preview que aparece quando um link do Onmode é compartilhado no
 * WhatsApp/Instagram/etc (og:image, reaproveitado pro Twitter Card em
 * twitter-image.tsx). Reconstrói a marca (três barras + wordmark, mesma
 * geometria de Logo.tsx) em vez de importar o componente - o renderizador
 * do next/og (Satori) só entende um subconjunto de flexbox/CSS, não JSX de
 * componente React normal.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          padding: "72px 84px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -100,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: ACCENT,
            opacity: 0.16,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 9 }}>
            <div style={{ width: 16, height: 47, background: INK, display: "flex" }} />
            <div style={{ width: 26, height: 72, background: INK, display: "flex" }} />
            <div style={{ width: 39, height: 100, background: ACCENT, display: "flex" }} />
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: INK,
              textTransform: "uppercase",
              letterSpacing: -1,
            }}
          >
            Onmode
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 68,
              fontWeight: 800,
              color: INK,
              textTransform: "uppercase",
              letterSpacing: -1.5,
              lineHeight: 1.05,
            }}
          >
            {/* Duas linhas manuais em vez de deixar o texto quebrar sozinho -
                mais previsível pra imagem de tamanho fixo. Evita a palavra
                "alta": o renderizador (Satori) tem um bug de espaçamento
                bem específico com ela nesse peso/tamanho de fonte - o
                espaço depois some errado e vira um vão gigante, só com
                essa palavra (testado e confirmado isolando o motivo). */}
            <div style={{ display: "flex" }}>Performance que cabe</div>
            <div style={{ display: "flex" }}>na sua rotina.</div>
          </div>
          <div style={{ fontSize: 28, color: INK_SOFT, display: "flex" }}>
            Treino, nutrição e recuperação em um só lugar.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
