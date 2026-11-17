# Changelog — Mr.Robot by Tanzir

All releases are published on the **Stable** channel. The version shown in the
sidebar, the PWA manifest, `version.json`, `package.json` and this file must
always match; `npm run build` enforces it with `scripts/check-versions.js`.

## v1.1.19 — 17 Nov 2026 (current stable)

- 🐛 **Free Private AI button fixed** — on phones/tablets (≤768px), tapping
  the sidebar’s “Free Private AI” threw `ReferenceError: closeSidebar is
  not defined` (the helper lives inside `wireEvents()`, unreachable from
  the button handler). The button now closes the sidebar directly, so the
  Free Private AI chat opens cleanly on mobile too.
- 🛠️ Service worker cache: `tanzir-ai-v23`.

## v1.1.18 — 17 November 2026

- 🆓 **Free Private AI** — sidebar-এ নতুন বাটন: এক ট্যাপে অ্যাপের **ভিতরেই**
  key ছাড়া, account ছাড়া ফ্রি AI (FLM Free, `auto` model) চালু হয় — কোনো নতুন
  ট্যাব খোলে না। 64k context · 60 req/min · 20,000 req/day।
- 🔒 **History আপনার ব্রাউজারেই থাকে** — চ্যাটগুলো IndexedDB-তে সেভ হয়
  (sidebar-এ history হিসেবে লিস্ট/ডিলিট করা যায়)। শুধু প্রশ্নটা FLM-এর কাছে
  query হিসেবে যায়; duck.ai-এর মতো কোনো তৃতীয়-পক্ষের সার্ভারে চ্যাট
  যায় না।
- 🧹 **Duck.ai external link সরিয়ে দেওয়া হয়েছে** — duck.ai-এর API endpoint
  cross-origin ব্লক এবং anti-abuse proof-of-work লাগার কারণে duck.ai-কে
  অ্যাপের ভেতরে embed করা সম্ভব ছিল না; তাই "Duck.ai ↗" বাটন ছিল বিভ্রান্তিকর।
- 🛠️ **Release tooling** — `npm run bump -- <x.y.z> "<date>"` দিয়ে এক কমান্ডে
  সব version ফাইল (package.json · manifest · version.json · app.js · sw.js ·
  index.html · README · CHANGELOG · banner) মিলিয়ে bump হয় এবং শেষে
  check-versions অটো চলে।
- 🛠️ Service worker cache: `tanzir-ai-v22`.

## v1.1.17 — 17 November 2026

- 🦆 **Duck.ai quick link in the sidebar** — one tap opens duck.ai (free,
  private, no-login AI chat) in a new tab. Their protocol is cross-origin
  blocked with anti-abuse proof-of-work, so native integration is not possible;
  in-app free providers (Pollinations / FLM / Puter / Gemini free) are
  unchanged.
- 🛠️ Service worker cache: `tanzir-ai-v21`.

## v1.1.16 — 17 November 2026

- 🆕 **Free model catalogue auto-updates monthly** — the Pollinations free
  catalogue (live `/models`, `paid_only === false` detected honestly) is synced
  in the background whenever a key is saved; a scheduled GitHub Action
  (`.github/workflows/update-free-models.yml`, 1st of each month) regenerates
  the bundled `models-free.json` fallback. No app update needed for the free
  lineup to stay current.
- 🔁 **Keyless providers sync on launch** — FLM’s public `/models` list is
  refreshed at startup.
- 🧹 Live catalogue entries carry capability labels (context, vision, reasoning)
  and are honestly split Free / Paid; saved model is preserved.
- 🛠️ Service worker cache: `tanzir-ai-v20`.

## v1.1.15 — 9 November 2026

- 🔊 **Speak on a freshly streamed reply fixed (root cause)** — the voice
  button was created with the empty placeholder text and kept that closure, so
  clicking it did nothing until the page was reloaded. It now reads the live
  message text and starts immediately.
- 🗣️ **Dominant-script language choice** — an English reply containing the name
  “তানজীর” is spoken in English instead of switching to a Bengali voice that may
  not exist.
