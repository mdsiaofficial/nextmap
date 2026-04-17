import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText, Zap, Globe, Lock } from "lucide-react";
import type { RouteNodeData } from "../lib/layout";
import { getMethodColor, getTypeColor } from "../lib/layout";
import { useStore } from "../store/map";

function RouteNodeComponent({ data }: NodeProps) {
  const { route, direction = "TB" } = data as RouteNodeData;
  const selectRoute = useStore((s) => s.selectRoute);
  const selectedRoute = useStore((s) => s.selectedRoute);
  const isSelected = selectedRoute?.id === route.id;
  const typeColor = getTypeColor(route.type);

  return (
    <div
      onClick={() => selectRoute(route)}
      className="cursor-pointer"
      style={{
        background: "var(--color-surface)",
        border: `2px solid ${isSelected ? typeColor : "var(--color-border)"}`,
        borderRadius: 10,
        padding: "10px 14px",
        minWidth: 260,
        boxShadow: isSelected
          ? `0 0 16px ${typeColor}40`
          : "0 1px 3px rgba(0,0,0,0.1)",
        zIndex: isSelected ? 1000 : 1,
        transform: isSelected ? "scale(1.03)" : "scale(1)",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      <Handle
        type="target"
        position={direction === "LR" ? Position.Left : Position.Top}
        style={{ opacity: 0 }}
      />

      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-white"
          style={{ background: typeColor, fontSize: 10, fontWeight: 700 }}
        >
          {route.type === "page" ? "P" : route.type === "api" ? "A" : "M"}
        </div>
        <span
          className="text-xs font-mono font-semibold truncate"
          style={{ color: "var(--color-text)" }}
        >
          {route.path}
        </span>
        {route.isDynamic && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded"
            style={{ background: "#f9731620", color: "#f97316" }}
          >
            dynamic
          </span>
        )}
      </div>

      {route.methods.length > 0 && (
        <div className="flex gap-1 mb-1.5">
          {route.methods.map((m) => (
            <span
              key={m}
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{
                background: `${getMethodColor(m)}15`,
                color: getMethodColor(m),
              }}
            >
              {m}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-mono truncate"
          style={{ color: "var(--color-muted)" }}
        >
          {route.filePath}
        </span>
      </div>

      {/* Special file indicators */}
      {(route.specialFiles.loading ||
        route.specialFiles.error ||
        route.specialFiles.notFound ||
        route.specialFiles.template) && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {route.specialFiles.loading && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "#6b728025", color: "#6b7280" }}
            >
              loading
            </span>
          )}
          {route.specialFiles.error && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "#ef444425", color: "#ef4444" }}
            >
              error
            </span>
          )}
          {route.specialFiles.notFound && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "#f9731625", color: "#f97316" }}
            >
              not-found
            </span>
          )}
          {route.specialFiles.template && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "#6366f125", color: "#6366f1" }}
            >
              template
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={direction === "LR" ? Position.Right : Position.Bottom}
        style={{ opacity: 0 }}
      />
    </div>
  );
}

export default memo(RouteNodeComponent);
