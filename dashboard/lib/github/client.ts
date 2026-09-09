const API = "https://api.github.com"

export class GitHubError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Single fetch entry for the GitHub REST API. Token comes from env
// and never leaves the server.
export async function gh(path: string, token?: string) {
  const key = token ?? process.env.GITHUB_TOKEN
  if (!key) throw new GitHubError(0, "GITHUB_TOKEN is not set")
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    // Reads must be fresh during sync checks.
    cache: "no-store",
  })
  if (res.status === 304) return null
  if (!res.ok) {
    if (res.status === 401) {
      throw new GitHubError(401, "Token rejected. Check Contents read scope and repo access.")
    }
    if (res.status === 404) {
      // A private repo the token cannot reach answers 404, not 403, so this
      // message has to cover both "wrong name" and "no access granted".
      throw new GitHubError(
        404,
        "Not found with this token. Check owner, repo, and branch. If the repo is private, grant the token access to it with Contents: read.",
      )
    }
    if (res.status === 403 || res.status === 429) {
      throw new GitHubError(res.status, "Rate limited. Wait a minute and retry.")
    }
    throw new GitHubError(res.status, `GitHub responded ${res.status}`)
  }
  return res.json()
}
