"use client";

import { useRef, useState } from "react";
import type { PostMedia } from "@/lib/social";

/**
 * Carrossel das fotos do post.
 *
 * Scroll horizontal com `scroll-snap` do CSS em vez de uma lib de carrossel:
 * o gesto de arrastar fica sendo o scroll nativo do celular — inércia,
 * borracha no fim da lista e acessibilidade por teclado saem de graça, e
 * não entra dependência nova.
 *
 * Usa <img> e não next/image de propósito: as URLs são links assinados do
 * Supabase Storage, que expiram e trazem um token diferente a cada
 * requisição. O otimizador de imagem da Vercel trataria cada assinatura
 * como uma imagem nova — cache inútil e custo de otimização por
 * visualização. As fotos já sobem comprimidas em WebP (src/lib/image.ts),
 * que é justamente o que o otimizador faria.
 */
export default function PostMediaCarousel({ media, alt }: { media: PostMedia[]; alt: string }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (media.length === 0) return null;

  // Proporção da primeira foto reserva a altura certa antes de a imagem
  // carregar, então o feed não "pula" durante o scroll.
  const first = media[0];
  const ratio = first.width && first.height ? first.width / first.height : 4 / 5;

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActive(Math.min(Math.max(index, 0), media.length - 1));
  }

  return (
    <div className="relative bg-card-2">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ aspectRatio: ratio }}
      >
        {media.map((item, index) => (
          <div key={item.storage_path} className="w-full flex-shrink-0 snap-center">
            {item.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={index === 0 ? alt : ""}
                width={item.width ?? undefined}
                height={item.height ?? undefined}
                // A primeira foto do primeiro post é quase sempre o LCP da
                // tela; o resto só carrega quando chega perto.
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-faint text-xs">
                Imagem indisponível
              </div>
            )}
          </div>
        ))}
      </div>

      {media.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {media.map((item, index) => (
            <span
              key={item.storage_path}
              className={`h-1.5 rounded-full transition-all ${
                index === active ? "w-4 bg-accent" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
