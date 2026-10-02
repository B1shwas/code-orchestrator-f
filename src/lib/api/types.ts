// ============ WhyCODE backend contract (mirrors backend DTOs 1:1) ============
// Base URL: http://localhost:3000  |  Prefix: /api/v1 (except /health)
// Auth: Authorization: Bearer <app-JWT> on everything below except
//   GET /auth/github, GET /auth/github/callback, GET /health
// Dates arrive as ISO strings. Unknown JSON fields are REJECTED (send exact shapes).
// Error shape (all failures): { statusCode: number; message: string | string[]; error: string }
// Source of truth when in doubt: GET /api/v1/docs-json

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface UserProfile {
  id: string;
  githubId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface AuthUrlResponse {
  url: string;
  state: string;
  expiresIn: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  user: UserProfile;
}

export interface LogoutResponse {
  ok: boolean;
}

// GET /api/v1/auth/github
// GET /api/v1/auth/github/callback?code=&state= -> LoginResponse
// GET /api/v1/auth/me -> UserProfile
// POST /api/v1/auth/logout -> { ok: true }  (stateless: client discards JWT)

export type RepoStatus = "PENDING" | "CLONING" | "READY" | "ERROR";

export interface Repository {
  id: string; // uuid
  owner: string; // lowercased server-side
  name: string; // lowercased server-side
  defaultBranch: string;
  status: RepoStatus;
  stage: string | null; // "cloning" | "finalizing" | null (machine values — map to display copy)
  progress: number | null; // 5 | 80 | 100 | null
  sizeBytes: number | null; // null until first successful clone
  investigationCount: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface ConnectRepositoryBody {
  owner: string; // /^[a-zA-Z0-9_.-]+$/
  name: string; // /^[a-zA-Z0-9_.-]+$/
}

export interface GithubRepo {
  githubRepoId: number;
  owner: string;
  name: string;
  private?: boolean;
  defaultBranch?: string | null;
}

// GET /api/v1/repositories/github?page=&per_page= (1/30, per_page max 100) -> GithubRepo[]
// GET /api/v1/repositories -> Repository[] (mine, newest first)
// POST /api/v1/repositories {owner,name} -> Repository (status PENDING; poll detail)
// GET /api/v1/repositories/:id -> Repository (404 if unlinked)
// POST /api/v1/repositories/:id/retry -> Repository (only acts when ERROR)
// DELETE /api/v1/repositories/:id -> 204, empty body (unlink only, files kept)

// ---------------- analysis (all under /api/v1/repositories/:id/*) ----------------
// All require linked + READY repo. `path` is repo-relative, never absolute.
// .git paths -> 403/400. Unknown/extra query params are ignored (query, not body).

export interface TreeEntry {
  name: string;
  path: string; // repo-relative, feed back as ?path=
  type: "file" | "dir";
  size?: number; // files only
}
// GET /:id/tree?path=&depth=&limit= (defaults ""/2/100; depth max 5, limit max 200)

export interface FileContent {
  path: string;
  size: number;
  truncated: boolean; // true = first 256KB shown
  binary: boolean; // true => content is null, show notice
  content: string | null;
}
// GET /:id/file?path= (required)

export interface SearchMatch {
  file: string;
  line: number;
  column: number;
  preview: string;
}
// GET /:id/search?q=&limit= (default 50, max 100; literal, case-sensitive)

export interface SymbolInfo {
  name: string; // dotted: "Class.method"
  kind: "class" | "interface" | "function" | "method" | "enum";
  startLine: number;
  endLine: number;
}
// GET /:id/symbols?path= -> SymbolInfo[] ([] for non-code files: hide outline)
// GET /:id/symbol?path=&name= -> FileContent (exact symbol lines)

// ---------------- investigations ----------------
export type InvestigationStatus =
  | "PENDING"
  | "GATHERING_EVIDENCE"
  | "ANALYZING"
  | "COMPLETED"
  | "FAILED";

export interface CreateInvestigationBody {
  repositoryId: string; // uuid
  query: string; // required, <=2000 chars
  targetFile?: string; // <=500 chars, optional hint
  targetSymbol?: string; // <=300 chars, optional hint
}

export interface CodeEvidence {
  file: string;
  startLine: number;
  endLine: number;
  content: string;
  symbol?: string | null;
}
export interface CommitEvidence {
  sha: string;
  message: string;
  author?: string | null;
  date?: string | null; // ISO
}
export interface DiffEvidence {
  sha: string;
  file: string;
  patch: string; // truncated server-side
}
export interface PREvidence {
  number: number;
  title: string;
  body?: string | null;
}
export interface IssueEvidence {
  number: number;
  title: string;
  body?: string | null;
}
export interface EvidenceBundle {
  code: CodeEvidence[];
  commits: CommitEvidence[];
  diffs: DiffEvidence[];
  prs: PREvidence[];
  issues: IssueEvidence[];
  // set when history lookup found nothing: show info banner, NOT an error
  historyNote?: string | null;
}

export interface Investigation {
  id: string;
  repositoryId: string;
  query: string;
  targetFile: string | null;
  targetSymbol: string | null;
  status: InvestigationStatus;
  evidence: EvidenceBundle | null; // null until COMPLETED
  llmResponse: string | null; // markdown; null until COMPLETED (stays null on FAILED)
  createdAt: string;
  updatedAt: string;
}

// POST /api/v1/investigations {...} -> Investigation (status PENDING; poll detail)
// GET /api/v1/investigations?repositoryId=&limit= (default 20, max 100) -> Investigation[] newest first
// GET /api/v1/investigations/:id -> Investigation (poll every 2-3s while
//   PENDING/GATHERING_EVIDENCE/ANALYZING; stop at COMPLETED/FAILED, ~5-min cap)

// Citation format inside llmResponse:
//   [commit:<short-sha>]  [PR #<n>]  [<file>:<line>]
// Build links as: https://github.com/{owner}/{repo}/commit/{sha}
//                 https://github.com/{owner}/{repo}/pull/{n}
// (owner/name from the repository detail)
