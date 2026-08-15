/**
 * Compose the single assets directory the Worker serves.
 *
 * A Worker has ONE assets binding, so the site (dist/) and the admin SPA
 * (@natilon/admin-ui/dist) must share it: the admin is copied to dist/admin.
 * If the site ever gains a page whose path starts with /admin, the copy
 * would shadow it — fail loudly instead of letting two things own one path.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const dist = path.resolve("dist");

const adminSrc = path.dirname(require.resolve("@natilon/admin-ui/dist/index.html"));
const adminDest = path.join(dist, "admin");

if (fs.existsSync(adminDest)) {
  // Astro built a page at /admin — that path belongs to the panel.
  const marker = path.join(adminDest, "index.html");
  const html = fs.existsSync(marker) ? fs.readFileSync(marker, "utf8") : "";
  if (!html.includes("natilon")) {
    console.error("dist/admin already exists — a site page is using the /admin path reserved for the panel.");
    process.exit(1);
  }
  fs.rmSync(adminDest, { recursive: true });
}

fs.cpSync(adminSrc, adminDest, { recursive: true });
console.log(`admin UI → dist/admin (${fs.readdirSync(adminDest).length} entries)`);