- 🎤 **Mic language always auto-detects** — the manual picker is gone.
- ➕ **New chat** creates a visible sidebar entry immediately.
- 📌 **Settings `×` is sticky** while the panel scrolls.
- 🧹 **Settings cleanup** — removed the system-identity textarea and the manual
  voice-language picker.
- 🛠️ Service worker cache: `tanzir-ai-v19`.

## v1.1.14 — 9 November 2026

- 🎤 **Voice input auto-detects language** — default is now “Auto detect
  (recommended)”. The mic uses the language of what you type, your recent
  messages, or your browser language (Bengali, English, Hindi, Urdu, Arabic and
  more).
- 🔊 **Speak reliability** — replies start immediately, use a local voice when
  one exists, pick the matching Bengali/English voice, and retry once when a
  mobile browser silently ignores the first `speak()` call.
- 🛑 **Stop state** — the Speak button only switches to Stop while audio is
  genuinely playing (`speechSynthesis.speaking || pending`) and restores itself
  when playback ends, so a stale Stop cannot block the next tap.
- 🔇 **Silent-audio guidance** — if no audio starts, a small in-app hint
  explains that media volume / Silent mode may be the cause (no blocking alert).
- ➕ **New chat fixed** — pressing `+` immediately creates and opens a visible
  “New chat” entry in the sidebar instead of appearing to do nothing.
- 📌 **Settings close button stays visible** — the `×` is sticky while the
  settings modal scrolls.
- 🧹 **Settings cleaned up** — removed the locked system-identity textarea and
  the manual voice-language picker; identity is always তানজীর and mic language
  is always auto-detected.
- 🛠️ Service worker cache: `tanzir-ai-v18`.

## v1.1.13 — 9 November 2026

- ✎ **Chat rename fixed** — visible ✎ button on every conversation (one tap on
  mobile), double-click still works on desktop, and manual names survive the
  first message.
- 🎤 **Voice input** — speak to type in Bengali (BD/IN), English, Hindi, Urdu or
  Arabic; language picker in Settings; friendly errors for denied mic
  permission and unsupported browsers.
- 🔊 **Speak fixed** — long replies are split into sentence-sized chunks
  (no more Chrome mid-reply cutoff), tap again to stop, and the matching
  Bengali/English voice is selected automatically.
- 🔑 **API key section** — provider-specific labels, required/saved status,
  👁 show/hide, Remove button, mobile full-width input, and immediate Free/Paid
  model refresh after saving or removing a key.
- 🏷️ **Stable version control** — sidebar shows `Version 1.1.13 · Stable` and
  the release date; Developer Info shows the same build info.
- 📅 **Release dates in README** — stable channel table and dated changelog.
- 🛠️ Service worker cache: `tanzir-ai-v17`.

## v1.1.12 — November 2026

- 🐛 Update popup no longer reappears after Reload / dismiss (dismissal now
  persists in `localStorage`).

## v1.1.11 — November 2026

- 🔑 Per-provider API key input restored in the topbar; Settings keeps the
  all-provider connection list.

## v1.1.10 — November 2026

- 🔑 Always-visible key entry (topbar 🔑 button) and connections moved to the
  top of Settings.

## v1.1.9 — November 2026

- 🐛 Removing/changing a key immediately clears stale model lists.

## v1.1.8 — November 2026

- 🗂️ Free and Paid model lists in separate boxes with counts.

## v1.1.7 — November 2026

- 🏷️ Model capability tags (context, vision, reasoning) and token stats panel.

## v1.1.6 — November 2026

- 🔄 Live model detection for every keyed provider, with key-scoped caching.

## v1.1.5 — November 2026

- 🌐 OpenRouter live free-model listing.

## v1.1.4 — November 2026

- 🧠 Live runtime context in the system prompt, per-model vision handling.

## v1.1.3 — November 2026

- ✨ Polish pass: PWA safe areas, responsive topbar, footer and identity.

## v1.1.2 — November 2026

- 🐛 Stability and provider-routing fixes.

## v1.1.1 — November 2026

- 🐛 Startup and history fixes.

## v1.1.0 — November 2026

- 🚀 First public stable release: multi-provider chat, FLM free default,
  Puter, local-first history and PWA support.
