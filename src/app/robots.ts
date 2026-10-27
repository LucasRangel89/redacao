import type { MetadataRoute } from "next";

// Necessário para `output: "export"` (GitHub Pages).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://redacao-nota-maxima.app";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site}${basePath}/sitemap.xml`,
  };
}
