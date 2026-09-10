// Pure tree logic for the doc viewer: sidebar structure, reading order,
// breadcrumb. No DB, so it is easy to check in isolation.

export interface TreeInput {
  slug: string
  title: string
  sortOrder: number
}

export interface TreePage {
  kind: "page"
  slug: string
  title: string
  order: number
}

export interface TreeFolder {
  kind: "folder"
  // Slug prefix, e.g. "guides" or "guides/advanced".
  path: string
  title: string
  order: number
  // The folder's own index page, when it has one. Clicking the folder label
  // opens it.
  indexSlug: string | null
  children: TreeNode[]
}

export type TreeNode = TreePage | TreeFolder

export function humanize(segment: string): string {
  const words = segment.replace(/[-_]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function byOrder(a: TreeNode, b: TreeNode) {
  if (a.order !== b.order) return a.order - b.order
  return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" })
}

// Folders come from path segments. A page whose slug equals a folder path
// (guides/index.md becomes "guides") names and orders that folder instead of
// sitting inside it. The project index ("") stays a normal top-level page.
export function buildTree(pages: TreeInput[]): TreeNode[] {
  const root: TreeFolder = {
    kind: "folder", path: "", title: "", order: 0, indexSlug: null, children: [],
  }
  const folders = new Map<string, TreeFolder>([["", root]])

  const folderFor = (path: string): TreeFolder => {
    const existing = folders.get(path)
    if (existing) return existing
    const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : ""
    const parent = folderFor(parentPath)
    const folder: TreeFolder = {
      kind: "folder",
      path,
      title: humanize(path.slice(path.lastIndexOf("/") + 1)),
      order: 999,
      indexSlug: null,
      children: [],
    }
    parent.children.push(folder)
    folders.set(path, folder)
    return folder
  }

  // Every folder prefix that has something under it, collected once so the
  // index check is a set lookup rather than a scan per page.
  const folderPaths = new Set<string>()
  for (const p of pages) {
    const parts = p.slug.split("/")
    for (let i = 1; i < parts.length; i++) folderPaths.add(parts.slice(0, i).join("/"))
  }
  const isFolderIndex = (slug: string) => slug !== "" && folderPaths.has(slug)

  for (const page of pages) {
    if (isFolderIndex(page.slug)) {
      const folder = folderFor(page.slug)
      folder.title = page.title
      folder.order = page.sortOrder
      folder.indexSlug = page.slug
      continue
    }
    const parentPath = page.slug.includes("/")
      ? page.slug.slice(0, page.slug.lastIndexOf("/"))
      : ""
    folderFor(parentPath).children.push({
      kind: "page", slug: page.slug, title: page.title, order: page.sortOrder,
    })
  }

  const sortDeep = (nodes: TreeNode[]) => {
    nodes.sort(byOrder)
    for (const n of nodes) if (n.kind === "folder") sortDeep(n.children)
  }
  // The project index always leads, whatever its order says.
  sortDeep(root.children)
  const idx = root.children.findIndex((n) => n.kind === "page" && n.slug === "")
  if (idx > 0) root.children.unshift(...root.children.splice(idx, 1))
  return root.children
}

// Reading order for prev and next: the order the sidebar shows, with a
// folder's index page read before its children.
export function flatten(nodes: TreeNode[]): { slug: string; title: string }[] {
  const out: { slug: string; title: string }[] = []
  for (const n of nodes) {
    if (n.kind === "page") out.push({ slug: n.slug, title: n.title })
    else {
      if (n.indexSlug !== null) out.push({ slug: n.indexSlug, title: n.title })
      out.push(...flatten(n.children))
    }
  }
  return out
}

export function neighbours(nodes: TreeNode[], slug: string) {
  const order = flatten(nodes)
  const i = order.findIndex((p) => p.slug === slug)
  return {
    prev: i > 0 ? order[i - 1] : null,
    next: i >= 0 && i < order.length - 1 ? order[i + 1] : null,
  }
}

// Folder trail between the project and the page, using folder titles.
export function trail(nodes: TreeNode[], slug: string): { title: string; slug: string | null }[] {
  const parts = slug.split("/")
  const out: { title: string; slug: string | null }[] = []
  let level = nodes
  for (let i = 0; i < parts.length - 1; i++) {
    const path = parts.slice(0, i + 1).join("/")
    const folder = level.find(
      (n): n is TreeFolder => n.kind === "folder" && n.path === path,
    )
    if (!folder) break
    out.push({ title: folder.title, slug: folder.indexSlug })
    level = folder.children
  }
  return out
}

// Folders on the path to the active page start open in the sidebar.
export function openFolders(slug: string): Set<string> {
  const parts = slug.split("/")
  const open = new Set<string>()
  for (let i = 1; i <= parts.length; i++) open.add(parts.slice(0, i).join("/"))
  return open
}

// Landing page: the project index when there is one, else the first page in
// reading order.
export function landingSlug(nodes: TreeNode[]): string | null {
  const order = flatten(nodes)
  const index = order.find((p) => p.slug === "")
  return index ? index.slug : (order[0]?.slug ?? null)
}
