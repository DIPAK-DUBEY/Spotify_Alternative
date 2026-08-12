import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../dist/", import.meta.url));
const PORT = Number(process.env.PORT || 4173);

for (const key of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) {
  if (process.env[key]) continue;
  try {
    const raw = await readFile(new URL("../.env", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === key) process.env[key] = m[2].trim();
    }
  } catch {
    /* no .env — fine */
  }
}

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json"
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname.startsWith("/api/")) {
    const mod =
      url.pathname.startsWith("/api/visits")
        ? "../api/visits.mjs"
        : "../api/playlist.mjs";
    const { default: handler } = await import(mod);
    const vercelRes = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) {
        this.headers[k] = v;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      end(payload) {
        res.writeHead(this.statusCode, this.headers);
        res.end(payload);
      }
    };
    const vercelReq = {
      query: Object.fromEntries(url.searchParams),
      method: req.method,
      headers: req.headers
    };
    return handler(vercelReq, vercelRes);
  }

  let path = decodeURIComponent(url.pathname);
  if (path === "/") path = "/index.html";
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end();
  }

  try {
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    try {
      const data = await readFile(join(ROOT, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  }
});

server.listen(PORT, () => {
  console.log(`serving dist/ + /api on http://localhost:${PORT}`);
});
