/* Tanzir AI — multi-provider chat (Puter + OpenAI-compatible + Anthropic) */
const STORAGE_PREFIX = "tanzirai:";
const INDEX_KEY = STORAGE_PREFIX + "index";
const CONV_KEY = (id) => STORAGE_PREFIX + "conv:" + id;
const SETTINGS_KEY = STORAGE_PREFIX + "settings";
const APIKEYS_KEY = STORAGE_PREFIX + "apikeys";
const PROVIDER_KEY = STORAGE_PREFIX + "provider";
const MODEL_KEY = STORAGE_PREFIX + "model";
const CUSTOM_PROVIDERS_KEY = STORAGE_PREFIX + "customProviders";

const BUILTIN_PROVIDERS = {
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
  pollinations: { id:"pollinations", label:"Pollinations (NO KEY, free)", type:"openai", needsKey:false, auth:"none",
    endpoint:"https://text.pollinations.ai/openai",
    hint:"No key needed — unlimited free text",
    models:[{id:"openai",label:"OpenAI (via Pollinations)"},{id:"mistral",label:"Mistral (via Pollinations)"},{id:"llama",label:"Llama (via Pollinations)"}]},
};

let CUSTOM_PROVIDERS = [];
try { CUSTOM_PROVIDERS = JSON.parse(localStorage.getItem(CUSTOM_PROVIDERS_KEY) || "[]"); } catch(e){ CUSTOM_PROVIDERS=[]; }

function allProviders() {
  const map = { ...BUILTIN_PROVIDERS };
  CUSTOM_PROVIDERS.forEach((cp) => { map[cp.id] = cp; });
  return map;
}

const DEFAULT_SETTINGS = {
  systemPrompt: "You are Tanzir, a helpful and friendly AI assistant created by Tanzir Ahmed. Always introduce yourself as Tanzir when asked who you are. Respond in clear Markdown when useful.",
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
  provider: "gemini",
  model: "gemini-2.5-flash",
  customModelMode: false,
  apiKeys: {},
  sending: false,
  abortController: null,
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

// ---------- Settings ----------
function loadSettings() {
  try { const raw = localStorage.getItem(SETTINGS_KEY); if (raw) state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }; } catch (e) {}
  $("#systemPrompt").value = state.settings.systemPrompt;
  $("#temperature").value = state.settings.temperature;
  $("#tempVal").textContent = state.settings.temperature;
  $("#maxTokens").value = state.settings.maxTokens || "";
  $("#streaming").checked = state.settings.streaming;
}
function saveSettings() {
  state.settings.systemPrompt = $("#systemPrompt").value;
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
}
function toggleCustomModel(force) {
  state.customModelMode = force !== undefined ? force : !state.customModelMode;
  if (state.customModelMode) { modelSelect.style.display = "none"; customModelInput.style.display = "inline-block"; }
  else { modelSelect.style.display = "inline-block"; customModelInput.style.display = "none"; state.model = modelSelect.value; }
}
function currentModel() {
  if (state.customModelMode) return (customModelInput.value || "").trim() || (allProviders()[state.provider].models?.[0]?.id || "");
  return modelSelect.value;
}

// ---------- Auth ----------
async function refreshAuth() {
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
      userInfoEl.textContent = "Get a free API key (Gemini/Groq) to start";
      state.conversations = [];
      loadLocalConversations();
      renderConvList();
      if (!state.conversations.length) newConversation();
    }
  } catch (e) { console.error(e); }
}

