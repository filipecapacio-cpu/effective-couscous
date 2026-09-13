"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { analisarConversa } from "@/app/actions/leitorConversa";
import {
  ENGAJAMENTO_LABEL,
  MAIOR_LADO_PX,
  MAX_BYTES_POR_PRINT,
  MAX_PRINTS,
  TIPOS_ACEITOS,
} from "@/lib/leitor-conversa";
import type { Analise } from "@/lib/leitor-conversa-ia";

type Print = { id: string; arquivo: File; url: string };

const ACEITOS = TIPOS_ACEITOS.join(",");

/**
 * Encolhe o print antes de subir. O teto é o mesmo que a API aplicaria
 * sozinha, então não se perde nada do que o modelo lê - só upload e tempo de
 * espera. Qualquer falha aqui (navegador antigo, canvas bloqueado) cai de
 * volta no arquivo original em vez de travar o envio.
 */
async function encolher(arquivo: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return arquivo;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(arquivo);
  } catch {
    return arquivo;
  }

  try {
    const maiorLado = Math.max(bitmap.width, bitmap.height);
    if (maiorLado <= MAIOR_LADO_PX && arquivo.size <= 900_000) return arquivo;

    const escala = Math.min(1, MAIOR_LADO_PX / maiorLado);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);

    const ctx = canvas.getContext("2d");
    if (!ctx) return arquivo;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    if (!blob || blob.size >= arquivo.size) return arquivo;

    return new File([blob], `${arquivo.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return arquivo;
  } finally {
    bitmap.close();
  }
}

export default function LeitorConversaClient({ iaConfigurada }: { iaConfigurada: boolean }) {
  const [prints, setPrints] = useState<Print[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [pendente, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Os object URLs das previews vivem enquanto o print está na tela; o ref
  // segue o estado atual pra dar pra liberar todos ao desmontar.
  const printsRef = useRef<Print[]>([]);
  useEffect(() => {
    printsRef.current = prints;
  }, [prints]);
  useEffect(() => () => printsRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function adicionar(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    setErro(null);

    const novos: Print[] = [];
    for (const arquivo of Array.from(lista)) {
      if (!(TIPOS_ACEITOS as readonly string[]).includes(arquivo.type)) {
        setErro("Só dá pra ler imagem: PNG, JPG, WEBP ou GIF.");
        continue;
      }
      if (arquivo.size > MAX_BYTES_POR_PRINT) {
        setErro(`"${arquivo.name}" passa de 5 MB.`);
        continue;
      }
      novos.push({
        id: `${arquivo.name}-${arquivo.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        arquivo,
        url: URL.createObjectURL(arquivo),
      });
    }

    setPrints((atuais) => {
      const espaco = MAX_PRINTS - atuais.length;
      if (novos.length > espaco) {
        setErro(`Dá pra analisar até ${MAX_PRINTS} prints de uma vez.`);
        novos.slice(espaco).forEach((p) => URL.revokeObjectURL(p.url));
      }
      return [...atuais, ...novos.slice(0, espaco)];
    });
  }

  function remover(id: string) {
    setPrints((atuais) => {
      const alvo = atuais.find((p) => p.id === id);
      if (alvo) URL.revokeObjectURL(alvo.url);
      return atuais.filter((p) => p.id !== id);
    });
  }

  function analisar() {
    if (prints.length === 0 || pendente) return;
    setErro(null);
    setAnalise(null);

    startTransition(async () => {
      const formData = new FormData();
      for (const print of prints) {
        formData.append("prints", await encolher(print.arquivo));
      }

      const resultado = await analisarConversa(formData);
      if ("error" in resultado) {
        setErro(resultado.error);
        return;
      }
      setAnalise(resultado.analise);
    });
  }

  if (!iaConfigurada) {
    return (
      <p className="rounded border border-line bg-card p-5 text-[15px] text-ink-soft">
        O Leitor de Conversa ainda não foi configurado nesta instalação — falta a chave da
        API da Anthropic.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          adicionar(e.dataTransfer.files);
        }}
        className={`rounded border border-dashed p-6 text-center transition-colors ${
          arrastando ? "border-accent bg-card-2" : "border-line-strong bg-card"
        }`}
      >
        <p className="text-[15px] font-medium">Solte os prints aqui</p>
        <p className="mt-1 text-sm text-ink-soft">
          ou{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="underline underline-offset-4 hover:text-ink"
          >
            escolha do seu celular
          </button>
          {" "}— até {MAX_PRINTS}, na ordem da conversa.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACEITOS}
          multiple
          className="hidden"
          onChange={(e) => {
            adicionar(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {prints.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {prints.map((print, indice) => (
            <figure key={print.id} className="relative overflow-hidden rounded border border-line bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview de blob local: next/image não otimiza object URL */}
              <img src={print.url} alt={`Print ${indice + 1}`} className="h-40 w-full bg-card-2 object-contain" />
              <figcaption className="absolute left-2 top-2 rounded bg-paper/80 px-1.5 py-0.5 font-mono text-[11px]">
                {indice + 1}
              </figcaption>
              <button
                type="button"
                onClick={() => remover(print.id)}
                aria-label={`Remover print ${indice + 1}`}
                className="absolute right-2 top-2 h-7 w-7 rounded bg-paper/80 text-sm hover:bg-paper"
              >
                ✕
              </button>
            </figure>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={analisar}
        disabled={prints.length === 0 || pendente}
        className="h-12 rounded bg-ink px-7 font-semibold text-[15px] text-paper transition-colors enabled:hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pendente ? "Lendo a conversa…" : "Analisar"}
      </button>

      {erro && (
        <p role="alert" className="rounded border border-line bg-card p-4 text-[15px] text-ink-soft">
          {erro}
        </p>
      )}

      {analise && <Resultado analise={analise} />}
    </div>
  );
}

function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded border border-line bg-card p-5">
      <h2 className="font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Resultado({ analise }: { analise: Analise }) {
  if (!analise.conversa_legivel) {
    return (
      <Cartao titulo="Não deu pra ler">
        <p className="text-[15px] leading-relaxed text-ink-soft">
          {analise.aviso || "Não consegui identificar uma conversa nesses prints."}
        </p>
      </Cartao>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Cartao titulo="Como está o clima da conversa">
        <span className="self-start rounded border border-line-strong px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.06em]">
          {ENGAJAMENTO_LABEL[analise.clima.engajamento]}
        </span>
        <p className="text-[15px] leading-relaxed">{analise.clima.resumo}</p>
        <ul className="flex flex-col gap-2 border-t border-line pt-3">
          {analise.clima.sinais.map((sinal) => (
            <li key={sinal.sinal} className="text-[15px] leading-relaxed">
              <span className="font-medium">{sinal.sinal}</span>
              <span className="text-ink-soft"> — {sinal.leitura}</span>
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao titulo="Pontos de atenção">
        <ul className="flex flex-col gap-3">
          {analise.atencao.map((ponto) => (
            <li key={ponto.titulo} className="text-[15px] leading-relaxed">
              <span className="font-medium">{ponto.titulo}</span>
              <p className="text-ink-soft">{ponto.detalhe}</p>
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao titulo="Possíveis direções">
        <ol className="flex flex-col gap-3">
          {analise.direcoes.map((direcao, indice) => (
            <li key={direcao.caminho} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="font-mono text-ink-faint">{indice + 1}</span>
              <div>
                <span className="font-medium">{direcao.caminho}</span>
                <p className="text-ink-soft">{direcao.porque}</p>
              </div>
            </li>
          ))}
        </ol>
      </Cartao>

      {analise.aviso && (
        <p className="text-sm leading-relaxed text-ink-faint">Ressalva: {analise.aviso}</p>
      )}

      <p className="text-sm leading-relaxed text-ink-faint">
        Isso é leitura de padrões num recorte pequeno da conversa, não certeza sobre o que a
        outra pessoa sente. As direções são pra você escrever com as suas palavras.
      </p>
    </div>
  );
}
