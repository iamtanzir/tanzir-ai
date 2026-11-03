# Puter AI Chat

An AI chat application built with [Puter.js](https://developer.puter.com).

## Features
- Multiple providers: **Puter** (cloud, needs sign-in) + **Google Gemini**, **Groq**, **OpenRouter** (100% free tiers)
- Free providers need only a free API key — no Puter credits, no card
- Chat with 500+ AI models (OpenAI, Anthropic, Google, and more)
- Streaming responses with Markdown rendering
- Multiple conversations persisted (Puter KV if signed in, else browser storage)
- Model selector + custom model id
- Adjustable system prompt, temperature, max tokens
- Stop generation mid-stream

## Run locally

The app must be served over HTTP (not `file://`).

Using Node:
```
npm start
```
Then open http://localhost:3000

Using Python:
```
python -m http.server 3000
```

## Notes
- Includes a "Powered by Puter" footer link as required by Puter.js.
- Data is stored in the signed-in user's own Puter account.
