/**
 * Compose the single assets directory the Worker serves.
 *
 * A Worker has ONE assets binding, so the site (dist/) and the admin SPA
 * (@stelstone/admin-ui/dist) must share it: the admin is copied to dist/admin.
 * If the site ever gains a page whose path starts with /admin, the copy
 * would shadow it — fail loudly instead of letting two things own one path.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const dist = path.resolve("dist");

// ── Which repo holds the content? Detected, not asked. ────────────────────
// The build runs inside the clone, so the origin remote already knows the
// answer — whatever name the user picked in the deploy flow. Written to
// worker/repo.json and merged into the config by worker/index.mjs. When
// detection fails (no git, no remote), the GITHUB_REPO variable on the
// worker is the fallback.
try {
  const url = execSync("git config --get remote.origin.url", { encoding: "utf8" }).trim();
  const match = url.replace(/\.git$/, "").match(/[/:]([^/:]+)\/([^/:]+)$/);
  if (match) {
    fs.writeFileSync("worker/repo.json", JSON.stringify({ owner: match[1], repo: match[2] }, null, 2) + "\n");
    console.log(`content repo → ${match[1]}/${match[2]} (auto-detected from origin)`);
  }
} catch {
  console.warn("content repo could not be auto-detected — set the GITHUB_REPO variable on the worker");
}

const adminSrc = path.dirname(require.resolve("@stelstone/admin-ui/dist/index.html"));
const adminDest = path.join(dist, "admin");

if (fs.existsSync(adminDest)) {
  // Astro built a page at /admin — that path belongs to the panel.
  const marker = path.join(adminDest, "index.html");
  const html = fs.existsSync(marker) ? fs.readFileSync(marker, "utf8") : "";
  if (!/natilon|stelstone/i.test(html)) {
    console.error("dist/admin already exists — a site page is using the /admin path reserved for the panel.");
    process.exit(1);
  }
  fs.rmSync(adminDest, { recursive: true });
}

fs.cpSync(adminSrc, adminDest, { recursive: true });
console.log(`admin UI → dist/admin (${fs.readdirSync(adminDest).length} entries)`);
