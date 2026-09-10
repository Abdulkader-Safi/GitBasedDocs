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
  assets: ["guides/img/diagram.png", "guides/img/a b.png", "attachments/Screen Shot.png", "files/spec.pdf"],
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
assert.match(await r("![d](img/a%20b.png)"), /src="\/api\/assets\/acme\/guides\/img\/a%20b.png"/)
// not cached: an alt box with the alt text, and no request at all
const missing = await r("![Architecture](./img/nope.png)")
assert.match(missing, /<span class="asset-missing" role="img" aria-label="Image not found: Architecture">Image not found: Architecture<\/span>/)
assert.doesNotMatch(missing, /<img/)
assert.match(await r("![](./img/nope.png)"), /Image not found: nope.png/, "no alt falls back to the file name")
// outside the project: also a box, never a URL
assert.doesNotMatch(await r("![x](../../../etc/passwd.png)"), /<img|src=/)
// a link to a PDF in the repo goes through the asset route
assert.match(await r("[spec](../files/spec.pdf)"), /href="\/api\/assets\/acme\/files\/spec.pdf"/)
// a stray % in a link must not crash the render
assert.match(await r("[bad](100%.md) and ![bad](50%.png)"), /bad/)

// --- Obsidian wikilinks ---------------------------------------------------
assert.match(await r("see [[Welcome]]"), /<a href="\/p\/acme\/Welcome" class="wikilink">Welcome<\/a>/)
assert.match(await r("see [[welcome|the intro]]"), /href="\/p\/acme\/Welcome"[^>]*>the intro</)
assert.match(await r("see [[install#Setup Steps]]"), /href="\/p\/acme\/install#setup-steps"/)
assert.match(await r("try [[create a link]] now"), /<span class="wikilink wikilink-unresolved"[^>]*>create a link<\/span>/)
// never inside code
assert.match(await r("`[[Welcome]]`"), /<code>\[\[Welcome\]\]<\/code>/)
// Obsidian image embeds resolve by file name anywhere in the project
const emb = await r("![[Screen Shot.png]]")
assert.match(emb, /<img src="\/api\/assets\/acme\/attachments\/Screen%20Shot.png" alt="Screen Shot.png" loading="lazy">/)
assert.match(await r("![[diagram.png|300]]"), /width="300"/)
assert.match(await r("![[diagram.png|300x200]]"), /width="300" height="200"/)
assert.match(await r("![[guides/img/diagram.png]]"), /src="\/api\/assets\/acme\/guides\/img\/diagram.png"/)
assert.match(await r("![[missing.png]]"), /Image not found: missing.png/)
// a note embed links to the note rather than transcluding it
assert.match(await r("![[Welcome]]"), /<a href="\/p\/acme\/Welcome" class="wikilink">Welcome<\/a>/)
assert.doesNotMatch(await r("![[Welcome]]"), /!</, "the ! is consumed, not left dangling")

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
assert.match(code, /<code class="language-bash">/)
assert.match(code, /<span style="color:#[0-9A-F]{6}">curl<\/span>/, "Shiki colours tokens")
assert.doesNotMatch(code, /<pre[^>]*style=/, "theme background stripped, block sits on --code-surface")
assert.match(await r("```\nplain\n```"), /<span class="code-lang">text<\/span>/)
// an unknown fence language falls back to plain text instead of throwing
assert.match(await r("```notalanguage\nx\n```"), /class="code-block"/)
// fence meta: title becomes the label, {2} marks line 2
const meta = await r('```ts title="lib/auth.ts" {2}\nconst a = 1\nconst b = 2\n```')
assert.match(meta, /<span class="code-lang">lib\/auth\.ts<\/span>/)
assert.equal(meta.match(/class="line highlighted"/g)?.length, 1)
assert.doesNotMatch(meta, /data-title/)
// [!code ++] and [!code --] notation becomes diff lines, comment removed
const diff = await r("```js\nold() // [!code --]\nnew() // [!code ++]\n```")
assert.match(diff, /class="line diff remove"/)
assert.match(diff, /class="line diff add"/)
assert.doesNotMatch(diff, /\[!code/)
// code is text: markup inside a fence is escaped, never parsed
assert.doesNotMatch(await r("```html\n<script>alert(1)</script>\n```"), /<script>/)

// --- mermaid ---------------------------------------------------------------------
{
  const m = await r("```mermaid\ngraph TD\n  A[Start] --> B{Ok?}\n  B -->|<b>yes</b>| C\n```")
  assert.match(m, /<div class="mermaid-diagram" role="img" aria-label="Diagram">graph TD/)
  assert.match(m, /--> B\{Ok\?\}/, "source kept as text for the browser to draw")
  assert.match(m, /&#x3C;b>yes/, "a < in a label stays escaped")
  assert.doesNotMatch(m, /<b>|code-block|shiki/, "never highlighted, never parsed as HTML")
}

// --- headings get ids and an anchor ---------------------------------------
const h = await r("## Getting a token")
assert.match(h, /<h2 id="getting-a-token">/)
assert.match(h, /class="heading-anchor"/)

// --- GFM ---------------------------------------------------------------------
assert.match(await r("| a | b |\n|---|---|\n| 1 | 2 |"), /<table>/)
assert.match(await r("- [x] done\n- [ ] todo"), /type="checkbox"/)

// --- outline ---------------------------------------------------------------------
{
  const { outline } = await import("./markdown")
  const html = await r("# Top\n\n## Install `bun`\n\n### Step *one*\n\n## Install `bun`\n\n#### deep\n\n## Q&A <3")
  assert.deepEqual(outline(html), [
    { id: "install-bun", text: "Install bun", depth: 2 },
    { id: "step-one", text: "Step one", depth: 3 },
    { id: "install-bun-1", text: "Install bun", depth: 2 },
    { id: "qa-3", text: "Q&A <3", depth: 2 },
  ], "h2 and h3 only, anchor text and tags gone, entities decoded, duplicate ids kept apart")
  assert.deepEqual(outline("<p>no headings</p>"), [])
}

console.log("markdown checks ok")
