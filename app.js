/* Tanzir AI — multi-provider chat (Puter + OpenAI-compatible + Anthropic) */
const APP_VERSION = "1.1.2";
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
    models:[{id:"auto",label:"Auto (free, no key)"}]},
  puter: { id:"puter", label:"Puter (cloud)", type:"puter", needsKey:false, models:[
    {id:"gpt-5.4-nano",label:"GPT-5.4 Nano (cheap)"},{id:"gpt-5.6-luna",label:"GPT-5.6 Luna"},
    {id:"claude-sonnet-4-6",label:"Claude Sonnet 4.6"},{id:"claude-opus-4-8",label:"Claude Opus 4.8"},
    {id:"gemini-3.5-flash-lite",label:"Gemini 3.5 Flash Lite"},{id:"deepseek-chat",label:"DeepSeek Chat"}]},
  gemini: { id:"gemini", label:"Google Gemini (FREE)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    hint:"aistudio.google.com → Get API key (free, no card)",
    models:[{id:"gemini-2.5-flash",label:"Gemini 2.5 Flash (best free)"},{id:"gemini-2.0-flash",label:"Gemini 2.0 Flash"},{id:"gemini-1.5-flash",label:"Gemini 1.5 Flash"}]},
  groq: { id:"groq", label:"Groq (FREE, fastest)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.groq.com/openai/v1/chat/completions",
    hint:"console.groq.com → API Keys",
    models:[{id:"llama-3.3-70b-versatile",label:"Llama 3.3 70B"},{id:"llama-3.1-8b-instant",label:"Llama 3.1 8B (fastest)"},{id:"mixtral-8x7b-32768",label:"Mixtral 8x7B"},{id:"gemma2-9b-it",label:"Gemma 2 9B"}]},
  openrouter: { id:"openrouter", label:"OpenRouter (FREE models)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://openrouter.ai/api/v1/chat/completions",
    hint:"openrouter.ai → Keys",
    extraHeaders:{"HTTP-Referer":"http://localhost:3000","X-Title":"Tanzir AI"},
    models:[{id:"meta-llama/llama-3.3-70b-instruct:free",label:"Llama 3.3 70B (free)"},{id:"qwen/qwen-2.5-72b-instruct:free",label:"Qwen 2.5 72B (free)"},{id:"google/gemma-2-9b-it:free",label:"Gemma 2 9B (free)"}]},
  openai: { id:"openai", label:"OpenAI", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.openai.com/v1/chat/completions",
    hint:"platform.openai.com → API keys",
    models:[{id:"gpt-4o",label:"GPT-4o"},{id:"gpt-4o-mini",label:"GPT-4o Mini"},{id:"gpt-4.1",label:"GPT-4.1"},{id:"o3-mini",label:"o3-mini"}]},
  anthropic: { id:"anthropic", label:"Anthropic (Claude)", type:"anthropic", needsKey:true, auth:"x-api-key",
    endpoint:"https://api.anthropic.com/v1/messages",
    hint:"console.anthropic.com → API keys",
    models:[{id:"claude-opus-4-8",label:"Claude Opus 4.8"},{id:"claude-sonnet-4-6",label:"Claude Sonnet 4.6"},{id:"claude-haiku-4-5",label:"Claude Haiku 4.5"}]},
  mistral: { id:"mistral", label:"Mistral", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.mistral.ai/v1/chat/completions",
    hint:"console.mistral.ai → API keys",
    models:[{id:"mistral-large-latest",label:"Mistral Large"},{id:"mistral-small-latest",label:"Mistral Small"},{id:"codestral-latest",label:"Codestral"}]},
  deepseek: { id:"deepseek", label:"DeepSeek", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.deepseek.com/chat/completions",
    hint:"platform.deepseek.com → API keys",
    models:[{id:"deepseek-chat",label:"DeepSeek Chat"},{id:"deepseek-reasoner",label:"DeepSeek Reasoner"}]},
  xai: { id:"xai", label:"xAI (Grok)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.x.ai/v1/chat/completions",
    hint:"console.x.ai → API keys",
    models:[{id:"grok-3",label:"Grok 3"},{id:"grok-3-mini",label:"Grok 3 Mini"}]},
  together: { id:"together", label:"Together AI", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.together.xyz/v1/chat/completions",
    hint:"api.together.ai → API keys",
    models:[{id:"meta-llama/Llama-3.3-70B-Instruct-Turbo",label:"Llama 3.3 70B Turbo"},{id:"Qwen/Qwen2.5-72B-Instruct-Turbo",label:"Qwen 2.5 72B"}]},
  fireworks: { id:"fireworks", label:"Fireworks AI", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.fireworks.ai/inference/v1/chat/completions",
    hint:"fireworks.ai → API keys",
    models:[{id:"accounts/fireworks/models/llama-v3p3-70b-instruct",label:"Llama 3.3 70B"}]},
  perplexity: { id:"perplexity", label:"Perplexity", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.perplexity.ai/chat/completions",
    hint:"perplexity.ai → API keys",
    models:[{id:"sonar",label:"Sonar"},{id:"sonar-pro",label:"Sonar Pro"}]},
  cohere: { id:"cohere", label:"Cohere", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.cohere.com/compatibility/v1/chat/completions",
    hint:"dashboard.cohere.com → API keys",
    models:[{id:"command-r-plus",label:"Command R+"},{id:"command-r",label:"Command R"}]},
  ollama: { id:"ollama", label:"Ollama (local)", type:"openai", needsKey:false, auth:"none",
    endpoint:"http://localhost:11434/v1/chat/completions",
    hint:"Install Ollama locally (ollama.com)",
    models:[{id:"llama3.2",label:"Llama 3.2"},{id:"phi3:mini",label:"Phi-3 Mini"},{id:"qwen2.5:7b",label:"Qwen 2.5 7B"}]},
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
    models:[{id:"Meta-Llama-3.3-70B-Instruct",label:"Llama 3.3 70B"},{id:"Meta-Llama-3.1-8B-Instruct",label:"Llama 3.1 8B"}]},
  nvidia: { id:"nvidia", label:"NVIDIA NIM (FREE)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://integrate.api.nvidia.com/v1/chat/completions",
    hint:"build.nvidia.com → API keys (free prototyping)",
    models:[{id:"meta/llama-3.3-70b-instruct",label:"Llama 3.3 70B"},{id:"deepseek-ai/deepseek-r1",label:"DeepSeek R1"},{id:"qwen/qwen2.5-72b-instruct",label:"Qwen 2.5 72B"}]},
  zai: { id:"zai", label:"Z.ai (FREE GLM)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.z.ai/api/paas/v4/chat/completions",
    hint:"z.ai → API keys (GLM-4.5-Flash free)",
    models:[{id:"glm-4.5-flash",label:"GLM-4.5 Flash (free)"},{id:"glm-4.7-flash",label:"GLM-4.7 Flash (free)"}]},
  deepinfra: { id:"deepinfra", label:"DeepInfra (FREE credits)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.deepinfra.com/v1/openai/chat/completions",
    hint:"deepinfra.com → API keys (free credits)",
    models:[{id:"meta-llama/Llama-3.3-70B-Instruct",label:"Llama 3.3 70B"},{id:"deepseek-ai/DeepSeek-R1",label:"DeepSeek R1"}]},
  novita: { id:"novita", label:"Novita AI (FREE credits)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.novita.ai/v3/openai/chat/completions",
    hint:"novita.ai → API keys ($0.50 free)",
    models:[{id:"meta-llama/llama-3.3-70b-instruct",label:"Llama 3.3 70B"}]},
  hyperbolic: { id:"hyperbolic", label:"Hyperbolic (FREE tier)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.hyperbolic.xyz/v1/chat/completions",
    hint:"hyperbolic.ai → API keys (free tier)",
    models:[{id:"meta-llama/Llama-3.3-70B-Instruct",label:"Llama 3.3 70B"}]},
  aimlapi: { id:"aimlapi", label:"AIML API (FREE tier)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://api.aimlapi.com/v1/chat/completions",
    hint:"aimlapi.com → API keys (free tier)",
    models:[{id:"meta-llama/Llama-3.3-70B-Instruct-Turbo",label:"Llama 3.3 70B"}]},
  huggingface: { id:"huggingface", label:"Hugging Face (FREE)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://router.huggingface.co/v1/chat/completions",
    hint:"huggingface.co → Access Tokens (free)",
    models:[{id:"meta-llama/Llama-3.3-70B-Instruct",label:"Llama 3.3 70B"},{id:"Qwen/Qwen2.5-72B-Instruct",label:"Qwen 2.5 72B"}]},
  pollinations: { id:"pollinations", label:"Pollinations (FREE)", type:"openai", needsKey:true, auth:"bearer",
    endpoint:"https://gen.pollinations.ai/v1/chat/completions",
    hint:"enter.pollinations.ai/keys → free API key (no card)",
    models:[{id:"openai/gpt-5.4-nano",label:"GPT-5.4 Nano (free)"},{id:"openai/gpt-4o-mini",label:"GPT-4o Mini (free)"},{id:"mistral/mistral-small",label:"Mistral Small (free)"},{id:"meta-llama/llama-3.3-70b",label:"Llama 3.3 70B (free)"}]},
  // OmniRoute gateway (github.com/cheaper-inference/OmniRoute): free AI gateway with quota-aware auto-fallback across 380 providers
  omniroute: { id:"omniroute", label:"OmniRoute Gateway (FREE, auto-failover)", type:"openai", needsKey:false, auth:"none",
    endpoint:"https://omniroute.online/v1/chat/completions",
    hint:"OmniRoute handles auto-failover when one model hits its token/rate limit. Uses public free tiers from 150+ providers.",
    models:[{id:"auto",label:"Auto (OmniRoute picks best free model with failover)"},{id:"openai/gpt-5.4-nano",label:"GPT-5.4 Nano"},{id:"meta-llama/llama-3.3-70b",label:"Llama 3.3 70B"}]},
};

