import { defineConfig } from "astro/config";
import stelstone, {
  collectRedirects,
  hierarchicalPathOf,
  workerRedirects,
  checkInternalLinks,
  readContentDirs,
} from "stelstone";
import cmsConfig from "./cms.config.mjs";

// Redirects are generated from content: a page whose `parent` gives it a
// nested path redirects its flat slug, and every path listed in a page's
// "Old paths" field 301s to the page. They are served by the WORKER
// (worker/redirects.json → createRedirects), which is why they are NOT
// passed to Astro's `redirects` option: Astro would render meta-refresh
// files at those paths, and a static file would answer before the worker
// gets to send the real 301.
const docs = readContentDirs("src/pages-data/pages");
const pathOf = hierarchicalPathOf(docs);
const { redirects, problems } = collectRedirects({ source: docs, pathOf });
for (const p of problems) console.warn(`[redirects] ${p}`);

// Broken internal links surface at build time as warnings, with the page
// they live on. /thanks/ and /admin/ exist outside the content model.
const { broken } = checkInternalLinks(docs, { pathOf, redirects, extraPaths: ["/thanks/", "/admin/"] });
for (const b of broken) console.warn(`[links] broken internal link: ${b.source} → ${b.href}`);

export default defineConfig({
  site: "https://example.com",
  integrations: [
    stelstone({ config: cmsConfig }),
    workerRedirects(redirects),
  ],
});
