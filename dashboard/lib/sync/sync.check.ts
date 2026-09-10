// Runnable check for the sync parsing helpers: bun lib/sync/sync.check.ts
// These four carry every decision the indexer makes about a file, so they
// are the part worth pinning down.
import assert from "node:assert/strict"

import {
  excerptFrom,
  isDraftFrom,
  orderFrom,
  pageSlug,
  projectFor,
  titleFrom,
} from "./sync"

// pageSlug: project index serves the landing route, everything else nests
assert.equal(pageSlug("docs/acme", "docs/acme/index.md"), "")
assert.equal(pageSlug("docs/acme", "docs/acme/install.md"), "install")
assert.equal(pageSlug("docs/acme", "docs/acme/guides/auth.md"), "guides/auth")
assert.equal(pageSlug("docs/acme", "docs/acme/guides/index.md"), "guides")
assert.equal(pageSlug("docs/acme", "docs/acme/guides/auth.mdx"), "guides/auth")

// titleFrom: frontmatter, then first h1, then the file name
assert.equal(titleFrom({ title: "Auth" }, "# Ignored", "a/b.md"), "Auth")
assert.equal(titleFrom({}, "intro\n\n# Real title\n", "a/b.md"), "Real title")
assert.equal(titleFrom({}, "no heading", "a/rate-limits.md"), "Rate limits")
assert.equal(titleFrom({ title: "   " }, "# Fallback", "a/b.md"), "Fallback")

// excerptFrom: plain text only, code fences and link syntax dropped
const excerpt = excerptFrom(
  "# Title\n\nSome *bold* text with [a link](https://x.dev).\n\n```bash\ncurl x\n```\n\n- item one\n> quoted\n",
)
assert.equal(
  excerpt,
  "Title Some bold text with a link. item one quoted",
)
assert.ok(!excerpt.includes("curl"), "code fences must not reach the index")
assert.equal(excerptFrom("x".repeat(3000)).length, 2000)

// order and draft flags
assert.equal(orderFrom({ order: 2 }), 2)
assert.equal(orderFrom({}), 999)
assert.equal(orderFrom({ order: "2" }), 999)
assert.equal(isDraftFrom({ draft: true }), true)
assert.equal(isDraftFrom({ draft: "true" }), false)
assert.equal(isDraftFrom({}), false)

// projectFor: longest matching repoPath wins, no prefix bleed
const list = [
  { id: "a", repoPath: "docs/acme" },
  { id: "nested", repoPath: "docs/acme/sub" },
  { id: "b", repoPath: "docs/acme-two" },
]
assert.equal(projectFor(list, "docs/acme/guides/auth.md")?.id, "a")
assert.equal(projectFor(list, "docs/acme/sub/page.md")?.id, "nested")
assert.equal(projectFor(list, "docs/acme-two/page.md")?.id, "b")
assert.equal(projectFor(list, "docs/other/page.md"), null)

// a project mapped to the repo root claims everything, but a deeper
// project still wins its own folder
const rooted = [
  { id: "root", repoPath: "" },
  { id: "deep", repoPath: "guides" },
]
assert.equal(projectFor(rooted, "readme.md")?.id, "root")
assert.equal(projectFor(rooted, "guides/auth.md")?.id, "deep")
assert.equal(pageSlug("", "guides/auth.md"), "guides/auth")
assert.equal(pageSlug("", "index.md"), "")

console.log("sync helpers ok")

// an untitled index.md takes its folder's name, never "Index"
assert.equal(titleFrom({}, "", "docs/index.md"), "Docs")
assert.equal(titleFrom({}, "", "guides/getting-started/index.md"), "Getting started")
assert.equal(titleFrom({}, "# Real", "docs/index.md"), "Real", "a heading still wins")
assert.equal(titleFrom({}, "", "index.md"), "Index", "the repo root index has no folder to borrow")
console.log("index title checks ok")
