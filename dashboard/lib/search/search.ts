import { and, desc, eq, ne, or, sql } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { accessLogs, docPages } from "@/lib/db/schema"

export interface SearchHit {
  slug: string
  title: string
  // Folder trail, e.g. "guides / advanced". Empty for top-level pages.
  trail: string
  snippet: string
}

const MAX_TERMS = 8
const SNIPPET_CHARS = 160

// "  Rate  LIMITS " -> ["rate", "limits"]. Capped so a pasted paragraph
// cannot turn into a query with hundreds of clauses.
export function tokenize(query: string): string[] {
  return [...new Set(query.toLowerCase().split(/\s+/).filter(Boolean))].slice(0, MAX_TERMS)
}

// A user typing "100%" or "a_b" means those characters, not LIKE wildcards.
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export function trailOf(slug: string): string {
  const parts = slug.split("/")
  return parts.slice(0, -1).join(" / ")
}

// Markdown to searchable plain text: the same cleanup the index excerpt uses,
// without the length cap.
export function plainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[\[[^\]]*\]\]/g, " ")
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, t, label) => label ?? t)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}>\s?(\[![A-Za-z]+\])?/gm, "")
    .replace(/[*_]{1,3}/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// One line around the first term found, cut on word boundaries.
export function makeSnippet(text: string, terms: string[]): string {
  const lower = text.toLowerCase()
  const hit = terms
    .map((t) => lower.indexOf(t))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0]
  if (hit === undefined) return text.slice(0, SNIPPET_CHARS).trim()

  let start = Math.max(0, hit - 50)
  let end = Math.min(text.length, start + SNIPPET_CHARS)
  if (start > 0) start = text.indexOf(" ", start) + 1 || start
  if (end < text.length) end = text.lastIndexOf(" ", end) || end
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`
}

// Every term must appear in the title or body. Title matches rank above
// body matches. Always filtered to one project, so a query can never reach
// another project's rows.
export async function searchPages(
  projectId: string,
  query: string,
  opts: { includeDrafts: boolean; limit?: number },
): Promise<SearchHit[]> {
  const terms = tokenize(query)
  if (!terms.length) return []
  const db = await getDb()

  const perTerm = terms.map((t) => {
    const pattern = `%${escapeLike(t)}%`
    return or(
      sql`${docPages.title} like ${pattern} escape '\\'`,
      sql`${docPages.content} like ${pattern} escape '\\'`,
    )
  })
  const titleHits = sql.join(
    terms.map((t) => sql`(case when ${docPages.title} like ${`%${escapeLike(t)}%`} escape '\\' then 1 else 0 end)`),
    sql` + `,
  )
  const titleStarts = sql`(case when ${docPages.title} like ${`${escapeLike(terms[0])}%`} escape '\\' then 1 else 0 end)`

  const rows = await db
    .select({
      slug: docPages.slug,
      title: docPages.title,
      content: docPages.content,
      score: sql<number>`(${titleHits}) * 2 + ${titleStarts}`.as("score"),
    })
    .from(docPages)
    .where(
      and(
        eq(docPages.projectId, projectId),
        ne(docPages.status, "deleted"),
        opts.includeDrafts ? undefined : eq(docPages.isDraft, 0),
        ...perTerm,
      ),
    )
    .orderBy(desc(sql`score`), docPages.title)
    .limit(opts.limit ?? 20)

  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    trail: trailOf(r.slug),
    snippet: makeSnippet(plainText(r.content), terms),
  }))
}

// Empty query: the pages this person opened most recently in this project,
// then the most recently updated ones to fill the list.
export async function recentPages(
  projectId: string,
  projectSlug: string,
  userId: string,
  opts: { includeDrafts: boolean; limit?: number },
): Promise<SearchHit[]> {
  const limit = opts.limit ?? 8
  const db = await getDb()

  const pages = await db
    .select({ slug: docPages.slug, title: docPages.title, updatedAt: docPages.updatedAt })
    .from(docPages)
    .where(
      and(
        eq(docPages.projectId, projectId),
        ne(docPages.status, "deleted"),
        opts.includeDrafts ? undefined : eq(docPages.isDraft, 0),
      ),
    )
  const bySlug = new Map(pages.map((p) => [p.slug, p]))

  const opened = await db
    .select({ path: accessLogs.path })
    .from(accessLogs)
    .where(
      and(
        eq(accessLogs.projectId, projectId),
        eq(accessLogs.userId, userId),
        eq(accessLogs.allowed, 1),
      ),
    )
    .orderBy(desc(accessLogs.createdAt))
    .limit(200)

  // Only page opens in this project are here (projectId filter above), so
  // every path starts with this prefix.
  const prefix = `/p/${projectSlug}`
  const seen = new Set<string>()
  const out: SearchHit[] = []
  const push = (slug: string) => {
    const page = bySlug.get(slug)
    if (!page || seen.has(slug) || out.length >= limit) return
    seen.add(slug)
    out.push({ slug, title: page.title, trail: trailOf(slug), snippet: "" })
  }

  for (const { path } of opened) {
    const rest = path.slice(prefix.length).replace(/^\//, "")
    let slug = rest
    try {
      slug = rest.split("/").map(decodeURIComponent).join("/")
    } catch {
      // A malformed path in the log is just skipped.
    }
    push(slug)
  }
  for (const p of [...pages].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())) push(p.slug)
  return out
}