let CUSTOM_PROVIDERS = [];
try { CUSTOM_PROVIDERS = JSON.parse(localStorage.getItem(CUSTOM_PROVIDERS_KEY) || "[]"); } catch(e){ CUSTOM_PROVIDERS=[]; }

function allProviders() {
  const map = { ...BUILTIN_PROVIDERS };
  CUSTOM_PROVIDERS.forEach((cp) => { map[cp.id] = cp; });
  return map;
}

const LEGACY_SYSTEM_PROMPT = "You are Tanzir, a helpful and friendly AI assistant created by Tanzir Ahmed. Always introduce yourself as Tanzir when asked who you are. Respond in clear Markdown when useful.";

const GREETING_RULE = "CRITICAL: Greet with 'Assalamu Alaikum' ONLY in the very first reply of a brand-new conversation. NEVER repeat any greeting in later replies. Continued conversations must start directly with the answer, no salam, no 'How can I help you', no introduction. Match the user's language exactly: if they write in Bengali, reply entirely in Bengali; if in English, reply entirely in English. Never mix languages in a single reply.";

const DEFAULT_SETTINGS = {
  systemPrompt: "You are তানজীর (Tanzir), a helpful and friendly AI assistant created by Tanzir Ahmed. Your name in Bengali is always written তানজীর (with a long ঈ), never টানজির, তানজির, or টানজীর. Always introduce yourself as তানজীর when asked who you are. " + GREETING_RULE + " Reply in the user's language (Bengali or English) and use clear Markdown when useful.",
  temperature: 0.7,
  maxTokens: 0,
  streaming: true,
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
  // Always enforce built-in identity — user cannot override assistant name (তানজীর)
  state.settings.systemPrompt = DEFAULT_SETTINGS.systemPrompt;
  $("#systemPrompt").value = DEFAULT_SETTINGS.systemPrompt;
  $("#temperature").value = state.settings.temperature;
  $("#tempVal").textContent = state.settings.temperature;
  $("#maxTokens").value = state.settings.maxTokens || "";
  $("#streaming").checked = state.settings.streaming;
}
function saveSettings() {
  // Enforce built-in identity — always reset to তানজীর regardless of input
  state.settings.systemPrompt = DEFAULT_SETTINGS.systemPrompt;
  state.settings.temperature = parseFloat($("#temperature").value);
  state.settings.maxTokens = parseInt($("#maxTokens").value) || 0;
  state.settings.streaming = $("#streaming").checked;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  $("#tempVal").textContent = state.settings.temperature;
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
function populateModels() {
  const providers = allProviders();
  const p = providers[state.provider];
  modelSelect.innerHTML = "";
  (p.models || []).forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id; opt.textContent = m.label;
    modelSelect.appendChild(opt);
  });
  if (p.models && p.models.some((m) => m.id === state.model)) modelSelect.value = state.model;
  else if (p.models && p.models.length) { state.model = p.models[0].id; modelSelect.value = state.model; }
  state.customModelMode = false;
  modelSelect.style.display = "inline-block";
  if (modelSelect.parentElement) modelSelect.parentElement.style.display = "flex";
  customModelInput.style.display = "none";
  updateApiKeyRow();
}
function updateApiKeyRow() {
  const providers = allProviders();
  const p = providers[state.provider];
  const row = $("#apiKeyRow");
  if (p.needsKey) {
    row.style.display = "flex";
    const key = getApiKey(state.provider);
    $("#apiKeyInput").value = key;
    $("#apiKeyStatus").textContent = key ? "✓ saved" : (p.hint || "");
  } else row.style.display = "none";
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
function toggleCustomModel(force) {
  state.customModelMode = force !== undefined ? force : !state.customModelMode;
  const wrap = modelSelect.parentElement;
  if (state.customModelMode) {
    modelSelect.style.display = "none";
    if (wrap) wrap.style.display = "none";
    customModelInput.style.display = "inline-block";
  } else {
    modelSelect.style.display = "inline-block";
    if (wrap) wrap.style.display = "flex";
    customModelInput.style.display = "none";
    state.model = modelSelect.value;
  }
}
function currentModel() {
  if (state.customModelMode) return (customModelInput.value || "").trim() || (allProviders()[state.provider].models?.[0]?.id || "");
  return modelSelect.value;
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
      loadLocalConversations();
      renderConvList();
      if (state.conversations.length) await openConversation(state.conversations[0].id);
      else newConversation();
    }
  } catch (e) { console.error(e); }
  updateStatus();
}

