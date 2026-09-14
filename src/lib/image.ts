/**
 * Compressão de imagem no navegador, antes do upload.
 *
 * Foto de celular hoje sai com 3-6 MB. Subir isso cru significaria pagar
 * Storage por ~20x o necessário e fazer o usuário esperar o upload inteiro
 * no 4G. Redimensionando pra 1440px e convertendo pra WebP, a mesma foto
 * fica em 200-350 KB — sem diferença visível num card de feed que é exibido
 * com no máximo ~400px de largura em tela retina.
 *
 * Feito com <canvas> puro de propósito: nenhuma dependência nova no
 * package.json só pra redimensionar imagem.
 */

/** Maior lado da imagem depois de redimensionar. */
const MAX_EDGE = 1440;

const WEBP_QUALITY = 0.82;
/** Um pouco mais alta porque JPEG a 0.82 marca mais que WebP na mesma nota. */
const JPEG_QUALITY = 0.85;

/** Recusa arquivo absurdo antes mesmo de tentar decodificar. */
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

export type CompressedImage = {
  blob: Blob;
  width: number;
  height: number;
  /** "webp" ou "jpeg" — vira a extensão do arquivo no Storage. */
  extension: "webp" | "jpeg";
  contentType: string;
};

export type CompressResult = { error: string } | { ok: true; image: CompressedImage };

function supportsWebp(canvas: HTMLCanvasElement): boolean {
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Redimensiona e recomprime um arquivo escolhido pelo usuário.
 *
 * `imageOrientation: "from-image"` é o que impede a foto tirada na vertical
 * subir deitada: o sensor do celular grava em paisagem e marca a rotação só
 * no EXIF, que o canvas ignoraria por padrão.
 */
export async function compressImage(file: File): Promise<CompressResult> {
  if (!file.type.startsWith("image/")) {
    return { error: "Só dá pra anexar imagem." };
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { error: "Essa imagem é grande demais. Tenta uma com menos de 25 MB." };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (err) {
    console.error("[compressImage] falhou ao decodificar:", err);
    return { error: "Não consegui ler essa imagem. Tenta outra." };
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return { error: "Não consegui processar a imagem neste navegador." };

    // Fundo branco: PNG com transparência viraria fundo preto ao converter
    // pra JPEG/WebP sem canal alfa.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const webp = supportsWebp(canvas);
    const contentType = webp ? "image/webp" : "image/jpeg";
    const blob = await canvasToBlob(canvas, contentType, webp ? WEBP_QUALITY : JPEG_QUALITY);

    if (!blob) return { error: "Não consegui processar a imagem neste navegador." };

    return {
      ok: true,
      image: { blob, width, height, extension: webp ? "webp" : "jpeg", contentType },
    };
  } finally {
    bitmap.close();
  }
}
