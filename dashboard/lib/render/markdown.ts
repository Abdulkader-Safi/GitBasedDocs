import { posix } from "node:path"
import GithubSlugger from "github-slugger"
import type { Element, ElementContent, Root, Text } from "hast"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeHighlight from "rehype-highlight"
import rehypeSanitize from "rehype-sanitize"
import rehypeSlug from "rehype-slug"
import rehypeStringify from "rehype-stringify"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"
import { SKIP, visit } from "unist-util-visit"

export interface RenderPage {
  path: string
  slug: string
}

export interface RenderContext {
  projectSlug: string
  projectRepoPath: string
  // Repo path of the page being rendered, e.g. "guides/auth.md".
  pagePath: string
  // Every live page in the project, for relative links and wikilinks.
  pages: RenderPage[]
  // Repo paths of every cached image or PDF in the project. An image not in
  // here renders as an alt box instead of a broken request.
  assets?: string[]
}

const MD = /\.mdx?$/

// Obsidian vaults are full of "My Note.md", so every segment gets encoded.
export function pageHref(projectSlug: string, slug: string, hash = "") {
  const path = slug ? `/${slug.split("/").map(encodeURIComponent).join("/")}` : ""
  return `/p/${encodeURIComponent(projectSlug)}${path}${hash}`
}

// A stray % in a link would make decodeURI throw and take the whole page
// render down with it. Fall back to the raw text instead.
function safeDecode(s: string) {
  try {
    return decodeURI(s)
  } catch {
    return s
  }
}

function assetHref(ctx: RenderContext, repoPath: string) {
  return `/api/assets/${ctx.projectSlug}/${repoPath.split("/").map(encodeURIComponent).join("/")}`
}

const IMAGE = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i

// What a reader sees instead of a broken image: the name, in a box.
function missingImage(name: string): Element {
  return {
    type: "element",
    tagName: "span",
    properties: { className: ["asset-missing"], role: "img", ariaLabel: `Image not found: ${name}` },
    children: [{ type: "text", value: `Image not found: ${name}` }],
  }
}

function isExternal(href: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")
}

function inProject(repoPath: string, filePath: string) {
  return repoPath === "" || filePath === repoPath || filePath.startsWith(`${repoPath}/`)
}

// Resolve a repo path (with or without .md) to a page in this project.
function findPage(ctx: RenderContext, target: string): RenderPage | null {
  const byPath = new Map(ctx.pages.map((p) => [p.path, p]))
  const clean = target.replace(/\/+$/, "")
  return (
    byPath.get(clean) ??
    byPath.get(`${clean}.md`) ??
    byPath.get(`${clean}.mdx`) ??
    byPath.get(`${clean}/index.md`) ??
    null
  )
}

// ---------------------------------------------------------------------------
// Relative links and images. Links stay inside the project; a relative link
// that climbs out of it loses its href rather than pointing at another
// project's page.
function rehypeLinks(ctx: RenderContext) {
  const assetSet = new Set(ctx.assets ?? [])
  return (tree: Root) => {
    const dir = posix.dirname(ctx.pagePath)
    const resolve = (href: string) =>
      posix.normalize(posix.join(dir === "." ? "" : dir, safeDecode(href)))
    const escapes = (p: string) => p.startsWith("..") || !inProject(ctx.projectRepoPath, p)

    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName === "a" && typeof node.properties.href === "string") {
        const href = node.properties.href
        if (href.startsWith("#")) return
        if (isExternal(href)) {
          node.properties.target = "_blank"
          node.properties.rel = ["noreferrer", "noopener"]
          return
        }
        if (href.startsWith("/")) return

        const [pathPart, hash = ""] = href.split("#")
        const resolved = resolve(pathPart)
        if (escapes(resolved)) {
          delete node.properties.href
          return
        }
        const page = findPage(ctx, resolved)
        if (page) {
          node.properties.href = pageHref(ctx.projectSlug, page.slug, hash ? `#${hash}` : "")
        } else if (assetSet.has(resolved)) {
          // A link to a PDF or image in the repo goes through the asset route.
          node.properties.href = assetHref(ctx, resolved)
        }
        return
      }

      if (node.tagName === "img" && typeof node.properties.src === "string") {
        const src = node.properties.src
        if (isExternal(src) || src.startsWith("/")) return
        const resolved = resolve(src)
        const alt = typeof node.properties.alt === "string" && node.properties.alt
          ? node.properties.alt
          : posix.basename(resolved)
        // Outside the project, or not cached: an alt box, never a request
        // that would fail or point somewhere it should not.
        if (escapes(resolved) || !assetSet.has(resolved)) {
          if (parent && index !== undefined) {
            parent.children[index] = missingImage(alt)
            return SKIP
          }
          delete node.properties.src
          return
        }
        // Served by the asset route behind the same access check. Readers
        // never see a raw.githubusercontent.com URL or the token.
        node.properties.src = assetHref(ctx, resolved)
        node.properties.loading = "lazy"
      }
    })
  }
}

