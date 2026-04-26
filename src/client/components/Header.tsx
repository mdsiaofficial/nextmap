import React from "react";
import { Moon, Sun, Download } from "lucide-react";
import { useStore } from "../store/map";
import { useThemeStore } from "../hooks/useTheme";
import { getExportSvgUrl, getExportPngUrl, getExportPdfUrl } from "../lib/api";
import logoSvg from "../assets/logo.svg";

export function Header() {
  const config = useStore((s) => s.config);
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <header
      className="h-12 flex items-center justify-between px-5 shrink-0"
      style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <a
          href="https://www.npmjs.com/package/nextmap"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src={logoSvg} alt="nextmap" className="w-6 h-6" />
          <span className="text-base font-bold tracking-tight" style={{ color: "#6366f1" }}>
            nextmap
          </span>
        </a>
        {config && (
          <>
            <span style={{ color: "var(--color-muted)" }}>/</span>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {config.projectName}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: "var(--color-border)", color: "var(--color-muted)" }}
            >
              {config.router} router
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {config && (
          <div className="flex items-center gap-3 mr-2 text-xs" style={{ color: "var(--color-muted)" }}>
            <span>{config.totalPages} pages</span>
            <span>{config.totalApiRoutes} APIs</span>
          </div>
        )}
        <a
          href={getExportSvgUrl()}
          download="nextmap.svg"
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-colors hover:bg-nm-accent/10"
          style={{ color: "var(--color-text-secondary)" }}
          title="Export as SVG"
        >
          <Download size={13} />
          SVG
        </a>
        <a
          href={getExportPngUrl()}
          download="nextmap.png"
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-colors hover:bg-nm-accent/10"
          style={{ color: "var(--color-text-secondary)" }}
          title="Export as PNG"
        >
          <Download size={13} />
          PNG
        </a>
        <a
          href={getExportPdfUrl()}
          download="nextmap.pdf"
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-colors hover:bg-nm-accent/10"
          style={{ color: "var(--color-text-secondary)" }}
          title="Export as PDF"
        >
          <Download size={13} />
          PDF
        </a>
        <button
          onClick={toggle}
          className="p-1.5 rounded-md transition-colors hover:bg-nm-accent/10"
          style={{ color: "var(--color-muted)" }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
