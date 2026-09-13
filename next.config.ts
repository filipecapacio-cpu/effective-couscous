import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // O Leitor de Conversa manda até 4 prints numa Server Action, e o padrão
    // de 1 MB não cobre isso. A tela já reduz cada imagem antes de subir, então
    // 4 MB é folga, não convite pra upload gigante.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
