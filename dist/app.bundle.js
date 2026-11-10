(function () {
  'use strict';

  /* Tanzir AI — multi-provider chat (Puter + OpenAI-compatible + Anthropic) */
  const APP_VERSION = "1.1.15";
  const APP_CHANNEL = "Stable";
  const APP_RELEASE_DATE = "9 Nov 2026";
  const STORAGE_PREFIX = "tanzirai:";
  const SETTINGS_KEY = STORAGE_PREFIX + "settings";
  const APIKEYS_KEY = STORAGE_PREFIX + "apikeys";
  const PROVIDER_KEY = STORAGE_PREFIX + "provider";
  const MODEL_KEY = STORAGE_PREFIX + "model";
  const CUSTOM_PROVIDERS_KEY = STORAGE_PREFIX + "customProviders";

  const BUILTIN_PROVIDERS = {
    flm: { id:"flm", label:"FLM Free (no key)", type:"openai", needsKey:false, auth:"none",
      endpoint:"https://flm.stonech.at/v1/chat/completions",
      hint:"No signup, no key — verified free public API: 60 req/min, 20,000 req/day, 64k input / 8k output tokens.",
      defaultMaxTokens: 8192,
      supportsImages: false,
      models:[{id:"auto",label:"Auto (free, no key)",ctx:64000,maxOut:8192,vision:false}]},
    puter: { id:"puter", label:"Puter (cloud)", type:"puter", needsKey:false, supportsImages:true, models:[
      {id:"gpt-5.4-nano",label:"GPT-5.4 Nano (cheap)",vision:true,ctx:128000},{id:"gpt-5.6-luna",label:"GPT-5.6 Luna",vision:true,ctx:128000},
      {id:"claude-sonnet-4-6",label:"Claude Sonnet 4.6",vision:true,ctx:200000},{id:"claude-opus-4-8",label:"Claude Opus 4.8",vision:true,ctx:200000},
      {id:"gemini-3.5-flash-lite",label:"Gemini 3.5 Flash Lite",vision:true,ctx:1048576},{id:"deepseek-chat",label:"DeepSeek Chat (text only)",vision:false,ctx:65536}]},
    gemini: { id:"gemini", label:"Google Gemini (FREE)", type:"openai", needsKey:true, auth:"bearer", supportsImages:true,
      endpoint:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      hint:"aistudio.google.com → Get API key (free, no card)",
      models:[{id:"gemini-2.5-flash",label:"Gemini 2.5 Flash (best free)",vision:true,ctx:1048576,reasoning:true},{id:"gemini-2.0-flash",label:"Gemini 2.0 Flash",vision:true,ctx:1048576},{id:"gemini-1.5-flash",label:"Gemini 1.5 Flash",vision:true,ctx:1048576}]},
    groq: { id:"groq", label:"Groq (FREE, fastest)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.groq.com/openai/v1/chat/completions",
      hint:"console.groq.com → API Keys",
      models:[{id:"llama-3.3-70b-versatile",label:"Llama 3.3 70B",vision:false,ctx:131072},{id:"llama-3.1-8b-instant",label:"Llama 3.1 8B (fastest)",vision:false,ctx:131072},{id:"mixtral-8x7b-32768",label:"Mixtral 8x7B",vision:false,ctx:32768},{id:"gemma2-9b-it",label:"Gemma 2 9B",vision:false,ctx:8192}]},
    openrouter: { id:"openrouter", label:"OpenRouter (FREE models)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://openrouter.ai/api/v1/chat/completions",
      hint:"openrouter.ai → Keys",
      extraHeaders:{"HTTP-Referer":"http://localhost:3000","X-Title":"Tanzir AI"},
      // Filled live from https://openrouter.ai/api/v1/models once a key is saved.
      // Never hardcode free slugs here — they get retired or turned paid.
      models:[]},
    openai: { id:"openai", label:"OpenAI", type:"openai", needsKey:true, auth:"bearer", supportsImages:true,
      endpoint:"https://api.openai.com/v1/chat/completions",
      hint:"platform.openai.com → API keys",
      models:[{id:"gpt-4o",label:"GPT-4o",vision:true,ctx:128000},{id:"gpt-4o-mini",label:"GPT-4o Mini",vision:true,ctx:128000},{id:"gpt-4.1",label:"GPT-4.1",vision:true,ctx:1048576},{id:"o3-mini",label:"o3-mini",vision:false,ctx:200000,reasoning:true}]},
    anthropic: { id:"anthropic", label:"Anthropic (Claude)", type:"anthropic", needsKey:true, auth:"x-api-key", supportsImages:true,
      endpoint:"https://api.anthropic.com/v1/messages",
      hint:"console.anthropic.com → API keys",
      models:[{id:"claude-opus-4-8",label:"Claude Opus 4.8",vision:true,ctx:200000},{id:"claude-sonnet-4-6",label:"Claude Sonnet 4.6",vision:true,ctx:200000},{id:"claude-haiku-4-5",label:"Claude Haiku 4.5",vision:true,ctx:200000}]},
    mistral: { id:"mistral", label:"Mistral", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.mistral.ai/v1/chat/completions",
      hint:"console.mistral.ai → API keys",
      models:[{id:"mistral-large-latest",label:"Mistral Large",vision:false,ctx:128000},{id:"mistral-small-latest",label:"Mistral Small",vision:false,ctx:32000},{id:"codestral-latest",label:"Codestral",vision:false,ctx:256000}]},
    deepseek: { id:"deepseek", label:"DeepSeek", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.deepseek.com/chat/completions",
      hint:"platform.deepseek.com → API keys",
      models:[{id:"deepseek-chat",label:"DeepSeek Chat",vision:false,ctx:65536},{id:"deepseek-reasoner",label:"DeepSeek Reasoner",vision:false,ctx:65536,reasoning:true}]},
    xai: { id:"xai", label:"xAI (Grok)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.x.ai/v1/chat/completions",
      hint:"console.x.ai → API keys",
      models:[{id:"grok-3",label:"Grok 3",vision:true,ctx:131072},{id:"grok-3-mini",label:"Grok 3 Mini",vision:true,ctx:131072}]},
    together: { id:"together", label:"Together AI", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.together.xyz/v1/chat/completions",
      hint:"api.together.ai → API keys",
      models:[{id:"meta-llama/Llama-3.3-70B-Instruct-Turbo",label:"Llama 3.3 70B Turbo",vision:false,ctx:131072},{id:"Qwen/Qwen2.5-72B-Instruct-Turbo",label:"Qwen 2.5 72B",vision:false,ctx:131072}]},
    fireworks: { id:"fireworks", label:"Fireworks AI", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.fireworks.ai/inference/v1/chat/completions",
      hint:"fireworks.ai → API keys",
      models:[{id:"accounts/fireworks/models/llama-v3p3-70b-instruct",label:"Llama 3.3 70B",vision:false,ctx:131072}]},
    perplexity: { id:"perplexity", label:"Perplexity", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.perplexity.ai/chat/completions",
      hint:"perplexity.ai → API keys",
      models:[{id:"sonar",label:"Sonar",vision:false,ctx:128000},{id:"sonar-pro",label:"Sonar Pro",vision:false,ctx:128000}]},
    cohere: { id:"cohere", label:"Cohere", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.cohere.com/compatibility/v1/chat/completions",
      hint:"dashboard.cohere.com → API keys",
      models:[{id:"command-r-plus",label:"Command R+",vision:false,ctx:128000},{id:"command-r",label:"Command R",vision:false,ctx:128000}]},
    ollama: { id:"ollama", label:"Ollama (local)", type:"openai", needsKey:false, auth:"none",
      endpoint:"http://localhost:11434/v1/chat/completions",
      hint:"Install Ollama locally (ollama.com)",
      models:[{id:"llama3.2",label:"Llama 3.2",vision:false,ctx:131072},{id:"phi3:mini",label:"Phi-3 Mini",vision:false,ctx:4096},{id:"qwen2.5:7b",label:"Qwen 2.5 7B",vision:false,ctx:32768}]},
    lmstudio: { id:"lmstudio", label:"LM Studio (local)", type:"openai", needsKey:false, auth:"none",
      endpoint:"http://localhost:1234/v1/chat/completions",
      hint:"Run LM Studio local server",
      models:[]},
    cerebras: { id:"cerebras", label:"Cerebras (FREE)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.cerebras.ai/v1/chat/completions",
      hint:"cerebras.ai → API keys (1M tokens/day free)",
      models:[{id:"llama3.1-8b",label:"Llama 3.1 8B"},{id:"llama-3.3-70b",label:"Llama 3.3 70B"}]},
    sambanova: { id:"sambanova", label:"SambaNova (FREE)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.sambanova.ai/v1/chat/completions",
      hint:"sambanova.ai → API keys (free tier)",
      models:[{id:"Meta-Llama-3.3-70B-Instruct",label:"Llama 3.3 70B",vision:false,ctx:131072},{id:"Meta-Llama-3.1-8B-Instruct",label:"Llama 3.1 8B",vision:false,ctx:131072}]},
    nvidia: { id:"nvidia", label:"NVIDIA NIM (FREE)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://integrate.api.nvidia.com/v1/chat/completions",
      hint:"build.nvidia.com → API keys (free prototyping)",
      models:[{id:"meta/llama-3.3-70b-instruct",label:"Llama 3.3 70B",vision:false,ctx:131072},{id:"deepseek-ai/deepseek-r1",label:"DeepSeek R1",vision:false,ctx:65536,reasoning:true},{id:"qwen/qwen2.5-72b-instruct",label:"Qwen 2.5 72B",vision:false,ctx:131072}]},
    zai: { id:"zai", label:"Z.ai (FREE GLM)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.z.ai/api/paas/v4/chat/completions",
      hint:"z.ai → API keys (GLM-4.5-Flash free)",
      models:[{id:"glm-4.5-flash",label:"GLM-4.5 Flash (free)",vision:false,ctx:131072},{id:"glm-4.7-flash",label:"GLM-4.7 Flash (free)",vision:false,ctx:131072}]},
    deepinfra: { id:"deepinfra", label:"DeepInfra (FREE credits)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.deepinfra.com/v1/openai/chat/completions",
      hint:"deepinfra.com → API keys (free credits)",
      models:[{id:"meta-llama/Llama-3.3-70B-Instruct",label:"Llama 3.3 70B",vision:false,ctx:131072},{id:"deepseek-ai/DeepSeek-R1",label:"DeepSeek R1",vision:false,ctx:65536,reasoning:true}]},
    novita: { id:"novita", label:"Novita AI (FREE credits)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.novita.ai/v3/openai/chat/completions",
      hint:"novita.ai → API keys ($0.50 free)",
      models:[{id:"meta-llama/llama-3.3-70b-instruct",label:"Llama 3.3 70B",vision:false,ctx:131072}]},
    hyperbolic: { id:"hyperbolic", label:"Hyperbolic (FREE tier)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.hyperbolic.xyz/v1/chat/completions",
      hint:"hyperbolic.ai → API keys (free tier)",
      models:[{id:"meta-llama/Llama-3.3-70B-Instruct",label:"Llama 3.3 70B",vision:false,ctx:131072}]},
    aimlapi: { id:"aimlapi", label:"AIML API (FREE tier)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://api.aimlapi.com/v1/chat/completions",
      hint:"aimlapi.com → API keys (free tier)",
      models:[{id:"meta-llama/Llama-3.3-70B-Instruct-Turbo",label:"Llama 3.3 70B",vision:false,ctx:131072}]},
    huggingface: { id:"huggingface", label:"Hugging Face (FREE)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://router.huggingface.co/v1/chat/completions",
      hint:"huggingface.co → Access Tokens (free)",
      models:[{id:"meta-llama/Llama-3.3-70B-Instruct",label:"Llama 3.3 70B",vision:false,ctx:131072},{id:"Qwen/Qwen2.5-72B-Instruct",label:"Qwen 2.5 72B",vision:false,ctx:131072}]},
    pollinations: { id:"pollinations", label:"Pollinations (FREE)", type:"openai", needsKey:true, auth:"bearer",
      endpoint:"https://gen.pollinations.ai/v1/chat/completions",
      hint:"enter.pollinations.ai/keys → free API key (no card)",
      models:[{id:"openai/gpt-5.4-nano",label:"GPT-5.4 Nano (free)",vision:true,ctx:128000},{id:"openai/gpt-4o-mini",label:"GPT-4o Mini (free)",vision:true,ctx:128000},{id:"mistral/mistral-small",label:"Mistral Small (free)",vision:false,ctx:32000},{id:"meta-llama/llama-3.3-70b",label:"Llama 3.3 70B (free)",vision:false,ctx:131072}]},
    // OmniRoute gateway (github.com/cheaper-inference/OmniRoute): free AI gateway with quota-aware auto-fallback across 380 providers
    omniroute: { id:"omniroute", label:"OmniRoute Gateway (FREE, auto-failover)", type:"openai", needsKey:false, auth:"none", supportsImages:false,
      endpoint:"https://omniroute.online/v1/chat/completions",
      hint:"OmniRoute handles auto-failover when one model hits its token/rate limit. Uses public free tiers from 150+ providers.",
      models:[{id:"auto",label:"Auto (OmniRoute picks best free model with failover)",vision:false},{id:"openai/gpt-5.4-nano",label:"GPT-5.4 Nano",vision:true,ctx:128000},{id:"meta-llama/llama-3.3-70b",label:"Llama 3.3 70B",vision:false,ctx:131072}]},
  };

  let CUSTOM_PROVIDERS = [];
  try { CUSTOM_PROVIDERS = JSON.parse(localStorage.getItem(CUSTOM_PROVIDERS_KEY) || "[]"); } catch(e){ CUSTOM_PROVIDERS=[]; }

  function allProviders() {
    const map = { ...BUILTIN_PROVIDERS };
    CUSTOM_PROVIDERS.forEach((cp) => { map[cp.id] = cp; });
    return map;
  }

  // ---------- Live model catalogue (all providers) ----------
  // OpenRouter used to hardcode three free slugs — one of them later turned
  // paid and every chat hit HTTP 404. Now, for EVERY provider with a saved API
  // key, we pull the live model list from the provider's own `/models`
  // endpoint (the chat endpoint's sibling), split it into Free (auto-detected)
  // and Paid / Other groups, cache it for 6 hours and refresh automatically
  // on key save / provider select / the ↻ button.
  //
  // Free detection is honest, never guessed:
  //   - OpenRouter: pricing.prompt === 0 && pricing.completion === 0
  //     (or a `:free` variant when pricing is omitted)
  //   - Any provider: model id ends with `:free`
  //   - Otherwise the model goes to "Paid / Other (live)" — we never relabel
  //     price-unknown models as free just to fill the group.
  // While no key is saved, the builtin list stays as a template fallback.
  // Remote lists are keyed by a fingerprint of the current API key, so a
  // different key never reuses another key's synced list (freemium catalogues
  // are per-account).
  const REMOTE_MODELS_KEY = STORAGE_PREFIX + "remoteModels";
  const REMOTE_MODELS_TTL = 6 * 60 * 60 * 1000; // 6 hours
  let REMOTE_MODELS = {};
  let remoteModelsBusy = {};
  let modelSyncState = {}; // providerId -> idle | syncing | loaded | error

  function keyFingerprint(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return String(h);
  }
  function readRemoteModelsCache() {
    try {
      const raw = JSON.parse(localStorage.getItem(REMOTE_MODELS_KEY) || "{}");
      REMOTE_MODELS = (raw && typeof raw === "object" && !Array.isArray(raw)) ? raw : {};
    } catch (e) { REMOTE_MODELS = {}; }
    // Migrate pre-Free/Paid entries (shapes without a `free` flag from 1.1.5):
    // their labels carried a trailing " (free)" marker.
    Object.values(REMOTE_MODELS).forEach((entry) => {
      if (!entry || !Array.isArray(entry.models)) return;
      entry.models.forEach((m) => {
        if (m && typeof m.free !== "boolean") {
          m.free = /\(free\)\s*$/.test(m.label || "") || /:free$/i.test(m.id || "");
        }
      });
    });
  }
  function writeRemoteModelsCache() {
    try { localStorage.setItem(REMOTE_MODELS_KEY, JSON.stringify(REMOTE_MODELS)); } catch (e) {}
  }
  function liveModelsEntry(providerId) {
    const entry = REMOTE_MODELS[providerId];
    if (!entry || entry.v !== 2) return null; // pre-capability schema (1.1.5/1.1.6) is dropped
    if (!Array.isArray(entry.models) || !entry.models.length) return null;
    const p = allProviders()[providerId];
    if (p && p.needsKey) {
      const fp = keyFingerprint(getApiKey(providerId) || "");
      if (entry.keyFp && entry.keyFp !== fp) return null; // synced with another key
    }
    return entry;
  }
  function remoteModelsFresh(providerId) {
    const entry = liveModelsEntry(providerId);
    return !!(entry && (Date.now() - Number(entry.fetchedAt || 0) < REMOTE_MODELS_TTL));
  }
  // Live list when available (and keyed to the current API key), else template.
  function getProviderModels(providerId) {
    const entry = liveModelsEntry(providerId);
    if (entry) return entry.models;
    const p = allProviders()[providerId];
    return Array.isArray(p && p.models) ? p.models : [];
  }
  // Derive the /models URL from a chat endpoint, or null when not possible.
  function modelsUrlForProvider(provider) {
    if (!provider || !provider.endpoint) return null;
    const ep = String(provider.endpoint).replace(/\/+$/, "");
    if (provider.type === "anthropic") return ep.replace(/\/messages\/?$/, "") + "/models";
    if (provider.type !== "openai") return null;
    if (/\/chat\/completions\/?$/i.test(ep)) return ep.replace(/\/chat\/completions\/?$/i, "/models");
    return null;
  }
  function liveSyncSupported(provider) {
    return !!(provider && provider.needsKey && modelsUrlForProvider(provider));
  }
  function isFreeModel(m) {
    return !!(m && m.free === true);
  }
  // Map one raw /models item into our shape. Returns null for unusable items.
  function mapLiveModel(providerId, m) {
    if (!m || !m.id) return null;
    const id = String(m.id);
    const freeSuffix = /:free$/i.test(id);
    if (providerId === "openrouter") {
      const pricing = m.pricing || {};
      const prompt = Number(pricing.prompt);
      const completion = Number(pricing.completion);
      const zeroCost = Number.isFinite(prompt) && Number.isFinite(completion) && prompt === 0 && completion === 0;
      const mods = (m.architecture && Array.isArray(m.architecture.input_modalities))
        ? m.architecture.input_modalities.map((x) => String(x).toLowerCase())
        : [];
      const name = String(m.name || id).replace(/\s*\((free|free tier)\)\s*$/i, "").trim();
      const free = zeroCost || freeSuffix;
      const ctx = Number(m.context_length) || Number(m.top_provider && m.top_provider.context_length) || 0;
      const maxOut = Number(m.top_provider && m.top_provider.max_completion_tokens) || 0;
      const reasoning = !!(m.reasoning && typeof m.reasoning === "object" &&
        (m.reasoning.mandatory || (Array.isArray(m.reasoning.supported_efforts) && m.reasoning.supported_efforts.length)));
      return {
        id,
        label: (name || id) + (free ? " (free)" : ""),
        vision: mods.includes("image"),
        free,
        ctx: ctx || undefined,
        maxOut: maxOut || undefined,
        reasoning,
        pp: Number.isFinite(prompt) ? prompt : undefined,   // $ per input token
        cp: Number.isFinite(completion) ? completion : undefined, // $ per output token
      };
    }
    return { id, label: id, vision: undefined, free: freeSuffix };
  }

  function modelSyncStateFor(providerId) { return modelSyncState[providerId] || "idle"; }
  function updateModelSyncUI() {
    const btn = $("#refreshModelsBtn");
    if (!btn) return;
    const provider = allProviders()[state.provider];
    const supported = liveSyncSupported(provider);
    btn.style.display = supported ? "inline-flex" : "none";
    const note = $("#modelSyncStatus");
    if (!supported) { if (note) note.textContent = ""; return; }
    const id = state.provider;
    const hasKey = !!getApiKey(id);
    const models = getProviderModels(id);
    const st = modelSyncStateFor(id);
    const isLive = !!liveModelsEntry(id);
    btn.classList.toggle("spinning", st === "syncing");
    btn.dataset.state = st;
    btn.disabled = !hasKey || st === "syncing";
    btn.title = hasKey
      ? (provider.label || "Provider") + " থেকে লাইভ মডেল লিস্ট রিফ্রেশ করুন (Free / Paid)"
      : "আগে Settings-এ " + (provider.label || "API") + " API key সেভ করুন";
    if (!note) return;
    // Short status under the boxes; exact Free/Paid counts live in the box labels.
    if (!hasKey) note.textContent = "Settings → API keys-এ key সেভ করুন";
    else if (st === "syncing") note.textContent = "মডেল লোড হচ্ছে…";
    else if (st === "error") note.textContent = isLive
      ? "sync ব্যর্থ — ক্যাশ দেখানো হচ্ছে (↻)"
      : "sync ব্যর্থ — ↻ চেপে আবার চেষ্টা করুন";
    else if (!isLive && models.length) note.textContent = "template (লাইভ লোড হয়নি)";
    else note.textContent = "";
  }

  async function fetchProviderLiveModels(providerId, options) {
    const force = !!(options && options.force);
    const quiet = !!(options && options.quiet);
    const provider = allProviders()[providerId];
    if (!liveSyncSupported(provider)) return false;
    if (!getApiKey(providerId)) { updateModelSyncUI(); renderConnectionList(); return false; }
    if (remoteModelsBusy[providerId]) return false;
    if (!force && remoteModelsFresh(providerId)) { modelSyncState[providerId] = "loaded"; updateModelSyncUI(); return true; }
    remoteModelsBusy[providerId] = true;
    if (!quiet) modelSyncState[providerId] = "syncing";
    updateModelSyncUI(); renderConnectionList();
    try {
      const headers = { Accept: "application/json" };
      const key = getApiKey(providerId);
      if (provider.auth === "x-api-key") {
        headers["x-api-key"] = key;
        headers["anthropic-version"] = "2023-06-01";
      } else if (provider.auth !== "none") {
        headers.Authorization = "Bearer " + key;
      }
      if (providerId === "openrouter") {
        headers["HTTP-Referer"] = location.origin;
        headers["X-Title"] = "Mr.Robot by Tanzir";
      }
      const res = await fetch(modelsUrlForProvider(provider), { method: "GET", cache: "no-store", headers });
      if (res.status === 401 || res.status === 403) throw new Error("API key rejected (HTTP " + res.status + ")");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const payload = await res.json();
      const list = Array.isArray(payload && payload.data) ? payload.data : [];
      const seen = new Set();
      const models = list.map((m) => mapLiveModel(providerId, m)).filter((m) => {
        if (!m || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      // Free first (stable), then the rest alphabetically.
      models.sort((a, b) =>
        (isFreeModel(b) ? 1 : 0) - (isFreeModel(a) ? 1 : 0) ||
        a.label.localeCompare(b.label));
      if (!models.length) throw new Error("no models in response");
      REMOTE_MODELS[providerId] = { models, fetchedAt: Date.now(), keyFp: keyFingerprint(key), v: 2 };
      writeRemoteModelsCache();
      if (state.provider === providerId) {
        const previous = state.model;
        populateModels();
        // The saved slug was retired or turned paid: switch to the first live
        // free model (or the first live model when there is no free one).
        if (!models.some((m) => m.id === previous)) {
          state.model = models[0].id;
          localStorage.setItem(MODEL_KEY, state.model);
          populateModels();
        }
      }
      modelSyncState[providerId] = "loaded";
      updateModelSyncUI(); renderConnectionList();
      return true;
    } catch (e) {
      console.warn("Live model sync failed for " + providerId + ":", e);
      modelSyncState[providerId] = "error";
      // If the key changed, the cached list belongs to the old key: drop it from
      // the UI immediately so stale models are never offered.
      if (state.provider === providerId) populateModels();
      updateModelSyncUI(); renderConnectionList();
      return false;
    } finally {
      remoteModelsBusy[providerId] = false;
    }
  }

  const GREETING_RULE = "CRITICAL: Greet with 'Assalamu Alaikum' ONLY in the very first reply of a brand-new conversation. NEVER repeat any greeting in later replies. Continued conversations must start directly with the answer, no salam, no 'How can I help you', no introduction. Match the user's language exactly: if they write in Bengali, reply entirely in Bengali; if in English, reply entirely in English. Never mix languages in a single reply. If the user writes Bengali in Latin letters (Banglish), reply in Banglish with Latin letters only — never insert Bengali script inside a Latin word.";

  const DEFAULT_SETTINGS = {
    systemPrompt: "You are তানজীর (Tanzir), a helpful and friendly AI assistant created by Tanzir Ahmed. Your name in Bengali is always written তানজীর (with a long ঈ), never টানজির, তানজির, or টানজীর. Always introduce yourself as তানজীর when asked who you are. " + GREETING_RULE + " Reply in the user's language (Bengali or English) and use clear Markdown when useful.",
    temperature: 0.7,
    maxTokens: 0,
    streaming: true,
    speechLang: "auto",
  };

  let state = {
    user: null,
    conversations: [],
    currentId: null,
    current: null,
    settings: { ...DEFAULT_SETTINGS },
    provider: "flm",
    model: "auto",
    customModelMode: false,
    apiKeys: {},
    sending: false,
    abortController: null,
    _profileId: null,
    pendingAttachment: null,
    evolutions: [],
  };

  const $ = (sel) => document.querySelector(sel);
  const messagesEl = $("#messages");
  const convListEl = $("#convList");
  const inputEl = $("#input");
  const providerSelect = $("#providerSelect");
  const modelSelect = $("#modelSelect");
  const customModelInput = $("#customModel");
  const userInfoEl = $("#userInfo");

  function uid() { return "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  // ---------- Per-user / per-browser profile scoping ----------
  // History is isolated per (browser + provider + API key). Different users on the
  // same browser or different API keys never share chat history.
  const BROWSER_ID_KEY = STORAGE_PREFIX + "browserId";
  function getBrowserId() {
    let id = localStorage.getItem(BROWSER_ID_KEY);
    if (!id) { id = "b_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); localStorage.setItem(BROWSER_ID_KEY, id); }
    return id;
  }
  async function hashStr(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
  }
  async function getProfileId() {
    const providers = allProviders();
    const p = providers[state.provider];
    const key = p?.needsKey ? getApiKey(state.provider) : "";
    const scope = state.provider + "::" + key + "::" + getBrowserId();
    return await hashStr(scope);
  }
  // Dynamic storage keys (profile-scoped)
  function INDEX_KEY() { return STORAGE_PREFIX + "idx:" + state._profileId; }
  function CONV_KEY(id) { return STORAGE_PREFIX + "conv:" + state._profileId + ":" + id; }

  // ---------- Settings ----------
  function loadSettings() {
    try { const raw = localStorage.getItem(SETTINGS_KEY); if (raw) state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }; } catch (e) {}
    // One-time cleanup of the old manual language choice: voice input is now
    // always auto-detected, so any stored value is reset to "auto".
    try {
      if (!localStorage.getItem(STORAGE_PREFIX + "speechLangAutoMigrated")) {
        if (!state.settings.speechLang || state.settings.speechLang === "bn-BD") state.settings.speechLang = "auto";
        localStorage.setItem(STORAGE_PREFIX + "speechLangAutoMigrated", "1");
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
      }
    } catch (e) {}
    // Voice input is always auto-detected from what the user types/speaks and
    // the browser language; there is no manual picker any more.
    state.settings.speechLang = "auto";
    // Always enforce built-in identity — user cannot override assistant name (তানজীর)
    state.settings.systemPrompt = DEFAULT_SETTINGS.systemPrompt;
    const systemPromptEl = $("#systemPrompt");
    if (systemPromptEl) systemPromptEl.value = DEFAULT_SETTINGS.systemPrompt;
    $("#temperature").value = state.settings.temperature;
    $("#tempVal").textContent = state.settings.temperature;
    $("#maxTokens").value = state.settings.maxTokens || "";
    $("#streaming").checked = state.settings.streaming;
    updateMicTitle();
  }
  function saveSettings() {
    // Enforce built-in identity — always reset to তানজীর regardless of input
    state.settings.systemPrompt = DEFAULT_SETTINGS.systemPrompt;
    state.settings.speechLang = "auto";
    state.settings.temperature = parseFloat($("#temperature").value);
    state.settings.maxTokens = parseInt($("#maxTokens").value) || 0;
    state.settings.streaming = $("#streaming").checked;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    $("#tempVal").textContent = state.settings.temperature;
    updateMicTitle();
  }
  function updateMicTitle() {
    const btn = $("#micBtn");
    if (!btn || btn.classList.contains("unsupported")) return;
    btn.title = "Speak — ভয়েসে লিখুন (Auto · " + resolveSpeechLang() + ") · tap to start / stop";
  }

  // ---------- API keys ----------
  function loadApiKeys() {
    try { state.apiKeys = JSON.parse(localStorage.getItem(APIKEYS_KEY) || "{}"); } catch (e) { state.apiKeys = {}; }
    state.provider = localStorage.getItem(PROVIDER_KEY) || state.provider;
    state.model = localStorage.getItem(MODEL_KEY) || state.model;
  }
  function saveApiKey(provider, key) { state.apiKeys[provider] = key; localStorage.setItem(APIKEYS_KEY, JSON.stringify(state.apiKeys)); }
  function getApiKey(provider) { return (state.apiKeys[provider] || "").trim(); }

  // ---------- Providers ----------
  function populateProviders() {
    const providers = allProviders();
    providerSelect.innerHTML = "";
    Object.entries(providers).forEach(([id, p]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = p.label;
      providerSelect.appendChild(opt);
    });
    if (providers[state.provider]) providerSelect.value = state.provider;
    else { state.provider = Object.keys(providers)[0]; providerSelect.value = state.provider; }
  }
  // Model capability helpers: compact tag + full tooltip used in the model
  // dropdown. `ctx` is context length, `maxOut` max output tokens, `vision`
  // image input, `reasoning` reasoning effort, `free` zero-cost tier.
  function modelMeta(providerId, modelId) {
    const models = getProviderModels(providerId);
    return models.find((m) => String(m.id || "").toLowerCase() === String(modelId || "").toLowerCase()) || null;
  }
  function fmtCtx(tokens) {
    const n = Number(tokens);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 ? 1 : 0).replace(/\.0$/, "") + "M";
    if (n >= 1000) return Math.round(n / 1000) + "k";
    return String(n);
  }
  function modelTag(m) {
    const parts = [];
    if (m && m.ctx) parts.push(fmtCtx(m.ctx));
    if (m && m.vision === true) parts.push("👁");
    if (m && m.reasoning === true) parts.push("🧠");
    return parts.length ? " · " + parts.join(" · ") : "";
  }
  function modelTip(m) {
    const lines = [];
    if (m && m.ctx) lines.push("Context: " + Number(m.ctx).toLocaleString("en-US") + " tokens");
    if (m && m.maxOut) lines.push("Max output: " + Number(m.maxOut).toLocaleString("en-US") + " tokens");
    if (m && m.vision === true) lines.push("ছবি পড়তে পারে (vision)");
    else if (m && m.vision === false) lines.push("শুধু টেক্সট — ছবি পড়তে পারে না");
    if (m && m.reasoning === true) lines.push("Reasoning model — ধাপে ধাপে চিন্তা করে উত্তর দেয়");
    if (m && m.free === true) lines.push("Free tier");
    return lines.join("\n");
  }
  function fillModelSelect(sel, models, placeholderText) {
    sel.innerHTML = "";
    if (models.length && placeholderText) {
      const opt = document.createElement("option");
      opt.value = ""; opt.disabled = true; opt.selected = true;
      opt.textContent = placeholderText;
      sel.appendChild(opt);
    }
    models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id; opt.textContent = m.label + modelTag(m);
      const tip = modelTip(m);
      if (tip) opt.title = tip;
      sel.appendChild(opt);
    });
  }
  // When both tiers exist the user picks from separate boxes; exactly one box
  // holds the selected model (the other sits idle at the placeholder). For
  // non-split providers (template or single-tier live lists) one box is enough.
  function populateModels() {
    const models = getProviderModels(state.provider);
    const frees = models.filter(isFreeModel);
    const others = models.filter((m) => !isFreeModel(m));
    const grouped = frees.length > 0 && others.length > 0;
    const freeBox = $("#freeModelBox");
    const paidBox = $("#paidModelBox");
    const paidSelect = $("#paidModelSelect");
    const freeLabel = $("#freeModelLabel");
    const paidLabel = $("#paidModelLabel");
    let selectedOwner = "free";
    if (grouped) {
      fillModelSelect(modelSelect, frees, "Free model বেছে নিন");
      fillModelSelect(paidSelect, others, "Paid model বেছে নিন");
      if (paidBox) paidBox.style.display = "";
      if (freeLabel) freeLabel.textContent = "Free · " + frees.length;
      if (paidLabel) paidLabel.textContent = "Paid · " + others.length;
    } else {
      fillModelSelect(modelSelect, models, "");
      if (paidBox) paidBox.style.display = "none";
      if (freeLabel) freeLabel.textContent = "Model";
      if (paidLabel) paidLabel.textContent = "Paid";
    }
    if (!models.length) {
      modelSelect.innerHTML = "";
      const opt = document.createElement("option");
      opt.value = ""; opt.disabled = true; opt.selected = true;
      const p = allProviders()[state.provider];
      opt.textContent = liveSyncSupported(p)
        ? (getApiKey(state.provider) ? "মডেল লোড হচ্ছে…" : "Settings-এ API key সেভ করুন (লাইভ মডেল লোড হবে)")
        : "কোনো মডেল নেই";
      modelSelect.appendChild(opt);
      if (paidSelect) paidSelect.innerHTML = "";
      if (paidBox) paidBox.style.display = "none";
      state.model = "";
    } else if (models.some((m) => m.id === state.model)) {
      if (grouped) {
        if (frees.some((m) => m.id === state.model)) { modelSelect.value = state.model; paidSelect.value = ""; selectedOwner = "free"; }
        else { paidSelect.value = state.model; modelSelect.value = ""; selectedOwner = "paid"; }
      } else {
        modelSelect.value = state.model;
      }
    } else {
      state.model = models[0].id;
      modelSelect.value = state.model;
      if (paidSelect) paidSelect.value = "";
      localStorage.setItem(MODEL_KEY, state.model);
    }
    if (freeBox) { freeBox.classList.toggle("active", selectedOwner === "free"); freeBox.classList.toggle("dormant", selectedOwner !== "free"); }
    if (paidBox) { paidBox.classList.toggle("active", selectedOwner === "paid"); paidBox.classList.toggle("dormant", selectedOwner !== "paid"); }
    state.customModelMode = false;
    const boxes = $("#modelBoxes");
    if (boxes) boxes.style.display = "flex";
    customModelInput.style.display = "none";
    updateApiKeyRow();
  }
  // Per-provider key entry lives in the topbar (shown for the current provider
  // only) AND in Settings (all providers at a glance). Both paths call
  // saveProviderKey, so saving anywhere refreshes the live models.
  let _lastKeyProvider = "";
  function updateApiKeyRow() {
    const p = allProviders()[state.provider];
    const row = $("#apiKeyRow");
    if (!row) { updateModelSyncUI(); updateStatus(); return; }
    // Never carry a revealed key over to another provider.
    if (_lastKeyProvider !== state.provider) {
      _lastKeyProvider = state.provider;
      const inputToMask = $("#apiKeyInput");
      if (inputToMask) inputToMask.type = "password";
      const toggle = $("#toggleKeyVisibility");
      if (toggle) { toggle.textContent = "👁"; toggle.title = "Show / hide key"; }
    }
    if (p && p.needsKey) {
      row.style.display = "flex";
      const key = getApiKey(state.provider);
      const input = $("#apiKeyInput");
      if (input && document.activeElement !== input) {
        input.value = key;
        input.placeholder = key
          ? "•••••••• saved — paste a new key to replace"
          : "Paste " + (p.label || "provider") + " API key";
      }
      const label = $("#apiKeyLabel");
      if (label) label.textContent = p.label + " key" + (key ? "" : " (required)");
      const status = $("#apiKeyStatus");
      if (status) {
        status.textContent = key ? "✓ saved" : (p.hint || "API key required");
        status.className = "muted " + (key ? "key-ok" : "key-missing");
        status.title = p.hint || "";
      }
      const clearBtn = $("#clearApiKeyBtn");
      if (clearBtn) clearBtn.style.display = key ? "inline-flex" : "none";
      const toggleBtn = $("#toggleKeyVisibility");
      if (toggleBtn) toggleBtn.style.display = key || (input && input.value) ? "inline-flex" : "none";
    } else row.style.display = "none";
    updateModelSyncUI();
    updateStatus();
  }
  function updateStatus() {
    const pill = $("#statusPill");
    const label = $("#connLabel");
    if (!pill || !label) return;
    const p = allProviders()[state.provider];
    let text = "READY";
    let mode = "ok";
    if (state.sending) { text = "GENERATING"; mode = "busy"; }
    else if (state.provider === "puter" && !state.user) { text = "SIGN IN REQUIRED"; mode = "warn"; }
    else if (p && p.needsKey && !getApiKey(state.provider)) { text = "API KEY REQUIRED"; mode = "warn"; }
    label.textContent = text;
    pill.dataset.state = mode;
  }
  // ---------- Token stats panel (AI options) ----------
  // Shows the current provider/model, context limit, last-reply tokens with
  // usage %, message counts and estimated cost — like the reference stats page.
  function fmtNum(n) { const v = Number(n) || 0; return v.toLocaleString("en-US"); }
  function fmtDate(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  }
  function renderStats() {
    const grid = $("#statsGrid");
    if (!grid) return;
    const provider = allProviders()[state.provider];
    const modelId = currentModel();
    const meta = modelMeta(state.provider, modelId);
    const conv = state.current;
    const usage = conv ? ensureUsage(conv) : blankUsage();
    const last = usage.last;
    const session = usage.session;
    const msgs = conv ? conv.messages : [];
    const userMsgs = msgs.filter((m) => m.role === "user").length;
    const asstMsgs = msgs.filter((m) => m.role === "assistant").length;
    const ctx = (meta && meta.ctx) || 0;
    const usedPct = ctx > 0 && last.total > 0 ? Math.min(100, (last.total / ctx) * 100) : 0;
    const bar = $("#ctxBarFill");
    if (bar) bar.style.width = usedPct.toFixed(1) + "%";
    const costText = usage.costKnown ? "$" + usage.cost.toFixed(2) : "—";
    const cell = (label, value) => `<div class="stats-cell"><span class="stats-label">${label}</span><span class="stats-value">${value}</span></div>`;
    grid.innerHTML =
      cell("Provider", provider ? escapeHtml(provider.label) : "—") +
      cell("Model", escapeHtml(friendlyModelName(provider, modelId))) +
      cell("Context Limit", ctx ? fmtNum(ctx) + " tokens" : "—") +
      cell("Total Tokens (last reply)", usage.turns ? fmtNum(last.total) : "0") +
      cell("Usage (of context)", ctx ? usedPct.toFixed(1) + "%" : "—") +
      cell("Input Tokens", usage.turns ? fmtNum(last.pin) : "0") +
      cell("Output Tokens", usage.turns ? fmtNum(last.pout) : "0") +
      cell("Reasoning Tokens", usage.turns ? fmtNum(last.reasoning) : "0") +
      cell("Cache Tokens (read / write)", fmtNum(last.cacheRead) + " / " + fmtNum(last.cacheWrite)) +
      cell("User Messages", String(userMsgs)) +
      cell("Assistant Messages", String(asstMsgs)) +
      cell("Total Cost (session)", costText) +
      cell("Session Tokens (total)", fmtNum(session.total)) +
      cell("Session Created", fmtDate(conv && conv.createdAt)) +
      cell("Last Activity", fmtDate(conv && conv.updatedAt));
  }
  function toggleCustomModel(force) {
    state.customModelMode = force !== undefined ? force : !state.customModelMode;
    const boxes = $("#modelBoxes");
    if (state.customModelMode) {
      if (boxes) boxes.style.display = "none";
      customModelInput.style.display = "inline-block";
    } else {
      if (boxes) boxes.style.display = "flex";
      customModelInput.style.display = "none";
      state.model = currentModel();
    }
  }
  function currentModel() {
    if (state.customModelMode) return (customModelInput.value || "").trim() || (getProviderModels(state.provider)?.[0]?.id || "");
    const paidSelect = $("#paidModelSelect");
    const freeVal = modelSelect.value || "";
    const paidVal = paidSelect ? paidSelect.value || "" : "";
    return freeVal || paidVal;
  }

  // ---------- Auth ----------
  async function refreshAuth() {
    // ensure profile scope is computed before any storage access
    if (!state._profileId) state._profileId = await getProfileId();
    try {
      const signedIn = await puter.auth.isSignedIn();
      if (signedIn) {
        state.user = await puter.auth.getUser();
        $("#signInBtn").style.display = "none";
        $("#signOutBtn").style.display = "inline-block";
        userInfoEl.textContent = (state.user?.username || state.user?.email || "Signed in") + " (Puter)";
        await loadConversations();
      } else {
        state.user = null;
        $("#signInBtn").style.display = "inline-block";
        $("#signOutBtn").style.display = "none";
        userInfoEl.textContent = "Sign in with Puter to start (free credits)";
        state.conversations = [];
        await loadLocalConversations();
        renderConvList();
        // Never clobber a conversation the user already started while the auth check was pending.
        if (state.conversations.length && !state.currentId) await openConversation(state.conversations[0].id);
        else if (!state.conversations.length && !state.currentId) newConversation();
      }
    } catch (e) { console.error(e); }
    renderConnectionList();
    updateStatus();
  }
  async function loadConversations() {
    if (!state._profileId) state._profileId = await getProfileId();
    if (!state.user) {
      await loadLocalConversations();
      renderConvList();
      if (state.conversations.length && !state.currentId) await openConversation(state.conversations[0].id);
      else if (!state.conversations.length) newConversation();
      return;
    }
    try { const idx = await puter.kv.get(INDEX_KEY()); state.conversations = Array.isArray(idx) ? idx : []; }
    catch (e) { state.conversations = []; }
    state.conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    renderConvList();
    if (state.conversations.length && !state.currentId) await openConversation(state.conversations[0].id);
    else if (!state.conversations.length) newConversation();
  }
  async function loadLocalConversations() {
    try { state.conversations = await window.tanzirDB.get(INDEX_KEY()) || []; } catch (e) { state.conversations = []; }
    state.conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
  async function saveIndex() {
    if (state.user) await puter.kv.set(INDEX_KEY(), state.conversations);
    else await window.tanzirDB.set(INDEX_KEY(), state.conversations);
  }
  async function loadConv(id) {
    if (state.user) return (await puter.kv.get(CONV_KEY(id))) || null;
    try { return await window.tanzirDB.get(CONV_KEY(id)); } catch (e) { return null; }
  }
  async function saveConv(conv, options) {
    if (!(options && options.preserveTimestamp)) conv.updatedAt = Date.now();
    if (state.user) await puter.kv.set(CONV_KEY(conv.id), conv);
    else {
      try {
        await window.tanzirDB.set(CONV_KEY(conv.id), conv);
      } catch (e) {
        console.warn("Could not save conversation:", e);
        return;
      }
    }
    const entry = state.conversations.find((c) => c.id === conv.id);
    if (entry) { entry.title = conv.title; entry.updatedAt = conv.updatedAt; entry.provider = conv.provider; }
    else { state.conversations.unshift({ id: conv.id, title: conv.title, updatedAt: conv.updatedAt, provider: conv.provider }); }
    state.conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    await saveIndex();
    renderConvList();
  }
  async function newConversation(persist) {
    stopSpeaking();
    // Clicking “+” on an already-empty chat should not create duplicates.
    if (persist && state.current && !state.current.messages.length &&
        state.conversations.some((c) => c.id === state.currentId)) {
      renderMessages(); renderConvList(); updateMicTitle();
      return;
    }
    const conv = { id: uid(), title: "New chat", messages: [], provider: state.provider, model: currentModel(), createdAt: Date.now(), updatedAt: Date.now(), usage: blankUsage() };
    state.current = conv; state.currentId = conv.id;
    renderMessages(); renderConvList();
    updateMicTitle();
    // An explicit “+” immediately creates a visible entry in the sidebar so it
    // is obvious that a new chat was opened (previously it only appeared after
    // the first message, which looked like the button did nothing).
    if (persist) {
      try { await saveConv(conv); } catch (e) { console.warn("Could not save new chat:", e); }
    }
  }
  // ---------- Token usage tracking (per conversation) ----------
  // Normalized shape: { pin, pout, reasoning, total, cacheRead, cacheWrite }
  // plus session aggregates: cost (USD, when pricing is known), turns.
  function blankUsage() {
    return {
      last: { pin: 0, pout: 0, reasoning: 0, total: 0, cacheRead: 0, cacheWrite: 0 },
      session: { pin: 0, pout: 0, reasoning: 0, total: 0, cacheRead: 0, cacheWrite: 0 },
      cost: 0, costKnown: false, turns: 0,
    };
  }
  function ensureUsage(conv) {
    if (!conv.usage || typeof conv.usage !== "object" || !conv.usage.last || !conv.usage.session) {
      conv.usage = blankUsage();
    }
    return conv.usage;
  }
  function normalizeOpenAIUsage(u) {
    u = u || {};
    const pin = Number(u.prompt_tokens) || 0;
    const pout = Number(u.completion_tokens) || 0;
    const reasoning = Number((u.completion_tokens_details && u.completion_tokens_details.reasoning_tokens) || u.reasoning_tokens) || 0;
    const cacheRead = Number((u.prompt_tokens_details && u.prompt_tokens_details.cached_tokens) || u.cached_tokens) || 0;
    return { pin, pout, reasoning, total: Number(u.total_tokens) || pin + pout, cacheRead, cacheWrite: 0 };
  }
  function addUsage(conv, payload, meta) {
    if (!conv || !payload) return;
    const usage = ensureUsage(conv);
    usage.last = { ...payload };
    usage.session.pin += payload.pin || 0;
    usage.session.pout += payload.pout || 0;
    usage.session.reasoning += payload.reasoning || 0;
    usage.session.total += payload.total || 0;
    usage.session.cacheRead += payload.cacheRead || 0;
    usage.session.cacheWrite += payload.cacheWrite || 0;
    usage.turns += 1;
    const pp = meta && Number.isFinite(meta.pp) ? meta.pp : null;
    const cp = meta && Number.isFinite(meta.cp) ? meta.cp : null;
    if (meta && meta.free === true) {
      usage.costKnown = true; // free tier: cost stays $0.00
    } else if (pp !== null || cp !== null) {
      usage.cost += (payload.pin || 0) * (pp || 0) + (payload.pout || 0) * (cp || 0);
      usage.costKnown = true;
    }
  }
  async function openConversation(id) {
    const conv = await loadConv(id); if (!conv) return;
    stopSpeaking();
    clearAttachment();
    state.current = conv; state.currentId = id;
    state.provider = conv.provider || state.provider;
    state.model = conv.model || state.model;
    populateProviders(); populateModels(); updateApiKeyRow();
    renderMessages(); renderConvList();
    updateMicTitle();
    // ensure chat view is visible on mobile
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById("sidebar");
      const overlay = document.getElementById("overlay");
      if (sidebar) sidebar.classList.remove("open");
      if (overlay) overlay.classList.remove("show");
    }
  }
  async function deleteConversation(id) {
    if (!confirm("এই চ্যাটটি ডিলিট করবেন? (Delete this conversation?)")) return;
    if (state.user) await puter.kv.del(CONV_KEY(id)); else await window.tanzirDB.del(CONV_KEY(id));
    state.conversations = state.conversations.filter((c) => c.id !== id);
    await saveIndex();
    if (state.currentId === id) {
      state.current = null; state.currentId = null;
      if (state.conversations.length) await openConversation(state.conversations[0].id);
      else newConversation();
    }
    renderConvList();
  }
  // Rename a conversation from the sidebar. Works with mouse (double-click or ✎)
  // and touch (single tap on ✎) — the previous double-click-only flow was
  // impossible to trigger on phones.
  async function renameConversation(id) {
    const entry = state.conversations.find((c) => c.id === id);
    const current = (entry && entry.title) || (state.current && state.current.id === id && state.current.title) || "Untitled";
    const next = prompt("চ্যাটের নতুন নাম লিখুন / Rename chat:", current);
    if (next === null) return;
    const title = next.trim();
    if (!title || title === current) return;
    if (entry) entry.title = title;
    try {
      if (state.current && state.current.id === id) {
        state.current.title = title;
        state.current._renamed = true;
        await saveConv(state.current, { preserveTimestamp: true });
      } else {
        const full = await loadConv(id);
        if (full) { full.title = title; full._renamed = true; await saveConv(full, { preserveTimestamp: true }); }
        else {
          state.conversations = state.conversations.map((c) => c.id === id ? { ...c, title } : c);
          await saveIndex();
        }
      }
    } catch (err) { console.error(err); }
    renderConvList();
  }
  function renderConvList() {
    convListEl.innerHTML = "";
    state.conversations.forEach((c) => {
      const div = document.createElement("div");
      div.className = "conv-item" + (c.id === state.currentId ? " active" : "");
      const titleSpan = document.createElement("span");
      titleSpan.className = "title";
      titleSpan.textContent = c.title || "Untitled";
      titleSpan.title = "ডাবল-ক্লিক বা ✎ চেপে নাম বদলান";
      const renameSpan = document.createElement("span");
      renameSpan.className = "rename";
      renameSpan.dataset.id = c.id;
      renameSpan.title = "Rename chat";
      renameSpan.setAttribute("role", "button");
      renameSpan.setAttribute("aria-label", "Rename chat");
      renameSpan.textContent = "✎";
      const delSpan = document.createElement("span");
      delSpan.className = "del";
      delSpan.dataset.id = c.id;
      delSpan.title = "Delete chat";
      delSpan.setAttribute("role", "button");
      delSpan.setAttribute("aria-label", "Delete chat");
      delSpan.textContent = "×";
      div.appendChild(titleSpan);
      const actions = document.createElement("span");
      actions.className = "conv-actions";
      actions.appendChild(renameSpan);
      actions.appendChild(delSpan);
      div.appendChild(actions);
      // click to open (action buttons have their own handlers below)
      div.addEventListener("click", (e) => {
        if (e.target.closest(".del")) { deleteConversation(e.target.closest(".del").dataset.id); return; }
        if (e.target.closest(".rename")) { e.stopPropagation(); return; }
        openConversation(c.id);
      });
      renameSpan.addEventListener("click", (e) => { e.stopPropagation(); renameConversation(c.id); });
      // double-click title also renames (desktop convenience)
      titleSpan.addEventListener("dblclick", (e) => { e.stopPropagation(); renameConversation(c.id); });
      convListEl.appendChild(div);
    });
    const countEl = $("#convCount");
    if (countEl) countEl.textContent = state.conversations.length;
    if (!state.conversations.length) {
      const empty = document.createElement("div");
      empty.className = "conv-empty";
      empty.textContent = "No saved chats yet. Send your first message to create one.";
      convListEl.appendChild(empty);
    }
  }

  // ---------- Attachments ----------
  let _attachPreviewUrl = null;
  function formatBytes(n) {
    if (!n) return "0 B";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(1) + " MB";
  }
  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = (e) => resolve(e.target.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  function readAsText(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = (e) => resolve(e.target.result);
      r.onerror = reject;
      r.readAsText(file);
    });
  }
  // Downscale photos so base64 history doesn't blow the localStorage quota.
  async function prepareImageAttachment(file, maxDim = 1280, quality = 0.85) {
    const original = await readAsDataURL(file);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const type = file.type === "image/png" ? "image/png" : "image/jpeg";
          const result = canvas.toDataURL(type, quality);
          canvas.remove();
          resolve(result);
        } catch (e) {
          resolve(original);
        }
      };
      img.onerror = () => resolve(original);
      img.src = original;
    });
  }
  function clearAttachment() {
    state.pendingAttachment = null;
    const input = $("#fileInput");
    if (input) input.value = "";
    renderAttachmentPreview(null);
  }
  function renderAttachmentPreview(file) {
    const el = $("#attachmentPreview");
    if (!el) return;
    if (_attachPreviewUrl) { URL.revokeObjectURL(_attachPreviewUrl); _attachPreviewUrl = null; }
    el.innerHTML = "";
    if (!file) { el.hidden = true; el.style.display = "none"; return; }
    el.hidden = false;
    el.style.display = "block";

    const chip = document.createElement("div");
    chip.className = "attach-chip";

    if (file.type && file.type.startsWith("image/")) {
      _attachPreviewUrl = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.className = "attach-thumb";
      img.alt = file.name || "attachment";
      img.src = _attachPreviewUrl;
      chip.appendChild(img);
    } else {
      const icon = document.createElement("span");
      icon.className = "attach-icon";
      icon.textContent = (file.name.split(".").pop() || "FILE").slice(0, 4).toUpperCase();
      chip.appendChild(icon);
    }

    const meta = document.createElement("span");
    meta.className = "attach-meta";
    const name = document.createElement("span");
    name.className = "attach-name";
    name.textContent = file.name || "attachment";
    const size = document.createElement("span");
    size.className = "attach-size";
    size.textContent = formatBytes(file.size);
    meta.appendChild(name);
    meta.appendChild(size);
    chip.appendChild(meta);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "attach-remove";
    remove.title = "Remove attachment";
    remove.textContent = "×";
    remove.addEventListener("click", clearAttachment);
    chip.appendChild(remove);

    el.appendChild(chip);
  }

  // ---------- Rendering ----------
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function renderMarkdown(text) { try { return DOMPurify.sanitize(marked.parse(text || "", { breaks: true })); } catch (e) { return escapeHtml(text || ""); } }
  function renderWelcome() {
    const div = document.createElement("div");
    div.className = "welcome";
    div.innerHTML = `
    <div class="welcome-badge">Neural interface online</div>
    <h2>What should we <span>build</span> today?</h2>
    <p>Pick any provider, keep your keys local, and start typing. Ask a question, drop a file, or launch from a prompt below.</p>
    <div class="suggestions">
      <button type="button" class="suggestion" data-prompt="Explain how large language models work, in simple terms.">Explain how LLMs work simply <span class="s-arrow">↗</span></button>
      <button type="button" class="suggestion" data-prompt="Write a clean Python script that scrapes headlines from a news site and saves them to CSV.">Write a Python web scraper <span class="s-arrow">↗</span></button>
      <button type="button" class="suggestion" data-prompt="Draft a short, professional email asking for a project deadline extension.">Draft a professional email <span class="s-arrow">↗</span></button>
      <button type="button" class="suggestion" data-prompt="বাংলায় একটি ছোট গল্প লেখো, যেখানে একজন তরুণ প্রোগ্রামার প্রথমবার নিজের অ্যাপ প্রকাশ করে।">বাংলায় একটি ছোট গল্প লেখো <span class="s-arrow">↗</span></button>
    </div>
    <div class="welcome-meta"><span>Enter to send</span><span>Shift + Enter newline</span><span>Keys stay local</span></div>`;
    messagesEl.appendChild(div);
  }

  function renderMessages() {
    stopSpeaking();
    messagesEl.innerHTML = "";
    if (!state.current) return;
    if (!state.current.messages.length) { renderWelcome(); return; }
    state.current.messages.forEach((m) => appendMessageDOM(m.role, m.content, m.images, m.reasoning));
    scrollToBottom();
  }
  function contentToText(content) {
    if (typeof content === "string") return content;
    if (content == null) return "";
    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (!part) return "";
          if (typeof part === "string") return part;
          if (part.type === "text") return part.text || "";
          return "";
        })
        .filter(Boolean)
        .join("\n\n");
    }
    return String(content);
  }
  function appendMessageDOM(role, content, images, reasoning) {
    const welcome = messagesEl.querySelector(".welcome");
    if (welcome) welcome.remove();
    const isUser = role === "user";
    const div = document.createElement("div");
    div.className = "msg " + (isUser ? "user" : "assistant");
    const roleLabel = isUser ? "You" : "Mr.Robot";
    const contentText = contentToText(content);
    const contentHtml = renderMarkdown(contentText);
    const rHtml = reasoning ? `<details class="reasoning"><summary>Reasoning</summary><div>${renderMarkdown(reasoning)}</div></details>` : "";

    const actionBtns = isUser ? "" : `
    <div class="msg-actions">
      <button type="button" class="copy-btn" title="Copy response">Copy</button>
      <button type="button" class="voice-btn" title="Read aloud" aria-label="Read aloud">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18.5 5.5a9 9 0 0 1 0 13"></path></svg>
        <span>Speak</span>
      </button>
      <button type="button" class="evo-btn" title="Teach a correction" aria-label="Teach a correction">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
        <span>Learn</span>
      </button>
    </div>`;

    div.innerHTML = `<div class="msg-head"><span class="msg-avatar">${isUser ? "U" : "AI"}</span><span class="role">${roleLabel}</span>${actionBtns}</div><div class="content">${rHtml}${contentHtml}</div>`;

    const contentDiv = div.querySelector(".content");

    if (!isUser) {
      // Voice output (browser speech synthesis).
      // Read the text from the live DOM instead of the closure: the assistant
      // bubble is created with an empty string before streaming fills it in, so
      // a captured `contentText` would stay empty and Speak would do nothing
      // until the page was reloaded.
      const voiceBtn = div.querySelector(".voice-btn");
      if (voiceBtn) voiceBtn.addEventListener("click", () => {
        const clone = contentDiv.cloneNode(true);
        clone.querySelectorAll(".reasoning").forEach((el) => el.remove());
        const liveText = clone.innerText.trim() || contentToText(content);
        speakText(liveText, voiceBtn);
      });

      // Evolution learning
      const evoBtn = div.querySelector(".evo-btn");
      if (evoBtn) evoBtn.addEventListener("click", async () => {
        const correction = prompt("AI-এর ভুলটি ধরিয়ে দিন এবং সঠিক তথ্যটি লিখুন:");
        if (!correction) return;
        const topic = contentText.slice(0, 50);
        try {
          await window.tanzirDB.saveEvolution(topic, correction);
          state.evolutions = state.evolutions || [];
          state.evolutions.push({ topic, correction, timestamp: Date.now() });
          alert("ধন্যবাদ! সংশোধনটি সংরক্ষণ করা হয়েছে — পরের চ্যাটে এটি মনে রাখা হবে।");
        } catch (e) {
          alert("সংশোধন সংরক্ষণ করা যায়নি: " + (e?.message || e));
        }
      });
    }

    // Puter file parts → filename chip
    if (Array.isArray(content)) {
      content.forEach((part) => {
        if (!part || typeof part === "string" || part.type !== "file") return;
        const path = part.puter_path || part.name || part.file_name || "attachment";
        const name = String(path).split(/[\\/]/).pop();
        const chip = document.createElement("span");
        chip.className = "file-chip";
        chip.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg><span></span>';
        chip.querySelector("span").textContent = name;
        contentDiv.appendChild(chip);
      });
    }

    // Inline images from array content + legacy images field
    const imgUrls = [];
    if (Array.isArray(content)) {
      content.forEach((part) => {
        if (!part || typeof part === "string" || part.type !== "image_url") return;
        const url = part.image_url?.url || part.url;
        if (url) imgUrls.push(url);
      });
    }
    if (images && images.length) {
      images.forEach((img) => { const url = img.image_url?.url || img.url; if (url) imgUrls.push(url); });
    }
    imgUrls.forEach((src) => {
      const el = document.createElement("img");
      el.src = src;
      el.loading = "lazy";
      el.alt = "Attached image";
      contentDiv.appendChild(el);
    });

    messagesEl.appendChild(div);
    return div;
  }
  function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

  // ---------- Provider capabilities & friendly errors ----------
  // `supportsImages` is explicit for providers we know:
  //   true  -> accepts OpenAI-style image_url content arrays
  //   false -> text-only; the UI blocks image attachments instead of sending a request
  //   unset -> unknown; try it and translate any provider rejection into a clear message
  function providerSupportsImages(provider) {
    if (!provider) return false;
    if (provider.supportsImages === true) return true;
    if (provider.supportsImages === false) return false;
    return null;
  }

  // Per-model capability: a provider may offer both vision and text-only models
  // (e.g. Puter's DeepSeek Chat). An explicit model flag wins over the provider flag.
  function modelSupportsImages(provider, modelId) {
    if (!provider) return false;
    const models = getProviderModels(provider.id);
    const wanted = String(modelId || "").trim().toLowerCase();
    const model = models.find((m) => String(m.id || "").toLowerCase() === wanted);
    if (model && typeof model.vision === "boolean") return model.vision;
    return providerSupportsImages(provider);
  }

  function friendlyModelName(provider, modelId) {
    const models = provider ? getProviderModels(provider.id) : [];
    const model = models.find((m) => String(m.id || "").toLowerCase() === String(modelId || "").toLowerCase());
    return model ? model.label : (modelId || "এই মডেল");
  }

  function firstVisionModelId(provider) {
    const models = provider ? getProviderModels(provider.id) : [];
    const model = models.find((m) => m.vision === true);
    return model ? model.id : "";
  }

  function extractApiMessage(raw) {
    const text = String(raw || "").trim();
    if (!text) return "";
    try {
      const data = JSON.parse(text);
      const err = data && data.error !== undefined ? data.error : data;
      const msg = typeof err === "string" ? err : (err && (err.message || err.msg)) || (data && data.message) || "";
      if (msg) return String(msg);
    } catch (e) { /* not JSON */ }
    return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 240);
  }

  function makeApiError(status, rawText, provider) {
    const err = new Error("HTTP " + status);
    err.status = status;
    err.raw = String(rawText || "").slice(0, 800);
    err.apiMessage = extractApiMessage(err.raw);
    err.providerId = (provider && provider.id) || "";
    err.providerLabel = (provider && provider.label) || "";
    return err;
  }

  function formatAssistantError(e, provider) {
    const label = (provider && provider.label) || "প্রোভাইডার";
    const raw = String((e && e.raw) || "");
    const detail = String((e && e.apiMessage) || "").trim();
    const imageRejected = /image|vision|content\s*(array|type)|messages\[\]/i.test(raw);
    let head = "";
    let hint = "";

    if (e && e.status === 400 && imageRejected) {
      head = `**${label}** ছবি ইনপুট সাপোর্ট করে না।`;
      hint = "ছবিটা সরিয়ে টেক্সট আকারে আবার পাঠান, অথবা **Puter / Google Gemini / OpenAI**-এর মতো ভিশন-সাপোর্টেড প্রোভাইডার বেছে নিন।";
    } else if (e && (e.status === 401 || e.status === 403)) {
      head = `**${label}**-এর API key গ্রহণ করেনি (HTTP ${e.status})।`;
      hint = "**Providers & API keys** খুলে key-টা আবার সেভ করুন — key ভুল বা মেয়াদোত্তীর্ণ হতে পারে।";
    } else if (e && e.status === 402) {
      head = `**${label}**-এ ক্রেডিট/কোটা শেষ (HTTP 402)।`;
      hint = "অন্য ফ্রি প্রোভাইডার বেছে নিন, যেমন **FLM Free** বা **OmniRoute**।";
    } else if (e && e.status === 404 && /unavailable for free|use this slug/i.test(raw)) {
      const suggested = (raw.match(/use this slug instead:?\s*([A-Za-z0-9._:\/-]+)/i) || [])[1] || "";
      head = `**${label}**-এ এই ফ্রি মডেলটি আর নেই — OpenRouter এটি বন্ধ বা পেইড করে দিয়েছে (HTTP 404)।`;
      hint = "লাইভ ফ্রি মডেল লিস্ট রিফ্রেশ করা হচ্ছে — উপরের Model ড্রপডাউন থেকে নতুন কোনো ফ্রি মডেল বেছে নিন।" +
        (suggested ? "\n\nপেইড ভার্সন চাইলে মডেল আইডি: `" + suggested + "`" : "");
      if (liveSyncSupported(provider)) fetchProviderLiveModels(provider.id, { force: true, quiet: true });
    } else if (e && e.status === 404) {
      head = `**${label}**-এ মডেল বা endpoint পাওয়া যায়নি (HTTP 404)।`;
      hint = "**Providers & API keys** থেকে অন্য মডেল বেছে নিন।";
    } else if (e && e.status === 413) {
      head = "পাঠানো ডেটা অনেক বড় (HTTP 413)।";
      hint = "ছোট ছবি বা কম টেক্সট দিয়ে আবার চেষ্টা করুন।";
    } else if (e && e.status === 429) {
      head = `**${label}**-এর রেট লিমিটে পৌঁছেছেন (HTTP 429)।`;
      hint = "কিছুক্ষণ অপেক্ষা করুন, অথবা অন্য প্রোভাইডার/মডেল বেছে নিন।";
    } else if (e && e.status >= 500) {
      head = `**${label}**-এর সার্ভারে সমস্যা হচ্ছে (HTTP ${e.status})।`;
      hint = "কিছুক্ষণ পরে আবার চেষ্টা করুন, অথবা অন্য প্রোভাইডার বেছে নিন।";
    } else if (e && e.status) {
      head = `**${label}** থেকে HTTP ${e.status} ত্রুটি এসেছে।`;
      hint = "মডেল বা প্রোভাইডার বদলে আবার চেষ্টা করুন।";
    } else if (e instanceof TypeError) {
      head = "নেটওয়ার্ক সংযোগ ব্যর্থ হয়েছে।";
      hint = "ইন্টারনেট চেক করুন। কিছু প্রোভাইডার ব্রাউজার থেকে সরাসরি কল allow করে না (CORS)।";
    } else {
      head = "উত্তর আনতে সমস্যা হয়েছে।";
      hint = "আবার চেষ্টা করুন, অথবা অন্য প্রোভাইডার বেছে নিন।";
    }

    let out = head + (hint ? "\n\n" + hint : "");
    if (detail) out += "\n\n<sub>বিস্তারিত: " + escapeHtml(detail) + "</sub>";
    return out;
  }

  // ---------- Cloud chat (OpenAI-compatible) ----------
  async function openaiChat(provider, apiMessages, opts, onChunk) {
    const key = getApiKey(provider.id);
    if (provider.needsKey && !key) throw new Error("API key missing for " + provider.label + ". Open 'Providers / API keys' and save a key.");
    const onUsage = typeof opts.onUsage === "function" ? opts.onUsage : null;
    const body = { model: opts.model, messages: apiMessages, stream: opts.stream, temperature: opts.temperature };
    if (opts.stream && onUsage) body.stream_options = { include_usage: true };
    if (opts.max_tokens > 0) body.max_tokens = opts.max_tokens;
    else if (provider.defaultMaxTokens) body.max_tokens = provider.defaultMaxTokens;
    const headers = { "Content-Type": "application/json" };
    if (provider.auth === "bearer" && key) headers["Authorization"] = "Bearer " + key;
    else if (provider.auth === "x-api-key" && key) headers["x-api-key"] = key;
    else if (provider.auth === "api-key" && key) headers["api-key"] = key;
    if (provider.extraHeaders) Object.assign(headers, provider.extraHeaders);
    const res = await fetch(provider.endpoint, { method: "POST", headers, body: JSON.stringify(body), signal: opts.signal });
    if (!res.ok) { const t = await res.text(); throw makeApiError(res.status, t, provider); }
    if (!opts.stream) {
      const data = await res.json();
      if (onUsage && data.usage) onUsage(normalizeOpenAIUsage(data.usage));
      return data.choices?.[0]?.message?.content || "";
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) onChunk(delta);
          if (json.usage && onUsage) onUsage(normalizeOpenAIUsage(json.usage));
          if (json.error) throw new Error(json.error.message || "stream error");
        } catch (e) { if (e instanceof SyntaxError) continue; throw e; }
      }
    }
  }

  // ---------- Anthropic native chat ----------
  function toAnthropicContent(content) {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return String(content ?? "");
    return content.map((part) => {
      if (!part) return null;
      if (part.type === "text") return { type: "text", text: part.text || "" };
      if (part.type === "image_url") {
        const url = part.image_url?.url || part.url || "";
        const match = /^data:(image\/[^;]+);base64,(.*)$/s.exec(url);
        if (match) return { type: "image", source: { type: "base64", media_type: match[1], data: match[2] } };
        return null;
      }
      return { type: "text", text: typeof part.text === "string" ? part.text : "" };
    }).filter(Boolean);
  }
  async function anthropicChat(provider, apiMessages, opts, onChunk) {
    const key = getApiKey(provider.id);
    if (!key) throw new Error("API key missing for " + provider.label + ".");
    const onUsage = typeof opts.onUsage === "function" ? opts.onUsage : null;
    const toUsage = (u, prevOut) => {
      u = u || {};
      const pin = Number(u.input_tokens) || (prevOut && prevOut.pin) || 0;
      const pout = Number(u.output_tokens) || (prevOut && prevOut.pout) || 0;
      const cacheRead = Number(u.cache_read_input_tokens) || (prevOut && prevOut.cacheRead) || 0;
      const cacheWrite = Number(u.cache_creation_input_tokens) || (prevOut && prevOut.cacheWrite) || 0;
      return { pin, pout, reasoning: 0, total: pin + pout, cacheRead, cacheWrite };
    };
    // separate system
    let system = "";
    const msgs = [];
    apiMessages.forEach((m) => {
      if (m.role === "system") { system += (system ? "\n" : "") + m.content; }
      else msgs.push({ role: m.role, content: toAnthropicContent(m.content) });
    });
    const body = { model: opts.model, max_tokens: opts.max_tokens > 0 ? opts.max_tokens : 4096, messages: msgs, stream: opts.stream };
    if (system) body.system = system;
    if (opts.temperature !== undefined) body.temperature = opts.temperature;
    const headers = { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" };
    const res = await fetch(provider.endpoint, { method: "POST", headers, body: JSON.stringify(body), signal: opts.signal });
    if (!res.ok) { const t = await res.text(); throw makeApiError(res.status, t, provider); }
    if (!opts.stream) {
      const data = await res.json();
      if (onUsage && data.usage) onUsage(toUsage(data.usage));
      return (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let usageSoFar = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        try {
          const json = JSON.parse(payload);
          if (json.type === "content_block_delta" && json.delta?.text) onChunk(json.delta.text);
          if (json.type === "message_start" && json.message && json.message.usage && onUsage) {
            usageSoFar = toUsage(json.message.usage);
            onUsage({ ...usageSoFar });
          }
          if (json.type === "message_delta" && json.usage && onUsage) {
            usageSoFar = toUsage(json.usage, usageSoFar);
            onUsage({ ...usageSoFar });
          }
          if (json.type === "error") throw new Error(json.error?.message || "stream error");
        } catch (e) { if (e instanceof SyntaxError) continue; throw e; }
      }
    }
  }

  // ---------- Sending ----------
  async function sendMessage() {
    if (state.sending) return;
    const text = inputEl.value.trim();
    if (!text && !state.pendingAttachment) return;
    if (!state._profileId) state._profileId = await getProfileId();
    const providers = allProviders();
    const provider = providers[state.provider];
    if (state.provider === "puter" && !state.user) {
      alert("Sign in with Puter first, or switch to a free provider.");
      return;
    }
    if (!currentModel()) {
      if (liveSyncSupported(provider)) {
        if (!getApiKey(state.provider)) alert("আগে " + (provider.label || "এই") + " API key সেভ করুন — তারপর মডেল লিস্ট অটো লোড হবে।");
        else {
          alert(provider.label + "-এর লাইভ মডেল লিস্ট এখনো লোড হয়নি। একটু অপেক্ষা করুন বা ↻ বাটনে চাপ দিন।");
          fetchProviderLiveModels(state.provider, { force: true });
        }
      } else {
        alert("এই প্রোভাইডারে কোনো মডেল পাওয়া যায়নি। অন্য প্রোভাইডার বেছে নিন বা custom model আইডি লিখুন।");
      }
      return;
    }
    if (state.pendingAttachment && (state.pendingAttachment.type || "").startsWith("image/") && modelSupportsImages(provider, currentModel()) === false) {
      alert(friendlyModelName(provider, currentModel()) + " মডেলটি ছবি পড়তে পারে না।\n\nছবিটা সরিয়ে টেক্সটে লিখুন, অথবা Puter / Google Gemini / OpenAI-এর ভিশন মডেল বেছে নিন।");
      return;
    }

    if (!state.current) newConversation();
    else stopSpeaking();
    const userMsg = { role: "user", content: text };
    if (state.pendingAttachment) {
      const file = state.pendingAttachment;
      try {
        if (state.provider === "puter") {
          const puterFile = await puter.fs.write(`attach_${Date.now()}.${file.name.split(".").pop()}`, file);
          userMsg.content = [{ type: "file", puter_path: puterFile.path }, { type: "text", text: text || "Describe this file." }];
          userMsg._attachmentPath = puterFile.path;
        } else if (file.type.startsWith("image/")) {
          const dataUrl = await prepareImageAttachment(file);
          userMsg.content = [{ type: "text", text: text || "Describe this image." }, { type: "image_url", image_url: { url: dataUrl } }];
        } else {
          const txt = await readAsText(file);
          userMsg.content = (text ? text + "\n\n" : "") + "File content:\n```\n" + txt.slice(0, 8000) + "\n```";
        }
      } catch (e) {
        console.error(e);
        alert("Attachment failed: " + (e?.message || e));
        return;
      }
    }
    state.current.messages.push(userMsg);
    const titleSource = text || (state.pendingAttachment ? state.pendingAttachment.name : "");
    if (!state.current._renamed && state.current.messages.filter((m) => m.role === "user").length === 1 && titleSource) state.current.title = titleSource.slice(0, 40);
    state.current.provider = state.provider;
    state.current.model = currentModel();

    inputEl.value = "";
    clearAttachment();
    renderMessages();

    state.sending = true;
    $("#sendBtn").disabled = true;
    $("#stopBtn").style.display = "inline-block";
    $("#typing").style.display = "block";
    updateStatus();

    const assistantDiv = appendMessageDOM("assistant", "");
    const contentDiv = assistantDiv.querySelector(".content");
    let accumulated = "";
    state.abortController = new AbortController();

    try {
      const provider = allProviders()[state.provider];
      // Pre-check: for keyed providers, ensure a key is saved before attempting the call
      if (provider && provider.needsKey) {
        const savedKey = getApiKey(state.provider);
        if (!savedKey || !savedKey.trim()) {
          throw new Error("API key missing for " + provider.label + ". Please open 'Providers / API keys', select " + provider.label + ", and save your key before sending messages.");
        }
      }
      const model = currentModel();
      const apiMessages = [];
      if (state.settings.systemPrompt) {
        let systemPrompt = state.settings.systemPrompt;
        // Apply locally saved user corrections ("Learn" button) to future chats.
        const learned = Array.isArray(state.evolutions) ? state.evolutions.slice(-20) : [];
        if (learned.length) {
          systemPrompt += "\n\nUser corrections to remember (apply when relevant):\n" +
            learned.map((item) => "- " + String(item.correction || "").trim()).filter((line) => line.length > 2).join("\n");
        }
        // Never greet twice: if the assistant already replied in this chat, suppress the salam.
        if (state.current.messages.some((m) => m.role === "assistant")) {
          systemPrompt += "\n\nCRITICAL: This is a continuing conversation. Do NOT greet the user again. Do NOT say 'Assalamu Alaikum', 'Hello', 'How can I help you', or any introduction. Do NOT repeat your name. Start directly with the answer. Match the user's language exactly.";
        }
        // Live runtime facts: the model must not guess which provider/model it is or
        // whether the selected model can read images.
        const vision = modelSupportsImages(provider, model);
        const visionLine = vision === true
          ? "supported — you CAN read and describe attached images"
          : vision === false
            ? "NOT supported by the selected model; if asked, say so and suggest a vision model (GPT / Claude / Gemini)"
            : "unknown for this model";
        systemPrompt += "\n\nRUNTIME CONTEXT (authoritative — never contradict this):\n" +
          "- Provider: " + provider.label + "\n" +
          "- Model id: " + model + "\n" +
          "- Image input: " + visionLine + "\n" +
          "If the user asks which model or provider you are using, answer with exactly the model id above. Never claim to be a different model. If they ask whether you can read images, follow the Image input line above.";
        apiMessages.push({ role: "system", content: systemPrompt });
      }
      state.current.messages.forEach((m) => {
        const { _attachmentPath, images, reasoning: _r, ...rest } = m;
        apiMessages.push(rest);
      });
      const opts = { model, stream: state.settings.streaming, signal: state.abortController.signal, temperature: state.settings.temperature, max_tokens: state.settings.maxTokens };
      // Streamed usage events may fire twice (Anthropic start/delta) — keep the
      // latest only, then accumulate once after the call finishes.
      let pendingUsage = null;
      opts.onUsage = (u) => { pendingUsage = u; };

      if (state.provider === "puter") {
        const response = await puter.ai.chat(apiMessages, { model, stream: state.settings.streaming, signal: state.abortController.signal, temperature: state.settings.temperature, ...(state.settings.maxTokens > 0 ? { max_tokens: state.settings.maxTokens } : {}) });
        if (state.settings.streaming) {
          for await (const part of response) {
            if (part.type === "error") { accumulated += "\n\n[Error: " + (part.message || "unknown") + "]"; contentDiv.innerHTML = renderMarkdown(accumulated); break; }
            if (part.type === "text" || part.text) { accumulated += part.text || ""; contentDiv.innerHTML = renderMarkdown(accumulated); scrollToBottom(); }
            if (part.usage) pendingUsage = normalizeOpenAIUsage(part.usage);
            if (part.image) { const img = document.createElement("img"); img.src = part.image.image_url?.url || part.image.url; contentDiv.appendChild(img); }
          }
        } else {
          if (response && (response.usage || response.message?.usage)) pendingUsage = normalizeOpenAIUsage(response.usage || response.message.usage);
          const msg = response?.message || response;
          accumulated = typeof msg.content === "string" ? msg.content : (Array.isArray(msg.content) ? msg.content.map((c) => c.text || "").join("") : String(msg));
          contentDiv.innerHTML = renderMarkdown(accumulated);
        }
      } else if (provider.type === "anthropic") {
        if (state.settings.streaming) await anthropicChat(provider, apiMessages, { ...opts, stream: true }, (d) => { accumulated += d; contentDiv.innerHTML = renderMarkdown(accumulated); scrollToBottom(); });
        else accumulated = await anthropicChat(provider, apiMessages, { ...opts, stream: false }, null);
        if (!state.settings.streaming) contentDiv.innerHTML = renderMarkdown(accumulated);
      } else {
        if (state.settings.streaming) await openaiChat(provider, apiMessages, { ...opts, stream: true }, (d) => { accumulated += d; contentDiv.innerHTML = renderMarkdown(accumulated); scrollToBottom(); });
        else accumulated = await openaiChat(provider, apiMessages, { ...opts, stream: false }, null);
        if (!state.settings.streaming) contentDiv.innerHTML = renderMarkdown(accumulated);
      }

      if (pendingUsage) addUsage(state.current, pendingUsage, modelMeta(state.provider, model));
      state.current.messages.push({ role: "assistant", content: accumulated });
      await saveConv(state.current);
      renderStats();
    } catch (e) {
      console.error(e);
      if (e?.name === "AbortError") {
        contentDiv.innerHTML = renderMarkdown(accumulated + "\n\n_(stopped)_");
        state.current.messages.push({ role: "assistant", content: accumulated });
        await saveConv(state.current);
      } else {
        const errText = (accumulated ? accumulated + "\n\n---\n\n" : "") + "⚠️ **উত্তর সম্পূর্ণ হয়নি**\n\n" + formatAssistantError(e, allProviders()[state.provider]);
        contentDiv.innerHTML = renderMarkdown(errText);
        state.current.messages.push({ role: "assistant", content: errText });
        await saveConv(state.current);
      }
    } finally {
      state.sending = false;
      state.abortController = null;
      $("#sendBtn").disabled = false;
      $("#stopBtn").style.display = "none";
      $("#typing").style.display = "none";
      scrollToBottom();
      localStorage.setItem(PROVIDER_KEY, state.provider);
      localStorage.setItem(MODEL_KEY, state.model);
      updateStatus();
    }
  }

  // ---------- Custom providers management ----------
  // ---------- API key management (Settings only) ----------
  // API keys are saved from Settings → "API keys & connections". Saving goes
  // through saveProviderKey: it persists the key (localStorage, per-browser
  // vault), refreshes the live model list for that provider, and — for the
  // current provider — switches the history scope to the new key. Removing a
  // key reverts that provider to its template list. Keys never leave the browser.
  async function saveProviderKey(providerId, key) {
    const provider = allProviders()[providerId];
    if (!provider) return;
    const isCurrent = state.provider === providerId;
    if (isCurrent && state.current && state.current.messages.length) { try { await saveConv(state.current); } catch (e) {} }
    saveApiKey(providerId, key || "");
    if (isCurrent) {
      state._profileId = await getProfileId();
      state.current = null; state.currentId = null;
      await loadConversations();
      // Repopulate immediately so the boxes match the new key state (template /
      // placeholder when the key is gone or changed) — never show the previous
      // key's model list.
      populateModels();
      updateApiKeyRow();
      const input = $("#apiKeyInput");
      if (input) input.value = key || "";
      const status = $("#apiKeyStatus");
      if (status) status.textContent = key ? "✓ saved" : (provider.hint || "");
      // Free models auto-select after refresh: fetch replaces the template and
      // populateModels falls back to the first live free model.
      if (key) fetchProviderLiveModels(providerId, { force: true });
    } else if (key) {
      fetchProviderLiveModels(providerId, { force: true });
    }
    renderConnectionList();
  }

  // Settings → "API keys & connections": every provider at a glance, with
  // connection status and per-provider key save/remove + model refresh.
  function renderConnectionList() {
    const list = $("#connectionList");
    if (!list) return;
    list.innerHTML = "";
    const providers = allProviders();
    const ids = Object.keys(providers);
    // Default (current) first, then the rest in builtin order.
    ids.sort((a, b) => (a === state.provider ? -1 : b === state.provider ? 1 : ids.indexOf(a) - ids.indexOf(b)));
    ids.forEach((id) => {
      const p = providers[id];
      const row = document.createElement("div");
      row.className = "conn-row" + (id === state.provider ? " current" : "");
      let statusHtml, keyHtml = "";
      const key = getApiKey(id);
      const live = liveModelsEntry(id);
      const st = modelSyncStateFor(id);
      const chip = (txt) => `<span class="conn-chip">${escapeHtml(txt)}</span>`;
      if (!p.needsKey) {
        if (id === "puter") {
          statusHtml = state.user
            ? `<span class="conn-dot ok" title="Puter sign-in active"></span><span class="conn-name">${escapeHtml(p.label)}</span><span class="conn-state ok">● Connected</span>`
            : `<span class="conn-dot warn" title="Puter needs sign-in"></span><span class="conn-name">${escapeHtml(p.label)}</span><span class="conn-state warn">● Sign-in needed</span>`;
        } else {
          statusHtml = `<span class="conn-dot ok"></span><span class="conn-name">${escapeHtml(p.label)}</span><span class="conn-state ok">● Connected</span>`;
        }
        keyHtml = `<span class="muted">API key লাগে না</span>`;
      } else if (!key) {
        statusHtml = `<span class="conn-dot off"></span><span class="conn-name">${escapeHtml(p.label)}</span><span class="conn-state off">● Key needed</span>`;
        keyHtml = `<input type="password" class="conn-input" data-provider="${id}" placeholder="Paste API key…" autocomplete="off" /><button class="secondary-btn small conn-save" data-provider="${id}">Save</button>`;
      } else {
        const models = getProviderModels(id);
        const frees = models.filter(isFreeModel).length;
        const countTxt = live ? frees + " free + " + (models.length - frees) + " live" : models.length + " মডেল (template)";
        const bad = st === "error";
        statusHtml = `<span class="conn-dot${bad ? " warn" : " ok"}"></span><span class="conn-name">${escapeHtml(p.label)}</span><span class="conn-state${bad ? " warn" : " ok"}">${bad ? "● Key issue" : "● Connected"}</span>${chip(countTxt)}`;
        keyHtml = `<input type="password" class="conn-input" data-provider="${id}" value="${escapeHtml(key)}" autocomplete="off" />
        <button class="secondary-btn small conn-save" data-provider="${id}">Save</button>
        <button class="secondary-btn small conn-remove" data-provider="${id}">Remove</button>` +
          (liveSyncSupported(p) ? `<button class="icon-btn small conn-refresh" data-provider="${id}" title="লাইভ মডেল রিফ্রেশ">↻</button>` : "");
      }
      row.innerHTML = `<div class="conn-top">${statusHtml}</div><div class="conn-controls">${keyHtml}</div>`;
      list.appendChild(row);
    });
    list.querySelectorAll(".conn-save").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = list.querySelector(`.conn-input[data-provider="${btn.dataset.provider}"]`);
        saveProviderKey(btn.dataset.provider, (input && input.value || "").trim());
      });
    });
    list.querySelectorAll(".conn-remove").forEach((btn) => {
      btn.addEventListener("click", () => saveProviderKey(btn.dataset.provider, ""));
    });
    list.querySelectorAll(".conn-refresh").forEach((btn) => {
      btn.addEventListener("click", () => fetchProviderLiveModels(btn.dataset.provider, { force: true }));
    });
  }

  function renderProviderList() {  const list = $("#providerList");
    list.innerHTML = "";
    CUSTOM_PROVIDERS.forEach((cp, idx) => {
      const div = document.createElement("div");
      div.className = "provider-item";
      div.innerHTML = `<span>${escapeHtml(cp.label)} <small class="muted">(${cp.type})</small></span><button class="secondary-btn small" data-idx="${idx}">Delete</button>`;
      div.querySelector("button").addEventListener("click", () => {
        CUSTOM_PROVIDERS.splice(idx, 1);
        localStorage.setItem(CUSTOM_PROVIDERS_KEY, JSON.stringify(CUSTOM_PROVIDERS));
        renderProviderList();
        populateProviders();
        populateModels();
      });
      list.appendChild(div);
    });
    if (!CUSTOM_PROVIDERS.length) list.innerHTML = '<p class="muted">No custom providers yet.</p>';
  }

  // ---------- Events ----------
  function wireEvents() {
    // mobile sidebar drawer
    const sidebar = $("#sidebar");
    const overlay = $("#overlay");
    const hamburger = $("#hamburgerBtn");
    function closeSidebar() { sidebar.classList.remove("open"); overlay.classList.remove("show"); }
    function openSidebar() { sidebar.classList.add("open"); overlay.classList.add("show"); }
    if (hamburger) hamburger.addEventListener("click", openSidebar);
    if (overlay) overlay.addEventListener("click", closeSidebar);
    window.addEventListener("resize", () => { if (window.innerWidth > 768) closeSidebar(); });
    convListEl.addEventListener("click", (e) => {
      // rename/delete buttons keep the sidebar open so the prompt/confirm is visible
      if (e.target.closest(".rename") || e.target.closest(".del")) return;
      if (window.innerWidth <= 768) closeSidebar();
    });
    $("#newChatBtn").addEventListener("click", () => { if (state.sending) return; newConversation(true); clearAttachment(); if (window.innerWidth <= 768) closeSidebar(); });

    // (PIN lock removed — history is scoped per browser + API key)

    $("#signInBtn").addEventListener("click", async () => {
      try { await puter.auth.signIn({ attempt_temp_user_creation: true }); await refreshAuth(); }
      catch (e) { console.error(e); alert("Sign in failed: " + (e?.message || e)); }
    });
    $("#signOutBtn").addEventListener("click", async () => { await puter.auth.signOut(); await refreshAuth(); });

    $("#closeSettingsBtn").addEventListener("click", () => { $("#settingsModal").style.display = "none"; });
    $("#saveSettingsBtn").addEventListener("click", () => { saveSettings(); $("#settingsModal").style.display = "none"; });
    $("#temperature").addEventListener("input", (e) => { $("#tempVal").textContent = e.target.value; });

    $("#providersBtn").addEventListener("click", () => { closeSidebar(); renderProviderList(); $("#providersModal").style.display = "flex"; });
    $("#closeProvidersBtn").addEventListener("click", () => { $("#providersModal").style.display = "none"; });
    $("#developerBtn").addEventListener("click", () => { closeSidebar(); $("#developerModal").style.display = "flex"; });
    $("#reloadUpdateBtn").addEventListener("click", applyUpdateAndReload);
    $("#installAppBtn").addEventListener("click", installApp);
    $("#dismissUpdateBtn").addEventListener("click", () => {
      updateDismissedVersion = (($("#updateVersion")?.textContent || "").replace(/^v/, "")) || updateDismissedVersion;
      try { if (updateDismissedVersion) localStorage.setItem(UPDATE_DISMISS_KEY, updateDismissedVersion); } catch (e) {}
      hideUpdateToast();
    });
    document.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => { const m = $("#" + btn.dataset.close); if (m) m.style.display = "none"; });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      $("#settingsModal").style.display = "none";
      $("#providersModal").style.display = "none";
      $("#developerModal").style.display = "none";
      closeSidebar();
    });
    $("#addProviderBtn").addEventListener("click", async () => {
      const name = $("#cpName").value.trim();
      const endpoint = $("#cpEndpoint").value.trim();
      if (!name || !endpoint) { alert("Name and endpoint are required."); return; }
      const models = $("#cpModels").value.split(",").map((s) => s.trim()).filter(Boolean).map((id) => ({ id, label: id }));
      const cp = {
        id: "custom_" + Date.now().toString(36),
        label: name,
        type: $("#cpType").value,
        needsKey: $("#cpAuth").value !== "none",
        auth: $("#cpAuth").value,
        endpoint,
        models,
        hint: "Custom provider",
      };
      const key = $("#cpKey").value.trim();
      // persist the current chat under the OLD provider scope first
      if (state.current && state.current.messages.length) { try { await saveConv(state.current); } catch(e){} }
      if (key) saveApiKey(cp.id, key);
      CUSTOM_PROVIDERS.push(cp);
      localStorage.setItem(CUSTOM_PROVIDERS_KEY, JSON.stringify(CUSTOM_PROVIDERS));
      renderProviderList();
      populateProviders();
      state.provider = cp.id;
      providerSelect.value = cp.id;
      populateModels();
      updateApiKeyRow();
      state._profileId = await getProfileId();
      state.current = null; state.currentId = null;
      await loadConversations();
      // reset form
      $("#cpName").value = ""; $("#cpEndpoint").value = ""; $("#cpModels").value = ""; $("#cpKey").value = "";
    });

    providerSelect.addEventListener("change", async () => {
      // persist the current chat under the OLD provider/key scope first
      if (state.current && state.current.messages.length) { try { await saveConv(state.current); } catch(e){} }
      state.provider = providerSelect.value;
      const p = allProviders()[state.provider];
      state.model = (getProviderModels(state.provider)[0]?.id) || state.model;
      populateModels();
      updateApiKeyRow();
      // recompute profile scope for the new provider
      state._profileId = await getProfileId();
      // switch history scope to this provider/key
      state.current = null; state.currentId = null;
      await loadConversations();
      // Live model list (cached for 6h, refreshed in background)
      if (liveSyncSupported(p) && getApiKey(state.provider)) fetchProviderLiveModels(state.provider);
    });
    // Both model boxes share one selection: picking in either sets the model
    // and parks the other box at its placeholder.
    const syncBoxSelection = (sourceSel, otherSel, sourceBox, otherBox) => {
      if (otherSel) otherSel.selectedIndex = 0; // placeholder option
      state.model = currentModel();
      if (state.current) state.current.model = state.model;
      localStorage.setItem(MODEL_KEY, state.model);
      sourceBox.classList.add("active"); sourceBox.classList.remove("dormant");
      otherBox.classList.add("dormant"); otherBox.classList.remove("active");
      renderStats();
    };
    modelSelect.addEventListener("change", () => syncBoxSelection(modelSelect, $("#paidModelSelect"), $("#freeModelBox"), $("#paidModelBox")));
    const paidSelect = $("#paidModelSelect");
    if (paidSelect) paidSelect.addEventListener("change", () => syncBoxSelection(paidSelect, modelSelect, $("#paidModelBox"), $("#freeModelBox")));
    $("#toggleCustomModel").addEventListener("click", () => toggleCustomModel());
    const statsBtn = $("#statsBtn");
    if (statsBtn) statsBtn.addEventListener("click", () => { renderConnectionList(); renderStats(); $("#settingsModal").style.display = "flex"; });
    // Always-visible key setup entry: opens Settings straight at the connections.
    const keyTopBtn = $("#apiKeyBtnTop");
    if (keyTopBtn) keyTopBtn.addEventListener("click", () => {
      renderConnectionList(); renderStats(); $("#settingsModal").style.display = "flex";
      requestAnimationFrame(() => {
        const target = $("#connDivider") || $("#connectionList");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    const refreshModelsBtn = $("#refreshModelsBtn");
    if (refreshModelsBtn) refreshModelsBtn.addEventListener("click", () => fetchProviderLiveModels(state.provider, { force: true }));

    // API keys are managed from Settings (API keys & connections) only.
    // Per-provider key entry in the topbar (current provider only) + Settings
    // list (all providers). Both go through saveProviderKey.
    const saveApiKeyBtn = $("#saveApiKeyBtn");
    if (saveApiKeyBtn) saveApiKeyBtn.addEventListener("click", () => saveProviderKey(state.provider, $("#apiKeyInput").value.trim()));
    const apiKeyInput = $("#apiKeyInput");
    if (apiKeyInput) apiKeyInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); saveProviderKey(state.provider, apiKeyInput.value.trim()); } });
    if (apiKeyInput) apiKeyInput.addEventListener("input", () => {
      const toggleBtn = $("#toggleKeyVisibility");
      if (toggleBtn) toggleBtn.style.display = apiKeyInput.value ? "inline-flex" : "none";
    });
    const toggleKeyVisibility = $("#toggleKeyVisibility");
    if (toggleKeyVisibility) toggleKeyVisibility.addEventListener("click", () => {
      const input = $("#apiKeyInput");
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggleKeyVisibility.textContent = show ? "🙈" : "👁";
      toggleKeyVisibility.title = show ? "Hide key" : "Show key";
    });
    const clearApiKeyBtn = $("#clearApiKeyBtn");
    if (clearApiKeyBtn) clearApiKeyBtn.addEventListener("click", () => {
      if (!confirm("এই provider-এর সেভ করা API key মুছে ফেলবেন? (Remove the saved key?)")) return;
      saveProviderKey(state.provider, "");
    });
    $("#settingsBtn").addEventListener("click", () => {
      closeSidebar(); renderConnectionList(); renderStats(); $("#settingsModal").style.display = "flex";
      requestAnimationFrame(() => {
        const target = $("#connDivider") || $("#connectionList");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    $("#composer").addEventListener("submit", (e) => { e.preventDefault(); sendMessage(); });
    $("#sendBtn").addEventListener("click", (e) => { e.preventDefault(); sendMessage(); });
    $("#fileInput").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const isImage = (file.type || "").startsWith("image/");
      const isText = (file.type || "").startsWith("text/") || /\.(txt|md|markdown|json|csv|tsv|js|mjs|ts|jsx|tsx|html|css|xml|yml|yaml|log|py|java|c|cpp|h|cs|go|rs|php|rb|sh|ps1|ini|conf|env)$/i.test(file.name || "");
      if (!isImage && !isText && state.provider !== "puter") {
        alert("This provider can only read images and text-based files. Switch to Puter to upload PDFs or Office documents.");
        e.target.value = "";
        return;
      }
      const provider = allProviders()[state.provider];
      if (isImage && providerSupportsImages(provider) === false) {
        alert(provider.label + " ছবি পড়তে পারে না।\n\nছবিটা সরিয়ে টেক্সটে লিখুন, অথবা Puter / Google Gemini / OpenAI বেছে নিন।");
        e.target.value = "";
        return;
      }
      if (isImage && modelSupportsImages(provider, currentModel()) === false) {
        const alt = firstVisionModelId(provider);
        const currentLabel = friendlyModelName(provider, currentModel());
        if (!alt) {
          alert(currentLabel + " মডেলটি ছবি পড়তে পারে না।\n\nঅন্য কোনো ভিশন-সাপোর্টেড মডেল বা প্রোভাইডার বেছে নিন।");
          e.target.value = "";
          return;
        }
        const ok = confirm(currentLabel + " মডেলটি ছবি পড়তে পারে না।\n\n" + friendlyModelName(provider, alt) + " মডেলে সুইচ করে ছবিটা অ্যাটাচ করবেন?");
        if (!ok) { e.target.value = ""; return; }
        state.model = alt;
        populateModels();
        modelSelect.value = alt;
        localStorage.setItem(MODEL_KEY, alt);
        updateStatus();
      }
      state.pendingAttachment = file;
      renderAttachmentPreview(file);
      e.target.value = "";
    });
    inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    inputEl.addEventListener("input", () => { inputEl.style.height = "auto"; inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + "px"; updateMicTitle(); });
    initVoiceInput();


    // welcome suggestions + copy assistant response
    messagesEl.addEventListener("click", async (e) => {
      const suggestion = e.target.closest(".suggestion");
      if (suggestion) {
        inputEl.value = suggestion.dataset.prompt || suggestion.textContent.replace("↗", "").trim();
        inputEl.focus();
        inputEl.dispatchEvent(new Event("input"));
        return;
      }
      const copyBtn = e.target.closest(".copy-btn");
      if (!copyBtn) return;
      const content = copyBtn.closest(".msg")?.querySelector(".content");
      if (!content) return;
      try {
        await navigator.clipboard.writeText(content.innerText.trim());
        const prev = copyBtn.textContent;
        copyBtn.textContent = "Copied";
        setTimeout(() => { copyBtn.textContent = prev; }, 1400);
      } catch (err) {
        copyBtn.textContent = "Failed";
        setTimeout(() => { copyBtn.textContent = "Copy"; }, 1400);
      }
    });

    $("#stopBtn").addEventListener("click", () => { if (state.abortController) state.abortController.abort(); });
  }

  // ---------- Voice input (browser speech recognition) ----------
  // The 🎤 button in the composer turns speech into text. Works in Chrome,
  // Edge, and most Android browsers; iOS Safari supports it from 14.5+ behind
  // the webkit prefix. If the browser has no recogniser we say so clearly
  // instead of failing silently.
  // Language is auto-detected from what you type / your recent messages / the
  // browser language. There is no manual picker: whichever script dominates the
  // text wins, so an English reply that merely contains “তানজীর” stays English.
  function detectLanguageFromText(text) {
    const s = String(text || "");
    const count = (re) => (s.match(re) || []).length;
    const bengali = count(/[\u0980-\u09FF]/g);
    const devanagari = count(/[\u0900-\u097F]/g);
    const arabic = count(/[\u0600-\u06FF]/g);
    const han = count(/[\u4E00-\u9FFF]/g);
    const kana = count(/[\u3040-\u30FF]/g);
    const hangul = count(/[\uAC00-\uD7AF]/g);
    const cyrillic = count(/[\u0400-\u04FF]/g);
    const thai = count(/[\u0E00-\u0E7F]/g);
    const latin = count(/[A-Za-z]/g);
    const max = Math.max(bengali, devanagari, arabic, han, kana, hangul, cyrillic, thai, latin);
    if (max < 2) return "";
    if (bengali === max) return "bn-BD";
    if (devanagari === max) return "hi-IN";
    if (arabic === max) {
      // Urdu-only letters distinguish اردو from العربية.
      return /[\u0679\u0688\u0691\u06BA\u06D2]/.test(s) ? "ur-PK" : "ar-SA";
    }
    if (kana > 0 && kana >= max) return "ja-JP";
    if (han === max) return "zh-CN";
    if (hangul === max) return "ko-KR";
    if (cyrillic === max) return "ru-RU";
    if (thai === max) return "th-TH";
    if (latin === max) return "en-US";
    return "";
  }
  function resolveSpeechLang() {
    const typed = detectLanguageFromText(inputEl.value);
    if (typed) return typed;
    if (state.current && Array.isArray(state.current.messages)) {
      const recent = state.current.messages.filter((m) => m.role === "user").slice(-3).reverse();
      for (const msg of recent) {
        const text = typeof msg.content === "string"
          ? msg.content
          : (Array.isArray(msg.content) ? msg.content.map((p) => (p && p.text) || "").join(" ") : "");
        const detected = detectLanguageFromText(text);
        if (detected) return detected;
      }
    }
    const nav = String(navigator.language || "en-US");
    const base = nav.split("-")[0].toLowerCase();
    const byBase = { bn: "bn-BD", hi: "hi-IN", ur: "ur-PK", ar: "ar-SA", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR", ru: "ru-RU", th: "th-TH", en: nav };
    return byBase[base] || "en-US";
  }
  let _recognition = null;
  let _listening = false;
  let _voiceBaseText = "";
  function initVoiceInput() {
    const btn = $("#micBtn");
    if (!btn) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      btn.addEventListener("click", () => {
        alert("এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়।\n\nChrome / Edge / Android Chrome ব্যবহার করুন, অথবা কীবোর্ডের 🎤 বাটন দিয়ে লিখুন।");
      });
      btn.classList.add("unsupported");
      btn.title = "Voice input is not supported in this browser";
      return;
    }
    updateMicTitle();
    const resetBtn = () => {
      _listening = false;
      _recognition = null;
      btn.classList.remove("listening");
      btn.setAttribute("aria-pressed", "false");
      updateMicTitle();
    };
    btn.addEventListener("click", () => {
      if (_listening && _recognition) {
        try { _recognition.stop(); } catch (e) {}
        return;
      }
      // Chrome throws "already started" when a recogniser is reused; create one
      // per session instead.
      let rec;
      try { rec = new SR(); } catch (e) { alert("ভয়েস ইনপুট চালু করা যায়নি: " + (e?.message || e)); return; }
      rec.lang = resolveSpeechLang();
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      _voiceBaseText = inputEl.value.trim();
      let finalText = "";
      rec.onstart = () => {
        _listening = true;
        btn.classList.add("listening");
        btn.setAttribute("aria-pressed", "true");
        btn.title = "শুনছি… থামাতে আবার চাপুন / Listening… tap to stop";
      };
      rec.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0].transcript;
          else interim += result[0].transcript;
        }
        const combined = (finalText + (interim ? " " + interim : "")).trim();
        inputEl.value = (_voiceBaseText ? _voiceBaseText + " " : "") + combined;
        inputEl.dispatchEvent(new Event("input"));
        updateMicTitle();
      };
      rec.onerror = (event) => {
        const code = event.error || "unknown";
        if (code === "not-allowed" || code === "service-not-allowed") {
          alert("মাইক্রোফোনের অনুমতি দিন (ব্রাউজার address bar-এর 🔒/🎤 আইকন) — তারপর আবার চেষ্টা করুন।");
        } else if (code === "language-not-supported") {
          alert("এই ভাষায় ভয়েস রিকগনিশন সাপোর্ট করছে না।\n\nSettings → Voice input language থেকে English (US) বেছে নিন অথবা অন্য ভাষা ট্রাই করুন।");
        } else if (code === "audio-capture") {
          alert("কোনো মাইক্রোফোন পাওয়া যায়নি — ডিভাইসে মাইক আছে কি না দেখুন।");
        } else if (code !== "aborted" && code !== "no-speech") {
          console.warn("Speech recognition error:", code);
        }
      };
      rec.onend = () => {
        resetBtn();
        inputEl.focus();
      };
      _recognition = rec;
      try { rec.start(); }
      catch (e) { resetBtn(); console.warn("Could not start speech recognition:", e); }
    });
  }

  // ---------- Voice output (browser speech synthesis) ----------
  // Chrome truncates very long utterances, so text is split into sentence-sized
  // chunks and queued. Tapping Speak again stops playback. The implementation is
  // deliberately defensive: mobile browsers sometimes ignore the first speak()
  // call, keep `onend` from firing, or leave a stale "speaking" button behind.
  let _speechActiveBtn = null;
  let _speechToken = 0;
  let _speechGuard = null;
  let _speechHintShown = false;
  // SpeechSynthesisUtterance objects must stay referenced until they finish —
  // some browsers garbage-collect a local utterance and the audio never plays.
  let _speechKeepAlive = [];
  function showSpeakHint() {
    if (document.querySelector(".speak-hint")) return;
    const hint = document.createElement("div");
    hint.className = "speak-hint";
    hint.setAttribute("role", "status");
    hint.innerHTML = "🔇 শব্দ শুনছেন না? ফোন/পিসির <b>মিডিয়া ভলিউম</b> বাড়ান, <b>Silent mode</b> বন্ধ করুন, অথবা Chrome / Edge ব্যবহার করুন।";
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 8000);
  }
  function splitForSpeech(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return [];
    if (clean.length <= 180) return [clean];
    const chunks = [];
    let buffer = "";
    // Avoid lookbehind regex (not supported by older iOS Safari).
    const sentences = clean.match(/[^.!?।]+[.!?।]*/g) || [clean];
    sentences.forEach((sentence) => {
      if (!sentence) return;
      if ((buffer + " " + sentence).trim().length > 180 && buffer) {
        chunks.push(buffer.trim());
        buffer = sentence;
      } else {
        buffer = (buffer + " " + sentence).trim();
      }
    });
    if (buffer) chunks.push(buffer.trim());
    // Very long single "sentences" get hard-wrapped too.
    return chunks.flatMap((c) => c.length > 180 ? (c.match(/.{1,180}(\s|$)/g) || []).map((s) => s.trim()).filter(Boolean) : [c]);
  }
  function pickSpeechVoice(lang, voices) {
    const list = voices || (window.speechSynthesis.getVoices() || []);
    const wanted = String(lang || "").toLowerCase();
    const base = wanted.split("-")[0];
    const norm = (v) => String(v.lang || "").replace("_", "-").toLowerCase();
    const exact = list.filter((v) => norm(v) === wanted);
    const sameBase = list.filter((v) => norm(v).startsWith(base + "-") || norm(v) === base);
    // Prefer on-device voices: some Android builds have network voices that
    // report success but produce no sound.
    return exact.find((v) => v.localService) || exact[0]
      || sameBase.find((v) => v.localService) || sameBase[0]
      || null;
  }
  function detectSpeechLang(text) {
    return detectLanguageFromText(text) || resolveSpeechLang();
  }
  function restoreSpeechBtn(btn) {
    if (!btn) return;
    btn.classList.remove("speaking");
    if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
  }
  function stopSpeaking() {
    _speechToken++;
    if (_speechGuard) { clearInterval(_speechGuard); _speechGuard = null; }
    _speechKeepAlive = [];
    try { window.speechSynthesis.cancel(); } catch (e) {}
    if (_speechActiveBtn) { restoreSpeechBtn(_speechActiveBtn); _speechActiveBtn = null; }
  }
  function speakText(text, btn) {
    const spoken = String(text || "").trim();
    if (!spoken) return;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      alert("এই ব্রাউজারে ভয়েস আউটপুট সমর্থিত নয়। Chrome / Edge ব্যবহার করে দেখুন।");
      return;
    }
    // Toggle only when audio is actually playing — a stale `.speaking` class
    // (when Chrome skips onend) must not swallow the user's tap.
    if (btn && btn.classList.contains("speaking") && (synth.speaking || synth.pending)) {
      stopSpeaking();
      return;
    }
    if (synth.speaking || synth.pending) {
      stopSpeaking();
      // Chrome has a cancel → speak race; give the cancel a tick to settle.
      setTimeout(() => startSpeaking(spoken, btn), 80);
    } else {
      startSpeaking(spoken, btn);
    }
  }
  function startSpeaking(spoken, btn) {
    const synth = window.speechSynthesis;
    const token = ++_speechToken;
    const lang = detectSpeechLang(spoken);
    if (btn) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.classList.add("speaking");
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg><span>Stop</span>';
      _speechActiveBtn = btn;
    }
    const chunks = splitForSpeech(spoken);
    const voices = synth.getVoices() || [];
    const voice = pickSpeechVoice(lang, voices);
    let started = false;
    try { synth.resume(); } catch (e) {}
    try {
      chunks.forEach((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = lang;
        if (voice) utterance.voice = voice;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onstart = () => { started = true; };
        utterance.onend = utterance.onerror = () => {
          _speechKeepAlive = _speechKeepAlive.filter((u) => u !== utterance);
        };
        utterance.onerror = (event) => {
          _speechKeepAlive = _speechKeepAlive.filter((u) => u !== utterance);
          const code = event && event.error;
          // Retry without forcing a voice — a missing/remote voice can fail
          // silently on Android while the default voice works.
          if (code === "not-allowed" || code === "audio-busy" || code === "synthesis-failed") {
            try {
              const retry = new SpeechSynthesisUtterance(chunk);
              retry.lang = lang;
              retry.volume = 1;
              retry.onstart = () => { started = true; };
              retry.onend = () => { _speechKeepAlive = _speechKeepAlive.filter((u) => u !== retry); };
              _speechKeepAlive.push(retry);
              synth.speak(retry);
            } catch (e) {}
          }
        };
        if (index === chunks.length - 1) {
          utterance.onend = () => {
            _speechKeepAlive = _speechKeepAlive.filter((u) => u !== utterance);
            if (token !== _speechToken) return;
            const active = _speechActiveBtn;
            _speechActiveBtn = null;
            restoreSpeechBtn(active);
          };
        }
        _speechKeepAlive.push(utterance);
        synth.speak(utterance);
      });
    } catch (e) {
      console.error(e);
      const active = _speechActiveBtn;
      _speechActiveBtn = null;
      restoreSpeechBtn(active);
      alert("ভয়েস আউটপুট চালু করা যায়নি: " + (e?.message || e));
      return;
    }
    // Mobile browsers sometimes ignore the first queue silently. Retry once
    // after a short delay, then show a helpful hint if there is still no audio.
    setTimeout(() => {
      if (token !== _speechToken) return;
      if (!started && !synth.speaking && !synth.pending) {
        try { synth.resume(); } catch (e) {}
        try {
          const retry = new SpeechSynthesisUtterance(chunks[0] || spoken);
          retry.lang = lang;
          retry.volume = 1;
          retry.onstart = () => { started = true; };
          retry.onend = () => { _speechKeepAlive = _speechKeepAlive.filter((u) => u !== retry); };
          _speechKeepAlive.push(retry);
          synth.speak(retry);
        } catch (e) {}
      }
    }, 900);
    // Keep the button in sync even when onend never fires (Chrome bug).
    const startedAt = Date.now();
    if (_speechGuard) clearInterval(_speechGuard);
    _speechGuard = setInterval(() => {
      if (token !== _speechToken) {
        clearInterval(_speechGuard); _speechGuard = null; return;
      }
      if (!synth.speaking && !synth.pending) {
        clearInterval(_speechGuard); _speechGuard = null;
        const active = _speechActiveBtn;
        _speechActiveBtn = null;
        restoreSpeechBtn(active);
        if (!started && !_speechHintShown && Date.now() - startedAt > 1500) {
          _speechHintShown = true;
          showSpeakHint();
        }
      }
    }, 700);
  }

  // ---------- Local "Learn" corrections ----------
  async function loadEvolutions() {
    try {
      state.evolutions = (await window.tanzirDB.getAllEvolutions()) || [];
    } catch (e) {
      state.evolutions = [];
    }
  }

  // ---------- Brick loader ----------
  function hideBrickLoader() {
    const el = $("#brickLoader");
    if (el) { el.style.display = "none"; }
  }

  // ---------- Service Worker (PWA / offline cache) ----------
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
    });
  }

  // ---------- PWA install prompt (Chrome/Edge/Windows/Android/iOS) ----------
  let deferredInstallPrompt = null;
  let installPromptShown = false;

  function showInstallPrompt() {
    const btn = $("#installAppBtn");
    if (btn) btn.hidden = false;
  }

  async function installApp() {
    if (!deferredInstallPrompt) return;
    const btn = $("#installAppBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Installing…"; }
    try {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === "accepted") installPromptShown = true;
    } catch (e) {
      // install cancelled or failed
    } finally {
      deferredInstallPrompt = null;
      const btn2 = $("#installAppBtn");
      if (btn2) btn2.hidden = true;
    }
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (!installPromptShown) showInstallPrompt();
  });

  // ---------- Version / update notice ----------
  // Compares the running version with version.json. After the developer pushes a new
  // release, the next time a user opens/focuses the app a popup lists what changed and
  // offers a one-click reload. Chat history lives in IndexedDB, so it survives reloads.
  const UPDATE_CHECK_INTERVAL = 3 * 60 * 1000;
  const UPDATE_DISMISS_KEY = STORAGE_PREFIX + "updateDismissed";
  let updateChecking = false;
  let updateDismissedVersion = "";
  try { updateDismissedVersion = localStorage.getItem(UPDATE_DISMISS_KEY) || sessionStorage.getItem(UPDATE_DISMISS_KEY) || ""; } catch (e) { updateDismissedVersion = ""; }
  function persistUpdateDismissed(version) {
    if (!version) return;
    updateDismissedVersion = version;
    try { localStorage.setItem(UPDATE_DISMISS_KEY, version); } catch (e) {}
  }

  function versionParts(v) {
    return String(v || "").replace(/^v/i, "").split(".").map((part) => parseInt(part, 10) || 0);
  }
  function isNewerVersion(remote, current) {
    const a = versionParts(remote);
    const b = versionParts(current);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] || 0;
      const y = b[i] || 0;
      if (x !== y) return x > y;
    }
    return false;
  }
  function updateNoteList(data) {
    if (!data) return [];
    if (Array.isArray(data.notes)) return data.notes.map((n) => String(n).trim()).filter(Boolean);
    const raw = String(data.note || "").trim();
    if (!raw) return [];
    const parts = raw.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : [raw];
  }

  function showUpdateToast(version, notes) {
    const toast = $("#updateToast");
    if (!toast) return;
    const label = $("#updateVersion");
    if (label) label.textContent = "v" + version;
    const from = $("#updateFromVersion");
    if (from) from.textContent = "v" + APP_VERSION;
    const list = $("#updateNotes");
    if (list) {
      list.innerHTML = "";
      const items = Array.isArray(notes) ? notes : [];
      if (items.length) {
        items.forEach((note) => {
          const li = document.createElement("li");
          li.textContent = note;
          list.appendChild(li);
        });
        list.hidden = false;
      } else {
        list.hidden = true;
      }
    }
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("show"));
  }

  function hideUpdateToast() {
    const toast = $("#updateToast");
    if (!toast) return;
    toast.classList.remove("show");
    setTimeout(() => { toast.hidden = true; }, 180);
  }

  async function checkForUpdate() {
    if (updateChecking || !/^https?:$/.test(location.protocol) || document.visibilityState === "hidden") return;
    updateChecking = true;
    try {
      const res = await fetch("version.json?ts=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const remote = String(data.version || "").trim();
      if (remote && isNewerVersion(remote, APP_VERSION) && remote !== updateDismissedVersion) {
        showUpdateToast(remote, updateNoteList(data));
      }
    } catch (e) {
      // offline or file:// — silently ignore
    } finally {
      updateChecking = false;
    }
  }

  async function applyUpdateAndReload() {
    const btn = $("#reloadUpdateBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Reloading…"; }
    // If the reload lands on the same stale bundle (cached service worker),
    // stop the popup from reappearing on every load.
    persistUpdateDismissed((($("#updateVersion") || {}).textContent || "").replace(/^v/, ""));
    hideUpdateToast();
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await reg.update();
      }
    } catch (e) {}
    location.reload();
  }

  function startUpdateWatcher() {
    const badge = $("#appVersion");
    if (badge) badge.textContent = APP_VERSION;
    document.querySelectorAll(".channel-chip").forEach((chip) => { chip.textContent = APP_CHANNEL; });
    const releaseEl = $("#appReleaseDate");
    if (releaseEl) releaseEl.textContent = APP_RELEASE_DATE;
    const devVersion = $("#devVersion");
    if (devVersion) devVersion.textContent = APP_VERSION;
    const devRelease = $("#devReleaseDate");
    if (devRelease) devRelease.textContent = APP_RELEASE_DATE;
    checkForUpdate();
    setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL);
    window.addEventListener("focus", checkForUpdate);
    window.addEventListener("online", checkForUpdate);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });
  }

  // ---------- Cross-platform: prevent double-tap zoom, handle orientation ----------
  window.addEventListener("orientationchange", () => { setTimeout(() => window.scrollTo(0, 0), 100); });



  // ---------- Init ----------
  async function init() {
    readRemoteModelsCache();
    loadSettings();
    loadApiKeys();
    populateProviders();
    populateModels();
    wireEvents();
    state._profileId = await getProfileId();
    await loadEvolutions();
    await refreshAuth();
    hideBrickLoader();
    const loader = $("#brickLoader");
    if (loader) loader.remove();
    startUpdateWatcher();
    // Restore the cached live list instantly, then refresh from the server.
    if (liveSyncSupported(allProviders()[state.provider]) && getApiKey(state.provider)) fetchProviderLiveModels(state.provider);
  }
  init();

})();