// ---------------------------------------------------------------------------
// Obsidian wikilinks: [[page]], [[page|label]], [[page#Heading]], plus embeds
// ![[image.png]] and ![[image.png|300]]. Resolved by file name the way
// Obsidian does. Runs after sanitize on text nodes, and never inside code.
const WIKILINK = /(!?)\[\[([^\]|#]+)(#[^\]|]+)?(?:\|([^\]]+))?\]\]/g

interface AssetIndex {
  byPath: Map<string, string>
  byName: Map<string, string>
}

function rehypeWikiLinks(ctx: RenderContext) {
  const byName = new Map<string, RenderPage>()
  for (const p of ctx.pages) {
    const base = posix.basename(p.path).replace(MD, "").toLowerCase()
    if (!byName.has(base)) byName.set(base, p)
    byName.set(p.path.replace(MD, "").toLowerCase(), p)
  }
  const assetIndex: AssetIndex = { byPath: new Map(), byName: new Map() }
  for (const a of ctx.assets ?? []) {
    assetIndex.byPath.set(a.toLowerCase(), a)
    const base = posix.basename(a).toLowerCase()
    if (!assetIndex.byName.has(base)) assetIndex.byName.set(base, a)
  }

  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "code" || node.tagName === "pre" || node.tagName === "a") {
        return SKIP
      }
      // Adjacent text nodes can split a [[link]]; merge them first.
      const merged: ElementContent[] = []
      for (const child of node.children) {
        const last = merged[merged.length - 1]
        if (child.type === "text" && last?.type === "text") last.value += child.value
        else merged.push(child)
      }
      node.children = merged.flatMap((child) =>
        child.type === "text" ? splitWikiLinks(child, ctx, byName, assetIndex) : [child],
      )
    })
  }
}

// Obsidian paths are vault relative; the vault is the project folder. Try the
// exact path first, then the bare file name anywhere in the project.
function findAsset(ctx: RenderContext, index: AssetIndex, target: string): string | null {
  const t = target.toLowerCase()
  const inProjectPath = ctx.projectRepoPath ? `${ctx.projectRepoPath}/${target}`.toLowerCase() : t
  return (
    index.byPath.get(t) ??
    index.byPath.get(inProjectPath) ??
    index.byName.get(posix.basename(t)) ??
    null
  )
}

function splitWikiLinks(
  text: Text,
  ctx: RenderContext,
  byName: Map<string, RenderPage>,
  assetIndex: AssetIndex,
): ElementContent[] {
  const out: ElementContent[] = []
  let last = 0
  for (const m of text.value.matchAll(WIKILINK)) {
    const start = m.index ?? 0
    if (start > last) out.push({ type: "text", value: text.value.slice(last, start) })
    const embed = m[1] === "!"
    const target = m[2].trim()
    const heading = m[3]?.slice(1).trim()
    const alias = m[4]?.trim()
    last = start + m[0].length

    // ![[diagram.png]] and ![[diagram.png|300]] or |300x200 for a size.
    if (embed && IMAGE.test(target)) {
      const found = findAsset(ctx, assetIndex, target)
      if (!found) {
        out.push(missingImage(posix.basename(target)))
        continue
      }
      const size = alias?.match(/^(\d+)(?:x(\d+))?$/)
      const properties: Element["properties"] = {
        src: assetHref(ctx, found),
        alt: size || !alias ? posix.basename(target) : alias,
        loading: "lazy",
      }
      if (size) {
        properties.width = Number(size[1])
        if (size[2]) properties.height = Number(size[2])
      }
      out.push({ type: "element", tagName: "img", properties, children: [] })
      continue
    }

    // A note embed (![[Other note]]) links to the note; we do not transclude.
    const label = (alias ?? `${target}${heading ? ` > ${heading}` : ""}`).trim()
    const page = byName.get(target.toLowerCase())
    if (page) {
      const hash = heading ? `#${new GithubSlugger().slug(heading)}` : ""
      out.push({
        type: "element",
        tagName: "a",
        properties: { href: pageHref(ctx.projectSlug, page.slug, hash), className: ["wikilink"] },
        children: [{ type: "text", value: label }],
      })
    } else {
      // Obsidian shows links to notes that do not exist yet dimmed.
      out.push({
        type: "element",
        tagName: "span",
        properties: { className: ["wikilink", "wikilink-unresolved"], title: "No page with this name yet" },
        children: [{ type: "text", value: label }],
      })
    }
  }
  if (!out.length) return [text]
  if (last < text.value.length) out.push({ type: "text", value: text.value.slice(last) })
  return out
}

