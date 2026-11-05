const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const GitWatcher = require("./git-watcher");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const ENABLE_PROXY = process.env.ENABLE_PROXY === "1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Initialize GitWatcher
const watcher = new GitWatcher(ROOT, (hash) => {
  console.log(`[GIT EVENT] New commit pushed: ${hash.slice(0, 7)}`);
});
watcher.start();

// Dev-only proxy (ENABLE_PROXY=1), with SSRF guards: blocks private/loopback targets and requires http(s) + host with a dot.
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127(\.\d+){0,3}$/,
  /^10(\.\d+){1,3}$/,
  /^192\.168(\.\d+){1,2}$/,
  /^172\.(1[6-9]|2\d|3[01])(\.\d+){1,2}$/,
  /^0\.0\.0\.0$/,
  /^169\.254(\.\d+){1,2}$/,
  /^\[?::1\]?$/,
];

function isAllowedProxyTarget(targetUrl) {
  let u;
  try { u = new URL(targetUrl); } catch (e) { return false; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname;
  if (!host.includes(".")) return false;         // require a dot (no bare intranet names)
  if (PRIVATE_HOST_PATTERNS.some((rx) => rx.test(host))) return false;
  if (host.endsWith(".local") || host.endsWith(".internal")) return false;
  return true;
}

async function handleProxyRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl || !isAllowedProxyTarget(targetUrl)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Proxy target is not allowed." }));
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 5 * 1024 * 1024) req.destroy();   // cap request size
  });
  req.on("end", async () => {
    try {
      const response = await fetch(targetUrl, {
        method: req.method === "GET" || req.method === "HEAD" ? req.method : "POST",
        headers: { "Content-Type": "application/json" },
        body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
      });

      const responseData = await response.text();
      res.writeHead(response.status, { "Content-Type": "application/json" });
      res.end(responseData);
    } catch (e) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Proxy request failed." }));
    }
  });
}

const server = http.createServer((req, res) => {
  // --- SECURITY HEADERS ---
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Content-Security-Policy", "default-src 'self' https://*.puter.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline' https://*.puter.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.puter.com https://*.googleapis.com https://flm.stonech.at https://api.groq.com https://openrouter.ai https://api.openai.com https://api.anthropic.com https://api.mistral.ai https://api.deepseek.com https://api.x.ai https://api.together.xyz https://api.fireworks.ai https://api.perplexity.ai https://api.cohere.com http://localhost:11434 http://localhost:1234 https://api.cerebras.ai https://api.sambanova.ai https://integrate.api.nvidia.com https://api.z.ai https://api.deepinfra.com https://api.novita.ai https://api.hyperbolic.xyz https://api.aimlapi.com https://router.huggingface.co https://gen.pollinations.ai https://omniroute.online;");

  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  
  if (urlPath === "/proxy-api") {
    if (!ENABLE_PROXY) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Not found." }));
    }
    return handleProxyRequest(req, res);
  }

  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Please free it or set PORT env var.`);
    process.exit(1);
  }
  console.error("Server error:", err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Mr.Robot by Tanzir running securely at http://localhost:${PORT}`);
});
