import React, { useMemo } from "react";
import { useThemeStore } from "../hooks/useTheme";

const DARK_COLORS: Record<string, string> = {
  keyword: "#c792ea",
  string: "#c3e88d",
  comment: "#546e7a",
  number: "#f78c6c",
  plain: "#d4d4d8",
};

const LIGHT_COLORS: Record<string, string> = {
  keyword: "#7c3aed",
  string: "#16a34a",
  comment: "#9ca3af",
  number: "#d97706",
  plain: "#1e293b",
};

const DARK_BG = "#1e1e2e";
const DARK_GUTTER = "#4a4a6a";
const DARK_GUTTER_BORDER = "#2a2a3e";

const LIGHT_BG = "#f8f9fb";
const LIGHT_GUTTER = "#94a3b8";
const LIGHT_GUTTER_BORDER = "#e2e8f0";

const KEYWORDS = new Set([
  "export", "import", "from", "function", "async", "await", "const", "let", "var",
  "return", "if", "else", "for", "while", "switch", "case", "default", "break",
  "continue", "new", "this", "class", "extends", "type", "interface", "enum",
  "null", "undefined", "true", "false", "typeof", "instanceof", "void",
  "throw", "try", "catch", "finally", "as", "in", "of", "implements",
]);

interface Token {
  type: string;
  value: string;
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Line comments
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ type: "comment", value: line.slice(i) });
      return tokens;
    }

    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") { j += 2; continue; }
        if (line[j] === quote) break;
        j++;
      }
      tokens.push({ type: "string", value: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Words (keywords vs identifiers)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tokens.push({ type: KEYWORDS.has(word) ? "keyword" : "plain", value: word });
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[0-9._]/.test(line[j])) j++;
      tokens.push({ type: "number", value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Everything else (whitespace, punctuation, operators)
    tokens.push({ type: "plain", value: line[i] });
    i++;
  }

  return tokens;
}

interface CodeBlockProps {
  code: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const bg = isDark ? DARK_BG : LIGHT_BG;
  const gutterColor = isDark ? DARK_GUTTER : LIGHT_GUTTER;
  const gutterBorder = isDark ? DARK_GUTTER_BORDER : LIGHT_GUTTER_BORDER;

  const lines = useMemo(() => code.split("\n"), [code]);
  const gutterWidth = String(lines.length).length * 8 + 24;

  return (
    <div
      style={{
        background: bg,
        borderRadius: 8,
        fontSize: 11,
        lineHeight: 1.7,
        fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
        border: isDark ? "none" : "1px solid #e2e8f0",
      }}
    >
      <table style={{ borderSpacing: 0, borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          {lines.map((line, i) => {
            const tokens = tokenizeLine(line);
            return (
              <tr key={i}>
                <td
                  style={{
                    color: gutterColor,
                    textAlign: "right",
                    padding: "0 12px",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    width: gutterWidth,
                    borderRight: `1px solid ${gutterBorder}`,
                    verticalAlign: "top",
                  }}
                >
                  {i + 1}
                </td>
                <td style={{ padding: "0 12px", whiteSpace: "pre" }}>
                  {tokens.map((token, j) => (
                    <span
                      key={j}
                      style={{ color: colors[token.type] || colors.plain }}
                    >
                      {token.value}
                    </span>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
