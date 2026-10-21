// Tailwind CSS 4 — configuração mínima.
// Toda a customização de tema (cores, fontes, radii) vive em src/app/globals.css
// via @theme inline, que é o padrão recomendado para v4.
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
