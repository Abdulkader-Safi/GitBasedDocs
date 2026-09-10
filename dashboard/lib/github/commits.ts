import { gh } from "./client"

export interface LastCommit {
  sha: string
  author: string
  at: Date
  message: string
}

// GitHub's commit list, newest first, reduced to what a page shows: who,
// when, which commit, and the first line of its message.
export function commitFrom(json: unknown): LastCommit | null {
  const c = Array.isArray(json) ? json[0] : null
  if (!c || typeof c.sha !== "string" || !c.commit) return null
  const who = c.commit.author ?? c.commit.committer ?? {}
  const at = new Date(who.date)
  if (Number.isNaN(at.getTime())) return null
  return {
    sha: c.sha,
    author: String(who.name || c.author?.login || "unknown").slice(0, 100),
    at,
    message: String(c.commit.message ?? "").split("\n")[0].slice(0, 200),
  }
}

// The newest commit that touched `path` as of `ref`. One request per changed
// page at sync time. Optional: any failure (rate limit included) returns null
// and the page syncs without it.
export async function lastCommit(owner: string, repo: string, ref: string, path: string) {
  try {
    return commitFrom(
      await gh(`/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(ref)}&path=${encodeURIComponent(path)}&per_page=1`),
    )
  } catch {
    return null
  }
}
