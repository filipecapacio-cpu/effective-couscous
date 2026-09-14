"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ModalityIcon } from "@/components/social/WorkoutStatRow";
import { CameraIcon, CheckIcon, XIcon } from "@/components/icons";
import { createPost, discardUploadedMedia, type PublishableWorkout } from "@/app/actions/social";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import {
  MAX_CAPTION_LENGTH,
  MAX_POST_MEDIA,
  POST_MEDIA_BUCKET,
  formatWorkoutDate,
} from "@/lib/social";
import type { WorkoutModality } from "@/lib/workoutLog";

type UploadedPhoto = {
  storagePath: string;
  width: number;
  height: number;
  /** URL local (blob:) só pra prévia — nunca vai pro banco. */
  previewUrl: string;
};

/**
 * Publicação de um treino.
 *
 * Ordem do fluxo: escolher o treino -> anexar foto -> legenda -> publicar.
 * As fotos sobem pro Storage assim que são escolhidas (não no envio), pra
 * que o upload aconteça enquanto a pessoa escreve a legenda em vez de
 * virar uma espera no fim.
 *
 * O preço disso é que fechar a tela no meio deixa arquivo órfão no bucket.
 * `discardUploadedMedia` cobre o caso comum (remover uma foto da seleção);
 * o abandono total ainda depende de uma limpeza periódica, que não existe
 * na v1 — está anotado no README.
 */
export default function CreatePostForm({ workouts }: { workouts: PublishableWorkout[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedId, setSelectedId] = useState<string | null>(workouts[0]?.id ?? null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sem isto, cada prévia segura um blob na memória até a aba fechar.
  useEffect(() => {
    return () => {
      for (const photo of photos) URL.revokeObjectURL(photo.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Permite escolher o mesmo arquivo de novo depois de removê-lo.
    event.target.value = "";
    if (files.length === 0) return;

    const room = MAX_POST_MEDIA - photos.length;
    if (room <= 0) {
      setError(`Máximo de ${MAX_POST_MEDIA} fotos por publicação.`);
      return;
    }

    setUploading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      setError("Sessão expirada. Entra de novo.");
      return;
    }

    // Um "grupo" por sessão de envio mantém os arquivos de um mesmo post
    // juntos dentro da pasta do usuário.
    const group = crypto.randomUUID();

    for (const file of files.slice(0, room)) {
      const compressed = await compressImage(file);
      if ("error" in compressed) {
        setError(compressed.error);
        continue;
      }

      const { blob, width, height, extension, contentType } = compressed.image;
      // A primeira pasta ser o uuid do usuário é o que a policy de Storage
      // e a função create_post_with_media conferem.
      const storagePath = `${user.id}/${group}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(POST_MEDIA_BUCKET)
        .upload(storagePath, blob, { contentType, upsert: false });

      if (uploadError) {
        console.error("[CreatePostForm] upload falhou:", uploadError);
        setError("Não consegui enviar essa foto. Tenta de novo.");
        continue;
      }

      setPhotos((current) => [
        ...current,
        { storagePath, width, height, previewUrl: URL.createObjectURL(blob) },
      ]);
    }

    setUploading(false);
  }

  async function removePhoto(storagePath: string) {
    const photo = photos.find((p) => p.storagePath === storagePath);
    setPhotos((current) => current.filter((p) => p.storagePath !== storagePath));
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    // O arquivo já está no bucket — tirar da tela sem apagar deixaria
    // custo de armazenamento por uma foto que ninguém vai ver.
    await discardUploadedMedia([storagePath]);
  }

  async function handlePublish() {
    if (!selectedId || photos.length === 0 || publishing) return;

    setPublishing(true);
    setError(null);

    const result = await createPost(
      selectedId,
      caption,
      photos.map((p) => ({ storage_path: p.storagePath, width: p.width, height: p.height }))
    );

    if ("error" in result) {
      setPublishing(false);
      setError(result.error);
      return;
    }

    router.push("/social");
    router.refresh();
  }

  if (workouts.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 flex flex-col gap-3">
        <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-[24px] leading-[1.15]">
          Nenhum treino pra publicar
        </h2>
        <p className="text-[13px] text-ink-soft leading-relaxed">
          Toda publicação parte de um treino que você já registrou. Registre o treino de hoje na tela
          de Plano — ou todos os seus treinos já viraram publicação.
        </p>
        <a
          href="/plano"
          className="mt-1 bg-accent text-accent-ink rounded-lg py-3.5 text-center font-display font-bold uppercase tracking-[0.01em] text-sm active:bg-accent-press"
        >
          Registrar treino
        </a>
      </div>
    );
  }

  const canPublish = !!selectedId && photos.length > 0 && !uploading && !publishing;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2.5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
          1 · Qual treino
        </h2>
        <div className="flex flex-col gap-2">
          {workouts.map((workout) => {
            const active = workout.id === selectedId;
            return (
              <button
                key={workout.id}
                type="button"
                onClick={() => setSelectedId(workout.id)}
                aria-pressed={active}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left border ${
                  active ? "border-accent bg-card" : "border-line bg-card"
                }`}
              >
                <ModalityIcon
                  modality={workout.modality as WorkoutModality}
                  size={20}
                  className={active ? "text-accent" : "text-ink-faint"}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{workout.modality}</div>
                  <div className="text-[11px] font-mono text-ink-faint">
                    {formatWorkoutDate(workout.date)}
                    {workout.duration_min != null && ` · ${workout.duration_min} min`}
                    {workout.intensity_label && ` · ${workout.intensity_label}`}
                  </div>
                </div>
                {active && <CheckIcon size={16} className="text-accent flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
          2 · Fotos <span className="text-ink-faint">(pelo menos 1)</span>
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.storagePath} className="relative aspect-square rounded-lg overflow-hidden bg-card-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => void removePhoto(photo.storagePath)}
                aria-label="Remover foto"
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-paper/80 flex items-center justify-center"
              >
                <XIcon size={14} />
              </button>
            </div>
          ))}

          {photos.length < MAX_POST_MEDIA && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-lg border border-dashed border-line-strong flex flex-col items-center justify-center gap-1.5 text-ink-faint disabled:opacity-50"
            >
              <CameraIcon size={22} />
              <span className="text-[11px]">{uploading ? "Enviando…" : "Adicionar"}</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
          3 · Legenda <span className="text-ink-faint">(opcional)</span>
        </h2>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={MAX_CAPTION_LENGTH}
          rows={3}
          placeholder="Como foi o treino?"
          className="bg-card rounded-lg px-4 py-3 text-sm resize-none placeholder:text-ink-faint outline-none focus:ring-1 focus:ring-line-strong"
        />
        <span className="self-end font-mono text-[10px] text-ink-faint tabular-nums">
          {caption.length}/{MAX_CAPTION_LENGTH}
        </span>
      </section>

      {error && <p className="text-[13px] text-ink-soft">{error}</p>}

      <button
        type="button"
        onClick={handlePublish}
        disabled={!canPublish}
        className="bg-accent text-accent-ink rounded-lg py-4 font-display font-bold uppercase tracking-[0.01em] text-sm active:bg-accent-press disabled:opacity-40"
      >
        {publishing ? "Publicando…" : "Publicar"}
      </button>
    </div>
  );
}
