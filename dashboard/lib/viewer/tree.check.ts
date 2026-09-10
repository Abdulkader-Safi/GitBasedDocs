// Runnable check for the viewer tree: bun lib/viewer/tree.check.ts
import assert from "node:assert/strict"

import { buildTree, flatten, landingSlug, neighbours, openFolders, trail } from "./tree"

const pages = [
  { slug: "guides/webhooks", title: "Webhooks", sortOrder: 2 },
  { slug: "guides/auth", title: "Authentication", sortOrder: 1 },
  { slug: "guides", title: "Guides", sortOrder: 2 },          // guides/index.md
  { slug: "", title: "Home", sortOrder: 50 },                 // project index.md, bad order
  { slug: "install", title: "Install", sortOrder: 1 },
  { slug: "api/rate-limits", title: "Rate limits", sortOrder: 999 },
  { slug: "api/errors", title: "Errors", sortOrder: 999 },
  { slug: "page 10", title: "Page 10", sortOrder: 999 },
  { slug: "page 9", title: "Page 9", sortOrder: 999 },
]
const tree = buildTree(pages)

// project index leads even with a high order; then by order, then title
assert.deepEqual(tree.map((n) => n.kind === "page" ? n.slug : `[${n.path}]`),
  ["", "install", "[guides]", "[api]", "page 9", "page 10"])

// a folder index opens and orders its folder, is not a child of it, and never
// renames it: the label stays the real folder name, as in Obsidian
const guides = tree.find((n) => n.kind === "folder" && n.path === "guides")
assert.ok(guides && guides.kind === "folder")
assert.equal(guides.title, "guides", "a titled index must not rename its folder")
assert.equal(guides.indexSlug, "guides")
assert.equal(guides.indexTitle, "Guides")
assert.deepEqual(guides.children.map((c) => c.kind === "page" && c.slug), ["guides/auth", "guides/webhooks"])

// a folder with no index keeps its name and has no link
const api = tree.find((n) => n.kind === "folder" && n.path === "api")
assert.ok(api && api.kind === "folder")
assert.equal(api.title, "api")
assert.equal(api.indexSlug, null)
// equal order falls back to title
assert.deepEqual(api.children.map((c) => c.kind === "page" && c.slug), ["api/errors", "api/rate-limits"])

// reading order: folder index before its children
assert.deepEqual(flatten(tree).map((p) => p.slug),
  ["", "install", "guides", "guides/auth", "guides/webhooks", "api/errors", "api/rate-limits", "page 9", "page 10"])

// prev / next follow reading order, with no wraparound
assert.deepEqual(neighbours(tree, "guides/auth"), {
  prev: { slug: "guides", title: "Guides" },
  next: { slug: "guides/webhooks", title: "Webhooks" },
})
assert.equal(neighbours(tree, "").prev, null)
assert.equal(neighbours(tree, "page 10").next, null)
assert.deepEqual(neighbours(tree, "missing"), { prev: null, next: null })

// breadcrumb trail uses folder titles and links folders that have an index
assert.deepEqual(trail(tree, "guides/auth"), [{ title: "guides", slug: "guides" }])
assert.deepEqual(trail(tree, "api/errors"), [{ title: "api", slug: null }])

// the user's vault: docs/index.md (untitled) plus docs/test.md and Welcome.md.
// The folder must read "docs", open the index, and hold only "Test".
const vault = buildTree([
  { slug: "docs", title: "Docs", sortOrder: 999 },
  { slug: "docs/test", title: "Test", sortOrder: 999 },
  { slug: "Welcome", title: "Welcome", sortOrder: 999 },
])
const docsFolder = vault[0]
assert.ok(docsFolder.kind === "folder")
assert.equal(docsFolder.title, "docs")
assert.equal(docsFolder.indexSlug, "docs")
assert.deepEqual(docsFolder.children.map((c) => c.kind === "page" && c.slug), ["docs/test"])
assert.deepEqual(trail(tree, "install"), [])

// folders on the active path open
assert.deepEqual([...openFolders("guides/advanced/x")], ["guides", "guides/advanced", "guides/advanced/x"])

// landing prefers the project index, else the first page
assert.equal(landingSlug(tree), "")
assert.equal(landingSlug(buildTree(pages.filter((p) => p.slug !== ""))), "install")
assert.equal(landingSlug([]), null)

// deeply nested folders without index pages still build
const deep = buildTree([{ slug: "a/b/c/page", title: "Page", sortOrder: 1 }])
assert.equal(deep[0].kind, "folder")
assert.deepEqual(flatten(deep).map((p) => p.slug), ["a/b/c/page"])

console.log("tree checks ok")
