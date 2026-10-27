import type { MetadataRoute } from "next";

// Necessário para `output: "export"` (GitHub Pages).
export const dynamic = "force-static";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Redação Nota Máxima AI",
    short_name: "Redação AI",
    description:
      "Planejamento guiado, biblioteca de redações e revisão de textos ENEM.",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    lang: "pt-BR",
    icons: [
      { src: `${basePath}/logo.svg`, sizes: "any", type: "image/svg+xml" },
    ],
  };
}
