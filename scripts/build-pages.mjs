#!/usr/bin/env node
/**
 * Build estático para GitHub Pages.
 *
 * O Next.js não permite rotas de API dinâmicas com `output: "export"`.
 * Este script:
 *   1. Move src/app/api para fora da árvore de rotas (backup temporário);
 *   2. Roda `next build` com STATIC_EXPORT=1 (gera out/ com index.html);
 *   3. Restaura as rotas de API em um bloco finally — mesmo se o build falhar;
 *   4. Garante .nojekyll em out/ (o Pages ignora pastas _next sem isso).
 *
 * O app detecta a ausência do servidor e usa o motor local automaticamente.
 */
import { existsSync, mkdirSync, renameSync, copyFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const API_DIR = resolve(ROOT, "src/app/api");
const BACKUP_DIR = resolve(ROOT, ".pages-build-backup/api");
const OUT_DIR = resolve(ROOT, "out");

const basePath = (process.env.PAGES_BASE_PATH ?? "/redacao").replace(/\/$/, "");
const env = {
  ...process.env,
  STATIC_EXPORT: "1",
  PAGES_BASE_PATH: basePath,
  NEXT_PUBLIC_STATIC_MODE: "true",
  NEXT_PUBLIC_BASE_PATH: basePath,
  NEXT_TELEMETRY_DISABLED: "1",
};

function restaurar() {
  if (existsSync(BACKUP_DIR)) {
    mkdirSync(dirname(BACKUP_DIR), { recursive: true });
    renameSync(BACKUP_DIR, API_DIR);
    rmSync(resolve(ROOT, ".pages-build-backup"), { recursive: true, force: true });
    console.info("✓ Rotas /api restauradas.");
  }
}

let codigo = 1;
try {
  // Remove artefatos de um `next dev`/build anterior: validadores gerados em
  // .next/dev/types referenciam as rotas /api que serão movidas abaixo.
  rmSync(resolve(ROOT, ".next"), { recursive: true, force: true });
  rmSync(OUT_DIR, { recursive: true, force: true });

  if (existsSync(API_DIR)) {
    mkdirSync(dirname(BACKUP_DIR), { recursive: true });
    rmSync(BACKUP_DIR, { recursive: true, force: true });
    renameSync(API_DIR, BACKUP_DIR);
    console.info("→ Rotas /api movidas temporariamente (modo estático).");
  }

  const nextBin = resolve(ROOT, "node_modules/.bin/next");
  const resultado = spawnSync(nextBin, ["build"], {
    cwd: ROOT,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  codigo = resultado.status ?? 1;

  if (codigo === 0) {
    mkdirSync(OUT_DIR, { recursive: true });
    const nojekyll = resolve(ROOT, "public/.nojekyll");
    copyFileSync(nojekyll, resolve(OUT_DIR, ".nojekyll"));
    console.info(`✓ Build estático pronto em out/ (basePath: ${basePath || "/"}).`);
  }
} finally {
  restaurar();
}

process.exit(codigo);