// ---------- Conversations ----------
function storageMode() { return state.user ? "puter" : "local"; }
async function loadConversations() {
  if (!state.user) { loadLocalConversations(); renderConvList(); if (!state.conversations.length) newConversation(); return; }
  try { const idx = await puter.kv.get(INDEX_KEY); state.conversations = Array.isArray(idx) ? idx : []; }
  catch (e) { state.conversations = []; }
  state.conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  renderConvList();
  if (state.conversations.length && !state.currentId) await openConversation(state.conversations[0].id);
  else if (!state.conversations.length) newConversation();
}
function loadLocalConversations() {
  try { state.conversations = JSON.parse(localStorage.getItem(INDEX_KEY) || "[]"); } catch (e) { state.conversations = []; }
  state.conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
async function saveIndex() {
  if (state.user) await puter.kv.set(INDEX_KEY, state.conversations);
  else localStorage.setItem(INDEX_KEY, JSON.stringify(state.conversations));
}
async function loadConv(id) {
  if (state.user) return (await puter.kv.get(CONV_KEY(id))) || null;
  try { return JSON.parse(localStorage.getItem(CONV_KEY(id)) || "null"); } catch (e) { return null; }
}
async function saveConv(conv) {
  conv.updatedAt = Date.now();
  if (state.user) await puter.kv.set(CONV_KEY(conv.id), conv);
  else localStorage.setItem(CONV_KEY(conv.id), JSON.stringify(conv));
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
  state.current = conv; state.currentId = id;
  state.provider = conv.provider || state.provider;
  state.model = conv.model || state.model;
  populateProviders(); populateModels(); updateApiKeyRow();
  renderMessages(); renderConvList();
}
async function deleteConversation(id) {
  if (!confirm("Delete this conversation?")) return;
  if (state.user) await puter.kv.del(CONV_KEY(id)); else localStorage.removeItem(CONV_KEY(id));
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
    div.innerHTML = `<span class="title">${escapeHtml(c.title || "Untitled")}</span><span class="del" data-id="${c.id}">×</span>`;
    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("del")) { deleteConversation(e.target.dataset.id); return; }
      openConversation(c.id);
    });
    convListEl.appendChild(div);
  });
}

