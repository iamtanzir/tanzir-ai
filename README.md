# Mr.Robot by Tanzir

[![Mr.Robot by Tanzir](https://img.shields.io/badge/Mr.Robot%20by%20Tanzir-AI%20Chat%20App-00ff41?style=for-the-badge&logo=github)](https://github.com/iamtanzir/tanzir-ai)

**A multi-provider AI chat web app with a cyberpunk/hacker UI, streaming Markdown replies, local-first chat history, file attachments, voice output, and 27 built-in AI providers — including a zero-setup free default that needs no API key.**

[![Open Live App](https://img.shields.io/badge/Open%20Live%20App-iamtanzir.github.io%2Ftanzir--ai-00d4ff?style=for-the-badge&logo=google-chrome&logoColor=white)](https://iamtanzir.github.io/tanzir-ai/)

> 🇧🇩 সম্পূর্ণ বাংলা সেটআপ গাইড: [`Mr.Robot by Tanzir_Chat_Setup_Guide_Bangla.docx`](./Mr.Robot%20by%20Tanzir_Chat_Setup_Guide_Bangla.docx)

---

## 📌 System Status & Version Metadata

- **Current Stable Version**: `v1.1.1`
- **Release Stage**: Production Ready
- **App Type**: Static web app (HTML/CSS/JS) + optional local Node.js server
- **Database / Storage**: IndexedDB (chat history, local) / Puter KV (signed in)
- **Settings & API keys**: Browser `localStorage`
- **Last Code Sync**: **2026-11-05**
- **Default (no setup)**: **FLM Free** — no API key, no signup
- **Compiled Status**: 🟢 Running & verified locally

---

## ✨ What's inside

- **27 AI providers** in one dropdown — OpenAI-compatible + native Anthropic support.
- **FLM Free default** — open the app and chat; no key, no signup.
- **Streaming replies** with Markdown tables, code blocks, and a typing indicator.
- **Chat history** in IndexedDB (or Puter KV when signed in), isolated per browser + provider + API key.
- **Attachments** — images are downscaled to 1280px, text files are read (first 8,000 characters), Puter files upload to Puter FS.
- **Voice output** — the **Speak** button reads a reply aloud using the browser's speech synthesis.
- **“Learn” corrections** — the **Learn** button stores a correction in IndexedDB and applies recent corrections to future chats.
- **Developer Info panel** — creator details, legal/copyright notice, and a SupportKori “Support Developer” link, reachable from the sidebar.
- **Responsive UI** — desktop, laptop, tablet, mobile; installable as a PWA.
- **Local security headers** — the bundled Node server sends CSP, `X-Frame-Options`, `X-Content-Type-Options`, and `X-XSS-Protection`.
- **GitWatcher** — the local server logs new commit hashes every 10 seconds (optional; needs Git).

### Assistant identity
**Mr.Robotr**.

---

## 🚀 Quick Start (PC)

### Requirements

- **Node.js 18+** (Node.js 20 LTS recommended) — only for the local static server.
- A modern browser and an internet connection.
- Git (optional; you can download the ZIP instead).

### Run

```bash
git clone https://github.com/iamtanzir/tanzir-ai.git
cd tanzir-ai
npm start
```

Open **http://localhost:3000** → the provider is already **FLM Free (no key)** → type a message.

> ✅ **No `npm install` needed to run.** `server.js` uses only Node's built-in modules. Install dependencies only when you want to rebuild the optional Rollup bundle:
>
> ```bash
> npm install
> npm run build
> ```

> ⚠️ Serve over HTTP, not `file://`. The app loads `app.js` and `db.js` as separate scripts, and Puter.js requires an HTTP origin.

### Change the port

```bash
# PowerShell
$env:PORT=3001; npm start

# CMD
set PORT=3001 && npm start

# macOS / Linux
PORT=3001 npm start
```

---

## 🔑 Free AI Setup

### Option 1 — FLM Free (default, no key)

Open the app and chat. Endpoint: `https://flm.stonech.at/v1/chat/completions`, model `auto`, no auth header. Verified limits: 60 requests/minute, 20,000 requests/day, 10M tokens/day, 64k input and 8k output tokens per request. When Max tokens is left at `0`, the app sends `max_tokens: 8192` for FLM so answers are not silently capped at the API's 2048 default.

> ℹ️ This is a public free API endpoint. It is **not** the same product as AMD ROCm's FastFlowLM local runtime, despite the similar name. Availability and speed can vary.

### Option 2 — Puter (free temporary account)

Click **Continue with Puter**. Puter can create a temporary account automatically, so you can use its cloud models without an API key or payment. Signing in also moves chat history to Puter KV.

### Option 3 — Bring your own free API key

1. Go to **https://aistudio.google.com** → **Get API key** (free, no card).
2. In the app, select **Google Gemini (FREE)**.
3. Paste the key → **Save key**.
4. Select **Gemini 2.5 Flash** → chat.

Other free-key providers: **Groq** (`console.groq.com`), **OpenRouter** (`openrouter.ai`, free models), **Pollinations** (`enter.pollinations.ai/keys`), **Cerebras**, **SambaNova**, **NVIDIA NIM**, **Z.ai**, **Hugging Face**, **DeepInfra**, **Novita**, **Hyperbolic**, and **AIML API**.

> Pollinations requires a key in this app. Keyless browser POSTs are blocked by Turnstile (`Missing Turnstile token`).

### Option 4 — OmniRoute Gateway (free, auto-failover)

Select **OmniRoute Gateway (FREE, auto-failover)**. Endpoint: `https://omniroute.online/v1/chat/completions`, model `auto`, no key required. OmniRoute switches to another free model when one hits a rate or token limit.

> Source repos: [OmniRoute Gateway](https://github.com/cheaper-inference/OmniRoute) · [FreeLLM APIs directory](https://github.com/open-free-llm-api/awesome-freellm-apis) (a reference list, not an endpoint)

> ⚠️ **OpenCode Zen** free models (`big-pickle`, `deepseek-v4.1-flash-free`, etc.) only work inside the OpenCode app. They are not usable from this third-party web app, so OpenCode Zen is **not** integrated.

---

## 🖥️ Optional: build the bundle

```bash
npm install
npm run build
```

This writes `dist/app.bundle.js` and copies the app assets into `dist/`. The root `index.html` currently loads the readable `app.js` + `db.js` pair, so the build is optional. If you deploy from `dist/`, make sure `db.js` and the service-worker asset list match the bundle.

---

## 🌐 Deploy

### GitHub Pages (free)

1. Push to `main`.
2. Repository → **Settings → Pages**.
3. **Source**: Deploy from a branch → **main** → **/ (root)**.
4. Open `https://iamtanzir.github.io/tanzir-ai/`.

The repo includes `.nojekyll`, so files are served as-is.

> GitHub Pages serves static files only. The local Node features — security headers, `/proxy-api` (disabled by default; set `ENABLE_PROXY=1` to enable, with private/loopback targets blocked), and GitWatcher — apply only when you run `npm start` on your own machine.

### Any static host

Upload the root files (`index.html`, `app.js`, `db.js`, `styles.css`, `manifest.json`, `sw.js`, and the icons). No build step is required.

---

## 🔐 Security & Privacy

- **API keys stay in your browser** (`localStorage`) and are sent directly to the provider you select. There is no analytics or third-party backend in this repo.
- **Chat history** is stored in IndexedDB on your device, or in your Puter account's KV store when signed in.
- **Markdown output is sanitized** with DOMPurify before rendering.
- **HTTPS** is provided by GitHub Pages in production.
- **Do not expose the local server to the internet.** `server.js` includes an experimental `/proxy-api` endpoint that forwards requests to a URL supplied in the query string. It is **disabled by default**. Set `ENABLE_PROXY=1` to enable it; even then it only allows `http(s)` targets with public-looking hosts and blocks loopback, link-local, and LAN addresses. For local development only.
- On a shared PC, sign out of Puter and clear site data to remove keys and local history.
- If a key leaks, revoke it at the provider's console immediately.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| AI SDK | Puter.js v2 (optional) |
| Markdown | marked.js + DOMPurify |
| Storage | IndexedDB (local) / Puter KV (signed in) |
| Local server | Node.js `http` (zero runtime dependencies) |
| Optional build | Rollup |
| Hosting | GitHub Pages / any static host |

---

## 📄 License

MIT License — free to use, modify, and distribute.

- **Mr.Robot built by Tanzir Ahmed**
- **Optimized for free AI providers**

## Footer

© 2026 Tanzir Ahmed — Mr.Robot by Tanzir

**Powered by Tanzir**

- [Live App](https://iamtanzir.github.io/tanzir-ai/)
- [Repository](https://github.com/iamtanzir/tanzir-ai)
- [Issues](https://github.com/iamtanzir/tanzir-ai/issues)
- [Support the developer](https://www.supportkori.com/tanzirahmed)
