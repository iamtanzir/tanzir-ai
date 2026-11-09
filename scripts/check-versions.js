#!/usr/bin/env node
/*
 * Version consistency guard — keeps every place that shows the app version in
 * lock-step, so a release can never ship (for example) package.json 1.1.13 with
 * index.html still saying 1.1.12. Run automatically by `npm run build`.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const json = (file) => JSON.parse(read(file));

const pkg = json("package.json");
const manifest = json("manifest.json");
const release = json("version.json");
const app = read("app.js");
const html = read("index.html");
const sw = read("sw.js");
const readme = read("README.md");
const changelog = read("CHANGELOG.md");

const found = [];
const add = (label, value) => found.push({ label, value: String(value || "").trim() });

add("package.json version", pkg.version);
add("manifest.json version", manifest.version);
add("manifest.json version_name", manifest.version_name);
add("version.json version", release.version);
add("app.js APP_VERSION", (app.match(/const APP_VERSION\s*=\s*"([^"]+)"/) || [])[1]);
add("index.html meta application-version", (html.match(/<meta name="application-version" content="([^"]+)"/) || [])[1]);
add("index.html sidebar version", (html.match(/<span id="appVersion">([^<]+)<\/span>/) || [])[1]);
add("index.html developer version", (html.match(/<span id="devVersion">([^<]+)<\/span>/) || [])[1]);
add("README version badge", (readme.match(/badge\/version-([0-9]+\.[0-9]+\.[0-9]+)-/) || [])[1]);
add("README stable version", (readme.match(/\*\*Current stable version\*\*\s*\|\s*`([^`]+)`/) || [])[1]);
add("CHANGELOG current heading", (changelog.match(/^## v([0-9]+\.[0-9]+\.[0-9]+) — .*\(current stable\)$/m) || [])[1]);

const expected = found[0].value;
const mismatches = found.filter((item) => item.value !== expected);
const channel = release.channel || "Stable";
const badChannel = String(channel).toLowerCase() !== "stable";
const missingDate = !/^\d{4}-\d{2}-\d{2}$/.test(String(release.date || ""));
const swCache = (sw.match(/const CACHE\s*=\s*"([^"]+)"/) || [])[1];

// Release date + channel must agree with the UI as well.
const releaseLabel = String(release.released || "").trim();
const dateSources = [
  { label: "version.json released", value: releaseLabel },
  { label: "app.js APP_RELEASE_DATE", value: (app.match(/const APP_RELEASE_DATE\s*=\s*"([^"]+)"/) || [])[1] },
  { label: "index.html release date", value: (html.match(/<span id="appReleaseDate">([^<]+)<\/span>/) || [])[1] },
  { label: "index.html developer release date", value: (html.match(/<span id="devReleaseDate">([^<]+)<\/span>/) || [])[1] },
];
const dateMismatches = dateSources.filter((item) => !item.value || item.value !== releaseLabel);
const channelSources = [
  { label: "app.js APP_CHANNEL", value: (app.match(/const APP_CHANNEL\s*=\s*"([^"]+)"/) || [])[1] },
  { label: "index.html channel chip", value: (html.match(/<span class="channel-chip">([^<]+)<\/span>/) || [])[1] },
];
const channelMismatches = channelSources.filter((item) => !item.value || item.value.toLowerCase() !== String(channel).toLowerCase());

let failed = false;
if (!expected) {
  console.error("✖ Could not read the version from package.json.");
  failed = true;
}
if (mismatches.length) {
  console.error("✖ Version mismatch — every file must use " + expected + ":");
  mismatches.forEach((item) => console.error("   · " + item.label + ": " + (item.value || "(missing)")));
  failed = true;
}
if (badChannel) {
  console.error("✖ version.json channel must be \"Stable\" for a stable release (got: " + channel + ").");
  failed = true;
}
if (dateMismatches.length) {
  console.error("✖ Release date mismatch — every place must show \"" + (releaseLabel || "(missing)") + "\":");
  dateMismatches.forEach((item) => console.error("   · " + item.label + ": " + (item.value || "(missing)")));
  failed = true;
}
if (channelMismatches.length) {
  console.error("✖ Channel mismatch — every place must show \"" + channel + "\":");
  channelMismatches.forEach((item) => console.error("   · " + item.label + ": " + (item.value || "(missing)")));
  failed = true;
}
if (missingDate) {
  console.error("✖ version.json date must be an ISO date (YYYY-MM-DD).");
  failed = true;
}
if (!swCache) {
  console.error("✖ sw.js CACHE name not found.");
  failed = true;
}

if (failed) process.exit(1);
console.log("✓ Stable release " + expected + " (" + releaseLabel + ") — version files in sync (SW cache: " + swCache + ").");
