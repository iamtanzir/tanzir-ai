# Changelog — Mr.Robot by Tanzir

All releases are published on the **Stable** channel. The version shown in the
sidebar, the PWA manifest, `version.json`, `package.json` and this file must
always match; `npm run build` enforces it with `scripts/check-versions.js`.

## v1.1.14 — 9 November 2026 (current stable)

- 🎤 **Voice input auto-detects language** — default is now “Auto detect
  (recommended)”. The mic uses the language of what you type, your recent
  messages, or your browser language (Bengali, English, Hindi, Urdu, Arabic and
  more). A manual language can still be pinned in Settings.
- 🔊 **Speak reliability** — replies start immediately, use a local voice when
  one exists, pick the matching Bengali/English voice, and retry once when a
  mobile browser silently ignores the first `speak()` call.
- 🐛 **Speak on a fresh reply fixed** — the button on a just-streamed message
  used to hold the empty placeholder text and stayed silent until reload; it
  now reads the live message text, so it works immediately.
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
