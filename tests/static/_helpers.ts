import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type SourceFile = {
  path: string;
  text: string;
  stripped: string;
  strippedComments: string;
};

export type Match = {
  line: number;
  column: number;
  match: string;
};

const REPO_ROOT = resolve(import.meta.dir, "..", "..");

export function repoPath(rel: string): string {
  return resolve(REPO_ROOT, rel);
}

export async function readSourceFiles(relPaths: string[]): Promise<SourceFile[]> {
  const out: SourceFile[] = [];
  for (const rel of relPaths) {
    const path = repoPath(rel);
    const text = await readFile(path, "utf8");
    out.push({
      path,
      text,
      stripped: stripCommentsAndStrings(text),
      strippedComments: stripComments(text),
    });
  }
  return out;
}

export function stripComments(text: string): string {
  const out: string[] = [];
  const len = text.length;
  let i = 0;
  let mode: "code" | "line-comment" | "block-comment" | "single" | "double" | "template" = "code";

  const pushNonNewline = (ch: string) => {
    out.push(ch === "\n" ? "\n" : " ");
  };

  while (i < len) {
    const ch = text[i] as string;
    const next: string | undefined = text[i + 1];

    if (mode === "code") {
      if (ch === "/" && next === "/") {
        mode = "line-comment";
        out.push("  ");
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        mode = "block-comment";
        out.push("  ");
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = "single";
        out.push("'");
        i += 1;
        continue;
      }
      if (ch === '"') {
        mode = "double";
        out.push('"');
        i += 1;
        continue;
      }
      if (ch === "`") {
        mode = "template";
        out.push("`");
        i += 1;
        continue;
      }
      out.push(ch);
      i += 1;
      continue;
    }

    if (mode === "line-comment") {
      if (ch === "\n") {
        mode = "code";
        out.push("\n");
        i += 1;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "block-comment") {
      if (ch === "*" && next === "/") {
        mode = "code";
        out.push("  ");
        i += 2;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "single") {
      if (ch === "\\" && next !== undefined) {
        out.push(ch);
        out.push(next as string);
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = "code";
        out.push("'");
        i += 1;
        continue;
      }
      out.push(ch);
      i += 1;
      continue;
    }

    if (mode === "double") {
      if (ch === "\\" && next !== undefined) {
        out.push(ch);
        out.push(next as string);
        i += 2;
        continue;
      }
      if (ch === '"') {
        mode = "code";
        out.push('"');
        i += 1;
        continue;
      }
      out.push(ch);
      i += 1;
      continue;
    }

    if (mode === "template") {
      if (ch === "\\" && next !== undefined) {
        out.push(ch);
        out.push(next as string);
        i += 2;
        continue;
      }
      if (ch === "`") {
        mode = "code";
        out.push("`");
        i += 1;
        continue;
      }
      out.push(ch);
      i += 1;
      continue;
    }
  }

  return out.join("");
}

export function stripCommentsAndStrings(text: string): string {
  const out: string[] = [];
  const len = text.length;
  let i = 0;
  let mode: "code" | "line-comment" | "block-comment" | "single" | "double" | "template" = "code";

  const pushNonNewline = (ch: string) => {
    out.push(ch === "\n" ? "\n" : " ");
  };

  while (i < len) {
    const ch = text[i] as string;
    const next: string | undefined = text[i + 1];

    if (mode === "code") {
      if (ch === "/" && next === "/") {
        mode = "line-comment";
        out.push("  ");
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        mode = "block-comment";
        out.push("  ");
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = "single";
        out.push("'");
        i += 1;
        continue;
      }
      if (ch === '"') {
        mode = "double";
        out.push('"');
        i += 1;
        continue;
      }
      if (ch === "`") {
        mode = "template";
        out.push("`");
        i += 1;
        continue;
      }
      out.push(ch);
      i += 1;
      continue;
    }

    if (mode === "line-comment") {
      if (ch === "\n") {
        mode = "code";
        out.push("\n");
        i += 1;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "block-comment") {
      if (ch === "*" && next === "/") {
        mode = "code";
        out.push("  ");
        i += 2;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "single") {
      if (ch === "\\" && next !== undefined) {
        pushNonNewline(ch);
        pushNonNewline(next);
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = "code";
        out.push("'");
        i += 1;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "double") {
      if (ch === "\\" && next !== undefined) {
        pushNonNewline(ch);
        pushNonNewline(next);
        i += 2;
        continue;
      }
      if (ch === '"') {
        mode = "code";
        out.push('"');
        i += 1;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "template") {
      if (ch === "\\" && next !== undefined) {
        pushNonNewline(ch);
        pushNonNewline(next);
        i += 2;
        continue;
      }
      if (ch === "`") {
        mode = "code";
        out.push("`");
        i += 1;
        continue;
      }
      if (ch === "$" && next === "{") {
        out.push("${");
        i += 2;
        let depth = 1;
        while (i < len && depth > 0) {
          const c = text[i] as string;
          if (c === "{") depth += 1;
          else if (c === "}") depth -= 1;
          if (depth === 0) {
            out.push("}");
            i += 1;
            break;
          }
          out.push(c);
          i += 1;
        }
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }
  }

  return out.join("");
}

export function findMatches(stripped: string, pattern: RegExp): Match[] {
  if (!pattern.global) {
    throw new Error("findMatches requires a global RegExp");
  }
  const matches: Match[] = [];
  pattern.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(stripped)) !== null) {
    const upto = stripped.slice(0, m.index);
    const lastNewline = upto.lastIndexOf("\n");
    const line = upto.split("\n").length;
    const column = lastNewline === -1 ? m.index + 1 : m.index - lastNewline;
    matches.push({ line, column, match: m[0] });
    if (m.index === pattern.lastIndex) pattern.lastIndex += 1;
  }
  return matches;
}

export function describeViolations(
  file: SourceFile,
  patternLabel: string,
  matches: Match[],
): string {
  const lines = matches.map((m) => `  ${file.path}:${m.line}:${m.column} -> ${m.match.trim()}`);
  return `Forbidden pattern "${patternLabel}" found in ${file.path}:\n${lines.join("\n")}`;
}
