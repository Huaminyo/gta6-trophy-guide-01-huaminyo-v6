// Neon Palms — build the entry output. Copies app/ and screenshots/ into
// the output directory (default ./out, or the first argument) and writes
// dossier.json there with the vendor dossier function. Run twice and the
// dossier bytes are identical: buildDossier reads files only, no network,
// no timestamps.
import { buildDossier } from "./vendor/makefun-frontend.ts";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(ROOT, "out");

// Fail fast with a clear message when the screenshots are missing: without
// them buildDossier throws a bare DossierError that says nothing about
// which step was skipped.
const shotsDir = join(ROOT, "screenshots");
if (!existsSync(shotsDir) || readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).length === 0) {
  console.error("no screenshots found: run tools/shots.py first (node serve.ts, then python3 tools/shots.py)");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(ROOT, "app"), join(out, "app"), { recursive: true });
cpSync(join(ROOT, "screenshots"), join(out, "screenshots"), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(out, "dossier.json"), dossier);
const parsed = JSON.parse(new TextDecoder().decode(dossier)) as {
  schema: string; text: string; images: unknown[]; cover: number;
};
console.log(`dossier.json: ${dossier.length} bytes written to ${out}`);
console.log(`  schema ${parsed.schema}, text ${parsed.text.length} bytes, ${parsed.images.length} images, cover #${parsed.cover}`);