// ---------------------------------------------------------------------------
// GitHub alert blockquotes: > [!NOTE], [!TIP], [!WARNING] (plus IMPORTANT and
// CAUTION, folded into note and warning).
const ALERTS: Record<string, "note" | "tip" | "warning"> = {
  NOTE: "note",
  TIP: "tip",
  IMPORTANT: "note",
  WARNING: "warning",
  CAUTION: "warning",
}

function rehypeCallouts() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "blockquote") return
      const firstP = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "p",
      )
      const firstText = firstP?.children[0]
      if (!firstP || firstText?.type !== "text") return
      const m = firstText.value.match(/^\s*\[!(\w+)\]\s*/)
      const kind = m ? ALERTS[m[1].toUpperCase()] : undefined
      if (!m || !kind) return

      firstText.value = firstText.value.slice(m[0].length)
      if (!firstText.value) {
        firstP.children.shift()
        if (firstP.children[0]?.type === "element" && firstP.children[0].tagName === "br") {
          firstP.children.shift()
        }
      }
      const body = node.children.filter(
        (c) => !(c === firstP && firstP.children.length === 0),
      )
      node.tagName = "div"
      node.properties = { className: ["callout", `callout-${kind}`], role: "note" }
      node.children = [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["callout-label"] },
          children: [{ type: "text", value: m[1].toUpperCase() }],
        },
        {
          type: "element",
          tagName: "div",
          properties: { className: ["callout-body"] },
          children: body,
        },
      ]
    })
  }
}

// ---------------------------------------------------------------------------
// Fenced code: dark block with the language label and a copy button. The
// button is inert HTML; a small client component wires up the click.
function rehypeCodeBlocks() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return
      const code = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "code",
      )
      const classes = (code?.properties.className as string[] | undefined) ?? []
      const lang =
        classes.find((c) => c.startsWith("language-"))?.slice("language-".length) ?? "text"

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["code-block"] },
        children: [
          {
            type: "element",
            tagName: "div",
            properties: { className: ["code-head"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["code-lang"] },
                children: [{ type: "text", value: lang }],
              },
              {
                type: "element",
                tagName: "button",
                properties: { type: "button", className: ["code-copy"], dataCopy: "" },
                children: [{ type: "text", value: "Copy" }],
              },
            ],
          },
          node,
        ],
      }
      return SKIP
    })
  }
}

// ---------------------------------------------------------------------------
// Raw HTML in the Markdown is dropped by remark-rehype (allowDangerousHtml is
// off) and sanitize runs before any of our own transforms, so everything we
// add after it is trusted markup and user input never gets to add attributes.
export async function renderMarkdown(markdown: string, ctx: RenderContext): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { className: ["heading-anchor"], ariaLabel: "Link to this section" },
      content: { type: "text", value: "#" },
    })
    .use(rehypeHighlight, { detect: false })
    .use(rehypeWikiLinks, ctx)
    .use(rehypeCallouts)
    .use(rehypeCodeBlocks)
    .use(rehypeLinks, ctx)
    .use(rehypeStringify)
    .process(markdown)
  return String(file)
}

// ponytail: in-process cache keyed by page id plus blob sha, so an edited
// file misses and an unchanged one never re-renders. Bounded, oldest first.
// Swap for a table if render cost ever shows up in traces.
const CACHE_LIMIT = 300
// On globalThis so every route bundle shares one cache, and "clear cache"
// from an API route empties the one the page routes read.
const g = globalThis as { __renderCache?: Map<string, string> }
const cache = (g.__renderCache ??= new Map<string, string>())

// Returns how many entries were dropped.
export function clearRenderCache(): number {
  const n = cache.size
  cache.clear()
  return n
}

export async function renderCached(
  cacheKey: string,
  markdown: string,
  ctx: RenderContext,
): Promise<string> {
  const hit = cache.get(cacheKey)
  if (hit !== undefined) return hit
  const html = await renderMarkdown(markdown, ctx)
  cache.set(cacheKey, html)
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  return html
}
