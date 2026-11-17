#!/usr/bin/env node
/*
 * One-command stable release version bump.
 *
 * Usage:
 *   node scripts/bump-version.js <new-version> ["Release date label"]
 *   npm run bump -- 1.1.18 "17 Nov 2026"
 *
 * Updates every machine-checked version reference, demotes the previous
 * "current stable" heading in README.md / CHANGELOG.md, inserts a fresh
 * release skeleton, bumps the service-worker cache tag, and runs
 * scripts/check-versions.js at the end so a mismatched release can never
 * ship. Only the actual release notes stay yours to write — see the final
 * printed checklist.
 */
const fs = require("fs");
const path = require("path");
const child = require("child_process");

const root = path.resolve(__dirname, "..");
const [, , newVersion, dateLabel] = process.argv;

if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error("✖ Usage: node scripts/bump-version.js <x.y.z> [\"Release date label\"]");
  process.exit(1);
}

const pkgPath = path.join(root, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const oldVersion = pkg.version;
const oldEsc = oldVersion.replace(/\./g, "\\.");

if (newVersion === oldVersion) {
  console.error("✖ New version equals current version (" + oldVersion + ").");
  process.exit(1);
}

const releaseShort = dateLabel || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const releaseLong = dateLabel || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const releaseIso = new Date().toISOString().slice(0, 10);

const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const write = (f, content) => fs.writeFileSync(path.join(root, f), content);
const replaceAllLiteral = (f, from, to) => write(f, read(f).split(from).join(to));
const replaceRegex = (f, regex, to) => write(f, read(f).replace(regex, to));

const updatedSwCache = () => {
  const m = read("sw.js").match(/const CACHE\s*=\s*"tanzir-ai-v(\d+)"/);
  return "tanzir-ai-v" + (Number(m[1]) + 1);
};
const newSwCache = updatedSwCache();

// --- 1. package.json / lock / manifest / app.js / sw.js / index.html / banner
replaceAllLiteral("package.json", oldVersion, newVersion);
replaceAllLiteral("package-lock.json", "\"version\": \"" + oldVersion + "\"", "\"version\": \"" + newVersion + "\"");
replaceAllLiteral("manifest.json", oldVersion, newVersion);
replaceAllLiteral("sw.js", 'const APP_VERSION = "' + oldVersion + '"', 'const APP_VERSION = "' + newVersion + '"');
replaceRegex("sw.js", /const CACHE\s*=\s*"tanzir-ai-v\d+"/, 'const CACHE = "' + newSwCache + '"');
replaceAllLiteral("app.js", 'const APP_VERSION = "' + oldVersion + '"', 'const APP_VERSION = "' + newVersion + '"');
replaceRegex("app.js", /const APP_RELEASE_DATE = "[^"]*"/, 'const APP_RELEASE_DATE = "' + releaseShort + '"');
replaceAllLiteral("index.html", oldVersion, newVersion);
replaceRegex("index.html", /<span id="appReleaseDate">[^<]*<\/span>/, '<span id="appReleaseDate">' + releaseShort + '</span>');
replaceRegex("index.html", /<span id="devReleaseDate">[^<]*<\/span>/, '<span id="devReleaseDate">' + releaseShort + '</span>');
replaceAllLiteral("docs/banner.svg", "v" + oldVersion, "v" + newVersion);

// --- 2. README: badge + release-date badge + stable version + cache row
{
  let readme = read("README.md");
  readme = readme.replace(/badge\/version-[0-9.]+-/, "badge/version-" + newVersion + "-");
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  readme = readme.replace(/badge\/released-[0-9A-Za-z_]+-/, "badge/released-" + day + "_" + month + "_" + d.getFullYear() + "-");
  readme = readme.replace(new RegExp("\\| \\*\\*Current stable version\\*\\* \\| `" + oldEsc + "` \\|"), "| **Current stable version** | `" + newVersion + "` |");
  readme = readme.replace(/(\| \*\*Service worker cache\*\* \| `tanzir-ai-v)\d+(` \|)/, "$1" + newSwCache.replace("tanzir-ai-v", "") + "$2");
  write("README.md", readme);
}

// --- 3. version.json: fresh skeleton (update notes afterwards — they show in the popup)
{
  const skeleton = {
    version: newVersion,
    channel: "Stable",
    date: releaseIso,
    released: releaseShort,
    note: "Stable release v" + newVersion + " — বিস্তারিত CHANGELOG.md/version.json-এ দেখুন। Reload করুন।",
    notes: [
      "📝 এই release-এর বিস্তারিত এখানে লিখুন — নোটটি নতুন-ভার্সন পপ-আপে ব্যবহারকারীদের দেখানো হয়।",
      "🛠️ Service worker cache bump হয়েছে (" + newSwCache + ")।",
    ],
  };
  write("version.json", JSON.stringify(skeleton, null, 2) + "\n");
}

// --- 4. README changelog: demote old entry, insert fresh skeleton
{
  let readme = read("README.md");
  const demoteRe = new RegExp("(<summary><b>v" + oldEsc + " — )current stable · +([^<]+)(</b></summary>)");
  const wasCurrentStable = demoteRe.test(readme);
  readme = readme.replace(demoteRe, "$1$2$3");
  const insertIdx = readme.indexOf("<summary><b>v" + oldVersion + " — ");
  if (insertIdx !== -1) {
    const detailsIdx = readme.lastIndexOf("<details", insertIdx);
    // Close the previous entry so only the new one is expanded.
    if (readme.slice(detailsIdx, detailsIdx + "<details open>".length) === "<details open>") {
      readme = readme.slice(0, detailsIdx) + "<details>" + readme.slice(detailsIdx + "<details open>".length);
    }
    const skeleton = [
      "<details open>",
      "<summary><b>v" + newVersion + " — current stable · " + releaseShort + "</b></summary>",
      "",
      "- 📝 Release notes লিখুন (এই অংশের content আপডেট পপ-আপেও যোগ হবে)।",
      "- 🛠️ Service worker cache bumped to **" + newSwCache + "**.",
      "",
      "</details>",
      "",
      "",
    ].join("\n");
    readme = readme.slice(0, detailsIdx) + skeleton + readme.slice(detailsIdx);
  } else if (wasCurrentStable) {
    console.warn("⚠ Could not find the v" + oldVersion + " changelog block in README.md to clone.");
  }
  write("README.md", readme);
}

// --- 5. CHANGELOG: demote old current-stable heading, insert fresh skeleton
{
  let changelog = read("CHANGELOG.md");
  const demoteRe = new RegExp("^## v" + oldEsc + " — (.*) \\(current stable\\)$", "m");
  changelog = changelog.replace(demoteRe, "## v" + oldVersion + " — $1");
  const marker = /^## v[0-9]/m;
  const insert =
    "## v" + newVersion + " — " + releaseLong + " (current stable)\n\n" +
    "- 📝 এই release-এর বিস্তারিত লিখুন (এই নোট CHANGELOG.md-এ থাকবে)।\n" +
    "- 🛠️ Service worker cache: `" + newSwCache + "`.\n\n";
  if (marker.test(changelog)) {
    changelog = changelog.replace(marker, insert + "$&");
  } else {
    changelog = changelog.trimEnd() + "\n\n" + insert;
  }
  write("CHANGELOG.md", changelog);
}

// --- 6. Verify everything still matches
try {
  child.execFileSync(process.execPath, [path.join(root, "scripts", "check-versions.js")], { stdio: "inherit" });
} catch (e) {
  process.exit(1);
}
console.log("\n✓ Bumped " + oldVersion + " → " + newVersion + " (" + releaseShort + "), SW cache " + newSwCache);
console.log("Next steps:");
console.log("  1. Fill in release notes in CHANGELOG.md and README.md (the 📝 placeholders).");
console.log("  2. Update version.json notes to describe this release (shows in the update popup).");
console.log("  3. npm run build && git add -A && git commit && git push");
