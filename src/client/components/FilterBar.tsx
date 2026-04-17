import React from "react";
import { Search, ArrowDownUp, ArrowRightLeft } from "lucide-react";
import { useStore } from "../store/map";
import type { RouteType } from "../lib/api";

const TYPE_FILTERS: Array<{ label: string; value: RouteType | "all" }> = [
  { label: "All", value: "all" },
  { label: "Pages", value: "page" },
  { label: "APIs", value: "api" },
  { label: "Middleware", value: "middleware" },
];

export function FilterBar() {
  const filterType = useStore((s) => s.filterType);
  const setFilterType = useStore((s) => s.setFilterType);
  const filterRouter = useStore((s) => s.filterRouter);
  const setFilterRouter = useStore((s) => s.setFilterRouter);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const scanResult = useStore((s) => s.scanResult);
  const direction = useStore((s) => s.direction);
  const toggleDirection = useStore((s) => s.toggleDirection);

  const isHybrid = scanResult?.router === "hybrid";

  return (
    <div
      className="h-10 flex items-center gap-3 px-4 shrink-0"
      style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Search */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-muted)" }}
        />
        <input
          type="text"
          placeholder="Filter routes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 pr-3 py-1 text-xs rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-nm-accent"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
      </div>

      {/* Type filter */}
      <div className="flex gap-1">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterType(f.value)}
            className="text-xs px-2 py-1 rounded-md transition-colors"
            style={{
              background: filterType === f.value ? "#6366f120" : "transparent",
              color: filterType === f.value ? "#6366f1" : "var(--color-muted)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Router filter (only for hybrid) */}
      {isHybrid && (
        <>
          <div
            style={{ width: 1, height: 16, background: "var(--color-border)" }}
          />
          <div className="flex gap-1">
            {(["all", "app", "pages"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRouter(r)}
                className="text-xs px-2 py-1 rounded-md transition-colors"
                style={{
                  background: filterRouter === r ? "#6366f120" : "transparent",
                  color: filterRouter === r ? "#6366f1" : "var(--color-muted)",
                }}
              >
                {r === "all"
                  ? "All"
                  : r === "app"
                    ? "App Router"
                    : "Pages Router"}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Direction toggle */}
      <button
        onClick={toggleDirection}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:bg-nm-accent/10"
        style={{ color: "var(--color-muted)" }}
        title={
          direction === "TB"
            ? "Switch to left-to-right"
            : "Switch to top-to-bottom"
        }
      >
        {direction === "TB" ? (
          <ArrowRightLeft size={13} />
        ) : (
          <ArrowDownUp size={13} />
        )}
        {direction === "TB" ? "L \u2192 R" : "T \u2192 B"}
      </button>
    </div>
  );
}
