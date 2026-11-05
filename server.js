const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const GitWatcher = require("./git-watcher");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

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

// Secure Proxy for API calls to hide keys from client
async function handleProxyRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const targetUrl = url.searchParams.get("url");
  
  if (!targetUrl) {
    res.writeHead(400);
    return res.end("Missing target URL");
  }

  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", async () => {
    try {
      const requestOptions = {
        method: req.method,
        headers: {
          ...JSON.parse(body || "{}").headers || {}, 
          "Content-Type": "application/json",
        },
      };

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: requestOptions.headers,
        body: req.method !== "GET" ? body : undefined,
      });

      const responseData = await response.text();
      res.writeHead(response.status, { "Content-Type": "application/json" });
      res.end(responseData);
    } catch (e) {
      res.writeHead(500);
      res.end("Proxy Error: " + e.message);
    }
  });
}

const server = http.createServer((req, res) => {
  // --- SECURITY HEADERS ---
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Content-Security-Policy", "default-src 'self' https://*.puter.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline' https://*.puter.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.puter.com https://*.googleapis.com https://flm.stonech.at https://api.groq.com https://openrouter.ai https://api.openai.com https://api.anthropic.com https://api.mistral.ai https://api.deepseek.com https://api.x.ai https://api.together.xyz https://api.fireworks.ai https://api.perplexity.ai https://api.cohere.com http://localhost:11434 http://localhost:1234 https://api.cerebras.ai https://api.sambanova.ai https://integrate.api.nvidia.com https://api.z.ai https://api.deepinfra.com https://api.novita.ai https://api.hyperbolic.xyz https://api.aimlapi.com https://router.huggingface.co https://gen.pollinations.ai https://omniroute.online;");

  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  
  if (urlPath === "/proxy-api") {
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

server.listen(PORT, () => {
  console.log(`Mr.Robot by Tanzir running securely at http://localhost:${PORT}`);
});
