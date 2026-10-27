import type { NextConfig } from "next";

/**
 * Dois modos de publicação:
 *
 * 1. `npm run build` (padrão) → output "standalone": servidor Node com as rotas
 *    /api/* (IA real). Use em Vercel, Render, Railway, Fly.io, Docker etc.
 * 2. `STATIC_EXPORT=1 npm run build:pages` → output "export": arquivos estáticos
 *    em out/, prontos para GitHub Pages. Nesse modo as rotas de API são
 *    temporariamente removidas pelo script e o cliente usa o motor local.
 */
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = staticExport
  ? (process.env.PAGES_BASE_PATH ?? "/redacao").replace(/\/$/, "")
  : "";

// `headers()` não é suportado em exportação estática, então omitimos a chave.
const seguranca = {
  async headers() {
    // Em dev, evitamos X-Frame-Options para permitir a pré-visualização em iframe.
    if (process.env.NODE_ENV === "development") return [];
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

const nextConfig: NextConfig = {
  output: staticExport ? "export" : "standalone",
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
  reactStrictMode: true,
  experimental: {
    serverMinification: true,
  },
  ...(staticExport ? {} : seguranca),
};

export default nextConfig;
