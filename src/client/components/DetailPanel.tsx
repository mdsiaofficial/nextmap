import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, File, Copy, Check, Code, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useStore } from "../store/map";
import { getMethodColor, getTypeColor } from "../lib/layout";
import { fetchSource } from "../lib/api";
import { CodeBlock } from "./CodeBlock";

const MIN_WIDTH = 240;
const MAX_WIDTH = 800;

export function DetailPanel() {
  const selectedRoute = useStore((s) => s.selectedRoute);
  const selectRoute = useStore((s) => s.selectRoute);
  const [copied, setCopied] = useState(false);
  const [width, setWidth] = useState(680);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Source code state
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(true);
  const [sourceError, setSourceError] = useState<string | null>(null);

  // Fetch source when route changes
  useEffect(() => {
    if (!selectedRoute) {
      setSourceCode(null);
      setSourceError(null);
      return;
    }

    let cancelled = false;
    setSourceLoading(true);
    setSourceError(null);

    fetchSource(selectedRoute.filePath)
      .then((code) => {
        if (!cancelled) setSourceCode(code);
      })
      .catch((err) => {
        if (!cancelled) setSourceError(err.message);
      })
      .finally(() => {
        if (!cancelled) setSourceLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedRoute?.id]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [width]);

  if (!selectedRoute) return null;

  const typeColor = getTypeColor(selectedRoute.type);

  return (
    <div className="shrink-0 flex" style={{ width }}>
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="w-1 shrink-0 cursor-col-resize hover:bg-nm-accent/30 active:bg-nm-accent/50 transition-colors"
        style={{ background: "var(--color-border)" }}
      />

      <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "var(--color-surface)" }}>
        <div className="flex items-center justify-between p-3 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Route Details
          </span>
          <button
            onClick={() => selectRoute(null)}
            className="p-1 rounded hover:bg-nm-accent/10"
            style={{ color: "var(--color-muted)" }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 flex flex-col" style={{ gap: "12px", padding: "12px", overflow: "hidden" }}>
          {/* Metadata — shrink-0 so source code gets remaining space */}
          <div className="shrink-0 space-y-3">
            {/* Path */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--color-muted)" }}>
                Path
              </label>
              <div className="text-sm font-mono font-semibold mt-1" style={{ color: "var(--color-text)" }}>
                {selectedRoute.path}
              </div>
            </div>

            {/* Type & Router */}
            <div className="flex gap-2">
              <span
                className="text-xs px-2 py-1 rounded font-medium"
                style={{ background: `${typeColor}15`, color: typeColor }}
              >
                {selectedRoute.type}
              </span>
              <span
                className="text-xs px-2 py-1 rounded"
                style={{ background: "var(--color-border)", color: "var(--color-muted)" }}
              >
                {selectedRoute.router} router
              </span>
            </div>

            {/* Methods */}
            {selectedRoute.methods.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--color-muted)" }}>
                  Methods
                </label>
                <div className="flex gap-1 mt-1">
                  {selectedRoute.methods.map((m) => (
                    <span
                      key={m}
                      className="text-xs font-mono font-bold px-2 py-1 rounded"
                      style={{ background: `${getMethodColor(m)}15`, color: getMethodColor(m) }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* File with copy */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--color-muted)" }}>
                File
              </label>
              <div
                className="flex items-center gap-1.5 mt-1 group cursor-pointer rounded px-1.5 py-1 -mx-1.5 transition-colors"
                onClick={() => handleCopy(selectedRoute.filePath)}
                style={{ background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                title="Click to copy file path"
              >
                <File size={12} style={{ color: "var(--color-muted)" }} />
                <span className="text-xs font-mono flex-1" style={{ color: "var(--color-text-secondary)" }}>
                  {selectedRoute.filePath}
                </span>
                {copied ? (
                  <Check size={12} className="text-nm-accent shrink-0" />
                ) : (
                  <Copy size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--color-muted)" }} />
                )}
              </div>
            </div>

            {/* Dynamic segments */}
            {selectedRoute.isDynamic && (
              <div>
                <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--color-muted)" }}>
                  Dynamic Segments
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedRoute.dynamicSegments.map((seg) => (
                    <span
                      key={seg}
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: "#f9731615", color: "#f97316" }}
                    >
                      {seg}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Special files */}
            {(selectedRoute.specialFiles.loading || selectedRoute.specialFiles.error || selectedRoute.specialFiles.notFound || selectedRoute.specialFiles.template) && (
              <div>
                <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--color-muted)" }}>
                  Special Files
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedRoute.specialFiles.loading && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#6b728015", color: "#6b7280" }}>loading.tsx</span>
                  )}
                  {selectedRoute.specialFiles.error && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#ef444415", color: "#ef4444" }}>error.tsx</span>
                  )}
                  {selectedRoute.specialFiles.notFound && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#f9731615", color: "#f97316" }}>not-found.tsx</span>
                  )}
                  {selectedRoute.specialFiles.template && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#6366f115", color: "#6366f1" }}>template.tsx</span>
                  )}
                </div>
              </div>
            )}

            {/* Middleware matchers */}
            {selectedRoute.middlewareMatchers && (
              <div>
                <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--color-muted)" }}>
                  Middleware Matchers
                </label>
                <div className="space-y-1 mt-1">
                  {selectedRoute.middlewareMatchers.map((m) => (
                    <div key={m} className="text-xs font-mono" style={{ color: "#f59e0b" }}>
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Route group */}
            {selectedRoute.isRouteGroup && (
              <div>
                <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--color-muted)" }}>
                  Route Group
                </label>
                <div className="text-xs font-mono mt-1" style={{ color: "#8b5cf6" }}>
                  ({selectedRoute.groupName})
                </div>
              </div>
            )}

            {/* Parallel slot */}
            {selectedRoute.isParallelSlot && (
              <div className="text-xs px-2 py-1 rounded" style={{ background: "#6366f115", color: "#6366f1" }}>
                Parallel Route Slot
              </div>
            )}
          </div>

          {/* Source code — sizes to content, caps at remaining space, scrolls if needed */}
          <div className="flex flex-col" style={{ flex: "0 1 auto", minHeight: 0, overflow: "hidden", borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
            <button
              onClick={() => setSourceOpen(!sourceOpen)}
              className="flex items-center gap-1.5 text-left shrink-0"
              style={{ color: "var(--color-text)" }}
            >
              {sourceOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <Code size={12} />
              <span className="text-[10px] uppercase tracking-wider font-medium">Source Code</span>
            </button>

            {sourceOpen && (
              <div className="mt-2" style={{ flex: "0 1 auto", minHeight: 0, overflowY: "auto" }}>
                {sourceLoading && (
                  <div className="flex items-center gap-2 text-xs py-4 justify-center" style={{ color: "var(--color-muted)" }}>
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </div>
                )}
                {sourceError && (
                  <div className="text-xs py-2" style={{ color: "#ef4444" }}>
                    {sourceError}
                  </div>
                )}
                {sourceCode && !sourceLoading && (
                  <CodeBlock code={sourceCode} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