// ---------- Rendering ----------
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function renderMarkdown(text) { try { return DOMPurify.sanitize(marked.parse(text || "", { breaks: true })); } catch (e) { return escapeHtml(text || ""); } }
function renderMessages() {
  messagesEl.innerHTML = "";
  if (!state.current) return;
  state.current.messages.forEach((m) => appendMessageDOM(m.role, m.content, m.images, m.reasoning));
  scrollToBottom();
}
function appendMessageDOM(role, content, images, reasoning) {
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "user" : "assistant");
  const roleLabel = role === "user" ? "You" : "Assistant";
  const contentHtml = renderMarkdown(typeof content === "string" ? content : "");
  const rHtml = reasoning ? `<details class="reasoning"><summary>Reasoning</summary><div>${renderMarkdown(reasoning)}</div></details>` : "";
  div.innerHTML = `<div class="role">${roleLabel}</div><div class="content">${rHtml}${contentHtml}</div>`;
  if (images && images.length) {
    const contentDiv = div.querySelector(".content");
    images.forEach((img) => { const el = document.createElement("img"); el.src = img.image_url?.url || img.url; contentDiv.appendChild(el); });
  }
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
async function anthropicChat(provider, apiMessages, opts, onChunk) {
  const key = getApiKey(provider.id);
  if (!key) throw new Error("API key missing for " + provider.label + ".");
  // separate system
  let system = "";
  const msgs = [];
  apiMessages.forEach((m) => {
    if (m.role === "system") { system += (system ? "\n" : "") + m.content; }
    else msgs.push({ role: m.role, content: m.content });
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
  if (!text) return;
  const providers = allProviders();
  const provider = providers[state.provider];
  if (state.provider === "puter" && !state.user) {
    alert("Sign in with Puter first, or switch to a free provider.");
    return;
  }

  if (!state.current) newConversation();
  const userMsg = { role: "user", content: text };
  state.current.messages.push(userMsg);
  if (state.current.messages.filter((m) => m.role === "user").length === 1 && text) state.current.title = text.slice(0, 40);
  state.current.provider = state.provider;
  state.current.model = currentModel();

  inputEl.value = "";
  renderMessages();

  state.sending = true;
  $("#sendBtn").disabled = true;
  $("#stopBtn").style.display = "inline-block";
  $("#typing").style.display = "block";

  const assistantDiv = appendMessageDOM("assistant", "");
  const contentDiv = assistantDiv.querySelector(".content");
  let accumulated = "";
  state.abortController = new AbortController();

  try {
    const model = currentModel();
    const apiMessages = [];
    if (state.settings.systemPrompt) apiMessages.push({ role: "system", content: state.settings.systemPrompt });
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
      contentDiv.innerHTML = renderMarkdown("⚠️ Error: " + (e?.message || e));
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
  function closeSidebar() { sidebar.classList.remove("open"); overlay.style.display = "none"; }
  function openSidebar() { sidebar.classList.add("open"); overlay.style.display = "block"; }
  if (hamburger) hamburger.addEventListener("click", openSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);
  // close sidebar on conv select (mobile)
  convListEl.addEventListener("click", () => { if (window.innerWidth <= 768) closeSidebar(); });

  $("#newChatBtn").addEventListener("click", () => { if (state.sending) return; newConversation(); if (window.innerWidth <= 768) closeSidebar(); });

  $("#signInBtn").addEventListener("click", async () => {
    try { await puter.auth.signIn(); await refreshAuth(); }
    catch (e) { console.error(e); alert("Sign in failed: " + (e?.message || e)); }
  });
  $("#signOutBtn").addEventListener("click", async () => { await puter.auth.signOut(); await refreshAuth(); });

  $("#settingsBtn").addEventListener("click", () => { $("#settingsModal").style.display = "flex"; });
  $("#closeSettingsBtn").addEventListener("click", () => { $("#settingsModal").style.display = "none"; });
  $("#saveSettingsBtn").addEventListener("click", () => { saveSettings(); $("#settingsModal").style.display = "none"; });
  $("#temperature").addEventListener("input", (e) => { $("#tempVal").textContent = e.target.value; });

  $("#providersBtn").addEventListener("click", () => { renderProviderList(); $("#providersModal").style.display = "flex"; });
  $("#closeProvidersBtn").addEventListener("click", () => { $("#providersModal").style.display = "none"; });
  $("#addProviderBtn").addEventListener("click", () => {
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
    if (key) saveApiKey(cp.id, key);
    CUSTOM_PROVIDERS.push(cp);
    localStorage.setItem(CUSTOM_PROVIDERS_KEY, JSON.stringify(CUSTOM_PROVIDERS));
    renderProviderList();
    populateProviders();
    state.provider = cp.id;
    populateModels();
    updateApiKeyRow();
    // reset form
    $("#cpName").value = ""; $("#cpEndpoint").value = ""; $("#cpModels").value = ""; $("#cpKey").value = "";
  });

  providerSelect.addEventListener("change", () => {
    state.provider = providerSelect.value;
    const p = allProviders()[state.provider];
    state.model = (p.models && p.models[0]?.id) || state.model;
    populateModels();
    if (state.current) { state.current.provider = state.provider; state.current.model = state.model; }
    updateApiKeyRow();
  });
  modelSelect.addEventListener("change", () => {
    state.model = modelSelect.value;
    if (state.current) state.current.model = state.model;
  });
  $("#toggleCustomModel").addEventListener("click", () => toggleCustomModel());

  $("#saveApiKeyBtn").addEventListener("click", () => {
    const key = $("#apiKeyInput").value.trim();
    saveApiKey(state.provider, key);
    $("#apiKeyStatus").textContent = key ? "✓ saved" : "cleared";
  });

  $("#composer").addEventListener("submit", (e) => { e.preventDefault(); sendMessage(); });
  inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  inputEl.addEventListener("input", () => { inputEl.style.height = "auto"; inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + "px"; });

  $("#stopBtn").addEventListener("click", () => { if (state.abortController) state.abortController.abort(); });
}

// ---------- Init ----------
async function init() {
  loadSettings();
  loadApiKeys();
  populateProviders();
  populateModels();
  wireEvents();
  await refreshAuth();
}
init();