// ---------- Conversations ----------
function storageMode() { return state.user ? "puter" : "local"; }
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
async function saveConv(conv) {
  conv.updatedAt = Date.now();
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
function newConversation() {
  const conv = { id: uid(), title: "New chat", messages: [], provider: state.provider, model: currentModel(), createdAt: Date.now(), updatedAt: Date.now() };
  state.current = conv; state.currentId = conv.id;
  renderMessages(); renderConvList();
}
async function openConversation(id) {
  const conv = await loadConv(id); if (!conv) return;
  clearAttachment();
  state.current = conv; state.currentId = id;
  state.provider = conv.provider || state.provider;
  state.model = conv.model || state.model;
  populateProviders(); populateModels(); updateApiKeyRow();
  renderMessages(); renderConvList();
  // ensure chat view is visible on mobile
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("show");
  }
}
async function deleteConversation(id) {
  if (!confirm("Delete this conversation?")) return;
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
function renderConvList() {
  convListEl.innerHTML = "";
  state.conversations.forEach((c) => {
    const div = document.createElement("div");
    div.className = "conv-item" + (c.id === state.currentId ? " active" : "");
    const titleSpan = document.createElement("span");
    titleSpan.className = "title";
    titleSpan.textContent = c.title || "Untitled";
    const delSpan = document.createElement("span");
    delSpan.className = "del";
    delSpan.dataset.id = c.id;
    delSpan.textContent = "×";
    div.appendChild(titleSpan);
    div.appendChild(delSpan);
    // click to open
    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("del")) { deleteConversation(e.target.dataset.id); return; }
      openConversation(c.id);
    });
    // double-click to rename
    titleSpan.addEventListener("dblclick", async (e) => {
      e.stopPropagation();
      const current = c.title || "Untitled";
      const next = prompt("Rename chat:", current);
      if (next === null || next.trim() === "") return;
      c.title = next.trim();
      try {
        if (state.current && state.current.id === c.id) {
          state.current.title = c.title;
          await saveConv(state.current);
        } else {
          const full = await loadConv(c.id);
          if (full) { full.title = c.title; await saveConv(full); }
          else { await saveIndex(); }
        }
      } catch (err) { console.error(err); }
      renderConvList();
    });
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
  if (!file) { el.style.display = "none"; return; }
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
    // Voice output (browser speech synthesis)
    const voiceBtn = div.querySelector(".voice-btn");
    if (voiceBtn) voiceBtn.addEventListener("click", () => speakText(contentText));

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

// ---------- Cloud chat (OpenAI-compatible) ----------
async function openaiChat(provider, apiMessages, opts, onChunk) {
  const key = getApiKey(provider.id);
  if (provider.needsKey && !key) throw new Error("API key missing for " + provider.label + ". Open 'Providers / API keys' and save a key.");
  const body = { model: opts.model, messages: apiMessages, stream: opts.stream, temperature: opts.temperature };
  if (opts.max_tokens > 0) body.max_tokens = opts.max_tokens;
  else if (provider.defaultMaxTokens) body.max_tokens = provider.defaultMaxTokens;
  const headers = { "Content-Type": "application/json" };
  if (provider.auth === "bearer" && key) headers["Authorization"] = "Bearer " + key;
  else if (provider.auth === "x-api-key" && key) headers["x-api-key"] = key;
  else if (provider.auth === "api-key" && key) headers["api-key"] = key;
  if (provider.extraHeaders) Object.assign(headers, provider.extraHeaders);
  const res = await fetch(provider.endpoint, { method: "POST", headers, body: JSON.stringify(body), signal: opts.signal });
  if (!res.ok) { const t = await res.text(); throw new Error("HTTP " + res.status + ": " + t.slice(0, 400)); }
  if (!opts.stream) {
    const data = await res.json();
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
  if (!res.ok) { const t = await res.text(); throw new Error("HTTP " + res.status + ": " + t.slice(0, 400)); }
  if (!opts.stream) {
    const data = await res.json();
    return (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
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
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      try {
        const json = JSON.parse(payload);
        if (json.type === "content_block_delta" && json.delta?.text) onChunk(json.delta.text);
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

  if (!state.current) newConversation();
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
  if (state.current.messages.filter((m) => m.role === "user").length === 1 && titleSource) state.current.title = titleSource.slice(0, 40);
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
      apiMessages.push({ role: "system", content: systemPrompt });
    }
    state.current.messages.forEach((m) => {
      const { _attachmentPath, images, reasoning: _r, ...rest } = m;
      apiMessages.push(rest);
    });
    const opts = { model, stream: state.settings.streaming, signal: state.abortController.signal, temperature: state.settings.temperature, max_tokens: state.settings.maxTokens };

    if (state.provider === "puter") {
      const response = await puter.ai.chat(apiMessages, { model, stream: state.settings.streaming, signal: state.abortController.signal, temperature: state.settings.temperature, ...(state.settings.maxTokens > 0 ? { max_tokens: state.settings.maxTokens } : {}) });
      if (state.settings.streaming) {
        for await (const part of response) {
          if (part.type === "error") { accumulated += "\n\n[Error: " + (part.message || "unknown") + "]"; contentDiv.innerHTML = renderMarkdown(accumulated); break; }
          if (part.type === "text" || part.text) { accumulated += part.text || ""; contentDiv.innerHTML = renderMarkdown(accumulated); scrollToBottom(); }
          if (part.image) { const img = document.createElement("img"); img.src = part.image.image_url?.url || part.image.url; contentDiv.appendChild(img); }
        }
      } else {
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

    state.current.messages.push({ role: "assistant", content: accumulated });
    await saveConv(state.current);
  } catch (e) {
    console.error(e);
    if (e?.name === "AbortError") {
      contentDiv.innerHTML = renderMarkdown(accumulated + "\n\n_(stopped)_");
      state.current.messages.push({ role: "assistant", content: accumulated });
      await saveConv(state.current);
    } else {
      const errText = (accumulated ? accumulated + "\n\n---\n\n" : "") + "⚠️ Error: " + (e?.message || e);
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
function renderProviderList() {
  const list = $("#providerList");
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
  convListEl.addEventListener("click", () => { if (window.innerWidth <= 768) closeSidebar(); });
  $("#newChatBtn").addEventListener("click", () => { if (state.sending) return; newConversation(); clearAttachment(); if (window.innerWidth <= 768) closeSidebar(); });

  // (PIN lock removed — history is scoped per browser + API key)

  $("#signInBtn").addEventListener("click", async () => {
    try { await puter.auth.signIn({ attempt_temp_user_creation: true }); await refreshAuth(); }
    catch (e) { console.error(e); alert("Sign in failed: " + (e?.message || e)); }
  });
  $("#signOutBtn").addEventListener("click", async () => { await puter.auth.signOut(); await refreshAuth(); });

  $("#settingsBtn").addEventListener("click", () => { closeSidebar(); $("#settingsModal").style.display = "flex"; });
  $("#closeSettingsBtn").addEventListener("click", () => { $("#settingsModal").style.display = "none"; });
  $("#saveSettingsBtn").addEventListener("click", () => { saveSettings(); $("#settingsModal").style.display = "none"; });
  $("#temperature").addEventListener("input", (e) => { $("#tempVal").textContent = e.target.value; });

  $("#providersBtn").addEventListener("click", () => { closeSidebar(); renderProviderList(); $("#providersModal").style.display = "flex"; });
  $("#closeProvidersBtn").addEventListener("click", () => { $("#providersModal").style.display = "none"; });
  $("#developerBtn").addEventListener("click", () => { closeSidebar(); $("#developerModal").style.display = "flex"; });
  $("#reloadUpdateBtn").addEventListener("click", applyUpdateAndReload);
  $("#installAppBtn").addEventListener("click", installApp);
  $("#dismissUpdateBtn").addEventListener("click", () => {
    updateDismissedVersion = ($("#updateVersion").textContent || "").replace(/^v/, "");
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
    state.model = (p.models && p.models[0]?.id) || state.model;
    populateModels();
    updateApiKeyRow();
    // recompute profile scope for the new provider
    state._profileId = await getProfileId();
    // switch history scope to this provider/key
    state.current = null; state.currentId = null;
    await loadConversations();
  });
  modelSelect.addEventListener("change", () => {
    state.model = modelSelect.value;
    if (state.current) state.current.model = state.model;
  });
  $("#toggleCustomModel").addEventListener("click", () => toggleCustomModel());

  $("#saveApiKeyBtn").addEventListener("click", async () => {
    const key = $("#apiKeyInput").value.trim();
    // persist the current chat under the OLD key scope first
    if (state.current && state.current.messages.length) { try { await saveConv(state.current); } catch(e){} }
    saveApiKey(state.provider, key);
    $("#apiKeyStatus").textContent = key ? "✓ saved" : "cleared";
    // recompute profile scope for the new key
    state._profileId = await getProfileId();
    // switch history scope to this key
    state.current = null; state.currentId = null;
    await loadConversations();
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
    state.pendingAttachment = file;
    renderAttachmentPreview(file);
    e.target.value = "";
  });
  inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  inputEl.addEventListener("input", () => { inputEl.style.height = "auto"; inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + "px"; });


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

// ---------- Voice output (browser speech synthesis) ----------
function speakText(text) {
  const spoken = String(text || "").trim();
  if (!spoken) return;
  if (!("speechSynthesis" in window)) {
    alert("এই ব্রাউজারে ভয়েস আউটপুট সমর্থিত নয়।");
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = /[\u0980-\u09FF]/.test(spoken) ? "bn-BD" : "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error(e);
    alert("ভয়েস আউটপুট চালু করা যায়নি: " + (e?.message || e));
  }
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
// release, the next time a user opens/focuses the app they are asked to reload.
const UPDATE_CHECK_INTERVAL = 3 * 60 * 1000;
let updateChecking = false;
let updateDismissedVersion = "";

function showUpdateToast(version) {
  const toast = $("#updateToast");
  if (!toast) return;
  const label = $("#updateVersion");
  if (label) label.textContent = "v" + version;
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
    if (remote && remote !== APP_VERSION && remote !== updateDismissedVersion) {
      showUpdateToast(remote);
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
  if (badge) badge.textContent = "v" + APP_VERSION;
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
}
init();
