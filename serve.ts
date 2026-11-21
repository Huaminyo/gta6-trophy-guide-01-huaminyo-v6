// Neon Palms — tiny static server for local development and screenshots.
// Serves the app/ directory on --port (default 8103). No build step, no
// network use: every file comes from disk.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const APP = join(ROOT, "app");
const portArg = process.argv.find((a) => a.startsWith("--port="));
const port = Number(portArg ? portArg.split("=")[1] : 8103);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  let rel = normalize(url.pathname).replace(/^\/+/, "");
  if (rel === "") rel = "index.html";
  const file = join(APP, rel);
  if (!file.startsWith(APP) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Neon Palms serving app/ on http://localhost:${port}/`));
