import React, { useState } from "react";
import { Moon, Sun, Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import "svg2pdf.js";
import { useStore } from "../store/map";
import { useThemeStore } from "../hooks/useTheme";
import { getExportSvgUrl } from "../lib/api";
import logoSvg from "../assets/logo.svg";

export function Header() {
  const config = useStore((s) => s.config);
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPng = async () => {
    if (isExportingPng) return;
    setIsExportingPng(true);
    try {
      const res = await fetch(getExportSvgUrl());
      const svgText = await res.text();
      
      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Fill background (some SVGs might be transparent)
      ctx.fillStyle = "#0f1117"; // the dark background from svg-export
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0);
      
      const a = document.createElement("a");
      a.download = "nextmap.png";
      a.href = canvas.toDataURL("image/png");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export PNG:", error);
      alert("Failed to export PNG");
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch(getExportSvgUrl());
      const svgText = await res.text();
      
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgElement = svgDoc.documentElement;
      
      const width = parseFloat(svgElement.getAttribute("width") || "800");
      const height = parseFloat(svgElement.getAttribute("height") || "600");

      const pdf = new jsPDF({
        orientation: width > height ? "l" : "p",
        unit: "pt",
        format: [width, height],
      });

      await pdf.svg(svgElement, {
        x: 0,
        y: 0,
        width,
        height,
      });
      
      pdf.save("nextmap.pdf");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

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
        <button
          onClick={handleExportPng}
          disabled={isExportingPng}
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-colors hover:bg-nm-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: "var(--color-text-secondary)" }}
          title="Export as PNG"
        >
          {isExportingPng ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          PNG
        </button>
        <button
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md transition-colors hover:bg-nm-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: "var(--color-text-secondary)" }}
          title="Export as PDF"
        >
          {isExportingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          PDF
        </button>
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
