#!/usr/bin/env node
/*
 * Refreshes models-free.json — the bundled free-model catalogue the app falls
 * back to before the live /models sync has populated its cache (and the one
 * online fresh installs see first). Pulls the PUBLIC Pollinations catalogue
 * (no credentials needed) and keeps the free text models only.
 *
 * Runs automatically on the 1st of every month via
 * .github/workflows/update-free-models.yml, and can be run by hand with
 * `npm run update:models`.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const SOURCE = "https://gen.pollinations.ai/v1/models";
const OUT = path.join(__dirname, "..", "models-free.json");

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Accept: "application/json", "User-Agent": "tanzir-ai-model-refresh/1.0 (+https://github.com/iamtanzir/tanzir-ai)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(get(res.headers.location));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error("HTTP " + res.statusCode + " from " + url));
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(new Error("timeout fetching " + url)); });
  });
}

function normalize(item) {
  if (!item || !item.id || item.category !== "text" || item.paid_only === true || item.community === true) return null;
  const mods = Array.isArray(item.input_modalities)
    ? item.input_modalities.map((x) => String(x).toLowerCase())
    : [];
  const name = String(item.title || item.id).trim() || String(item.id);
  const ctx = Number(item.context_length) || 0;
  const maxOut = Number(item.max_output_tokens)
    || Number(item.top_provider && (item.top_provider.max_completion_tokens || item.top_provider.max_output_tokens))
    || 0;
  const reasoning = !!(item.reasoning && typeof item.reasoning === "object" && Object.keys(item.reasoning).length);
  return {
    id: String(item.id),
    label: name + " (free)",
    vision: mods.includes("image"),
    free: true,
    ctx: ctx || undefined,
    maxOut: maxOut || undefined,
    reasoning,
    created: Number(item.created) || 0,
  };
}

(async () => {
  const payload = await get(SOURCE);
  const list = Array.isArray(payload && payload.data) ? payload.data : [];
  const models = list
    .map(normalize)
    .filter(Boolean)
    .sort((a, b) => b.created - a.created || a.label.localeCompare(b.label))
    .map(({ created, ...rest }) => rest);
  if (models.length < 5) throw new Error("suspiciously small free catalogue (" + models.length + " models) — refusing to overwrite models-free.json");
  const output = {
    generatedAt: new Date().toISOString(),
    source: SOURCE,
    note: "Free, no-cost Pollinations text models (paid_only === false). Regenerated monthly by the update-free-models workflow; live sync still runs per app start.",
    providers: { pollinations: models },
  };
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n");
  console.log("models-free.json updated: " + models.length + " free text models (" + output.generatedAt + ")");
})().catch((e) => {
  console.error("✖ update-free-models failed:", e.message);
  process.exit(1);
});
