// Runnable check for the Markdown renderer: bun lib/render/markdown.check.ts
import assert from "node:assert/strict"

import { renderMarkdown, type RenderContext } from "./markdown"

const ctx: RenderContext = {
  projectSlug: "acme",
  projectRepoPath: "",
  pagePath: "guides/auth.md",
  pages: [
    { path: "index.md", slug: "" },
    { path: "guides/auth.md", slug: "guides/auth" },
    { path: "guides/webhooks.md", slug: "guides/webhooks" },
    { path: "install.md", slug: "install" },
    { path: "Welcome.md", slug: "Welcome" },
  ],
}
const r = (md: string, c: RenderContext = ctx) => renderMarkdown(md, c)

// --- page names with spaces become encoded, clickable routes ---------------
const spaced: RenderContext = { ...ctx, pagePath: "Home.md",
  pages: [{ path: "Home.md", slug: "Home" }, { path: "My Note.md", slug: "My Note" }] }
assert.match(await r("[[My Note]]", spaced), /href="\/p\/acme\/My%20Note"/)
assert.match(await r("[n](My%20Note.md)", spaced), /href="\/p\/acme\/My%20Note"/)

// --- script and event-handler injection never reaches the client ---------
for (const evil of [
  "<script>alert(1)</script>",
  "hello <script>alert(1)</script> world",
  '<img src="x" onerror="alert(1)">',
  '<a href="javascript:alert(1)">x</a>',
  "[x](javascript:alert(1))",
  '<iframe src="https://evil.test"></iframe>',
  '<div onclick="alert(1)">x</div>',
]) {
  const html = await r(evil)
  assert.ok(!/<script/i.test(html), `script tag leaked: ${evil} -> ${html}`)
  assert.ok(!/\bon\w+=/i.test(html), `event handler leaked: ${evil} -> ${html}`)
  assert.ok(!/javascript:/i.test(html), `javascript: url leaked: ${evil} -> ${html}`)
  assert.ok(!/<iframe/i.test(html), `iframe leaked: ${evil} -> ${html}`)
}

// --- relative links resolve to in-project routes -------------------------
assert.match(await r("[w](./webhooks.md)"), /href="\/p\/acme\/guides\/webhooks"/)
assert.match(await r("[w](webhooks)"), /href="\/p\/acme\/guides\/webhooks"/)
assert.match(await r("[i](../install.md#setup)"), /href="\/p\/acme\/install#setup"/)
assert.match(await r("[home](../index.md)"), /href="\/p\/acme"/)
// climbing out of the repo drops the href, it never points elsewhere
assert.doesNotMatch(await r("[up](../../secret.md)"), /href=/)
// external links open in a new tab without leaking the referrer
const ext = await r("[gh](https://github.com)")
assert.match(ext, /target="_blank"/)
assert.match(ext, /rel="noreferrer noopener"/)
// in-page anchors are left alone
assert.match(await r("[a](#setup)"), /href="#setup"/)

// a relative link out of a nested project stays inside that project
const nested: RenderContext = { ...ctx, projectRepoPath: "docs/acme", pagePath: "docs/acme/a.md",
  pages: [{ path: "docs/acme/a.md", slug: "a" }, { path: "docs/other/b.md", slug: "b" }] }
assert.doesNotMatch(await r("[b](../other/b.md)", nested), /href=/)

// --- images go through the asset route, never a raw GitHub URL ------------
assert.match(await r("![d](./img/diagram.png)"), /src="\/api\/assets\/acme\/guides\/img\/diagram.png"/)
assert.match(await r("![d](img/a b.png)".replace(" ", "%20")), /src="\/api\/assets\/acme\/guides\/img\/a%20b.png"/)

// --- Obsidian wikilinks ---------------------------------------------------
assert.match(await r("see [[Welcome]]"), /<a href="\/p\/acme\/Welcome" class="wikilink">Welcome<\/a>/)
assert.match(await r("see [[welcome|the intro]]"), /href="\/p\/acme\/Welcome"[^>]*>the intro</)
assert.match(await r("see [[install#Setup Steps]]"), /href="\/p\/acme\/install#setup-steps"/)
assert.match(await r("try [[create a link]] now"), /<span class="wikilink wikilink-unresolved"[^>]*>create a link<\/span>/)
// never inside code
assert.match(await r("`[[Welcome]]`"), /<code>\[\[Welcome\]\]<\/code>/)
// embeds are left alone, not turned into links
assert.doesNotMatch(await r("![[Welcome]]"), /class="wikilink"/)

// --- callouts --------------------------------------------------------------
const note = await r("> [!NOTE]\n> Tokens are scoped to one project.")
assert.match(note, /<div class="callout callout-note" role="note">/)
assert.match(note, /<div class="callout-label">NOTE<\/div>/)
assert.match(note, /Tokens are scoped to one project\./)
assert.doesNotMatch(note, /\[!NOTE\]/)
assert.match(await r("> [!caution]\n> careful"), /callout-warning/)
// a plain quote stays a blockquote
assert.match(await r("> just a quote"), /<blockquote>/)

// --- code blocks -----------------------------------------------------------
const code = await r("```bash\ncurl https://x.dev\n```")
assert.match(code, /<div class="code-block">/)
assert.match(code, /<span class="code-lang">bash<\/span>/)
assert.match(code, /<button type="button" class="code-copy" data-copy="">Copy<\/button>/)
assert.match(code, /class="hljs language-bash"/)
assert.match(await r("```\nplain\n```"), /<span class="code-lang">text<\/span>/)

// --- headings get ids and an anchor ---------------------------------------
const h = await r("## Getting a token")
assert.match(h, /<h2 id="getting-a-token">/)
assert.match(h, /class="heading-anchor"/)

// --- GFM ---------------------------------------------------------------------
assert.match(await r("| a | b |\n|---|---|\n| 1 | 2 |"), /<table>/)
assert.match(await r("- [x] done\n- [ ] todo"), /type="checkbox"/)

console.log("markdown checks ok")
