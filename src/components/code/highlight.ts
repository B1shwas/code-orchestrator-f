import { codeToHtml } from "shiki";

const THEME = "github-dark";

const langByExtension: Record<string, string> = {
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  tsx: "tsx",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  py: "python",
  go: "go",
  java: "java",
  kt: "kotlin",
  rs: "rust",
  rb: "ruby",
  php: "php",
  cs: "csharp",
  cpp: "cpp",
  c: "c",
  h: "c",
  swift: "swift",
  json: "json",
  jsonc: "jsonc",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  md: "markdown",
  mdx: "mdx",
  html: "html",
  css: "css",
  scss: "scss",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  dockerfile: "docker",
  xml: "xml",
};

export function languageForPath(path: string): string {
  const file = path.split("/").pop() ?? path;
  if (file.toLowerCase() === "dockerfile") return "docker";
  const ext = file.includes(".") ? (file.split(".").pop() ?? "") : "";
  return langByExtension[ext.toLowerCase()] ?? "plaintext";
}

export function displayNameForLang(lang: string): string {
  const names: Record<string, string> = {
    typescript: "TypeScript",
    tsx: "TSX",
    javascript: "JavaScript",
    jsx: "JSX",
    python: "Python",
    plaintext: "Text",
  };
  return names[lang] ?? lang.charAt(0).toUpperCase() + lang.slice(1);
}

/**
 * VS Code-grade highlighting (shiki uses VS Code grammars).
 * Unknown languages fall back to plaintext — never throws.
 */
export async function highlightCode(code: string, lang: string): Promise<string> {
  try {
    return await codeToHtml(code, { lang, theme: THEME });
  } catch {
    return await codeToHtml(code, { lang: "plaintext", theme: THEME });
  }
}

function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

const htmlCache = new Map<string, Promise<string>>();
const MAX_CACHE_ENTRIES = 20;

/**
 * Cached promise for `React.use()` — same file+lang suspends once, then
 * resolves instantly on re-render (e.g. outline jumps must not re-highlight).
 */
export function getHighlightedHtml(content: string, lang: string): Promise<string> {
  const key = `${lang}:${content.length}:${hashString(content)}`;
  const hit = htmlCache.get(key);
  if (hit) return hit;
  const pending = highlightCode(content, lang);
  htmlCache.set(key, pending);
  if (htmlCache.size > MAX_CACHE_ENTRIES) {
    const oldest = htmlCache.keys().next();
    if (!oldest.done) htmlCache.delete(oldest.value);
  }
  return pending;
}

/**
 * Tag every rendered line with L1..LN so outline clicks can scroll to it.
 * Shiki emits one `<span class="line">` per line, in order.
 */
export function tagLines(html: string): { html: string; count: number } {
  const parts = html.split('<span class="line">');
  if (parts.length <= 1) return { html, count: 0 };
  const tagged =
    parts[0] +
    parts
      .slice(1)
      .map((part, i) => `<span class="line" id="L${i + 1}">` + part)
      .join("");
  return { html: tagged, count: parts.length - 1 };
}
