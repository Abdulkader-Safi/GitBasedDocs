// Page addresses. Kept apart from markdown.ts so client components (search,
// project switcher) can build links without pulling the whole Markdown
// pipeline (parse5, Shiki, KaTeX) into the browser bundle.

// Obsidian vaults are full of "My Note.md", so every segment gets encoded.
export function pageHref(projectSlug: string, slug: string, hash = "") {
  const path = slug ? `/${slug.split("/").map(encodeURIComponent).join("/")}` : ""
  return `/p/${encodeURIComponent(projectSlug)}${path}${hash}`
}
