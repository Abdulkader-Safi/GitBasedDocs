import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

// Auth tables mirror next-auth v4 shapes. Role and flags are ours.
// Timestamps are unix ms integers. Booleans are 0/1 integers.

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("viewer"),
  isActive: integer("is_active").notNull().default(1),
  mustChangePassword: integer("must_change_password").notNull().default(0),
  lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
  // Sessions are JWTs, so there is nothing server side to delete. Any token
  // issued before this moment is refused by the session callback.
  sessionsRevokedAt: integer("sessions_revoked_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
})

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (t) => [
    uniqueIndex("accounts_provider_uidx").on(t.provider, t.providerAccountId),
  ]
)

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("vt_identifier_token_uidx").on(t.identifier, t.token)]
)

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  repoPath: text("repo_path").notNull().unique(),
  description: text("description").notNull().default(""),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
})

export const projectMembers = sqliteTable(
  "project_members",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addedBy: text("added_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("project_members_uidx").on(t.projectId, t.userId)]
)

// One active row for v1. Token and webhook secret live in env, not here.
export const repoConnections = sqliteTable("repo_connections", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  repo: text("repo").notNull(),
  branch: text("branch").notNull().default("main"),
  docsRoot: text("docs_root").notNull().default(""), // "" = whole repo; set only to narrow
  status: text("status").notNull().default("connected"),
  lastSyncedSha: text("last_synced_sha"),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp_ms" }),
  lastError: text("last_error"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
})

export const docPages = sqliteTable(
  "doc_pages",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull().default(999),
    excerpt: text("excerpt").notNull().default(""),
    // Raw Markdown body (frontmatter stripped). Stored at sync time so a
    // page load reads the DB and never calls GitHub.
    content: text("content").notNull().default(""),
    description: text("description").notNull().default(""),
    // Blob size in bytes. Over the render cap the page shows "too large"
    // instead of rendering, and content stays empty.
    size: integer("size").notNull().default(0),
    blobSha: text("blob_sha"),
    headSha: text("head_sha"),
    status: text("status").notNull().default("active"),
    isDraft: integer("is_draft").notNull().default(0),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("doc_pages_project_path_uidx").on(t.projectId, t.path)]
)

export const syncLogs = sqliteTable("sync_logs", {
  id: text("id").primaryKey(),
  trigger: text("trigger").notNull(),
  // "unchanged", "synced" or "error". Errors on a synced run are warnings.
  status: text("status").notNull().default("synced"),
  headSha: text("head_sha"),
  added: integer("added").notNull().default(0),
  changed: integer("changed").notNull().default(0),
  removed: integer("removed").notNull().default(0),
  errors: text("errors").notNull().default(""),
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
})

export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    repoPath: text("repo_path").notNull(),
    hash: text("hash").notNull(),
    mimeType: text("mime_type").notNull().default("application/octet-stream"),
    size: integer("size").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("assets_project_path_uidx").on(t.projectId, t.repoPath)]
)

export const accessLogs = sqliteTable("access_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  projectId: text("project_id"),
  path: text("path").notNull(),
  allowed: integer("allowed").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
})
