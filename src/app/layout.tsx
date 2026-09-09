import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const TITLE = "Onmode — alta performance que cabe na sua rotina";
const DESCRIPTION =
  "Treino, nutrição e recuperação em um só lugar — pensado pra quem também tem aula, reunião e prazo.";

export const metadata: Metadata = {
  // TODO: trocar pro domínio próprio assim que existir um (ex: onmode.app) -
  // é o que resolve as URLs absolutas de og:image/twitter:image abaixo, e
  // também é o que faz o Google indexar o site de verdade: a Vercel manda
  // "x-robots-tag: noindex" por padrão em qualquer domínio *.vercel.app,
  // header de plataforma que nenhuma configuração de metadata daqui derruba.
  metadataBase: new URL("https://effective-couscous-sand.vercel.app"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Onmode",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
