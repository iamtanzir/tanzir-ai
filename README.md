# Mr.Robor by Tanzir

[![Mr.Robor by Tanzir](https://img.shields.io/badge/Mr.Robor%20by%20Tanzir-AI%20Chat%20App-00ff41?style=for-the-badge&logo=github)](https://github.com/iamtanzir/tanzir-ai)

**A high-performance, multi-provider AI chat web application featuring a cyberpunk/hacker UI, supporting 15+ AI providers (Puter, Google Gemini, Groq, OpenRouter, OpenAI, Anthropic, Mistral, DeepSeek, xAI, Together, Fireworks, Perplexity, Cohere, Ollama, LM Studio) with free-tier support and responsive design for PC, laptop, and mobile.**

[![Open Live App](https://img.shields.io/badge/Open%20Live%20App-iamtanzir.github.io%2Ftanzir--ai-00d4ff?style=for-the-badge&logo=google-chrome&logoColor=white)](https://iamtanzir.github.io/tanzir-ai/)

---

## 📌 System Status & Version Metadata

- **Current Stable Version**: `v1.0.0`
- **Release Stage**: Production Ready
- **App Type**: Static Web App (HTML/CSS/JS) — no backend required
- **Database / Storage**: Puter KV Store (signed-in) / Browser localStorage (free providers)
- **Last Code Sync**: **2026-11-03**
- **Compiled Status**: 🟢 Fully Compiled & Verified

---

## 📈 Version Changelog

### 🚀 [v1.0.0] - 2026-11-03 (Current Version)

- **🌟 Feature**: Multi-provider AI chat — Puter, Gemini, Groq, OpenRouter, OpenAI, Anthropic, Mistral, DeepSeek, xAI, Together, Fireworks, Perplexity, Cohere, Ollama, LM Studio, plus custom OpenAI-compatible providers.
- **🌟 Feature**: 100% free providers (Google Gemini, Groq, OpenRouter free models) — no card, no credits.
- **🌟 Feature**: Cyberpunk / hacker UI with neon glow, scanlines, glitch title, Orbitron + JetBrains Mono fonts.
- **🌟 Feature**: Responsive design — PC, laptop, tablet, mobile (hamburger sidebar, touch-friendly).
- **🌟 Feature**: Streaming responses, Markdown rendering, reasoning/thinking blocks, settings (system prompt, temperature, max tokens).
- **🌟 Feature**: Chat history persisted (Puter KV if signed in, else localStorage).
- **🌟 Feature**: Provider & API key management modal (add custom providers).
- **🔧 Core**: Anthropic native API support (streaming + non-streaming).
- **🎨 Visuals**: High-contrast neon theme, animated typing indicator, glowing borders.

---

## 🚀 Key Features

- **Multi-Provider AI Chat**: Switch between 15+ AI providers instantly.
- **Free-Tier First**: Google Gemini & Groq work with free API keys (no card).
- **Cyberpunk UI**: Matrix-style dark theme with neon accents and glitch effects.
- **Responsive**: Works on PC, laptop, tablet, and mobile — only needs internet.
- **Streaming Responses**: Real-time token streaming with Markdown + code highlighting.
- **Reasoning Blocks**: Collapsible thinking/reasoning display for reasoning models.
- **Chat History**: Multiple conversations saved locally or in your Puter account.
- **Custom Providers**: Add any OpenAI-compatible or Anthropic endpoint.
- **Settings**: System prompt, temperature (0–2), max tokens, streaming toggle.
- **Stop Generation**: Abort mid-stream with one click.
- **Zero Backend**: Pure static HTML/CSS/JS — deploy anywhere.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| AI SDK | Puter.js v2 (optional) |
| Markdown | marked.js + DOMPurify |
| Fonts | Orbitron, JetBrains Mono (Google Fonts) |
| Hosting | GitHub Pages (free) / any static host |
| Storage | Puter KV (signed-in) / localStorage (free) |

---

## 🚀 Quick Start

### Run Locally (PC)

```bash
git clone https://github.com/iamtanzir/tanzir-ai.git
cd tanzir-ai
npm start
```

Then open: **http://localhost:3000**

> ⚠️ Must be served over HTTP (not `file://`) — Puter.js security requirement.

### Use Online (No Install)

Open: **https://iamtanzir.github.io/tanzir-ai/**

Works on any device with a browser and internet.

---

## 🔑 Free AI Setup (100% Free, No Card)

1. Go to **https://aistudio.google.com** → "Get API key" (free, no card)
2. Open the app → Provider dropdown → **Google Gemini (FREE)**
3. Paste the API key → "Save key"
4. Select model **Gemini 2.5 Flash** → Start chatting

**Alternative free providers:** Groq (console.groq.com), OpenRouter (openrouter.ai, free models).

---

## 🔐 Security & Compliance

- **No password exposure**: API keys stored only in your browser (localStorage).
- **No backend**: No server, no database — your data stays with you.
- **Puter auth**: OAuth-based sign-in via Puter (optional).
- **Sanitized output**: All AI responses sanitized with DOMPurify.
- **HTTPS**: GitHub Pages serves over HTTPS.

---

## 🇧🇩 বাংলা সেটআপ গাইড

বিস্তারিত বাংলা গাইড পাবেন এই ফাইলে:
`Puter_AI_Chat_Setup_Guide_Bangla.docx` (repo-তে আছে)

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

- **Built with ❤️ Tanzir Ahmed**
- **Mr.Robor by Tanzir**
- **Optimized for GitHub Pages + Free AI Providers**

## Footer

© 2026 GitHub, Inc. — Tanzir AI / Mr.Robor by Tanzir

### Footer navigation

- [Live App](https://iamtanzir.github.io/tanzir-ai/)
- [Repository](https://github.com/iamtanzir/tanzir-ai)
- [Issues](https://github.com/iamtanzir/tanzir-ai/issues)