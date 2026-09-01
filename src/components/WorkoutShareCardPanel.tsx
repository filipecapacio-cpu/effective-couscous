"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import WorkoutShareCard from "@/components/WorkoutShareCard";
import { DownloadIcon, ShareIcon } from "@/components/icons";
import type { IntensityLabel, WorkoutModality } from "@/lib/workoutLog";

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function todayLabel() {
  return DATE_FMT.format(new Date()).replace(".", "").toUpperCase();
}

export default function WorkoutShareCardPanel({
  modality,
  durationMin,
  intensityLabel,
  intensityScore,
}: {
  modality: Exclude<WorkoutModality, "Descanso">;
  durationMin: number | null;
  intensityLabel: IntensityLabel | null;
  intensityScore: number | null;
}) {
  const [format, setFormat] = useState<"story" | "square">("story");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function renderPng(): Promise<string | null> {
    if (!cardRef.current) return null;
    // espera as fontes carregarem de verdade antes de capturar, senão o
    // texto pode sair com a fonte de fallback no primeiro clique.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      await document.fonts.ready;
    }
    return toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
  }

  async function handleShare() {
    setBusy(true);
    setError(false);
    try {
      const dataUrl = await renderPng();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "onmode-treino.png", { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Onmode" });
          return;
        } catch {
          // usuário cancelou o compartilhamento - sem problema, não é erro.
          return;
        }
      }
      downloadDataUrl(dataUrl);
    } catch (err) {
      console.error("[WorkoutShareCardPanel] falhou ao gerar/compartilhar a imagem:", err);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true);
    setError(false);
    try {
      const dataUrl = await renderPng();
      if (!dataUrl) return;
      downloadDataUrl(dataUrl);
    } catch (err) {
      console.error("[WorkoutShareCardPanel] falhou ao gerar a imagem:", err);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function downloadDataUrl(dataUrl: string) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "onmode-treino.png";
    link.click();
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="flex border border-line rounded overflow-hidden">
        {([
          { key: "story", label: "Stories" },
          { key: "square", label: "Feed" },
        ] as const).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFormat(f.key)}
            className={`px-4 h-8 font-mono text-[11px] tracking-[0.08em] uppercase ${
              format === f.key ? "bg-card-2 text-ink" : "text-ink-faint"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="max-w-full overflow-x-auto rounded-lg">
        <WorkoutShareCard
          ref={cardRef}
          modality={modality}
          durationMin={durationMin}
          intensityLabel={intensityLabel}
          intensityScore={intensityScore}
          dateLabel={todayLabel()}
          format={format}
        />
      </div>

      {error && <p className="text-sm text-ink-soft">Não deu pra gerar a imagem agora. Tenta de novo.</p>}

      <div className="w-full flex gap-2.5">
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="flex-1 h-13 rounded bg-accent text-accent-ink flex items-center justify-center gap-2.5 font-semibold text-[15px] disabled:opacity-40"
        >
          <ShareIcon size={17} />
          {busy ? "Gerando…" : "Compartilhar"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          aria-label="Baixar imagem"
          className="w-13 h-13 rounded border border-line-strong flex items-center justify-center flex-shrink-0 disabled:opacity-40"
        >
          <DownloadIcon size={18} />
        </button>
      </div>
    </div>
  );
}
